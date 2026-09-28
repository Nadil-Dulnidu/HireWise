from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Type, TypeVar
from pydantic import BaseModel
from langchain_core.messages import SystemMessage, HumanMessage

from ai_service.core.logging import logger
from ai_service.core.sanitizer import (
    sanitize_text,
    detect_prompt_injection,
    is_tool_allowed,
)
from ai_service.llm.client import get_structured_llm

T = TypeVar("T", bound=BaseModel)


class BaseAgent(ABC):
    """
    Abstract base class for all HireWise specialized AI agents.
    Provides structured LLM invocation, fallback handling, input sanitization, and standardized execution lifecycle.
    """

    def __init__(self, name: str, schema: Type[T]):
        self.name = name
        self.schema = schema
        self.logger = logger

    @abstractmethod
    async def execute(self, **kwargs) -> T:
        """
        Execute the agent logic given domain inputs and return structured Pydantic output.
        """
        pass

    def verify_tool_access(self, tool_name: str) -> bool:
        """
        Checks if this agent is authorized to use a given tool.
        """
        allowed = is_tool_allowed(self.name, tool_name)
        if not allowed:
            self.logger.warning(
                f"[SECURITY] Agent '{self.name}' attempted unauthorized access to tool '{tool_name}'."
            )
        return allowed

    async def invoke_structured_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: Optional[int] = None,
    ) -> T:
        """
        Invokes the structured LLM with Gemini / Vertex AI and validates output against self.schema.
        Sanitizes user input and logs security warnings if injection patterns are detected.
        Model is configured via .env, while temperature and token limits are specified per-agent.
        """
        # Security scan and sanitization
        is_injection, reason = detect_prompt_injection(user_prompt)
        if is_injection:
            self.logger.warning(
                f"[SECURITY ALERT] Prompt injection heuristic flagged in '{self.name}': {reason}"
            )

        cleaned_user_prompt = sanitize_text(user_prompt)

        self.logger.info(
            f"[{self.name}] Invoking structured LLM for schema: {self.schema.__name__}"
        )
        llm = get_structured_llm(
            self.schema,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=cleaned_user_prompt),
        ]

        result: T = await llm.ainvoke(messages)
        return result
