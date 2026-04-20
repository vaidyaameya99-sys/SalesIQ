# ── Stage 1: Build React frontend ─────────────────────────────────────────────
FROM node:20-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
# Force empty VITE_API_URL so all API calls use relative paths (same-origin Docker deploy)
# This overrides any .env.production value or inherited build-time variable
RUN VITE_API_URL="" npm run build
# Output lands in /app/frontend/dist (per vite.config.js outDir)

# ── Stage 2: Python backend ────────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# System deps for chromadb / sentence-transformers / audio
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy the built frontend from stage 1
COPY --from=frontend-build /app/frontend/dist ./backend/static

# Persistent volumes for uploads and vector store
RUN mkdir -p /data/uploads /data/chroma_db

ENV UPLOAD_DIR=/data/uploads
ENV CHROMA_DIR=/data/chroma_db
ENV PORT=8000

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
