from fastapi import APIRouter, Query
from typing import Optional
from ...agents.knowledge_rag import search
from ...models.schemas import KnowledgeSearchResponse

router = APIRouter(prefix="/knowledge", tags=["Knowledge"])

@router.get("/search", response_model=KnowledgeSearchResponse)
async def search_knowledge(
    q:         str            = Query(..., description="Natural language search query"),
    call_type: Optional[str]  = Query(None),
    outcome:   Optional[str]  = Query(None),
):
    """Semantic search across all indexed sales call transcripts."""
    filters = {}
    if call_type: filters["call_type"] = call_type
    if outcome:   filters["outcome"]   = outcome

    results = await search(q, n_results=10, filters=filters or None)
    return {"results": results, "query": q}
