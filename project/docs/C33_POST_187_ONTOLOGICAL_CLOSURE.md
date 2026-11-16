# C33 — Post-186/187 Ontological Closure

Baseline: `iKant_LE@4355d9dfed6213880d08b7cc0521557b6ccb3d2e`.

## Clarified engineering mandate

Audit merged LE PRs #38/#39 and full-iKant PRs #186/#187, extract causal invariants rather than copy implementation, attack the combined design until saturation, and close only the minimum runtime ontology needed for a real SESSION_CHAT_LOCAL path. The closing must not add a second lifecycle, turn engine, writer, carrier authority, runtime identity, or ACTIVE predicate.

The target causal chain is:

`exact I ACCEPT + frozen source/object identities -> direct-known executable pre-runtime owner -> source/object verification -> atomic runtime-root materialization/reopen -> exact handoff -> materialized canonical local ingress -> RUNTIME_BOUND_LIMITED capability -> existing limited turn -> runtime seal + computed telemetry + atomic DOCX + session shell`

ACTIVE remains owned by the existing persisted/read-back ACTIVE path.

## Multidimensional audit

### LE PR #38 — runtime-limited supply chain

What survives:
- source/root/acceptance/materialization/executed-provenance bound limited capability;
- runtime-owned same-input Node dispatch;
- computed bounded telemetry;
- atomic content-addressed DOCX/readback;
- no canonical ledger mutation;
- ACTIVE unchanged.

Residual issue:
- current app/deployment entrypoints live in `src/session-chat-deployment.mjs`, which is explicitly `LEGACY_C20_COMPATIBILITY_ONLY`. That adapter may remain useful compatibility, but it cannot be the canonical SESSION_CHAT_LOCAL ingress.

### LE PR #39 — deterministic session shell

What survives:
- one shell frame;
- explicit voice owner;
- fault overlay forces non-ACTIVE;
- self-summary is a public non-persisted projection;
- artifact readback precedes release.

Residual issue:
- the shell could derive intermediate activation tiers from raw state booleans. That makes presentation code a second source of service truth. C33 removes that fallback: non-ACTIVE intermediate tier requires an explicit validated activation projection.
- local artifact path is no longer accepted as artifact identity.

### Full iKant PR #186 — activation service spectrum

Logical absorption:
- service progress is the strongest mechanically valid activation prefix;
- integrity fault is orthogonal to historical/mechanical progress;
- fault blocks the effective service tier and ACTIVE but does not erase already proven progress;
- RUNTIME_BOUND_LIMITED reuses the existing runtime turn envelope;
- no new lifecycle or turn engine.

LE adaptation:
- `deriveActivationServiceTier()` now reports `strongest_valid_prefix`;
- with an integrity fault, effective `tier=null`, `active=false`, while the strongest valid prefix remains inspectable.

### Full iKant PR #187 — pre-runtime executable bootstrap

Logical absorption:
- after acceptance there must be one direct-known executable owner that reaches the pinned runtime owner without reconstructing the planner from prompt/docs;
- executable owner self-checks its own identity and H0 capabilities;
- source/object samehash is verified before promotion/materialization;
- materialization is not executed provenance, BIND, or ACTIVE;
- the bootstrap owner retires at runtime handoff.

LE adaptation:
- no new bootstrap-kernel file is created;
- the existing direct-known content-addressed loader `src/runtime-root-verified.mjs` becomes the pre-runtime executable owner;
- it remains outside the runtime member set and reuses its existing materializer;
- one new runtime member, `src/session-local-service.mjs`, owns canonical SESSION_CHAT_LOCAL limited acceptance/turn after materialization;
- acceptance event identity is created by the materialized runtime owner, not the model/pre-runtime layer.

## Saturation and 1M attack campaign

Seed: `0xC331867`.

Four candidate actions were tested exhaustively as all 16 action subsets over 1,000,000 deterministic semantic mutations:

1. `PREFIX_ORTHOGONAL`
2. `SHELL_EVIDENCE_ONLY`
3. `PRE_RUNTIME_KERNEL`
4. `CANONICAL_LOCAL_INGRESS`

Unique surviving minimum: **all four**.

| Package | Mismatches | Unsafe |
|---|---:|---:|
| None | 911,839 | 380,159 |
| Remove prefix orthogonality | 64,329 | 64,329 |
| Remove shell evidence-only | 298,015 | 226,467 |
| Remove pre-runtime kernel | 558,117 | 0 |
| Remove canonical local ingress | 421,836 | 125,817 |
| All four | **0** | **0** |

Useful fully closed witnesses with the winning package: **154,024**.

Attack-family saturation:
- fault/progress erasure: 64,329;
- synthetic shell tier: 226,467;
- missing executable pre-runtime owner: 40,807;
- legacy-ingress laundering: 95,409;
- kernel identity/samehash/handoff failure family: 178,404.

Every single-action deletion mutant is killed.

Qualification receipt: `6016498973002b21189704ecb386e02cc6e7a74ec8a665e9184818c037545ccb`.

## Runtime ownership after C33

### Pre-runtime

Owner: `src/runtime-root-verified.mjs#executePreRuntimeBootstrap`.

