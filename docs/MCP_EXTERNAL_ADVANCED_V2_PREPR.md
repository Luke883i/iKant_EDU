# iKant_LE MCP External — advanced pre-PR v2 assurance

**Status (20 October 2026): `LOCAL_PREPR_CANDIDATE / PRODUCT_NO_GO`.**
**Pinned GitHub main HEAD:** `2d12e2657d92864f56ed6f562a15e8de5a05fa67`;
**TREE:** `9df58eb066ee1229a0ac84ac40cb15597eef8dae`.
**Local candidate checkout is based on historical `3d174674...`: not yet rebased on the byte-complete pinned C140 HEAD.**
No remote push, deployment, ChatGPT native connection, or CANONICAL installation is asserted.

## I. Three independent surfaces, two session-chat modes

| Surface | Owner | Admission | MCP dependency | Evidence boundary |
|:--|:--|:--|:--|:--|
| EDU | C72/v2 + C135/S02, current C140 child | exact human mode selection in chat | none | local C87/C125; not native |
| CANONICAL | original C72/C59 `SESSION_CHAT_LOCAL` | exact human mode selection in chat | none inherently | original native provider evidence required |
| MCP_EXTERNO | `plugins/ikant-le-session-chat/server` / C20 deployed compatibility | manual external server connection in ChatGPT Plugins | yes, it **is** the external service | OAuth + gateway/session proofs; not C59 native event |

Do not add MCP as `mode_choices` in C72, do not move C59 activation to C20, do not infer native event provenance from OAuth subject, bearer, HMAC, `openai/session`, MCP connection, or plugin registry. The external service reuses compatible runtime bytes (C20) without changing EDU or CANONICAL. A source-code `ACTIVE` in a legacy compatibility profile is NOT original CANONICAL `SESSION_CHAT_LOCAL` active.

## II. Target end-to-end ownership graph

`Git HEAD/TREE source lock -> clean checkout -> Render single-instance Node >=20 -> verified C20 deployment store + persistent disk -> HTTPS/mTLS (when configured) -> MCP 401 + RFC 9728 resource discovery -> independent AS metadata (issuer, code, token, CIMD/DCR, PKCE S256) -> ChatGPT user linking -> signed JWT audience/scope checking -> tenant-bound session -> MCP initialize/tools/list -> tool-level read/write scope -> C20 runtime/local writer -> independent receipt reopen -> MCP tools/call result -> observed ChatGPT surface`.

Do not collapse the chain: a successful step is neither sufficient evidence nor activation of subsequent steps. `I ACCEPT` and subsequent turns remain actual human acts (inside the app) and require original owner handling. A remote AS and actual ChatGPT linking cannot be simulated by a locally signed JWT.

## III. Corrections since pre-PR v1

1. **Per-tool authorization challenge:** OAuth-validated tokens lacking `ikant:write` stop before runtime spawn. The tool result contains `_meta["mcp/www_authenticate"]` as an array of `Bearer resource_metadata=..., error="insufficient_scope", error_description="..."`, in addition to per-tool `securitySchemes`. The original code returned a generic exception, which would not support robust ChatGPT scope escalation.
2. **JWKS fanout:** same-TTL concurrent JWKS requests now coalesce through one in-flight promise; unknown-kid refresh storm remains bounded. Exactly 100 concurrent unit requests produce one fetch in a synthetic in-process test. The streaming body stays capped at 65,536 bytes.
3. **OAuth issuer semantics:** accept a precisely configured, HTTPS issuer with a path and no terminal slash (`/tenant/v2.0`); comparison remains byte-exact, no trailing-slash normalization. JWKS authority must match issuer origin.
4. **JOSE fail-closed:** signed JWTs with unsupported `crit` or `b64` extensions are refused; we cannot safely interpret an unsupported critical JOSE extension.
5. **Render readiness:** HTTP `/healthz` now performs source-head-matched `readSessionChatDeployment` and responds 503 on failed physical store reopen. Startup also performs source-bound `ensure`, so a disk/source epoch mismatch fails closed. Operational readiness cost and restart SLA require a live Render measurement.

## IV. Multi-abstraction mutation assurance

`contracts/mcp-external-mutation-assurance-v2.json` preregisters 25 DoD; `scripts/mcp-external-falsify-10m.c` executes 10 * 1,000,000 distinct deterministic **typed model-state** vectors (10 fixed 64-bit seeds, 8 named fault atoms in each domain). Each vector may include multiple simultaneous faults. There is one independent finite-state oracle and a four-stage reference enforcement model; one disabled-check mutant per fault atom (80 total) must be killed on a seeded counterexample. The 10 domains:

1. SOURCE_LOCK and C72/C59 boundary;
2. OAuth RFC 9728 discovery / PKCE / issuer callback;
3. JOSE RS256 / JWKS / critical headers;
4. signed claims / expiry / audience / scope;
5. tenant isolation / write authorization / UI challenge;
6. HTTPS/Origin/HMAC/bearer/nonce/method;
7. MCP initialize/list/schema/visibility/tool response;
8. writer exclusivity / unknown-send / C125 byte witness;
9. Render disk/restarts/rollbacks/secrets;
10. session-chat EDU/CANONICAL noninterference.

**Scope limitation:** These are _10 million model-level experiments_, not 10 million distinct live OAuth authorizations, server process executions, tool invocations, or proof of all possible natural-language semantics. The oracle is specified by the threat-model author and may be incomplete. Real bugs can exist outside these fault atoms. No oracle disagreement or mutant survival establishes only a finite-model conclusion.

### DoD levels and falsifiers

