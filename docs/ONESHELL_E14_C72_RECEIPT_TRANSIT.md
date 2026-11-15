# E14 — Original C72 receipt continuity and verified OneShell emission

## Observed regression and scope

The October 29 Project field trace reached a verified 176-file source readback and then stopped: the previous acceptance, introduction, and EDU selection were visible only as Host-reported digests, not reopened original receipt objects. The owner validation is correct to stop. The defect is the uncovered inter-process Host receipt transport, not a reason to regenerate consent. E14 provides a private, non-authoritative transport; it does not retroactively recover the missing receipts of that field chat.

## Exact sequence and closed owner set

1. After the **distinct** exact `I ACCEPT`, stage eight original C72 blobs and the *verified original cold seed*, and provide an existing private directory (`0700`) as `transitDirectory`. The new transport module must be present next to the seed (independently pinned and SHA-verified by the Host). If unavailable, fail **before** calling C72. An exclusive `ACCEPT` attempt record is created **before** original C72. The original owner writes `accepted` and `introduction`; the Host carrier writes one exclusive, fsync'd, reopened record.
2. On a **later** exact `EDU`, pass the *same* private `transitDirectory` to original `project-c72-cold-mode-cli.mjs` with its original two blob packet. That CLI reopens and validates acceptance, claims the mode attempt before calling the original selection owner, writes and reopens one selection record, and does not generate another acceptance.
3. After EDU, the source may arrive through the original verified loader, including a manual pinned ZIP. `scripts/project-c72-receipt-reopen-cli.mjs` reopens original records read-only. `openContinuousOneShell({c72TransitDirectory})` verifies the same originals and rejects supplied conflicting copies before calling C135. One C135, one C87, and original C125/S03 continue to govern actual voice.
4. `makeOneShellChatPresentation({richUiAvailable:true})` emits **verified Host HTML containing the exact SVG**, or returns a typed rejection. Without a supported Host surface the Markdown six-slot fallback is emitted **without claiming that an SVG appeared**. No provider-native persistent widget or native delivery is asserted.

## Security and anti-regression

- One-shot attempts are exclusive, `wx/0600`; private directory has `0700`; file and owner must be unchanged before a read. Validation checks complete owner receipts and their cross-references, not just a digest.
- Unknown write or owner outcome never triggers a second attempt; manual ZIP cannot mint old receipts.
- The transport is a Host file carrier, never a new C72 authority, a C87 writer, a provider event signature, or a multi-chat persistence guarantee.
- `tests/project-c72-receipt-transit.test.mjs` physically runs acceptance and EDU as **separate Node processes**, starts a third reader, rejects replay/HEAD drift/tamper, and checks verified-SVG rich Host output. `tests/project-oneshell-continuous.test.mjs` proves the source/C135 boundary can consume only reopened original C72 receipts and issue a genuine C87 turn.
- CI runs on Node 20 and 22. Full source transport, legacy seed with no transit, E9/E10/E12/E13, and prompt gates remain independent regressions.

## Performance claims

`project-oneshell-continuous-cli` exposes a local monotonic `host_boot_elapsed_ms` at `EDU_READY`. It measures the process-local C135 + Host-projection interval, **not** GitHub API fetch, model thinking, human waiting, ZIP upload, or provider rendering. The historical >20 min case cannot be assigned to specific operations without a verified per-phase trace. There is no fabricated 2–3 minute SLO claim: a production field test must add end-to-end timestamped stages and host delivery receipts before that target is qualified.

## Release disposition

Software tests are a prerequisite, not provider-native UI acceptance. This PR does not merge, rotate an existing SOURCE_LOCK, update a Project installation, or attest ACTIVE. The portable Project prompt source changes only for a **future** post-merge user-triggered generation, with no automatic repin.
