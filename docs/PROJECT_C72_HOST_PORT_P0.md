# P0 — Host plug-and-play port: original C72, technology-independent ingress

Scope: Host engineering only. This patch does not issue C72 consent, install ChatGPT tools,
authenticate provider events, alter C135/C87/C125, activate CANONICAL or repin a live iKant session.

## For humans

The repository describes **what must be proved**; ChatGPT Host picks **how to physically move
the five original files** using a capability that actually exists in this chat.
Two equivalent legal choices now feed the same C72 original owner:

* `HOST_CALLBACKS`: the Host already has real callable functions that read the pinned GitHub HEAD
  and five files. The original recovery executor still consumes them unchanged.
* `HOST_SOURCE_PACKET`: the Host itself fetches the original bytes from its authorized GitHub
  connector and physically transports one bounded JSON packet into a real Node process.
  This is useful when tools cannot pass callback objects across environments.
  `scripts/project-c72-portable-cli.mjs` is one concrete stdin carrier; the Host may instead
  call the exported function with a packet in an installed Node process.

No callback, no physical byte transfer or no actual Node means a typed STOP, **not**
a claim that GitHub, Node or C72 is universally absent. One cannot install provider hooks
merely by modifying a Project prompt. The Host's choice is implementation latitude,
not permission to bypass an original owner.

## Source contract and exact packet

Single owner of *transport effects*: `contracts/project-host-capability-port.json`.
The original owner remains `host/c72-public-mode-admission.mjs`; the new port has authority=0.
The existing `host/project-c72-host-recovery.mjs` delegates only the transport selection to
`host/project-c72-capability-port.mjs#bindC72Transport`.

An opaque packet has schema `ikant-host-c72-source-packet/v1`, exact `source_head`,
observed `live_head`, `carrier_kind=HOST_OPAQUE_TRANSFER`, exactly five ordered records
`{path,source_head,blob_sha1,content}`, and false `source_origin_attested`/
`native_event_attested`. The Host must have independently read these documents through its
authorized GitHub connector. Node validates size, path, shape, HEAD agreement, and the original
reentry recomputes all Git blob identities. A digest alone does not authenticate the network
event. The already persisted first-turn witness is never retroactively constructed.

The optional physical CLI accepts:
```json
{"schema":"ikant-host-c72-port-request/v1","humanMessage":"I ACCEPT",
 "freshHumanTurn":true,"priorTurnEvidence":{"...":"real first-turn witness"},
 "sourcePacket":{"...":"actual five pinned bytes"}}
```
This is only an illustrative shape, not a valid example of evidence. The actual Node request
requires original first-turn data and currently checked live HEAD. The CLI preserves and prints
the **complete original accepted and introduction objects** on success and a typed result on
failure. Do not rerun on a previously unknown owner outcome.

## Exhaustive cross-PR census: 165–169

The source-level DoD register in `docs/PROJECT_C72_BOOTSTRAP_WITNESS_AND_BRIDGE_P0.md`
distinguishes implementation from native delivery. The following are **non-guaranteed outcomes**
remaining after their merges, not accusations that each source-level feature is missing:

| PR | Implemented source intent | What was NOT guaranteed by merge |
|---|---|---|
| #165 | Five-only preaccept reads, Terms freeze, original C72, prompt size, no false HARD | Actual global Host tool exclusivity, original event authentication, preinstalled gateway |
| #166 | Canonical SHA-verified SVG, escaped six-slot renderer and text fallback | Native ChatGPT render hook, universal visual identity/actual display |
| #167 | Original-owner C72 postaccept reentry, first-turn witness comparison, stop-on-unknown | Actual GitHub connector→Node byte ingress and verified native distinct-turn provenance |
| #168 | AUTO planner, typed Node/bridge diagnostics, final HTML emitter | Actual Host dispatch of AUTO and final repository emitter on every ChatGPT message |
| #169 | First-turn SHA retention rule, Node executor, matrix/10k regression, postmerge prompt chain | Source callback implementation by Host; physical transfer; end-to-end original C72, EDU, C135/C87, native delivery/persistence; Project instruction installation readback |

#169 is now merged at `15aa360606d9d5abf522cddc02da9eef7a4ef1d2`. Published main check runs
include successful postmerge Node checks. CI success proves checkout-based source qualification,
not an installed Host adapter or a working provider integration.

