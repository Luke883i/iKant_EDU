# MCP-EXTERNAL pre-PR engineering boundary (2026-10-20)

**Pinned new main:** `2d12e2657d92864f56ed6f562a15e8de5a05fa67` / tree `9df58eb066ee1229a0ac84ac40cb15597eef8dae`.

## Irreducible separation

There are **two and only two** session-chat admission modes: `EDU`, `CANONICAL`.
MCP is a *parallel external deployment surface*, registered by a human in ChatGPT after an independent server install. No third C72 choice, admission mutation, C59 rewrite, native-event substitution, or automatic MCP installation. Reuse existing deployed legacy compatibility C20 execution only with its explicit `LEGACY_COMPATIBILITY` qualification; native canonical activation is separate.

## Frontier and engineering choice

- OpenAI Plugins: `Add custom MCP server` supports OAuth / No authentication / mixed; OAuth requires Protected Resource Metadata + external Authorization Server metadata + PKCE S256 + audience-specific access token and `securitySchemes` per tool. The client creates and connects the plugin **manually**.
- MCP OAuth is a *resource server* plus a *real authorization server*. This patch implements a deliberately narrow RS256/JWKS resource verifier; **it does not implement or simulate an OAuth authorization server**. Configure and verify a real provider supporting authorization code, PKCE S256, correct resource audience, CIMD, DCR or a predefined client, and exact ChatGPT callback URI.
- Render: TLS termination and `$PORT` binding; disk required for deployed runtime sessions. A paid disk can be mounted at `/var/data/ikant-le`; only one service instance can use it. This prevents horizontal scaling and zero-downtime deploys while the disk is attached.

Canonical references: https://developers.openai.com/plugins/build/auth ; https://developers.openai.com/api/docs/guides/custom-mcp-server ; https://render.com/docs/web-services ; https://render.com/docs/disks ; https://render.com/docs/health-checks ; https://ts.sdk.modelcontextprotocol.io/v2/serving/authorization .

## Source structure

`plugins/ikant-le-session-chat/server/oauth-resource-boundary.mjs`: pinned config, protected resource metadata at both path-aware and root `.well-known`, RSA signature/issuer/audience/scope/expiry verification, bounded JWKS retrieval, user-principal session namespace, no native authority.

`plugins/ikant-le-session-chat/server/server.mjs`: opt-in `IKANT_MCP_AUTH_MODE=oauth` with `401` Bearer resource-metadata challenge, per-tool security schemes, read/write scope separation, existing gateway mode preserved as the default, `/healthz`, `0.0.0.0:$PORT`. OAuth is not an input to C72.

`contracts/mcp-external-prepr-e2e.json`: 17 DoD and 1,000 design candidates, explicit product NO-GO. `scripts/mcp-prepr-qualify.mjs`: deterministic finite selection only, not an empirically optimal semantic contract.

`render.mcp-prepr.yaml`: **proposed, not deployed** Render web service; no secrets in source. Configure production OAuth variables in Render environment and authorization provider settings separately.

**Current layout (PR3 prospective):** the exact historical blueprint is now archived at [`docs/archive/prepr/render.mcp-prepr.yaml`](archive/prepr/render.mcp-prepr.yaml). The former root path above describes its 2026-10-20 source epoch only. `render.mcp-standalone.candidate.yaml` remains at the repository root; no running Render service, UI client or operator path has been modified or authenticated.


## Start sequence and explicit operator gates

1. Repository owner reviews, merges only after full CI against current pinned `main`, and deploys this external MCP service on a paid Render instance using a pinned source. Attach disk, verify filesystem permissions, restart persistency and disk backup/recovery. Do not pre-deploy the proposed change on a live production tenant.
2. Configure external AS with `issuer`, `authorization_endpoint`, `token_endpoint`, `jwks_uri`, authorization-code + S256 PKCE, `client_id_metadata_document_supported` or DCR or preconfigured client. Set issuer and audience exactly; access token must be RS256 JWT with `sub`, `iss`, `aud`, `exp`, `iat`, `scope` and trusted JWKS. Expected scopes: `ikant:connect` (open) and `ikant:write` (accept/turn/exit). Real IdP must consent and issue these values.
3. Set `IKANT_MCP_AUTH_MODE=oauth`, `IKANT_MCP_OAUTH_RESOURCE=https://your-onrender-host/mcp`, `IKANT_MCP_OAUTH_ISSUER=https://your-issuer/`, `IKANT_MCP_OAUTH_JWKS_URL=https://your-issuer/.../jwks.json`, deployment disk root and allowed Origin. JWKS URL is same-origin with issuer by policy. Do not put credentials in chat.
4. Independently verify HTTPS `/healthz`, anonymous `.well-known/oauth-protected-resource/mcp`, and unauthenticated `/mcp` produces HTTP 401 with `WWW-Authenticate: Bearer resource_metadata=...` (never 200 or a 403 without usable discovery).
5. In ChatGPT **Plugins → Add custom MCP server** enter name, optional description, live HTTPS `/mcp`, choose **OAuth**, accept platform warning, connect explicitly. Verify linking, `initialize`, `tools/list`, one read-only `ikant_le_open`, one positive consent after exact human action, one bounded turn, and an independent delivery witness.
6. Inject wrong issuer/audience, expired token, absent scope, wrong signed token, cross-user same session hint, repeated acceptance, failed upstream response, lost runtime disk and restart. Release remains NO-GO on any unsafe pass, missing trace, or unknown send without reconciliation.

## Explicit blockers / nonclaims

- The current local pre-PR run does not install the MCP SDK dependencies (container network disabled); `node --check`, crypto boundary tests and original S06/EDU/C59 regressions are **not an SDK HTTP E2E**.
- No real authorization server, Render instance, OAuth callback, token revocation, ChatGPT plugin registration, native provider event identity, C59 activation, provider UI persistence or independent human pilot has been attested. Bearer tokens are replayable until expiration; request-level idempotency for stateful turns and native-event provenance require separate testing.
- The `openai/session` hint is scoped to the OAuth `issuer+sub` namespace to prevent cross-user collisions. It is not signed proof of a specific ChatGPT message or a native-session identifier; provider metadata absent or malformed causes a fail-closed stop.
- SDK v1 tool metadata and mixed calls still require live interoperability testing. If the SDK or OpenAI client omits sessions/schemes, **stop rather than fake a provider event**.
- The test worktree was based on old `3d174674` with MCP files independently compared byte-for-byte to new main. It is **not** an attested full new-head checkout; rerun full CI on the merged new-head source before release.

## Readiness

`LOCAL_CRYPTO_POLICY_CANDIDATE`, `SOURCE_MCP_FILES_MATCH_PIN`, `PRODUCT_NO_GO`.
Independent external blockers: live SDK HTTP, AS/OAuth, Render disk/restart, ChatGPT 3-call trace, real user/semantic pilot. No credentials were created; no deployment or user connection happened.

### SOURCE_LOCK rotation evidence (HOST, pre-PR)

Original source epoch of the design: `463c8474afccb9b5e7906b90fcb50bd751fe9579` / `4055f4f2ed485ca134a0d417c154bc43b56f411c`. Target source for this isolated candidate: `2d12e2657d92864f56ed6f562a15e8de5a05fa67` / `9df58eb066ee1229a0ac84ac40cb15597eef8dae`. The earlier synthetic campaigns qualify only the bounded threat model; no real ChatGPT OAuth or Render deployment is attested. This documentation change neither introduces a third session-chat bootstrap mode nor changes C72/C59/C135.