**GLOBAL:** frozen EDU/CANONICAL two-mode contract; never elevate C20/OAuth to C59 authority; Git source lock and changed-blob reopening; no synthetic-to-native claim; no touched original owners. Failure of any item stops qualification.

**INTERMEDIATE:** authenticated resource metadata and issuer binding; JWT/JWKS negative tests; scope gating before original runtime; coalesced bounded fetches; real MCP SDK handshake/list/call; persistence and rollback; single writer/unknown-send; tenant isolation; source-exact C140 integration. Each is separately measured, not inferred from downstream output.

**LOCAL:** atomic negative tests, `WWW-Authenticate` challenge, exact issuer paths, JOSE critical header refusals, streaming JWKS cap, 10M seeded reference-model evaluation, no-credential Render blueprint, Git SHA-1 blobs and reopened SHA-256 evidence.

**EXTERNAL (OPEN):** real auth server OAuth PKCE/CIMD/DCR+revocation, paid Render store restart and rollback, real user-installed ChatGPT plugin with 3 distinct authenticated tool calls, provider-native identity, independent 30-human and blind real-model efficacy evaluation, post-rebase full C140 qualification. Without each external owner receipt, `PRODUCT_NO_GO` stays unchanged.

## V. Contract optimality (non-empirical)

The original finite lattice has 5 auth x 5 isolation x 5 preservation x 8 deployment axes = 1,000 candidate designs. Only 4 pass the declared constraints. `A4-B4-P4-D7` maximizes the _published ordinal weights within that constrained finite search_; neither the weights nor axes are experimentally proven optimal. The irreducible implementation boundary is the distinct set of authentic issuer/resource binding, principal authorization, write-scope denial, persistent store, owner evidence, and independent provider test. Each can be falsified by removing its guard. Do not call this a universal, cost-optimal or deploy-proven design.

## VI. External realism and operations

- **OpenAI auth guide:** the resource server publishes well-known metadata, the AS publishes OAuth discovery with authorization-code PKCE S256 and client metadata/DCR, the token carries the exact `resource` audience, and tool auth failures include `mcp/www_authenticate` plus `error_description`. `securitySchemes` must be per-tool. The ChatGPT user installs/connects the plugin explicitly; there is no automatic session-chat installation.
- **Render:** public HTTP service binds `$PORT` on `0.0.0.0` under managed HTTPS. A paid persistent disk is needed for C20 sessions; only one service instance may mount it and zero-downtime deploy is disabled. Neither server file system outside mount nor pre-deploy commands may be treated as durable. No secrets in YAML or repository. Corruption/epoch migration requires an operator-controlled stop/recovery.
- **Security debt:** current access tokens are bearer replayable until expiry; revocation must be verified by AS policy/introspection/short TTL. Namespace-scoped `openai/session` is not authenticated message provenance and may not be supplied by an actual ChatGPT connection. Unknown tool-send outcome requires STOP+read-only reconciliation, not retry.
- **Real SDK protocol:** cannot be demonstrated without an installed SDK and transport-level test process. Current local machine cannot install npm packages from the network. Source tests are not equivalent.
- **Stateful concurrency:** actual in-flight C20 double accepts, writer locking, crash recovery and at-most-once delivery require injected faults across real process boundaries, not a sampled abstract oracle.

## VII. Release checklist (falsifiable)

- [x] Source HEAD/TREE observed unchanged on remote during analysis; changed original MCP blobs same as current HEAD.
- [x] EDU/CANONICAL remain exactly two session-chat modes in the patched checkout.
- [x] Scoped OAuth denial, JOSE flags, issuer paths and coalesced JWKS tested in Node locally.
- [x] 10 x 1,000,000 seeded finite model scenarios executed, all 80 guard mutants killed, 0 oracle disagreements.
- [x] Static Render blueprint checked for disk/health/environment shape (NO deployment).
- [ ] Full byte-complete current C140 HEAD checkout + SDK dependency restore and post-rebase CI.
- [ ] Real OAuth authorization-code+PKCE consent, refresh and token revocation.
- [ ] Real SDK `initialize -> tools/list -> tools/call`, including 401 and scoped challenge.
- [ ] Real Render disk reboot/redeploy, corruption and rollback traces.
- [ ] Real installed ChatGPT custom plugin and 3 native calls, unique authenticated events.
- [ ] Independent user/pilot and semantic efficacy evidence; human release authorization.

## VIII. Reference documentation, verified 2026-10-20

- https://developers.openai.com/plugins/build/mcp-server
- https://developers.openai.com/plugins/build/auth
- https://developers.openai.com/plugins/build/plugins
- https://developers.openai.com/api/docs/mcp
- https://render.com/docs/web-services
- https://render.com/docs/disks
- https://render.com/docs/health-checks

All design claims are local/source-verified unless explicitly labelled `EXTERNAL_OPEN`. No code push, repository PR, Render service, OAuth client registration, or ChatGPT plugin installation has been executed.

### SOURCE_LOCK rotation evidence (HOST, pre-PR)

Original source epoch of the design: `463c8474afccb9b5e7906b90fcb50bd751fe9579` / `4055f4f2ed485ca134a0d417c154bc43b56f411c`. Target source for this isolated candidate: `2d12e2657d92864f56ed6f562a15e8de5a05fa67` / `9df58eb066ee1229a0ac84ac40cb15597eef8dae`. The earlier synthetic campaigns qualify only the bounded threat model; no real ChatGPT OAuth or Render deployment is attested. This documentation change neither introduces a third session-chat bootstrap mode nor changes C72/C59/C135.