Additional temporal/race and adversarial categories for this patch:
- Contract↔prompt drift: generator/BOOTSTRAP/source/matrix/test anchors must match.
- Cross-epoch drift: live HEAD must equal original first-turn SHA, never auto-repin.
- Overread before consent: no new preaccept calls, modules or source packet allowed.
- Callback/packet ambiguity: fail closed before invoking owner.
- Partial, reordered, duplicated, forged, oversized or mutated packet: typed STOP.
- Race/unknown during owner invocation: never replay the original owner.
- False source origin, fake provider event or fabricated native delivery: disallowed.
- Source on GitHub not in Node: CLI packet is only possible after physical transfer.
- CI artifacts misrepresented as field evidence: reject PRODUCT_GO.
- EXPLICIT HOST_ENGINEERING remains independent of runtime C72.
- Mode selection must still be another distinct human message.
- OneShell glyph/voice/ledger cannot be promoted on C72 admission alone.

## Minimal acceptance contract at three scales

**GLOBAL DoD (product/release):** The first-contact flow is unmodified. Fresh exact later
`I ACCEPT` causes real C72/v2 accepted and full introduction, then a further exact
`EDU`/ `CANONICAL` owner selection. New and old Host transports produce the same original
receipt semantics and no duplicate writer or owner. Every subsequent C135/C87/visual claim
retains independent runtime and provider readback requirements. A source CI green is
`SOFTWARE_PASS`, never automatic `PRODUCT_GO`.

**INTERMEDIATE DoD (host integration):** The Host chooses exactly one *actually callable*
carrier, freezes source HEAD, keeps the first-turn witness, observes physical Node ingress,
validates five Git blobs and original C72 output, discloses native-event/source-provenance
limits, and emits a typed first-edge STOP when capability is missing. The Host does not ask
a layperson to debug gateway internals or install arbitrary source before consent.

**LOCAL DoD (patch/regression):** Node20+Node22 actual owner success by callbacks and packet,
real separate process stdin success, corruption/duplicate/drift/dual-carrier negatives,
100,000 synthetic 5-axis port cases (NOT 100,000 native sessions), stable legacy tests,
generation source/route/size bounds, source-closure manifest match, CI on PR HEAD and
postmerge main. A separate field E2E must witness fresh native chat source ingress,
original C72 and mode, actual EDU loader/C135 and persistent delivery; pending field
evidence cannot be replaced with GitHub Actions labels.

## Anti-regression ownership

* Source: `contracts/project-host-capability-port.json` defines admissible effects;
  the existing C72 original validators remain untouched.
* Executable: `host/project-c72-capability-port.mjs` is the only new selectable port;
  `host/project-c72-host-recovery.mjs` still performs HEAD/blob/owner checks.
* Physical proof: one-shot `scripts/project-c72-portable-cli.mjs` with exit status and JSON.
* Propagation: `BOOTSTRAP.project_session`, `contracts/project-prompt-generation.json`,
  `project/session-chat/PROMPT.txt`, canonical generator, source manifest and CI all
  declare the same route; installed Project equality remains UNKNOWN until actually checked.
* Negative: dual carriers, no bridge, malformed bytes, owner failures, source drift and
  forbidden positive claims are asserted in `tests/project-c72-portable-bridge.test.mjs`.
* Governance: human reviews PR and merges manually only after CI. Branch protection/ruleset
  enforcement and native Host callback installation must be separately observed; GitHub
  workflow YAML cannot guarantee that a human cannot merge a failed check.

Do not regenerate or install a new prompt before **human merge** and a later explicit
Host engineering request. Prompt generation then uses exact verified main HEAD and immutable blobs.

---

## PR #171 – minimal critical path with mandatory reuse (25 October 2026)

The Host guarantees an *observable effect contract*, not the availability of any specific tool. Only after a real distinct exact `I ACCEPT` may it select and physically invoke ONE of three transports, then call the **unchanged** `executeC72PostAcceptRecovery` / original `reenterC72V2PostAccept`. No new C72 issuer, mode owner, C87 writer or model is created.

