FROM python:3.10-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements.ml.txt ./

RUN pip install --no-cache-dir --prefer-binary -r requirements.txt -r requirements.ml.txt

# Pre-download the sentence-transformers model during build to avoid first-call delay
# This downloads ~400MB model cache but eliminates cold-start latency in production
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/clip-ViT-B-32')"

COPY . ./api

CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
