# syntax=docker/dockerfile:1.7
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/opt/huggingface \
    HF_HUB_DISABLE_XET=1 \
    OPUS_MT_MODEL_DIR=/bundle/models

WORKDIR /build

COPY services/opus-mt/requirements.txt ./
COPY services/opus-mt/requirements-build.txt ./
COPY services/opus-mt/app ./app
COPY services/opus-mt/download_models.py ./

# Conversion needs PyTorch, but the production stage does not contain it.
RUN --mount=type=secret,id=build_ca,required=false \
    if [ -f /run/secrets/build_ca ]; then export PIP_CERT=/run/secrets/build_ca REQUESTS_CA_BUNDLE=/run/secrets/build_ca SSL_CERT_FILE=/run/secrets/build_ca; fi \
    && python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.9.1+cpu \
    && python -m pip install --no-cache-dir -r requirements-build.txt \
    && python download_models.py \
    && cp -R app /bundle/app \
    && cp requirements.txt /bundle/requirements.txt \
    && rm -rf /opt/huggingface

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1 \
    OPUS_MT_MODEL_DIR=/service/models

WORKDIR /service

COPY --from=builder /bundle ./

RUN --mount=type=secret,id=build_ca,required=false \
    if [ -f /run/secrets/build_ca ]; then export PIP_CERT=/run/secrets/build_ca REQUESTS_CA_BUNDLE=/run/secrets/build_ca SSL_CERT_FILE=/run/secrets/build_ca; fi \
    && python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:' + __import__('os').environ.get('PORT', '8000') + '/healthz', timeout=4)"

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