**Recycled primitives rather than cloned engines:**
- **C65 / PR #74:** pin main and each contents request to a single SHA; check the original Git blob identities independently.
- **C78 / PR #87:** retain the existing Node stdin JSON envelope and single-process physical result readback. The legacy packet ABI and CLI remain supported.
- **C98:** import its strict `isC98JSONDataTree` to reject executable descriptors and forged object shapes before consuming Node-local GitHub responses.
- **C103:** reuse the separation between an *effect/receipt test* and a native provider-event claim; success is not provider registration.
- **C104:** reuse its resumable materialization principle **only after EDU**. It is deliberately **not** imported into the atomic five-document C72 admission gate; C104's mode and cache owner would be wrong at this stage.
- **C95/C98 host file-bridge:** these prove only real host-supplied capabilities; mere callback names, registered-looking schemas and local fixtures do not install network routing.

**The new, smallest missing executable primitive** is `host/project-c72-physical-ingress.mjs`:
- `chooseC72HostCarrier`: pure, deterministic capability selection, with no network calls or consent issuance; picks `HOST_CALLBACKS`, `HOST_SOURCE_PACKET`, or `NODE_GITHUB_API` ONLY when there is an actual function/packet or an explicit Node HTTPS allowance. Multiple incompatible carriers are rejected, not arbitrarily combined. No carrier = typed `C72_SOURCE_BRIDGE_UNBOUND`.
- `createC72NodeGithubCallbacks`: allows the same original executor to run entirely in Node. Node's `https` library fetches precisely one public GitHub main ref and the five `contents/*?ref=<frozen SHA>` APIs. Requests are path-allowlisted, timeout/byte bounded, refuse redirects/non-200 responses, and validate source metadata, size, strict UTF-8, canonical Base64 and each Git SHA-1.
- `runC72SelectedHostIngress`: exact fresh-consent and owner-outcome gates come BEFORE any carrier I/O. Calls the existing `executeC72PostAcceptRecovery` **once**, which compares live HEAD against the original first-turn SHA witness and recomputes/validates original owner receipts. The selection labels remain Host observations, not native messages.
- `scripts/project-c72-portable-cli.mjs`: reused physical Node stdin gateway. Old source-packet JSON remains valid; an explicit `transport: "NODE_GITHUB_API"` without a packet invokes Node HTTPS instead. No implicit auto-retry or token/URL injection.

### Decision table (Host capability, not a platform guarantee)

| Actually observed capability | Machine choice | What the Host must prove |
|---|---|---|
| GitHub callback FUNCTIONS callable within the same Node process | `HOST_CALLBACKS` | 1 pinned live HEAD, 5 pinned byte bodies, 5 Git SHA-1 matches, original C72 accepted+intro |
| Exact five-source packet physically received by the Node process | `HOST_SOURCE_PACKET` | full packet validation, same five hashes and original C72 output; no invented API origin |
| Node code installed and outbound GitHub HTTPS explicitly permitted | `NODE_GITHUB_API` | Node performs the six REAL GitHub API calls itself, as above; DNS/network failure is a typed STOP |
| Connector and Node separately available but no callable cross-tool carrier and no permitted Node HTTPS | none | `C72_SOURCE_BRIDGE_UNBOUND`, not “transfer failed” or “C72 absent” |

A host may select the route manually or call `chooseC72HostCarrier` (`carrier:'AUTO'`). The selector is not a new runtime installer: it cannot make GitHub reachable from an isolated Node container. Host decides **how** to provision an authorized carrier; contract decides **what physical evidence** is required. The software is portable because all paths converge on one original owner, not because the Project prompt can provision platform tools.

### Counterexample tests / non-regression

Tests cover the three carrier positives, the legacy packet CLI, an invalid/duplicate carrier, network failure, stale main, wrong Git SHA-1, corrupt Base64, wrong file metadata, missing prior witness, non-exact consent, ambiguous Host IO and unknown owner outcomes. The 10k and 20k Cartesian negative suites are synthetic software states, *not* real ChatGPT sessions. The Node20/22 workflows qualify source + CI only. Run an **actual native Host field test** separately to show connector ingress -> Node file/HTTPS read -> original C72 receipt -> complete original introduction -> native transcript delivery. If that native field test is unavailable, `PRODUCT_NO_GO` and `NO_VOICE` remain mandatory.

