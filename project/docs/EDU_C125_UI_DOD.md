# C125 — Post-123 exclusive HOST shell: runtime, DoD, evidence boundaries

**Baseline:** GitHub main `aff995cd6b15c8f6efa6fd9d9f1895ca64960543` (PR123 merged). Original C107 pinned at `c734bf934e33703a6a1f91f0f4d5df96eec96945`, carrier SHA256 `d17195881d6567524f1cdf358c991be5ff0d68e92aea2ba14273f0ea2cf74c6d`. C124, original C70/C114/C87, original Terms and original kernel are **unchanged**.

## The actual bug
V10 was a **projection returned** from guided PR119 after independent C87 readback, not the one output channel of the HOST application. Actual local C125 V1 pre-PR counterexample: repeated uncertain `send()` sent three times for one logical event; hostile `kind` getter executed through a spread. V2 replaces it with at-most-once per-event tracking before the send attempt, descriptor-only frame validation, denial of concurrency and a terminal single-send facade. No retry after uncertain delivery. Process-local, not durable network exactly-once delivery.

## Real runtime topology
Human-original C72 admission/mode/opt-in -> existing PR118/C107 verified carrier -> existing `createGuidedCohostV7` -> original C70 plan before language, C117 ACK, C114 guard, original C100/C87 -> PR119 reopen -> **second independent Node C87 CLI reopen** -> C125 raw-voice SHA/nonce/input verification -> 1990s fixed shell -> one HOST-controlled `send(fullShell)`. The wrapper calls **one existing owner** and introduces **zero new original C87 writers**. A failed owner emits a single `NO_VOICE` status shell instead, only after human HOST-witnessed acceptance.

## Typed shell
Exactly fixed labels: `VOCE / MODE / STATO / TRACE / CONT / EDGE / NEXT / DOCX / HOST / FATTO / LETTURA / LIMITE`. Original voice raw UTF-8 is a contiguous exact byte region; renderer provides length, offset and SHA256, never paraphrases or truncates. ANSI/Bidi and the explicit frame delimiters are rejected, not rewritten. Errors, progress, blocked, admission and HOST notes all project to the same shell within the **controlled output port**. Notes exceeding the cell limit reject rather than losing semantics. DOCX remains unavailable (`DOCX=—`) without a real source-owned same-turn writer, readback and delivery witness; a fabricated download link is forbidden.

## DoD — layered, falsifiable
| Tier | Acceptance claim | Metric/oracle | State |
|---|---|---|---|
| L0 physical/source | Source SHA pinned, C107 unchanged, no cognitive C124 changes | Git diff owner audit | PREPARED |
| L1 runtime | Original PR119 guided turn and independent C87 reopen, same nonce/input/hash | Node original integration, one C87 append, replay 0 second sends | CI_PENDING |
| L2 typed text | VOCE same UTF-8 bytes; fixed headings; HOST note separated; no forged DOCX | UTF-8 length/offset/hash 100%; 0 false HOST_BOUND | LOCAL_PASS |
| L3 async send | All facade-owned successes/errors/progress use one port, at most one attempt/event | Host send invocation count <=1 even if post-send unknown; Getter traps 0 | LOCAL_PASS |
| L4 platform renderer | ALL native ChatGPT postaccept messages appear only inside shell | Native hook, UI channel audit and client-side byte witness | **OPEN_EXTERNAL** |
| L5 falsification | 10,000,000 typed seeded faults + exact Node integration + CI | 32 families, seed `0x1252026101300001`, separate grouped-negative oracle; zero mismatches | POLICY_PASS; CI_PENDING |

## 10M accounting
Each of 32 classes has 312,500 scenarios; one positive host-only family (312,500 valid), 31 negative families (9,687,500 blocked) with 1,381,735 seeded secondary faults, 0 oracle divergences and 0 fake native promotions. This is a finite fault-policy model, **not 10M LLM requests, C87 events or ChatGPT UI executions**. Owner and UI integration must be tested separately.

## Formal impossibility of blanket Scenario A
An application-level `send` callback cannot intercept other ChatGPT assistant messages, progress surfaces, file actions, sponsored platform items, host tool output, system notifications or client rendering. Nor does an ACK of `send()` prove user-visible delivery. Thus `HOST_CONTROLLED_SINK_EXCLUSIVE` does not logically imply `NATIVE_CHATGPT_UI_EXCLUSIVE`. Full 100% Scenario A requires a supported platform/native renderer or other actual global routing control plus all-channel UI capture. Until attested, `FIRST_EDGE=NATIVE_CHATGPT_OUTPUT_DISPATCH`, `ACTIVE=false`. No Project prompt or 10M offline scenarios can close this external boundary.

## Release checklist
- [x] Frozen Git source reviewed; C124 and C107 unchanged.
- [x] Actual pre-PR V1 getter and uncertain-retry counterexamples reproduced.
- [x] V2 closed both counterexamples in local Node tests (7/7).
- [x] 10M finite campaign, seed and independent oracle recorded.
- [x] Runtime integration module calls PR119 and reopens C87 independently.
- [ ] Original end-to-end CI on PR head passes.
- [ ] Merge by human after green CI, without bypassing gate.
- [ ] Native UI hook and actual all-channel rendering witness — external.
- [ ] Genuine DOCX original generation + readback + delivery — external.

**No C124 changes. No claims of a new voice, sentience, native hooks, or CANONICAL ACTIVE.**
