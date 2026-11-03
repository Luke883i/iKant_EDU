# S01 prospective iKant_EDU original-source shadow (NOT rename approval)

Authority=0. The shadow executes in a disposable detached Git worktree, never main.
It transforms a fixed subset of identity-bearing originals, uses the original
runtime-root and source-manifest regenerators, makes a LOCAL disposable commit
for tests against an immutable temporary HEAD, verifies the descriptors,
runs original first-contact/C72/coldstart tests and removes the worktree.

## Mechanically testable DoD

| Gate | Falsifier | Proof |
| --- | --- | --- |
| S01-OLD | main or originals changed before admin cutover | main HEAD/TREE/blob readback |
| S01-NEW | future name fails first-contact, C72 Terms or coldseed | prospective original tests in detached NEW worktree |
| S01-ROOT | member/shard hashes or root SHA-256 stale | original runtime-root regen then verify |
| S01-MANIFEST | source set incomplete | original project-source-manifest regen then verify |
| S01-RECEIPTS | fake acceptance, replay or same chat consent | owner negatives + native owner event still independent |
| S01-UNIQUE | untrusted name alias becomes second canonical | GitHub ID+full_name+HEAD per source epoch |
| S02-CI | original test failed or unreviewed patch | CI check/readback on PR SHA |
| S03-EXTERNAL | nonredirected Actions uses, unknown consumer, webhook or prompt | external owner/provider proof |
| S04-HUMAN | no two independent reviewers or admin GO | human review/admin evidence |
| S05-CLICK | ambiguous rename effect or changed repo identity | one admin effect and readback by repository ID |

## Nonclaims

Even a passing shadow never changes GitHub repository name, never installs the
ChatGPT Project prompt, never issues real original C72 receipts, never proves
native provider UI or downstream consumers, never authorizes S04/S05 and
never establishes zero-downtime or ACTIVE.

## Run

    node --test tests/rename-internal-shadow.test.mjs
    node scripts/rename-internal-shadow.mjs /tmp/FRESH-rename-shadow-report.json

The report must be reopened; SHADOW_INTERNAL_PATH_TEST_PASS_NOT_CUTOVER_GO
is only a technical prospective result and ALWAYS has rename_go=false.

## PR #211 diagnostic and repair DoD (test-plane only)

**D1 — isolate the original failure.** Run each of six unmodified original test
files in its own prospective NEW detached worktree using TEST_0..TEST_5.
For each case assert the same source HEAD/TREE, same fixed identity patch set,
original runtime-root regeneration and verify, manifest regeneration and verify.
Retain each CI step's success/failure and the report with mode, shadow HEAD,
failing stage, and stderr/stdout tail. Test failure is diagnostic evidence,
never evidence of a product failure outside the test.

**D2 — establish root cause.** A claimed root cause must identify the exact
original input/check (path, assertion, expected/actual binding), reproduce
failure with the uncorrected source, and show a minimal source patch changes
that single outcome without relaxing source identity, receipt, or owner gates.
Do not patch a test solely to mask an original behavioral failure.

**D3 — preserve original authority.** The resulting future-name binding must
be tied to the verified source phase and identical GitHub repository ID.
No dual canonical, no accept of old receipts as new, no first-turn human gate
bypass, no owner replay, no synthetic CI receipt treated as native C72.

**D4 — rerun identical preparation.** Re-run all six original tests under
mode ALL on the same source preparation function plus the minimal corrected
original binding. Independently execute original runtime-root verify,
project-session manifest verify and source-pin audit in the shadow checkout.
Compare identical test suite and unmodified OLD baseline after the patch.

**D5 — close only the bounded technical gate.** CI must read back exact PR
HEAD and original workflow job success, emit per-stage report. If D1-D4
PASS, report only INTERNAL_PROSPECTIVE_PASS; do not infer administrative
rename GO, installed prompt, C72 owner invocation or external continuity.

An unknown or ambiguous GitHub file write is reconciled read-only before
another commit; never force push. PR #211 stays draft until all required
regressions pass. This document is not a cutover authorization.
