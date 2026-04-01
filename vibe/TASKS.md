# AI Sales Intelligence & Coaching Platform — Tasks

## Phase 1: Vibe Project Kit (3 tasks)
  [x] Write SPEC.md — full product specification
  [x] Write ARCHITECTURE.md — system design, data flow, DB schema, API endpoints
  [x] Write TASKS.md — this file

## Phase 2: Frontend Scaffold (4 tasks)
  [x] package.json + vite.config.js + tailwind.config.js + postcss.config.js
  [x] index.html + main.jsx + App.jsx with React Router v6 routes
  [x] services/api.js — Axios instance + all API call functions
  [x] hooks/ — useUpload, useAgentProgress (WebSocket), useCallHistory

## Phase 3: Frontend Pages (7 tasks)
  [x] Landing.jsx — animated hero, feature highlights, stats, CTA
  [x] Upload.jsx — drag & drop, progress bar, metadata form
  [x] Processing.jsx — live agent progress cards, WebSocket, estimated time
  [x] Results.jsx — 4 tabs (Overview, Sentiment, Failures, Briefing), sticky action bar
  [x] History.jsx — table with filters, sort, bulk export
  [x] KnowledgeBase.jsx — RAG search UI, transcript excerpts
  [x] Settings.jsx — LLM provider, API keys, SMTP config

## Phase 4: Reusable UI Components (6 tasks)
  [x] Layout.jsx + Navbar.jsx — dark theme, nav links, responsive
  [x] PageTransition.jsx — Framer Motion page enter/exit animations
  [x] AgentProgressCard.jsx — animated card showing agent running status
  [x] SentimentChart.jsx — Recharts line chart with mood shift annotations
  [x] SkeletonLoader.jsx — loading placeholders for async content
  [x] ReportModal.jsx — download PDF / email report dialog

## Phase 5: Backend Foundation (4 tasks)
  [x] requirements.txt + config.py + .env.example
  [x] models/call.py — SQLAlchemy Call + CallAnalysis models
  [x] models/schemas.py — Pydantic request/response schemas
  [x] llm/ — base_provider, mock_provider, openai_provider, ollama_provider, claude_provider

## Phase 6: AI Agents (7 tasks)
  [x] Agent 1 — transcription.py (Whisper API / text passthrough)
  [x] Agent 2 — classifier.py (call type, confidence, metadata extraction)
  [x] Agent 3 — sentiment.py (per-minute scores, mood shifts, engagement)
  [x] Agent 4 — diagnostics.py (failure points, severity, root cause)
  [x] Agent 5 — coach.py (alternative phrasing + RAG examples)
  [x] Agent 6 — briefing.py (pre-call briefing doc)
  [x] Agent 7 — knowledge_rag.py (ChromaDB embed + search)

## Phase 7: Orchestrator + API (4 tasks)
  [x] agents/orchestrator.py — coordinate agents, emit WebSocket events
  [x] api/routes/ — calls, analysis, reports, knowledge, settings
  [x] WebSocket handler — /ws/analysis/{call_id} real-time progress stream
  [x] main.py — FastAPI app, startup, static file serving, CORS

## Phase 8: Services (3 tasks)
  [x] services/pdf_service.py — ReportLab PDF generation (cover + appendix)
  [x] services/email_service.py — aiosmtplib async email with PDF attachment
  [x] services/chroma_service.py — ChromaDB init, indexing, RAG search

## Phase 9: Deployment (2 tasks)
  [x] Dockerfile — multi-stage build (Node for React, Python for backend)
  [x] render.yaml + docker-compose.yml — one-click deploy config

## Phase 10: Presentation (1 task)
  [x] SalesIQ_Platform.pptx — 10-slide deck (dark theme, all agents, arch, demo, next steps)

## Phase 11: Final QA (1 task)
  [x] All Python files pass AST parse check; all 20 JSX files pass brace balance; 68 files total

---
BUILD COMPLETE

Deliverables:
1. frontend/            — React 18 + Vite + Tailwind + Framer Motion SPA (7 pages, 7 UI components)
2. backend/             — FastAPI + 7 AI Agents + WebSocket + PDF + Email + ChromaDB RAG
3. Dockerfile + docker-compose.yml + render.yaml — one-command local + cloud deploy
4. SalesIQ_Platform.pptx — 10-slide presentation deck
5. vibe/                — SPEC, ARCHITECTURE, TASKS documents
