"""
WebSocket handler for real-time agent progress streaming.
"""
import json, asyncio
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from .database import AsyncSessionLocal
from ..agents.orchestrator import run_pipeline
from ..models.call import Call

# In-memory registry: call_id → list of connected WebSockets
_connections: dict[str, list[WebSocket]] = {}

async def ws_analysis(websocket: WebSocket, call_id: str):
    await websocket.accept()

    if call_id not in _connections:
        _connections[call_id] = []
    _connections[call_id].append(websocket)

    try:
        # Start the analysis pipeline in a background task
        asyncio.create_task(_run_analysis(call_id))

        # Keep alive until client disconnects
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=120)
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({"type": "ping"}))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
        except Exception:
            pass
    finally:
        if call_id in _connections and websocket in _connections[call_id]:
            _connections[call_id].remove(websocket)

async def _run_analysis(call_id: str):
    """Run the pipeline and emit events to all connected clients."""
    async def emit(event: dict):
        if call_id not in _connections:
            return
        dead = []
        for ws in _connections[call_id]:
            try:
                await ws.send_text(json.dumps(event))
            except Exception:
                dead.append(ws)
        for ws in dead:
            _connections[call_id].remove(ws)

    async with AsyncSessionLocal() as db:
        call = await db.get(Call, call_id)
        if not call:
            await emit({"type": "error", "message": "Call not found"})
            return

        metadata = {
            "rep_name":      call.rep_name,
            "prospect_name": call.prospect_name,
            "company":       call.company,
            "call_date":     call.call_date,
            "call_type":     call.call_type,
        }

        await run_pipeline(
            call_id   = call_id,
            file_path = call.file_path or "",
            file_type = call.file_type or "text",
            metadata  = metadata,
            db_session= db,
            emit      = emit,
        )