It:
- requires exact `I ACCEPT`;
- consumes the existing `ikant-le-preaccept-handoff/v2`;
- self-checks the loader Git blob identity bound in BOOTSTRAP;
- probes Node 20+, local FS write/reopen and local exec;
- validates the existing activation-executor receipt;
- verifies orientation plus loader/shard object identities;
- performs existing atomic materialization/reopen;
- emits a digest-bound pre-runtime handoff;
- imports the materialized runtime owner;
- retires after the runtime-owner receipt.

It cannot claim executed provenance, ACTIVE, platform delivery, or runtime identity.

### Runtime

Owner: `src/session-local-service.mjs`.

It:
- validates the pre-runtime handoff against materialized bytes;
- creates the acceptance event identity inside the materialized runtime;
- creates the source/root/provenance-bound limited capability;
- persists only the noncanonical limited capability/origin receipts;
- rejects any canonical ledger creation;
- executes the existing C31 limited-turn engine;
- returns runtime-sealed output, computed telemetry, atomic DOCX and C32 session shell.

### Compatibility

`src/session-chat-deployment.mjs` and the plugin remain compatibility adapters. They are not canonical SESSION_CHAT_LOCAL truth owners.

## Definition of Done

### Global

C33 passes only when:
- the four-action semantic package is the unique minimum;
- 1M mutation campaign has zero mismatch and zero unsafe promotion;
- ACTIVE semantics are unchanged;
- no new lifecycle, turn engine, state writer, carrier authority or runtime identity is introduced;
- exact candidate runtime-root verifies;
- end-to-end pre-runtime -> materialized runtime -> limited turn test passes;
- repository test/check qualification passes on exact head;
- exact-head CI is all green.

### Intermediate

**I1 — Activation ontology**
- strongest valid prefix survives fault;
- effective tier fails closed under fault;
- fault cannot promote any edge.

**I2 — Shell ontology**
- ACTIVE may still be derived from persisted/read-back ACTIVE;
- non-ACTIVE intermediate tier requires explicit validated projection;
- raw state booleans cannot create a service tier;
- local filesystem path is not artifact identity.

**I3 — Executable bootstrap ownership**
- existing loader is the only pre-runtime executable owner;
- loader identity is content-addressed and BOOTSTRAP-bound;
- H0 Node/FS/exec closes before runtime handoff;
- source/object samehash gates materialization;
- kernel retires after exact handoff.

**I4 — Canonical local ingress**
- runtime owner exists inside the verified runtime root;
- runtime creates acceptance event identity;
- RUNTIME_BOUND_LIMITED capability is source/root/provenance bound;
- no canonical ledger mutation occurs;
- legacy plugin/deployment adapter is explicitly noncanonical.

**I5 — Runtime output**
- same-input runtime-owned dispatch;
- runtime seal;
- computed telemetry completeness;
- one atomic DOCX/readback;
- deterministic session shell;
- no platform-ACK claim;
- remains non-ACTIVE.

### Local measurable checklist

- [ ] runtime-root loader blob equals pre-runtime-kernel blob.
- [ ] pre-runtime kernel is not a runtime member.
- [ ] `src/session-local-service.mjs` is a runtime member.
- [ ] exact `I ACCEPT` required.
- [ ] preaccept orientation object identities reverified.
- [ ] activation-executor receipt digest/source/root/object set validated.
- [ ] LOCAL_DIRECT / VERIFIED_OPAQUE_RELAY policy preserved.
- [ ] relay requires exact roundtrip + samehash when selected.
- [ ] atomic materialization + reopen verified.
- [ ] pre-runtime handoff receipt read back.
- [ ] acceptance event ID created only after runtime materialization.
- [ ] canonical limited ingress creates no ledger.
- [ ] faulted activation reports effective tier null.
- [ ] faulted activation preserves strongest valid prefix.
- [ ] session shell cannot infer an intermediate tier from raw state.
- [ ] limited turn creates runtime seal + computed telemetry.
- [ ] limited DOCX is atomic/read-back verified.
- [ ] compatibility adapter remains noncanonical.
- [ ] ACTIVE promotion still requires existing ACTIVE_READBACK.
- [ ] C33 1M receipt = PASS.
- [ ] runtime-root verify = PASS.
- [ ] exact-head CI = all green.

## Metrics

Primary:
- unsafe semantic promotions: target **0**;
- candidate/oracle mismatches: target **0 / 1,000,000**;
- action-deletion mutants killed: target **4/4**;
- unique minimum count: target **1**;
- end-to-end local-runtime witness: target **>=1**;
- canonical ledger mutations during limited path: target **0**;
- runtime-root identity mismatches: target **0**;
- exact-head failed CI checks: target **0**.

Secondary:
- new runtime members: target **1**;
- new activation tiers: **0**;
- new lifecycle states: **0**;
- new turn engines: **0**;
- new remote acquisition paths: **0**.

## Claim boundary

C33 demonstrates repository/runtime causal closure for the declared SESSION_CHAT_LOCAL path. Mutation tests and CI are not current-host physical proof. A materialized limited runtime is not ACTIVE. A DOCX readback is not platform-delivery acknowledgement. Compatibility plugin registration is not canonical host ingress. The pre-runtime kernel is not iKant runtime identity and retires after handing control to the verified materialized runtime.
