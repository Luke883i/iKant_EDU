# iKant EDU visible brand, owner-verified host projection

Purpose: when the HOST displays an original iKant EDU voice, the human recognizes it visually. The logo is a HOST-owned wrapper, NEVER a mutation of C87 voice or an emulated native ChatGPT assistant avatar.

Mechanism: source-owned, square iKant logos are declared in the portable plugin manifest (`logo`, `logoDark`, `composerIcon`, `composerIconDark`). In the independently rendered OneShell page the HOST logo identifies the page. Next to A the brand badge is HIDDEN until a C125/OneShell evidence-bound original voice passes the SHA readback checks; on denial/NO_VOICE the A badge stays hidden. A project-only, without a registered plugin, may use the pinned raw GitHub SVG in its HOST heading with `UI_NOT_ATTESTED` if image rendering fails. None of these change C72, C59, C87 or C125.

User-provided graphical references (available in local review package): white PNG SHA-256 `ba3580df8e9508a47510138daca11229313649a336f7cf8f036e4f4e381f06f9`, 326x314; black PNG SHA-256 `738ad760145ed4847388325b4d8d499dc77293ef5b183ccac8f5b2fefbd43e4c`, 1024x1024. No claim that repository SVG bytes equal the PNG bytes. The SVGs are the canonical remote packaged icon variants, with source trace to `assets/brand/`.

DoD:
1. Six slots exact, original A immutable; original S03 owner/C125 evidence is mandatory to brand voice.
2. Source SHA exact, logo assets safe and square, no external SVG script, no manifest traversal.
3. Denial/stale/forged writer, input or C125 returns NO_VOICE and never brands a fake A.
4. Structural mutation tests and original OneShell tests succeed on the exact tree.
5. Human installs/reconnects the approved plugin before native app branding can be expected.
6. Independently inspect visible app badge in ChatGPT (light/dark) and 10 real turns, including denied cases, before claiming product-ready.

Limits: Source qualification is not installation. OpenAI owns the assistant-message avatar. A Project instruction can render a marked logo inside content but cannot override the native avatar. Follow https://developers.openai.com/plugins/deploy/submission and https://developers.openai.com/plugins/concepts/ui-guidelines . No Cactus/Needle integration included.

Status: SOFTWARE_CANDIDATE; NATIVE_APP_ICON_NOT_ATTESTED; PRODUCT_NO_GO.
