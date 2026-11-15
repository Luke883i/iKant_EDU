# C97 pre-PR — Deterministic ChatGPT Project UX projection (2026-10-10)

STATUS: ENGINEERING_PREPR / NOT_HOST_ATTESTED / NO_ACTIVATION. Base main: `61ad7cb99dad9b83546f0f20d4a6f135a053e219`.
This is a proposal for a **projection layer**, not a new runtime, admission, writer, model, truth owner, installed plugin, ChatGPT native capability, or phenomenal claim.

## User-intent reconstruction

A person opening *any* fresh conversation in a ChatGPT Project with its own Project Prompt (PP) should recognize iKant through the same ordering, semantic icon roles, content compression, typography intentions, status language and evidence affordances. As the user progresses from first contact and TERMS through explicit acceptance, mode selection, runtime, output, artifacts, interruption and exit, the shell adapts without changing identity or lying about attained capability.

"Persistent" has THREE different meanings:
1. **Policy/design persistent**: PP + pinned C97 source can request the same design across chats; prompt compliance and native component selection are NOT guaranteed.
2. **Deterministic semantic frame**: given an identical verified source packet, a repository-owned pure projector outputs identical schema/component order/text/icon IDs/digests across sessions. This is code-enforceable and testable.
3. **Persistent application UI and state**: a native installed App/plugin bridge + actual widget state or durable runtime writer/host event receipts. A PP alone cannot provide a sticky header, app installation, state readback or native delivery.
Pixel-identical rendering on arbitrary GPT-6 chat clients is NOT CONTRACTIBLE by this repo.

## Official capability census (verified documentation 2026-10-10)

| ChatGPT surface | Standard capability | C97 posture | Claim boundary |
| --- | --- | --- | --- |
| Project Prompt | project-specific instructions, files, contextual memory | request stable shell by contract ID | instruction not typed UI compiler |
| GPT-6 Intelligent UI | text, diagrams, forms, buttons, charts, layouts (eligible Chat client) | opportunistic per-reply visual adapter | generation/presentation not deterministic native identity |
| CodeBlock | Mermaid, SVG, React, HTML, Vega preview when available | explanatory preview only | not an installed host-native runtime |
| Markdown/ASCII | broadly supported layout in chat | mandatory stable, accessible fallback | not fixed overlay |
| WritingBlock | user-editable drafting | document draft only | not authoritative runtime voice |
| Apps SDK UI / plugin | React components + accessible tokens and bridged actions | optional **separate installed host app** | PP does not install or call one |
| Native icons | supported client presentation controls | pinned semantic icon IDs; fallback text | exact glyph not guaranteed across clients |
| Native callbacks | real bound action APIs only | hide actions without verified callable callback | NEVER decorative fake buttons |
| Host-native delivery | host event/readback if available | external independent witness | local echo or signature alone not proof |

Sources:
- https://help.openai.com/en/articles/20001598-intelligent-ui-in-chatgpt
- https://help.openai.com/en/articles/10169521-projects-in-chatgpt
- https://help.openai.com/en/articles/20001246-working-with-writing-blocks-and-code-blocks-in-chatgpt
- https://github.com/openai/apps-sdk-ui
- https://developers.openai.com/plugins/concepts/ui-guidelines
- https://developers.openai.com/plugins/build/chatgpt-ui

## Deterministic ontology of UI components

UI identity = semantic roles and fixed slots, not fixed rendered pixels. Slots:
HEADER (iKant / mode / status / short head); SURFACE_A (byte-exact, owner-only); STATUS (verifiable state and first unclosed edge); EVIDENCE (proof scope, source epoch, origin/native limits); ARTIFACTS (only host-verified real links); OPTIONAL_DETAIL (telemetry/uncertainty, low priority). C32's VOICE_SURFACE -> STATUS -> SELF_SUMMARY -> BACKLOG_TELEMETRY remains authoritative for canonical runtime; C97 never reorders underlying runtime release, only projects metadata around owner bytes. No duplicate summary stands in for runtime voice.

