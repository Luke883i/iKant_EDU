# PE bootstrap after PR #213 — reverse-derived DoD and minimum handoffs

> HOST_ENGINEERING CANDIDATE · authority=0 · original owners unchanged · **NOT INSTALLED** · no C72/EDU receipt, C135, C87 or native provider delivery inferred. This document and tests are not a second iKant constitution.

## Source and retrograde goal

Engineering base `36b12b72b8cc9e07bb8faff9410e0f92ba60191f`, TREE `58a0694f22d47d70279f0260c863a3bca3e13050` (post-merged #213). Repository ID 1371330383, name still `Luke883i/iKant_LE`. PR #213 updates source-bound first-contact/prompt/root; it does **not** prove a new ChatGPT Project prompt installation. No live-session epoch is repinned by this proposal.

**G_PE:** A novice writes `iniziamo`; sees the pinned Terms; in a distinct message sends exact `I ACCEPT`; after independent original C72 ACCEPT+ORIENTATION readback sends exact `EDU` in the next distinct message; the original C135→single C87 write+independent reopen→C125/S03 same-turn ACK delivers an actual answer to the user without additional technical messages.

Hard constraints remain: first-turn orientation only, immutable Git source, exact human consent and mode as separate turns, original owner and ledger/voice boundaries, no blind replay after an indeterminate effect, separate provider/native proof. **No source-file deletion is permitted by this PR.**

## Formal minimization: what is and is not optimized

Lexicographic constrained optimization: (1) mandatory original human-turn/owner/readback invariants (hard), (2) number of avoidable extra user technical messages = 0 target, (3) repeated source transfers and Host handoffs, (4) measured p95 to first original answer.

| Quantity | Baseline post-213 | Candidate effect |
| --- | ---: | --- |
| Distinct required human messages | 3 | Still 3. Cannot merge I ACCEPT and EDU. |
| Orientation documents | 5 | Still 5, IDs and pinned terms link. |
| Original C72 source objects | 8 + transit + cold seed = 10 | Still 10 identity obligations. |
| Original Project EDU manifest objects | 190 + 1 manifest = 191 | Still 191 identity obligations. |
| Reused same-epoch C72 bytes | 146,163 conditional upper bound | D1 cache→original stager and D3 loader support; not observed in real ChatGPT. |
| EDU full raw source + manifest | 1,994,514 bytes | With 10 validated cached objects, conditional remote bytes 1,848,351 (−7.33%). |
| Original runtime minimum | UNKNOWN | No deletion supported by static dependency absence. |
| Real p95 / success with novice users | NOT MEASURED | Must instrument real carrier and user holdout. |

The byte saving is **conditional** on complete original pinned source being present and reopened in the same epoch; a local function or in-memory plan cannot certify a cache hit. The source-root cannot be reduced to a guessed 6-file C72 semantic subset or a static JS import graph.

## Causal cut set: 31 leaves, 10 AND nodes

`contracts/project-pe-retrograde-dod.json` is a machine-readable, 41-node directed acyclic AND proof model. All leaves are necessary; any missing one prevents G_PE. A source SHA cannot compensate for missing original owner, ledger, voice ACK or provider delivery. The proof ladder is **GIT → LOCAL → OWNER → PROVIDER → EXTERNAL USER VALUE**. An evaluator only returns `MODEL_PASS_SCOPED`, never `ACTIVE` or an original receipt, even when supplied apparently positive fixture evidence.

Explicit order: source HEAD/TREE/identity → orientation/Terms → distinct acceptance → C72 fence/owner/readback → distinct EDU selection/readback → actual observed source courier → stage 10/10 → original 191-file loader → installed prompt equivalence → bound language port → original C135/C87/C125/S03 → provider-delivered ACK → real novice holdout.

## Real original-preserving adapter

`scripts/project-pe-original-bridge.mjs#preparePEC72Stage` consumes only a physically bound source reader. It validates live HEAD, commit TREE, complete path SHA for the 8 original C72 staged files, original first-turn witness and original stager manifest. It uses original `reopenBootstrapCache/storeBootstrapCache` from merged D1, stages with original `initializeRelay/putRelayBlob/verifyRelay`, and returns **STAGE_READY_NOT_ADMITTED**. No owner is called and the missing original transit and seed/attempt fence must still be supplied to E16. Cached corrupted bytes fail closed, never automatically overwritten.

`preparePEPostEdu` first uses D2 `reconcileC72Original` and only proceeds after actual original EDU transit readback. It calls D3 `materializeD123WithOriginalLoader`, which verifies the complete 191-object plan with the **original** loader and independent source readback; it cannot create C135 or deliver speech.

These methods are additive, not yet installed as an automatic ChatGPT Host action. No prompt or BOOTSTRAP owner was mutated. A test fixture binding is not proof that a native GitHub→Node carrier exists in the user's future chat. The existing E16/one-ZIP and P1 fallback routes remain unchanged.

## First EDGE → user instructions (strict three-gesture boundary)

| First observed edge | Host response | Human action |
| --- | --- | --- |
| First message (including if it says I ACCEPT/EDU) | ORIENTATION: show pinned Terms and 5 SHA; stop this turn | Read Terms, then **new message exactly I ACCEPT** if choosing to accept |
| ACCEPT/ORIENTATION original receipt validated | Stop after original full receipt | **New message exactly EDU** if selecting |
| GitHub→Node DNS fails, alternative carrier UNKNOWN | Probe actual argument courier and Node private readback | **None** while real Host recovery is possible |
| Partial original C72 source pre-owner | Reopen staging and fetch only missing SHA-bound bytes, preserve all writes | **None** |
| Corrupt cache, stale HEAD, unknown owner/write/send | STOP / read-only reconcile; no new nonce/owner retry | **None**, never repeat I ACCEPT |
| Actual source carrier genuinely unavailable after probes | Offer one verified official pinned ZIP only where allowed by original contract | Upload only if this is the last real permitted route; never ask for scripts |
| Original EDU is selected, but C135/languagePort unbound | STOP with NO_VOICE; do not produce Host substitute cognition | **None** |
| Native provider delivery/installed prompt unreadable | UNKNOWN, not success. Preserve original receipts. | **None** |

## Falsification and gates

`tests/project-pe-retrograde.test.mjs` verifies original C72 staging in a real Git checkout with Git HEAD/TREE and real original file bytes, including cold→warm cache (8 downloads → zero on second stage), source digest/permission readback, cache corruption, stale HEAD, unknown owner, unbound source, unknown EDU receipt and counterfeit Host evidence.

`scripts/project-pe-retrograde-falsify.mjs` defines 40 finite semantic scenario families; 10,000,000 seeded evaluations with a separately implemented algebraic oracle, metamorphic monotonicity, distinct-signature count, exact stream SHA-256 and no generalization to 10M real users. CI runs it independently of normal unit tests; target zero discrepancies. Results are not a native provider receipt. A finite negative vector set cannot prove universal safety.

**V5-G release gate:** first independent engineer reviews source/supply-chain, anti-replay and unknown effects; second reviews original C72/C135/C87/C125, UX and no extra gestures; finally an authorized human decides. PR green alone is not review or installation. Field launch still requires a fresh original C72 epoch in an actual ChatGPT Project, provider callback binding and two successful original cognitive turns, followed by novice holdout to assess reliability and time to first answer.

**DoD result represented by this PR:** implementable and falsifiable *source/Host candidate*. `G_PE = NOT_ATTESTED` until field owner/provider/user evidence is independently reopened. No claim of product completion, p95, native persistence or ≥95% value.
