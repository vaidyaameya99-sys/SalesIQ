# AI Sales Intelligence & Coaching Platform — SPEC

## One-Liner
An AI-powered platform that ingests recorded sales calls (audio + transcripts), runs them through an analysis pipeline (1 transcription service + 5 LLM modules + 1 RAG retrieval tool), and tells you exactly where deals went wrong, what to say differently, and how to prepare before approaching the same client again.

## Problem Statement
Dan has hundreds of recorded sales calls. Most insights from those calls are never acted on because:
- No one has time to manually review hours of recordings
- There's no system that learns what winning calls look like vs losing ones
- Reps re-approach the same prospects making the same mistakes
- Coaching is based on gut feel, not data from real conversations

## Target Users
- Sales managers who want to coach their teams using real call data
- Sales reps who want to know exactly what they did wrong and how to improve
- Sales leaders preparing reps before re-engaging a prospect

---

## Pages & Features

### 1. Landing Page
- Animated hero section with product headline
- Feature highlights with icons and descriptions
- CTA to get started
- Animated stats (calls analyzed, insights generated)

### 2. Upload Page
- Drag & drop file upload (audio: .mp3, .wav, .m4a / text: .txt, .pdf)
- Upload progress bar with animated states
- Form fields: Rep name, Prospect name, Company, Call date, Call type (optional pre-classify)
- Submit triggers the agent pipeline

### 3. Processing Page — Live Agent Progress
- Step-by-step animated display of each agent running
- Each agent card shows: name, description, status (waiting / running / done)
- Animated progress indicator per agent
- Estimated time remaining
- Cannot navigate away (with warning if tried)

### 4. Results Page — Full Analysis
Tabs:
  - **Overview** — Call summary, classification, verdict, key stats
  - **Sentiment Timeline** — Minute-by-minute chart, mood shifts highlighted
  - **Failure Analysis** — Exact moments that went wrong with timestamps + what to say instead
  - **Pre-Call Briefing** — Full prep sheet for re-engaging the same prospect
- Sticky action bar: Download Report (PDF) | Email Report | Share Link | Save to History

### 5. History Page
- Table of all past analyzed calls
- Filter by: date, rep name, call type, outcome
- Sort by: date, score, outcome
- Click any row → opens Results page for that call
- Bulk export option

### 6. Knowledge Base Page
- Search bar: "How have we handled pricing objections?"
- Returns relevant transcript excerpts from past winning calls
- Filters: call type, outcome, topic
- Each result shows: call context, what was said, outcome of that call

### 7. Settings Page
- LLM provider config (OpenAI / Claude / Ollama)
- API key input
- Email SMTP settings
- Default rep name

---

## Analysis Pipeline Components

### Step 1 — Transcription Service *(not an AI agent — service call)*
- Input: Audio file (.mp3, .wav, .m4a) or plain text
- Process: OpenAI Whisper API → clean transcript
- Output: Timestamped transcript text
- Fallback: If text provided, passthrough with normalization

### Step 2 — Classifier (LLM Module)
- Input: Transcript
- Output: Call type (Cold Outreach / Discovery / Demo / Follow-up / Negotiation / Closing / Win / Lost / Re-engagement), confidence score
- Also extracts: Rep name, Prospect name, Company, estimated duration

### Step 3 — Sentiment & Emotion (LLM Module)
- Input: Transcript with timestamps
- Output: Per-minute sentiment scores, overall arc, key mood shifts with timestamps
- Tags: engagement level (high/medium/low/dropping), emotional triggers

### Step 4 — Diagnostics (LLM Module)
- Input: Transcript + sentiment data
- Output: Array of failure points, each with: timestamp, what happened, severity (critical/major/minor), root cause category

### Step 5 — Sales Coach (LLM Module)
- Input: Failure points + examples from RAG search of past winning calls
- Output: For each failure point — exact alternative phrasing, why it works, examples from past winning calls

### Step 6 — Pre-Call Briefing (LLM Module)
- Input: Full analysis from all previous steps
- Output: Structured briefing doc — prospect triggers, objections to expect, recommended approach, opening lines, questions to ask

### Step 7 — Knowledge RAG Tool *(not an AI agent — data retrieval layer)*
- Input: Natural language query or transcript to index
- Process: Embed text → store/search ChromaDB vector store
- Output: Ranked transcript excerpts with call context metadata

---

## Report Structure (PDF + Email)
1. Cover page — Call details, date, rep, verdict
2. Call Summary & Classification
3. Sentiment Timeline (chart as image)
4. Failure Analysis — each failure point with coaching response
5. Pre-Call Briefing Sheet
6. Appendix — Full transcript

---

## Tech Stack

### Frontend
- React 18 + Vite
- React Router v6 (page navigation)
- Tailwind CSS (styling)
- Framer Motion (animations, page transitions)
- React Query / TanStack Query (data fetching + loading states)
- Recharts (sentiment timeline chart)
- React Dropzone (file upload)
- React Hot Toast (notifications)
- Lucide React (icons)
- jsPDF + html2canvas (PDF report generation)
- Axios (API calls)

### Backend
- Python 3.11
- FastAPI (REST API + WebSocket)
- LangChain (agent orchestration)
- OpenAI Whisper (audio transcription)
- OpenAI GPT-4 / Anthropic Claude (model-agnostic)
- ChromaDB (vector database for RAG)
- sentence-transformers (embeddings)
- ReportLab (server-side PDF)
- aiosmtplib (async email)
- SQLite + SQLAlchemy (call metadata)
- python-dotenv (config)

### Deployment
- Docker (single container: FastAPI serves React build + API + ChromaDB)
- Render.com (single service, single URL)
- render.yaml (one-click deploy config)

---

## Non-Goals (POC scope)
- No user authentication / multi-tenancy
- No real-time call recording integration
- No CRM sync (Salesforce, HubSpot)
- No mobile app

## Success Criteria
- Upload an audio file or transcript → get full analysis within 60 seconds (mock LLM)
- All 7 agents visible and running on Processing page
- PDF report downloadable and emailable
- Deployable to Render with one command
