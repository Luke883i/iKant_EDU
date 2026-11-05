# C141 Semantic Hardening — LOCAL PRE-PR, not a GitHub PR

**State:** `PREPR_LOCAL_SOURCE_ONLY`. No remote branch, no PR, no merge, no C135 dispatch and no C87/C125 voice created by this proposal. The base checkout has the same Git **tree** as PR #148 head `3e9796801bc21b96b5487086c51659fed93fafc4` (`4055f4f2ed485ca134a0d417c154bc43b56f411c`), not the same rehydrated local Git commit ID. `main` is still source-locked at `3d174674527d74d1b2e52df3e970d14a748cd4b1`. If main changes, STOP_SOURCE_LOCK_STALE and request owner-authorized rebaseline.

## Decision

Do **not** enlarge #148. This is a successor PR candidate only after #148 owner review and a new source epoch admission, if applicable. Frozen C107, C114 and C139 remain original; C135 retains the single runtime owner, C87 the only writer, C125 the only output owner. C141 is a **read-only shadow** that neither dispatches nor writes. No script here is authorized to send messages.

A question can be about any ordinary subject in C140's opt-in scope; this is not literally infinite input length or a bypass of law, provider safety, privacy, C114 safeguards or prior owner grants. Resource caps are physical; overflow must STOP or negotiate a new **finite** capability. Fragments must not be represented as a full original C70 execution. Even perfect byte rejoining is not proof of coherent semantic interpretation.

## 48-atom semantic reticulum

- **A01–A42:** verbatim issue and improvement fields preserved from PR #148's `contracts/c140-e2e-semantic-assurance.json`. PR #148 attribution: **8 bounded tested**, **19 partial**, **15 outside its changed scope**. This is a working engineering classification, not a human-certified issue closure decision.
- **A43–A48:** identity-language collision, cross-chat provider persistence, byte-vs-semantic chunk split, independent evaluator, new source-bound admission, and unknown delivery reconciliation.
- **34** atoms have some locally implementable/testable component; **9** require independent external proof in addition to local preparation; **5** cannot be completed from this chat HOST: **A09 native ingress, A22 provider-registered UI, A27 native authentication, A28 persisted client lifecycle, A44 native cross-chat memory**. External app/platform deployment or user controls are required for the latter; a prompt or code blob cannot install them.
- Delivery plan: **17 C141 candidate issues** (A12/A13/A15/A17/A18/A19/A23/A24/A25/A31/A32/A39/A40/A42/A43/A45/A48), **17 existing/baseline** to preserve and retest, **14 external/product gate** issues. The PRE-PR **closes none** merely by listing it.

## Rationale: 1,000 design candidates

`node scripts/c141-design-1000.mjs` exhaustively evaluates 5 routing × 5 input × 5 epistemic × 8 delivery configurations. **1,000 total, 36 satisfy hard constraints.** Under declared nonempirical weights `(4,4,5,4)`, complexity penalty 2, top candidate **R3-B3-E3-P6** (score 271): typed owner arbitration, finite capability-negotiated fragments, falsifier-based disclosure with independent evaluator as a separate gate, minimized HOST annex plus native NO-GO. This is optimal **only for the declared policy**, not empirically best. At penalty 4 the winner is **R4-B3-E3-P6**; sensitivity falsifies uniqueness.

## What the LOCAL implementation actually proves

- Read-only arbitration: explicit iKant self-identity remains with C114; C139-qualified process remains C139; C132 shadow alone does **not** confer authority; conflicts are stopped for owner review. A prior C140 success path is **not automatically replaced** by this shadow.
- Input capability model: Unicode-safe fragments, full UTF-8 digest, independent byte-exact rejoin and explicit bounded overflow. **No C70 or C87 is invoked.** No promise of truly unlimited input.
- Disclosure model: checks presence of linguistic markers while explicitly returning `semantic_correctness: NOT_ATTESTED`. Requires independent evaluation before claims of efficacy.
- Falsification: a real initial lexical false negative for “incertezza” was fixed; a later 128-fragment boundary was correctly STOPped, so the test oracle was refined; the original failed test logs are retained in the local package.

## Local vs external DoD

Local:
- [x] Exact PR #148 tree matched, no source modifications to frozen owner.
- [x] 48/48 issue IDs and 14 dependency edges with assigned feasibility class.
- [x] 1000/1000 designs ranked, 36 feasible, sensitivity reported, no efficacy claim.
- [x] C141 shadow test, byte-rejoin and adversarial negative checks.
- [x] Original C140/C139/S02 regressions executed without changing their code.
- [ ] C135 integration, typed owner conflict receipts, on-ledger/C125/readback proofs on the new path: **future PR, not this PRE-PR**.

External:
- [ ] Registered and authorized ChatGPT provider entrypoint and identity.
- [ ] Chat-to-chat persistence, refresh and isolated multi-client session, if provider offers this feature.
- [ ] Human/independent efficacy evaluation, real blinded sets, 30-user pilot.
- [ ] New human admission after authorized epoch rotation, owner approval, release and rollback.

**Release:** `PRODUCT_NO_GO`. No universal semantic losslessness or independently verified philosophical truth claim.

## Reproduction

From the local checkout:

```
python scripts/c141-build-contract.py
node scripts/c141-design-1000.mjs
node --test tests/c141-semantic-shadow.test.mjs tests/c141-prepr-contract.test.mjs
node --test tests/c140-open-e2e.test.mjs tests/c139-epistemic-edu-v2.test.mjs tests/s02-edu-v2-original-owner-e2e.test.mjs
```

The candidate's proposed source change list is limited to `host/c141-semantic-shadow.mjs`, `scripts/c141-design-1000.mjs`, `scripts/c141-build-contract.py`, `contracts/c141-semantic-prepr-v1.json`, `tests/c141-*.test.mjs`, `proposals/c141/*`. No modifications to frozen owners or GitHub metadata.
