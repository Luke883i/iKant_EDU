# C81 — Git-object source reachability on current main

## Baseline and reason for renumbering
PR #89 merged C80 Host Witness & H95 into main. C81 is **not** a duplicate of C80 signed host field outcomes. This slice closes a narrower, measurable *repository byte reachability* gap: from a pinned `SOURCE_HEAD` commit's raw Git object identity to every original source blob in the derived C77 capsule. Baseline examined: `ca120d69d4078aa275e191864cd1a286d174dae6`.

## Execution contract
1. In real initial bootstrap, the host resolves `main` and obtains Terms through its allowed five GitHub paths before consent. C81 is **never** called pre-consent; the existing exact `I ACCEPT` and subsequent `EXPERIMENTAL` gates remain unchanged.
2. An authorized post-consent Git checkout produces a C77 bundle and a separate C81 proof of original commit and raw subtree object bytes. The C81 helper does not fetch the Internet or assume shared GitHub DNS.
3. `scripts/c81-create-git-proof.mjs` reads real `git cat-file commit` and `git cat-file tree` buffers from the pinned checkout, returns a JSON object with base64-encoded raw Git objects, the entire C77 manifest, a commit SHA and a manifest SHA256. Its own calls are qualified as *local Git object access*, **not** a GitHub API native source receipt.
4. `host/c81-git-source-reachability.mjs` calculates the actual Git SHA-1 `commit` / `tree` object hashes, recursively parses tree entries, rejects duplicate/unlisted/unsafe paths, verifies each original C77 source path and blob SHA, and rejects unused tree proofs. Paths belonging only to derived build artifacts never masquerade as Git blobs. Every original C77 entry is checked.
5. `scripts/c81-verify-source-proof.mjs` accepts a single bounded JSON envelope, emits `C81_GIT_REACHABILITY_VERIFIED` only when the entire anchored graph matches the expected commit and C77 manifest, otherwise `C81_STOP` with first error.
6. **Trust limit:** Git object reachability is integrity only. A caller who invents a complete commit+tree+manifest and supplies a matching arbitrary SHA could pass. A **real host** must independently freeze the GitHub API ref and compare the raw bytes/manifest received through its actual carrier. This module **never** sets source-origin, native-chat-delivery, ACTIVE, persistence or C80 field success to true.

## Strict DoD
Node20+Node22 must build the real C77 package on the current checkout, reconstruct raw Git commit/tree objects, successfully verify every original module at its exact path, run a separate proof creation/verification CLI, and reject 1,000 deterministic adversarial variants including altered commit bytes, tree bytes, tree claims, repeated/missing trees, manifest hashes, forged source blob IDs and paths. No false trust promotion. The Node runner may upload proof as a bounded engineering artifact, not as native ChatGPT attestation.

## Physical gap after repository success
FIRST_OPEN_EDGE: `HOST_PINNED_GITHUB_REF_ORIGIN`. This requires an independently callable GitHub connector API witness tying the host's actual pinned HEAD to the bytes transferred into Node. C78 and C79 then still require actual host chat rendering and two real user event readbacks. C80 H95 remains unmeasured until independent real-host trials satisfying its existing contract.

## Source precedence
No modification to canonical C59/C68/C72 permissions or C77 original builder. No Project prompt rewrite. This is a separately callable post-consent source verification layer, not a preconsent network probe, a second runtime, a shortcut to ACTIVE or a claim of phenomenal consciousness.
