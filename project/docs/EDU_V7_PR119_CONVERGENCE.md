# iKant EDU v7: reciprocal controlled absorption of v6 and merged PR119

## Exact baseline and source epochs
- **Merged main HEAD** at engineering freeze: `63f6869fbeef2096b3bb95164462fd09a03973a3`.
- **Git tree** exactly reconstructed and independently witnessed: `0f8c3a300a641dd54acc2801563d8eb9ab1a1ef3`.
- The locally made Git commit with this tree is a **synthetic packaging commit**, not GitHub's merged commit.
- Original C107 source remains `c734bf934e33703a6a1f91f0f4d5df96eec96945`; do not silently repin its source SHA when main moves.
- Single transport remains PR118's `62,448`-byte Brotli payload, no second runtime/carrier.

## Overlap / absorption decisions

| Session issue | PR119 owns | v6 contributed | v7 disposition | Evidence required |
|---|---|---|---|---|
| P01 source/stage | PR118 consumer via PR119 | C118 duplicate stage path | **ABSORB PR119**; retire direct C118 entry | original SHA/frame/43 members |
| P02 original execution | `edu-cohost-outcome.runTurn` / C107 | v6 exact-stage Node | **ABSORB PR119**; invoke only one C107 owner | same input & nonce, C87 independent reopen |
| C70 before language | Original C107 preview available | C117 semantic guide/ACK | **PORT v6 TO PR119** as optional preflight | original C70 digest and input binding |
| Guarded drafts | Original C114 | v6 `requireHostLanguage` safeguard | **NEW PREGUARD**: v7 calls original C114 before PR119, preventing ORIGINAL_DEMO fallback append | NO_VOICE + 0 ledger writes |
| P03 user-facing identity | PR119 verified A/B | C116 model-agnostic disclosure | **MERGE CLAIMS**: iKant first, HOST_BOUND only on verified byte readback | unchanged visible UTF-8, proper HOST origin |
| P04 retry | PR119 recovery | v6 reducer | **USE PR119**; no second retry memory | max 1 + 2, changed evidence |
| hostile JS frames | PR119 proxy/getter shield | v6 own check | **PRECHECK ONLY** before language port; PR119 original remains owner | no getter executions, no writer |
| C87 continuity | PR119 local ledger | v6 independently reopened | **ADD READONLY INDEPENDENT RECHECK**; no second writer | matching chain SHA/nonce/C70/output |
| project prompt & shell | PR119 outcome-only delta v9 | v6 model-agnostic shell | **DERIVE v7 DELTA**; never invent automatic hook | mode/status/scope/first edge |
| actual host/model semantic A/B | EXTERNAL | fixture-only v6 | **OPEN** | randomized actual-model A/B with independent oracle |
| native ChatGPT interposition | EXTERNAL | missing in v6 | **OPEN** | native per-turn ingress/delivery witness |
| human consent provenance | unchanged original C72 + Terms | explicitly nonnative v6 | **NO PROMOTION** | authenticated native record needed for stronger claims |
| cross-chat memory & permanence | EXTERNAL | local C87 readback | **NO PROMOTION** | host retention/identity proof |

## Material falsification find: PR119's guarded fallback
The original `C107.executeC107Turn` called without `requireHostLanguage:true` can store an `ORIGINAL_DEMO` when a guarded host draft is declined. PR119's `runTurn()` then returns this demonstration. The v7 caller had intended a HOST_BOUND turn; if it merely hid the original demonstration, the C87 ledger would already have been appended. This was **observed locally** on an identity prompt in the first test run. v7 now invokes **original C114** on guarded drafts before calling PR119, blocking before C87 append; original C107 also rechecks its rules. No second guard owner is created.

## Release and naming rules
`iKant è il metodo. Il modello host è la voce.` A truthful positive first-person claim requires the same-turn C70 preview, source-bound C72 selection, separated host-draft consent, exact ACK, PR119 HOST_BOUND receipt and a separately reopened C87 state. It does **not** mean personhood, independent author, general truth validation or an authenticated provider.

Always publish Surface A from `result.surface_a.voice_utf8` unchanged and never synthesize it from a wrapper label. Compress only host Surface B; keep the full PR119 surface available as `pr119_surface_b`. No positive label on denials. No model-version constant. A plan ACK is protocol evidence, not proof of model comprehension.

## Scope and DoD
v7 adds only a narrow **host orchestration extension**, the C117 projection code brought from v6, tests, semantic falsifier, documentation, contract and host Project text. Original PR119's eight paths are unmodified. Original C59, C72 Terms, C70, C100, C114 and C87 remain unmodified; the PR118 carrier is byte-identical. An app able to invoke this bridge may release a local `HOST_BOUND` sample; ordinary ChatGPT Projects do not thereby gain a native per-message callback.

**DoD evidence:** `node --test` on current merged-main tree + v7 paths; 1,000 unique input C70 metamorphs with seed and explicit oracle; clean patch reapplication; no writer on denials, two-turn window continuity and independent C87 readback. Original PR119 gate million is inherited/independent, not misreported as newly executed unless run.
