from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "HireWise AI Orchestrator"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Internal Service-to-Service Secret
    AI_SERVICE_API_KEY: str = "hw_ai_service_secret_key"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/hirewise_db"
    
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
