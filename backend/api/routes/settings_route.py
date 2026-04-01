import json, os
from fastapi import APIRouter
from ...models.schemas import AppSettings, SettingsResponse
from ...config import settings as app_settings

router = APIRouter(prefix="/settings", tags=["Settings"])

SETTINGS_FILE = "user_settings.json"

def _load_settings() -> dict:
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE) as f:
            return json.load(f)
    return {}

def _save_settings(data: dict):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f, indent=2)

@router.get("", response_model=SettingsResponse)
async def get_settings():
    stored = _load_settings()
    return {"settings": AppSettings(
        llm_provider       = stored.get("llm_provider",     app_settings.llm_provider),
        openai_api_key     = stored.get("openai_api_key",   ""),
        anthropic_api_key  = stored.get("anthropic_api_key",""),
        ollama_base_url    = stored.get("ollama_base_url",  app_settings.ollama_base_url),
        smtp_host          = stored.get("smtp_host",        app_settings.smtp_host),
        smtp_port          = stored.get("smtp_port",        app_settings.smtp_port),
        smtp_username      = stored.get("smtp_username",    ""),
        smtp_password      = stored.get("smtp_password",    ""),
        smtp_from_name     = stored.get("smtp_from_name",   app_settings.smtp_from_name),
        default_rep_name   = stored.get("default_rep_name", app_settings.default_rep_name),
    )}

@router.put("", response_model=SettingsResponse)
async def update_settings(data: AppSettings):
    stored = _load_settings()
    stored.update(data.model_dump(exclude_none=True))
    _save_settings(stored)

    # Patch live settings
    for key, val in stored.items():
        if hasattr(app_settings, key) and val is not None:
            object.__setattr__(app_settings, key, val)

    return {"settings": data}
