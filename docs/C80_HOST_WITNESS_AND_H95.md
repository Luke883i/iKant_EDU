# C80 — Host Witness & H95 Field Qualification

## Why this slice follows C79
C79 produces an exact, SHA-bound Surface A presentation packet after an actually executed C78 Node computation. It cannot prove that a ChatGPT-native user event existed or that the client delivered that output. An unsigned hash may be produced by an adversary; a self-signed key does not resolve the trust problem. The first open physical edge is independent source/host provenance, then native presentation, then genuine two-turn continuity.

## Semantic design
C80 adds a **verifier-only**, externally anchored Ed25519 signature contract around a two-turn native-host claim. It does NOT embed a private key, register browser hooks, create ChatGPT events, call Node on a user's behalf, confer C59 authority or claim actual delivery. The native host must install the signing key and attest real source reads, native message IDs and display events itself; source code merely checks signatures and contradictions.

A signed record contains: issuer, trial/session IDs, pseudonymous participant digest, unique task ID, a fixed Git source HEAD and C77 manifest digest, two unique pairs of native input/output event IDs, two validated C79 packets, hashes of bound user input/Surface A output/rendered bytes, prespecified five task-value outcomes and four safety-hard-gate observations. It deliberately does **not** include private conversation content in field-evaluation telemetry. The host must keep the underlying native evidence independently inspectable under appropriate privacy controls.

### Validation stages
1. Validate the frozen source ref, manifest, expected issuer identifier and *externally provisioned* Ed25519 public key.
2. Verify a detached signature over the domain-separated, deterministic JSON serialization. An arbitrary key supplied by the same untrusted claimant must NOT be promoted to a native host root of trust.
3. Check 2 distinct native turns, C79 packet structure, content digest matches, source HEAD, anti-replay of trial/task/event IDs, holdout classification and strict non-escalation to owner/ACTIVE.
4. Check every signed record against the global replay set; reject the entire cohort on a single false ACTIVE, false origin, unauthorized side effect or unreported integrity contradiction.
5. Evaluate the **contract C72** thresholds: at least 500 tasks, 50 sessions and 20 participants; five weighted dimensions 40/25/15/10/10; each lower bound ≥0.90 and the weighted lower bound ≥0.95. Use one-sided Wilson bounds with Bonferroni alpha 0.01 per dimension, making simultaneous bounds more conservative than five unadjusted intervals.
6. Even if all signatures and numerical checks pass, return `C80_SIGNED_CLAIMS_THRESHOLD_MET_EXTERNAL_AUDIT_PENDING`, never `NATIVE_ACTIVE` or `USER_VALUE_95_PERCENT_PROVEN`. Independence, field representativeness and issuer native-event instrumentation still require separate human/host witnesses.

### CLI
`node scripts/c80-field-qualify-cli.mjs --public-key /host/provisioned/public.pem --issuer host-witness-id --head <pinned-40-hex> --manifest <trusted-64-hex>`

Input on stdin: `{"schema":"ikant-le-c80-field-cohort-input/v1","records":[{"payload":{...},"signature_base64":"..."}]}`. The public key is externally provisioned, not retrieved from the same user-provided payload. Never put signing keys, sensitive chat records or host credentials in the Project instructions or CI artifacts.

## Fail-closed rejection taxonomy
`FROZEN_SOURCE_MISSING`, `EXTERNAL_TRUST_ANCHOR_REQUIRED`, `C80_SIGNATURE_FORMAT`, `C80_ED25519_REQUIRED`, `C80_SIGNATURE_OR_KEY_INVALID`, `C80_SIGNED_SEMANTIC_CLAIM_INVALID`, `REPLAYED_TRIAL_OR_TASK`, `REPLAYED_NATIVE_EVENT_ID`, `SAFETY_HARD_GATE`, `COHORT_MINIMUMS`, `H95_LOWER_CONFIDENCE_BOUND`, `INDEPENDENT_NATIVE_HOST_ISSUER_ATTESTATION`.

## Strict DoD
Repository: direct Node20+Node22 Ed25519 verification, 1000 corrupted-signature trials, 1000 re-signed invalid semantic trials, 500 synthetic fixture records for lower-bound math, replay/safety/undersampling rejection, real C79/C78 regression, unchanged runtime-root and repository CI.

Native host: real message events and display receipts from external independently trusted instrumentation, verifiable source-to-Node transfer, two actual turns, genuine holdout task collection, external auditor trust qualification. Until these are present, **H95 remains NOT MEASURED, and iKant CANONICAL ACTIVE remains NOT ATTESTED**.

## Known limitation
The signatures attest the issuer's assertions. They do not prove that the issuer truly observed ChatGPT's client, that the sample is independent, or that its task scoring is correct. A dishonest or compromised issuer can still sign false statements. The repository refuses to launder signed synthetic CI cases into product claims.
