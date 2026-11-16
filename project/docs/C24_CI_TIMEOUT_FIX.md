# C24 CI timeout — source-exact sharding

## Observed incident

PR #129 at SHA `543259cad40d76a536e150b9fde321d27a720a81`: run `38606839556`, job `115999808610`, status `cancelled`. The single C24 `canonical` job started at 17:30:07 UTC and ended at 18:05:26 UTC; `npm run qualify:canonical` was the cancelled step. The workflow had `timeout-minutes: 35`. Timeout is the strong proximate explanation, but GitHub's cancelled status alone cannot establish who or what issued the final cancellation. The other 34 CI checks passed on the same commit.

## Engineering choices

- Raise 35 minutes: small workaround, no parallelism or failure localization, retain one fragile long chain. **Rejected as the only fix.**
- Run only C24 tests: quick, silently drops 35 original commands from this aggregate check. **Rejected.**
- Cross-workflow aggregation: viable longer-term, but would require signed, commit-specific attestations across independent workflow runs and trustworthy dependency ownership. **Deferred.**
- Run the existing original 36 commands in seven disjoint independent jobs, then require seven SHA/plan-bound receipts and successful matrix result: **selected.**

## Exact coverage contract

Original `npm run qualify:canonical` is retained unchanged, with 36 ordered commands. Its SHA-256 over JSON-array command representation is `def96fb82a6cb55e096c212c57aa6b8b62d2e2d00d19fd386e48efcc71768947`. Every command is assigned exactly once, in its original sequence within its shard.

| Group | Original command indices (zero-based) | Commands | Budget |
|---|---:|---:|---:|
| foundation | 0–2 | 3 | 45m |
| boundaries | 3–13 | 11 | 45m |
| activation | 14–21 | 8 | 45m |
| semantics | 22–28 | 7 | 45m |
| recovery-c42 | 29 | 1 | 90m |
| recovery-c43 | 30 | 1 | 60m |
| final | 31–35 | 5 | 45m |

The final check retains the job name **canonical**, preserving its branch-protection identity. GitHub matrix jobs cannot publish canonical receipts on failure. Every completed shard uploads one file; aggregation requires byte-equivalent command list, `GITHUB_SHA`, plan digest, no extra or missing receipt, and a successful matrix result. A timeout/cancel or failure in any shard blocks the final canonical check. No command was dropped or shortened; 1m/10m mutation sizes are unchanged.

## Test boundaries and follow-up

Local tests verify exact partition, count, digest, missing, forged, mutated and wrong-SHA receipts. GitHub CI must execute the original campaigns on this new commit before any claim of fully qualified C24 or V1 release. A complete GitHub green run is still a *software gate*, not proof of linguistic cognition, native ChatGPT ingress, or CANONICAL ACTIVE.

Source identity: changes are intentionally limited to C24 workflow, new sharding script, new tests, and this audit note. The existing `qualify:canonical` npm command remains available for full serial invocation.