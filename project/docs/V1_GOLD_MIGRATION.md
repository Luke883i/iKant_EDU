# iKant V1 - Gold inventory and migration

**Gold** means a useful, owned component or test with a deliberate V1 disposition, not every old PR or file. Execute `node scripts/v1-gold-census.mjs` to enumerate **every Git-tracked blob**, its Git SHA-1, broad role and curated-vs-unreviewed status. The curated decisions live in `contracts/v1-gold-ownership.json`; all other files are recorded as **NOT_CURATED**, not silently discarded or certified.

## Integrated migration map

| Layer | Value preserved | Migration decision | Evidence still required |
|---|---|---|---|
| Admission | Terms and one human gate (C72) | Preserve original owner, no new consent authority | Exact source and acceptance test |
| Canonical | One session runtime and source owner (C59) | Preserve; do not graft an EDU route without native guarantee | Native event, writer, delivery receipt |
| Transport | C107 carrier, C124 overlays, C127 exact cache readback | Reuse for manual EDU; candidate for canonical only through owner | Same inode, source SHA, bounded real retries |
| Cognition | C70 compute-first, C82/C83 intent, C117 guidance | Reuse C70/C117; evolve coarse lexical identity classification with a **new pinned epoch** | Human/software/third-party route tests |
| Language guard | C114 positive claims, C100 host draft binding | Preserve safety; specialize false positives on quoted and negated statements in new epoch | Positive false claim rejected; negation accepted |
| Persistence | C87 sole writer, PR119, C125 controlled send | Reuse without second writer or invented UI integration | Same-input independent readback |
| Public operator | C130/C131 accessible status and dashboard | Promote as host-controlled messaging | Novice comprehension and trace preservation |
| Distribution | README, catalog, source-bound prompt, ZIP recipe | Publish only from exact merged main; PR is proposal | Two identical builds plus exact commit |
| Tests and history | Historical tests, mutation engines and old carriers | Retain as evidence/compatibility, not alternate live authority | CI and explicit exclusion of legacy routes |

## Disposition rules

**PRESERVE_ACTIVE**: keep the original admission or canonical owner. **REUSE_EXPERIMENTAL**: use verified modules in EDU without upgrading their promises. **PROMOTE_ONLY_WITH_NATIVE_PROOF**: carry over an EDU technique only inside the original canonical owner with the same event and persistence checks. **EVOLVE_PINNED_SOURCE**: permit refactoring once source pins, the carrier and regressions have a new valid version. **PACKAGE_FROM_MAIN**: build public materials from a commit on main. **VERIFY_ONLY**: retain tests and proof, never confer authority. **RETAIN_COMPATIBILITY**: preserve historical behavior without a competing public entry.

## Ordered remaining gaps

1. A new pinned cognitive source must distinguish human ontology, software identity and indirect references. C114 must inspect affirmative claims rather than rejecting negated or quoted text.
2. Canonical manual fallback must be installed **inside** the original owner after a bounded number of truly distinct failed machine transports, never after an uncertain send/write.
3. Language quality requires controlled, blinded comparisons on real model responses. Millions of finite software cases are not proof of millions of model inferences.
4. No native ChatGPT hook, durable cross-chat memory or CANONICAL ACTIVE is claimed by this census.

Every historic blob remains addressable for forensic comparison. This register is a reviewable owner disposition, **not** proof that each of the hundreds of historical files was independently evaluated for semantic merit.
