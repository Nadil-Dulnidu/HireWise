from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from ai_service.core.config import settings

api_key_header = APIKeyHeader(name="X-Api-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    """
    Validates internal service-to-service API key sent in X-Api-Key header.
    Rejects unauthorized access from untrusted services.
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required X-Api-Key authentication header."
        )
    
    if api_key != settings.AI_SERVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or unauthorized API key provided."
        )
    
    return api_key
