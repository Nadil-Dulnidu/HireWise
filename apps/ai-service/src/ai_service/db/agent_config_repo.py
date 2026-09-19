"""
Repository to fetch AI agent configurations from the AgentConfigs table in PostgreSQL,
with fallback to default values if unavailable or record not found.
"""

from typing import Optional, Dict, Any
from psycopg.rows import dict_row
from ai_service.db.connection import get_db_pool
from ai_service.core.logging import logger


class AgentConfigRepository:
    """
    Reads dynamic agent configurations (model, system prompt, temperature, max tokens)
    from PostgreSQL table 'AgentConfigs'.
    """

    async def get_config(self, agent_key: str) -> Optional[Dict[str, Any]]:
        try:
            pool = await get_db_pool()
            async with pool.connection(timeout=0.5) as conn:
                async with conn.cursor(row_factory=dict_row) as cur:
                    query = """
                    SELECT "AgentKey", "Name", "Model", "SystemPrompt", "Temperature", "MaxTokens", "IsActive"
                    FROM "AgentConfigs"
                    WHERE LOWER("AgentKey") = LOWER(%s) AND "IsDeleted" = FALSE
                    LIMIT 1;
                    """
                    await cur.execute(query, (agent_key,))
                    row = await cur.fetchone()
                    if row:
                        return dict(row)
        except Exception as ex:
            logger.warning(
                f"Could not load agent config for '{agent_key}' from DB: {ex}. Using fallback defaults."
            )
        return None


agent_config_repo = AgentConfigRepository()
