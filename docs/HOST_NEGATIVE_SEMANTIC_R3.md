# R3 (Riflessione 3/3): Host negative semantic rail — physical entrypoint

Engineering baseline: main at 90bad7463146b762e46a1fd4c37d434762e9e95a. Does not repin any live iKant SOURCE_LOCK.

## Architectural proof obligation
The R2 Host denial-only rail preserves 23 generic prohibitions; the R3 specific entry gate adds two pre-effect denials. The actual binding is ONE executable point: host/project-c72-physical-ingress.mjs#runC72SelectedHostIngress. It intercepts after exact acceptance/outcome/carrier selection and BEFORE callbacks, Node HTTPS and original executeC72PostAcceptRecovery. It does not replace the original C72 owner.

IMPORTANT: before physical ingress, *no* physicalIngressReadback, live GitHub HEAD or original C72 receipt can exist. R3 specifically rejects the tempting circular preflight that requires post-effect evidence to authorize the effect. Original source SHA, HEAD and full C72 accepted+introduction remain verified inside the original recovery/owner path.

## Semantic inequalities (non-equivalences)
Node available != Node DNS available != connector-to-Node bridge.
GitHub API available != verified Node-source packet.
DNS failure in same epoch != all carriers failed.
I ACCEPT text != original C72 consent receipt.
PASS_TO_ORIGINAL_CHECK != permission.
CI pass != ChatGPT provider delivery.
C71 host draft != C135 owner voice.
OneShell renderer != native persisted UI.
P0 one-ZIP pre-EDU != P1 manual ZIP post-EDU.

A same-epoch Node DNS failure reported by the Host is denial-only, not independently authenticated evidence. R3 blocks one repeated Node HTTPS attempt, never packet or callback. A verified network change may requalify that *particular* path. Failures are local to action, carrier and epoch.

## Falsification contract
scripts/project-host-negative-falsify.mjs executes exactly 1,000,000 deterministic structural semantic tests with seeds 0x187a3026 and 0x187a3027. The independent positive oracle must report zero disagreements, zero model/provider calls, and an exact byte comparison against artifacts/qualification/negative-semantic-1m.json. 20 metamorphic removals probe essential owner evidence. Neither count is 1m ChatGPT conversations.

CI independently runs original C72 packet/callback/Node adapter, later EDU and P0/P1 one-ZIP tests on Node20 and 22 and a full repository npm test on Node22; the original receipts and full introduction must be unaltered.

## Severe DoD and non-claims
1. R3 pre-effect screen wired into real Host ingress; no C72/C135/C87/C125 owner changed.
2. Reject missing first-turn five SHA witness before transport; reject duplicate/unknown outcomes.
3. Same-epoch DNS denial causes zero callbacks; packet remains able to execute original C72 successfully.
4. P0 pre-EDU and P1 post-EDU positive examples remain possible with original gates; no cross-phase bypass.
5. 1m deterministic structural cases and committed SHA trace reproduce exactly.
6. Named source closure and all Node20/22 targeted workflows green.
7. Full repository test, repository check, runtime-root verify green.
8. Native ChatGPT hook, direct provider delivery, prompt installation, cross-chat persistence and field EDU bootstrap are NOT demonstrated by this PR.

Scope limitation: the existing coldstart seed and one-ZIP coordinator are distinct ingress implementations; this first slice does NOT secretly intercept them, nor C135 turns, C87 writes or native EXIT. Global mandatory enforcement requires a separate original-owner-preserving architecture and host-native field check. The negative rail never creates a transport or repairs C72_SOURCE_BRIDGE_UNBOUND by itself.
