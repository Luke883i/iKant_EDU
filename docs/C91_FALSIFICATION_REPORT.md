# C91 local audit and falsification (physical Node 22)

Observed PR95 base: `acfaeb0b95944b04465061792037778e4f4800d7`, PR95 was OPEN during the earlier local pre-PR; it is now MERGED as main@5c632e024f679dbcdf95839fae7c226eafd8068f. Read-only source references live in `source-snapshots/PR95_BLOB_REFERENCES.json`; the locally executed seed source is the earlier C77 capsule from `main@66f074b...`, not a checked-out PR95 commit.

## First blob / negative campaign

The first local semantic overlay had a path-bound, input-bound owner gating and a ten-question candidate validator, with a second review port. A reproducible seeded campaign used 21 mutation operators on 21,000 inputs. It found exactly **2,998** wrongly accepted cases in three classes:

- duplicate_source_id: 994;
- forged_metadata: 962;
- secret_key_unreported: 1,042.

The original code was therefore NOT considered qualified. Its blob ledger is preserved at `artifacts/c91-initial-blob-ledger.json` and failing test receipts at `artifacts/c91-pre-refinement-mutants.json`.

## Refinement and reblob

Validation now enforces closed-world top-level candidate fields, closed-world question fields, no duplicated question or synthesis citation IDs; the second reviewer output and question-check fields are similarly bounded. No unknown metadata or hidden affirmative native/provider/ACTIVE claims can pass through those object shapes.

Same-seed 21,000 replay: **zero** accepts among negative cases.
Final 100,000 replay: **zero** accepts among negative cases (21 operator classes). The marker variants are syntactically distinct but not 100,000 independent semantic classes or real model calls. Final source blob digest inventory is `artifacts/c91-final-blob-ledger.json`.

## Other physical tests

Node's test runner executed ten targeted tests: positive mock candidate (10 distinct questions) and nine boundary/review cases. A source fixture extracted from the uploaded C77 ZIP was checked against its manifest; this tests local package byte integrity, not independent pinned GitHub ref origin and not actual PR95-C90 execution. The actual C90 production wrapper remains fail-closed absent a same-input owner readback, and must be qualified on the merged main checkout.

## What this does NOT demonstrate

- A provider invoking GPT-6 or any other actual model from Node (fixture callbacks only).
- Deep task-specific correctness, complete codebase observation or grounded entailment of answers.
- C91 integrated as C70/C71/C81 voice rather than a host-owned draft sidecar.
- Two real independent reviewer models, native event/transport, user-visible artifact presentation or across-session memory.
- C29 all-36 live code assessment on a full PR95 workspace or C72 H95 field score.

Field success remains UNKNOWN; the repository promise inventory is exactly 36 atoms with 10,000 assigned bps, but no source-conformance promotion was inferred from matching weights.
