#!/usr/bin/env python3
"""HOST transport-only: pinned GitHub source ZIP + independent API tree -> loader plan.
No Git history, consent, origin or runtime execution is inferred from archive bytes.
Node project-repo-loader remains the source/tree/blob/readback authority.
"""
import argparse
import base64
import hashlib
import json
import pathlib
import re
import stat
import sys
import zipfile

H40 = re.compile(r"^[a-f0-9]{40}$")
SAFE = re.compile(r"^[A-Za-z0-9._/-]+$")
MAX_FILES = 3000
MAX_BYTES = 30 * 1024 * 1024
MAX_MEMBER = 5 * 1024 * 1024

def blob(b):
    return hashlib.sha1(b"blob " + str(len(b)).encode("ascii") + b"\0" + b).hexdigest()

def safe(p):
    return bool(p) and bool(SAFE.fullmatch(p)) and all(x not in ("", ".", "..", ".git") for x in p.split("/"))

def convert(archive, api_tree, head, tree):
    if not H40.fullmatch(head or "") or not H40.fullmatch(tree or ""):
        raise ValueError("SOURCE_HEAD_TREE_REQUIRED")
    if (api_tree.get("source_head"), api_tree.get("source_tree"), api_tree.get("live_head"),
        api_tree.get("truncated")) != (head, tree, head, False):
        raise ValueError("SOURCE_API_BINDING_NOT_VERIFIED")
    entries = api_tree.get("tree")
    if not isinstance(entries, list) or len(entries) < 1:
        raise ValueError("COMPLETE_API_TREE_REQUIRED")
    bypath = {}
    for e in entries:
        p = e.get("path") if isinstance(e, dict) else None
        if not safe(p) or p in bypath or not H40.fullmatch(e.get("sha", "")):
            raise ValueError("SOURCE_TREE_ENTRY_INVALID")
        bypath[p] = e
    prefix = "iKant_EDU-" + head + "/"
    with zipfile.ZipFile(archive) as z:
        members = z.infolist()
        if len(members) > MAX_FILES or sum(x.file_size for x in members) > MAX_BYTES:
            raise ValueError("ARCHIVE_BUDGET_EXCEEDED")
        names = {}
        for e in members:
            if not e.filename.startswith(prefix):
                raise ValueError("ARCHIVE_WRONG_HEAD_PREFIX")
            rel = e.filename[len(prefix):].rstrip("/") if e.is_dir() else e.filename[len(prefix):]
            if not rel:
                continue
            if not safe(rel) or rel in names or e.flag_bits & 1 or e.file_size > MAX_MEMBER:
                raise ValueError("ARCHIVE_MEMBER_UNSAFE")
            if e.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED):
                raise ValueError("ARCHIVE_COMPRESSION_UNSUPPORTED")
            mode = (e.external_attr >> 16) & 0o170000
            if mode not in (0, stat.S_IFREG, stat.S_IFDIR):
                raise ValueError("ARCHIVE_SPECIAL_MEMBER")
            if e.is_dir() != (mode == stat.S_IFDIR) and mode != 0:
                raise ValueError("ARCHIVE_MODE_MISMATCH")
            names[rel] = e
        def original(p):
            e = names.get(p)
            entry = bypath.get(p)
            if e is None or e.is_dir() or entry is None or entry.get("type") != "blob" or entry.get("mode") not in ("100644", "100755"):
                raise ValueError("PINNED_MEMBER_MISSING:" + p)
            b = z.read(e)
            if len(b) != e.file_size or blob(b) != entry["sha"]:
                raise ValueError("GIT_BLOB_MISMATCH:" + p)
            return b
        manifest = json.loads(original("contracts/project-session-source.json"))
        ps = manifest.get("paths")
        if manifest.get("schema") != "ikant-le-project-session-source/v1" or not isinstance(ps, list) or len(set(ps)) != len(ps) or not all(safe(p) for p in ps):
            raise ValueError("PINNED_MANIFEST_INVALID")
        required = sorted(set(ps) | {"contracts/project-session-source.json"})
        payload = [{"path":p,"encoding":"base64","content":base64.b64encode(original(p)).decode("ascii")} for p in required]
    return {"source_head":head,"source_tree":tree,"live_head":head,
            "truncated":False,"tree":entries,"files":payload}

def main():
    p=argparse.ArgumentParser()
    for name in ("source-zip", "api-tree", "head", "tree", "output-plan"):
        p.add_argument("--"+name, required=True)
    a=p.parse_args()
    try:
        out=pathlib.Path(a.output_plan)
        if out.exists() or not out.parent.is_dir():
            raise ValueError("FRESH_PLAN_DESTINATION_REQUIRED")
        api=json.loads(pathlib.Path(a.api_tree).read_text(encoding="utf-8"))
        plan=convert(a.source_zip,api,a.head,a.tree)
        # Exclusive staging: Node independently rechecks every tree and blob before execution.
        with out.open("x", encoding="utf-8") as f:
            json.dump(plan,f,ensure_ascii=True,separators=(",",":"))
        print(json.dumps({"status":"MANUAL_CARRIER_PLAN_CREATED_NOT_EXECUTED",
          "head":a.head,"tree":a.tree,"files":len(plan["files"]),
          "node_verification_required":True,"active":False}))
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile,
            json.JSONDecodeError, RuntimeError) as e:
        print("FAIL_CLOSED:"+str(e),file=sys.stderr)
        raise SystemExit(2)

if __name__=="__main__":
    main()
