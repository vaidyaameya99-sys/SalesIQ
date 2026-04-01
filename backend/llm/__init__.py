from .base_provider import LLMProvider
from .mock_provider import MockProvider
from .openai_provider import OpenAIProvider
from .ollama_provider import OllamaProvider
from ..config import settings

def get_llm_provider() -> LLMProvider:
    provider = settings.llm_provider.lower()
    if provider == "openai":
        return OpenAIProvider()
    elif provider == "ollama":
        return OllamaProvider()
    elif provider == "claude":
        from .claude_provider import ClaudeProvider
        return ClaudeProvider()
    else:
        return MockProvider()
