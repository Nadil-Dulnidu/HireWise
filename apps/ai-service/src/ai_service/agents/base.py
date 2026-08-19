from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Type, TypeVar
from pydantic import BaseModel
from langchain_core.messages import SystemMessage, HumanMessage

from ai_service.core.logging import logger
from ai_service.llm.client import get_structured_llm

T = TypeVar("T", bound=BaseModel)

class BaseAgent(ABC):
    """
    Abstract base class for all HireWise specialized AI agents.
    Provides structured LLM invocation, fallback handling, and standardized execution lifecycle.
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

    async def invoke_structured_llm(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> T:
        """
        Invokes the structured LLM with Gemini / Vertex AI and validates output against self.schema.
        """
        self.logger.info(f"[{self.name}] Invoking structured LLM for schema: {self.schema.__name__}")
        llm = get_structured_llm(self.schema)
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        result: T = await llm.ainvoke(messages)
        return result
