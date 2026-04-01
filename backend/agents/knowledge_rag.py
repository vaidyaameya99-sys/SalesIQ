"""
Agent 7 — Knowledge RAG Agent
- Indexes analyzed transcripts into ChromaDB
- Provides semantic search across all past calls
"""
from ..services.chroma_service import get_chroma_collection
import uuid, re

CHUNK_SIZE  = 400   # words per chunk
CHUNK_STEP  = 200   # words overlap

def _chunk_transcript(transcript: str, call_id: str) -> list[dict]:
    """Split transcript into overlapping word-based chunks for embedding."""
    words = transcript.split()
    chunks = []
    for i in range(0, len(words), CHUNK_STEP):
        chunk_words = words[i:i + CHUNK_SIZE]
        if len(chunk_words) < 20:   # skip tiny tail chunks
            continue
        # Estimate minute from position
        total_words  = len(words)
        approx_min   = int((i / total_words) * 30) + 1  # assumes ~30-min call
        chunks.append({
            "id":        f"{call_id}_{i}",
            "text":      " ".join(chunk_words),
            "timestamp": f"~{approx_min}m",
        })
    return chunks

async def index_call(call_id: str, transcript: str, metadata: dict):
    """Embed and store transcript chunks in ChromaDB."""
    try:
        collection = await get_chroma_collection()
        chunks     = _chunk_transcript(transcript, call_id)
        if not chunks:
            return

        await collection.add(
            ids=[c["id"] for c in chunks],
            documents=[c["text"] for c in chunks],
            metadatas=[{
                "call_id":      call_id,
                "call_type":    metadata.get("call_type", ""),
                "call_outcome": metadata.get("verdict", ""),
                "rep_name":     metadata.get("rep_name", ""),
                "company":      metadata.get("company", ""),
                "timestamp":    c["timestamp"],
            } for c in chunks],
        )
    except Exception as e:
        # Non-fatal — indexing failure shouldn't crash the pipeline
        print(f"[RAG] Indexing error for call {call_id}: {e}")

async def search(query: str, n_results: int = 8, filters: dict = None) -> list[dict]:
    """Semantic search across all indexed calls."""
    try:
        collection = await get_chroma_collection()
        where = {}
        if filters:
            if filters.get("call_type"):
                where["call_type"] = filters["call_type"]
            if filters.get("outcome"):
                where["call_outcome"] = filters["outcome"]

        kwargs = {
            "query_texts": [query],
            "n_results":   n_results,
            "include":     ["documents", "metadatas", "distances"],
        }
        if where:
            kwargs["where"] = where

        results = await collection.query(**kwargs)

        output = []
        if results and results.get("documents"):
            docs      = results["documents"][0]
            metas     = results["metadatas"][0]
            distances = results["distances"][0]
            for doc, meta, dist in zip(docs, metas, distances):
                output.append({
                    "excerpt":         doc[:500],
                    "call_type":       meta.get("call_type"),
                    "call_outcome":    meta.get("call_outcome"),
                    "rep_name":        meta.get("rep_name"),
                    "company":         meta.get("company"),
                    "timestamp":       meta.get("timestamp"),
                    "relevance_score": round(1 - dist, 3),   # cosine → similarity
                })
        return sorted(output, key=lambda x: x["relevance_score"], reverse=True)
    except Exception as e:
        print(f"[RAG] Search error: {e}")
        return []
