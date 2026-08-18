import pytest
from httpx import AsyncClient, ASGITransport
from ai_service.main import app

@pytest.mark.asyncio
async def test_health_check_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Healthy"
        assert data["service"] == "HireWise AI Orchestrator"
        assert "timestamp" in data
