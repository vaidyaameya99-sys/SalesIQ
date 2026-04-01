"""
Agent 5 — Sales Coach Agent
For each failure point, generates the ideal alternative response with reasoning
and optionally enriches with RAG examples from past winning calls.
"""

SYSTEM = """You are an elite sales coach with decades of experience coaching enterprise and SMB reps.
For each mistake, provide the exact alternative phrasing the rep should have used, and explain why it works.
Always return valid JSON."""

PROMPT_TEMPLATE = """You have been given a list of failure points from a sales call. For each failure point,
provide a specific coaching response.

Return a JSON object with this structure:
{{
  "coaching_responses": [
    {{
      "failure_index": <0-based index matching the failure_points array>,
      "alternative_phrasing": "<exact words the rep should have said — write in first person as the rep>",
      "why_it_works": "<1-2 sentence explanation of the psychology and technique behind this approach>",
      "technique_name": "<name of the sales technique being applied, e.g. 'Value-before-price anchoring'>",
      "examples_from_winning_calls": ["<optional: example from past winning call if available>"]
    }},
    ...
  ]
}}

Failure points to address:
{failure_points_json}

Call context:
- Call type: {call_type}
- Prospect final sentiment: {prospect_sentiment}

Past winning call examples (from knowledge base):
{rag_examples}"""

import json

async def run(failure_points: list, classification: dict, sentiment_data: dict, rag_examples: list, llm) -> list:
    if not failure_points:
        return []

    rag_text = "\n".join([
        f"- [{ex.get('call_type', '?')}] \"{ex.get('excerpt', '')}\" → outcome: {ex.get('call_outcome', '?')}"
        for ex in (rag_examples or [])
    ]) or "No past examples available."

    prompt = PROMPT_TEMPLATE.format(
        failure_points_json=json.dumps(failure_points, indent=2),
        call_type=classification.get("call_type", "Unknown"),
        prospect_sentiment=sentiment_data.get("prospect_final_sentiment", "Unknown"),
        rag_examples=rag_text,
    )
    result = await llm.complete_json(prompt, system=SYSTEM)
    return result.get("coaching_responses", [])
