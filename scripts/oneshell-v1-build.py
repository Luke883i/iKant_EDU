#!/usr/bin/env python3
"""OneShell v1: exact-head, baseline-preserving, deterministic Project ZIP."""
import argparse
import hashlib
import io
import json
import pathlib
import subprocess
import sys
import zipfile

HEAD = "afb6f1cb75456c7cf8c82598bbcb6f954df9f629"
TREE = "f559a31fab659bb9f07aea42c798361070d4b07e"
OLD_HEAD = "3d174674527d74d1b2e52df3e970d14a748cd4b1"
OLD_TREE = "edc1e859d6688ebfd17788e115748ff200289736"
BASELINE_SHA256 = "7bac4cf89cb67b4fa007235f9b4f830fa9848219611e89366d146e72e0b43596"
PREFIXES = ("repo_original/", "adapter_source/", "plugin_source/", "orientation/")
ORIENTATION = ("README.md", "BOOTSTRAP.json", "ADMISSION.json", "AGENTS.md", "TERMS.md")
SLIDES = tuple("slides/%02d_%s.md" % (i, v) for i,v in enumerate(
    ("ROUTE","BOOT","ADAPTER","SHELL","EVIDENCE","RETENTION","FALSIFICATION","RELEASE")))
MANDATORY = (
    "docs/IKANT_DOCUMENT_ATLAS.md",
    "host/c125-exclusive-shell.mjs", "host/c135-edu-v2-owner.mjs",
    "host/c139-edu-v2-turn.mjs", "host/c140-open-edu-turn.mjs",
    "host/c141-semantic-shadow.mjs", "host/c142-semantic-owner-guard.mjs",
    "host/s02-edu-versioned-consumer.mjs",
    "host/s03-owner-bound-presentation.mjs",
    "plugins/ikant-le-session-chat/server/server.mjs",
    "plugins/ikant-le-session-chat/server/oauth-resource-boundary.mjs",
    "contracts/c140-e2e-semantic-assurance.json",
    "contracts/c141-runtime-qualification-v2.json",
    "contracts/c142-34issue-evidence.json",
    "contracts/mcp-external-mutation-assurance-v2.json",
    "docs/MCP_EXTERNAL_ADVANCED_V2_PREPR.md",
    "render.mcp-prepr.yaml"
)
DELTA = (
    "POST-MERGE EDU ROUTE: C114 self-identity, C139 response process, C140 "
    "open-domain candidate, C141 non-authoritative shadow, C142 bounded multilingual "
    "negative guard. Preserve C72/S02/C135, one original C87, independent physical "
    "reopen, original C125 and six slots. External MCP/OAuth is neither a third mode "
    "nor C59 native identity; no ACTIVE, provider UI or efficacy without witnesses."
)

def sha(data):
    return hashlib.sha256(data).hexdigest()

