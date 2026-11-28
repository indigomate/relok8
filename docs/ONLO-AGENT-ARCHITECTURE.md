# Onlo evidence-first agent architecture

Onlo is a bounded copilot running on Convex. It is not an autonomous decision-maker and it does not receive arbitrary database access.

## Request flow

1. Authentication and per-user quota checks run before the agent.
2. A deterministic router selects an intent and at most five allowlisted tools.
3. Tool implementations return redacted, structured records. Listing descriptions, contact details and other uncontrolled fields are not placed in the verified listing context.
4. Curated knowledge is retrieved with keyword/vector fusion. The model may synthesize only the supplied evidence.
5. The evidence validator checks citation numbers and assigns `verified`, `partial` or `unverified` confidence.
6. The response includes sources, tool names, suggested next steps and whether a human must confirm the result.
7. The session stores the exchange. Operational run records contain source IDs, tool names, model, latency and validation status, but not message text.

## Sessions and memory

Sessions are scoped to `general`, `listing`, `application` or `thread`, preventing context from one listing from silently becoming context for another. Recent session messages provide short-term continuity.

Personal preference memory is off by default. A signed-in user can enable it, disable it or clear a conversation. Only explicit rental preferences belong in personal memory; inferred sensitive attributes, identity documents and private contact details do not.

## Tools

The initial read-only tool set is:

- `search_verified_knowledge`
- `get_listing_facts`
- `get_application_status`
- `summarise_conversation`
- `calculate_known_monthly_cost`
- `get_handover_checklist`
- `find_listing_contradictions`

Deterministic code handles costs, dates, statuses and permissions. The language model explains and drafts.

## Actions and confirmation

Conversation assistance produces a draft in the user's composer. The user reviews, edits and sends it. Future write tools must use the same confirmation pattern and be idempotent. Onlo must never autonomously approve an application, assert landlord consent, verify identity or ownership, or initiate payment.

## Evaluation and operations

`npm run test:onlo` runs bilingual retrieval, intent routing, citation validation, redaction and deterministic-tool tests. Production traces support grounded-answer, citation, escalation, latency and feedback measurements without copying private messages into logs.

## Response performance and presentation

Common bilingual rental questions use deterministic lexical retrieval without waiting for an embedding provider. Semantic retrieval remains a fallback for questions without a clear lexical match. Generation uses the fast model's minimal reasoning mode, a concise output limit and a bounded provider timeout.

Model text is normalised on the server before it is stored or displayed. Markdown, decorative symbols, emoji, invisible control characters and inline citation markers are removed; source information remains available as separate source chips. New replies use a short adaptive typewriter animation in the global and listing assistants. The animation completes within 1.8 seconds and is skipped when the device requests reduced motion.
