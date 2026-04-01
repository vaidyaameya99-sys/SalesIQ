"""
SalesIQ — AI Sales Intelligence Platform
FastAPI application entry point.

Serves:
  - /api/* → REST API routes
  - /ws/*   → WebSocket (real-time agent progress)
  - /*      → React SPA (static build)
"""
import os
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from .api.database import init_db
from .api.websocket import ws_analysis
from .api.routes.calls          import router as calls_router
from .api.routes.analysis       import router as analysis_router
from .api.routes.reports        import router as reports_router
from .api.routes.knowledge      import router as knowledge_router
from .api.routes.settings_route import router as settings_router
from .config import settings

app = FastAPI(
    title       = "SalesIQ API",
    description = "AI Sales Intelligence & Coaching Platform",
    version     = "1.0.0",
    docs_url    = "/api/docs",
    redoc_url   = "/api/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins     = settings.cors_origins,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    await init_db()
    print("✓ Database initialized")
    print(f"✓ LLM Provider: {settings.llm_provider}")
    print(f"✓ Upload dir: {settings.upload_dir}")

# ── API Routes ────────────────────────────────────────────────────────────────
app.include_router(calls_router,    prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(reports_router,  prefix="/api")
app.include_router(knowledge_router,prefix="/api")
app.include_router(settings_router, prefix="/api")

# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws/analysis/{call_id}")
async def analysis_ws(websocket: WebSocket, call_id: str):
    await ws_analysis(websocket, call_id)

# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "ok", "llm_provider": settings.llm_provider}

# ── Serve React SPA ──────────────────────────────────────────────────────────
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """Catch-all: serve index.html for React Router."""
        index = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index):
            return FileResponse(index)
        return {"error": "Frontend build not found. Run: cd frontend && npm run build"}
