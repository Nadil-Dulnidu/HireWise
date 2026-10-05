import logging
import sys
from ai_service.core.config import settings


def setup_logging():
    log_format = "%(asctime)s [%(levelname)s] (%(name)s) %(message)s"
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)],
    )


logger = logging.getLogger("HireWise.AiService")
