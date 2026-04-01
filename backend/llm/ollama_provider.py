import json, httpx
from .base_provider import LLMProvider
from ..config import settings

class OllamaProvider(LLMProvider):
    def __init__(self):
        self.base_url = settings.ollama_base_url
        self.model    = settings.ollama_model

    async def complete(self, prompt: str, system: str = "") -> str:
        payload = {
            "model": self.model,
            "prompt": f"{system}\n\n{prompt}" if system else prompt,
            "stream": False,
        }
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(f"{self.base_url}/api/generate", json=payload)
            r.raise_for_status()
            return r.json().get("response", "")

    async def complete_json(self, prompt: str, system: str = "", schema_hint: str = "") -> dict:
        full_prompt = f"{system}\n\nRespond ONLY with valid JSON.\n\n{prompt}" if system else f"Respond ONLY with valid JSON.\n\n{prompt}"
        raw = await self.complete(full_prompt)
        # Strip markdown fences if present
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())

    def get_info(self) -> dict:
        return {"provider": "ollama", "model": self.model}
