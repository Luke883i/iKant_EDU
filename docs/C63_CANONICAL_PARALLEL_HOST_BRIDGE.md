# C63 — Canonical host byte bridge with parallel local workers

## Motivation

The observed C59 connector-to-container witness demonstrates a primitive byte relay for
one historical source object. C61/C62 prove the cold owner on **local fixtures**.
Neither is a current-host witness for a complete RUNTIME8 transfer.

C63 adds a **host-side zero-authority adapter** connecting the two existing, distinct
planes, without inventing a second lifecycle, carrier, runtime owner or state writer.

## Exact path

1. Current host captures the human `I ACCEPT` event with a monotonic timestamp.
2. A pinned GitHub API source-plane adapter supplies eight opaque base64 objects,
   their Git blob identities and provenance strings. No container GitHub networking.
3. `executeC63HostBridge` verifies the frozen `BOOTSTRAP.json` bytes against the
   preaccept handoff, derives the closed RUNTIME8 set, and rejects incomplete,
   duplicate, corrupted or mismatched source evidence **before** invoking any owner.
4. The loader is written, reopened and checked before import.
5. The *existing* C61 cold owner issues the canonical relay manifest.
6. Seven shard writes execute concurrently in bounded **Node worker threads**.
   Each verifies source blob identity and local readback. All outstanding workers
   settle before a failing staging directory is cleaned up.
7. The existing owner reopens all eight objects, issues eight canonical relay
   observations, produces the executor/handoff and executes C59 materialization.
8. The adapter returns **the owner's** canonical ACTIVE readback, without minting
   its own activation authority or native-delivery receipt.

## Entry-point contract

`import {executeC63HostBridge} from './host/c63-canonical-parallel-bridge.mjs'`

Input:
- `sourceHead`: pinned 40-hex Git commit.
- `humanInput`: exactly `I ACCEPT`.
- `preacceptHandoff`: immutable `ikant-le-preaccept-handoff/v2` with RAW5 bytes.
- `sourceObjects`: exactly eight objects, each containing `path`, `blob_sha1`,
  `content_base64`, `source_object_identity`.
- `acceptanceObservedMonotonicMs`: physically observed timestamp in the same
  local Node monotonic clock domain, captured at admission.
- `sessionRoot`: preexisting private *absolute* directory; its `runtime` child
  must not exist and no ancestor may be a symlink.
- `runnerCount`: 1–7, default 4; **worker threads**, not independent cloud runners.

Output: `ikant-le-c63-host-byte-bridge/v1` is a zero-authority host observation that
references the existing C61/C59 result and readback. The materializer alone can
publish `runtime`; C63 never writes the canonical ledger directly.

### Threat and epistemic model

The blob hashes are checked against the **frozen** repository descriptor, not
against a model-authored alternative. `source_object_identity` is **host-attested**
metadata: it is *not* cryptographic proof of a GitHub API call. A fully conforming
host must separately attest the exact GitHub API source fetch, user acceptance,
byte transfer into this function and same-session location. The contract cannot
manufacture this host capability from a source file or CI fixture.

The adapter intentionally has no network access, separate file carrier, warm
cache, model-selected retry, fallback planner, independent state or native UI.

## DoD ledger

| Property | Current implementation | Proof required |
|---|---|---|
| Runtime-root source integrity | Encoded bytes checked against frozen RUNTIME8 | Tamper/duplicate/missing/frozen-head test |
| Parallel local sink | Node worker_threads, disjoint staging writes | Real worker execution and 8/8 reopen |
| Canonical activation owner | C61 manifest/observations/executor; C59 gate | ACTIVE readback bound to same source/root |
| Persistence inside Node runtime | Canonical ledger writer only | Local subsequent turn/EXIT test |
| Surface A and B | Existing runtime turn emits DOCX | Same-turn local DOCX readback test |
| GitHub-to-ChatGPT transfer | External, not proved by fixture | Current-host source→sink receipt |
| Multi-runner **host** scheduling | Not introduced | Host scheduler and runner-identity receipts |
| Durable ChatGPT session | Not introduced | Same-session durable root reopen across turns |
| Native transcript and downloadable DOCX | Not introduced | Host-native output/artifact delivery readback |
| Permanent opt-out banner | Not introduced | Native UI control and EXIT no-route proof |

