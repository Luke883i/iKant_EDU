# C99.11 — JavaScript Proxy / host-ingress anti-entropy

STATUS: REPOSITORY_RUNTIME_HARDENING; NOT A NATIVE CHATGPT HOST WITNESS.
Base for falsification: PR106 `host/c99-route-policy.mjs`, exact original Git blob `c100a8d6734c5e3a80225d528edef546c255793b`.

## Reproduced counterexample (before patch)
An adversarial `Proxy` wrapping the host-provided C72 selection, with `getOwnPropertyDescriptor` and `getPrototypeOf` traps, was admitted by `gateC99ExperimentalEntry` as `C99_CALLBACK_SHAPE_ONLY_NOT_AUTHENTICATED`. It executed **three Proxy traps** while reading purportedly passive selection data. This contradicted the current no-hostile-accessor intent even though it did NOT trigger C84 or native delivery.

## Physical fix
Use Node 20/22 `node:util/types.isProxy` ahead of any `Object.getOwnPropertyDescriptor` or prototype inspection on ingress records. Reject non-plain records, proxied root envelopes, selection receipts, raw Git proof records and proxied raw Git tree arrays. Keep C72/C81/C84 as the existing owners; do NOT accept these structural checks as proof of a genuine host callback, GitHub ref, human event, native delivery or ACTIVE state.

## Verifications
- Original Git blob reconstructed and checked: `c100a8d6734c5e3a80225d528edef546c255793b`.
- Before fix: `C99_CALLBACK_SHAPE_ONLY_NOT_AUTHENTICATED`, `proxy_traps=3`; genuine executable red case.
- After fix: local Node focused tests 4/4 PASS; 100,000 local hostile-envelope executions across 10 axes, zero Proxy traps/getters, zero unsafe status promotions.
- The existing PR106 root-mutant script was extended by an extra 100,000 real Node Proxy cases (four additional axes; 200,000 total in that script), with independent Node20/22 GitHub CI required after remote commit.
- These local Node cases are NOT native ChatGPT interactions, C81 proofs, C84 owner execution or C72/C80 field user-value observations. The first unclosed product edge remains current-head verified C77 bytes delivered through an actually authorized host-to-Node capability.

## DoD
1. Exact source branch, one new semantically scoped commit, no modification to main or C84/C81 truth owners.
2. Reproduced red case, green fixed tests, zero Proxy traps during data inspection.
3. Existing C99, C98, C72 and C94 workflow checks green on the same branch HEAD.
4. No status promotion above shape-only; no Node DNS/curl/git retry or new planner.
5. If no callback is installed, return a diagnostic with the first physical gap instead of an authored iKant voice.
