"""
Agent 4 — Diagnostics Agent
Identifies specific failure points in the sales call with exact timestamps,
severity ratings, and root cause categorization.
"""

SYSTEM = """You are a master sales diagnostician. Your role is to identify the precise moments where a sales call went wrong.
Be specific, direct, and actionable. Always return valid JSON."""

PROMPT_TEMPLATE = """Analyze this sales call for failure points. Identify every moment where the rep made a mistake,
missed an opportunity, or where the conversation went off track.

Return a JSON object with this structure:
{{
  "failure_points": [
    {{
      "timestamp": "<MM:SS or approximate time marker>",
      "what_happened": "<precise description of the failure — what the rep did wrong>",
      "severity": "<critical|major|minor>",
      "root_cause_category": "<one of: Premature pricing disclosure|Weak objection handling|Premature close attempt|Lack of discovery|Poor active listening|Talking too much|Weak value articulation|Failed to create urgency|Missed buying signal|Poor rapport building|Other>",
      "transcript_excerpt": "<exact or near-exact quote from the transcript showing the failure — max 30 words>"
    }},
    ...
  ],
  "overall_score": <0-100 integer, where 100 is a perfect call>,
  "verdict": "<Strong|Neutral|Weak|Lost>"
}}

Severity guide:
- critical: deal-breaking mistake, likely caused or will cause the deal to die
- major: significant mistake that damaged momentum or created avoidable resistance
- minor: missed opportunity or small error that reduced effectiveness

Transcript:
{transcript}

Sentiment context:
- Engagement level: {engagement_level}
- Mood shifts at: {mood_shift_minutes}
- Prospect final sentiment: {prospect_sentiment}"""

async def run(transcript: str, sentiment_data: dict, llm) -> dict:
    mood_shifts = sentiment_data.get("mood_shifts", [])
    mood_shift_minutes = ", ".join([str(s.get("minute", "?")) for s in mood_shifts]) or "none detected"

    prompt = PROMPT_TEMPLATE.format(
        transcript=transcript[:8000],
        engagement_level=sentiment_data.get("engagement_level", "Unknown"),
        mood_shift_minutes=mood_shift_minutes,
        prospect_sentiment=sentiment_data.get("prospect_final_sentiment", "Unknown"),
    )
    result = await llm.complete_json(prompt, system=SYSTEM)
    return result
