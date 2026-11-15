# C95 — C94 lossless conservation, actual C81 source qualification and carrier adapter

Base for transplant: GitHub main@11eecb86f08ebb90aa228d55c1e7f50da890f79d (PR #98 merged).
The local lossless bundle retains all five original C94 commit IDs and history. The remote GitHub transplant **reparents** five equivalent semantic C94 commits to the actual post-PR98 main; commit SHAs change by design, but all 25 original C94 final Git blob IDs (including the 108226-byte C77 historical ZIP) are identical. Subsequent C95 commits are later descendants and preserve the original source in their ancestry.

## Non-trivial discovered gaps
- C94 C84 assembly originally ended with `c81_executed:false` and never ran C85, C81 or C90-source before publishing. C95 now executes the **actual existing repository verifiers** before writing the packet.
- C94 Actions endpoint selected a valid HEAD before download but did not recheck the pinned ref after ZIP transport. C95 rejects `HOST_GITHUB_REF_CHANGED_DURING_TRANSPORT`.
- C94 cold host demanded `IKANT_C94_GITHUB_TOKEN` in Node. A host-owned GitHub connector has different identity/permissions; its token cannot be assumed to exist inside Node. C95 adds a narrowly typed callback bridge that accepts only exact GitHub endpoints and canonical Base64 raw ZIP, while never asserting native origin.
- C81 Git Merkle proof is still not an externally authenticated GitHub ref, and C90-source verification is not a C90 same-input cognitive owner turn.

## Physical executable observations
- Local Node 22: original C77 real ZIP bytes + a synthetic consistent GitHub Actions object API can produce C84, and C85/C81/C90-source actually return typed VERIFIED receipts from that C84 source packet.
- Physical fs read/reopen is exercised by C94 and C95 unit tests. Github provider responses are local fixture callbacks, not real network.
- Current external GitHub connector may expose JSON and source text but not binary Actions ZIP transport to a Node process. No installed host byte bridge has been independently attested.
- Neither an HTTPS provider's successful completion nor independent substantive entailment, C81/C86 generated-language admission, native event readback, authenticated state, C59 canonical ACTIVE/DOCX, nor H95 are proven by C95.

## Final DoD with truth-owner separation
**CLOSED IN LOCAL CODE:** C94 lossless ancestry, ZIP file closure, 70 Cx and derived C71 original C94 code, cross-ref HEAD final guard, actual C85/C81/C90-source, connector callback path/byte type, negative regression suite.
**CLOSED IN LOCAL TEST ONLY:** Automatic connector-to-Node path through test callback and original C77 ZIP, not an observed real ChatGPT connector.
**OPEN HOST:** GitHub source origin authenticated by host, actual binary connector transfer into Node, original native user ingress and exact admission, C78/C79/C90 same-input run and owner, provider HTTPS credentials and responses, independent semantic evidence, C81/C86 generated voice integration, native ChatGPT platform event readback, persistence and canonical DOCX.
**OPEN FIELD:** C72 H95 independent user-value, minimum 500 tasks, 50 sessions, 20 users, one-sided confidence requirements. C29 36-atom source checker not rerun from full repository in this isolated capsule.

All C95 statuses maintain authority zero, `ACTIVE=false`, and distinguish source package Merkle consistency from GitHub and ChatGPT host origin.
