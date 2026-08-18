"""
HTTP Client for sending completion and status callbacks from AI service to ASP.NET API.
"""
import uuid
import httpx
from typing import Dict, Any, Optional
from ai_service.core.config import settings
from ai_service.core.logging import logger

class CallbackClient:
    def __init__(self):
        self.base_url = settings.DOTNET_API_BASE_URL.rstrip("/")
        self.internal_key = settings.DOTNET_API_INTERNAL_KEY

    async def notify_workflow_complete(
        self,
        workflow_id: uuid.UUID,
        application_id: uuid.UUID,
        status: str,
        final_result: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Sends completion payload to ASP.NET Core backend at POST /api/internal/ai-callback.
        """
        url = f"{self.base_url}/api/internal/ai-callback"
        headers = {
            "X-Internal-Key": self.internal_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        payload = {
            "workflow_id": str(workflow_id),
            "application_id": str(application_id),
            "status": status,
            "final_result": final_result or {}
        }

        logger.info(f"Sending AI workflow completion callback for Application {application_id} to {url}...")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.is_success:
                    logger.info(f"ASP.NET callback acknowledged for Application {application_id} (Status: {res.status_code})")
                    return True
                else:
                    logger.warning(f"ASP.NET callback returned non-success code {res.status_code}: {res.text}")
                    return False
        except Exception as ex:
            logger.warning(f"Could not reach ASP.NET API callback endpoint ({url}): {ex}. State is safely persisted in PostgreSQL.")
            return False
