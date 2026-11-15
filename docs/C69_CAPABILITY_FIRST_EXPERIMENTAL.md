# C69 — Capability-first experimental preview (independent; not iKant runtime)

## Failure the design addresses

The post-C68 real ChatGPT session accepted exact human `I ACCEPT` but
stopped at `HOST_MESSAGE_INGRESS`: no callable host-native pre-registered
acceptance event hook was attested. The repository C68 listener was real
Node code, not evidence that ChatGPT Projects exposes that listener.

C69 reverses the design **for an independent, lower-assurance prototype**
without relaxing canonical C64/C68/C61/C59 contracts:
observe callable host tools first (ordinary chat, a GitHub connector when
actually connected, optionally local Node/filesystem and native file output);
use their physical outputs as inputs to a bounded experimental preview.
Do NOT infer callable availability from documentation, CI, a repository symbol,
a declared tool name, or a model's promise.

## Explicit experimental terms (present these before a new opt-in)

```text
iKant_LE experimental repository preview (not iKant runtime).
The host may use ordinary chat, pinned GitHub source reads and local files when actually callable.
Consent is observed as chat text only. No native message identity, anti-replay, lease or canonical runtime admission is attested.
Outputs are host-owned drafts/repository analysis, not sealed iKant decisions. No ACTIVE, persistent co-host, owner receipt or automatic retry.
No secrets, personal/sensitive inputs, privileged actions, unattended writes or security-critical decisions.
This profile does not resume an interrupted canonical iKant bootstrap. Request it independently with a NEW exact I ACCEPT EXPERIMENTAL.
```

Consent token: **`I ACCEPT EXPERIMENTAL`**. This is not canonical
`I ACCEPT`, must be a **later new user message** after presentation,
and offers no native origin proof. A user must separately initiate
independent prototype work. This mode never silently follows a blocked
canonical admission, does not clear a blocked runtime epoch, and never
grants control-plane authority.

## Verified execution path

1. Freeze a 40-hex `sourceHead` from a real GitHub connector call,
   independently witness current host tool callability, and present the
   exact terms above. Merely listing a tool does not prove it works.
2. User opts in with a new exact `I ACCEPT EXPERIMENTAL` message.
   **Trust limit:** the code can check only the text passed by the host;
   replay resistance and native event identity are not established.
3. With independent user intent, fetch pinned GitHub `README.md` bytes
   via a currently callable host edge. Supply `{path,blob_sha1,
   content_base64}`; the runtime checks canonical Base64 and actual Git
   blob SHA-1. It does **not** claim those bytes came from GitHub merely
   because the caller supplied matching metadata.
4. `qualifyC69ExperimentalPreview` validates the C69 offer SHA256 and
   frozen source head; returns `EXPERIMENTAL_SOURCE_PREVIEW`. Optionally
   supply `sessionRoot` for a real private Node staging write, reopen
   and samehash, immediately remove it, and receive
   `EXPERIMENTAL_LOCAL_PREVIEW`. No persistent writer is created.
5. The host can produce ordinary independent research, design, and draft
   artifacts within its actual native capabilities. Such output is not
   iKant-sealed and has no canonical runtime privileges or promised
   delivery. Report `active:false`, `native_event_attested:false`,
   `github_host_origin_attested:false`,
   `native_delivery_attested:false`, `persistent:false` and
   `owner_receipt_issued:false` precisely as returned.

## Fail-closed / negative capabilities

The function rejects a canonical bootstrap continuation, invented acceptance
event identity or clock, false native-origin or ACTIVE claim, scope expansion,
terms mutation, altered offer digest, wrong blob bytes/SHA/path and missing
experimental consent. Invalid local sink returns a typed unavailable result;
there is no browser/ZIP fallback or hidden retry. An existing integrity
contradiction must not be laundered by requesting the preview inside the same
blocked canonical attempt.

Only these operations are permitted by a successful projection:
`REPOSITORY_STUDY`, `EXPERIMENTAL_DESIGN`,
`DRAFT_USER_REQUESTED_OUTPUT`. No secrets, remote account writes, code
execution on behalf of iKant, unattended automation, privileged actions,
native event identity claim, ledger, activation, lease, EXIT or cohost ownership.

## Demonstrable DoD / adversarial falsification

- A non-native-host preview with exact opt-in returns a useful,
  **explicitly noncanonical** status after Git SHA verification.
- Local `sessionRoot` physically writes and reopens bytes under a
  private temporary path, then removes staging (no persistence claim).
- 100 deterministic semantic mutants in ten families (consent, source
  binding, terms, offer seal, scope, bytes, Git SHA, path, runtime
  escalation and prohibitions) must all reject without granting capability.
- Run tests on Node 20/22 alongside unchanged canonical cold-owner
  qualification. Existing C68 and C61/C59 tests must stay green.
- Project meta-prompt v7 explicitly separates new independent preview
  from blocked canonical bootstrap, and the renderer/doc remain byte-exact.
- **Not demonstrated by this PR:** native ChatGPT event provenance,
  native GitHub connector attestation inside the runtime module, session
  persistence, DOCX host delivery, iKant limited runtime or ACTIVE.
  These require independent physical receipts.

## Falsifiable host E2E for an actual internal consumer

An actual ChatGPT Projects trial should show: connected GitHub source
fetch (tool receipt), frozen head and actual Git blob bytes; exact
experiment-risk notice and a later new experimental consent; successful
source-only or local Node C69 qualification; ordinary useful research or
draft result explicitly marked EXPERIMENTAL; and NO ACTIVE or native identity
claim. The test fails if tools are not callable, byte integrity fails or
the assistant silently promotes the preview into canonical iKant.

The canonical `ADMISSION.json`, `BOOTSTRAP.json`, C68 host hook, and
C61/C59 ownership remain unchanged. This is an intentionally separate,
lower-assurance **host-owned** product research preview, not a downgrade
that bypasses iKant's runtime invariants.
