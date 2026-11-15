# C83 - Proof gates for semantic relevance, host integration, and H95

This is a **host-owned engineering slice** on the merged C82 main, not an iKant cognition result and not a native ChatGPT integration. No synthetic evaluation is allowed to be reported as a human-labeled independent holdout or actual target-host session.

## What this PR implements

1. `src/c83-semantic-router.mjs` becomes the bounded task-class gate called by C82. It recognizes explicit negated task requests and has broader limited lexical cues. It is NOT a free-form natural-language understanding model and still fails on out-of-distribution examples. The C70/C71/C73 byte-exact repository voice contract remains the same. The C77 capsule builder now includes its transitive dependency.
2. `scripts/c83-falsify-1m.mjs` evaluates one million **actual classifier invocations** with locally authored phrase seeds and compositional variations across intents, constraints, register and context. Input labels are **not independent** from code development and are **not blind human quality ratings**. The entire deterministic corpus output is SHA-256 committed in the JSON receipt.
3. `host/c83-long-input.mjs` provides verifiable 65,536-byte UTF-8 chunk framing, reconstruction and disk write/reopen. 600-byte C70/C78 still rejects a semantic turn longer than its bound; the new module explicitly returns `C83_LOSSLESS_NODE_READBACK_NOT_C70_DISPATCHED`, never an invented same-current-input cognitive result.
4. `host/c83-evidence-gates.mjs` implements independent-threshold **numerical projections** only; even caller-supplied perfect results with 500/50/20 do **not** attain `attested:true` without real trusted host/native receipts. It calls the existing C72 Wilson evaluator rather than replacing it.
5. `contracts/c83-product-qualification.json` declares test populations, confidence targets, nonpromotable evidence classes, native gaps and fail-closed status.

## Actual numerical result: seeded local test (not blind holdout)

| Label source | Samples | Previous C82 classification | C83 classification |
|---|---:|---:|---:|
| 80 development phrase seeds × 12,500 variations | 1,000,000 | 650,000 correct (65%) | 1,000,000 correct (100%) |

The 100% is **within an intentionally closed authored phrase space**, so it cannot support an independent 95% generalization claim. Output content is still mostly deterministic bounded prose. **No human evaluation performed**.

## DoD / proof edges

| Gate | Threshold | Current release evidence |
|---|---|---|
| Semantic holdout | One-sided Wilson 95% lower ≥0.95 on frozen independent data | **NOT MEASURED** |
| Graded human response quality | One-sided Wilson 95% lower ≥0.90 on blinded predeclared rubric | **NOT MEASURED** |
| Million mutations | 1,000,000 actual seeded classifier calls; input/label corpus hash | **LAB PASS** |
| Auto machine-only bootstrap | Real callable host carrier, no user ZIP | **NOT ATTESTED** |
| Input >600 without loss | Chunk hashes + whole input SHA + local write/reopen | **LAB PASS FOR TRANSPORT ONLY** |
| Input >600 semantic execution | C70/C78/C79/C81 bound to complete original UTF-8 | **NOT IMPLEMENTED** |
| Native assistant delivery | Host event identity + UI echo receipt | **NOT ATTESTED** |
| Durable state | Real writer and a second-turn readback | **NOT ATTESTED** |
| H95 | Wilson weighted lower ≥.95; per dimension ≥.90; ≥500 real tasks, ≥50 real sessions, ≥20 real users; no incidents | **NOT MEASURED** |
| Canonical ACTIVE | Frozen C59/C64/C66/C68 causal owner & DOCX | **NOT CLAIMED** |

## Future implementation slices

- C84: real host capability adapter with native event identity and automatic carrier transport. Do not fake APIs in a repository library; use actual callable platform integration.
- C85: lossless full-input owner dispatch and C79/C81 binding for long messages; content-aware constrained reasoning, independent fact retrieval, full semantic composition.
- C86: preregister blinded holdout and human rubric, collect actual reviewers, then host-native field cohorts for H95.

Until those physically exist, C83 `status=NOT_ATTESTED` for product-level targets is the only truthful result.