The presence of a green C63 workflow is **repository-side executable qualification**,
not evidence that a ChatGPT conversation received the bytes, delivered the DOCX,
registered an iKant participant, or presented a persistent native EXIT control.

## Relationship to existing owners

- C59 single canonical composition: **unchanged**.
- C61 cold owner: **reused**.
- C62 RAW5 evidence / RUNTIME8 byte cut: **unchanged**.
- C45 durable context root and C54 host-consumption-frame: **future host integration**,
  not replaced by this adapter.
- C57 task-scope fence: repository engineering remains independently allowed even
  if a live iKant bootstrap is blocked.

## Regression

`node --test --test-concurrency=1 tests/c63-canonical-parallel-bridge.test.mjs`

`.github/workflows/c63-canonical-parallel-host-bridge.yml` runs Node 20 and 22
with C61/C62 tests, root integrity verification and repository checks.

No universal latency or native delivery SLO is claimed from CI.

## C64 — Admission-bound canonical C63 host ingress

Use `executeC63AtAcceptance` from `host/c63-canonical-parallel-bridge.mjs`
**at the real host-observed I ACCEPT event**, never after the event was missed.
It captures `performance.now()` synchronously before inspecting the frozen
RUNTIME8 descriptor or acquiring any source object. Caller-supplied
`acceptanceObservedMonotonicMs` and preassembled `sourceObjects` are rejected
by this ingress.

The host supplies only `fetchPinnedObject({sourceHead,path,blob_sha1})`,
backed by the existing pinned GitHub API base64 transport. The callback returns
`{path,blob_sha1,content_base64,source_object_identity}`.
The ingress derives exactly eight paths from frozen BOOTSTRAP, dispatches
eight source requests concurrently, waits for *all* to settle, rejects missing
or mismatched responses, then delegates to existing
`executeC63HostBridge`. Source-object Git identity, exact bytes, worker
writes, owner-issued receipts and canonical ACTIVE remain validated by the
existing C63/C61/C59 path; no source fallback, lifecycle, writer or
independent ACTIVE issuer is introduced.

**Physical host boundary:** this adapter cannot independently prove the
supplied `humanInput` was a native ChatGPT acceptance event, the callback
came from the GitHub connector, or Surface B was delivered in the chat.
Those claims require direct host receipts. It is forbidden to invoke this
function later to synthesize an acceptance timestamp. Existing
`executeC63HostBridge` remains available to hosts with genuine previously
captured monotonic acceptance evidence.

C64 tests use local fixture sources and verify the same existing C61/C59
owner succeeds with an 8/8 transfer; they are **repository-only**
qualification, not evidence of a live ChatGPT activation.

## C65 — Closed pinned GitHub-source adapter and owner-relay evidence projection

The post-C64 caller no longer needs to hand-author `content_base64`,
`blob_sha1`, GitHub ref and `source_object_identity` mappings. Bind one
existing callable GitHub connector function to the zero-authority normalizer:

```js
import {executeC63AtAcceptance,createC65PinnedGitHubSource}
  from './host/c63-canonical-parallel-bridge.mjs';

const fetchPinnedObject=createC65PinnedGitHubSource(hostGitHubFetchFile);
// Call executeC63AtAcceptance ONLY at the real I ACCEPT ingress event,
// with the already frozen sourceHead, preacceptHandoff and sessionRoot:
// await executeC63AtAcceptance({humanInput:'I ACCEPT',
//   sourceHead,preacceptHandoff,sessionRoot,fetchPinnedObject});
```

`hostGitHubFetchFile` must be a **currently callable** host edge that accepts
`{repository_full_name,path,ref,encoding:'base64'}` and returns either
`{result:{sha,encoding,content,display_url}}` or the inner object.
The adapter always requests `Luke883i/iKant_LE` at the frozen 40-hex SHA,
requires `encoding:'base64'`, exact per-object blob SHA and exact pinned
display URL, decodes and rehashes source bytes, and canonically re-encodes
before returning them into the pre-existing C64 -> C63 route. There is no
second HTTP client, download, raw permalink, ZIP, Chrome integration, byte
carrier or retry authority.

