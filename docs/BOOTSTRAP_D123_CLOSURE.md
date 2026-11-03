# D1-D3 bootstrap closure: source transport only

> HOST_ENGINEERING candidate / authority=0. Pinned engineering parent is main 4145d932fb291872aafe19dcd72298d16c2785c6, merged D0 PR #208. No new owner, consent, source epoch, native provider, C87 writer, C125 send or runtime installation.

## Three original-preserving APIs

D1: storeBootstrapCache / reopenBootstrapCache, with 0700 root, 0600 exclusive wx+fsync records, exact source HEAD/TREE/path/Git-SHA1 binding, independent readback. Corrupted entries are STOP, never overwritten or silently repaired. A cache hit verifies local bytes but does not authenticate GitHub origin. Moving main still blocks the old source epoch.

D2: reconcileC72Original reads original ACCEPT/EDU transit and attempt files and calls ONLY the original transit validators, using a direct module import. It never issues an owner event or receipt. Attempt without receipt is terminal RECONCILE_NO_REPLAY; unknown writes are never retried. A distinct Node process can reopen original receipts without manufacturing a new acceptance.

D3: materializeD123WithOriginalLoader requires the pinned complete Git TREE, exact manifest and all 190 ordered entries. It reuses validated cache bytes, fetches only source misses plus the separately required manifest, preflights HEAD and all 191 objects, and invokes the ORIGINAL repository plan verifier, original materializer and independent original readback. No shadow source receipt is generated. Uncertain writes preserve their partial stage; never replay a materializer blindly.

## Severe DoD

| ID | Acceptance | Evidence required |
|---|---|---|
| D1.01 | cache preflight rejects stale HEAD/TREE, wrong path/hash | Node negative tests |
| D1.02 | immutable 0600 files in 0700 directory, no overwrites | filesystem readback and symlink/mode tests |
| D1.03 | 256 independent corruptions rejected | physically altered files |
| D1.04 | same-epoch cache hit transfers zero new bytes | repeat readback; not a provider claim |
| D2.01 | original C72 receipt validator directly imported, not reimplemented | source audit and original module tests |
| D2.02 | attempt fence and source HEAD fail closed before every progression | negative cases |
| D2.03 | genuine original fixture ACCEPT/EDU receipts reopened across Node processes, with no owner replay | two child processes |
| D2.04 | no new owner, writer, nonce or receipt in helper | source/code audit |
| D3.01 | 190 manifest paths plus 1 manifest file, complete Git TREE | original loader end-to-end |
| D3.02 | 10 C72 objects reused; 181 fetched including manifest | measured local callback counters |
| D3.03 | 144,557 raw bytes saved conditionally, full 191-object source readback | original loader checks |
| D3.04 | forged blobs, corrupt manifest, changed HEAD or preexisting destination never accepted | negative tests |
| REG.01 | original BOOTSTRAP/prompt/C72/C135/C87/C125/S03/loader/manifest unchanged | Git diff |
| REG.02 | existing original C72 and EDU qualification remain green on Node 20/22 | CI |
| REG.03 | two independent V5-G engineering reviews and human decision | external review, not CI |
| PROD.01 | real carrier p95 and reduction in human recovery gestures | field measurement, NOT ATTESTED |

The **post-D0 merged main** has 10 C72 files / 144,557 bytes (D0's older snapshot had 143,817 bytes). The EDU manifest contains 190 files / 1,985,269 bytes, but the original loader needs a 191st file (the manifest itself, 7,639 bytes in this source pin). In the ideal same-source ten-hit scenario, the Host fetches 180 other manifest files plus the manifest. The 144,557-byte saving is a **snapshot-specific observation**, not a code constant: the tests now derive all byte budgets from the actual Git TREE. This does not remove any integrity obligation. Original C72 acceptance still requires its 10-file path.

## Mutations and evidence

New tests execute 4,096 deterministic negative source/path/epoch inputs and 256 physical cache corruptions, with fixture positives. Real original C72 transit and original source loader tests execute in a full Git checkout; standalone local tests explicitly skip those two checks. Fixture owner calls are NOT native human ingress. Git SHA-1 equality is not a native provider provenance receipt.

## Recovery for the user (avoid making them troubleshoot code)

On CACHE_MISS, Host fetches and validates pinned bytes without asking the user. On cache corruption or source mismatch, Host stops the dependent effect without overwrite. On C72 attempt with unknown outcome, Host reconciles originals read-only; the user MUST NOT repeat I ACCEPT. On stale HEAD, preserve the locked epoch; new orientation in a new chat only if the original policy still requires it. On original source-loader uncertain write, preserve partial local files, do not replay. On missing real languagePort/C135/C87, say NO_VOICE; cache does not establish ACTIVE.

## Non-break / release boundary

New module is additive, opt-in, and unreferenced by existing runtime; original E16, staging, transit, source loader and fallback remain unchanged. The new tests join normal npm test. This is software API closure, NOT product deployment. Prior local no-network p95 was about 207 ms warm against about 163 ms cold; fewer bytes did not imply lower latency. Performance must be validated on a real carrier, and V5-G independent review remains required before merge.
