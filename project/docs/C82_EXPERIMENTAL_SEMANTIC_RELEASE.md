# C82 - Experimental relevance, carrier convergence and honest delivery

Status: bounded runtime improvement and future-work contract, not a canonical ACTIVE release.
The baseline evidence is the October 9, 2026 host-owned audit on main 7553daf.

## What is implemented

- `src/c82-experimental-answer.mjs`: repository-computed task-family selection for ontology, repetition diagnosis, explanation, acquisition, evaluation, comparison and explicit unsupported requests. It returns declared evidence scope and never claims factual verification of a general user question. Existing C70 guard stays higher priority; C71 still labels only repository-owned fallback/guard as eligible for C81 projection.
- `src/c70-experimental-compute-preview.mjs` calls the real C82 composer rather than the unconditional static fallback. It exposes `response_family`, `semantic_scope`, `source_grounding` for diagnostics; none is an owner or native status.
- `host/c82-experimental-carriers.mjs`: post-consent, host-supplied parallel byte providers; first integrity-qualified file per path wins; SHA-256 and original Git blob identity checked; all files required; one C78 writer stages files sequentially and reopens them; legacy and manual carriers may participate. This module does NOT itself implement or assert access to ChatGPT/GitHub provider, and fixture carrier tests are not native host measurements.
- `scripts/c77-build-capsule.mjs` adds C82 to the isolated capsule. No canonical code paths, activation rules or cross-turn writer modified.

## Exact semantic DoD

- Input classification: >=95% *held-out* recall/precision on human-labelled, adversarial ontology, paraphrase and negative-control tasks (not asserted by generated test inputs).
- Pertinence: >=90% independently graded task-specific response quality on tasks actually supported; unsupported tasks must be explicitly reported, not be disguised as a generic useful-looking answer.
- Falsification: 10,000 bounded deterministic input variants, changed-branch assertions, zero forged native/ACTIVE/persistence status; any failure prevents release.
- No semantic accuracy claim based on the count of unique output hashes alone. The C82 composer is only a deterministic class-aware bridge; an expressive owner-validated candidate model is a separate unfinished slice.
- Long input: reject >600 UTF-8 bytes without truncation until a lossless chunk manifest protocol is separately executed and tested.

## Carrier and admission DoD

- Do not run acquisition before exact TERMS/I ACCEPT/EXPERIMENTAL sequence. Never repin silently.
- Up to six real host-provided carriers (including legacy) may fetch in parallel, with bounded workers/deadlines. They are not trusted just because they claim a provider name.
- A verified complete manifest, original blob SHA-1 and SHA-256, reopen, and (for C81 source readback) raw Git Merkle proof are distinct checks. SHA alone does not prove GitHub host origin. Report `source_origin_attested:false`.
- The host may cache qualified bytes by content hash; no cache hit can replace expected SHA checks.
- Human ZIP is the final usable carrier; absence of native bridge is an honest first-open-edge, not a reason to simulate transport.

## UI, history and state DoD

- One minimal per-reply non-sticky header; first natural paragraph is only exact runtime voice if projection succeeded. Diagnostic-only if an edge is missing. Never append an authored explanation to that voice on a normal runtime turn.
- At most three file links: third-person summary, backlog, telemetry; each only after actual creation, write/reopen and verification. A summary built from visible chat excerpts MUST say coverage `VISIBLE_CONTEXT_PARTIAL` rather than `FULL_NATIVE_EVENT_STREAM`.
- Cross-turn state is `UNKNOWN/NOT_ATTESTED` until a genuine writer and later readback. C81 is not native UI delivery, nor canonical status.

## Release scope ledger

| Requirement | Status | Evidence needed next |
|---|---|---|
| C77 capsule includes C82 | IMPLEMENTED | real isolated Node C77/C78/C79/C81 tests |
| C70 task-aware bounded answer | IMPLEMENTED | held-out relevance measurement |
| parallel samehash carrier coordinator | IMPLEMENTED_LIBRARY | callable host transport and monotonic duration traces |
| callable automatic machine-only bootstrap | HOST_DEPENDENT | actual ChatGPT session carrier witness |
| exact runtime UI shell design | SPECIFICATION | client-side accessibility/native screenshot tests |
| owner-verified expressive model | NOT_IMPLEMENTED | real callable model owner interface and factual checker |
| >600 byte input protocol | NOT_IMPLEMENTED | bounded chunk manifest and fuzz tests |
| current and later turns continuous state | NOT_ATTESTED | durable writer plus second-turn readback |
| native chat/third-person full transcript | NOT_ATTESTED | native event stream and causal receipt |
| C72 H95 value acceptance | NOT_MEASURED | >=500 independent tasks, >=50 sessions, >=20 users |

No finite local test bench can prove >95% native product success.
