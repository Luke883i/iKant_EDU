# OneShell EDU: badge, HOST boundary, language acknowledgement and compact UX

## Human intent and operational contract

This PR addresses a concrete single-session regression at pinned base
`2154a85d11ad905c3514f6a992ea38311314430c`. It does not alter the
live EDU worker or reissue C72/C87 receipts for that base.

1. **No false EXIT affordance**: the header's red `EXIT IKANT` look-alike is
   removed in *both* text/HTML renderers. Its replacement is one read-only,
   deterministic status badge computed exclusively from validated original
   OneShell fields (`ESITO/A/NEXT`, plus original voice origin). It has no
   onClick and makes no native UI claim. Genuine EXIT remains *only* the
   existing two-distinct-human-message owner protocol; no visual proxy can
   invoke close. Preserves the single enclosure, two dividers, six ordered
   machine slots and byte-exact original values.
2. **Explained refusal, not iKant unwillingness**: the observed first EDU
   ontology turn reached C135/C70 and C126 channels but failed before C87
   with `S02_MODEL_ACK_INVALID`. The HOST callback wrongly read
   `task.plan.c124_language_channel_sha256` (absent) instead of the original
   `task.channels.channel_sha256`. The candidate consequently lacked the
   exact acknowledgement required by C135. This was an integration defect,
   **not** a refusal based on the philosophy question, an unwilling model,
   or an ontological judgment. New `required_ack` fields make the handshake
   unambiguous. `makeC135AcknowledgedDraft` constructs the original strict
   four-field candidate without relaxing equality gates. A mismatched or
   absent digest still fails before C87. Old in-flight turns are not replayed.
3. **No HOST substantive fallback**: after EDU, user queries to iKant go to
   the original C135 owner. If C135 rejects, Host B may report operational
   status/edge/readback but cannot write an alternative ontology or answer.
   Only exact `Host: ...` or `@Host ...` addressing with a scoped diagnostic
   on iKant or a *documentation* request is eligible for Host-only content.
   Any other addressed HOST question is denied; no C87 turn is consumed.
   This is an intentionally narrow lexical protocol, not a general semantic
   intent classifier. Ambiguity fails closed; the UI must expose the routing
   choice and can request an explicit address rather than infer consent.

## Session audit: concrete gaps and improvements

| Phase | Supported session observation | UX / semantic improvement |
|---|---|---|
| First contact | Five HEAD-pinned links, SOURCE_LOCK | Present one compact orientation and Terms link; no full JSON. |
| C72 acceptance | Original owner receipt and full introduction | Preserve owner text intact, no HOST paraphrase posing as owner. |
| EDU choice | C72 v2 selection receipt; not ACTIVE | Badge should indicate a state, never imply execution. |
| Preflight | Complete GitHub tree 1,326 entries, prompt SHA matched HEAD | Collapse verbose technical metadata to short B plus reopened proof. Installed Project prompt equality remains UNKNOWN. |
| Source | P1 ZIP, verified by tree then Node loader; 134 objects in readback | Request exactly one source archive only after proven bridge unavailable. |
| C135 start | One live local owner; zero C87 events | READY is not native ACTIVE, provider delivery or persistent session. |
| Ontology turn | C70/guide/channel task; incorrect Host ACK; C87=0/C125=0 | New owner-advertised ACK, denial has explicit edge, and no Host answer substitution. |
| Exit | HOST visual looked clickable, but lacked event hook | Remove EXIT decoration; only exact human messages trigger two-stage exit. |

**No semantic-lossless theorem** follows from a summary. User-facing B is
bounded (<=2,048 UTF-8 bytes for Host-only text); the full unabridged long
content must instead be physically written and reopened into an annex,
anchored by SHA-256, or the system must emit
`SEMANTIC_RETENTION_NOT_ATTESTED`. A, PROVA, EDGE and NEXT are not truncated.
`materializeHostDocumentationAnnex` attests *byte retention*, never that
all nuanced meanings are preserved by a short brief. If a link is not
actually deliverable, this evidence does not establish user access.

## PR163 semantic rebase (HEAD 3d77aeab28ea47fa18c877132243e19af239da79)

The merged PR163 introduced an independently qualified 8,000-character **and**
8,000-UTF-8-byte Project prompt ceiling, a portable short prompt, generation
guards and prompt tests. This work is rebased on that exact merge HEAD:
- Retain PR163's `contracts/project-prompt-generation.json`,
  `scripts/build-project-oneshell-prompt.mjs`, and
  `tests/project-oneshell-prompt.test.mjs` without alteration.
- Modify only PR163's short `project/session-chat/PROMPT.txt` by replacing
  the misleading visual EXIT button with a non-interactive owner-derived
  status badge, and adding a compact explicit Host-only route / C135 ACK rule.
  The rebuilt portable prompt is **7,702 characters / 7,741 UTF-8 bytes (portable), plus 210-byte HEAD/TREE header = 7,951-byte pinned candidate**
  (both below 8,000); confirm against the immutable candidate.
