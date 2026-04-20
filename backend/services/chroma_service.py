"""
ChromaDB service — manages the vector store for RAG.
Chromadb is optional — if not installed (e.g. Python 3.13 local dev),
all RAG operations are silently skipped.
"""
try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    _CHROMA_AVAILABLE = True
except ImportError:
    _CHROMA_AVAILABLE = False

from ..config import settings as app_settings

_client     = None
_collection = None

async def get_chroma_collection():
    global _client, _collection
    if not _CHROMA_AVAILABLE:
        return None
    if _collection is not None:
        return _collection

    _client = chromadb.PersistentClient(
        path=app_settings.chroma_dir,
        settings=ChromaSettings(anonymized_telemetry=False),
    )
    _collection = _client.get_or_create_collection(
        name="sales_calls",
        metadata={"hnsw:space": "cosine"},
    )
    return _collection

async def get_collection_count() -> int:
    try:
        col = await get_chroma_collection()
        if col is None:
            return 0
        return col.count()
    except Exception:
        return 0
