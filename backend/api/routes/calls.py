"""
Calls API — upload, list, get, delete.
"""
import os, uuid, shutil
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from ...models.call import Call, CallAnalysis
from ...models.schemas import UploadResponse, CallListResponse, CallResponse, AnalysisSummary
from ...config import settings
from ..database import get_db

router = APIRouter(prefix="/calls", tags=["Calls"])

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".txt", ".pdf"}
AUDIO_EXTENSIONS   = {".mp3", ".wav", ".m4a"}

@router.post("/upload", response_model=UploadResponse)
async def upload_call(
    file:          UploadFile = File(...),
    rep_name:      Optional[str] = Form(None),
    prospect_name: Optional[str] = Form(None),
    company:       Optional[str] = Form(None),
    call_date:     Optional[str] = Form(None),
    call_type:     Optional[str] = Form(None),
    db:            AsyncSession  = Depends(get_db),
):
    """Upload a call file and create a pending call record."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Use: {', '.join(ALLOWED_EXTENSIONS)}")

    call_id = str(uuid.uuid4())
    dest_path = os.path.join(settings.upload_dir, f"{call_id}{ext}")

    # Save file
    with open(dest_path, "wb") as f:
        content = await file.read()
        f.write(content)

    file_type = "audio" if ext in AUDIO_EXTENSIONS else "text"

    call = Call(
        id=call_id,
        rep_name=rep_name,
        prospect_name=prospect_name,
        company=company,
        call_date=call_date,
        call_type=call_type,
        file_path=dest_path,
        file_type=file_type,
        status="pending",
    )
    db.add(call)
    await db.commit()

    return {"call_id": call_id, "message": "Upload successful. Connect to WebSocket to track analysis progress."}


@router.get("", response_model=CallListResponse)
async def list_calls(
    rep_name:  Optional[str] = None,
    call_type: Optional[str] = None,
    outcome:   Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Call).order_by(Call.created_at.desc())
    result = await db.execute(stmt)
    calls  = result.scalars().all()

    # Eager-ish: build response with analysis summary
    output = []
    for c in calls:
        # Fetch analysis separately
        a_stmt  = select(CallAnalysis).where(CallAnalysis.call_id == c.id)
        a_res   = await db.execute(a_stmt)
        analysis= a_res.scalar_one_or_none()

        summary = None
        if analysis:
            summary = AnalysisSummary(
                overall_score  = analysis.overall_score,
                verdict        = analysis.verdict,
                classification = analysis.classification,
            )

            # Filter by outcome if requested
            if outcome and analysis.verdict != outcome:
                continue

        if rep_name and c.rep_name and rep_name.lower() not in c.rep_name.lower():
            continue
        if call_type and c.call_type and call_type.lower() not in c.call_type.lower():
            continue

        output.append(CallResponse(
            id=c.id, rep_name=c.rep_name, prospect_name=c.prospect_name,
            company=c.company, call_date=c.call_date, call_type=c.call_type,
            file_type=c.file_type, status=c.status, created_at=c.created_at,
            analysis=summary,
        ))

    return {"calls": output, "total": len(output)}


@router.get("/{call_id}", response_model=CallResponse)
async def get_call(call_id: str, db: AsyncSession = Depends(get_db)):
    call = await db.get(Call, call_id)
    if not call:
        raise HTTPException(404, "Call not found")

    a_stmt   = select(CallAnalysis).where(CallAnalysis.call_id == call_id)
    a_res    = await db.execute(a_stmt)
    analysis = a_res.scalar_one_or_none()
    summary  = None
    if analysis:
        summary = AnalysisSummary(
            overall_score=analysis.overall_score,
            verdict=analysis.verdict,
            classification=analysis.classification,
        )

    return CallResponse(
        id=call.id, rep_name=call.rep_name, prospect_name=call.prospect_name,
        company=call.company, call_date=call.call_date, call_type=call.call_type,
        file_type=call.file_type, status=call.status, created_at=call.created_at,
        analysis=summary,
    )


@router.delete("/{call_id}")
async def delete_call(call_id: str, db: AsyncSession = Depends(get_db)):
    call = await db.get(Call, call_id)
    if not call:
        raise HTTPException(404, "Call not found")

    # Delete file
    if call.file_path and os.path.exists(call.file_path):
        os.remove(call.file_path)

    await db.delete(call)
    await db.commit()
    return {"message": "Deleted"}
