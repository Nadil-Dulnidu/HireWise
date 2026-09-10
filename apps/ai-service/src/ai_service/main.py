import sys
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai_service.core.config import settings
from ai_service.core.logging import setup_logging, logger
from ai_service.db.connection import init_db_pool, close_db_pool
from ai_service.api.health import router as health_router
from ai_service.api.workflows import router as workflows_router
import uvicorn

if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception:
        pass

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(
        f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]"
    )
    await init_db_pool()
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")
    await close_db_pool()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="HireWise Multi-Agent AI Orchestrator powered by LangGraph and Google Vertex/Gemini",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(workflows_router, prefix=settings.API_V1_STR)


def start():
    uvicorn.run("ai_service.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    start()