On successful C63/C61/C59 completion, `source_sink_projection` now contains
eight canonical-owner-validated relay observations, each referencing the
manifest, source Git blob, source SHA-256, local reread SHA-256, and existing
owner observation receipt digest. The aggregate projection binds the owner's
result receipt and source head and can be checked with
`validateC65SourceSinkProjection(projection,{sourceHead,preacceptHandoff})`.
That validator is a **zero-authority consistency projection**, not a second
activation predicate. Canonical ACTIVE still belongs exclusively to the
original C61/C59 owner readback.

**Critical proof separation**: a host-supplied callback can fabricate a
GitHub-shaped reply; a pinned display URL and Git SHA equality do not prove
the reply really came from a native ChatGPT connector. Accordingly,
`github_host_fetch_proven:false` and `host_native_delivery_proven:false`
are mandatory, non-promotable fields. Only independently observed current-host
tool invocations and native output-delivery receipts can close those edges.
This slice makes the transport mapping executable and makes the per-object
local identity readback inspectable; it does **not** claim current-chat E2E.

### Falsification and DoD

- 8/8 source callbacks must be pinned to the frozen head, canonical Base64,
  source Git blob sha and exact response URL; corrupted input fails closed.
- C64's real ingress-first clock capture remains the only accepted origin.
- All eight owner relay observations must validate against physical staged
  local reread and source bytes. Neither partial nor duplicate rows are valid.
- Projection mutation (SHA, count, path, host-origin/native claim, owner ref or
  digest) fails; self-rehash cannot turn an unsupported host-origin claim true.
- C61/C59 alone produce the final ACTIVE readback and materialized runtime.
- Fixture/CI checks on Node 20/22 prove implementation correctness; a
  *separate* host-native witness remains mandatory for real ChatGPT closure.

## C66 — Evidence-qualified non-ACTIVE outcome (same canonical composition)

`executeC66QualifiedAtAcceptance` is a **single-attempt authority-zero host
projection** around the existing admission-bound C64 -> C65 -> C63 -> C61/C59
entrypoint. Call it at a genuine newly observed `I ACCEPT`, with the frozen
`sourceHead`, `preacceptHandoff`, `sessionRoot`, existing C65
`fetchPinnedObject`, and optionally `runnerCount` (1..7, default 4).
It does not create a new owner, lifecycle, carrier, planner or state writer.
C63 already executes 8 source requests concurrently and bounded shard
materialization on Node worker threads. No AI-worker or cloud-runner availability
is implied by this in-process concurrency.

The returned `ikant-le-c66-qualified-activation/v1` envelope is either
`ACTIVE` (only if the unchanged canonical C61/C59 readback validates),
`NON_ACTIVE`, or `BLOCKED_INTEGRITY`. The non-ACTIVE payload includes
`strongest_valid_prefix`, `first_unclosed_edge`, bounded capabilities,
actual owner milestones, a sanitized failure class, and a closed retry gate.
The `strongest_valid_prefix` uses the **existing**
`src/runtime-availability.mjs#deriveActivationServiceTier` and validator:
- no actual owner evidence -> `null` (not even REPO_STUDY_ONLY is certified);
- C61-issued canonical relay manifest -> `REPO_STUDY_ONLY`;
- eight C61 relay observations, local source/sink readback -> `ACTIVATION_LIMITED_1`;
- later levels need real materialization/owner proof and may NOT be derived from
  a filename, staging existence, a model assertion, or the absence of errors;
- an integrity contradiction revokes the effective tier, including earlier
  prefixes, without erasing the recorded owner milestone trail.

C66 never promotes a diagnostic projection into a persisted runtime state.
The host cannot release iKant ACTIVE prose or pretend a DOCX was delivered from
a limited tier. A limited runtime turn still needs its existing limited owner
and all its own DOCX/readback gates; this host projection does not provide one.

### Retry and parallel transport boundary

