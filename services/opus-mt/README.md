# Relok8 Opus-MT service

Authenticated English/Polish translation service for Relok8. It implements the
`POST /api/translate` contract used by `convex/services.ts` and keeps the two
pinned Helsinki-NLP Marian models inside the container image.

The build converts the pinned PyTorch checkpoints to int8 CTranslate2 models.
The smaller production stage contains no PyTorch dependency, and startup is
fully offline.

## Resources

Use a long-running Docker host with at least 1 GB of RAM. The service loads both
models once and intentionally runs one Uvicorn worker to avoid duplicating model
memory. Do not deploy it as a Vercel Function.

## Configuration

Set `OPUS_MT_API_TOKEN` to a long random value in the model host. Configure the
same value in the Convex production deployment. Never expose it to the browser
or store it in Git.

## Local verification

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r requirements-test.txt
pytest
```

Build and run the production image:

```sh
docker build -f services/opus-mt/Dockerfile -t relok8-opus-mt .
docker run --rm -p 8000:8000 \
  -e OPUS_MT_API_TOKEN="replace-with-a-random-secret" \
  relok8-opus-mt
```

The health endpoint is public and contains no model input or secret data:

```sh
curl http://127.0.0.1:8000/healthz
```

The translation endpoint requires the bearer token:

```sh
curl -X POST http://127.0.0.1:8000/api/translate \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer replace-with-a-random-secret' \
  -d '{"from":"pl","to":"en","source":"Dzień dobry"}'
```

Model sources and licenses:

- `Helsinki-NLP/opus-mt-pl-en` (Apache-2.0)
- `Helsinki-NLP/opus-mt-en-zlw` with the required `>>pol<<` target token
  (Apache-2.0)
