# C104 — bounded, resumable acquisition supervisor (authority=0)

This is a **source-byte manager**, not a new iKant owner, a competing
C77/C96 carrier, a long-running model, or a native ChatGPT hook. It closes a
specific gap: C96's all-or-nothing acquisition cannot reuse already reopened
members over later host turns. C104 rechecks physical members in a private
cache after process restart and returns exact remaining paths. The cache and
runtime output are always separate. No receipt of this module proves GitHub
provider origin, C84, canonical ACTIVE, human native-event identity or UI delivery.

## A two-stage graph and DoD

1. Actual C72 EXPERIMENTAL selection and frozen HEAD, *then* source acquisition.
2. Prefer the exact-head C77 artifact with existing C94/C95/C98 checks. If no
   authorized artifact-byte callback exists, use C96's physical parallel member
   transport if installed. Otherwise ask the host to supply member bytes to
   the **C104 NDJSON ingress**. Never retry a known failed identical DNS path.
3. Derive the C104 source spec at the frozen Git checkout with
   `node scripts/c104-source-spec.mjs`. It takes 24+9 C77 builder declarations,
   70 C71 anchor declarations, and the unique Git blob IDs from the actual
   `git rev-parse HEAD:<path>` tree. Current baseline expects 65 paths. The
   spec is not executable source and its SHA is integrity, not origin proof.
4. Obtain public Git blob bytes from an actually callable host bridge; send
   `STAGE` frames (`path`, `contentBase64`, `carrierId`) to C104. It only
   accepts exact blob bytes, writes once, reopens, and counts the **physical
   cache**, not a model declaration. An absent host-byte bridge returns a
   typed `C104_MATERIALIZATION_NEXT_REQUIRED` with `next_batch` and full
   missing set. No `DONE` when even one object is absent or corrupt.
5. Once `C104_SOURCE_BYTES_100PCT_NOT_RUNTIME`, run original C77 builder and
   original kernel on a source graph independently qualified for its HEAD,
   verify C77/C81 as required, and only then route voice through the existing
   runtime. C104 alone does **not** perform that promotion.

## Host adapter physical example

The host must build a source-specific `context.json` containing real C72
selection, exact HEAD, the complete spec, its SHA and an explicitly mounted
absolute cacheRoot. Launch:

`node scripts/c104-ingress-cli.mjs --config /ABS/context.json --ndjson`

Send one frame per line: `{"op":"INSPECT"}`, `{"op":"NEXT"}` or
`{"op":"STAGE","path":"...","contentBase64":"...","carrierId":"HOST_GITHUB_FILE"}`.
The adapter may acquire eight members concurrently by calling an installed
GitHub connector and serializing each returned raw blob to the local stdin
carrier. If the host supports callbacks inside Node, use
`runC104HostWorkers({context,readFile,carrierId,concurrency:8})`. A declared
callback name or Python snippet is **not proof** of physical transport.

## Anti-early-exit and bounded attention

The prompt cannot force a model to continue indefinitely. The machine can
reject a false-success state and survive the model's interruption. While
missing files exist, `compute_priority=SOURCE_MATERIALIZATION`, `next_batch`
and counts must be reported; `MATERIALIZATION_DONE` is forbidden. At a source
cache of 100%, the next obligation is original build/Node readback, not
conversational fiction. If a real capability is unavailable, finish the
current response as `BLOCKED` with the exact missing items and carrier gap;
do not narrate futile retries or claim 100% merely because progress stopped.

## Qualification

Local fixtures exercise safety, resumability, worker concurrency, corrupted
bytes, malicious paths and close/open cycles. GitHub CI tests the actual
65-object source spec at current PR HEAD, stages the real checkout bytes through
an actual asynchronous host-provided local-file read callback, verifies a
C77 builder from the original source graph, and executes C77 on a real bounded
input. On the same input the test independently runs the original C101/C102/C87
observation bridge, reopens C87 and validates the C103 minimum envelope. C103
PASS is structural, not provider or native-host origin attestation. CI does NOT demonstrate the GitHub connector→ChatGPT Node callback or
native per-turn ChatGPT ingress. Keep field qualification distinct.

Never repin SOURCE_HEAD of an existing chat because this code was merged.
This engineering test uses its own PR commit epoch.
