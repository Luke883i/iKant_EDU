#!/usr/bin/env python3
"""Independent physical ZIP reopen and original Git byte provenance verification."""
import argparse
import hashlib
import importlib.util
import json
import pathlib
import subprocess
import sys
import zipfile

HEAD = "afb6f1cb75456c7cf8c82598bbcb6f954df9f629"
TREE = "f559a31fab659bb9f07aea42c798361070d4b07e"
BASELINE_SHA256 = "7bac4cf89cb67b4fa007235f9b4f830fa9848219611e89366d146e72e0b43596"
SOURCE_PREFIXES = ("repo_original/","adapter_source/","plugin_source/","orientation/")
REQUIRED = (
    "repo_original/docs/IKANT_DOCUMENT_ATLAS.md",
    "plugin_source/plugins/ikant-le-session-chat/server/server.mjs",
    "repo_original/plugins/ikant-le-session-chat/server/oauth-resource-boundary.mjs",
    "repo_original/host/c135-edu-v2-owner.mjs",
    "repo_original/host/c139-edu-v2-turn.mjs",
    "repo_original/host/c140-open-edu-turn.mjs",
    "repo_original/host/c141-semantic-shadow.mjs",
    "repo_original/host/c142-semantic-owner-guard.mjs",
    "repo_original/host/c125-exclusive-shell.mjs",
    "repo_original/host/s02-edu-versioned-consumer.mjs",
    "repo_original/host/s03-owner-bound-presentation.mjs",
    "orientation/README.md","orientation/BOOTSTRAP.json",
    "orientation/ADMISSION.json","orientation/AGENTS.md","orientation/TERMS.md",
    "PROMPT_INNESCO.md","MANIFEST.json","PINNED_COMMIT_OBJECT.raw",
    "slides/00_ROUTE.md","slides/01_BOOT.md","slides/02_ADAPTER.md",
    "slides/03_SHELL.md","slides/04_EVIDENCE.md",
    "slides/05_RETENTION.md","slides/06_FALSIFICATION.md","slides/07_RELEASE.md"
)
def sha(data):
    return hashlib.sha256(data).hexdigest()

def blob(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()

def from_git(repo,*args):
    p=subprocess.run(["git","-C",str(repo),*args],capture_output=True)
    if p.returncode:
        raise ValueError("GIT_SOURCE_UNAVAILABLE " + repr(args))
    return p.stdout

def verify(path,repo,baseline=None):
    if repo is None:
        raise ValueError("FULL_GIT_SOURCE_REQUIRED")
    if from_git(repo,"rev-parse","refs/heads/main").decode().strip() != HEAD:
        raise ValueError("STOP_SOURCE_LOCK_STALE")
    if from_git(repo,"rev-parse",HEAD+"^{tree}").decode().strip() != TREE:
        raise ValueError("SOURCE_TREE_MISMATCH")
    with zipfile.ZipFile(path) as z:
        names=z.namelist()
        if len(names)!=len(set(names)) or z.testzip() or any(
            not n or n.startswith("/") or n.endswith("/") or "\\" in n or
            ".." in pathlib.PurePosixPath(n).parts for n in names
        ):
            raise ValueError("ZIP_PATH_OR_CORRUPTION")
        if not set(REQUIRED).issubset(names):
            raise ValueError("REQUIRED_SOURCE_ABSENT " + str(sorted(set(REQUIRED)-set(names))))
        m=json.loads(z.read("MANIFEST.json"))
        if m["source_head"] != HEAD or m["source_tree"] != TREE or m.get("active") is not False:
            raise ValueError("SOURCE_OR_ACTIVATION_MISMATCH")
        if set(names) != set(m["files"]) | {"MANIFEST.json"}:
            raise ValueError("MANIFEST_COVERAGE")
        for name,attrs in m["files"].items():
            data=z.read(name)
            if len(data)!=attrs["bytes"] or sha(data)!=attrs["sha256"]:
                raise ValueError("HASH_MISMATCH " + name)
            for prefix in SOURCE_PREFIXES:
                if name.startswith(prefix):
                    source=name[len(prefix):]
                    expected=from_git(repo,"show",HEAD+":"+source)
                    if expected!=data or blob(data)!=attrs.get("git_blob_sha1"):
                        raise ValueError("GIT_BLOB_SOURCE_MISMATCH " + name)
                    break
        commit=z.read("PINNED_COMMIT_OBJECT.raw")
        if hashlib.sha1(b"commit " + str(len(commit)).encode() + b"\0" + commit).hexdigest()!=HEAD:
            raise ValueError("COMMIT_HASH_MISMATCH")
        if not commit.splitlines() or commit.splitlines()[0] != ("tree "+TREE).encode():
            raise ValueError("COMMIT_TREE_MISMATCH")
        if baseline is not None:
            if sha(baseline.read_bytes()) != BASELINE_SHA256:
                raise ValueError("BASELINE_ROOT_MISMATCH")
            with zipfile.ZipFile(baseline) as prior:
                lost=set(prior.namelist())-set(names)
                if lost:
                    raise ValueError("BASELINE_MEMBER_DROPPED "+repr(sorted(lost)))
    return {"status":"SOURCE_EXACT","member_count":len(names),"head":HEAD,
            "tree":TREE,"bundle_sha256":sha(path.read_bytes()),
            "native_provider_attested":False,"product_go":False}

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--zip",type=pathlib.Path,required=True)
    p.add_argument("--repo",type=pathlib.Path,required=True)
    p.add_argument("--baseline",type=pathlib.Path)
    args=p.parse_args()
    try:
        print(json.dumps(verify(args.zip,args.repo,args.baseline),sort_keys=True))
    except Exception as exc:
        print("STOP "+str(exc),file=sys.stderr)
        raise SystemExit(2)
