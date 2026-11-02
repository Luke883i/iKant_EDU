# C96 GitHub transplant — exact final bytes, strict provenance

**Base:** `main@bf6c5bf9a1436d72c82ece6a5370d54b4ab35bd6` (PR99 merged).
**Purpose:** integrate the already-qualified *local* C96 pre-PR into the real GitHub repository without rewriting the 16 final source files or any existing C94/C95 path.

## Reparented semantic history
The standalone pre-PR ZIP contains six disconnected local development commits (`d04980e`, `39bee0a`, `47de494`, `c34bba5`, `c866fa5`, `fa3b6dc`). They are **not** GitHub-main descendants. This PR creates six **new semantic assembly commits** descended directly from the pinned GitHub main, grouped by contract, runtime, red-case tests, bounded model falsifier, qualification, and last-mile provenance. These groups preserve the final 16 Git blob objects byte for byte, **not each intermediate source revision** of the disconnected local history. The original pre-PR ZIP remains the authoritative record of those intermediate revisions.

The original [`README_C96_PREPR.md`](archive/prepr/README_C96_PREPR.md) (relocated byte-for-byte from the repository root) and `docs/C96_AUDIT_REPORT.md` are deliberately preserved verbatim as historical snapshots. Their statements that no remote PR existed are **time-scoped to the original local pre-PR**, not claims about this transplant.

## Exactness and no-drift controls
- Source: `iKant_C96_prePR_post_PR99.zip`, `C96_PREPR_MANIFEST.json`.
- The manifest declares 16 final files, with individual SHA-256, Git SHA-1 and byte sizes. All 16 Git blob creations were checked against exact manifest Git SHA-1; **zero mismatches**.
- The base `main` Git tree was inspected before writes; no target C96 paths pre-existed. The PR is additive and must not remove/modify any C94/C95/source files.
- Before publish: recheck exact current main and branch ancestry; after publish: read back PR files and verify changed-path set plus original source SHA identities. Never force-push, never mutate main directly.

## Executed local qualification and evidence limits
- `node --test` with the eight targeted C94/C95/C96 suites: **43 pass / 0 fail / 0 skipped** in a local source-subset worktree supplemented with three prior C95 **test mirror** modules (because the original local Git bundle does not contain the full current main). This test run is not falsely described as a source-exact checkout of every GitHub main file.
- `node scripts/c96-falsify-10m.mjs 10000000` repeated twice: **10,000,000 distinct modeled combinations**, zero oracle disagreements and zero unsafe promotions; the two JSON readbacks were identical. These are finite policy states, not real ChatGPT interactions.
- Local fixture: historical 34-member C77 ZIP; 70 Cx anchor **count** is not a present-session GitHub origin or Node runtime receipt. Live host connector-to-Node, C90/C91/C92 with provider, independent semantic truth, owner C81/C86 generative admission, native host delivery, persistence, canonical DOCX and C72 H95 are **NOT ATTESTED**.

## Release discipline
**DRAFT PR, fail closed**. Do not claim ACTIVE, native delivery, full cognition or production readiness. Next required physical edge is a real installed, authorized ChatGPT host connector-to-Node file/ZIP-byte hook with true same-input owner readback; provider and native UI are separate independent gates.
