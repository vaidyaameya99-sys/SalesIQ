# SalesIQ — AI Sales Intelligence & Coaching Platform

> Upload a sales call → an AI-powered pipeline diagnoses what went wrong → get coached on what to say differently → receive a pre-call briefing before re-engaging the same client.

## Quick Start

### Development

```bash
# 1. Backend
cd backend
cp .env.example .env        # fill in your keys (or keep LLM_PROVIDER=mock for demo)
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000

# 2. Frontend (separate terminal)
cd frontend
npm install
npm run dev                  # runs on http://localhost:5173
```

### Production (Docker)

```bash
docker-compose up --build
# App available at http://localhost:8000
```

### Deploy to Render.com

1. Push to GitHub
2. Go to https://render.com → New → Web Service → connect your repo
3. Render auto-detects `render.yaml` — click Deploy
4. Set secret env vars in the Render dashboard (API keys, SMTP password)

## Pipeline

```
Upload
  └── Transcription Service   (Whisper API / text passthrough — NOT an AI agent)
       └── Classifier Module  (LLM: identifies call type, extracts metadata)
            └── Sentiment Module  (LLM: per-minute emotional arc, mood shifts)
                 └── Diagnostics Module  (LLM: failure points, severity, root cause)
                      └── Coach Module  (LLM: alternative phrasing + why it works)
                           └── Briefing Module  (LLM: pre-call prep document)
                                └── RAG Service  (ChromaDB embed + index — NOT an AI agent)
                                     └── Results Page + PDF Report + Email
```

### What each component truly is

| Component | Type | What it does |
|-----------|------|--------------|
| Transcription | **Service** | Calls Whisper API to convert audio → text. No LLM reasoning. |
| Classifier | **LLM Module** | Sends transcript to LLM, extracts call type + metadata |
| Sentiment | **LLM Module** | Sends transcript to LLM, returns per-minute sentiment scores |
| Diagnostics | **LLM Module** | Sends transcript to LLM, identifies failure points with severity |
| Coach | **LLM Module** | Sends failures to LLM, generates prescriptive coaching responses |
| Briefing | **LLM Module** | Sends full analysis to LLM, generates pre-call briefing doc |
| Knowledge RAG | **Data Tool** | Embeds transcript into ChromaDB for semantic search. No LLM reasoning. |

## LLM Providers

| Provider | Config | Notes |
|----------|--------|-------|
| `mock`   | No key needed | Instant realistic responses — use for demos |
| `openai` | `OPENAI_API_KEY` | GPT-4o — best accuracy |
| `claude` | `ANTHROPIC_API_KEY` | Claude 3.5 Sonnet |
| `ollama` | `OLLAMA_BASE_URL` | Local Llama 3 / Mistral |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with animated hero |
| `/upload` | Drag & drop audio/transcript upload |
| `/processing/:id` | Live pipeline progress (WebSocket) |
| `/results/:id` | Full analysis — 4 tabs + action bar |
| `/history` | All past analyzed calls |
| `/knowledge` | RAG semantic search across all calls |
| `/settings` | LLM, API keys, SMTP config |
