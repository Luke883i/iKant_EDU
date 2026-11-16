# EDU experimental One-ZIP after I ACCEPT — executable Host path

Status: ENGINEERING_CANDIDATE, not FIELD_PASS or CANONICAL ACTIVE. Design base: merged PR #179. This does NOT remove C72 or weaken original owner receipts. It changes only the optional postconsent transport route in a **new** Project session using this installed instruction version.

## Critical path

ORIENTATION: first human message → GitHub main HEAD + exactly five ordered original blob witnesses → pinned Terms link → freeze. No TREE/source download before consent.

Consent: later exact `I ACCEPT` host witnessed, not yet a C72 owner receipt. Prefer existing, physically observed P0 callback/packet/HTTPS. If P0 cannot transfer bytes but Node is ready, the Host offers **one** pinned official GitHub commit ZIP (no Project bundle, no partial eight-file kit); uploading it after `I ACCEPT` and before original C72/EDU is allowed. The person need not debug an adapter.

The Host obtains the pinned commit TREE SHA and the blob SHA of `scripts/project-edu-zip-tree.py` from GitHub's API. Inspect the uploaded ZIP with Python stdlib, extract only that exact path to a fresh private file, and verify its git-blob SHA against GitHub **before executing** it. No executing arbitrary archive code. Run the verified extractor:

```bash
python scripts/project-edu-zip-tree.py --archive SOURCE.zip --head COMMIT_SHA --tree TREE_SHA --output FRESH_DERIVED_TREE.json
python scripts/project-manual-source.py --source-zip SOURCE.zip --api-tree FRESH_DERIVED_TREE.json --head COMMIT_SHA --tree TREE_SHA --output-plan FRESH_PLAN.json
node scripts/project-repo-loader.mjs FRESH_PLAN.json FRESH_SOURCE_ROOT COMMIT_SHA TREE_SHA
```

These command names assume verified source scripts have been staged in the Host Node/Python environment, not merely named by this document. The first command derives the complete Git tree of the ZIP and recomputes its *root*; it does **not** fetch independent per-entry API TREE data. The commit TREE root supplied by GitHub is the independent external witness. The original Python manual converter and original Node loader independently recheck the resulting tree, closure and all required Git blobs. ZIP archive mode fidelity (including executables and symlinks) is checked by the root hash; mismatch is STOP, not a workaround.

C72: from the verified source root call `runOneZipOriginalAdmission` in `scripts/project-edu-onezip-admission.mjs` with `action:ACCEPT`, exact prior witnessed acceptance and frozen five original SHA. It writes a private attempt journal **before** invoking the original `reenterC72V2PostAccept`. Preserve complete original introduction and receipt, then STOP. A later exact human `EDU` invokes `action:EDU`, original C72 select and validator, private receipt/readback; then STOP. No replay after UNKNOWN.

EDU: in a subsequent real human content turn, invoke `scripts/project-edu-onezip-session.mjs` from the verified source. It imports original `startOneShellEdu` / C135, whose `languagePort` is a physical interactive stdin/stdout task-reply channel. The Host receives the owner-generated language task, produces a response with `required_ack` matching the owner task, and supplies it to the same live process. Only the original owner validates ACK, commits C87 once and publishes exact C125/S03. The Host emits original Superficie A unchanged and observes the actual chat display; stdout is not native-delivery proof. Export private C87 checkpoint from PR #179; for a later distinct human turn, use `resumeFrom` with verified prior window/nonce/worker-gone witness. Never present fixtures as an actual human turn.

## Experimental DoD and nonclaims

- **SOURCE_PASS** — exact ZIP↔Git commit TREE; loader readback; frozen session epoch.
- **C72_PASS** — original accepted/intro, then separate original EDU mode receipt, both reopened.
- **EDU_ACTIVE_HOST_BOUND** — real cognitive C135 turn, Host language task with exact ACK, original C87 readback, unchanged C125/S03 in actual chat.
- **EDU_PSEUDO_PERSISTENT** — a second distinct human turn after worker loss or a deliberately closed worker, verified portable C87, original rebind and new voice.
- **Never claimed** — provider-native input authentication, persistent container between chats, universal UI/avatar, CANONICAL ACTIVE, full Cx coverage by a single turn.

No automatic SOURCE_LOCK repin. A new GitHub merge does not change the frozen runtime source; during deferred acceptance a live HEAD drift still stops per original policy. Prompt installed in the Project is not altered by merging source. Do not mark FIELD_PASS on CI/fixture success. This design uses existing manual extractor, full original loader and original C72; no second consent owner, cognitive owner, ledger writer or LLM model.
