import json
from openai import AsyncOpenAI
from .base_provider import LLMProvider
from ..config import settings

class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model  = settings.openai_model

    async def complete(self, prompt: str, system: str = "") -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.3,
        )
        return response.choices[0].message.content

    async def complete_json(self, prompt: str, system: str = "", schema_hint: str = "") -> dict:
        full_system = (system or "") + "\n\nRespond ONLY with valid JSON. No markdown, no explanation."
        messages = [
            {"role": "system", "content": full_system.strip()},
            {"role": "user",   "content": prompt},
        ]
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        return json.loads(raw)

    def get_info(self) -> dict:
        return {"provider": "openai", "model": self.model}
