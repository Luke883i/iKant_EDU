# C94 host installation boundary — no per-turn human transfer

C94 is an adapter for an authorized Node 20+ **host application** with real outbound HTTPS. Installation and access grants are outside ChatGPT text responses. The user should not paste GitHub or OpenAI credentials into the chat. The CI Actions artifact is the distribution carrier; manually uploaded ZIP is never the production path.

## Real required capabilities

- Host GitHub App installation / read-only authorized token with repository **Actions read** and **Contents read**; Node `IKANT_C94_GITHUB_TOKEN` environment variable provisioned by a secure secret manager, not the user message.
- Two independently configured OpenAI Responses API credentials/models for the existing C92 code (`IKANT_C92_GENERATOR_KEY/MODEL` and `IKANT_C92_REVIEWER_KEY/MODEL`); these verify two HTTPS requests, **not** empirical truth or separate provider organizations.
- A **registered, actually callable** native ChatGPT host extension with event-ID/readback support and a pinned host signing public key. This is not implemented by Projects, Markdown, the GitHub connector alone, or a local ZIP. A signature on a JSON callback only attests control of its private key, not independently observed native presentation.
- The real C72 selection owner and current human message supplied as independent native ingress. Text reconstructed from chat history is not an event receipt.
- The C90/C91/C92/C93 Node modules installed at exactly the frozen repository revision. Changing the SHA changes the runtime epoch.

## Cold-turn path

1. In the host, observe the actual HTTPS main HEAD once. Do not rely on user-supplied or model-inferred SHA. C94 repeats the exact HEAD compare to reject stale runs.
2. Call `buildC94C84AutoPackage({sourceHead,client:createC94GitHubHTTPS()})` in the Node environment. It automatically selects the exact-head successful GitHub Actions C77 artifact, verifies every contained byte and 70-Cx proof, uses GitHub Git Data API to reconstruct raw commit/trees with SHA-1 validation, stages/reopens 35 C77 files and writes/reopens the C84 JSON package. No user upload.
3. `executeC94ColdHostTurn` consumes the same-current-input C72 selection, C84 package, C90/C91/C92/C93 owner and signed host callback. All real C85/C81/Node/provider checks remain mandatory.
4. Before recognizing native delivery, the actual ChatGPT host platform must report its own event identity and rendered byte readback. The C94 signed-callback verification **does not claim this final independent platform witness**; it intentionally returns `C94_HOST_SIGNED_ACK_BYTES_MATCH_NOT_INDEPENDENT_PLATFORM_ATTESTED`.

## Honest stop statuses

`GITHUB_ACTIONS_TOKEN_UNAVAILABLE_IN_NODE`, `C77_HEAD_EXACT_ARTIFACT_MISSING`, `GITHUB_API_OR_BINARY_TRANSPORT_*`, `C81_GIT_OBJECT_PROOF_*`, `REAL_PROVIDER_CONFIGURATION_MISSING`, `HOST_NATIVE_DELIVERY_HOOK_UNAVAILABLE`, and `PLATFORM_NATIVE_EVENT_INDEPENDENT_READBACK`. These are engineering diagnostics, not cognitively generated iKant responses.

## Release limitation

No OAuth installer, native ChatGPT hook, API keys, independent semantic truth oracle or field H95 outcomes are present in this pre-PR; accordingly it **cannot demonstrate a positive cold ChatGPT turn with native delivery in this environment**. A host integration product, credentialed evaluation environment and independent host-session witness are prerequisites, not documentation promises.
