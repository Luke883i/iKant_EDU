# C59 — PR1–68 bootstrap/channel lineage audit

This document is generated from `contracts/bootstrap-channel-lineage.json`. It is descriptive evidence; canonical activation authority remains in the C59 composition contract.

## Coverage

- PRs covered: **68** (#1–#68)
- merged: **61**
- closed/unmerged attempts retained: **6** (#24, #27, #34, #36, #42, #43)
- current open PR: **#68**
- registered historical channel atoms: **52**

## Unitary audit

| PR | State | Semantic value | Channel atoms |
| ---: | --- | --- | --- |
| #1 | MERGED | Introduced manual TERMS/accept/probe/initialize lifecycle. | `MANUAL_PROBE_INITIALIZE` |
| #2 | MERGED | Cognitive runtime only; no new bootstrap pipe. | — |
| #3 | MERGED | Collapsed manual post-consent probe/init into automatic runtime bootstrap. | `AUTO_PROBE_INITIALIZE` |
| #4 | MERGED | Added bounded orientation/freeze and pending-intent resume. | `ORIENTATION_CAPSULE` |
| #5 | MERGED | No new bootstrap pipe. | — |
| #6 | MERGED | No new bootstrap pipe. | — |
| #7 | MERGED | Forced arbitrary canonical-repo first contact into bounded pre-accept bootstrap. | `FIRST_CONTACT_REPO_CONVERGENCE` |
| #8 | MERGED | Made GitHub API the sole preaccept repository transport and removed raw-web/clone/gh fallbacks. | `GITHUB_API_ONLY`, `AUTHORIZED_RAW_WEB`, `GIT_CLONE`, `GH_CLI`, `CONTAINER_GITHUB_NETWORK` |
| #9 | MERGED | No new bootstrap pipe. | — |
| #10 | MERGED | No new bootstrap pipe. | — |
| #11 | MERGED | Introduced strict post-accept ACTIVATE_FIRST and bounded runtime acquisition. | `ACTIVATE_FIRST` |
| #12 | MERGED | No new bootstrap pipe. | — |
| #13 | MERGED | Documentation only; no new bootstrap pipe. | — |
| #14 | MERGED | Qualified content-addressed runtime root and warm-cache concept without changing runtime acquisition. | `CONTENT_ADDRESSED_RUNTIME_ROOT`, `WARM_CACHE_EXACT` |
| #15 | MERGED | Library extraction only; no bootstrap channel. | — |
| #16 | MERGED | Materialized content-addressed SESSION_CHAT fastboot and cold API transfer semantics. | `CONTENT_ADDRESSED_RUNTIME_ROOT`, `COLD_API` |
| #17 | MERGED | Bound activation evidence to exact source/runtime identity. | `HOST_ATTESTED` |
| #18 | MERGED | Introduced explicit multi-carrier transfer surface. | `GITHUB_API_BASE64`, `GITHUB_GIT_BLOB_API`, `PINNED_PERMALINK`, `PINNED_GITHUB_ZIP`, `HOST_FILE_BRIDGE`, `WARM_CACHE_EXACT` |
| #19 | MERGED | Made connector/local-filesystem discontinuity explicit; no new transport. | — |
| #20 | MERGED | Single-shot acceptance and deadline integrity; no new carrier. | — |
| #21 | MERGED | Added continuation semantics after recoverable byte-bridge failure. | — |
| #22 | MERGED | Introduced multi-carrier capability ledger/selection and retry memory. | `FASTBOOT_CHANNEL_LEDGER` |
| #23 | MERGED | Introduced deployed/plugin SESSION_CHAT profile and warm deployed store. | `SESSION_CHAT_DEPLOYED`, `PLUGIN_MCP`, `WARM_CACHE_EXACT` |
| #24 | CLOSED_UNMERGED | Unmerged alternative deployed activation design. | `SESSION_CHAT_DEPLOYED`, `PLUGIN_MCP` |
| #25 | MERGED | Promoted SESSION_CHAT_LOCAL as product modality and rejected hosted/plugin requirements for local activation. | `SESSION_CHAT_LOCAL` |
| #26 | MERGED | Hardened local fastboot evidence; no new channel. | — |
| #27 | CLOSED_UNMERGED | Unmerged hardening variant; no distinct surviving channel. | — |
| #28 | MERGED | Quarantined legacy C20 deployed ontology and clarified HOST_ATTESTED semantics. | `SESSION_CHAT_DEPLOYED`, `HOST_ATTESTED` |
| #29 | MERGED | Closed human-to-iKant boundary over existing local path; no new carrier. | — |
| #30 | MERGED | Moved canonical activation bytes to LOCAL_EXECUTOR_V1 and LOCAL_DIRECT, forbidding model byte transport. | `LOCAL_EXECUTOR_V1`, `LOCAL_DIRECT` |
| #31 | MERGED | Added generated zero-authority local-host caller projection. | `LOCAL_HOST_META_PROMPT` |
| #32 | MERGED | Added VERIFIED_OPAQUE_RELAY as second physically honest byte path. | `VERIFIED_OPAQUE_RELAY` |
| #33 | MERGED | Absorbed full-iKant invariants while retaining LOCAL_DIRECT and VERIFIED_OPAQUE_RELAY. | `LOCAL_DIRECT`, `VERIFIED_OPAQUE_RELAY` |
| #34 | CLOSED_UNMERGED | Unmerged C28 variant; no distinct surviving channel. | — |
| #35 | MERGED | Made product promise measurable; no new bootstrap channel. | — |
| #36 | CLOSED_UNMERGED | Unmerged activation-spectrum draft. | `RUNTIME_BOUND_LIMITED` |
| #37 | MERGED | Introduced bounded RUNTIME_BOUND_LIMITED service without weakening ACTIVE. | `RUNTIME_BOUND_LIMITED` |
| #38 | MERGED | Closed limited-runtime supply chain; no new canonical bootstrap pipe. | `RUNTIME_BOUND_LIMITED` |
| #39 | MERGED | Added one deterministic public shell over activation states. | `SESSION_SHELL` |
| #40 | MERGED | Introduced pre-runtime host adapter/session-local service ownership boundary. | `PRE_RUNTIME_HOST_ADAPTER` |
| #41 | MERGED | Authenticated the pre-runtime handoff independently. | `AUTHENTICATED_PRE_RUNTIME_HANDOFF` |
| #42 | CLOSED_UNMERGED | Unmerged orthogonal control-plane ownership attempt. | — |
| #43 | CLOSED_UNMERGED | Unmerged superseding control-plane attempt. | — |
| #44 | MERGED | Materialized orthogonal control-plane ownership; no bootstrap carrier. | — |
| #45 | MERGED | No new bootstrap channel. | — |
| #46 | MERGED | No new bootstrap channel. | — |
| #47 | MERGED | No new bootstrap channel. | — |
| #48 | MERGED | Introduced for_ai_agent_first_entrypoint as caller-facing technical ingress. | `FOR_AI_AGENT_FIRST_ENTRYPOINT` |
| #49 | MERGED | Added execute-observe-reenter owner loop around the entrypoint. | `EXECUTE_OBSERVE_REENTER` |
| #50 | MERGED | Added carrier-local retry epochs and bootstrap UX continuity. | `CARRIER_LOCAL_RETRY_EPOCH`, `FASTBOOT_CHANNEL_LEDGER` |
| #51 | MERGED | Added intent adapter and pre-runtime handoff closure. | `BOOTSTRAP_INTENT_ADAPTER`, `PRE_RUNTIME_HOST_ADAPTER` |
| #52 | MERGED | Moved human file handoff to final recovery tier. | `HUMAN_FILE_HANDOFF`, `HOST_FILE_BRIDGE` |
| #53 | MERGED | Added methodological local-host prompt discipline. | `METHODOLOGICAL_BOOTSTRAP_PROMPT`, `LOCAL_HOST_META_PROMPT` |
| #54 | MERGED | Added persistent cohost context after/around local runtime, not a transport. | `COHOST_CONTEXT_ROOT` |
| #55 | MERGED | Added fast cohost relation bind nucleus, orthogonal to canonical transport. | `COHOST_BIND_NUCLEUS` |
| #56 | MERGED | Added persisted cohost hydration upgrade. | `COHOST_RUNTIME_HYDRATION` |
| #57 | MERGED | Qualification/gate hardening only. | — |
| #58 | MERGED | Consolidated cohost relation/runtime/product tiers. | `COHOST_TIER_PROFILE` |
| #59 | MERGED | Added external native transcript actor qualification. | `NATIVE_TRANSCRIPT_ACTOR` |
| #60 | MERGED | Added host-bootstrap binding evidence and host session router overlay. | `HOST_BOOTSTRAP_BINDING`, `HOST_SESSION_ROUTER` |
| #61 | MERGED | Added physical bootstrap/execution/cohost/route/native proof surface. | `PHYSICAL_RUNTIME_PROOF` |
| #62 | MERGED | Cross-session/native hardening of physical proof; no new channel. | `PHYSICAL_RUNTIME_PROOF` |
| #63 | MERGED | Added host-consumption frame; presentation adapter only. | `HOST_CONSUMPTION_FRAME`, `PLUGIN_MCP` |
| #64 | MERGED | Added post-meta caller projection. | `LOCAL_HOST_POST_META_PROMPT` |
| #65 | MERGED | Converged whole-session local-host prompt projection. | `LOCAL_HOST_SESSION_META_PROMPT` |
| #66 | MERGED | Introduced APP_BOUND ikant_le_open and ADAPTER_BOUND ingress modes as host bindings. | `APP_BOUND_IKANT_LE_OPEN`, `ADAPTER_BOUND_ENTRYPOINT`, `FOR_AI_AGENT_FIRST_ENTRYPOINT`, `PLUGIN_MCP` |
| #67 | MERGED | Moved local-host lifecycle gating into executable kernel and host-route decline. | `SESSION_CHAT_LOCAL_HOST_KERNEL` |
| #68 | OPEN | Collapses all caller-visible local bootstrap composition onto one canonical owner and terminal census. | `SINGLE_COMPOSITION_CHANNEL`, `SESSION_CHAT_LOCAL_HOST_KERNEL`, `GITHUB_API_BASE64`, `VERIFIED_OPAQUE_RELAY`, `LOCAL_EXECUTOR_V1`, `SESSION_CHAT_LOCAL` |

## Terminal channel registry

| Atom | Terminal classification | Normalizes to |
| --- | --- | --- |
| `MANUAL_PROBE_INITIALIZE` | DEPRECATED_RECOVERY_ONLY | — |
| `AUTO_PROBE_INITIALIZE` | ABSORBED_INTERNAL | — |
| `ORIENTATION_CAPSULE` | ABSORBED_INTERNAL | — |
| `FIRST_CONTACT_REPO_CONVERGENCE` | ABSORBED_INTERNAL | — |
| `GITHUB_API_ONLY` | ABSORBED_CANONICAL_SOURCE | — |
| `AUTHORIZED_RAW_WEB` | DEPRECATED_REMOVED | — |
| `GIT_CLONE` | DEPRECATED_REMOVED | — |
| `GH_CLI` | DEPRECATED_REMOVED | — |
| `CONTAINER_GITHUB_NETWORK` | EXCLUDED_NONDEPENDENCY | — |
| `ACTIVATE_FIRST` | ABSORBED_INTERNAL | — |
| `CONTENT_ADDRESSED_RUNTIME_ROOT` | ABSORBED_INTERNAL | — |
| `COLD_API` | LEGACY_ALIAS | `GITHUB_API_BASE64` |
| `GITHUB_API_BASE64` | ABSORBED_CANONICAL_CARRIER | — |
| `GITHUB_GIT_BLOB_API` | EXCLUDED_NONCANONICAL | — |
| `PINNED_GITHUB_ZIP` | EXCLUDED_NONCANONICAL | — |
| `PINNED_PERMALINK` | EXCLUDED_NONCANONICAL | — |
| `HOST_FILE_BRIDGE` | EXCLUDED_LAST_RESORT | — |
| `HUMAN_FILE_HANDOFF` | LEGACY_ALIAS | `HOST_FILE_BRIDGE` |
| `WARM_CACHE_EXACT` | EXCLUDED_REMEDIATION_OPTIMIZATION | — |
| `FASTBOOT_CHANNEL_LEDGER` | DEPRECATED_SELECTOR_STATE | — |
| `SESSION_CHAT_DEPLOYED` | EXCLUDED_LEGACY_PROFILE | — |
| `PLUGIN_MCP` | EXTERNAL_HOST_BINDING_ONLY | — |
| `SESSION_CHAT_LOCAL` | ABSORBED_CANONICAL_PROFILE | — |
| `HOST_ATTESTED` | ABSORBED_EVIDENCE | — |
| `LOCAL_EXECUTOR_V1` | ABSORBED_INTERNAL_EXECUTOR | — |
| `LOCAL_DIRECT` | EXCLUDED_NONCANONICAL | — |
| `LOCAL_HOST_META_PROMPT` | DEPRECATED_PROJECTION | — |
| `VERIFIED_OPAQUE_RELAY` | ABSORBED_CANONICAL_BYTE_PATH | — |
| `RUNTIME_BOUND_LIMITED` | EXCLUDED_AS_ACTIVATION_SUCCESS | — |
| `SESSION_SHELL` | POST_ACTIVATION_PRESENTATION | — |
| `PRE_RUNTIME_HOST_ADAPTER` | ABSORBED_INTERNAL | — |
| `AUTHENTICATED_PRE_RUNTIME_HANDOFF` | ABSORBED_INTERNAL | — |
| `FOR_AI_AGENT_FIRST_ENTRYPOINT` | INGRESS_ADAPTER_ALIAS | `SESSION_CHAT_LOCAL_HOST_KERNEL` |
| `EXECUTE_OBSERVE_REENTER` | DEPRECATED_OWNER_LOOP | — |
| `CARRIER_LOCAL_RETRY_EPOCH` | DEPRECATED_RETRY_MECHANISM | — |
| `BOOTSTRAP_INTENT_ADAPTER` | ABSORBED_INTERNAL | — |
| `METHODOLOGICAL_BOOTSTRAP_PROMPT` | DEPRECATED_PROJECTION | — |
| `COHOST_CONTEXT_ROOT` | ORTHOGONAL_POST_ACTIVATION | — |
| `COHOST_BIND_NUCLEUS` | ORTHOGONAL_POST_ACTIVATION | — |
| `COHOST_RUNTIME_HYDRATION` | ORTHOGONAL_POST_ACTIVATION | — |
| `COHOST_TIER_PROFILE` | ORTHOGONAL_POST_ACTIVATION | — |
| `NATIVE_TRANSCRIPT_ACTOR` | ORTHOGONAL_EXTERNAL_HOST_CAPABILITY | — |
| `HOST_BOOTSTRAP_BINDING` | ABSORBED_EVIDENCE | — |
| `HOST_SESSION_ROUTER` | ORTHOGONAL_RUNTIME_ROUTE | — |
| `PHYSICAL_RUNTIME_PROOF` | ABSORBED_PROOF | — |
| `HOST_CONSUMPTION_FRAME` | POST_ACTIVATION_PRESENTATION | — |
| `LOCAL_HOST_POST_META_PROMPT` | DEPRECATED_PROJECTION | — |
| `LOCAL_HOST_SESSION_META_PROMPT` | DEPRECATED_PROJECTION | — |
| `APP_BOUND_IKANT_LE_OPEN` | EXCLUDED_LEGACY_PROFILE | — |
| `ADAPTER_BOUND_ENTRYPOINT` | INGRESS_ADAPTER_ALIAS | `SESSION_CHAT_LOCAL_HOST_KERNEL` |
| `SESSION_CHAT_LOCAL_HOST_KERNEL` | ABSORBED_CANONICAL_INGRESS | — |
| `SINGLE_COMPOSITION_CHANNEL` | CANONICAL_OWNER | — |

## Closure law

Every PR is represented exactly once. Every channel atom referenced by a PR must exist in the terminal registry. Every registry atom must be referenced by at least one PR. Current exported carriers and byte paths must also occur in the same registry. History is evidence only and cannot create runtime authority.
