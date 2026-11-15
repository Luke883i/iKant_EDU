# OneShell Session UI v1 — candidate contract, not provider release

**Source:** pinned source-controlled PR head; no changes to original C72, C59, C70, C87, C125 or acceptance. The current branch is a candidate. Do not re-pin canonical `main` until a separate owner-authorized merge and release.

## Target and owner split

Human target: one logical six-region iKant panel throughout a ChatGPT conversation. The authoritative original owner remains the runtime. `host/p1-app-exclusive-shell.mjs` qualifies original voice; `host/oneshell-thread-session.mjs` is a strictly read-only view snapshot and local continuity check. The existing MCP server verifies gateway-bound session metadata, attaches a presentation sequence, and returns a snapshot; its HTML iframe updates the same six DOM regions and rejects mismatched session/sequence/digest. None of these layers can mint a native human event, a C87 write or a C125 send.

The `IKANT_ONESHELL_THREAD_PANEL=1` deployment flag opts in to `_meta['openai/ui'].entrypoints=[{type:'thread'}]` on the existing app-open tool. Default remains off until the operator completes a real ChatGPT client qualification. A thread-capable metadata declaration is **not proof** of actual panel persistence. The existing legacy deployment server is compatibility-only; CANONICAL C59 still requires genuine native identity before ACTIVE.

## UX and failure handling

Six logical slots are immutable: ESITO, A, B, PROVA, EDGE, NEXT. A is visually primary and exact; B and PROVA are disclosure sections. Rendered text uses `textContent`, never `innerHTML`. The browser verifies shell bytes, owner projection digest and thread snapshot digest before display. If an incoming session binding changes, the presentation sequence moves backward, voice SHA mismatches or a same-sequence voice forks, display `NO_VOICE`, report the first blocker and STOP. A session update never causes another runtime write. Browser reload is **not** evidence of original runtime continuity; any rebind is a fresh view initialization.

`host/p1-postmode-source-handoff.mjs` exposes source ZIP only when a genuine C72/v2 mode selection already exists AND source is confirmed absent. With source present or unverified, never demand a ZIP. This helper is only microcopy; it does not execute C72 or infer human consent.

## Proof gates / DoD

**G0 source & admission (testable locally)**: pinned Git HEAD/tree, original exact TERMS and C72 messages; post-mode first legal blocker gets direct HEAD ZIP link; no early upload request. Tests `p1-postmode-source-handoff.test.mjs` plus existing C72 tests. Actual UI launch must not alter the human gates.

**G1 source-backed view (testable locally)**: fixed six slots, same voice bytes+SHA as original verified source, bad frames fail closed, no semantic retention/native identity claim, no second writer. Tests `oneshell-thread-session.test.mjs`, existing P1 tests.

**G2 session UI (partially testable)**: ten locally simulated presentation frames on one binding; tamper, replay, cross-binding, stale and divergence rejected; six DOM regions, accessibility and text safety checks. **Not proven**: one installed authorized ChatGPT panel remains visibly mounted for 10 real human turns. Browser capture, panel lifecycle and source receipts mandatory for product GO.

**G3 product (not remotely proven)**: registered authorized MCP plugin, actual panel and authenticated native ingress, reconciling interrupted write/send, WCAG checks, 30 unassisted people with >=27 successes and correct comprehension, owner approval and postmerge CI. CI PASS must not claim these results. C59 CANONICAL remains separate.

## Release + rotation

The existing `scripts/p2-build-oneshell-release.py` is the canonical package generator for these release inputs. It reads original repository blobs, computes a pinned prompt and reproducible ZIP and rejects dirty source and stale HEAD/tree. New adapter modules are included as original source blobs. **On merge, regenerate BOTH prompt and ZIP from the actual resulting `main` HEAD/TREE** (squash or merge changes SHA), independently verify hashes and compare the live branch again. Old prompt and ZIP are historical for the old pinned commit only and must fail closed if used as the *current* build. Replacing the Project prompt, uploading its new ZIP and installing/updating the plugin are separate human/provider actions; no tool claim substitutes them. Keep previous package for rollback with its original lock; no auto-upgrade.

## First release blocker

`PRODUCT_CHATGPT_THREAD_PANEL_AND_NATIVE_EVENT_NOT_ATTESTED`: native registered app/panel, lifecycle captures, original per-turn delivery and real user pilot still require an operator. Until proven status is `SOFTWARE_CANDIDATE_ONLY`, **not ACTIVE** and not persistent UI attested.

## P0: readiness vs provider UX

`host/p0-thread-panel-readiness.mjs` is a **HOST disclosure only**, attached to MCP result metadata after a gateway-bound session and read-only snapshot. It reports `THREAD_PANEL_FLAG_OFF`, `GATEWAY_SESSION_BINDING_UNVERIFIED`, `THREAD_SNAPSHOT_NOT_VERIFIED`, or `PROVIDER_REGISTERED_THREAD_PANEL_NOT_ATTESTED`, without ever asserting that ChatGPT mounted the widget. A source-level configured panel is not visible/persistent merely because the environment flag is on. Without an actual registered and authorized app, use the six-slot text fallback; neither the helper nor CI can turn native flags true. Deployment and real browser/pilot evidence remain release blockers.
