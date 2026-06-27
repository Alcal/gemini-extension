FROM python:3.12-slim

WORKDIR /app
ENV HF_HOME=/app/hf-cache \
    PYTHONUNBUFFERED=1

# CPU-only torch first so sentence-transformers does not pull the large CUDA build.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Bake the embedding model into the image so the container never fetches it at runtime.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('intfloat/multilingual-e5-base')"

# Model is cached; run fully offline from here on.
ENV HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1

COPY app/ ./app/
COPY documents/ ./documents/

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
