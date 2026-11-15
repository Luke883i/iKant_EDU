# PR-A | Finite consumer and hygiene backlog (Host engineering)

**Status:** candidate read-only engineering evidence, not a new owner, inventory, authority, retirement plan or iKant release. **Scope:** V5-B census + CORA #217 reticulum; repository `Luke883i/iKant_EDU` from frozen source baseline `b60e3ac2b9fa9cb4167b7413d594c502c0fa9459`. Every run binds the actual checked-out HEAD, Git index/tree and original V5-B readback: do not reuse old file lists as current observations.

## Reproduce from a clean full Git checkout (Node 20/22)

```sh
node scripts/cora-pr-a-backlog.mjs
node scripts/cora-pr-a-backlog.mjs --top=100
node scripts/cora-pr-a-backlog.mjs --full > cora-pr-a-backlog.json
node --test tests/cora-pr-a-backlog.test.mjs
node scripts/cora-pr-a-falsify-10m.mjs 10000000 20261104
```

The `--full` JSON is a **projection**, not a second persisted registry: one entry for each source path from `scripts/cora-minimal-absorption.mjs#observeReticularCensus`, reconciled with `scripts/v5b-repository-governance-audit.mjs#auditRepository`. Its fields contain original Git SHA-1, provisional V5-B role, known literal importer/dependency lists, workflow trigger/jobs/hazards and a safe `next_proof`. Priority levels mean *review urgency*, never authorization to delete. `P0` preserves guarded originals and entrypoints; `P1` flags dynamic sites and workflow hazards; `P2` calls for review of workflow roles, possible documentary archaeology and no-literal-import cases; `P3` retains all other paths pending review. None is deemed unused.

**No modification, archive, workflow retirement or owner call is performed.** The verifier refuses missing/duplicated paths, forged `UNUSED`, incomplete workflows, drift between the two original projections, promoted provider checks, source mutation and false release status. Retention is delegated to `contracts/v1-workflow-retention.json`. A human must investigate runtime-generated, Python/shell, deployment, packaging and external callers independently before changing a candidate. Even after all semantic evidence bits are supplied, the helper only reports `evidence_complete`; it cannot grant effect permission.

## Realistic adversarial seeded study

`scripts/cora-pr-a-falsify-10m.mjs` has 40 fixed fault families covering source/rename drift, case collisions, dynamic imports, Python/shell/external callers, original owner changes, CI wrong-HEAD, required checks, privileged workflow effects, rollback, human reviews, documentation vigency and provider-delivery overclaims. It executes 10,000,000 seeded *finite evidence vectors* (not 10M physical Git edits, human turns, or owner calls), with an independent bit-vector oracle and SHA-256 sequence digest. Seed `20261104`: digest `fadc21e2d1d342e2e8be640f5e4841e472aa96c5f8ad8d3517ef86718f0c12d0`; 40/40 family coverage; zero oracle disagreements and zero authority promotions in two local Node runs. Source checkouts/CI and external provider proofs remain separate.

## Exit gate and next slice

PR-A closes *engineering preparation of a finite backlog* only when its exact PR HEAD tests pass and Git changes are reopened independently. `A01..A05` can be covered by source plus tests; `A06` requires independent review and post-merge requalification. The abstract standardization DoD remains open until consumer closure, reversible non-regression, documentation review, real required checks and independent qualified governance. The product-value and original C72/C135/C87/C125/S03 gates remain distinct. PR-B should harmonize the docs; PR-C should assess CI equivalence; later PR-D..N may remove code only with verified negative/restore tests.


## LEVEL-iKant/1 — minimal contract, source-only cross-repository method

**Candidate methodological adapter, NOT a new runtime owner, host
installation, V5-G approval, CI replacement, protected-workflow delta,
migration or product qualification.** The original V5-B Git census,
reticular DoD and C72/C135/C87/C125/S03 owners remain authoritative.
Unknown dynamic or external consumers remain `UNKNOWN` and never
become `UNUSED` because a lexical source graph omits them.

**Contract inputs:** (A0) human goal and authority boundary; exact
BASE/HEAD Git identity and existing source/TREE pins; owner and
known/unknown consumer graph; backward non-compensatory acceptance
DAG; executable positive and negative oracles; permitted slice;
portable round reference; open gaps and external approval status.

**Acceptance obligations, all required:**

1. Reuse original `scripts/v5b-repository-governance-audit.mjs`,
   `scripts/cora-minimal-absorption.mjs`,
   `scripts/cora-pr-a-backlog.mjs` and
   `scripts/project-review-callsites.mjs`. Never create a second
   source census, host SOT, auto-approver or generic workflow.
2. Build acceptance dependencies *backwards* from requested source,
   behavior, runtime and governance outcomes. Preserve distinct
   R/S/D/T/P/G evidence domains. A source claim never authenticates a
   runtime or original provider/user-value result.
3. Prefer one reversible, bounded source or documentation slice.
   No addition, modification or deletion of protected workflow or
   owner code without a separately authorized original-owner process
   and real negative/restore oracle.
4. Test finite seeded fault families against a separately expressed
   oracle (the PR-A study has 40 declared families and 10M *model*
   vectors), and distinguish these from real file mutations,
   original-host execution and independent reviewers.
5. Report iteration number, next unresolved obligation and semantic
   no-progress tail conservatively. Rewording a roadmap or setting
   `DONE_REPORTED` cannot advance an engineering witness. A
   changed source SHA or changed acceptance contract requires
   reassessment. No a-priori promise of final N.
6. Attribute final CI and tests to the same exact PR HEAD bytes and
   relevant environment. Re-open on actual merged-main SHA. Source
   success alone never supplies V5-G human authority or C59 ACTIVE.

**Failure-mode anchor — PR238/M3 (merged):**
commit `34750a2b2f192758b26919235922c4002ff040c0` restored
the protected original workflow and moved index/TREE/worktree
readback to the **existing** CLI in
`scripts/project-review-callsites.mjs`. The original change
record `governance/changes/m3-source-closure-20261108.json`
retains `required_checks_verified=false` and `human_signoffs=0`.
If a suggested gain requires a change to the pinned workflow,
the method must **stop/reuse/replan**, not silently relax CORA/PR-G.
A preserved TREE proves source identity; it cannot prove a
provider installation, host review or user value.

**LEVEL demonstration transfer:** a separate original web-game
repository is proposed to show an AI coding agent progressing
from one expressive contract to executable product slices, tests,
Git PRs and source-linked evidence. The iKant contribution is
the *method* of source-preserving acceptance and rollback, not
participation in that game's runtime or product certification.

[Common CORA candidate method](https://github.com/Luke883i/cora/blob/docs/readme-product-multichannel-pr47/docs/CONTINUOUS_DEVELOPMENT.md)
does not supersede [iKant governance](GOVERNANCE.md) or
[the original reticulum](../contracts/cora-reticular-hygiene-v1.json).
No existing workflow, original contract, host owner or code
path is changed by this document-only slice.