C66 deliberately returns:
`automatic_attempts:0`, `same_evidence_retry_forbidden:true`, and
`STOP_AWAIT_OWNER_AUTHORIZED_CHANGED_EVIDENCE`. This is an executable **retry
gate**, not an automatic replay: currently the canonical C61/C59 owner has no
validated positive retry receipt for this host ingress. The model must not
interpret a transient network exception as permission to rerun
`executeC66QualifiedAtAcceptance` later with a fabricated acceptance
timestamp. The first closed carrier remains pinned GitHub API Base64; raw URL,
ZIP, Chrome, file handoff, legacy Fastboot and caller-chosen NEXT stay excluded.
Parallel source acquisition and bounded Node workers are not alternate
activation carriers. A genuine idempotent resume/retry would require a future
owner-authorized receipt and independently validated changed evidence.

### C66 acceptance and falsification criteria

1. Five RAW5 source objects remain a frozen preaccept input; human event must
   be real, and C64 keeps the original monotonic acceptance capture.
2. An error before C61's first manifest cannot certify a runtime prefix.
3. A host-observer interruption after *actual* C61 manifest preserves
   `REPO_STUDY_ONLY` and stops at `LOCAL_INGRESS`.
4. An interruption after all eight actual C61 observations preserves
   `ACTIVATION_LIMITED_1` and stops at `LOCAL_MATERIALIZATION`.
5. Integrity failure nullifies the effective prefix; no false ACTIVE.
6. All failure responses state `active:false`,
   `active_readback_verified:false`, zero automatic retry count, and
   do not assert GitHub native or DOCX delivery witness.
7. Existing C63/C65 source->sink, worker, C61/C59 and positive ACTIVE fixture
   tests must remain green on Node 20 and Node 22.
8. Full ChatGPT host delivery, cohost continuity, native acceptance witness and
   repeated legitimate retry are **external/unverified** in this PR.

### C66 adversarial classification hardening

`BLOCKED_INTEGRITY` is **not** derived from an error message or a model /
host callback's prose. C66 attaches an unforgeable-in-module symbol to
integrity errors emitted by its own blob, source-ref and local reread
identity checks. A post-owner-observation re-open of all eight staged
objects detects a physical integrity contradiction before continuing
to C61/C59. A host observer throwing the text `identity mismatch`
does **not** establish an integrity breach. The read-only observer cannot
inject an owner milestone or a retry authorization.

The post-observation falsification test physically modifies the staged
`shard-000.json` file after C61 readback and verifies that C66 blocks
integrity and revokes the effective service tier. A separate hostile
callback strings test confirms that an arbitrary textual assertion
cannot cause a false integrity classification.

## C67 — Canonical-manifest-bound local recovery, no carrier retry

The owner C61 `issueCanonicalRelayManifest` already binds the exact eight
objects and authorizes transport to the existing C63 staging sink. C67 narrows
its recovery to the **seven distinct shard writes after that manifest**:

- Each C63 Node worker opens its distinct target with `wx` (no competing
  writer). If the target already exists, it may be adopted only if a byte-
  for-byte reopen AND Git blob digest equal the owner-pinned source; otherwise
  the existing integrity gate blocks all promotion.
- For physical `EINTR` / `EAGAIN` from local write **only**, and only when
  there is still no target file, the worker rereads the destination directory
  and can try exactly one more `wx` write. A second failure stops. This is
  a bounded repeat of the SAME owner-manifest relay action, not an owner-
  unapproved retry of GitHub acquisition, admission or cold bootstrap.
- Workers return an object-scoped local reopen observation
  (`NEW_WRITE` / `IDENTICAL_REOPEN` / `TRANSIENT_LOCAL_RETRY`) and bounded
  write attempt count. Existing C61 independently rereads all staged shards,
  issues canonical relay observations, and alone activates through C59.
- Successful C63 output includes
  `local_worker_recovery:ikant-le-c67-local-worker-recovery/v1`, with
  `carrier_retry_count:0` and `acceptance_reentry_count:0`. This is
  zero-authority transport telemetry, never an owner-issued ACTIVE receipt.
