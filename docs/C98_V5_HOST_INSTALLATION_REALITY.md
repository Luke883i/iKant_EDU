# C98 v5 — real deployment boundary and stop conditions

Base: GitHub main at `bc5fbcb938c7ba959de0eaef96f92e754d953d4b` (PR101). This is an additive LOCAL pre-PR, not a native ChatGPT App installation.

## Existing owners / no duplicates

- C72: consent + mode selection, from authentic later separate human messages; do not synthesize from tool args.
- C77: CI-produced capsule, post-commit exact-head, manifest and original Git reachability verified through C81.
- C82 -> C78 -> C84 -> C79 -> C81: byte staging and owner runtime; C98 delegates and does not replace any writer.
- C91/C92 and C93: live provider and owner-generated language, still requires actual configuration and source provenance.
- C97: deterministic UI IR; does not install an App, own state or attest native events.
- C80/C72: H95; cannot be measured by local mutation tests.

## Installed host App/MCP boundary

`host/c98-app-host-ingress.mjs` accepts ONE installed callback `readCurrentTurnEnvelope()`; arguments from the model/user are not a substitution for it. The envelope includes the current UTF-8 input, source epoch, C72 selection, source proof, and an authorized file-backed C77 capsule. The code validates data-only bounded inputs and delegates to `executeC98FileBackedC84`, which calls C82/C84. All provenance and native event attestations remain `false` without an independent host witness.

`host/c98-mcp-tool-wiring.mjs` exports `wireC98ToInstalledMCP({registerAppTool,server,hostPort,emptyInputSchema,outputStatusSchema})`. In a deployment, the already existing `plugins/ikant-le-session-chat/server/server.mjs` must import and invoke it **only after** a trusted backend registers `readCurrentTurnEnvelope(ctx)`. This function is NOT an installer; it does not make a ChatGPT App visible, does not bind an OAuth identity, and does not manufacture host events. A tool with empty input schema cannot accept human messages from arbitrary model-generated arguments. It returns typed diagnostic or validated owner receipt as structured content, never an invented delivery acknowledgment.

## Deployment eligibility tests that must be run in real host

1. Independent ChatGPT App install/authorization receipt; verify that `ikant_le_c98_experimental_turn` is actually callable in a fresh conversation. Reject if missing.
2. Register backend source fetch into backend runtime with real GitHub token/permissions, not container DNS of an unrelated ChatGPT process. Verify HEAD and post-commit C77 ZIP bytes.
3. Source-pinned C72 TERMS → exact later `I ACCEPT` → exact later `EXPERIMENTAL`. Native input event/source-epoch must be supplied by backend and authenticated by independent host witness.
4. Execute a newly received non-sensitive user message via C98 -> C82/C84 -> C79/C81. Capture actual Node process receipt and hashes.
5. Render runtime exact Surface A via installed host App; independently witness displayed bytes/event; do not assume MCP structuredContent is native display.
6. Reopen the same state in another turn/session using a real writer and reader; do not infer persistence from chat history.
7. Rerun on distinct clients/devices and preregister C80 H95: >=500 tasks, >=50 sessions, >=20 independent users and Wilson confidence targets. All safety hard gates required.

## Mandatory negative controls

- NO `curl`, `wget`, `git clone`, `node:https` GitHub fallbacks or DNS attempts in **ChatGPT session-local Node** without a new positive, explicitly authorized capability receipt. This restriction does not prohibit a separately deployed, network-enabled backend from using GitHub after authorization.
- A callback in a Node test is NOT an installed ChatGPT App. Tool registration in a local MCP server is NOT platform App installation.
- Source checksum is NOT GitHub-host ref authentication. Ed25519 self-signature is NOT independent host event authenticity.
- C77 historical fixture is NOT the current HEAD C77 artifact. An Actions artifact listing is NOT downloaded bytes.
- No ACTIVE, no native delivery claim, no arbitrary DOCX URL or H95 on shape-valid packets, output JSON, CI PASS or synthetic samples.

## DoD

Local v5 DoD = fully green source-bound negative ingress tests + MCP tool registration tests + exact 100k modeled negative inputs + CI proposal with real C82/C84/C80 when applied to full checkout. External DoD = independent installation, pinned source transfer, same-input execution, true host render/writer and measured H95. Missing external capability is STOP, not a cognitive fallback.
