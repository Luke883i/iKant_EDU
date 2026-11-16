# K1 integrated original-source port — single-slice delivery

**Authority=0. Source-code/checkout integration is NOT a ChatGPT provider tool installation.**

This slice builds on merged PR #194 / K0 and does not introduce new C72, E16, C87, C135 or C125 owners. It preserves R1–R5 evidence, the seven-slice plan, SOURCE_LOCK epochs, and the no-replay rule.

## WHAT is mechanically enforced

1. K0's real exported \`decideK0Effect\` is called before any physical effect, with a distinct exact \`I ACCEPT\`, pinned SOURCE_HEAD, a five-file first-turn witness, and \`ownerOutcome=NOT_INVOKED\`. No model-generated OBSERVED flag, runbook, or digest qualifies as a probe.
2. K1 currently supports **one** positive physical carrier: \`SAME_NODE_CALLBACKS\`. The other enumerated HOWs return typed UNBOUND, not false ABSENCE. This is a deliberate finite release profile.
3. A randomized 32-byte challenge is written with exclusive flags, fsync and restricted permissions, then independently reopened by a *different Node process* in the same machine. This proves a local carrier, not the identity of a provider connector.
4. Original H1 \`prepareH1OriginalSources\` consumes real callback results. It verifies HEAD→commit→TREE→path SHA→exact 10 blobs (8 C72, E16 transit and cold seed); validates the original BOOTSTRAP transit pin; and atomically stages the original eight+transit in a private directory.
5. K1 independently compares ten installed original-owner-adjacent files to the commit TREE. The installed original seed is SHA-1 matched, and a second Node subprocess reopens all 9 staged files and the installed seed. No C72 original owner is invoked from K1, and no acceptance receipt is manufactured.
6. The result kind \`LOCAL_SOURCE_PREPARED\` explicitly holds D/T/P/G **unattested** even when the local readback is positive. The staging dirs remain available for independent inspection, not automatically eligible for original owner invocation.

## Engineer checkout reproduction, not provider field proof

The Node 20 and 22 CI job reads **actual Git objects** from the pinned PR base commit, rather than synthetic document fixtures. Its callback implementation uses Git's object database to prove all 10 original object IDs and performs a true subprocess readback. CI source provenance is Git checkout scope only. The local test's witness represents a synthetic acceptance event and MUST NOT be exported, reused or mistaken for a real human event.

The tested Git commit may be a checkout base instead of the current live \`main\`; no field SOURCE_LOCK is repinned or certified by CI.

## External deployment blockers which no repository PR can install

- A provider-registered, independently identifiable tool that is callable from *this ChatGPT conversation*.
- Authenticated GitHub API data delivered to that same tool and target, with independent observer readback, not a model-asserted JSON identity.
- Original first-human-turn witness retention and distinct event identity across turns.
- Separate readback of the actually installed Project instructions (K0.08). Text in Git \`PROMPT.txt\` is not an installed prompt.
- Original C72 invocation/receipt only after a genuinely new valid consent event; K1 cannot create that event.

**K1 FULL DoD** requires both R/S and external D independently proven. A Node/GitHub CI run only proves source/software and MUST return \`K1.D=UNKNOWN\`. The downstream K2/C72 gate remains STOP until D is observed. No new PR may be represented as product GO based only on the tests.

## Original owner semantics and release hygiene

Original H1/E16/source seed paths are not changed. No cleanup, delete, repin, mode selection or prompt regeneration is permitted by this engineering test. Workflow + tests are tied to the exact PR head. Post-merge K0.08 remains separately conditioned on an explicit Host request and independent installed readback. The only truthful field output before such proof is \`NO_VOICE\` and a typed first edge.

## Acceptance checklist

- [ ] Exact source of the original 10 files and original cold seed verified against pinned HEAD/TREE.
- [ ] Physical Node readback 9/9 plus independent process and installed closure.
- [ ] K0 gate physically called and replay/stale/phase negatives tested.
- [ ] All relevant tests and GitHub workflows green on exact PR HEAD, reviewed by a qualified human.
- [ ] Real ChatGPT tool installation ID and invocation physically verified (separate field evidence).
- [ ] Authenticated GitHub connector→target transfer and independent challenge readback (field).
- [ ] Installed prompt equivalence verified after merge, not inferred from source.

## Explicit local installation (K1 software closure)

`node scripts/project-host-k1-install-cli.mjs --repo "$PWD" --head "$(git rev-parse HEAD)" --target "$NEW_PRIVATE_ABSOLUTE_PATH"` performs a Git-object-pinned local installation of twelve original/adapter dependency files. It prevalidates every blob, writes exclusively with fsync and independently reopens SHA-1 identities. The installer produces `K1_PRIVATE_NODE_INSTALLATION_ONLY` and never a native ChatGPT tool or issuer. The target must not already exist; any unknown write is terminal without blind retry. The Node 20/22 CI additionally executes this installer and imports the installed K1 module.