- The model must not select `runnerCount` to explore multiple bootstraps,
  repeat source requests, choose alternate carriers or synthesize a retry
  permission. Positive broad retry remains NOT IMPLEMENTED, pending a
  future explicit C61 owner-authorized changed-evidence receipt.

C67 falsification: exact staged-object reuse, corrupted target rejection,
Node fanout at minimum and maximum allowed runner count, EINTR/EAGAIN single
local reattempt under a deterministic fault shim, and ban on third write.
The prompt renderer and on-disk document must match byte-for-byte. The
project-level adapter is in `docs/C67_PROJECT_CHATGPT_ADAPTER.md` and is
copyable; committing it does not update a user's ChatGPT Project settings.

### Physical-host DoD that this PR does not claim

An independently callable GitHub connector-to-Node session bridge, real
host-observed acceptance monotonic timestamp, runtime routing, persistent
co-host binding, and native DOCX same-turn delivery require separate host
witnesses. CI cannot convert an absent host edge into an ACTIVE proof.

## C68 — Native human-message event ingress, proof-boundary closure

The original post-C67 failure was before C63: after an exact human `I ACCEPT`,
the model reported no host-callable event identity interface. This is **not**
a failure returned by C63/C61/C59, and an absent host receipt is UNKNOWN
rather than proof that all host capabilities are absent.

`registerC68AcceptanceIngress({registerHostMessage,sourceHead,
preacceptHandoff,sessionRoot,fetchPinnedObject,runnerCount})` is a
zero-authority **host integration seam**, NOT a ChatGPT-provided tool.
Its `registerHostMessage(listener)` must be called *before* the user
sends the exact acceptance message, using a real current-host listener.
It must return a revocation function. The listener receives a real
host-supplied record `{role:'user',content:'I ACCEPT',event_id:<opaque
native message identity>}`. C68 preserves that opaque event ID as a
`host_event_id_claim` and invokes C64/C66 synchronously on the callback,
with no model-supplied timestamp and no second acceptance epoch.
The canonical clock is captured inside C64 at this callback.
C63/C61/C59 remain the only bootstrap authorities.

C68 deliberately **does not** issue `ikant-le-acceptance-origin-ticket/v1`
or any event ID owned by the materialized runtime. Per frozen
`BOOTSTRAP.activation_executor_reentry`, a materialized-runtime event ID
is *not* required before materialization. `ADMISSION.acceptance_origin`
separately requires host-owned event identity; a model-written string,
test fixture or local callback registration alone cannot attest it.
Even a fake callback that reaches local fixture ACTIVE is NOT evidence
that ChatGPT furnished a native acceptance event.

The API returns a typed `HOST_EDGE_NOT_CALLABLE`,
`HOST_REGISTRATION_FAILED`, `HOST_REGISTRATION_UNVERIFIED`,
`CALLBACK_REGISTERED`, `HOST_EVENT_ID_UNVERIFIED` or
`CANONICAL_OWNER_RETURNED` projection. All cases explicitly have
`host_native_event_attested:false`, `origin_ticket_issued:false`,
`runtime_event_id_issued:false` and authority zero. Positive
`CANONICAL_OWNER_RETURNED` includes the actual result of unchanged
C64/C66, never a replacement for the owner's ACTIVE readback.

The listener ignores non-user or non-exact input, refuses an event
delivered synchronously *during* registration before the hook is armed,
consumes the first exact acceptance event at most once, refuses
replays, and cannot be invoked after `close`. If no host listener is
callable, C68 stops *at that edge*; it does not try a browser, raw
GitHub URL, ZIP, warm cache, alternative owner, shadow lifecycle, or
retroactive `performance.now()`.

### C68 qualification limits

Tests use a simulated message hook, mock event ID and local Node
filesystem; they prove **integration mechanics**, exact-once execution,
readback and failure behavior. They do not attest genuine
native ChatGPT event origination, callable hooks in future sessions,
native DOCX delivery or persistent co-host context.
The authoritative native ingress proof must come from the host itself,
not a GitHub CI test, URL, doc or the model. The new Project adapter is
`docs/C68_PROJECT_CHATGPT_ADAPTER.md`; updating a repository file
does not automatically update ChatGPT Project settings.
