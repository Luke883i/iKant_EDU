# C99 post-selection closure — 30-PR forensics (authority=0)

Engineering basis: merged main `a05846cb58af8a6509299008674beb582020e318` (PR #110). **Do not repin the iKant SOURCE_HEAD of an existing admitted chat.** Audit input: GitHub PRs #81–#110 inclusive, their changed paths and original C72/C99/C101/C102/C103 code; user-provided failed ChatGPT session transcript.

## Runtime-vs-prose verdict

PR #110 **does contain executable code** (`host/c103-host-adapter-conformance.mjs`). It checks the shape and hash coherence of a supplied C102 receipt and C87 inspection, and its CI launches original C102/C101/C87 in Node. However, C103 **cannot authenticate the calling ChatGPT host**, and a structurally coherent caller-supplied envelope does not attest the invocation. The Project Markdown does not register a mandatory host hook.

## PR trajectory (exact 30 PRs)

| PRs | What was added | Recurrent, unchanged external edge |
| --- | --- | --- |
| #81–#86 | C71, C72, C73, C74, C76 and standalone C77: original cognition/admission/capsule | Caller must execute original C72; source capsule still requires real transport |
| #87–#93 | C78–C84 opaque carriers, current-head Git Merkle reachability, runtime coordination | ChatGPT connector bytes are not Node bytes; native host ingress uninstalled |
| #94–#100 | C85–C96 readback, C87 ledger, relevance, provider adapters, more carriers | Host-provided callbacks/ports must actually exist and be invoked |
| #101–#106 | C97 UI, C98 host adapters, C99 route gates and Project bundles | UI and Project instructions cannot install mandatory Node dispatch |
| #107–#108 | C100 opt-in cohost binder and hostile-object hardening | Does not call an LLM or C70 by itself |
| #109 | C101 original C70/C71 + C100 and C102 real C87 write/readback | Real in CI; no automatic hook in current ChatGPT Project |
| #110 | C103 pure envelope validator with CI source integration | Envelope consistency is not runtime-origin or native-delivery evidence |

All of #81–#110 are merged **except #102**, which was closed unmerged. Counts derived from live PR API on 2026-10-11.

## User-provided failed-session reconstruction

- First contact correctly froze `a05846cb58af8a6509299008674beb582020e318` and showed original Terms. Admission did not require executing the cognitive runtime.
- After exact `I ACCEPT` and `EXPERIMENTAL`, the session explicitly reported that it **did not execute the original C72 mode selection**. Therefore a source-valid C72 runtime receipt was not demonstrated.
- The host repeatedly pursued strict C84 acquisition. GitHub reading works separately from Node, direct Node GitHub network was unavailable, and only one Git blob was transferred. That is not proof of a complete current-head capsule or C84 execution.
- The user never issued the separate exact opt-in command for C100/C101 in the pasted transcript. Silent cohost fallback would violate the existing C100 contract.
- The Project prompt names C101/C102/E3 while some older Project MDs still route primarily C84/C100 and use E3 for **C84** instead. These are real route/grade documentation collisions, not machine dispatch guarantees.

## Minimal executable closure (non-authoritative)

`host/c99-postselection-planner.mjs` adds to the **existing C99 routing family**, not a new state owner. It validates a *real* original C72 EXPERIMENTAL selection, the frozen source SHA and exact input, refuses getters/proxies and invalid host data, prioritizes C84, then C102 only with separate unrevoked opt-in, then C100, then clearly labelled E0. It never retries the same failed route without new evidence. All carrier hints are merely caller declarations and never proof.

This planner **does not invoke a runtime or certify an adapter**. Only real observed C84 or C101/C102/C87 execution and readback permit upgrading subsequent evidence. Avoid unqualified E3: use `C84_OWNER_EXECUTED` versus `C101_C102_C87_LOCAL_EXECUTED` and independent flags for source, ingress, delivery and persistence.

## DoD and deliberately open gaps

- [x] Source route tests reject forged C72 selection, stale failure, hostile JS envelopes, implicit opt-in and CONTROL inputs.
- [x] Deterministic 100k negative route mutants + 1k positive plans are synthetically testable (not native ChatGPT sessions).
- [x] No modification to C59, C84, C87, C101, C102, C103 owners, Project settings or existing C99 functions.
- [ ] Real installed ChatGPT Project per-turn adapter and connector→Node source graph transfer: **OPEN**. No Markdown or pure planner can manufacture them.
- [ ] Independent field trials, actual native message proof, user-valued semantic response and cross-turn cognition: **OPEN**.

Concrete next external gate: `ACTUALLY_INSTALLED_CHATGPT_HOST_DISPATCH_TO_EXACT_CURRENT_HEAD_C102_WITH_ORIGINAL_C72_AND_C87_READBACK`.
