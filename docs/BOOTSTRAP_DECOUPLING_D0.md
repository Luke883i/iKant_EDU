# iKant EDU — Non-breaking bootstrap decoupling blueprint (D0)

> HOST_ENGINEERING CANDIDATE · authority=0 · NOT INSTALLED · NOT ACTIVE · NOT A SECOND SOURCE OF TRUTH.
>
> Engineering snapshot: commit `f5f42603294084d29cdb6d6e2106c0331d802536`, TREE `00df0f3af4d4e4c7128f6443e304fc19ea54c943`. Measurements below apply to that commit only. This document does **not** alter `BOOTSTRAP.json`, canonical `project/session-chat/PROMPT.txt`, original owners C72/C135/C87/C125/S03, or source-epoch rules.

## Measured baseline, not guessed minimum

| Boundary | Files | Raw bytes | Original boundary |
| --- | ---: | ---: | --- |
| First-turn orientation | 5 | 107,796 | `BOOTSTRAP.orientation_capsule.paths` |
| Cold C72 files | 8 | 124,891 | `C72_COLDSTART_FILES` = H1_FILES = stager NAMES |
| Transit + cold seed | 2 | 18,926 | E15/E16 original transport and self-verification |
| Combined C72 | **10** | **143,817** | 8/8 stage, 9/9 with transit, 10/10 identity |
| Project EDU source manifest | **190** | **1,984,502** | `contracts/project-session-source.json#paths` |
| Legacy runtime-root | 51 | 550,210 source bytes | Distinct legacy profile, not automatically added to Project EDU |

All ten C72 objects reappear in the 190-object Project source manifest: **same-epoch deduplication is a concrete target**, but no deduplication has been implemented here. The hypothetical six-object owner-related set (Terms, C72/v2 contract, C72 owner, postaccept reentry, original transit, cold seed) totals **38,937 bytes**. This is NOT presently an executable source set: the original reentry checks *all five* orientation document bodies. A computed subset or hash must never replace that original gate by Host assertion.

## Dependency / improper-coupling map

1. **Consent / distribution:** postaccept acceptance waits for full source transport; slow file carriers can exhaust the interactive turn even though only Terms is hashed into the linked offer.
2. **Identity / full bodies:** five pinned SHA-1 paths prove source identity only if backed by real Git observations; they are not by themselves a replacement for C72's original full-document validation.
3. **Pinned commit / moving main:** `live HEAD == first-turn pin` is required before the owner and on subsequent turns. A moving branch blocks immutable pinned source. Retain the fail-closed rule until a separately approved original epoch contract exists.
4. **Receipt / worker lifetime:** C72 ACCEPT and EDU are distinct turns; exclusive private `wx` receipts and attempt fences must survive process death. A chat summary is not storage.
5. **Distribution / runtime execution:** 190-path Project closure includes docs, alternatives, policy, legacy components and branding. Static JS imports alone cannot prove the minimal C135 closure, because there are dynamic imports, file reads and alternate guarded paths.
6. **Transport / truth:** GitHub API, callback, argument relay, local files and ZIP are transport paths. SHA proves byte consistency; provider authenticity and native delivery need separate evidence.
7. **Runtime / Host language bridge:** even complete source cannot fabricate an interactive Node languagePort, provider callbacks or ACKs.
8. **C87 / C125 / UI:** one original ledger writer and same-turn C125/S03 are separate from OneShell rendering and native UI/persistence; UI fallback may not forge voice.
9. **Prompt / installation:** a valid repository prompt is not evidence of equivalence to the installed ChatGPT Project prompt.
10. **User / recovery:** asking a user to send repeated `procedi`, provide Node commands or choose arbitrary carrier is a design defect when the Host can actually execute the next pre-effect step.

## Min-cut objective and constraint

For gate `g`, a carrier `c` is eligible only when all original path/HEAD/TREE/blob obligations, original attempt fence, local independent readback and original owner receipt are satisfied. Optimize lexicographically: **zero avoidable human gestures → fewer tool calls → fewer newly transferred bytes → lower measured p95**. Security and original owner constraints are hard invariants, never weighted penalties.

Three *distinct* quantities must not be conflated:
- **Current source-required C72:** 10 objects / 143,817 bytes; baseline immutable.
- **Warm cache:** potentially 0 newly transmitted bytes **only if** all ten exact original objects are already locally present, reopened and source-bound. No original file obligation disappears.
- **Lean semantic kernel:** six objects / 38,937 bytes **hypothetical**. Requires independent original-owner contract change, rather than source omission by Host. NO_GO now.
Post-EDU full manifest 190 / 1,984,502 bytes remains mandatory in the current loader. Instrument and test actual C135 dynamic imports/file-reads before proposing any new smaller validated manifest.

