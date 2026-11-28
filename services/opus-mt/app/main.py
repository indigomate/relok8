from __future__ import annotations

import asyncio
import os
import secrets
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, Header, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field

from .translator import MODEL_SPECS, OpusTranslator, TranslationEngine


class TranslationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    source_language: str = Field(alias="from", min_length=2, max_length=10)
    target_language: str = Field(alias="to", min_length=2, max_length=10)
    source: str = Field(min_length=1, max_length=10_000)


class TranslationResponse(BaseModel):
    translation: str


def expected_token() -> str:
    return os.environ.get("OPUS_MT_API_TOKEN", "").strip()


def authorize(authorization: str | None) -> None:
    configured = expected_token()
    if not configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Translation service is not configured",
        )
    scheme, _, supplied = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not supplied or not secrets.compare_digest(supplied, configured):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Bearer"},
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not expected_token():
        raise RuntimeError("OPUS_MT_API_TOKEN must be configured")
    app.state.translator = await asyncio.to_thread(OpusTranslator)
    yield


app = FastAPI(
    title="Relok8 Opus-MT",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)


@app.get("/healthz")
async def health(request: Request) -> dict[str, object]:
    return {
        "status": "ok" if getattr(request.app.state, "translator", None) else "starting",
        "pairs": [f"{source}-{target}" for source, target in MODEL_SPECS],
    }


@app.post("/api/translate", response_model=TranslationResponse)
async def translate(
    payload: TranslationRequest,
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
) -> TranslationResponse:
    authorize(authorization)
    source = payload.source_language.lower().strip()
    target = payload.target_language.lower().strip()
    if source not in {"en", "pl"} or target not in {"en", "pl"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Only English and Polish are currently supported",
        )
    translator: TranslationEngine | None = getattr(request.app.state, "translator", None)
    if translator is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Translation models are still loading",
        )
    try:
        result = await asyncio.to_thread(
            translator.translate,
            source,
            target,
            payload.source,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error
    if not result:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Translation model returned no text",
        )
    return TranslationResponse(translation=result)
