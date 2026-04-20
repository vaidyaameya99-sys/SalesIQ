from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from ..models.call import Base
from ..config import settings

engine = create_async_engine(settings.database_url, echo=False)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def init_db():
    """Create all tables if they don't already exist. Safe to call on every startup."""
    async with engine.begin() as conn:
        await conn.run_sync(lambda sync_conn: Base.metadata.create_all(sync_conn, checkfirst=True))

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
