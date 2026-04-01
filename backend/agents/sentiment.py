"""
Agent 3 — Sentiment & Emotion Agent
Produces per-minute sentiment scores, engagement level, and mood shift annotations.
"""

SYSTEM = """You are an expert at emotional intelligence analysis in sales conversations.
Analyze the transcript segment by segment and return structured JSON sentiment data."""

PROMPT_TEMPLATE = """Analyze this sales call transcript for sentiment and emotional dynamics.

Return a JSON object with this structure:
{{
  "timeline": [
    {{"minute": 1, "positive": 0.0-1.0, "negative": 0.0-1.0, "neutral": 0.0-1.0}},
    ... one entry per minute of the call
  ],
  "mood_shifts": [
    {{"minute": <int>, "description": "<what changed and why>"}},
    ...
  ],
  "engagement_level": "<High|Medium|Low|Dropping>",
  "emotional_triggers": ["<word or phrase that caused reaction>", ...],
  "prospect_final_sentiment": "<Positive|Neutral|Negative|Skeptical>",
  "rep_energy_level": "<High|Medium|Low>"
}}

Rules:
- positive + negative + neutral must sum to approximately 1.0 for each minute
- mood_shifts should only include SIGNIFICANT changes (delta > 0.2 in negative)
- Base timeline granularity on transcript length (1 entry per ~2 minutes for short calls)

Transcript:
{transcript}

Estimated duration: {duration} minutes"""

async def run(transcript: str, classification: dict, llm) -> dict:
    duration = classification.get("duration_minutes", 20)
    prompt = PROMPT_TEMPLATE.format(
        transcript=transcript[:8000],
        duration=duration,
    )
    result = await llm.complete_json(prompt, system=SYSTEM)
    return result
