import sys
import asyncio
import urllib.parse
from psycopg_pool import AsyncConnectionPool
from ai_service.core.config import settings
from ai_service.core.logging import logger
from typing import Optional

# psycopg async pool on Windows requires WindowsSelectorEventLoopPolicy
if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception:
        pass

_pool: Optional[AsyncConnectionPool] = None

def get_connection_uri(raw_url: str) -> str:
    """
    Normalizes database connection string/URI for psycopg.
    """
    if not raw_url:
        return "postgresql://postgres:postgres@localhost:5432/hirewise_db"
    
    # If connection string is in key=value format (ADO.NET)
    if "Host=" in raw_url or "host=" in raw_url:
        parts = {}
        for item in raw_url.split(";"):
            if "=" in item:
                k, v = item.split("=", 1)
                parts[k.strip().lower()] = v.strip()
        host = parts.get("host", "localhost")
        port = parts.get("port", "5432")
        db = parts.get("database", "hirewise_db")
        user = urllib.parse.quote_plus(parts.get("username", parts.get("user id", "postgres")))
        pwd = urllib.parse.quote_plus(parts.get("password", "postgres"))
        return f"postgresql://{user}:{pwd}@{host}:{port}/{db}"
    
    if raw_url.startswith("postgres://"):
        return "postgresql://" + raw_url[len("postgres://"):]
    
    return raw_url

async def init_db_pool() -> AsyncConnectionPool:
    """
    Initializes the async PostgreSQL connection pool.
    """
    global _pool
    if _pool is None:
        conninfo = get_connection_uri(settings.DATABASE_URL)
        logger.info("Initializing async PostgreSQL connection pool...")
        try:
            _pool = AsyncConnectionPool(
                conninfo=conninfo,
                min_size=settings.DB_POOL_MIN_SIZE,
                max_size=settings.DB_POOL_MAX_SIZE,
                open=False
            )
            await _pool.open()
            logger.info("PostgreSQL connection pool initialized successfully.")
        except Exception as ex:
            logger.warning(f"Could not connect to PostgreSQL on startup: {ex}. Will retry on demand.")
            _pool = AsyncConnectionPool(
                conninfo=conninfo,
                min_size=settings.DB_POOL_MIN_SIZE,
                max_size=settings.DB_POOL_MAX_SIZE,
                open=False
            )
    return _pool

async def get_db_pool() -> AsyncConnectionPool:
    """
    Returns active connection pool instance.
    """
    global _pool
    if _pool is None:
        return await init_db_pool()
    return _pool

async def close_db_pool():
    """
    Closes the connection pool on application shutdown.
    """
    global _pool
    if _pool is not None:
        logger.info("Closing PostgreSQL connection pool...")
        await _pool.close()
        _pool = None
        logger.info("PostgreSQL connection pool closed.")
