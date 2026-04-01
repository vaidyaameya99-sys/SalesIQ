"""
Agent 6 — Pre-Call Briefing Agent
Synthesizes all prior analysis into a structured prep document for re-engaging the same prospect.
"""

SYSTEM = """You are a strategic sales advisor. Based on a comprehensive analysis of a past sales call,
you create actionable pre-call briefing documents that prepare reps to succeed on the next attempt.
Always return valid JSON."""

PROMPT_TEMPLATE = """Create a pre-call briefing document for a rep who is about to re-engage this prospect.
The goal is to help them succeed on the next call by learning from what went wrong.

Return a JSON object with this structure:
{{
  "recommended_approach": "<1-2 paragraph strategic recommendation for how to approach this prospect differently>",
  "prospect_triggers": [
    "<specific thing that motivates or engages this prospect>",
    ...  (3-5 items)
  ],
  "objections_to_expect": [
    {{
      "objection": "<specific objection they raised or are likely to raise>",
      "suggested_response": "<exact response the rep should give>"
    }},
    ...  (2-4 items)
  ],
  "opening_lines": [
    "<option 1 — a strong opening line that acknowledges the past call>",
    "<option 2 — alternative opener>",
    ...  (2-3 options)
  ],
  "questions_to_ask": [
    "<discovery/qualifying question to ask>",
    ...  (3-5 questions)
  ],
  "topics_to_avoid": ["<topic that created resistance>", ...],
  "key_intel": "<1-2 sentences of the most important insight from the past call to keep front of mind>"
}}

Call summary: {summary}
Call type: {call_type}
Verdict: {verdict}
Score: {score}/100

Prospect triggers from sentiment analysis: {emotional_triggers}
Prospect final sentiment: {prospect_sentiment}

Key failure points:
{failures_summary}

Coaching responses:
{coaching_summary}"""

import json

async def run(
    classification: dict,
    sentiment_data: dict,
    failure_points: list,
    coaching_responses: list,
    overall_score: float,
    verdict: str,
    llm
) -> dict:
    failures_summary = "\n".join([
        f"- [{fp.get('severity','?')}] {fp.get('what_happened','')}"
        for fp in (failure_points or [])
    ]) or "No critical failures identified."

    coaching_summary = "\n".join([
        f"- {cr.get('alternative_phrasing','')[:100]}..."
        for cr in (coaching_responses or [])
    ]) or "No coaching responses available."

    prompt = PROMPT_TEMPLATE.format(
        summary=classification.get("summary", "No summary."),
        call_type=classification.get("call_type", "Unknown"),
        verdict=verdict,
        score=round(overall_score),
        emotional_triggers=", ".join(sentiment_data.get("emotional_triggers", [])),
        prospect_sentiment=sentiment_data.get("prospect_final_sentiment", "Unknown"),
        failures_summary=failures_summary,
        coaching_summary=coaching_summary,
    )
    return await llm.complete_json(prompt, system=SYSTEM)
