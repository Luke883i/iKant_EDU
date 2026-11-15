# EDU single experimental product — original-owner-safe runtime candidate

## Why
The previous bundle prompt used legacy INDEX / `avvia iKant` / `EXPERIMENTAL`, contrary to the current C72/v2 onboarding. It also made C70/C124/C126 universal in ways incompatible with the existing C135-controlled C140 open-topic child. The previous contract `08aceef65b28fded68d66df671ebb27d8dcaacfc` was an unprivileged Host-only proposal, not executable runtime.

## What this PR actually implements
- Adds one **read-only Host boundary checker** with ten enumerated nonclaims, never owner permissions.
- Connects it to `startOneShellEdu` both before original C135 startup (waiver input validation only) and *after* original `publishTurn` and `readSessionState`.
- Rechecks one original C87 append, original input SHA, exact nonce, owner-vs-ledger event hash, C125/S03 UTF-8 bytes, and explicitly `original_c70_executed:false` for C140.
- Preserves private OneShell owner-frame WeakSet and all original C72, C135, C87, C125 source, dispatch and writer functions.
- Rejects any uncertain post-effect check, blocks further turns without replay, preserving original C87 recovery as the only authorized recovery path.
- Replaces legacy experimental bundle instructions with C72/v2 orientation, distinct acceptance, distinct EDU and C140-specific cognitive disclosure.

## Nonclaims
The ten named waivers cover provider identity, MCP/C59, cross-chat, native UI, presentation-only DOCX, installed prompt, model evaluation, SLA/HA, release approval and ancillary documentation. These **only narrow claims** and do not waive the manifest, original owner gates, human acceptance, source bytes, ACK, safety or readback.

## Test scope
`node --test tests/edu-experimental-product-boundary.test.mjs tests/project-oneshell-edu.test.mjs tests/c135-cognitive-edu-owner.test.mjs tests/c140-open-e2e.test.mjs` (run only tests actually present in the reviewed commit). `node tests/edu-experimental-product-boundary-falsify.mjs` runs a reproducible million predicate mutations. These are finite software fixtures, not a million LLM turns or native provider events.

## Historical failures
PR #118 verified an exact carrier but not native message transport; #148 uncovered false ontology denial and inspired C140; #164 repaired C135 ACK / fake EXIT decoration; #176 documented connector-to-Node bridge uncertainty; #180 exposed a candidate pre-EDU ZIP route; #185 showed C72 digest-only continuity problems; #192–198 accumulated source and CI gates without proving Host installation.

## Open field gates
Main prompt installation equivalence, live Github-to-Node carrier, distinct owner C72 receipts in a new human session, native provider delivery, real semantic evaluation and independent release authorization remain UNKNOWN. No main/branch changes to the active SOURCE_LOCK are implied by this draft PR.
