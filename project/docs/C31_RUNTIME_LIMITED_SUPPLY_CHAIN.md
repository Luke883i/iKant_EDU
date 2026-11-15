# C31 — Runtime-Limited Supply Chain Closure

C31 closes the product/runtime supply chain of the already-selected `RUNTIME_BOUND_LIMITED` tier. It does not add a tier and does not change ACTIVE.

Baseline: `47e31441180b36f25ab72ff46cc12ba6765f7530`.

## Problem closed

C30 established a safe non-ACTIVE service tier but its library primitive still accepted caller-authored activation booleans and a caller-provided Node dispatch receipt, and the session-chat adapter did not invoke the tier.

C31 replaces that trust boundary with this chain:

`exact I ACCEPT -> source-bound materialized runtime -> acceptance-origin receipt -> executed-provenance probe -> limited capability receipt -> runtime-owned Node dispatch -> runtime seal -> computed telemetry -> atomic DOCX/readback -> structured handoff`

The first unclosed canonical activation edge remains `ACTIVE_READBACK`.

## Capability receipt

`ikant-le-limited-runtime-capability/v1` embeds and binds:

- source head;
- runtime-root SHA-256;
- exact acceptance event and Terms digest;
- acceptance-origin ticket/receipt;
- local materialization receipt with atomic publish/reopen;
- current materialized-root readback;
- executed-provenance receipt over the expected runtime modules;
- artifact-sink readiness;
- the fixed non-ACTIVE tier and `ACTIVE_READBACK` frontier.

The receipt is authority-zero and non-persisted canonical state. The deployment adapter may store it outside the canonical ledger as a service capability.

## Runtime-owned dispatch

The limited turn no longer accepts `activationEvidence` or a dispatch receipt from its caller.

It generates `ikant-le-node-dispatch/v1` internally and validates its digest, input binding, acceptance epoch, pre-turn status and host surface.

## Artifact and telemetry hardening

Limited telemetry v2 computes completeness from eight actual checks rather than assigning 8/8 as a constant.

The DOCX path is derived from a full turn identity hash binding capability + dispatch + input + output + runtime seal. Publish is temp-file + fsync + atomic rename + reopen. Existing same-content replay is accepted; a different payload at the same identity fails as a collision.

The canonical artifact descriptor excludes the absolute local path. The local path remains host metadata only.

## Product ingress

The compatibility/session-chat adapter now exposes two explicit non-ACTIVE operations:

- `accept-limited` / `ikant_le_accept_limited`;
- `limited-turn` / `ikant_le_limited_turn`.

They are separate from canonical `accept` / `turn`.

Limited acceptance materializes the exact runtime and issues the capability without creating `.ikant/ledger.jsonl`. Limited turns revalidate that capability and fail if a canonical ledger appears.

## Writer semantics

For limited service, the C30 `WRITER` requirement is clarified as **limited artifact-sink write/readback**, not the canonical state writer. ACTIVE still requires the existing canonical writer plus ACTIVE readback.

## Falsification

Seed: `0xC31F411C`.

1,000,000 deterministic cases cover 20 individually necessary supply-chain requirements, including forged/stale acceptance, source/root drift, materialization and provenance tamper, caller dispatch injection, dispatch digest/epoch drift, self-declared telemetry, non-atomic/colliding artifact publication, canonical-state mutation, false platform ACK and missing product ingress.

Qualification target:

- candidate/oracle mismatches = 0;
- unsafe limited closure = 0;
- every requirement fails at least once;
- 20/20 mutants killed;
- at least one valid witness.

## Definition of Done

C31 is complete when:

1. runtime-root contains capability/dispatch/evidence modules;
2. caller-authored activation booleans and dispatch receipts cannot close a limited turn;
3. exact acceptance/source/materialization/provenance are revalidated at capability issuance and consumption;
4. Node dispatch is runtime-owned and epoch-bound;
5. telemetry completeness is computed;
6. DOCX publication is content-addressed, atomic and read back;
7. absolute local path is excluded from canonical artifact identity;
8. session-chat adapter exposes accept-limited and limited-turn;
9. no limited acceptance/turn creates or mutates the canonical ledger;
10. C31 1M falsification passes with all mutants killed;
11. C20 ACTIVE deployment regression remains green;
12. runtime-root verify, full tests/checks and exact-head CI are all green.

PASS proves repository/product closure of the bounded service chain on the bound runtime. It does not promote the session to ACTIVE and does not prove platform delivery acknowledgement.
