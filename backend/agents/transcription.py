"""
Agent 1 — Transcription Agent
- If audio file: uses OpenAI Whisper API
- If text/PDF: passthrough with light formatting
"""
import os, re
from ..config import settings

SYSTEM = "You are a transcript formatter. Clean up the provided text into a readable, timestamped sales call transcript."

async def run(file_path: str, file_type: str, llm) -> str:
    """Returns a clean transcript string."""

    if file_type == "text":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            raw = f.read()
        # If already looks like a transcript, return as-is
        if len(raw.strip()) > 50:
            return _normalize_transcript(raw)
        return raw

    elif file_type == "audio":
        return await _transcribe_audio(file_path)

    return ""

async def _transcribe_audio(file_path: str) -> str:
    """Call Whisper API for audio transcription."""
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        with open(file_path, "rb") as audio_file:
            result = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )
        # Format segments into timestamped transcript
        lines = []
        for seg in result.segments:
            start = _fmt_time(seg["start"])
            lines.append(f"[{start}] {seg['text'].strip()}")
        return "\n".join(lines)
    except Exception as e:
        # Fallback: return error note
        return f"[Audio transcription failed: {str(e)}]\n[Please provide a text transcript instead.]"

def _fmt_time(seconds: float) -> str:
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m:02d}:{s:02d}"

def _normalize_transcript(text: str) -> str:
    """Basic normalization: remove excessive blank lines."""
    lines = [l.rstrip() for l in text.splitlines()]
    result = []
    blank_count = 0
    for line in lines:
        if line == "":
            blank_count += 1
            if blank_count <= 1:
                result.append(line)
        else:
            blank_count = 0
            result.append(line)
    return "\n".join(result)
