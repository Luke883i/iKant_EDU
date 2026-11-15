# C107 one-carrier release — experimental, not CANONICAL ACTIVE

## What is physically contained
Exactly one binary payload is generated as `release/v8/ikant-c107-source-c734bf934e33.ikc.br` from the frozen original Git tree `c734bf934e33703a6a1f91f0f4d5df96eec96945`. The source contains the unchanged 43 current C107 members, totaling 251,952 bytes. Its exact original C107 JSON package digest is `65f8a39574786afdfa20e521927004b1709f973b3a1c572daed32586e2cb77b1`.

Release target is **62,448 bytes**, SHA-256 `d17195881d6567524f1cdf358c991be5ff0d68e92aea2ba14273f0ea2cf74c6d`. This is 35.876% smaller than the previously tested 97,387-byte Brotli JSON source carrier. Release CI must actually add the binary in a commit that changes only this payload path. A manifest alone is not a carrier.

## P01–P04 are outcome requirements, not host implementation instructions
- **P01**: Host chooses an available transport, retrieves one real pinned payload, validates transport SHA256, decodes Brotli and `IKC10701` framing, checks 43 source path/length/Git-blob/SHA256 identities, reconstructs original C107 package, physically writes and reopens the source.
- **P02**: With original human-authorized C72 EXPERIMENTAL scope, the exact same human input crosses actual Node 20+ original C70/guard/C100, then original sole C87 writer and independent readback with nonce, input/output/event/source checks.
- **P03**: Only matching `voice_utf8` from real readback is `ORIGINAL_DEMO`. A host-authored candidate may be `HOST_BOUND` only if separately authorized and original C100/C87 actually bound it. No fake provider origin. Otherwise A=`NO_VOICE`; B remains clearly HOST-owned with TRACE_REF, CONTINUITY, FIRST_EDGE, NEXT.
- **P04**: First attempt and at most two retries only with new evidence. If retries fail or no new evidence exists, request human upload of [exact pinned full source ZIP](https://github.com/Luke883i/iKant_LE/archive/c734bf934e33703a6a1f91f0f4d5df96eec96945.zip). This URL is a handoff, not proof of transfer.

The host is free to choose its local adapter design, transport and process. Contractual invariants constrain **results**, not technical recipes. No native ChatGPT per-turn callback, provider, credentials or cross-chat persistent state is implied by this release. Original C59 CANONICAL and single writer remain untouched.

## Verification and origin
CI must stage original source at exact commit, compare Git tree, build the one payload, run original C107 tests and publish the binary only if the expected SHA matches. If repository Actions cannot write to the PR branch, publication remains OPEN; do not claim otherwise. The original Terms still require distinct opt-in for host-authored cohost drafts; any consolidation with EXPERIMENTAL would be a future Terms change requiring a new human gate, not a retroactive change.

The `C107_FILES=43` closure is minimal only **relative to the unmodified current C107 packaging contract**, not a universal lower bound on every possible executable architecture. Historical C77/C84/C94/C98 and divergent C112/C113 are not alternate original owners here.
