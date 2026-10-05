FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency management
RUN pip install --no-cache-dir uv

# Copy project definition, documentation, and source code needed for wheel build
COPY pyproject.toml README.md ./
COPY src/ ./src/

# Install dependencies and local package
RUN uv pip install --system --no-cache .

ENV PYTHONPATH=/app/src
ENV PORT=8000

EXPOSE 8000

CMD ["uvicorn", "ai_service.main:app", "--host", "0.0.0.0", "--port", "8000"]
