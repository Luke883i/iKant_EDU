# C41 Carrier-local retry and UX continuity

C41 closes three post-C40 semantic gaps without introducing a new lifecycle, planner, retry-memory owner, truth owner or status owner.

## Runtime contract

1. Canonical Fastboot step derivation and Session Shell reject caller-supplied attempted-carrier memory. The only retry memory remains `FASTBOOT_CHANNEL_LEDGER.failed_decisions`.
2. A failure is bound to a carrier-local evidence epoch. Evidence changes for another carrier may change the global ledger digest but cannot requalify the failed carrier. New evidence for that same carrier may requalify it.
3. `HANDOFF_PRE_RUNTIME` binds owner, action, attempt receipt, active claim and authority inside the transition digest. It cannot mutate the ledger, smuggle a next Fastboot step or claim ACTIVE.
4. Session Shell accepts a validated Fastboot transition as an owner-derived guidance source. After complete `LOCAL_INGRESS`, it renders exactly `EXECUTE_PRE_RUNTIME_BOOTSTRAP` and the next constitutional edge `LOCAL_MATERIALIZATION`.

## DoD

- caller retry memory accepted by canonical step: 0;
- caller retry memory accepted by Session Shell: 0;
- unrelated evidence requalifications: 0;
- unbound pre-runtime routes accepted: 0;
- actionable transition UX gaps: 0;
- unsafe ACTIVE promotions: 0;
- measured edge coverage: >= 95% over 26 declared witnesses;
- semantic attack campaign: 10,000 cases / 20 families with kill ratio >= 95%;
- exact runtime-root regenerated and verified;
- canonical qualification green.

## Claim boundary

The qualification proves repository-side deterministic semantics on the exact candidate. It is not current-host byte-transfer proof, runtime materialization proof, executed provenance or ACTIVE proof.
