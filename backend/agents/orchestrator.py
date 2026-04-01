"""
Agent Orchestrator — coordinates all 7 agents sequentially,
emits real-time WebSocket events, and persists results to DB.
"""
import asyncio, json
from datetime import datetime
from typing import Callable, Awaitable

from ..llm import get_llm_provider
from ..models.call import CallAnalysis
from . import transcription, classifier, sentiment, diagnostics, coach, briefing, knowledge_rag

# Callable type: async (event_dict) -> None
EventEmitter = Callable[[dict], Awaitable[None]]

AGENT_META = [
    ("transcription",  "Transcription Agent",      "Converting audio/text to clean transcript…"),
    ("classifier",     "Call Classifier Agent",    "Identifying call type and extracting metadata…"),
    ("sentiment",      "Sentiment & Emotion Agent","Analyzing per-minute emotional arc…"),
    ("diagnostics",    "Diagnostics Agent",         "Detecting failure points and root causes…"),
    ("coach",          "Sales Coach Agent",         "Generating coaching responses…"),
    ("briefing",       "Pre-Call Briefing Agent",   "Building re-engagement strategy…"),
    ("knowledge_rag",  "Knowledge RAG Agent",       "Indexing transcript into knowledge base…"),
]

async def run_pipeline(
    call_id:  str,
    file_path: str,
    file_type: str,
    metadata: dict,
    db_session,
    emit: EventEmitter,
):
    """
    Run the full 7-agent pipeline. Emits progress events via `emit`.
    Saves final analysis to DB via `db_session`.
    """
    llm = get_llm_provider()

    # Initialize all agents as waiting
    for agent_id, _, _ in AGENT_META:
        await emit({"type": "agent_update", "agent": agent_id, "status": "waiting", "progress": 0, "message": ""})

    async def run_agent(agent_id: str, label: str, msg: str, coro, progress_end: int = 100):
        await emit({"type": "agent_update", "agent": agent_id, "status": "running", "progress": 10, "message": msg})
        result = await coro
        await emit({"type": "agent_update", "agent": agent_id, "status": "done", "progress": 100, "message": f"{label} complete"})
        return result

    try:
        # Mark call as processing
        from ..models.call import Call
        call = await db_session.get(Call, call_id)
        if call:
            call.status = "processing"
            await db_session.commit()

        # ── Agent 1: Transcription ────────────────────────────────────────────
        transcript = await run_agent(
            "transcription", "Transcription Agent",
            AGENT_META[0][2],
            transcription.run(file_path, file_type, llm),
        )

        # ── Agent 2: Classifier ───────────────────────────────────────────────
        classification = await run_agent(
            "classifier", "Call Classifier Agent",
            AGENT_META[1][2],
            classifier.run(transcript, metadata, llm),
        )

        # Patch in user-provided metadata if LLM didn't extract
        for key in ("rep_name", "prospect_name", "company"):
            if metadata.get(key) and not classification.get(key):
                classification[key] = metadata[key]

        # ── Agent 3: Sentiment ────────────────────────────────────────────────
        sentiment_data = await run_agent(
            "sentiment", "Sentiment & Emotion Agent",
            AGENT_META[2][2],
            sentiment.run(transcript, classification, llm),
        )

        # ── Agent 4: Diagnostics ──────────────────────────────────────────────
        diag_result = await run_agent(
            "diagnostics", "Diagnostics Agent",
            AGENT_META[3][2],
            diagnostics.run(transcript, sentiment_data, llm),
        )
        failure_points   = diag_result.get("failure_points", [])
        overall_score    = float(diag_result.get("overall_score", 50))
        verdict          = diag_result.get("verdict", "Neutral")

        # ── Agent 5: Coach ────────────────────────────────────────────────────
        # Do a quick RAG search first to enrich coaching with past examples
        rag_examples = await knowledge_rag.search(
            f"{classification.get('call_type', '')} {' '.join(sentiment_data.get('emotional_triggers', []))}",
            n_results=4,
            filters={"outcome": "Strong"},
        )
        coaching_responses = await run_agent(
            "coach", "Sales Coach Agent",
            AGENT_META[4][2],
            coach.run(failure_points, classification, sentiment_data, rag_examples, llm),
        )

        # ── Agent 6: Pre-Call Briefing ────────────────────────────────────────
        pre_call_briefing = await run_agent(
            "briefing", "Pre-Call Briefing Agent",
            AGENT_META[5][2],
            briefing.run(classification, sentiment_data, failure_points, coaching_responses, overall_score, verdict, llm),
        )

        # ── Agent 7: Knowledge RAG (index) ────────────────────────────────────
        await run_agent(
            "knowledge_rag", "Knowledge RAG Agent",
            AGENT_META[6][2],
            knowledge_rag.index_call(call_id, transcript, {
                "call_type":  classification.get("call_type", ""),
                "verdict":    verdict,
                "rep_name":   classification.get("rep_name") or metadata.get("rep_name", ""),
                "company":    classification.get("company") or metadata.get("company", ""),
            }),
        )

        # ── Persist to DB ─────────────────────────────────────────────────────
        analysis = CallAnalysis(
            call_id             = call_id,
            transcript          = transcript,
            classification      = classification,
            sentiment_data      = sentiment_data,
            failure_points      = failure_points,
            coaching_responses  = coaching_responses,
            pre_call_briefing   = pre_call_briefing,
            overall_score       = overall_score,
            verdict             = verdict,
        )
        db_session.add(analysis)

        # Update call metadata from classification
        if call:
            call.status        = "complete"
            if not call.rep_name and classification.get("rep_name"):
                call.rep_name = classification["rep_name"]
            if not call.prospect_name and classification.get("prospect_name"):
                call.prospect_name = classification["prospect_name"]
            if not call.company and classification.get("company"):
                call.company = classification["company"]
            call.call_type = classification.get("call_type", call.call_type)

        await db_session.commit()

        # ── Done ──────────────────────────────────────────────────────────────
        await emit({"type": "complete", "call_id": call_id})

    except Exception as e:
        # Mark call as error
        from ..models.call import Call
        call = await db_session.get(Call, call_id)
        if call:
            call.status        = "error"
            call.error_message = str(e)
            await db_session.commit()

        await emit({"type": "error", "message": str(e), "call_id": call_id})
        raise
