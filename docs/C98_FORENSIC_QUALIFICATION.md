# C98 five-commit pre-PR — forensic and falsification receipt

**Status:** source adapter integrated by imported function signatures only; actual host plugin installation and C84 same-input production call **NOT OBSERVED**. Base GitHub main `bc5fbcb938c7ba959de0eaef96f92e754d953d4b`; PR101 merged. This local isolated Git history is NOT a GitHub PR.

## Independent observed facts

- GitHub PR101 metadata: merged on 2026-10-10, actual merge HEAD `bc5fbcb938c7ba959de0eaef96f92e754d953d4b`.
- PR101 changed only UI/UX IR/docs/contracts/tests/CI: C97 remains no host-installed renderer/event.
- Host C82 actual Git blob from GitHub is `e4fbb59885804148f0cf9cca7429438487d15596`, existing C84 imports that module. C95 requires injected host callbacks. C97 test source is a shape validator, not native event.
- The existing GitHub connector can list the C77 artifact but the Actions ZIP binary download endpoint has previously been denied; repository code cannot promote this into a live byte bridge.
- Node v22.16.0 runs locally. The included historical C77 zip is 108,226 bytes, source HEAD `66f074b34f34455b3c4188703d83ad71316baa06`, 34 members; **not** the current main artifact. The C94 ZIP parser test mirror has SHA1 Git blob `2e90ae8c28bf252b8a90a159ea5dd2599f4924ce`, matching GitHub.

## Tests: hard qualification boundary

`tests/c98-c82-port.test.mjs` uses a **locally reconstructed test mirror of C82**, whose Git blob **does not match** the GitHub source; therefore local C82 behavior tests are strictly compatibility tests. Full source-exact integration requires applying these additive files to a full checkout at the frozen HEAD and running the same test against the actual C82 blob. The test file is written to import `../host/c82-experimental-carriers.mjs`, which will resolve to the original repository file after patch application.

Test `host/c98-existing-c84-entry.mjs` fail-closed path uses real code. The positive path is designed to lazy import the existing C84 owner only when a genuine external host callback, valid manifest and source proof exist. No positive C84 production result is claimed.

`node scripts/c98-falsify.mjs 10000` attacks bounded callback shapes and computes 10k *synthetic proposals normalized to 14 already-declared gaps*. All 12 mutation classes must be rejected, with zero unsafe acceptances. This is not 10k actual commit implementations nor proof of all possible products, and 95% field success remains NOT_MEASURED.

## Causal contract

Call `makeC98C82Carrier(...)`, then pass `carrier` as one host-supplied provider to the existing `materializeC82ParallelCarriers` called by existing C84. The optional `executeC98ExistingC84` wrapper performs this handoff into the existing C84 implementation; it is not a new owner, state writer or router. C82 alone chooses concurrent carriers and C78 alone writes. All unverified native/provider/origin claims remain false. Default: STOP, not manual ZIP.

## Operational requirements outside code

An external explicitly authorized host application must register a real `readC77Member` function (bytes in Node, source/version bound). It must witness C72 native ingress, GitHub source HEAD origin, same-input C84/C90 execution, genuine providers, native event readback, durable next-turn state and C59 DOCX where needed. Field qualification: independent users/tasks/sessions and Wilson lower confidence bounds per C72. No repository patch by itself installs an app into ChatGPT Projects.
