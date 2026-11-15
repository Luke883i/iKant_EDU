# Needle Shadow Adapter v1 - EDU isolation and falsifiable DoD

**SOURCE LOCK**: HEAD 08e1bc0ad8ae80d43b628fb13a89a38c165094eb; TREE 67b1f0b4b4b8a5168fce89b994e93d763c03cb5e.
**Status**: DRAFT / PRODUCT_NO_GO, no native ChatGPT identity, no real model qualification.

## Boundary
Original C72/S02/C135/C114/C139/C140/C141/C142/C87/C125 and C59 have no modifications. This standalone HOST shadow is disabled by default. It cannot alter routing, create C87 voice, execute tools, authorize writes or deliver C125. Its only outputs are an exact input byte digest and untrusted structural-hint digests. Do not infer or transfer historical source-epoch consent. In real EDU, original C72 admission is required independently.

Needle complete-only Python worker is optional and must be installed by a human separately. Import, engine and weights are not proved installed here. Reference: https://www.cactuscompute.com/blog/needle-python-docs ; https://github.com/cactus-compute/needle . Tool schemas are explicit, no Python callable tools, and Needle.run is forbidden. The child process has a limited environment, but HF_HUB_OFFLINE does NOT isolate every network library or prevent OS egress; deploy with independent network controls for confidential data. Prohibit secrets and sensitive data until authorized and protected.

## Machine-test DoD
1. Source epoch exact, owner code original and immutable; no third mode.
2. Explicit opt-in, local-only and human data permission; exact UTF-8 byte hash and fail-closed before provider call on invalid input/mode/epoch.
3. OS child spawn with bounded input/output and timeout + SIGKILL + process-close witness; no blind retry or unbounded process.
4. Only two metadata suggestions, route_hint and extract_slots; no callable tools, no original owner/writer output, no client ACTIVE claims.
5. Unknown/polluted objects, accessors, execution metadata and oversized results stop without exposing original human text.
6. 24 adversarial mutation families x100 deterministic vectors plus original C141/C142 routing tests. The vectors are not real Needle predictions.
7. No silent fallback on absent model; observe must distinguish no voice, untrusted hints and independent product proof.
8. CI pinned to the PR tree, preserve complete document atlas and source provenance.

## Empirical DoD, still OPEN
Run a real Needle 3 model offline with pinned weights/engine and representative, human-authorized  multilingual inputs. Compare blind-labeled Needle shadow proposals with original C135-only routing on held-out benign/OOD/adversarial examples; measure false identity routing, macro F1, calibration (confidence may be None for local LoRA), abstention, p50/p95 wall-clock, CPU/RAM/energy and process startup costs. Include zero unauthorized execution and privacy breach as hard gates. Report uncertainty intervals, safety vetoes and human review. Improve neither AI accuracy nor latency claims from synthetic tests alone.

This PR is software infrastructure qualification only; HUMAN/PILOT and native app gates remain product no-go.
