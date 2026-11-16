# C140 / S10 — semantic E2E runtime assurance (EDU/v2 candidate)

**Base SOURCE_LOCK:** HEAD `3d174674527d74d1b2e52df3e970d14a748cd4b1`, tree `edc1e859d6688ebfd17788e115748ff200289736`. New proposed source epoch requires its own C72/v2-qualified admission; previous human messages are never silently upgraded. This PR does **not** change main, C72/v1, C107, C114, C139 or C137.

## Scope, reticolo, falsification

- Seven abstraction levels, 42 unique issue atoms A01–A42. First 30 are carried from the earlier HOST audit; new A31–A42 address topic openness, finite I/O resources, full-input digest, non-impersonated C70, C125/S03 compatibility, privacy, and irreducible epistemic uncertainty.
- `contracts/c140-e2e-semantic-assurance.json` is the versioned semantic **index**, not an assertion of universal semantic losslessness. Cross-edges explicitly route SOURCE_LOCK → C72/v2 → C135 → C140 → C100 → one C87 → independent reopen → C125 → S03 → external S09 gate. All 42 issues have an ID, improvement, owner, status, negative condition and measurable DoD field.
- `scripts/c140-qualify.mjs` enumerates 1,000 **synthetic** combinations (5×5×5×8), selects R4-A4-W4-E7 under published ordinal weights, 20 technically feasible. This is an engineering *policy*, not experimental evidence of optimal model reasoning; changing weights can change preference.
- C132 is **not purely advisory** in this candidate: for a short `SELF_ONTOLOGY` episode, its `GENERAL_ONTOLOGY` candidate serves as a *decision-support condition* for C135 to choose C140. The direct-identity veto and C139 precedence remain in C135. This scoped behavior is not semantic correctness proof; independent classifier arbitration is deferred to a follow-up PR.
- The first negative run found a **real collision**: C132 called a direct `chi sei?` prompt general ontology, incorrectly choosing C140. The third local semantic commit fixed precedence: explicit self-description stays on frozen C114, qualified response-generation requests stay on C139. The unmodified frozen Git blobs are asserted in regression tests.

## Open conversation versus boundless processing

No topic whitelist is used in the opt-in `openScope:true` child path: general questions are processed independently of topical keywords. The observed 557-byte normative-epistemology misroute is also explicitly disambiguated. UTF-8 is hashed **in full** without truncation. The C100 transport budget is still 12,000 input bytes and the HOST model/delivery budgets remain finite; it would be misleading to advertise literally infinite input. Credentials and clearly sensitive text are denied under prior privacy policy, and upstream safety/provider/legal restrictions continue to apply.

Long-input C140 never runs C70. Receipts explicitly show `original_c70_executed:false`; original C100/C87 and C125 are the only reused effect owners. A separate tagged C140 receipt is fully validated by original C125 and S03 so it cannot spoof historical C107/C139 evidence. The source-only CI tests are NOT provider-native events.

## Measurable DoD checklist

| Gate | Closure rule | Status |
|---|---|---|
| G1, issue index | 42 unique indexed atoms, owner, improvement, status and linked edges; 7 levels | Automatable, see lattice test |
| G2, frozen original | C107 and C114 blob SHA-1 pinned, C139 original tests green | Locally tested |
| G3, one writer | Exactly one C87 append, independent physical reopen, C125 at most once | Locally tested |
| G4, full input | 557-byte case and >8 KB arbitrary-topic case: SHA-256 equals full UTF-8, C70=false | Locally tested |
| G5, correct epistemic claims | No unsupported positive native/consciousness claim; truth remains NOT_ATTESTED | Heuristic negative test only |
| G6, alternative ranking | Exactly 1,000 candidates and reproducible published scoring | Locally tested; no empirical optimum claim |
| I1–I7 | source+admission, noncollision, privacy, C100 ack, C87 reopen, unknown C125 stop, no-go | Bounded unit/e2e tests; external portion OPEN |
| P1–P9 | philosophy positive, C114/C139 separation, large input, overclaim denial, nonce/replay, forged receipt, unknown stop, atom index | Automated negative checks |
| Native ingress | Provider-authenticated session event and real registered adapter; 0 forged natives | **OPEN_EXTERNAL / NO-GO** |
| Client & pilot | 30 unassisted users; ≥27/30 success; real refresh/accessibility/isolation and native delivery receipts | **OPEN_EXTERNAL / NO-GO** |
| Model efficacy | ≥300 blind real-model comparison pairs per route; independent counterexamples | **OPEN_EXTERNAL / NO-GO** |
| Final release | Explicit human approval plus rollback and post-deployment observability | **OPEN_EXTERNAL / NO-GO** |

### Scope split / follow-up contract

PR #148 is limited to the C140 EDU candidate, regression tests, and source/documentary coherence. A later source-bound PR must own semantic arbitration (A13), input budgeting and long self-identity (A15/A31/A32), semantic assessment and privacy retention (A39/A40/A42), and real client/pilot evidence (A21/A22/A27–A30/A41). None of these DoDs is claimed closed here. Source epoch and human admission must be requalified for that future PR; never infer product activation from CI.

### Local reproduction

Run `node --test tests/c140-open-e2e.test.mjs tests/c139-epistemic-edu-v2.test.mjs tests/s02-edu-v2-original-owner-e2e.test.mjs` and `node scripts/c140-qualify.mjs` in a clean Git checkout of the branch. Source HEAD selection is recomputed from that checkout. Do **not** use old admission receipts to activate the proposed new epoch. Unknown delivery is a STOP requiring read-only reconciliation, never a blind retry.

### Falsifiers and nonclaims

An identity prompt entering C140, a mismatched C100 ack, an extra C87 entry, changed voice bytes at C125/S03, a forged native status, or an automatic retry after unknown send falsifies software qualification. Passing these checks does not prove complete natural-language safety, semantic preservation of all possible concepts, independent provider event provenance, long-term persistence, native ChatGPT UI, efficacy, or real pilot success. **PRODUCT_NO_GO** remains mandatory.
