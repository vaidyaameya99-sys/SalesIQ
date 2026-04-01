import asyncio, random, json
from .base_provider import LLMProvider

# Realistic mock responses keyed to common prompt keywords
MOCK_RESPONSES = {
    "classify": {
        "call_type": "Discovery",
        "confidence": 0.91,
        "summary": "A discovery call with a mid-market SaaS prospect. The rep established initial rapport but struggled to uncover specific pain points. The prospect showed moderate interest but raised budget concerns in the final third of the call.",
        "rep_name": None,
        "prospect_name": None,
        "company": None,
        "duration_minutes": 28,
        "key_topics": ["Pricing", "Integration complexity", "Timeline", "ROI concerns"]
    },
    "sentiment": {
        "timeline": [
            {"minute": 1,  "positive": 0.65, "negative": 0.10, "neutral": 0.25},
            {"minute": 3,  "positive": 0.70, "negative": 0.08, "neutral": 0.22},
            {"minute": 5,  "positive": 0.72, "negative": 0.10, "neutral": 0.18},
            {"minute": 7,  "positive": 0.68, "negative": 0.15, "neutral": 0.17},
            {"minute": 9,  "positive": 0.55, "negative": 0.28, "neutral": 0.17},
            {"minute": 11, "positive": 0.40, "negative": 0.42, "neutral": 0.18},
            {"minute": 13, "positive": 0.45, "negative": 0.38, "neutral": 0.17},
            {"minute": 15, "positive": 0.50, "negative": 0.32, "neutral": 0.18},
            {"minute": 17, "positive": 0.60, "negative": 0.22, "neutral": 0.18},
            {"minute": 19, "positive": 0.55, "negative": 0.28, "neutral": 0.17},
            {"minute": 21, "positive": 0.35, "negative": 0.48, "neutral": 0.17},
            {"minute": 23, "positive": 0.30, "negative": 0.55, "neutral": 0.15},
            {"minute": 25, "positive": 0.38, "negative": 0.45, "neutral": 0.17},
            {"minute": 27, "positive": 0.42, "negative": 0.40, "neutral": 0.18},
        ],
        "mood_shifts": [
            {"minute": 9,  "description": "Prospect tone shifted when pricing was first mentioned — increased hesitancy detected."},
            {"minute": 21, "description": "Significant negative spike after rep mentioned implementation timeline. Prospect became guarded."},
        ],
        "engagement_level": "Medium",
        "emotional_triggers": ["pricing", "timeline", "integration"]
    },
    "diagnostics": [
        {
            "timestamp": "9:14",
            "what_happened": "Rep quoted price before establishing value. Jumped directly to pricing tier when prospect asked about cost, without first anchoring the ROI or demonstrating clear business impact.",
            "severity": "critical",
            "root_cause_category": "Premature pricing disclosure",
            "transcript_excerpt": "So our standard tier starts at $2,400 per month and goes up from there depending on seats."
        },
        {
            "timestamp": "16:30",
            "what_happened": "Rep failed to address the integration objection with specifics. When the prospect raised concerns about connecting to their existing CRM, rep gave a vague assurance instead of walking through the integration flow.",
            "severity": "major",
            "root_cause_category": "Weak objection handling",
            "transcript_excerpt": "Yeah, we integrate with most things, it's usually not a problem."
        },
        {
            "timestamp": "22:05",
            "what_happened": "Rep rushed the close without confirming mutual agreement on value. Attempted to book a next step while the prospect was clearly still unconvinced, creating resistance instead of momentum.",
            "severity": "major",
            "root_cause_category": "Premature close attempt",
            "transcript_excerpt": "So should we go ahead and get a contract drafted? I can have something over by Friday."
        }
    ],
    "coaching": [
        {
            "alternative_phrasing": "Before we talk numbers, let me show you what this looks like for a company your size. Our clients in your space typically see a 30–40% reduction in their sales cycle. Once we've established what that's worth to you, pricing becomes a straightforward conversation. Want to do a quick ROI exercise first?",
            "why_it_works": "Anchoring value before price prevents sticker shock and gives the prospect a mental framework to evaluate cost against benefit rather than against a competitor's price.",
            "examples_from_winning_calls": ["Used in a Q3 deal with Meridian Tech — prospect said 'now the price actually makes sense'"]
        },
        {
            "alternative_phrasing": "Great question on integration. Let me be specific — we have a native Salesforce connector that takes about 4 hours to set up, and our team handles the first sync. For HubSpot users, we have a step-by-step playbook. Which CRM are you on? I can walk you through exactly what it looks like.",
            "why_it_works": "Specificity kills doubt. Vague assurances increase anxiety; concrete detail + a transition question re-engages the prospect and demonstrates product knowledge.",
            "examples_from_winning_calls": ["Used in a closing call with DataStream Inc — integration concern dropped after rep pulled up the actual connector doc"]
        },
        {
            "alternative_phrasing": "It sounds like we still have a few things to align on — specifically the timeline concern you raised. Rather than rushing to paperwork, what if we scheduled a 20-minute technical call with your ops team so they can validate the integration path? That way, when we do move to contract, there are no surprises.",
            "why_it_works": "When a prospect is not ready, a lower-commitment next step (technical call vs. contract) keeps the deal alive. It also shows confidence — you're not desperate to close, you want them to be fully informed.",
            "examples_from_winning_calls": ["Pattern used across 6 re-engaged deals in Q4 — 4 converted within 2 weeks"]
        }
    ],
    "briefing": {
        "recommended_approach": "This prospect is analytically driven and risk-averse. Lead with specifics: exact integration steps, named reference customers in their industry, and a concrete ROI model. Avoid vague assurances. Open with acknowledgment of previous concerns and demonstrate you've done homework on their tech stack.",
        "prospect_triggers": [
            "ROI clarity — they want to see numbers before committing",
            "Integration simplicity — they have a lean IT team and fear added complexity",
            "Peer validation — they respond well to reference customers in their space",
            "Timeline control — they want to feel they're driving the pace, not being pushed"
        ],
        "objections_to_expect": [
            {
                "objection": "The price is too high for our current budget cycle",
                "suggested_response": "Totally understand. Let's flip the lens — based on what you told me about your deal velocity, if we can cut your cycle by 3 weeks, what's that worth per quarter? I want to make sure the math works for you before we even talk about price."
            },
            {
                "objection": "We're already integrated with another tool",
                "suggested_response": "Most of our best customers came from that exact situation. We actually built a migration path specifically for that — 48-hour cutover, no data loss. Want me to connect you with someone who made that switch 6 months ago?"
            }
        ],
        "opening_lines": [
            "Hi [Name], I wanted to follow up and acknowledge that I jumped too quickly to pricing in our last call — I'd like to start fresh with the actual business impact before we talk numbers.",
            "Since we last spoke, I put together a quick ROI model based on what you shared — 3 minutes to walk through it and see if the economics make sense for your team?"
        ],
        "questions_to_ask": [
            "What does your current process look like for [pain point area]? How much manual effort goes into it each week?",
            "If the integration concern was off the table, what would it take for this to be a yes?",
            "Who else on your team would be impacted by this change — is there anyone we should loop in for the next conversation?",
            "What's driving the timeline on your end — is there an internal initiative or budget cycle we should be aligning to?"
        ]
    }
}

class MockProvider(LLMProvider):
    """Zero-latency mock — returns realistic pre-built responses."""

    async def complete(self, prompt: str, system: str = "") -> str:
        await asyncio.sleep(random.uniform(0.3, 1.0))
        return "This is a mock response. Configure LLM_PROVIDER=openai or =claude to use a real model."

    async def complete_json(self, prompt: str, system: str = "", schema_hint: str = "") -> dict:
        await asyncio.sleep(random.uniform(0.5, 1.5))
        p = prompt.lower()

        if "classif" in p or "call type" in p:
            return dict(MOCK_RESPONSES["classify"])
        if "sentiment" in p or "emotion" in p:
            return dict(MOCK_RESPONSES["sentiment"])
        if "diagnost" in p or "failure" in p:
            return {"failure_points": list(MOCK_RESPONSES["diagnostics"])}
        if "coach" in p or "alternative" in p or "phrasing" in p:
            return {"coaching_responses": list(MOCK_RESPONSES["coaching"])}
        if "brief" in p or "pre-call" in p or "pre_call" in p:
            return dict(MOCK_RESPONSES["briefing"])

        return {"result": "mock", "raw": prompt[:100]}

    def get_info(self) -> dict:
        return {"provider": "mock", "model": "mock-v1"}
