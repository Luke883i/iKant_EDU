# C72 assisted Host-to-Node local-file carrier

Status: engineering candidate, authority=0. This extends PR 175; it is not a provider hook, a C72 receipt, an EDU activation or a portable guarantee.

**Why**: ChatGPT Host can have working GitHub API reads and a Node shell with EAI_AGAIN DNS. The earlier stager accepted base64, but did not define an easy, explicit Host-mediated local-file route. Neither the existence of both tools nor a prompt proves a physical transfer.

**Procedure after a distinct exact I ACCEPT**: Preserve first-turn HEAD and five SHA-1 witnesses. Fetch eight pinned original GitHub files. For each, physically copy exact UTF-8 bytes with the Host's writable shell tool into a private 0600 file under a private directory, preserving newlines. Independently compute the Git blob SHA-1 of that file and compare with the API identity. This is a real Host-assisted effect, not an automatic persistent adapter. If the Host tool cannot carry the bytes, stop with the observed error; never infer success.

Cold Host environments have no checkout: first fetch scripts/project-c72-verified-staging.mjs from the pinned GitHub commit, copy its exact source into the Node-visible private working directory with the same Host-assisted tool, and independently verify Git blob SHA-1 before running it. Merely naming a CLI path does not materialize it. All this occurs after the exact I ACCEPT gate, never before.

Initialize the existing PR 175 staging CLI with the original HEAD and SHA manifest. For each file, send a JSON stdin frame to scripts/project-c72-verified-staging.mjs: {"op":"put-local","schema":"ikant-host-c72-verified-put-local/v1","stageDirectory":"/private/stage","path":"README.md","sourceFile":"/private/incoming-readme"}. The Node process checks absolute file path, ownership, private mode, symlink/hardlink absence, file size, stable metadata, and then calls the existing canonical base64 put/readback. Remove source file after success. Existing put operation remains supported.

Require 8/8 verified original blob SHA-1 and SOURCE_READY_FOR_ORIGINAL_COLD_SEED. Verify original coldstart seed and live HEAD again, then invoke original C72 once, verify accepted receipt and full unmodified introduction. Stop after successful C72 and require a separate exact EDU human turn before original mode selection. No retry after owner UNKNOWN.

**Nonclaims**: CI uses fixture/checkout bytes. It cannot authenticate native ChatGPT events or certify that connector bytes were transferred in a fresh chat. GitHub+Node availability is not bridge proof. A single one-blob SHA-positive Host transfer is partial transport evidence only. CI GREEN is not EDU HOST_BOUND, C135 running or PRODUCT_GO.

Conditional routing: `host/project-c72-transport-frontier.mjs` chooses a non-dominated **observed** carrier under a bounded normative model. `HOST_FILE` is not an accepted carrier of the old five-document `bindC72Transport`; it is the **separate eight-original-file staging + original cold-seed rail**, with an independently fetched and SHA-checked CLI and seed. Node HTTPS failure does not disable the Host file rail. No new C72 owner is added. `EXPLICIT_MANUAL_POST_EDU` with original pinned ZIP remains the human fallback after original mode selection, never a P0 substitute.
