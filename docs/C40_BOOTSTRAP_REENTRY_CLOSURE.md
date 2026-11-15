# C40 Bootstrap Re-entry Closure

C40 closes the remaining repository-owned gap observed after C39: the AI-agent entrypoint could derive one canonical NEXT but could not consume the resulting typed evidence in the same machine-actionable loop.

The existing Fastboot owner remains the only planner and retry-memory owner. `FASTBOOT_CHANNEL_LEDGER.failed_decisions` excludes a failed carrier while its carrier-local evidence epoch is unchanged; only materially changed evidence for that same carrier may requalify it. Re-entry accepts exactly one existing typed capability receipt or carrier-attempt receipt. Raw booleans, prose outcomes and caller-supplied attempted-carrier lists are rejected.

A failed or partial execution advances to a materially distinct canonical carrier. A complete execution produces only a pre-runtime handoff and cannot claim ACTIVE.

## DoD and metrics

- no new lifecycle, planner, state writer, retry-memory owner or truth owner;
- same-evidence same-carrier retry accepted: 0;
- raw/prose outcome accepted: 0;
- false ACTIVE from complete carrier attempt: 0;
- declared edge-catalog coverage: >=95%, target 20/20;
- realistic antagonistic semantic mutations: 1,000, kill ratio >=95%;
- runtime-root regenerated and verified;
- canonical repository qualification green.

## Checklist

1. derive failed-carrier exclusions from the durable ledger;
2. consume probe receipts through the existing capability-receipt validator;
3. consume execute receipts through the existing carrier-attempt validator;
4. bind observations to source, root and current canonical carrier;
5. advance failure/partial only to a distinct carrier;
6. allow requalification only after changed evidence for the failed carrier;
7. hand complete execution to pre-runtime without ACTIVE;
8. wire the single AI entrypoint to re-entry;
9. regenerate the content-addressed runtime root;
10. pass canonical CI.
