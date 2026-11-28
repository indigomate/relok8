# Relok8 live translation with Helsinki-NLP Opus-MT

Relok8 translates dynamic user content through the open-source [Helsinki-NLP/Opus-MT](https://github.com/Helsinki-NLP/Opus-MT) service. The original text is never overwritten. The English/Polish selector in the main navigation controls the language readers see.

The browser never talks to Opus-MT directly. Convex detects the source language, calls the private translation service, and caches the result by source-text hash and target language.

## 1. Host the Opus-MT service

Opus-MT is a model server, not a hosted API included with the GitHub repository. Run it on a container or GPU/CPU host that can stay online; it is not suitable for a Vercel browser bundle or short-lived Vercel function. Relok8 includes a production container in `services/opus-mt`. It pins dedicated Polish-to-English and English-to-Polish models.

Deploy `services/opus-mt/Dockerfile` from the repository-root build context on a long-running host with at least 512 MB RAM and expose it over HTTPS. The build converts both pinned checkpoints to int8 CTranslate2 models, omits PyTorch and Transformers from the runtime image, and keeps only the active translation direction in memory. The service implements the endpoint expected by Convex:

```text
POST /api/translate
Content-Type: application/json

{"from":"pl","to":"en","source":"Dzień dobry"}
```

The service should return:

```json
{"translation":"Good morning"}
```

The service intentionally accepts only `pl -> en` and `en -> pl`. Add another pinned model and explicit server-side routing before enabling any additional language.

The container requires `OPUS_MT_API_TOKEN` and rejects missing or incorrect bearer tokens. The hosting platform must terminate TLS. Relok8 sends the matching `Authorization: Bearer …` header from Convex.

The Polish-to-English Hugging Face model is Apache-2.0. The dedicated Helsinki-NLP Tatoeba Challenge English-to-Polish model is CC BY 4.0 and is attributed in the service README; its README and license are also included with the deployed model. Re-check the source and license before changing either pinned model.

## 2. Configure Convex production

Add these variables to the **Convex production deployment**, not Vercel client variables:

- `OPUS_MT_API_URL` — the HTTPS base URL of the deployed Opus-MT service; a full URL ending in `/api/translate` is also accepted
- `OPUS_MT_API_TOKEN` — optional bearer token enforced by the reverse proxy in front of Opus-MT
- `OPUS_MT_CACHE_VERSION` — optional cache namespace, default `opus-mt-v2`; change it after replacing models when old cached translations should be regenerated

Never put the token in Git, browser code, or any `VITE_` environment variable.

`GEMINI_API_KEY` and `GEMINI_MODEL` remain separate and are used only by the Relok8 housing assistant, reply suggestions, and summaries. They are not used for translation.

## Covered content

- Public listing titles, descriptions, campus-distance notes, and transit notes
- Prospect, tenant, landlord, and Onlo messages
- Private tenant/landlord property-room messages
- Early-exit notes shown to the other participant

Static interface copy remains deterministic English/Polish content from the app translation catalogue. Opus-MT is used only for dynamic user-generated text.

## Behaviour and safeguards

- Source language is detected locally on the server using TinyLD; no separate detection API receives the text.
- The navigation language determines the target language.
- Readers can reveal the exact original beside every private translated message.
- Translations are cached in Convex, so repeated reads do not repeatedly call the model server.
- Public translation accepts listing IDs rather than arbitrary public text, preventing the endpoint from becoming an open translation proxy.
- Private free-text translation requires an authenticated Clerk/Convex session and is rate-limited.
- Requests time out after 60 seconds and the interface safely keeps the original text if translation is unavailable.
- Decoding uses proportional length limits and repetition guards so malformed model output is never cached or displayed.

## Smoke test

1. Publish a listing or send a message in Polish.
2. Switch the top language selector to English.
3. Confirm the content appears in English with an **Opus-MT translation · Original** control on private messages.
4. Switch back to Polish and confirm the Polish version appears.
5. In Convex, verify `translationCache` contains entries for both target languages after both views.
6. Stop the Opus-MT service temporarily and confirm the original content remains visible.

## Production readiness checks

- `GET /healthz` returns `status: ok` and both `pl-en` and `en-pl` pairs.
- A request without the bearer token returns HTTP 401.
- The same Polish and English samples succeed with the bearer token.
- The host remains available long enough to satisfy Convex's 60-second timeout; sleeping free tiers are unsuitable for production traffic.
- Service logs do not record message or listing text.
