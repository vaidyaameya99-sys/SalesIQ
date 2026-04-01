from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

# ── Upload ────────────────────────────────────────────────────────────────────
class UploadResponse(BaseModel):
    call_id: str
    message: str

# ── Call ─────────────────────────────────────────────────────────────────────
class CallBase(BaseModel):
    rep_name:       Optional[str] = None
    prospect_name:  Optional[str] = None
    company:        Optional[str] = None
    call_date:      Optional[str] = None
    call_type:      Optional[str] = None

class CallResponse(CallBase):
    id:          str
    status:      str
    file_type:   Optional[str] = None
    created_at:  Optional[datetime] = None
    analysis:    Optional["AnalysisSummary"] = None

    class Config:
        from_attributes = True

class AnalysisSummary(BaseModel):
    overall_score:  Optional[float] = None
    verdict:        Optional[str]   = None
    classification: Optional[dict]  = None

    class Config:
        from_attributes = True

class CallListResponse(BaseModel):
    calls: List[CallResponse]
    total: int

# ── Analysis ─────────────────────────────────────────────────────────────────
class AnalysisResponse(BaseModel):
    call:     CallResponse
    analysis: Optional["FullAnalysis"] = None

class FullAnalysis(BaseModel):
    id:                 str
    call_id:            str
    transcript:         Optional[str]   = None
    classification:     Optional[dict]  = None
    sentiment_data:     Optional[dict]  = None
    failure_points:     Optional[list]  = None
    coaching_responses: Optional[list]  = None
    pre_call_briefing:  Optional[dict]  = None
    overall_score:      Optional[float] = None
    verdict:            Optional[str]   = None

    class Config:
        from_attributes = True

# ── Report ────────────────────────────────────────────────────────────────────
class EmailReportRequest(BaseModel):
    call_id: str
    email:   str

class EmailReportResponse(BaseModel):
    success: bool
    message: str

# ── Knowledge ────────────────────────────────────────────────────────────────
class KnowledgeSearchResult(BaseModel):
    excerpt:           str
    call_type:         Optional[str]   = None
    call_outcome:      Optional[str]   = None
    rep_name:          Optional[str]   = None
    company:           Optional[str]   = None
    timestamp:         Optional[str]   = None
    relevance_score:   Optional[float] = None
    insight:           Optional[str]   = None

class KnowledgeSearchResponse(BaseModel):
    results: List[KnowledgeSearchResult]
    query:   str

# ── Settings ──────────────────────────────────────────────────────────────────
class AppSettings(BaseModel):
    llm_provider:       Optional[str] = "mock"
    openai_api_key:     Optional[str] = ""
    anthropic_api_key:  Optional[str] = ""
    ollama_base_url:    Optional[str] = "http://localhost:11434"
    smtp_host:          Optional[str] = ""
    smtp_port:          Optional[int] = 587
    smtp_username:      Optional[str] = ""
    smtp_password:      Optional[str] = ""
    smtp_from_name:     Optional[str] = "SalesIQ Reports"
    default_rep_name:   Optional[str] = ""

class SettingsResponse(BaseModel):
    settings: AppSettings

# ── WebSocket ─────────────────────────────────────────────────────────────────
class AgentEvent(BaseModel):
    type:       str  # agent_update | complete | error
    agent:      Optional[str]  = None
    status:     Optional[str]  = None  # waiting | running | done | error
    progress:   Optional[int]  = None
    message:    Optional[str]  = None
    call_id:    Optional[str]  = None
