from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "HireWise AI Orchestrator"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Internal Service-to-Service Secret (ASP.NET -> AI Service)
    AI_SERVICE_API_KEY: str = "hw_ai_service_secret_key"
    
    # ASP.NET Core API Integration (AI Service -> ASP.NET)
    DOTNET_API_BASE_URL: str = "http://localhost:5247"
    DOTNET_API_INTERNAL_KEY: str = "hw_internal_callback_key"
    
    # Database (PostgreSQL)
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/hirewise_db"
    DB_POOL_MIN_SIZE: int = 1
    DB_POOL_MAX_SIZE: int = 10
    
    # Vertex AI / Google Gemini
    GOOGLE_API_KEY: Optional[str] = None
    VERTEX_PROJECT_ID: Optional[str] = None
    VERTEX_LOCATION: str = "us-central1"
    GEMINI_MODEL: str = "gemini-1.5-pro"
    
    # Environment
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