## Strict sequential rollout (separate PRs, never silently activate)

**D0 (this draft):** add *read-only* source-derived BOM auditor, regression fixtures, and this explanatory contract-neutral design. No runtime effects. Verify current BOM and negative mutation gates.

**D1 (future):** content-addressed private warm cache (0700 dir, 0600 objects; immutable commit + TREE + path + sha; independent reopen); opt-in carrier chosen only pre-owner. Preserve complete existing E16 path. Cache corruption/partial bytes/stale HEAD/symlinks -> STOP dependent effect, not fallback after ambiguous write.

**D2:** original C72 acceptance/mode receipt transit across separate processes at stable private root; attempt fence and no nonce reset. Read-only reconcile for UNKNOWN; never owner replay or synthetic receipts.

**D3:** deduplicate C72 objects reused by Project EDU; transport pinned full source once via observed automatic carrier or already-admitted official ZIP, always verify Git TREE and every required local file. No mandatory manual handoff when an automatic path works.

**D4:** derive actual C135/C87/C125/S03 executable closure from instrumented dynamic imports and file accesses. Test all identity/policy routes C114/C139/C140/C141/C142/C143, missing-file mutants, checkpoints, no duplicate writer/send. Retain 190-path fallback until independently green.

**D5:** explicit *original constitutional* proposal to separate immutable commit availability from mutable `main` freshness; requires new source-epoch contract, anti-replay proof, fresh original admission as applicable, two independent engineers + human decision. **No HOST repin or old consent transfer.**

**D6:** deterministic and plain-language user recovery per first real EDGE; no technical user instructions when automated Host recovery is possible. UI fallback never blocks originally validated cognition.

## Dummy-user recovery: only the necessary action

| EDGE observed | Host next | User-facing instruction |
| --- | --- | --- |
| GitHub source tool unbound at orientation | Probe accessible GitHub source | Only when genuinely unbound: "Collega GitHub in Impostazioni → Plugin e apri una nuova chat iKant." |
| Node DNS `EAI_AGAIN` | Probe tool-argument-to-private-Node, don't misclassify all carriers | **No user action** when another carrier exists |
| Partial 8/8 preowner | Reopen existing staging; transfer only missing verified original bytes | **No user action** |
| Live HEAD drift | Stop original epoch, preserve evidence; no repin | "Apri una nuova chat iKant e scrivi `iniziamo`" only if current original policy still requires it |
| Owner/write/send UNKNOWN | Read-only original receipt/ledger/ACK reconcile, no replay | "Non ripetere I ACCEPT: è un problema tecnico" |
| All authorized automatic carriers exhausted under original gate | Offer exact official pinned ZIP, verified separately against commit/TREE | One verified upload instruction, no guessed ZIP, no repeated consent |
| Post-EDU source absent | Cache or original loader; P1 manual only if genuinely needed | Upload the one official pinned ZIP, not a new EDU event |
| Language port absent | Probe real Host binding; refuse fake model ACK | **No user action**, unless a real installable service is independently established |
| C135 worker lost | Reopen original C87 checkpoint and original lease/fence | No extra consent |
| Provider renderer absent | Honest six-slot text fallback, original owner voice or NO_VOICE | No user action |

## Falsification and DoD

The added auditor (i) parses original C72/H1/stager literal lists; (ii) requires identical order; (iii) checks five orientation paths; (iv) validates transit Git blob against pinned BOOTSTRAP; (v) requires every current Project manifest file to exist; (vi) measures local raw bytes; (vii) never writes files or invokes an owner. Test fixture includes missing-file, list divergence, duplicate manifest entry, symlink and 256 **executed** byte corruptions of transit.

Future PR anti-regression must additionally challenge: stale HEAD, path swaps, commit/TREE mismatch, untrusted carrier/partial cache, unknown owner outcome, duplicate mode, missing/double C87 write, repeated C125 send, dropped language ACK, mismatched C87 checkpoint, legacy profile confusion, invalid ZIP and provider UI simulation. The dependent effect must be zero for each denied mutation.

Evidence ladder: **GIT** (HEAD/TREE/path/blob) → **LOCAL** (private file/readback) → **OWNER** (original C72/C135/C87/C125/S03 receipts) → **PROVIDER** (native ingress/send/continuity) → **USER VALUE** (external holdout). Neither a fixture green run nor CI jumps a level. Claimed p95 under 15 seconds for warm-cache C72 is a **future measurement target**, not observed.

**Merge gate:** V5-G, two independent engineer reviews (security/anti-replay and runtime/product) plus explicit human decision. This D0 PR is intentionally draft and can never be treated as source of original authority or permission to alter SOURCE_LOCK.
