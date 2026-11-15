# S01 — public EDU/CANONICAL admission v2

This slice changes ONLY the public onboarding entrypoint and its five orientation documents. It does not upgrade historical C72/v1 receipts, execute EDU, install MCP or grant canonical ACTIVE.

| Surface | Default | Verification |
|---|---|---|
| Public onboarding | `host/c72-public-mode-admission.mjs` | `tests/c72-public-mode-admission.test.mjs` |
| Human gate | exact new message `I ACCEPT` | source-head and TERMS digest bound |
| Choices | `EDU`, `CANONICAL` | exact, case-sensitive; `EXPERIMENTAL` rejected |
| EDU | `EDU_SELECTED_NOT_RUNNING` | S02 required to wire original C135/C87/C125 |
| CANONICAL via MCP | `CANONICAL_REQUESTED_NOT_ACTIVE` | authenticated native-event C59 receipt required |
| History | `host/c72-unified-mode-admission.mjs` v1 | unchanged; no synthetic v1 receipts |

## Limits and negative rules

- Self-hashed receipts are integrity hints, not signed proof of provider identity, chronology, human consent or event origin.
- The host must not invent or translate the current human input. There is no path from a v2 EDU receipt to a v1 EXPERIMENTAL selection until S02 introduces an explicit audited adapter authorized by the original consumer owner.
- A native MCP catalog entry, plugin installation or a C136 recovery path does not confer ACTIVE.
- Project prompts and ZIPs are separately rebuilt after the merge at the new source SHA; stale pinned bundles STOP.
- This PR is admission only. The `C72/v1` tests intentionally remain green as compatibility coverage; S02 owns the consumer changes.

## Release gate

Verify all five orientation files at the PR commit, run `node --test tests/c72-public-mode-admission.test.mjs tests/c72-unified-mode-admission.test.mjs`, the S01 policy falsifier and targeted legacy consumers. Do not merge on CI failures.
