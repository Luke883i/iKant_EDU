# C96 — Host-Owned Forensic Audit and Measured Pre-PR

## Verified source baseline and ancestry qualification

Observed GitHub main (2026-10-10): `bf6c5bf9a1436d72c82ece6a5370d54b4ab35bd6` (PR99 merged). The prior local C95 repo is a **source-matched partial checkout**, not a genuine GitHub main clone. C96 new file patches are additive. Existing checked files have exactly the GitHub blob SHA-1 identities:

| File | Source Git blob SHA-1 |
|---|---|
| `host/c94-auto-artifact-carrier.mjs` | `a9bdfc0d080400f962211649d24a03dcfe59ea23` |
| `host/c95-host-connector-relay.mjs` | `2a1c0c962772e946099bb536da398eaaf8fc8855` |
| `host/c94-cold-host-turn.mjs` | `0cdfb815d420d5d56babbe40afb81a9c49cd1824` |
| `contracts/c95-closure-gates.json` | `5e5420eace86bb891cd5dbbd25b16f54bbc12067` |
| `docs/C95_TRAJECTORY_LOSSLESS_AND_DOD.md` | `85a91a8b3f741f882fc6ba9d176946f079ea7c0a` |

C96 Git commits are **local overlay commits** based on the previous standalone local subtree; their parent is NOT the remote GitHub main SHA. The patch adds exclusively new C96 paths. Do not claim the disconnected local Git bundle is remote GitHub ancestry. A future PR can transplant these new files with GitHub `blob -> tree -> commit -> ref-last` after verifying HEAD and merged-tree collision avoidance.

## Baseline PR99: explanation for non-engineers

PR99 saved work that previously risked disappearing between transfers. It preserved all 25 C94 source blobs, built a software route for automatic artifact ZIP -> C77 -> C84, verified C85/C81/C90-source in a local replay and blocked unauthorized GitHub API paths. It **did not** install the GitHub-to-Node bridge in a ChatGPT host, execute an independent provider, write the required canonical DOCX, persist state between ChatGPT turns or establish native UI delivery.

## Why the sole missing edge is not the whole problem

The first known *transport* blocker remains `HOST_GITHUB_CONNECTOR_TO_NODE_HOOK_NOT_INSTALLED` for an otherwise connector-ready channel. It is a **dependency dominator** for that path: without actual bytes arriving inside Node there is no complete cold source acquisition. But admission/native original input, provider/semantic review, owner-language release, native delivery and real persistence are separate external gates and can be prepared or validated in parallel. Calling the transport edge 'the only issue' is false; calling it 'the critical path for testing automatic cold acquisition' is appropriate. No measured timing exists to prove a globally shortest route.

The engineering priority is: (a) host capability census and physical relay proof; (b) dependency-deduplicated parallel acquisition, with independent true-host callbacks; (c) actual current-turn owner and model; (d) native output and state. C96 addresses (b) and prepares (a); it DOES NOT supply platform capabilities for (a), (c), (d).

## C96 result, physical local evidence

- 43/43 Node 22 regression tests PASS, zero skips, covering C94/C95 and C96.
- Real byte tests used the historical C77 ZIP whose manifest has **34 unique source members**, with **70 distinct Cx anchor references**. One ZIP callback read, 34 exact SHA-256 matches, actual fsync and readback. The 70 anchors are NOT requalified by C96 alone; their independent source proof remains C94/C95/C81's task.
- File-level carrier case executed 34 actual callback reads, concurrency peak >1 and <=5; two-carrier hedged case recovered from primary outage without human ZIP.
- Negative case rejected one corrupted file, published no directory and DID NOT recommend manual ZIP as an automatic default.
- Deliberately introduced descriptor-kind smuggling was accepted 2/2 initially. Both mutations were rejected after exact carrier-shape enforcement. An additional final red test showed a modified in-memory manifest was accepted despite disagreement with frozen raw manifest bytes (1/1). C96.6 requires canonical raw manifest base64, SHA256 equality and object-to-byte exact reconstruction; the same mutant is now rejected.
- The preferred hedging order was further refined for transport-type diversity; a regression test protects the choice.
- **10,000,000 DISTINCT policy-state combinations** were executed, over a Cartesian product of 16,777,216 combinations (13 gate bits x 4 modes x 4 carrier states x 4 source states x 4 delivery states x 8 risk classes). Independent reference oracle: zero classification mismatches. Zero unsupported ACTIVE/native/provider/source/H95 promotions. Six authority-laundering control mutants killed. Identical JSON readbacks across two runs. This is modeled policy coverage, not 10M real GPT calls, 10M GitHub transports, or 10M human sessions.

