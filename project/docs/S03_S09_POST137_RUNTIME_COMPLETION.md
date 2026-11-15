# S03-S09 post-PR137 runtime hardening (source-exact candidate)

The original iKant owners remain authoritative. This slice does **not** install a
ChatGPT plugin, change C59 ACTIVE, establish native provider event identity,
observe 30 independent humans, or approve a release.

## Completed local engineering edges

- S03: the C135 EDU/v2 owner now exposes a read-only six-slide HOST view only
  after C87 independently reopens and C125's original send callback resolves.
  The original UTF-8 C125 frame and its voice remain byte exact. Replays,
  spoofed C125-shaped messages, or nonmatching hashes cannot populate A.
  `HOST_BOUND` means local owner evidence, not native delivery.
- S04: Project baseline aligns public admission with C72/v2 `EDU`/`CANONICAL`.
  Builder records both commit and tree and can reject an incorrect caller-pinned
  commit; output is still only a deterministic candidate ZIP, **not** an
  installed plugin or remotely authenticated source. Use a clean checkout of
  the *current live main* after merge. Host must separately cross-check SHA
  with GitHub and the human must explicitly install Project instructions/ZIP.
- S05: an audit envelope can be checked against a separately trusted Ed25519
  public key and duplicate pseudonyms rejected. Signatures prove integrity
  relative to that key, **not** human individuality, consent or first use.
- S06: an MCP call must pass both the existing deployment bearer/Origin guard
  and a gateway-signed session-user-event proof, with persistent exclusive
  nonce reservation. The gateway MUST have independently authenticated its
  client; local HMAC **does not** attest ChatGPT-native origin. Provision
  `IKANT_MCP_AUTH_TOKEN`, `IKANT_MCP_ALLOWED_ORIGIN`,
  `IKANT_MCP_GATEWAY_SECRET`, `IKANT_MCP_NONCE_DIRECTORY` (private mode 0700),
  TLS termination, key rotation and nonce retention policy outside the app.
  These settings are NOT embedded in Project ZIP and are not provisioned here.

## Intentionally external, still blocking product readiness

- S03 real ChatGPT delivery/presentation witness; S04 actual user-controlled
  Project deployment; S05 30 different independently authenticated human
  participants; S06 production TLS/multi-tenant isolation and actual gateway;
  S07 registered callable authenticated MCP plugin and three provider calls;
  S08 C59 original signed provider identity, one same-turn DOCX and delivery;
  S09 real C137 model evaluation, complete post-merge CI and release-owner signoff.

Do not turn a successful GitHub PR or a synthetic test into a false release
receipt. `A=NO_VOICE` unless this same turn's original C87/C125 readback exists.
