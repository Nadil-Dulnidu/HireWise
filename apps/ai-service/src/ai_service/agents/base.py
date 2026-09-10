from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Type, TypeVar
from pydantic import BaseModel
from langchain_core.messages import SystemMessage, HumanMessage

from ai_service.core.logging import logger
from ai_service.core.sanitizer import sanitize_text, detect_prompt_injection, is_tool_allowed
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
            self.logger.warning(f"[SECURITY] Agent '{self.name}' attempted unauthorized access to tool '{tool_name}'.")
        return allowed

    async def invoke_structured_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        agent_key: Optional[str] = None
    ) -> T:
        """
        Invokes the structured LLM with Gemini / Vertex AI and validates output against self.schema.
        Sanitizes user input and logs security warnings if injection patterns are detected.
        Loads dynamic system prompts, model overrides, and temperature from PostgreSQL if configured.
        """
        active_system_prompt = system_prompt
        model_override: Optional[str] = None
        temp: float = 0.1
        max_toks: Optional[int] = None

        if agent_key:
            try:
                from ai_service.db.agent_config_repo import agent_config_repo
                db_cfg = await agent_config_repo.get_config(agent_key)
                if db_cfg and db_cfg.get("IsActive", True):
                    if db_cfg.get("SystemPrompt"):
                        active_system_prompt = db_cfg["SystemPrompt"]
                    if db_cfg.get("Model"):
                        model_override = db_cfg["Model"]
                    if db_cfg.get("Temperature") is not None:
                        temp = float(db_cfg["Temperature"])
                    if db_cfg.get("MaxTokens"):
                        max_toks = int(db_cfg["MaxTokens"])
                    self.logger.info(f"[{self.name}] Applied dynamic DB config for '{agent_key}': model={model_override}, temp={temp}")
            except Exception as e:
                self.logger.warning(f"[{self.name}] Could not retrieve dynamic DB config: {e}. Falling back to default.")

        # Security scan and sanitization
        is_injection, reason = detect_prompt_injection(user_prompt)
        if is_injection:
            self.logger.warning(f"[SECURITY ALERT] Prompt injection heuristic flagged in '{self.name}': {reason}")

        cleaned_user_prompt = sanitize_text(user_prompt)

        self.logger.info(f"[{self.name}] Invoking structured LLM for schema: {self.schema.__name__}")
        llm = get_structured_llm(self.schema, model=model_override, temperature=temp, max_tokens=max_toks)
        messages = [
            SystemMessage(content=active_system_prompt),
            HumanMessage(content=cleaned_user_prompt)
        ]
        
        result: T = await llm.ainvoke(messages)
        return result