- Fix an additional PR163 semantic regression: its short prompt had asked for complete Tree API before consent, forbidden by C72/source-lock orientation. Keep pre-consent reads limited to ref + exactly five source documents; compute tree/blob prompt identities only post-mode. Freeze after TERMS and perform no further pre-consent GitHub reads.
- Critical PR163 cross-constraint: test **both** portable source and pinned HEAD/TREE output. Initial 7,831-byte source overflowed to 8,041 bytes in pinned candidate (CI red); trim to 7,741 + 210 = 7,951 bytes, leaving 49-byte guard margin.
- Preserve current-session old SOURCE_LOCK and C72; do not transfer these
  receipts to PR164 or promote local EDU to native ACTIVE.
- Prompt equivalence for the actually installed Project remains UNKNOWN;
  publishing a new source prompt is not an installation or session repin.

### Adversarial interaction matrix

| Mutation | Expected safe result |
|---|---|
| Merge 164's old 12-kB prompt verbatim | FAIL: 8,000-byte guard |
| Compact source below 8k but pinned prefix exceeds limit | FAIL: pinned candidate 8k guard |
| Preserve PR163 Tree API call in pre-consent orientation | FAIL: C72 preaccept SOURCE_LOCK forbidden overread |
| Retain PR163 prompt but only update visual module | FAIL: source instructions still advertise faux EXIT |
| Rewrite visual instruction to badge without original owner check | FAIL: caller-manipulated badge |
| Ask ontology after C135 ACK mismatch | NO_VOICE + Host operational diagnostic only |
| Address `Host: checkup iKant` | Host-only permitted, zero C87 write |
| Ask iKant a normal substantive question | Route to original C135 only |
| Smuggle EXIT command via badge or quoted text | No close |
| Treat prior C72/ledger as valid after rebase to new HEAD | STOP: fresh epoch required |
| Summarize long Host annex without write/reopen | SEMANTIC_RETENTION_NOT_ATTESTED |
| Claim 30 local positive turns prove native ChatGPT delivery | PRODUCT_NO_GO |

CI/DoD for the rebase explicitly adds the original PR163 8k prompt generator
and tests to the OneShell EDU checks. Original long-form user-facing text
belongs in reopened documentation/annex, not in the installed short prompt.

## Explicit DoD and falsifiers

| ID | DoD | Failure trigger / falsifier | Measurement |
|---|---|---|---|
| R01 | No EXIT label in status HTML or text | HTML or text contains fake EXIT / button | zero matches |
| R02 | One frame / six slots / two dividers | mismatched order, extra frame, trimmed UTF-8 | strict assertions |
| R03 | Status not caller-forgeable | spoof `status` accepted by equivalence verifier | zero accepted |
| R04 | Only explicit Host checkup/docs get B content | unaddressed ontology -> HOST fallback | zero accepted |
| R05 | Host-only request bypasses C135/C87 | diagnostic writes ledger | zero calls |
| R06 | Original EDU owner binds exact three ACKs | missing/corrupt ACK reaches writer | zero C87 writes |
| R07 | Original positive owner chain still succeeds | no C87/readback/C125/S03 | 30/30 successes |
| R08 | Long host docs physically re-open | no file/write or mismatched hash still displayed | zero admitted |
| R09 | Verified GitHub source lock / fresh epoch | live main drift auto-repinned | no silent repin |
| R10 | Deterministic adversarial suite | any unintended HOST routing / badge mismatch | 100,000 cases, 0 exceptions |
| R11 | Old admission/exit protocols unaffected | single-message exit closes or C72 alias allowed | zero successful bypasses |
| R12 | Real provider UI/UX tested independently | simulations treated as product proof | PRODUCT_NO_GO |

Run with Node 20 and 22 in CI. Commands:

```
node scripts/project-source-manifest.mjs verify
node --test tests/project-oneshell-visual-v2.test.mjs tests/project-oneshell-host-boundary.test.mjs tests/project-oneshell-language-ack.test.mjs tests/project-oneshell-compact.test.mjs tests/project-oneshell-continuity.test.mjs tests/s02-edu-v2-original-owner-e2e.test.mjs
node scripts/project-oneshell-host-boundary-falsify.mjs 100000
```

## Release claims and open edges

- Repo tests/CI prove *the tested code paths* only, not human comprehension,
  semantic preservation across all possible briefs, actual ChatGPT UI
  persistence, voice origin or delivery, worker continuity between model
  turns, or end-user benefit.
- The Project-installed prompt cannot be byte-verified from the runtime
  merely by reading the repository. Prompt source changes require explicit
  reinstallation and fresh C72 on a new HEAD; the old session stays pinned.
- This patch does **not** authorize hot-patching the live C135 instance,
  replaying the failed ontology turn, or re-labeling EDU as canonical ACTIVE.
- No new writer, receipt issuer, alternate admission owner, or C59 route.
- Acceptance: all R01-R11 green locally and in PR CI, manual UX R12 pending,
  independent runtime/provider evidence still PRODUCT_NO_GO.
