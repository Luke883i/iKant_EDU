# C59 — Single deterministic composition channel

## Irreducible objective

For `SESSION_CHAT_LOCAL`, exactly one caller-visible composition may lead from pinned source to ACTIVE:

`SOURCE_HEAD -> orientation -> exact I ACCEPT -> GitHub API base64 -> VERIFIED_OPAQUE_RELAY -> session-local write/reopen -> LOCAL_EXECUTOR_V1 -> executed provenance/live probe/writer readback -> ACTIVE readback`.

The container does not need to resolve or reach GitHub. GitHub access belongs to the host source plane; local filesystem/Node belong to the execution plane.

## Closed legacy census

`contracts/session-chat-composition-census.json` is closed-world for composition. Every live carrier and byte path exported by the existing code must be present there.

- **Absorbed canonical cold ingress:** `GITHUB_API_BASE64`, `VERIFIED_OPAQUE_RELAY`.
- **Absorbed internal owners:** `for_ai_agent_first_entrypoint`, `PRE_RUNTIME_HOST_ADAPTER`, `LOCAL_EXECUTOR_V1`.
- **Excluded from canonical activation:** `LOCAL_DIRECT`, `WARM_CACHE_EXACT`, `GITHUB_GIT_BLOB_API`, `PINNED_GITHUB_ZIP`, `PINNED_PERMALINK`, `HOST_FILE_BRIDGE`, `FASTBOOT_CHANNEL_LEDGER`, old `LOCAL_HOST_META_PROMPT`, C20 deployment and optional plugin/MCP surfaces.
- **Not activation success:** `RUNTIME_BOUND_LIMITED`.

A live carrier/byte-path absent from the census is a CI failure. An excluded channel cannot authorize activation.

## Physical primitive witness

C59 records a host-scoped physical witness at `artifacts/qualification/c59-host-connector-container-witness.json`.

On source head `b1a2f75516fcf76ee46b4054ba46aff5c89d11bc`, the GitHub connector returned `TERMS.md` as base64 with Git blob SHA `698f58cc15af9702fe00bdee9ac6d527f3821f85`. Those exact bytes were decoded/written in the session container without using container GitHub networking. Local readback produced the same Git blob SHA and raw SHA-256 `16128c9d39c2aa3453c6d5d2f0d19750af65898057dab0d04b17dd6782fba8c0`.

This proves the primitive **for the observed host session**:

`GitHub connector -> exact bytes -> container -> same Git blob SHA`.

It does not claim that every possible host exposes the same bridge. It proves that container GitHub connectivity is not logically required when the host exposes this source-to-sink bridge.

## DoD

### Global
1. Exactly one canonical composition may authorize ACTIVE.
2. Container GitHub DNS/egress is not a bootstrap dependency.
3. No model-selected carrier, fallback or retry.
4. ACTIVE requires local physical execution and persisted/readback evidence.

### Intermediate
1. One canonical kernel/prompt/contract.
2. Every live legacy channel is mechanically censused as absorbed or excluded.
3. Multi-carrier planner, legacy prompt and C20/App/plugin paths have zero canonical activation authority.
4. The transferred object set remains source-head/content-address bound.

### Local
1. Every relayed object remains path/blob/byte bound to the pinned source.
2. Every write is reopened before reliance.
3. Identity mismatch blocks; it never selects another carrier.
4. Chat is not ledger/retry state.
5. Pending intent resumes only after ACTIVE readback.

## Qualification

The ten-mechanism lattice has `2^10 = 1024` candidates and exactly one minimum: all ten mechanisms.

The 100,000-case adversarial campaign covers parallel-kernel authority, source drift, source API loss, container DNS loss, model byte rewriting, partial object sets, readback mismatch, chat retry state, legacy laundering, missing execution proof, missing ACTIVE readback and cross-epoch evidence. Required result: zero oracle mismatches, zero unsafe ACTIVE, all deletion mutants killed.

`CONTAINER_DNS_DOWN` is intentionally compatible with the good path. That is the semantic assertion corresponding to the physical connector-to-container witness.


## PR1-68 historical closure

C59 does not treat current enums as sufficient evidence of closure. `contracts/bootstrap-channel-lineage.json` audits every PR #1 through #68, including closed/unmerged #24, #27, #34, #36, #42 and #43. The generated human audit is `docs/C59_PR1_68_LINEAGE_AUDIT.md`.

The lineage contains 52 distinct bootstrap/host-ingress atoms. Every atom has a terminal class: canonical, absorbed internal/evidence/adapter, excluded noncanonical, deprecated projection/retry/selector, legacy alias, or orthogonal post-activation/external host capability. No registered atom is unreferenced and no PR channel atom is unregistered.

## Cartesian quotient closure

`contracts/bootstrap-composition-space.json` derives ten finite axes from the historical trajectory: ingress adapter, source plane, carrier, byte path, sink, executor, planner, retry state, product profile and activation proof.

The exhaustive product contains **1,166,400 raw vectors**. Six raw vectors are declared aliases only: three caller/kernel adapters times the historical `COLD_API -> GITHUB_API_BASE64` alias. The reference app `APP_BOUND_IKANT_LE_OPEN` is excluded because it enters the deployed compatibility profile rather than canonical `SESSION_CHAT_LOCAL`. After normalization they collapse to **one canonical equivalence class**. The remaining **1,166,394 vectors are rejected**.

All 30 single-value exclusion-widening mutants create unsafe alternatives and are therefore killed. This means each excluded historical value is causally necessary to keep outside the canonical quotient.

The single normalized vector is:

`HOST_KERNEL_EQUIV × GITHUB_API × GITHUB_API_BASE64 × VERIFIED_OPAQUE_RELAY × SESSION_LOCAL_FILESYSTEM × SESSION_LOCAL_NODE × NO_CALLER_PLANNER × OWNER_TYPED_ONLY × SESSION_CHAT_LOCAL × ACTIVE_READBACK_CHAIN`.

This is a finite, repository-derived closure claim. It does not claim to enumerate physically impossible mechanisms never represented by the repository/history; CI additionally fails when current exported carriers or byte paths are not represented in the registry.
