import json
import anthropic
from .base_provider import LLMProvider
from ..config import settings

class ClaudeProvider(LLMProvider):
    def __init__(self):
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model  = settings.anthropic_model

    async def complete(self, prompt: str, system: str = "") -> str:
        kwargs = {"model": self.model, "max_tokens": 2048, "messages": [{"role": "user", "content": prompt}]}
        if system:
            kwargs["system"] = system
        response = await self.client.messages.create(**kwargs)
        return response.content[0].text

    async def complete_json(self, prompt: str, system: str = "", schema_hint: str = "") -> dict:
        sys_msg = (system or "") + "\n\nRespond ONLY with valid JSON. No markdown fences, no commentary."
        kwargs = {
            "model": self.model,
            "max_tokens": 4096,
            "system": sys_msg.strip(),
            "messages": [{"role": "user", "content": prompt}],
        }
        response = await self.client.messages.create(**kwargs)
        raw = response.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())

    def get_info(self) -> dict:
        return {"provider": "claude", "model": self.model}
