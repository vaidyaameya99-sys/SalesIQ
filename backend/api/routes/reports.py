from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import io

from ...models.call import Call, CallAnalysis
from ...models.schemas import EmailReportRequest, EmailReportResponse
from ...services.pdf_service import generate_pdf
from ...services.email_service import send_report_email
from ..database import get_db

router = APIRouter(prefix="/report", tags=["Reports"])

async def _get_call_and_analysis(call_id: str, db: AsyncSession):
    call = await db.get(Call, call_id)
    if not call:
        raise HTTPException(404, "Call not found")

    a_stmt   = select(CallAnalysis).where(CallAnalysis.call_id == call_id)
    a_res    = await db.execute(a_stmt)
    analysis = a_res.scalar_one_or_none()

    if not analysis:
        raise HTTPException(404, "Analysis not yet complete")

    return call, analysis

def _to_dict(obj) -> dict:
    if obj is None:
        return {}
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}

@router.get("/pdf/{call_id}")
async def download_pdf(call_id: str, db: AsyncSession = Depends(get_db)):
    """Generate and stream a PDF report download."""
    call, analysis = await _get_call_and_analysis(call_id, db)

    call_dict     = _to_dict(call)
    analysis_dict = _to_dict(analysis)
    # Convert JSON columns (already dicts from SQLAlchemy JSON type)
    for key in ("classification", "sentiment_data", "failure_points", "coaching_responses", "pre_call_briefing"):
        analysis_dict[key] = getattr(analysis, key)

    pdf_bytes = generate_pdf(call_dict, analysis_dict)

    filename = f"SalesIQ_Report_{call.prospect_name or call_id}.pdf".replace(" ", "_")
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/email", response_model=EmailReportResponse)
async def email_report(req: EmailReportRequest, db: AsyncSession = Depends(get_db)):
    """Generate PDF and send via email."""
    call, analysis = await _get_call_and_analysis(req.call_id, db)

    call_dict     = _to_dict(call)
    analysis_dict = _to_dict(analysis)
    for key in ("classification", "sentiment_data", "failure_points", "coaching_responses", "pre_call_briefing"):
        analysis_dict[key] = getattr(analysis, key)

    pdf_bytes = generate_pdf(call_dict, analysis_dict)

    try:
        await send_report_email(
            to_email  = req.email,
            pdf_bytes = pdf_bytes,
            call      = call_dict,
            analysis  = analysis_dict,
        )
        return {"success": True, "message": f"Report sent to {req.email}"}
    except Exception as e:
        raise HTTPException(500, f"Failed to send email: {str(e)}")
