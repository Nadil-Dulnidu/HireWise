from pydantic import model_validator
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
    DATABASE_URL: Optional[str] = None
    POSTGRES_SERVER: Optional[str] = None
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: Optional[str] = None
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    DB_POOL_MIN_SIZE: int = 1
    DB_POOL_MAX_SIZE: int = 10

    @model_validator(mode="after")
    def assemble_db_connection(self) -> "Settings":
        if not self.DATABASE_URL:
            if self.POSTGRES_SERVER:
                user = self.POSTGRES_USER or "postgres"
                pwd = self.POSTGRES_PASSWORD or "postgres"
                db = self.POSTGRES_DB or "hirewise_db"
                self.DATABASE_URL = f"postgresql://{user}:{pwd}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{db}"
            else:
                self.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/hirewise_db"
        return self

    # Vertex AI / Google Gemini / GCP Agent Platform
    USE_VERTEX_AI: bool = False
    GOOGLE_API_KEY: Optional[str] = None
    GOOGLE_CLOUD_PROJECT: Optional[str] = None
    GCP_PROJECT_ID: Optional[str] = None
    VERTEX_PROJECT_ID: Optional[str] = None
    VERTEX_LOCATION: str = "us-central1"
    GCP_REGION: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS_JSON: Optional[str] = None
    # AI Models & Generation Parameters (.env configuration)
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_FLASH_MODEL: str = "gemini-2.5-flash"
    GEMINI_PRO_MODEL: str = "gemini-2.5-pro"
    GEMINI_EMBEDDING_MODEL: str = "text-embedding-004"

    # Environment
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )


settings = Settings()
