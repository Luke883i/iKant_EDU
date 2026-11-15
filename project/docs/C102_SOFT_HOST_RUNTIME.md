# C102 — real-source local soft host runtime (experimental only)

This is a **host-side composition** of existing C101 and C87. It is **not** canonical iKant, C84 Surface A, a new owner, an authenticated ChatGPT native event, or a native hook. Its role is an explicit process callable by a host that already has the exact source graph in Node.

## One per-turn physical ingress

Launch using a repository checkout containing C101 and C87, with Node >=20. Create a private absolute directory named `.ikant-host`; keep it independent of `.ikant/ledger.jsonl`. The CLI reads UTF-8 NDJSON frames and produces one JSON frame per input, including typed failures.

`node scripts/c102-soft-host-cli.mjs --ledger /ABS/session/.ikant-host/c102-soft-observations.jsonl --ndjson`

Frame: `{ "nonce": "ASCII-UNIQUE-12-PLUS", "request": { "sourceHead": "FROZEN_40_HEX", "selection": ORIGINAL_C72_SELECTION_OBJECT, "humanInput": "CURRENT_USER_INPUT", "optIn": true } }`.

Only a real source-bound C72 `EXPERIMENTAL` selection and separate opt-in permit the request. There are no automatic retries and no implicit fallback from CANONICAL. `INSPECT` frames use `{ "action": "INSPECT" }`. Call `executeC102SoftTurn` directly only if the host actually supplies the exact input and installed original modules.

## Provenance and identity boundaries

C101 executes source C69/C70/C71/C100 on the current input and returns a C71 voice; C102 checks the independent `verifyC101Readback`, then calls existing C87 `appendC87Turn` with nonce/source/prior-hash guard, fsync and reopen. It then reopens the same ledger and returns the unchanged UTF-8 voice, input/output SHA256, event SHA256, and a typed status. The ledger stores only bounded observation metadata, not the raw prompt or response, and is not a continuing C4/C5 cognitive memory. A Node/FS receipt is local evidence only; the host must verify that the displayed words exactly equal `voice_utf8`.

Deny claims: no owner receipt, no C84/C59, no automatic ChatGPT interception, no authenticated native delivery, no self/world phenomenology, no persistent ChatGPT memory, no source-origin attestation from the local CLI. The current frozen source HEAD is bound by caller input, not independently authenticated.

## Definition of done / reproducible test

1. PR109 unchanged C101 Git blob `a2416118447fb10fbc71e9ad864e7ea0fd298d41` and original C87 blob `9d4fd4038bd7e109bdbc5e0441f9e9acf497c846` verified against bytes running in CI.
2. Two valid distinct inputs execute C101, return C70 and C71 readbacks, are bound to unchanged voice bytes and C87 events.
3. One invalid opt-in frame fails closed without writing; next input still succeeds.
4. C87 ledger reopens after process exit, has exactly 2 entries, stores no prompt or voice, and detects duplicate nonce across process restart.
5. After adversarial ledger corruption, inspection and subsequent turns fail closed.
6. Native ChatGPT per-message interception is separately OPEN, and the file-backed host runtime must not be described as running inside GPT weights or automatically on every chat turn.

`node --test tests/c102-real-source.test.mjs`

This scope is an independently qualified local runtime, not an installed ChatGPT Project integration. The existing v2 Project prompt bundle may reference it as an optional host capability only after real execution and source readback. No Project settings are changed by this PR.