**Anti-regression:**
1. A new mode, writer or C72 implementation is forbidden. Do not alter original C72 accepted/intro validators.
2. Any missing/unknown node, callback, source, origin, or owner result is a fail-closed typed edge. A read failure is NOT a successful retry authorization.
3. Preconsent remains exactly one main HEAD + five direct original documents; this Node module must not run until the separate `I ACCEPT` has actually been observed.
4. Current GitHub Project prompt text must stay within 8000 bytes/chars, including its 210-byte pinned prefix.
5. The current chat SOURCE_LOCK never repins because engineering commits changed the PR branch. Only a later human merge + separate release step can generate a new installed prompt candidate.
6. Repo CI success cannot attest native ChatGPT tool registration, human event authentication, UI rendering, worker persistence or transport permission.

### Optional reusable physical five-file staging (no new C72 owner)

`scripts/project-c72-staged-ingress-cli.mjs` consumes a **private, already physically populated** staging directory and a bounded JSON metadata packet via Node stdin. The Host chooses any authorized means to place exact GitHub file bytes there (including ASCII Base64 copied through a live tool execution channel, or another mounted transfer). Staging happens ONLY after the separate human acceptance. The script reads each fixed-name file twice through the same descriptor, rejects symlinks/hardlinks, nonprivate directories, changed files, oversized content, corrupt UTF-8 and any mismatch with the **five original first-turn SHA-1** values. It assembles the existing `HOST_SOURCE_PACKET` in memory and delegates to the unchanged `runC72SelectedHostIngress` and original C72; it never issues a receipt itself.

The request is `{"schema":"ikant-host-c72-staged-request/v1","humanMessage":"I ACCEPT","freshHumanTurn":true,"priorTurnEvidence":{...},"liveHead":"<verified original SHA>","stageDirectory":"/absolute/private/staging"}`. The Host, not the end-user, creates the directory and stages the five actual files. Head/provenance values are Host-observed, not attested by a native ChatGPT/GitHub event. Only the original C72 validators may confirm accepted+introduction. File staging does not weaken the prohibition on PRE-consent reads or runs.

**Actual host partial physical witness (separate from PR CI, 25 October 2026):** In this engineering chat the connected GitHub API returned pinned `assets/brand/ikant-light.svg` on `27c2fca83638ae86aa65dbc15b067e63ae46ca0e`, original Git blob SHA-1 `bdc1d783b001b6c0e7a7cd80895db41ba7d2d0d3`. The Host forwarded its full ASCII Base64 bytes as a shell-tool argument to the isolated Node container, decoded, physically wrote and reopened **1,763 bytes**. `git hash-object` independently returned **the same** SHA-1 and `sha256sum` returned `b6dc3f6e22149ef9f96348ce8e677af034cd2377f26450af18d51bc5c43ae633`. This **proves one physical connector-to-container byte relay**, falsifying categorical 'impossible tool-to-tool transfer' claims. It does **not** prove five-file source packet completion, runtime source installation, a C72 original owner invocation, native provider identity, or native ChatGPT delivery. The staged-file CI test demonstrates the complete five-file protocol only **with real checkout bytes staged inside a CI worker**, not with this host's separate GitHub connector.

The minimum release gating remains (i) source/CI suite green (ii) a real Host five-file or Node HTTPS flow using first-turn witnesses and original C72 receipts (iii) later EDU original selection and original C135/C87/C125/S03 field proof (iv) native transcript display and persistence separately observed. Claim `PRODUCT_GO` only after these independent gates.

---

## PR #171 EDU-first closure and CANONICAL legacy boundary (2026-10-25)

**User-facing product target:** an entirely new Project conversation has one immutable main HEAD and five first-turn GitHub SHA witnesses; a *different* exact `I ACCEPT` produces original C72/v2 accepted and complete introduction; a *further different* exact `EDU` produces original mode selection; the Host makes the source available via its own observed authorized adapter (callback, packet, Node HTTPS, or post-EDU manually uploaded pinned repo ZIP only when the automatic bridge is demonstrably unavailable); Node independently verifies HEAD/TREE/blob/readback; the unchanged `startOneShellEdu` starts the original C135 worker, C87 and C125/S03; `emitVerifiedHostOneShell` renders exactly six slots with the exact official SVG before the title in **Host-owned HTML**. Native ChatGPT UI/brand avatar, tool hooks, per-turn delivery and worker lifetime require separate actual native evidence.

