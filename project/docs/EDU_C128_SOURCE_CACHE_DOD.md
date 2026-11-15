# C128 — Source-exact Project cache hardening and original end-to-end witness

**Observed baseline main:** `5675ff958160b0ba6dd16a3fc4856075e4be8d69` (merged PR127). This is a HOST-scoped integrity and test release. It neither writes a new C87 ledger nor modifies C70/C72/C114, historical C107 frozen SHA, C124 Git overlay epoch, or Terms/AGENTS.

## Forensic origin and failure modes

The #127 builder emits **one** `JSON.stringify` cache envelope with a newline containing the 62,448-byte original C107 carrier and three content-checked C124 Git blobs. Previously `inspectC127SourceCache` accepted other JSON spellings of that same object, including duplicate top-level keys (the parser keeps the last key), pretty-printed or padded JSON, or reorderings of the overlay array. Physical content hashes still validated, so this was an **ambiguous envelope-identity claim**, not evidence of an attack against C87. It prevents an unambiguous source-byte signature and makes incident proof and Project handoff unnecessarily fragile.

The #127 path validator used separate `lstatSync` and two path-based `readFileSync` calls: replacement of the pathname between opens could cause inconsistent provenance. C128 opens once with `O_NOFOLLOW`, obtains `fstat` on the held descriptor, reads the same inode twice at absolute byte offsets, checks size/device/inode, and passes the exact byte snapshot through the original carrier/Git-blob inspectors.

## Minimal repair and reticle

`C127_SOURCE_BYTES → C128_UTF8_EXACT → C128_JSON_CANONICAL → ORIGINAL_C107+THREE_C124_GIT_BLOBS → C128_BYTE_FOR_BYTE_REBUILD → C72_GATE → PR119_C70/C124/C126 → C114 → ORIGINAL_C100/C87 → INDEPENDENT_C87_REOPEN → C125_CONTROLLED_SHELL`.

The byte-for-byte writer roundtrip intentionally requires the exact original C127 member ordering, UTF-8 representation and newline. Nothing is migrated silently. Invalid old/noncanonical source cache bytes fail-closed and must be rebuilt from original source, not accepted by a semantic JSON equivalence argument.

| Level | Falsifiable DoD | Release witness |
|---|---|---|
| L0 | Original C107 carrier and three C124 overlay Git IDs unchanged | existing original source verification |
| L1 | Duplicate keys, JSON whitespace, invalid UTF-8 and source-array order never pass | C128 direct byte mutants (real Node code) |
| L2 | Cache is read twice from ONE open inode without symlink substitution | C128 local-file readback + symlink rejection |
| L3 | Original C72 experimental selection, source-computed 12 C124 obligations, C126 before HOST callback, single original C87 append, independent second read and C125 exact controlled output | C128 source-file-to-owner real two-turn test |
| L4 | At-most-once per event and zero owner execution on invalid source cache | C128 replay + bad-cache tests |
| L5 | Legacy original C107 and post124/127 Node tests, exact source graph and GitHub required CI green on FINAL PR HEAD | CI and human merge |
| L6 | Empirical real-model per-channel causality, native all-channel ChatGPT UI and cross-chat persistence | **OPEN EXTERNAL**; no false promotion |

## Contract search and semantically bounded fuzzing

1,024 candidate feature combinations were enumerated. **Hard constraints:** no second C87 writer, no change to original C72 human gate, no C107 repin, no invented ChatGPT native UI and no source-digest downgrade. Of these, 16 candidates were eligible. A declared weighted change-cost/coverage heuristic selected strict canonical cache validation, single-inode readback, original end-to-end regression and seeded adversarial release testing. This is **relative optimality in a stated finite model**, not proof over every imaginable software architecture.

A separate seed-fixed finite campaign runs 1,000,000 policy fault cases, 24 families, `seed=0xc128202610140001`. Positive conjunction is tested against an independent grouped negative oracle; **zero actual LLM calls, zero native UI captures, zero C87 writes** occur in that policy simulator. Real Node tests (above) are distinct.

## Historical trajectory at bounded abstraction

- C18–C70: foundational machine contracts, bootstraps, source identity and canonical lifecycle under different owners.
- C71–C105: admission/capsule/transport alternatives and evidence-bound synthetic vs original separations, sometimes with historical owner-specific carriers.
- PR113–119: original C107/C108 physically executable kernel; fixed C107 carrier, PR118 transport consumer and PR119 HOST outcome owner.
- PR120–122: C70 compute-first, concurrency/disposal, honest linear HOST route and manual transfer fallback.
- PR123–124: Cx atlas and exact A/B terminal, then at-most-once HOST-controlled output.
- PR125: physically original source epoch carrying twelve computed eligible language instructions; C77/C104 source graph and old-shape cardinality reconciliation.
- PR126: independent *structural* envelope qualification, not semantic model effect.
- PR127: offline cache transport, manual-last attempt budget, documentation and original C59/C7 constraint closure.

Historic PR and commit labels are observational evidence at their original SHA, not an alternate source owner or eternal main HEAD. A complete claim about individual older PR commit diffs requires individual owner reads, not just their title or merged status.

**Do not infer** CANONICAL ACTIVE, native ChatGPT per-turn hooks, genuine provider origin, subjective cognition, durable cross-chat ledger, DOCX file delivery or language-quality uplift from this PR.
