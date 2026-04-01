from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...models.call import Call, CallAnalysis
from ...models.schemas import AnalysisResponse, CallResponse, FullAnalysis, AnalysisSummary
from ..database import get_db

router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.get("/{call_id}", response_model=AnalysisResponse)
async def get_analysis(call_id: str, db: AsyncSession = Depends(get_db)):
    call = await db.get(Call, call_id)
    if not call:
        raise HTTPException(404, "Call not found")

    a_stmt   = select(CallAnalysis).where(CallAnalysis.call_id == call_id)
    a_res    = await db.execute(a_stmt)
    analysis = a_res.scalar_one_or_none()

    call_resp = CallResponse(
        id=call.id, rep_name=call.rep_name, prospect_name=call.prospect_name,
        company=call.company, call_date=call.call_date, call_type=call.call_type,
        file_type=call.file_type, status=call.status, created_at=call.created_at,
        analysis=AnalysisSummary(
            overall_score  = analysis.overall_score  if analysis else None,
            verdict        = analysis.verdict         if analysis else None,
            classification = analysis.classification  if analysis else None,
        ) if analysis else None,
    )

    full_analysis = None
    if analysis:
        full_analysis = FullAnalysis(
            id                 = analysis.id,
            call_id            = analysis.call_id,
            transcript         = analysis.transcript,
            classification     = analysis.classification,
            sentiment_data     = analysis.sentiment_data,
            failure_points     = analysis.failure_points,
            coaching_responses = analysis.coaching_responses,
            pre_call_briefing  = analysis.pre_call_briefing,
            overall_score      = analysis.overall_score,
            verdict            = analysis.verdict,
        )

    return AnalysisResponse(call=call_resp, analysis=full_analysis)
