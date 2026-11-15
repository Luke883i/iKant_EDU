# EDU C126 — Post-124/125 hardening and release contract

GitHub main read at audit start: `19e9b30380c42ffea0c77db7661cc9eeb0b73455`; PR #124 and #125 merged. Candidate PR #126 adds a structural validator to the **existing PR119 HOST flow**, not a new C70 mind, ledger owner, C87 writer or native ChatGPT UI interceptor.

## Failure mode falsified

The previous PR119 pre-language gate verified channel count, `included`, `authority` and agreeing SHA, but did not constrain the role, grammatical source-prefix, canonical non-included data, source flags or hidden properties. A recomputed digest can accompany a forged role or self-promotion. C126 rejects these before invoking the model and before C114/C87. This is **defense in depth**: the source preview is already owner-computed, and the audit has not demonstrated an unrestricted external injection path.

C126 enforces 12 ID/ROLE pairs with original prefix, canonical source/authority/inclusion, original `not_included` exclusions, false provider/causality status, exact 64-hex SHA digest and input. Reject Proxy, accessor, nonenumerable property, symbol, sparse array, Unicode format/control characters and extra fields. Legacy C107 without C124 overlay is unchanged.

## Minimal engineering lattice

| Tier | DoD and metric | Boundary |
|---|---|---|
| L0 source | original C107 pin, C124 overlay and actual Git SHA separated; 0 false activation from PR receipt | content-addressed exact source |
| L1 host compute | 12/12 source C124 channels, complete roles/phrases/exclusions and no getter invoked before model | C126 direct Node + original PR119 tests |
| L2 ledger | C70 computed first, double protocol ACK, original C114 before C87, independent nonce/input/hash reopen | original PR119/C87 unchanged |
| L3 UI | C125 fixed shell and exact A, no fake DOCX/other native claims | HOST controlled sink only |
| L4 language quality | blinded independent real-model ablations, >=300 paired/rated samples per channel, safety nonregression | OPEN: not inferable from an ACK or hash |
| L5 release | 1,000,000 typed policy cases, 4,096 direct JS mutants, source-original CI; human review and new main readback | machine-checkable CI + external |

## Audit, limits, cleanup

Observed strengths: PR124 confines assistant-controlled shell to a single send; PR125 covers 12 bounded computed linguistic obligations with a bound C87 original receipt; C77/C104/C105 cardinality and Git-blob closure were fixed by the merged PR. Open constraints: C114 five-line mixed-intent rigidity, actual provider/model improvement, inter-chat ledger ownership, native ChatGPT per-turn output lock, and genuine DOCX delivery. Reusing the original C107 carrier plus the C124 exact three-blob overlay avoids a second runtime and avoids rewriting an immutable historical carrier.

Deterministic finite policy campaign (seed `0xc126202610140001`, 24 families) is NOT one million real LLM inferences, language evaluations or native UI captures. The Project V19 companion bundle reuses byte-exact V17 payloads, includes source candidate receipts and keeps `00_HOST_CONTRACT.md` as its sole operative contract. Until merged, represent PR126 as a **candidate main projection**, never actual `main`.