def git_blob(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()

def run_git(repo, *args):
    p = subprocess.run(["git", "-C", str(repo), *args], capture_output=True)
    if p.returncode:
        raise ValueError("GIT_SOURCE_UNAVAILABLE " + repr(args) + ": " + p.stderr.decode("utf8","replace")[:120])
    return p.stdout

def safe(path):
    return bool(path) and not path.startswith("/") and not path.endswith("/") and "\\" not in path and ".." not in pathlib.PurePosixPath(path).parts

def source_path(name):
    for prefix in PREFIXES:
        if name.startswith(prefix):
            return name[len(prefix):]
    return None

def zip_read(path):
    with zipfile.ZipFile(path, "r") as z:
        names = z.namelist()
        if len(names) != len(set(names)) or not all(safe(n) for n in names) or z.testzip():
            raise ValueError("ZIP_UNSAFE_OR_CORRUPT")
        if "MANIFEST.json" not in names:
            raise ValueError("MANIFEST_MISSING")
        manifest = json.loads(z.read("MANIFEST.json"))
        if set(names) != set(manifest["files"]) | {"MANIFEST.json"}:
            raise ValueError("MANIFEST_COVERAGE")
        for n, attr in manifest["files"].items():
            raw = z.read(n)
            if len(raw) != attr["bytes"] or sha(raw) != attr["sha256"]:
                raise ValueError("MANIFEST_BYTES " + n)
            if attr.get("git_blob_sha1") and git_blob(raw) != attr["git_blob_sha1"]:
                raise ValueError("MANIFEST_GIT_BLOB " + n)
        return {n:z.read(n) for n in names},manifest

def canonical_json(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode("utf8")

def build(repo, baseline, destination):
    main = run_git(repo, "rev-parse", "refs/heads/main").decode().strip()
    if main != HEAD:
        raise ValueError("STOP_SOURCE_LOCK_STALE " + main)
    tree = run_git(repo, "rev-parse", HEAD + "^{tree}").decode().strip()
    if tree != TREE:
        raise ValueError("STOP_SOURCE_LOCK_STALE_TREE " + tree)
    commit = run_git(repo, "cat-file", "commit", HEAD)
    if hashlib.sha1(b"commit " + str(len(commit)).encode() + b"\0" + commit).hexdigest() != HEAD:
        raise ValueError("COMMIT_OBJECT_INVALID")
    baseline_data = baseline.read_bytes()
    if sha(baseline_data) != BASELINE_SHA256:
        raise ValueError("BASELINE_ROOT_MISMATCH")
    old, old_manifest = zip_read(baseline)
    if old_manifest.get("source_head") != OLD_HEAD or old_manifest.get("source_tree") != OLD_TREE:
        raise ValueError("BASELINE_SOURCE_MISMATCH")

    def original(path):
        if not safe(path):
            raise ValueError("UNSAFE_SOURCE_PATH " + path)
        return run_git(repo, "show", HEAD + ":" + path)

    output = {}
    for name, raw in old.items():
        if name == "MANIFEST.json":
            continue
        path = source_path(name)
        if path:
            output[name] = original(path)
        elif name == "PROMPT_INNESCO.md" or name in SLIDES or name in (
            "INSTALLAZIONE.md", "CIL_S05_PRESENTAZIONE.md"
        ):
            output[name] = raw.replace(OLD_HEAD.encode(), HEAD.encode()).replace(OLD_TREE.encode(), TREE.encode())
        else:
            output[name] = raw

    for name in ORIENTATION:
        key = "orientation/" + name
        if key not in output:
            raise ValueError("ORIENTATION_ABSENT " + name)
        output[key] = original(name)
    for path in MANDATORY:
        output["repo_original/" + path] = original(path)
    if not set(SLIDES).issubset(output):
        raise ValueError("SLIDES_ABSENT")
    for n in ("PROMPT_INNESCO.md", *SLIDES):
        if OLD_HEAD.encode() in output[n] or OLD_TREE.encode() in output[n]:
            raise ValueError("STALE_ROUTING " + n)
    output["PROMPT_INNESCO.md"] += ("\n\nSOURCE-BOUND v1.0 DELTA: " + DELTA + "\n").encode()
    for n in (SLIDES[2], SLIDES[6], SLIDES[7]):
        output[n] += ("\n\n## v1.0 qualified delta\n" + DELTA + "\n").encode()

    output["SOURCE_LOCK.json"] = canonical_json({
        "head":HEAD,"tree":TREE,"authorized_by_human":True,
        "native_provider_attested":False,"runtime_admission_carried":False,
        "active":False,"historical_head":OLD_HEAD})
    output["AUDIT_PR132_151.md"] = (repo/"docs/ONESHELL_V1_MATERIALIZATION.txt").read_bytes()
    output["PINNED_COMMIT_OBJECT.raw"] = commit
    output["VERIFICA_BUNDLE.py"] = pathlib.Path(__file__).with_name("oneshell-v1-verify.py").read_bytes()
    output["MATERIALIZATION_RULES.md"] = (
        "Deterministic source-exact OneShell v1.0. All original-prefixed bytes "
        "come from git show PINNED_HEAD:path. No provider identity, "
        "semantic efficacy or runtime is inferred from a packaged ZIP.\n").encode()

    entries = {}
    for name, data in sorted(output.items()):
        path = source_path(name)
        entries[name] = {
            "bytes":len(data),
            "sha256":sha(data),
            "authority":"original_git" if path else "host_projection",
            "git_blob_sha1":git_blob(data) if path else None,
        }
    manifest = {
        "schema":"oneshell-v1.0-source-locked","source_head":HEAD,"source_tree":TREE,
        "active":False,"native_provider_attested":False,
        "partial_source_only":True,
        "files":entries
    }
    output["MANIFEST.json"] = canonical_json(manifest)
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name,data in sorted(output.items()):
            info=zipfile.ZipInfo(name,(1980,1,1,0,0,0))
            info.external_attr=(0o100644 << 16)
            info.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(info,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_bytes(buffer.getvalue())
    check_data,_ = zip_read(destination)
    if check_data != output:
        raise ValueError("INDEPENDENT_REOPEN_MISMATCH")
    return {"head":HEAD,"tree":TREE,"members":len(output),
            "sha256":sha(buffer.getvalue()),"prompt_bytes":len(output["PROMPT_INNESCO.md"])}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--repo",type=pathlib.Path,required=True)
    parser.add_argument("--baseline",type=pathlib.Path,required=True)
    parser.add_argument("--out",type=pathlib.Path,required=True)
    args=parser.parse_args()
    try:
        print(json.dumps(build(args.repo,args.baseline,args.out),sort_keys=True))
    except Exception as error:
        print("STOP " + str(error),file=sys.stderr)
        raise SystemExit(2)
if __name__ == "__main__":
    main()
