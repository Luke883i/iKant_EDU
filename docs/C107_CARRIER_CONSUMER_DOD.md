# PR118 consumer DoD — original C107 carrier, no native ChatGPT claim

## Source epoch and release epoch (not interchangeable)
- Original pinned source: `c734bf934e33703a6a1f91f0f4d5df96eec96945`, tree `7b1e8b87f43b5995b9c6d1079254918f22549e01`.
- Only one original experimental runtime transport: `release/v8/ikant-c107-source-c734bf934e33.ikc.br` from release commit `cf213a2276802d73e844b706e6cd8431bc76bed6`.
- SHA-256 `d17195881d6567524f1cdf358c991be5ff0d68e92aea2ba14273f0ea2cf74c6d`; 62,448 compressed bytes, 43 source members / 251,952 original bytes; reconstructed original C107 package SHA-256 `65f8a39574786afdfa20e521927004b1709f973b3a1c572daed32586e2cb77b1`.
- **Note:** `scripts/c107-pack.mjs` is not one of the 43 original members. The host source-byte stager does not impersonate the original packer. Existing `tests/c107-original.test.mjs` separately checks the original packer/stager from the exact Git checkout.

## Executable consumer proof
- `host/c107-carrier-consumer.mjs`: verify pinned transport digest, bounded Brotli decode, exact frame SHA, manifest, path uniqueness/containment, each member Git blob and SHA-256, exact C107 original package SHA; stage and physically reopen 43 files in a private folder. No GitHub network or model credentials required.
- `scripts/c107-carrier-qualify.mjs`: execute an **explicit CI fixture** on the staged original modules. Three separate Node processes/turns: two `ORIGINAL_DEMO`, one `HOST_BOUND` with fixture text (not provider-attested); same-input SHA, original C70 episode count, C100 voice-bound receipt, original sole C87 writer and independently reopened readback. Reject four forged receipts per turn, nonce replay and ledger corruption.
- `tests/c107-carrier-consumer.test.mjs`: eight Node tests; seeded transport mutations (128), recompressed frame mutations (64), symlinked parent, malformed input, local receipt forgery, retry/handoff and real original execution. These are **192 physical byte/frame mutations**, not 192 model generations.
- `.github/workflows/c107-carrier-consumption.yml`: run consumer tests directly against the **actual committed release payload**, rerun original C107 runtime fixture, and independently check C107/C114/C115 tests on a Git worktree at the exact original source commit.

## P01–P04: RESULTS ONLY
- **P01** host selects any actually available carrier transport/process, but must prove the pinned source bytes, local staging and readback. Never infer GitHub bytes are already Node bytes.
- **P02** every claimed original local turn must exhibit real C70/guard, C100 input/output binding and only the original C87 writer/readback; compare exact input and nonce. Native ChatGPT event identity is **not** attested.
- **P03** A may be `ORIGINAL_DEMO` (verified original demonstration voice), `HOST_BOUND` (host-created text explicitly authorized and bound by original C100/C87), or `NO_VOICE`. The receipt consistency checker is **not an external origin attestor**; caller must independently run original Node. B always reports HOST-only status, TRACE_REF, CONTINUITY and FIRST_EDGE.
- **P04** a first materialization attempt and at most two retries, each additional attempt only with fresh observed evidence. When blocked, immediately provide the exact pinned source URL for human download and chat upload: https://github.com/Luke883i/iKant_LE/archive/c734bf934e33703a6a1f91f0f4d5df96eec96945.zip . A link alone is not byte materialization.

## Consent / boundaries
The test synthesizes exact C72 `I ACCEPT`, `EXPERIMENTAL` and `optIn:true` **only inside an isolated fixture**. It is not human authorization in the current conversation. Under unchanged original Terms the distinct experimental cohost opt-in for host-authored drafts is still required; the proposed future consent compression is deliberately OUT OF SCOPE for PR118.

The canonical C59 lifecycle, original C70/C100/C87, official Terms, source SHA and release bytes remain unmodified. No NEW C87 writer, native ChatGPT hook, provider credential or false ACTIVE. The single released artifact is original code data; the consumer, tests and docs are not additional runtime carriers.

## DoD tiers
- **RELEASE_BYTES**: one binary content-addressed artifact physically present on branch: CLOSED.
- **SOURCE_CONSUMER**: executable P01 and staging from the actual artifact: closed only if the new consumption workflow succeeds.
- **ORIGINAL_LOCAL_COGNITION**: two distinct original demo turns plus one labeled fixture host-bound turn, readback and negative attacks: closed only if workflow succeeds.
- **HOST_NATIVE_INTERPOSITION**: OPEN, requires a real ChatGPT per-turn hook/provider permission witnessed on a supported host. Code and CI cannot manufacture it.
- **SEMANTIC_ROUTING_C83**: separate issue / new source epoch if modified; unchanged C115 baseline preserved here.
- **GLOBAL_MINIMUM**: NOT PROVEN. Forty-three is the current unchanged C107 package contract, not universal architecture lower bound.
