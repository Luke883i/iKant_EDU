# iKant brand P0: source-canonical OneShell header, not platform registration

## Scope and authority

This P0 materializes **the existing** brand glyph at the left of `iKant · OneShell` on the Host-owned HTML renderer. The input is the byte-identical canonical `assets/brand/ikant-light.svg` (SHA-256 `b6dc3f6e22149ef9f96348ce8e677af034cd2377f26450af18d51bc5c43ae633`), also supplied in the plugin package. The SVG is validated before embedding. There is no remote fetch, image hotlink, script, untrusted markup or new model authority. The path glyph remains unchanged; CSS `currentColor` allows light/dark host theme contrast. The small icon is decorative for accessibility because the adjacent human-readable title is retained.

The text renderer remains a text-only fallback; if the source file is unavailable or mismatched, rich HTML renders the header **without the image**. Absence of an image is preferable to a forged brand. This is **Host content**, not a persistent ChatGPT avatar or proof of original C135 voice. All six machine slots, original byte values, speaker boundaries, state badge and EXIT two-turn rule are unaffected.

## "Registration-like" without counterfeit status

| Truth tier | Can we claim it? | Evidence |
|---|---|---|
| SOURCE_ASSET_CANONICAL | Yes, as of the pinned commit | Git blob + SHA-256 and identical packaged light icon |
| HOST_ONESHELL_BRAND_QUALIFIED | Only after merged and exercised | Renderer code + Node tests + original frame checks; not native UI |
| APP_PACKAGE_PREPARED | Partly | plugin.json declares logo/dark/composer assets; final metadata not yet complete |
| SUBMISSION_READY | Not yet | four real HTTPS listing URLs, publisher verification, reviewer fixtures and server validation required |
| SUBMITTED_FOR_REVIEW | No evidence | Portal submission record required |
| APPROVED / PUBLISHED / NATIVE_ICON_DISPLAYED | No evidence | Platform approval, publication and real client observation required independently |

The honest phrase is **"identità visiva canonica pronta per l'integrazione"** (when P0 is qualified), **not** "quasi registrato" if that suggests review/authorization. Readiness is a measurable distance from submission, **not** a percentage of institutional approval. An app can be locally brand-complete without being accepted or reviewed by a third-party platform.

According to the OpenAI Plugins submission documentation (https://developers.openai.com/plugins/deploy/submission), MCP submissions need `websiteURL`, `supportURL`, `privacyPolicyURL`, `termsOfServiceURL`, actual developer verification, package upload, automated scans, five positive and three negative test cases and a video walkthrough. No fabricated URLs or badge. Icon declaration and raw MCP `serverInfo.icons` metadata are **self-declarations**; a client is free not to display them. The Platform controls registration, approval and the native icon.

## DoD and explicit exclusions

- Single SVG in the existing OneShell V2 header at 28px, before the title, pinned bytes and digest.
- Six machine slots and all Surface A UTF-8 bytes unchanged; status badge stays owner-derived and non-interactive.
- Dark/light CSS without native theme introspection, inline/local-only icon, accessibility with text label.
- Tamper attempts for source, registered claim, fake avatar or status rejected; 1,000 deterministic semantic scenarios.
- CI on Node 20/22 and actual client visual inspection **separate**, not interchangeable.
- No declaration of software ownership exclusivity, trademark registration, provider avatar delegation, native message event provenance, or universal persistence across ChatGPT chats.

`PRODUCT_NO_GO` for native identity until an independent authorized registration and UI test. This PR does not change C72, C59, C87, C125 or C135.