**Minimality / recycling:** no new gateway, C72 issuer, model, cognition kernel, C87 writer, C135 owner or SVG asset was created. Existing modules remain the authority:
1. `host/project-c72-host-recovery.mjs` + `host/project-c72-postaccept-reentry.mjs` + `host/c72-public-mode-admission.mjs` for original C72.
2. `host/project-c72-physical-ingress.mjs` + `scripts/project-c72-staged-ingress-cli.mjs` for **host-selected physical transport, not an installed native connector**.
3. `host/p1-postmode-source-handoff.mjs` + `scripts/project-manual-source.py` + `scripts/project-repo-loader.mjs` for **EDU-only** manual fallback; one pinned **source repo ZIP**, not five arbitrary loose files, not a Project bundle. Independent API tree is compulsory.
4. `host/project-oneshell-edu.mjs` / C135 / C87 / C125 / S03 for original EDU local execution and byte-preserved HOST_BOUND voice.
5. `host/project-oneshell-emission.mjs` / `host/project-oneshell-visual.mjs` / the verified `assets/brand/ikant-light.svg` for one branded Host HTML frame. Native avatar/renderer is NOT attested; TEXT fallback never asserts a canonical SVG.

**CANONICAL is marked LEGACY / unqualified / planned for retirement in this Project**, not reinterpreted as EDU or as successful ACTIVE. The original C72/v2 code and historic C59 remain byte-identical and may still recognize its legacy mode receipt, but the Project-facing `oneShellSelected` stops on `CANONICAL_LEGACY_PRODUCT_NO_GO` instead of dispatching C59. Historical assertion “CANONICAL has never worked” is user-reported, **not independently proven** by this PR; only the lack of a current product-grade success witness can be asserted.

**New true one-chain SOFTWARE QUALIFICATION**: `tests/project-edu-complete-chain.test.mjs` executes original linked Terms acceptance, original later EDU selection, `git archive` of the actual candidate HEAD, independent `git ls-tree` metadata, original Python ZIP extraction, original Node loader and re-opened original bytes, one real C135/C87/C125/S03 turn with a Host fixture language callback, nonce replay denial, and source-verified official SVG Host HTML emission in a **single test**. It verifies that the brand glyph precedes the OneShell title and six machine slots remain byte-exact. Fails closed if an original owner, original byte comparison, loader or brand step fails. This is NOT 100k genuine human sessions. The existing `tests/project-bootstrap-endtoend-100k.test.mjs` remains a separate synthetic decision-grid qualification.

**Release gates, global/intermediate/local:**
- LOCAL: original EDU flow and CANONICAL legacy stop pass; a single end-to-end PR-head integration passes; no new owner; deterministic SHA/blob failures rejected.
- INTERMEDIATE: Node20/22 CI all green on the **latest** PR head, full repo ZIP/readback tests, prompt under 8000 bytes including 210 pinned overhead, current manifest and source blob tests. A queued workflow is not PASS.
- GLOBAL / FIELD: PR actually merged into main, fresh new chat installed Project prompt byte equality attested (or explicitly UNKNOWN), native first-message intake, original C72 linked accepted/intro with witnessed user message, later EDU selection, chosen real adapter callback/physical packet or successful permitted Node HTTPS, full code source, C135 running worker with languagePort and persistence, ledger reopened, actual visible user interface delivery and verified logo in the client when the client supports Host HTML. If the native host cannot display a verified SVG, TEXT fallback is mandatory, not a false brand guarantee. `PRODUCT_GO` requires actual field evidence, which PR tests cannot supply.

**No unconditional promise:** a generic Host cannot create absent connector permissions, native hooks, reliable network or a supported rich UI by reading Project instructions. The deterministic guarantee is **either fully proved success for the capabilities actually available or an honest typed first failure with NO_VOICE**.

---

## PR171 Host continuation without a new authority — 2026-10-25

**User intent, made executable:** An arbitrary freshly invoked Host should understand what the next externally provable result must be after each human message. It may select a transport implementation on available capabilities, but it must never confuse a prompt, a plan, a model memory, a CI fixture or an earlier message with an original C72/C135/C87 receipt. The user is not required to repair Node adapters. Human actions are limited to the exact consent, EDU choice, *if proven necessary* one pinned source ZIP, and subsequent actual EDU turns. Host engineering after a human merge is independent of C72.

