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
