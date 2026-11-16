# R7 / PR #249 - how to tell whether the repository is actually cleaner

This is an implementation guide, not proof of a product release.

## Goal in everyday language

Open the pull request and inspect the **Files changed** tab. The repository should now have only seven top-level directories (`.github`, `contracts`, `host`, `project`, `scripts`, `src`, `tests`) and nine top-level files. The old folders such as `artifacts/`, `plugins/`, `governance/` and `runtime-root/` should not still be present as aliases. Existing code should still resolve its imports, find its assets, respect Project EDU and standalone MCP separation, and pass its original tests.

## What each directory is for

| Directory | Responsibility |
| --- | --- |
| `.github` | Workflow definitions and automated checks; not owner authority. |
| `contracts` | Normative contracts, mapped historical governance and provenance. |
| `host` | Application host adapters and presentation; not canonical author. |
| `project` | Project EDU prompts, docs, assets, release and MCP packaging. |
| `scripts` | Developer tools and replay/falsification. |
| `src` | Original runtime implementation and runtime shards. |
| `tests` | Original and migration tests, controlled evidence artifacts. |

The seven folders are a topology goal, not evidence that code responsibilities are deduplicated.

## How to read the PR gates

1. The PR branch HEAD must actually contain the seven-root tree. A ZIP on a local machine is not enough.
2. The PR must have the real GitHub `main` in its ancestry and preserve the 35 V10-V13 semantic source commits **as an explicitly synthetic second-parent lineage**. The local synthetic history must never be mislabeled as genuine historical `main`.
3. `python3 scripts/r7-pr249-physical-gate.py` must pass with the actual GitHub history. The gate checks each original V13 source file's SHA and Git mode against the candidate.
4. `node scripts/r7-pr249-falsify.mjs --cases 1000000 --seed 249202611` creates one million deterministic **synthetic evidence mutants** and must reject all of them. These are *not* one million real code changes.
5. `npm test`, Project EDU/MCP smoke, and CI must be green **on the exact PR SHA**. Skipped cases are always disclosed.
6. CORA reports must be readable, bound to the same revision, and truthful: `DEBT_BLOCKED` is not `PASS`.
7. Review of the four sensitive owner files and external/dynamic consumers cannot be auto-certified by the source tools.

## If a check is red

Open the failing workflow's job and its first failing step. Fix only the verified cause; do not replace historical SHA pins, suppress a test, or make the DoD checker accept red results. Push a new commit and verify the entire graph on the new HEAD. A green older commit does not qualify the newer one.

## Claims and non-claims

- Structural contraction is demonstrated when GitHub itself shows the seven roots and the exact V13 source mapping.
- Native regression is demonstrated only by completed tests on the same checked-out revision.
- Neither a Git SHA nor a green CI run is independent approval, factual accuracy, provider availability or product readiness.
- `PRODUCT_GO=false` until the separate native, owner, and provider gates have their own evidence.
