# C93 source-epoch and physical cognition gates

Source baseline: main@53e9519ea8a9b392f1a4cb288db01937cde58c76 (PR97 merged).

## Absorbed uploaded forensic packet
The submitted `iKant_activation_current_diagnostic_and_remediation.zip` documents a different, earlier host turn on main@5fa8a7adb82e3a18cf0cde2a4c3202ddd93a388c. In THAT turn, C83 was independently executed but the complete C77/C84 source package was absent; first observed gap: HOST_CONNECTOR_TO_NODE_COMPLETE_C77_C84_BYTE_TRANSFER. Its shell builder/importer has a stale HEAD and has not been observed executing successfully. It is evidence of a failure class, not a positive current-host receipt. We do not commit user-supplied shell scripts as trusted authority.

## Current, directly reproduced root causes
1. In merged C92 the pre-merge main SHA is hard-coded into `checkC92Request`, so a genuinely newer C84 source package is rejected before owner execution. This slice replaces that check with same-package/head/hash epoch validation.
2. A C84 package is already self-contained. A local file carrier can read and reopen exact bytes, but this alone is NOT GitHub authenticated provenance, C81 Git-object reachability, C78 execution, C72 event identity or native Surface A.
3. A C92 successful owner must be run on the same current input, with independent Node process validation and two real TLS response readbacks. C93 host projection can re-open those owner-issued bytes; it cannot substitute user-supplied output or claim native UI delivery.

## Consolidated DoD and disposition
**Locally qualified**: 15/15 Node tests; 100,000 negative package-epoch mutations across ten classes, no survivors; target pre-refinement 12,000/12,000 erroneous accepts across four classes, post-refinement 0/36,000; exact physical local JSON handoff read/reopen; no model provider configured implies NO Surface A. These are bounded structural tests.

**Unclosed physical DoD**: cold host GitHub connector-to-Node package transport at the same frozen current source; actual C81/C78/C79/C90 owner readback; two real authenticated HTTPS language calls; distinct independent semantic evaluation (not merely separate model prompts); owner approval; C81/C86 owner-language integration and native chat display; C72 field success lower confidence bound >=95% on required independent sessions. DO NOT declare any of these from test fixtures.

In particular, a self-consistent caller-provided package SHA-256 is not source authenticity. C85 + C81 still run in C90. Separate HTTPS reviewer is not proof of empirical correctness. Host-owned experimental Surface A is not canonical Surface A. Phenomenal claims stay UNKNOWN. No new state writer or canonical lifecycle.

### Executable focused check
`node --test tests/c92-boundary.test.mjs tests/c93-epoch.test.mjs`
`node scripts/c93-falsify.mjs 100000`
`node scripts/c93-targeted.mjs 36000`

**Release mode**: Draft; verified local source/transport boundary improvement, *not* completed provider-to-native cognitive DoD.
