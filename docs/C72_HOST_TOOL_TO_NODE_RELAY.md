# C72 Host-to-Node verified staging — post-accept P0

**Status:** Host transport adapter, authority=0. No consent owner, no admission receipt, no user-event provenance, no ACTIVE or EDU language port.

## Regression in PR 174

PR 174 proved C72 original ownership on checkout/fixture bytes and qualified the downstream EDU/manual ZIP path. It did not install a transport from ChatGPT's GitHub connector into the independent Node environment. Both capabilities can coexist while Node DNS fails. A Node-HTTPS attempt failing with EAI_AGAIN is evidence of *that* carrier only, not proof that the GitHub connector or a model-mediated, verified tool-to-Node relay is unavailable.

## Physical implementation

After a **new, distinct exact** human `I ACCEPT` (not before), a Host with actually callable write/stdin tools may use `scripts/project-c72-verified-staging.mjs` as a bounded per-file relay. All eight paths are pinned to the exact SOURCE_HEAD, including the five first-turn SHA-1 blob witnesses.

1. Invoke `init` on a previously nonexistent absolute private directory with `source_head`, `expectedBlobShas` for the eight allowed paths and the preserved first-turn witness. Do not obtain first-turn witness by recollection or regenerating it.
2. For each blob, obtain original bytes from GitHub API at the pinned commit, independently check Git SHA-1 at the source, and physically deliver to Node stdin a JSON `put` record: `{op:'put',schema:'ikant-host-c72-verified-put/v1',stageDirectory,path,contentBase64}`. The CLI validates canonical base64, decodes exact bytes, compares Git blob identity, creates a private file once and reopens it independently. A missing/stale/duplicate/tampered file is not success.
3. `verify` the eight complete files: `{op:'verify',schema:'ikant-host-c72-verified-verify/v1',stageDirectory}`. It returns `SOURCE_READY_FOR_ORIGINAL_COLD_SEED` only with eight reopened, SHA-matched blobs, not an admission receipt.
4. Re-open main HEAD. On drift STOP. Separately retrieve and verify the exact **original** `host/project-c72-coldstart-seed.mjs` against its pinned GitHub blob SHA, then execute the **original** seed with the original current-turn input and `stageDirectory` instead of `sourcePacket`. Only the original owner validates terms acceptance and returns original introduction. The staging CLI never invokes C72 and never constructs owner receipts.

The Node shell command is `node scripts/project-c72-verified-staging.mjs` with one JSON stdin frame per process call. The adapter does not introduce any external package, authentication assumption or new admission writer. When Node or the physical stdin/file-write edge is absent, report `C72_SOURCE_BRIDGE_UNBOUND`; do not pretend naming the adapter makes the edge callable. No model-level reconstruction, partial success as full C72, fallback after owner UNKNOWN, or automatic human ZIP before EDU.

## Evidence/limitations

Locally exercised: independent Node subprocess writes/readbacks; deterministic 10,000 mutation cases; actual pinned GitHub contract blob reached Node through a model-mediated tool-to-shell payload and matched SHA `30826e6fb31a4964a62be23ebae8dc8a0db265ec`. Full eight real blobs and original C72 invocation were **not** executed in that field session; no platform-native event provenance or turn-to-turn persistence was demonstrated. No claim of guaranteed ChatGPT-host bridge.

The relay is testable on Node 20/22 without GitHub DNS. CI fixture/checkout passing is not field product proof. To claim a user session actually crossed the P0 boundary, require original pinned eight source readbacks and the **original** acceptance and complete introduction, with the exact separate user event.
