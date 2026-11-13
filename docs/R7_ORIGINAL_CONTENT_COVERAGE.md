# R7 — Original full-content audit (Git-epoch bounded)

Historical append-only R7/N V7 dossier SHA-256: `9edf313341141564f29f796ce0c4d8144bbb22e262d7bd54f191ae3c375c1d8d`.
Historical HEAD: `b2f550043d5fca89ab1d1efc2ee06a0c7c163f2c` (1,626 tracked files).
Current Git HEAD and file topology differ. Historic original witnesses never become current witnesses by inference.

## Exact-head execution

From a full clean checkout: `HEAD=$(git rev-parse HEAD)`;
`python3 scripts/r7-original-content-audit.py --repo . --expected-head "$HEAD" --out /tmp/ikant-r7.json`;
`python3 scripts/r7-original-content-audit.py --repo . --expected-head "$HEAD" --verify /tmp/ikant-r7.json`;
`node --test tests/r7-original-content-audit.test.mjs`; then existing `npm test`, `npm run check`, `npm run runtime-root:verify`.

The scan reopens every tracked byte using Git cat-file batch, checks the worktree, then independently reopens Git archive HEAD.
The per-file card records exact path, mode, Git blob, SHA-256, structural units, role hypothesis, symbols, typed references,
dynamic/temporal flags and effect signals. Static refs can be indexed; unknown runtime and external consumers remain UNKNOWN.

## Eleven individually falsifiable semantic DoD

| Obligation | Non-compensatory evidence |
|---|---|
| IDENTITY | Exact HEAD, TREE, path, original Git blob and independent byte reopen |
| STRUCTURE | Verified syntax or bounded opaque/binary disposition |
| INTENT | Purpose established from original content and independent requirement |
| CONTRIBUTION | Product/software/research/assurance/archival contribution discriminated |
| SYMBOLS | Propositions or exported/imported semantic units qualified |
| INBOUND | Static, computed and external consumers investigated |
| OUTBOUND | Original dependencies, generators and owner boundaries investigated |
| EFFECTS | Actual writes, routing, authority and side effects observed |
| TEMPORALITY | Current/legacy/archive status grounded in effective consumer paths |
| COUNTERFACTUAL | Independent negative behavior test of disable/relocation |
| RETENTION | Safe rollback/recovery witness, no active consumer lost |

Every generated leaf remains `REQUIRES_FILE_SPECIFIC_WITNESS`; no machine card is a semantic certification.
No SOURCE_CANDIDATE result authorizes retirement, extra writer, provider ACTIVE state or product release.

**Verdict policy:** full original source scan may PASS as indexing only; complete semantic comprehension remains OPEN
until each file has independently validated proof of all eleven dimensions. Native ChatGPT, MCP deployment,
CORA-ENGINE, user benefit and `PRODUCT_GO` remain separate gates.
