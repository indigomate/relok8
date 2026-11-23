# Onlo verified knowledge base

## Purpose

Onlo answers factual questions from a curated Convex knowledge table instead of relying on general model memory. The user question and listing-authored text remain untrusted. If the retrieved records do not support an answer, Onlo must say that the answer is not verified and direct the user to the relevant participant, authority or qualified adviser.

The implementation does not give the model live web access. Research is reviewed before it becomes a versioned database record.

## Data flow

1. `convex/onloKnowledge.ts` contains the reviewed default records and their source metadata.
2. The first Onlo request seeds missing records into `onloKnowledge`. A later content revision is applied only when its record version increases.
3. `convex/lib/onloRetrieval.ts` normalises English and Polish questions and performs deterministic keyword ranking.
4. `convex/lib/onloRag.ts` indexes the same approved records in the official Convex RAG component using Google `gemini-embedding-001` embeddings reduced to 768 dimensions. It never indexes user conversations or private listing data.
5. `convex/services.ts` combines keyword and semantic results with reciprocal-rank fusion. Keyword retrieval has the stronger weight so an approximate semantic match cannot displace a clear product-rule match.
6. If embeddings or the RAG component are unavailable, Onlo continues with deterministic keyword retrieval. It does not fall back to unrestricted model knowledge.
7. The model receives only the selected knowledge and, for listing chat, the current redacted listing record.
8. Both Onlo chat interfaces display the sources returned with the answer. Listing answers use `[0]` for the current listing record and `[1]` onward for knowledge sources.

## Semantic index lifecycle

- `convex/convex.config.ts` installs the `@convex-dev/rag` component.
- The first Onlo request after a new knowledge version lazily embeds and indexes only records whose `ragVersion` is behind their reviewed `version`.
- Each indexed entry is keyed by the article slug and content version. Replaced component entries are deleted after the new entry is ready.
- The existing `GEMINI_API_KEY` is used for embeddings. `GOOGLE_GENERATIVE_AI_API_KEY` is accepted as a fallback name. Do not place either value in source code.
- Deploy through the linked Convex environment after adding or changing the component so Convex can generate and register its component API.

## Current knowledge areas

- Relok8 scope and limitations
- 49 PLN + 49 PLN launch pricing and the current disabled-checkout status
- listing availability states
- public names, addresses and redacted contact fields
- landlord confirmation and workflow limits
- lease takeover and landlord-consent context
- residential deposit return
- meldunek and PESEL for foreigners
- rental scam warning signs
- energy performance certificates
- czynsz, administration charges and utilities
- practical handover checks

## Source policy

Use Relok8 canonical documentation for product behaviour. Use primary Polish sources for public administration, law and safety:

- [Polish Civil Code — consolidated text, 27 May 2026](https://eli.gov.pl/eli/DU/2026/795/ogl/pol)
- [Gov.pl — residence registration for foreigners](https://www.gov.pl/web/gov/zamelduj-sie-na-pobyt-staly-dla-cudzoziemcow)
- [Gov.pl — PESEL for foreigners](https://www.gov.pl/web/gov/uzyskaj-numer-pesel-dla-cudzoziemcow)
- [Act on the Protection of Tenants’ Rights — official consolidated PDF](https://isap.sejm.gov.pl/isap.nsf/download.xsp/WDU20230000725/O/D20230725.pdf)
- [Ministry of Development and Technology — energy performance certificates](https://www.gov.pl/web/rozwoj-technologia/Swiadectwa-charakterystyki-energetycznej)
- [Polish Police — rental listing fraud warning](https://wroclaw.policja.gov.pl/dwr/aktualnosci/bieza/155392%2CWroclawscy-policjanci-ostrzegaja-przed-falszywymi-ogloszeniami-dotyczacymi-wynaj.html)

Secondary blogs, generated summaries and forum posts must not be used as the authority for a legal or administrative answer.

## Updating a record

1. Open the primary source and verify that it still supports the proposed wording.
2. Keep the answer narrow. Record exceptions and uncertainty instead of turning general information into a guarantee.
3. Update both English and Polish text, keywords, source label and URL, then set `VERIFIED_AT` to the review date.
4. Increment `VERSION`; otherwise existing database rows will not be overwritten.
5. Run `npm run test:onlo` for the 50-question English/Polish retrieval benchmark.
6. Run `npm run check` for the complete typecheck, test and production-build gate.
7. Deploy Convex. The first production question may take longer while the new version is embedded; later questions reuse the index.
8. Ask representative English and Polish questions in both Onlo interfaces. Confirm that the correct source chips appear and unknown questions receive a limitation response.

## Verification levels

- `npm run test:onlo` proves deterministic retrieval selects the expected article for 50 fixed bilingual questions. It does not call Google or a production Convex component.
- `npm run check` proves the application compiles, all local tests pass and the frontend production bundle builds.
- A production smoke test proves the deployed RAG component, embedding API key, model access and source display work together. This must be run after `npx convex deploy` in the linked project.

## Operational boundaries

- Do not add credentials, private messages, identity documents or participant contact details to the knowledge table.
- A source link proves where guidance came from; it does not prove a listing, person, signature or transaction.
- Keep payment answers explicit: checkout is not enabled, and Relok8 does not collect rent or deposits or hold escrow.
- Re-review legal and administrative records before launch and at least quarterly, or immediately after a relevant law or official procedure changes.
