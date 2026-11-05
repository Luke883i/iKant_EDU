# CORA M1 — Shared source, CI and consumer evidence cut

**HOST_ENGINEERING, authority=0. Not a product/runtime/approval receipt.**

This is a *read-only* projection of original [V5-B](../scripts/v5b-repository-governance-audit.mjs), [CORA PR-F](../scripts/cora-pr-f-qualification.mjs), [PR-G](../scripts/cora-pr-g-evidence-readback.mjs), and the pre-existing [lexical call-site scanner](../scripts/project-review-callsites.mjs). It creates **no second inventory, owner, ledger, registry or runtime**, archives nothing and changes no original prompt or owner source.

## Challenge: what would falsify "M1 closed"?

The full source/CI/consumer-closure claim is false if *any* of these independent obligations is absent:

1. **F01–F05 (source)**: exact commit/TREE/Git index correspondence, V5-B one-to-one path and workflow census, original owner and critical source boundaries, original CORA/PR-F/G source packet.
2. **F06–F07 (execution)**: actual clean-checkout test/CI provenance, and independently replayable physical/software falsification, on the *same exact HEAD*. A passing unit test on a different commit is not a receipt.
3. **F08 / S3E1 (reachability)**: actual critical dynamic, data and external consumer closure. A zero static importer count, or a lexical parser, cannot establish unused code or behavioral equivalence.
4. **F10 (administrative)**: effective GitHub required-checks and protections observed by an adequately authorized operator.
5. **F11–F12 (governance)**: two independent engineers, attributable human decision and fresh post-merge checkout/readback.

The new script demonstrates only **F01–F05 source coherence** when successful, while leaving F06, F07, F08, F10, F11, F12, full M1 and repository standardization **NOT_ATTESTED**. F09 rollback and all S2/S3/product gates stay separate. A failure is never silently converted to a pass. In particular, preexisting original PR-F/PR-G scripts retain the ownership of their results; this script merely reconciles their output at one current HEAD.

## Mechanically reproduced source view

Execute on an actual verified checkout of the desired commit:

~~~sh
node --test tests/cora-m1-shared-evidence.test.mjs
node scripts/cora-m1-shared-evidence.mjs
node scripts/cora-pr-g-evidence-readback.mjs
npm test
~~~

The source packet and tests verify:

- Stage-zero index entries equal the Git recursive HEAD tree, including **Git mode, SHA-1 and path**. Dirty tracked source and an unregistered delta fail through the original V5-B audit. No new pinned commit is silently substituted.
- Original V5-B owns the one-and-only tracked path-to-consumer row map; lexical dynamic call-sites are joined **in memory by path** and the original PR-G unresolved call-site records are independently matched **row by row**.
- Every workflow stays paired with the original V5-B readback, and the required-check status stays UNKNOWN_PROVIDER_NOT_DERIVED. An administrative PASS cannot be inferred from workflow YAML.
- All critical bootstrap, runtime, current/derived/historical prompt, source and CORA tool paths are represented without treating negative importer searches as unused.
- The deterministic test suite explores **100,000 finite model vectors** as a *logical policy oracle*, not 100,000 real engineering experiments or user sessions. Additional negative vectors inject false reviewer/provider claims, untracked paths, modified Git objects and erased consumer unknowns. Even a synthetic all-true DAG cannot mint an original receipt or archive permission.

### Which evidence is still needed externally?

A source PASS is **not M1_COMPLETE**. A qualified operator must independently provide the exact HEAD check-runs and clean checkout replay, review dynamic/external consumers with real call-path/behavioral observations, read GitHub protection/rulesets with administrative permission, and complete V5-G review plus post-merge readback. Store those observations in the original governed evidence surfaces rather than in a new local authorizing JSON. Without them, the first relevant external edge is F06_CLEAN_CHECKOUT_CI_EXTERNAL_ATTESTATION_OPEN, followed by F08_DYNAMIC_EXTERNAL_CONSUMER_REVIEW_OPEN.

### Change effect and falsifier

This PR adds only a read-only audit script, unit tests, this runbook and an original V5-B change-register extension. Restoring the original BASE TREE removes these additions without affecting any original owner, boot path, prompt, workflow or product effect. Pre/post-merge must be compared by actual Git refs, not by this document.
