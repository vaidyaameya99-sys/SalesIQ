# AI Sales Intelligence & Coaching Platform — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Single Docker Container                       │
│                        (Render.com — one URL)                        │
│                                                                     │
│  ┌──────────────────────┐        ┌──────────────────────────────┐   │
│  │   React 18 + Vite    │        │       FastAPI Backend         │   │
│  │   (Static Build)     │◄──────►│  - REST API (/api/*)          │   │
│  │                      │  HTTP  │  - WebSocket (/ws/*)          │   │
│  │  Pages:              │  WS    │  - Static File Serving        │   │
│  │  - Landing           │        │                              │   │
│  │  - Upload            │        └──────────────────────────────┘   │
│  │  - Processing        │                      │                    │
│  │  - Results           │                      ▼                    │
│  │  - History           │        ┌──────────────────────────────┐   │
│  │  - Knowledge Base    │        │      Agent Orchestrator       │   │
│  │  - Settings          │        │  (coordinates all 7 agents)   │   │
│  └──────────────────────┘        └──────────────────────────────┘   │
│                                               │                     │
│                          ┌────────────────────┼────────────────┐    │
│                          ▼                    ▼                ▼    │
│              ┌──────────────────┐  ┌──────────────┐  ┌────────────┐│
│              │   LLM Layer      │  │  ChromaDB    │  │  SQLite    ││
│              │ (OpenAI/Claude/  │  │  (RAG store) │  │ (metadata) ││
│              │  Ollama/Mock)    │  └──────────────┘  └────────────┘│
│              └──────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
ai-sales-agent/
├── vibe/
│   ├── SPEC.md
│   ├── ARCHITECTURE.md          ← this file
│   └── TASKS.md
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── assets/
│       │   └── icons/
│       ├── hooks/
│       │   ├── useUpload.js
│       │   ├── useAgentProgress.js   ← WebSocket hook
│       │   └── useCallHistory.js
│       ├── services/
│       │   └── api.js                ← Axios instance + all API calls
│       ├── components/
│       │   └── ui/
│       │       ├── Navbar.jsx
│       │       ├── Layout.jsx
│       │       ├── AgentProgressCard.jsx
│       │       ├── SentimentChart.jsx
│       │       ├── SkeletonLoader.jsx
│       │       ├── ReportModal.jsx
│       │       └── PageTransition.jsx
│       └── pages/
│           ├── Landing.jsx
│           ├── Upload.jsx
│           ├── Processing.jsx
│           ├── Results.jsx
│           ├── History.jsx
│           ├── KnowledgeBase.jsx
│           └── Settings.jsx
│
├── backend/
│   ├── main.py                   ← FastAPI app entry point
│   ├── config.py                 ← Env vars, LLM_PROVIDER, settings
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/
│   │   ├── call.py               ← Call, CallAnalysis SQLAlchemy models
│   │   └── schemas.py            ← Pydantic request/response schemas
│   ├── llm/
│   │   ├── base_provider.py
│   │   ├── mock_provider.py
│   │   ├── openai_provider.py
│   │   └── ollama_provider.py
│   ├── agents/
│   │   ├── orchestrator.py       ← Central coordinator, emits WS events
│   │   ├── transcription.py      ← Agent 1: Whisper / passthrough
│   │   ├── classifier.py         ← Agent 2: Call type + metadata
│   │   ├── sentiment.py          ← Agent 3: Per-minute sentiment
│   │   ├── diagnostics.py        ← Agent 4: Failure point detection
│   │   ├── coach.py              ← Agent 5: Coaching responses
│   │   ├── briefing.py           ← Agent 6: Pre-call briefing doc
│   │   └── knowledge_rag.py      ← Agent 7: ChromaDB RAG retrieval
│   ├── services/
│   │   ├── pdf_service.py        ← ReportLab PDF generation
│   │   ├── email_service.py      ← aiosmtplib async email
│   │   └── chroma_service.py     ← ChromaDB init + indexing
│   └── api/
│       └── routes/
│           ├── calls.py          ← POST /upload, GET /calls, GET /calls/{id}
│           ├── analysis.py       ← GET /analysis/{call_id}
│           ├── reports.py        ← GET /report/pdf/{id}, POST /report/email
│           ├── knowledge.py      ← GET /knowledge/search
│           └── settings.py       ← GET/PUT /settings
│
├── Dockerfile
├── docker-compose.yml
└── render.yaml
```

---

## Data Flow

### Upload → Analysis Pipeline

```
User uploads file + metadata
        │
        ▼
POST /api/calls/upload
        │
        ▼
Agent Orchestrator.run(call_id)
        │
        ├──▶ [WS] emit: { agent: "transcription", status: "running" }
        │         Agent 1 — Transcription
        │         (Whisper API if audio / passthrough if text)
        │         Output: timestamped transcript
        │
        ├──▶ [WS] emit: { agent: "classifier", status: "running" }
        │         Agent 2 — Call Classifier
        │         Output: call type, confidence, extracted metadata
        │
        ├──▶ [WS] emit: { agent: "sentiment", status: "running" }
        │         Agent 3 — Sentiment & Emotion
        │         Output: per-minute scores, mood shifts, engagement level
        │
        ├──▶ [WS] emit: { agent: "diagnostics", status: "running" }
        │         Agent 4 — Diagnostics
        │         Input: transcript + sentiment
        │         Output: array of failure points [{ timestamp, severity, root_cause }]
        │
        ├──▶ [WS] emit: { agent: "coach", status: "running" }
        │         Agent 5 — Sales Coach
        │         Input: failure points + RAG results
        │         Output: for each failure → alternative phrasing + examples
        │
        ├──▶ [WS] emit: { agent: "briefing", status: "running" }
        │         Agent 6 — Pre-Call Briefing
        │         Input: full analysis from agents 1–5
        │         Output: structured briefing doc
        │
        ├──▶ [WS] emit: { agent: "knowledge_rag", status: "running" }
        │         Agent 7 — Index transcript into ChromaDB
        │         Output: vectors stored for future RAG queries
        │
        └──▶ [WS] emit: { status: "complete", call_id: "..." }
```

### WebSocket Protocol

```
Client connects: WS /ws/analysis/{call_id}

Server emits (JSON):
{
  "type": "agent_update",
  "agent": "sentiment",           // agent name
  "status": "running",            // waiting | running | done | error
  "progress": 45,                 // 0–100
  "message": "Analyzing emotion arc...",
  "timestamp": "2024-01-15T10:30:00Z"
}

Final event:
{
  "type": "complete",
  "call_id": "abc123",
  "redirect": "/results/abc123"
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/calls/upload | Upload audio/transcript + metadata |
| GET | /api/calls | List all calls (with filters) |
| GET | /api/calls/{id} | Get single call details |
| DELETE | /api/calls/{id} | Delete a call record |
| GET | /api/analysis/{call_id} | Get full analysis result |
| GET | /api/report/pdf/{call_id} | Stream PDF download |
| POST | /api/report/email | Send report via email |
| GET | /api/knowledge/search?q= | RAG knowledge search |
| GET | /api/settings | Get current settings |
| PUT | /api/settings | Update settings |
| WS | /ws/analysis/{call_id} | Real-time agent progress stream |

---

## Frontend State & Navigation

```
/ (Landing)
    └──► /upload
              └──► /processing/:callId  [cannot navigate away]
                        └──► /results/:callId
/history
    └──► /results/:callId
/knowledge
/settings
```

### State Management
- **React Query (TanStack Query)**: All server data (call list, analysis results, settings)
- **Local state (useState/useReducer)**: Upload form, UI state
- **WebSocket hook**: Real-time agent progress during processing
- **React Router v6**: Page navigation with Framer Motion page transitions

---

## LLM Provider Abstraction

```python
LLMProvider (abstract)
├── complete(prompt: str) → str
├── complete_json(prompt: str, schema: dict) → dict
└── get_info() → dict

Implementations:
├── MockProvider      — instant responses, no API key needed
├── OpenAIProvider    — GPT-4o via OpenAI API
├── ClaudeProvider    — Claude 3.5 Sonnet via Anthropic API
└── OllamaProvider    — local Llama 3 / Mistral via Ollama
```

---

## Database Schema

### `calls` table (SQLite)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| rep_name | TEXT | Sales rep name |
| prospect_name | TEXT | Prospect name |
| company | TEXT | Company name |
| call_date | DATETIME | Call date |
| call_type | TEXT | Detected call classification |
| duration_minutes | FLOAT | Estimated duration |
| file_path | TEXT | Stored file path |
| status | TEXT | pending/processing/complete/error |
| created_at | DATETIME | Upload timestamp |

### `call_analyses` table (SQLite)
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| call_id | UUID | FK → calls.id |
| transcript | TEXT | Full transcript |
| classification | JSON | Agent 2 output |
| sentiment_data | JSON | Agent 3 output |
| failure_points | JSON | Agent 4 output |
| coaching_responses | JSON | Agent 5 output |
| pre_call_briefing | JSON | Agent 6 output |
| overall_score | FLOAT | 0–100 quality score |
| verdict | TEXT | Strong/Weak/Neutral/Lost |

---

## Report Structure

```
PDF Report
├── Page 1 — Cover (call details, date, rep name, verdict badge)
├── Page 2 — Call Summary & Classification
├── Page 3 — Sentiment Timeline (chart as PNG image)
├── Pages 4-N — Failure Analysis (each failure + coaching response)
├── Page N+1 — Pre-Call Briefing Sheet
└── Appendix — Full Transcript
```

---

## Deployment

```
Dockerfile
├── Stage 1: Node — build React app (npm run build)
└── Stage 2: Python — FastAPI + static files + ChromaDB

render.yaml
└── Single web service
    ├── BUILD: docker build .
    ├── START: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
    └── ENV: LLM_PROVIDER, OPENAI_API_KEY, SMTP_*, etc.
```

Single URL serves everything:
- `yourdomain.onrender.com/` → React SPA
- `yourdomain.onrender.com/api/*` → FastAPI routes
- `yourdomain.onrender.com/ws/*` → WebSocket
