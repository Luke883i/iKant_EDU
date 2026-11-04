# Falsification history — C141 LOCAL PRE-PR

1. **Counterexample F1 (real failure):** the heuristic `incert[oe]` did not recognize the Italian word `incertezza`. The first test produced `10 pass / 1 fail`. The implementation was refined to `incert\w*`, and indirect self-reference cases were added. A positive shape match **still does not attest truth**.
2. **Counterexample F2 (oracle boundary):** the Unicode fuzz set exceeded `maxFragments=128` at seed 129. The guard STOPped correctly, but the test incorrectly expected success (`19 pass / 1 fail`). The test was refined to allow physically feasible fragments and a separate negative limit test now requires STOP.
3. **Counterexample F3 (real owner bypass):** `Hai coscienza?` with open scope and misclassified C132 was routed to C140. This falsified identity precedence in the first C141 shadow. The pattern was refined for direct Italian/English conscious-state questions, and the adversarial regression remains. This is still not a complete natural-language self-identification classifier.
4. **Negative boundaries that must remain:** a long direct identity query must not bypass C114 or forge C70; shadow C132 cannot alone authorize C140; an adulterated fragment must fail rejoin; unknown delivery never authorizes blind retry; no native UI or cross-chat persistence is inferred.
5. **Important unfalsified claim:** no semantic/epistemic correctness claim is made. A heuristic checking that an answer contains the words 'evidence', 'inference', 'uncertainty' and 'counterexample' does not demonstrate the argument is sound. This must be externally evaluated.

Initial and intermediate TAP logs remain outside Git under the local PRE-PR container package, with SHA-256 recorded in the materialization manifest. No history has been overwritten.

6. **Counterexample F4 (patch hygiene):** Git diff verification rejected `C141_ISSUE_MATRIX.csv` because the CSV writer emitted CRLF. The generator now uses LF explicitly. A local Git commit records the repair and a subsequent `git diff --check` and `git apply --check` pass on PR #148's exact tree.
