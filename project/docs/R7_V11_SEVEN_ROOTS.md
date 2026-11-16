# iKant_EDU R7 V11 — Seven roots, without erasing product ownership

## Purpose and epistemic boundary

Reduce Git root directories from 15 to 7 and root-level files from 15 to 9. This is a **candidate migration**, not evidence that Project EDU or standalone MCP works in a native ChatGPT or external OAuth deployment. Preserving historical SHA pins and the original provenance is a strict obligation; do not silently repin them for the new layout. Existing source checks were designed for the previous epoch and must be requalified independently.

## The seven canonical roots

| Root | Responsibility |
| --- | --- |
| `.github/` | GitHub Actions and automation entrypoints |
| `contracts/` | Normative schemas and governance registry (`contracts/governance/`) |
| `host/` | Host-side adapters and original product owners (not moved) |
| `project/` | ChatGPT Project entrypoints, docs, visual assets, plugin surface, release and baseline |
| `scripts/` | Developer commands, builders, audits and CORA-METHOD gates |
| `src/` | Runtime source and content-addressed runtime root shards |
| `tests/` | Tests, fixtures and historical evidence, now under `tests/artifacts/` |

Root files retained: `.gitignore`, `ADMISSION.json`, `AGENTS.md`, `BOOTSTRAP.json`, `LICENSE`, `README.md`, `TERMS.md`, `ikant.mjs`, `package.json`. They remain where external consumers expect them, including first-turn Project EDU admission.

## Moves

Eight old roots have been relocated, not deleted: `artifacts -> tests/artifacts`, `assets -> project/assets`, `docs -> project/docs`, `governance -> contracts/governance`, `plugins -> project/plugins`, `project-baseline -> project/baseline`, `release -> project/release`, `runtime-root -> src/runtime-root`. Six non-essential root files were relocated under `project/docs`, `contracts`, or `project/release`. Do not assume all existing downstream consumers have adopted these paths.

The migration starts from the **V10 local source snapshot**, whose original source tree was independently matched to GitHub main `8cb80d2230919220ac4b7a1cfcd80950d8467848`. The snapshot's Git commit history is synthetic. The V11 candidate must not be merged as if the historical GitHub ancestry were recovered.

## What was actually exercised

A source-bound readback validates a one-to-one map of original files and preservation of modes; lexical ESM imports and relative Markdown links are checked against the path mapping. The seven runtime shard descriptor and the Project EDU source manifest were regenerated. Five native smoke commands and further C104/C77 tests were executed on candidate commits. These are **scoped**. The full original suite on the first mechanical candidate failed, surfacing legacy path contracts and V5-B/CORA provenance pins. A full independently qualified test/CI receipt on the final commit is not yet available.

## CORA method and executable checks

CORA's backward method: A0 well-maintained seven-root repository requires (AND) topology, no source loss, path continuity, native behavior, preserved authority, maintainability and recovery. Independent reviewers must inspect **actual Git commits**, test failures and the old-to-new file registry. No graph-based or test-only assertion is a product approval.

From a cloned Git bundle:

```sh
python3 scripts/r7-v11-seven-root-gate.py
npm run contraction:source-verify
npm run runtime-root:verify
npm run check:mcp
npm run check
npm run qualify:project-session
npm run qualify:v1:product
npm test
npm run contraction:global-gate
```

`contraction:source-verify` tests only topology/provenance and static path relationships. `contraction:global-gate` intentionally exits 20 while independent runtime, complete suite, CORA-ENGINE and GitHub CI on the **exact same SHA** are not verified. CORA-ENGINE `process-run` has **not** been executed here; the method is not its substitute.

## Product and audit constraints

- Project EDU remains a separately authorized, human gated session workflow. Moving documentation/assets must not mint C72/C135/C87/C125/S03 receipts or provider claims.
- MCP standalone remains an independent server with HTTPS, OAuth or gateway runtime configuration, and its own deployment lifecycle. Moving the entrypoint path requires deployment updates and live qualification.
- The previous `maintain:verify` V10 source-only DoD applied to 15 roots; use `maintain:legacy:v10` only on the V10 checkout. V11 `maintain:verify` is a fail-closed **global** gate, not a green badge.
- Updated workflow paths and build artefacts are not evidence of successful GitHub Actions. External consumers remain UNKNOWN until inventoried and tested.
- Keep a rollback via the original source snapshot, and do not delete original-source Git objects or rewrite historical attestations.

## Current decision

Seven-root **source candidate**, not release-ready. Do not open a merge-ready PR or report `PRODUCT_GO=true` until full regression, original owner review, external deployment and CORA receipts converge on one HEAD.