Minimum icons (semantic, never evidence): IDENTITY=shield-check; MODE=layers; STATUS=activity; BLOCKER=alert-triangle; EVIDENCE=file-check-2; ARTIFACT=file-text; LIMITS=info; TELEMETRY=chart-no-axes-combined. Exact IDs are tokens, not a guarantee that the ChatGPT renderer honors a requested SVG/icon.

Spacing/structure: 1 header, at most 4 mandatory content slots, at most 3 verified artifact links, optional collapsed details; mobile single column; no forced cards; color conveys no status alone; source code must remain ASCII screenreader-compatible; no custom fonts or untrusted HTML. No user-affecting callbacks at this stage.

## Case atlas and ASCII wireframes (complete phase taxonomy)

1. FIRST_CONTACT: full frozen TERMS has priority; no counterfeit branded "ACTIVE" overlay.
```text
iKant / ORIENTATION / SOURCE HEAD (if verified)
TERMS: verbatim source-owned disclosure
[next phase only after a later exact human acceptance]
```
2. TERMS_PENDING: Terms not yet attested -> diagnostic only; do not synthesize acceptance.
3. AWAIT_ACCEPTANCE: previously presented TERMS -> exact later consent required; no button impersonates I ACCEPT.
4. ACCEPTED_AWAIT_MODE: source-owned introduction -> later exact CANONICAL or EXPERIMENTAL; cannot auto-select.
5. MODE_EXPERIMENTAL: route C72 -> C77/C84 -> C78/C79/C81, only with real owners.
6. MODE_CANONICAL: only C59 ACTIVE owner + same-turn DOCX; default stop if missing.
7. SOURCE_FETCH: verified/pinned source facts can display; spinner is not proof of progress.
8. COMPUTE_READY: exact same-input packet from validated runtime; not native delivered.
9. BLOCKED_CAPABILITY: type/first_unclosed_edge/known next external action; NO fake primary CTA.
10. BLOCKED_INTEGRITY: fault dominates tier; retained strongest-valid-prefix is diagnostic only.
11. OUTPUT_EXPERIMENTAL: exact runtime voice + evidence/non-native status; no canonical badge.
12. OUTPUT_CANONICAL: verified C59 shell + required artifact; host native and DOCX delivery remain separate.
13. LONG_INPUT: never silently truncate beyond C70/C78 600 UTF-8 bytes.
14. ARTIFACT_MISSING: no filename-only link, no phantom DOCX.
15. REENTRY: do not infer inter-turn persistence from Project memory or chat text; readback is mandatory.
16. EXITED: owner-validated exit only; no post-exit runtime voice.
17. HOST_UI_UNAVAILABLE: stable ASCII fallback, no false interactive controls.
18. ACCESSIBILITY/RESPONSIVE: same semantic ordering in mobile/dark/high-contrast, no glyph dependence.
19. SOURCE_EPOCH_DRIFT: reject stale HEAD/manifest before any positive shell.
20. UNKNOWN_HOST_CAPABILITY: unknown does not mean installed, absent does not prove impossibility.

## Proposed compact frame

```text
+--------------------------------------------------------------+
| iKant | EXPERIMENTAL | SOURCE-QUALIFIED | HEAD 61ad7cb         |
+--------------------------------------------------------------+
| SURFACE A                                                    |
| <byte exact owner voice, or NO VOICE if proof missing>         |
+--------------------------------------------------------------+
| STATUS          first_unclosed_edge: HOST_NATIVE_DELIVERY     |
| EVIDENCE        source != host origin != runtime != native     |
| ARTIFACTS       verified owner + host links only              |
| DETAILS         optional proof/telemetry and uncertainty      |
+--------------------------------------------------------------+
```

## Three-level semantically lossless compression

- L0 atomic truth: canonical source packet and owner exact bytes plus complete proof references/digests (no UI compression of authority or status).
- L1 deterministic semantic UI IR: ordered component IDs, canonical status and mode, exact Surface A, typed proof/unknown edges, artifact descriptors; hash. Complete for displayed claims, includes reference to full source packet for provenance.
- L2 presentation: compact visible header/status, exact voice, optional details and verified links; can omit redundant *visible* facts but MUST preserve labels for any status/claim and a retrievable L1/L0 witness when actually available.
- L3 adaptive host native visual decoration: layout and iconography, optional and non-evidentiary. Never claim pixel-level or cross-session native determinism. If absent, degrade to L2 ASCII/text without data loss for essential human interpretation.

