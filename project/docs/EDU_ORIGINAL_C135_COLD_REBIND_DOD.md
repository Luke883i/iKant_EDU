# OneShell EDU cold recovery — original-owner runtime DoD

## Required AND graph

RECOVERED_OWNER_TURN = VERIFIED_ORIGINAL_EDU_SELECTION + PINNED_SOURCE + PREVIOUS_WORKER_GONE_HOST_WITNESS + ORIGINAL_C87_REOPEN + SOURCE_AND_SELECTION_BOUND + NONCE_HISTORY + EXACT_LAST_COGNITIVE_WINDOW + ORIGINAL_C135_LANGUAGE_PORT + ORIGINAL_C87_SINGLE_APPEND_AND_READBACK + C125_S03_DELIVERY.

The optional `resumeFrom` is passed by `startOneShellEdu` into the original `createC135EduV2Session`. It rebinds to an already restored private `.ikant-host/c107-observations.jsonl`, never emulates a turn, never opens a second writer and never claims native ChatGPT persistent processes. **The fresh owner now writes its original C87 ledger outside the disposable staged package from the first turn**, under a newly created private directory within `privateParent`; `readSessionState().ledger_file` is the Host's actual recovery locator. Closing or unexpectedly losing the staging process does not itself remove that ledger. Removing the private parent, losing the container filesystem, or failing to deliver the ledger bytes still loses this local recovery route. The Host must preserve or export the actual original ledger, not just report its pathname. Original C87 verification is mandatory; the claimed previous-worker termination is **HOST witnessed only**. Reusing a checkpoint concurrently across containers is **not protected** and is forbidden by the experimental operating procedure.

## Challenging test / falsifiers

The first integrated `project-session-e2e` test creates a real EDU turn in the test process, seals the original C87 ledger outside the transient source stage, closes the first owner, then launches a second Node process with the original owner. A **separate unexpected-loss test** starts a fresh original owner in a first Node process, writes the ledger to its default persistent private root, kills that process with SIGKILL without `close()`, reopens the original ledger independently, and resumes the original owner in a second process. It checks that the new owner appends exactly one original event with matched C125/S03 bytes and no duplicate prior nonce. It denies stale hash, missing worker-death witness, nonce replay, invented cognitive context and context reset **before** languagePort. A new valid input must append exactly one event on the same physical ledger with original C125 output. The test proves Node original code on synthetic source-binding; it does not prove a real user message, native provider hook, full installation or cognitive feature coverage in ChatGPT.

## Symbolic, non-human roles

[Regista della sessione] (C135): director of a bounded cognitive performance.
[Notaio degli eventi] (C87): notary of the only append-only event chain.
[Tessitore del contesto] (C107): loom of the last four causally bound prior inputs.
[Voce sotto mandato] (C125): spokesperson for byte-exact original output.
[Porta del consenso] (C72): gate between human assent and a source-defined lifecycle.

## Experimental limitations

Logical ledger continuity is not proof of persistent consciousness, irreversible provider delivery, permanent node storage, independent origin of host consent, native model access, or `CANONICAL ACTIVE`. Recovered context is bounded to original hash-chained input windows. Failed or UNKNOWN output delivery remains STOP/read-only reconciliation; no blind replay. ZIP upload and actual Host languagePort are separate unproven field gates. This PR contains no alternative bootstrap and no new cognitive owner.
