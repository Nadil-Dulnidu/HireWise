from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai_service.core.config import settings
from ai_service.core.logging import setup_logging, logger
from ai_service.api.health import router as health_router
from ai_service.api.workflows import router as workflows_router
import uvicorn

setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="HireWise Multi-Agent AI Orchestrator powered by LangGraph and Google Vertex/Gemini",
    docs_url="/docs",
    redoc_url="/redoc"
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

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")

def start():
    uvicorn.run("ai_service.main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    start()