## Quantitative interpretation of user's wish

A naive 70 Cx x 34 unique members gives **2,380 perceived per-Cx/file acquisitions** even before backups. That duplication is unnecessary because the 70 Cx names reference overlapping source files and control claims, not 70 separate copies of a capsule. C96's unique-byte plan targets **34 file verifications** for that historical manifest and up to two simultaneously attempted registered carriers for each, with one archive fetch shared across all members. Source membership must be independently verified per file; source provenance/70 Cx reachability remains C81/C94/C95. The 34 count is HISTORICAL HEAD bound, not necessarily the current HEAD.

Parallelism does not imply arbitrary downloading. The scheduler permits 1..12 concurrent member tasks, 2 distinct-kind hedges where available, at most 3 eligible carrier descriptors, and no speculative downloads or names for uninstalled tools. `estimatedMs` is a policy heuristic, never provenance. ZIP manual fallback is exposed **only if zero safe automatic carrier callbacks are registered** and after a separately explicit user decision. Repeated transient errors require automatic remediation, not immediate manual upload.

## Consolidated reverse DoD (what is proven vs missing)

| Layer | Exact criterion | Evidence | Status |
|---|---|---|---|
| Contact | only five pinned GitHub orientation reads before consent | C96 planner regression | STRUCTURAL PASS, actual chat not witnessed |
| C72 admission | terms verbatim, later exact I ACCEPT and mode | source contract | HOST NOT WITNESSED |
| Carrier census | actual callback, typed kind, no fictitious tools | C96 Node tests | LOCAL PASS, host hook not installed |
| Per-file closure | SHA256/fsync/reopen for every unique C77 member | historical ZIP 34/34 | LOCAL PASS |
| 70 Cx anchor provenance | exact Git-object reachability and derivative | C94/C95 local test, C96 defers | CURRENT HOST NOT WITNESSED |
| C84/C85/C81/C90-source | full source package built + actual verifiers | C95 local test | LIVE HOST NOT WITNESSED |
| C78/C79/C90 | original same-turn human input consumed by owner | no current-turn physical receipt | OPEN |
| C91/C92 model | real provider and distinct reviewer authenticated | no provider receipt | OPEN |
| Independent meaning | external evidence and contradiction evaluation | no independent substantive witness | OPEN |
| C81/C86 voice | owner admits generated language under source contract | not implemented / witnessed | OPEN |
| Native UI | independent ChatGPT delivery event for exact byte string | host access missing | OPEN |
| Canonical Surface B | one written/reopened/presented DOCX per ACTIVE turn | separate C59 owner absent | OPEN FOR CANONICAL |
| Persistence | writer+readback between separate host turns | no cross-chat writer proof | OPEN |
| C29 36 atoms | source checker >=9901 bps | not rerun on FULL main | NOT QUALIFIED |
| C72 H95 | 500 tasks, 50 sessions, 20 users, weighted Wilson LB >=0.95 | no field data | NOT MEASURED |

## Recommended next slice after C96

**C97 — Host Capability Attestation and Real Cold-Turn Relay.** Deliver an installed, user-authorized byte relay with independently witnessed GitHub ref/Actions ZIP origin, a physically reopened Node artifact, original native input identity and actual C78/C79/C90 same-input readback. The compiled plan is consumed only after real consent and C72 selection. Parallel tasks: provision provider connection and native UI readback contract. Do not make C97 success depend on unavailable native APIs; fail with first observed missing physical edge, never invent them. Afterwards C98 should integrate genuine model output into an owner-controlled voice path and native/persistent delivery, with H95 as an independently measured release gate.
