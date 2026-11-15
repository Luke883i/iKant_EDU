# C45 — Context Root + ASCII Co-host Closure

C45 closes the repository-owned part of the gap between a canonical `SESSION_CHAT_LOCAL` runtime and a persistent co-host placement in a ChatGPT-like session. It does **not** create a hosted activation mode, a second lifecycle, a second state writer, or a second truth owner.

The provider session handle is reduced to an opaque SHA-256 locator. That locator selects one durable context root. C45 explicitly prepares the per-session root before handing its `runtime` child to the unchanged canonical materializer, closing the materializer parent-directory precondition without making the co-host adapter a state writer. The context manifest immutably binds the locator to `source_head`, `runtime_root_sha256`, and the materialization receipt. Before every routed turn the adapter reopens the context root, validates the materialization and hash-linked runtime ledger, and then calls only `src/runtime.mjs#runCommand` from that bound root. Legacy C20 deployment remains compatibility-only.

The canonical runtime already validates and renders the C44 ASCII Session Shell. C45 therefore seals only exact owner-rendered bytes. It cannot certify that those bytes were shown in native chat: native delivery requires an external `HOST_NATIVE_CHAT` receipt bound to session locator, shell receipt, ASCII digest/length, and envelope receipt. Repository tests, CI and semantic mutation cannot mint that fact.

## Irreducible reticulum

The unique minimum contains eight mechanisms: opaque session locator, durable context root, immutable context binding, canonical runtime route, reopen before each turn, exact ASCII shell seal, external native-delivery receipt, and optional co-host placement. Dedicated artifact delivery and host tombstones were rejected as dominated because canonical Surface B and persisted `EXITED` readback already own those semantics.

## Qualification

Selection samples 10,000 candidate reticula with seed `0xC45C0A57`; the unique minimum has cost 8. Generative falsification executes 10,000,000 cases across 40 balanced families and seven abstraction layers. Acceptance requires zero candidate/oracle mismatches, zero unsafe acceptances, all 8 deletion mutants killed, and all 4 forbidden-insertion mutants killed.

The user-intent DoD is a 10,000-bps conjunction with a 9,901-bps threshold and minimum retained atom weight 400 bps. Therefore any missing retained intent atom prevents a >99% completion claim. Physical co-host endpoint reachability, real provider-session metadata, and native-chat delivery remain explicit external completion facts.
