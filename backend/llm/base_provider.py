from abc import ABC, abstractmethod
from typing import Any

class LLMProvider(ABC):
    """Abstract base for all LLM providers."""

    @abstractmethod
    async def complete(self, prompt: str, system: str = "") -> str:
        """Return a plain-text completion."""

    @abstractmethod
    async def complete_json(self, prompt: str, system: str = "", schema_hint: str = "") -> dict:
        """Return a JSON-parsed dict. Must return valid JSON."""

    @abstractmethod
    def get_info(self) -> dict:
        """Return provider name and model."""