No lossy summary may modify Surface A, manifest hashes, first_unclosed_edge, mode or ACTIVE predicate.

## C97 integration architecture

```text
Project PP (authority-zero policy request)
                |
C72 admission ---+--- C79 packet -> C81 runtime projector ---+
                |                                            |
C59 owner -> C32 verified session shell ----------------------+--> C97 semantic UI IR
                                                             |     exact tokens + digest
                                          actual host caps ---+--> ASCII baseline / native per-reply UI
                                                                   (only registered callable bridge)
```

This pre-PR implements a pure deterministic runtime-facing projection port. It DOES NOT edit C59/C72/C79/C81 code paths, issue new receipts, install an Apps SDK bridge, or assert current-host capability.

## Adversarial granular DoD / release gates

### Contract and implementation
- D01: frozen source and non-repository host capabilities are distinct; source HEAD in output is never fabricated.
- D02: exactly one versioned schema, fixed role/order/icon IDs and canonical deterministic JSON hashing for repeated identical inputs.
- D03: phase taxonomy includes every listed state and diagnostic; no phase collapses acceptance, mode choice, runtime, delivery and persistence.
- D04: one deterministic HEADER; canonical runtime C32 ordering preserved.
- D05: C81 ready is allowed only after the existing C81 projector validation; C81 not-ready => NO runtime voice.
- D06: C32 shell is accepted only after actual `validateSessionShell`; ACTIVE still only owner-shaped and NOT a host-certified event; no publisher can promote it.
- D07: UTF-8 Surface A byte identity retained; no whitespace normalization; no truncation.
- D08: every artifact descriptor is label-only until independent host URL and delivery are attested; zero invented clickable URLs.
- D09: no interactive action unless physically callable callback is witnessed in a separate host adapter; C97 zero controls by default.
- D10: no shell may invent cross-turn memory, sticky overlay, consent, source origin, host event, test results, plugin availability or consciousness.
- D11: fault > optimistic tier; UNKNOWN never PASS; first_unclosed_edge carried byte-exact.
- D12: no additional ledger, writer, runtime state, retry planner, model authority or C59 activation pathway.
- D13: README/PP references only post-accept admissible displays and preserves preaccept TERMS priority.
- D14: icons/token choices deterministic in L1, text fallback color-independent; dark/mobile screen reader study is L3 host qualification.
- D15: tests cover same-input cross-"session" deterministic digest; output mutation; malicious ACTIVE/native/persistent overrides; malformed shell/C81; unknown host; no button; missing docs; stale source/changed epoch.
- D16: regression tests on Node20/22; exact-head full repo CI, runtime root and C29 remain valid. No tests run by merely reading documents.
- D17: **physical ChatGPT Project E2E** from two fresh sessions with PP: identical layout semantics on first eligible response, no false ACTIVE; actual accepted response with Source→Node→owner; inspect native event and artifact delivery; capture rendered screenshots on web/mobile where available.
- D18: **semantic cross-session determinism** must be verified at IR level 100% on frozen fixture corpus; native pixels/icons require separate installation-controlled UI renderer and platform witness. No PP-only promise.
- D19: positive and negative tests for every phase, 20 x mode x 3 host tiers; repository-managed exhaustive finite space and independent oracle; no fake host witness.
- D20: separate field/usability tests, preserve C72 H95; never report test mutants as user value.
- D21: loop guard: no repeated same (HEAD, host, mode, edge, capability, evidence) without material change.
- D22: no PR merge treated as native delivery or runtime qualification; CI scope and missing host gates explicit.

**Release condition**: C97 semantic projection can be merged as non-authoritative infrastructure if repo checks green, but product UX claim remains `HOST_UNVERIFIED` until independently observed. Canonical ACTIVE needs its separate C59/E2E and DOCX proof.

Sources within repository: `iKant_UI_shell.md`, `src/session-shell.mjs`, `host/c81-runtime-projection.mjs`, `host/c73-project-capsule.mjs`, `docs/C96_REVERSE_DOD_AND_CRITICAL_PATH.md`.