**Recycled owners:** C72 (linked offer, new exact acceptance and EDU selection), C65 pinned Git SHA, C78 stdin physical carrier, C98 descriptor bounds, C103 observed-effects boundary, C104 reopen technique, P1 ZIP, original Python extractor and Node loader, C135 / C107 / C87 / C125 / S03, original OneShell emitter/verified logo and the read-only `project-oneshell-autopilot.mjs`. No new receipt schema is allowed to override these owners.

**Non-authoritative memory:** `contracts/project-host-followthrough.json` is a 12-stage **read-only reminder** linked from `BOOTSTRAP.project_session` and `contracts/project-prompt-generation.json`. Its only jobs are listing previous proof dependencies, allowed next operation, original file owner and the first STOP condition. It is NOT writable persistence, not a newly created verifier, not a new message receiver, and is never enough to authorize C72, C59, C135, C87 or native delivery. The Host must re-open original receipt, HEAD/TREE and real same-instance ledger on each live step. No native worker exists merely because text says “continue.”

**Proof-critical transitions (AND, not OR):**

`FIRST_CONTACT ∧ FIVE_FIRST_TURN_SHA -> LINKED_TERMS -> DISTINCT_I_ACCEPT -> ORIGINAL_C72_ACCEPTED ∧ INTRO -> DISTINCT_EDU -> ORIGINAL_EDU_SELECTION -> POSTMODE_HEAD/TREE/PROMPT_CRITICAL_PREFLIGHT -> (REAL_HOST_TO_NODE_CARRIER ∨ EDU_POSTMODE_PROVEN_UNAVAILABLE_BRIDGE_AND_PINNED_ZIP) -> ORIGINAL_LOADER_BLOB_AND_READBACK -> ORIGINAL_C135_WORKER_WITH_CALLABLE_LANGUAGE_PORT -> SAME_TURN_C87_C125_S03 -> VERIFIED_SIX_SLOT_ONESHELL -> VERIFIED_HOST_SVG_WHEN_HTML_IS_SUPPORTED`.

`CANONICAL` is a quarantined **legacy unqualified** Project branch, not an EDU shortcut or a source of ACTIVE. Previous C72/C59 owner bytes remain original. “Never historically worked” is not independently proved; PRODUCT_GO is not demonstrated.

**Restart/recovery:** Host continuity is never reconstructed from model narrative. If the real C135 instance is not live, or C87 write/send is UNKNOWN, the next action is a read-only reconciliation or STOP, **not** instantiate a new instance and replay the user's input. Model Memory and Project prompt can remind an Host which *verifications* to attempt, but cannot persist a live worker, signed user event, or native UI. A different source HEAD requires fresh C72; no token/ledger transfer.

**Release handoff:** CI on PR HEAD verifies source-level closure and the tests (including `tests/project-host-followthrough.test.mjs`), not ChatGPT-native field functionality. An explicit human merge moves the code to new main; only a **subsequent explicit Host engineering message `PR merged`** permits this Host to read the new main, regenerate prompt locally using original `scripts/build-project-oneshell-prompt.mjs`, verify source/byte hashes and return it to the user. It does not install the prompt in Project or repin the running iKant epoch. Never ask the user to send `PR merged` until latest PR-head CI is green and all source-level DoD have independently passed.

**Anti-regression DoD lattice:**

| Local | Intermediate | Global |
|---|---|---|
| Exact repository step file names resolve; no new authority; original C72/EDU/EXIT tests unchanged; compact prompt +210 under 8k; negative 10k fake-continuity mutants rejected | Manifest rooted from actual imported source closure; Node20/22 tests and full HEAD ZIP/canonical SVG/nonce/readback tests on **latest** PR commit pass; prompt builder pins new checkpoint blob | Only actual Host native capability and user event proof can attest C72 → EDU → same C135 worker → visible OneShell/logo; otherwise `FIELD_E2E_NOT_ATTESTED` and `PRODUCT_NO_GO` |

**Status discipline:** A code commit is not a successful execution. Missing CI logs or queued/failed workflows are not ALL_GREEN. External chat UI, transport installation, native persistence and provider dispatch are **always separately attested**, never elevated by a repository test.
