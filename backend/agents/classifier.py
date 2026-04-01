"""
Agent 2 — Call Classifier Agent
Determines call type, extracts metadata, and writes a call summary.
"""

SYSTEM = """You are an expert sales call analyst. Your job is to classify sales calls and extract structured metadata.
Always respond with valid JSON only."""

PROMPT_TEMPLATE = """Analyze this sales call transcript and return a JSON object with the following structure:
{{
  "call_type": "<Cold Outreach|Discovery|Demo|Follow-up|Negotiation|Closing|Re-engagement|Lost|Win|Other>",
  "confidence": <0.0–1.0>,
  "summary": "<2-3 sentence summary of what happened in the call>",
  "rep_name": "<extracted rep name or null>",
  "prospect_name": "<extracted prospect name or null>",
  "company": "<extracted company name or null>",
  "duration_minutes": <estimated duration as float>,
  "key_topics": ["<topic1>", "<topic2>", "..."],
  "overall_outcome": "<Positive|Neutral|Negative|Unknown>"
}}

Transcript:
{transcript}

Hints provided by user (use if available, otherwise extract from transcript):
Rep name: {rep_name}
Prospect name: {prospect_name}
Company: {company}
Call type hint: {call_type_hint}"""

async def run(transcript: str, metadata: dict, llm) -> dict:
    prompt = PROMPT_TEMPLATE.format(
        transcript=transcript[:6000],
        rep_name=metadata.get("rep_name") or "unknown",
        prospect_name=metadata.get("prospect_name") or "unknown",
        company=metadata.get("company") or "unknown",
        call_type_hint=metadata.get("call_type") or "auto-detect",
    )
    result = await llm.complete_json(prompt, system=SYSTEM)

    # Fill in user-provided metadata if LLM didn't extract
    if metadata.get("rep_name") and not result.get("rep_name"):
        result["rep_name"] = metadata["rep_name"]
    if metadata.get("prospect_name") and not result.get("prospect_name"):
        result["prospect_name"] = metadata["prospect_name"]
    if metadata.get("company") and not result.get("company"):
        result["company"] = metadata["company"]

    return result
