#!/usr/bin/env python3
"""EDU ingress: independently pinned bootstrap helpers, original TREE/loader, one ZIP."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import tempfile
import zipfile

HELPERS = (
    "scripts/project-edu-zip-tree.py",
    "scripts/project-manual-source.py",
    "scripts/project-repo-loader.mjs",
)
H40 = re.compile(r"[a-f0-9]{40}")
LIMIT = 30 * 1024 * 1024

def acquire(archive, head, tree, pins, private):
    if not all(H40.fullmatch(x or "") for x in (head, tree, *pins)) or len(pins) != len(HELPERS):
        raise ValueError("EDU_INDEPENDENT_PINS_REQUIRED")
    meta = private.lstat()
    if not private.is_absolute() or private.resolve() != private or not stat.S_ISDIR(meta.st_mode) or meta.st_mode & 0o077:
        raise ValueError("EDU_PRIVATE_ROOT_REQUIRED")
    if archive.stat().st_size > LIMIT:
        raise ValueError("EDU_ZIP_BYTES_BOUND")
    dest = private / "source"
    if dest.exists() or dest.is_symlink():
        raise ValueError("EDU_VERIFY_EXISTING_SOURCE_NO_SECOND_HANDOFF")
    marker = private / "source-ingress-attempt"
    # Even an interrupted transform never requests a new human upload automatically.
    with marker.open("x", encoding="ascii") as fd:
        fd.write(head + "\n")
        fd.flush()
        os.fsync(fd.fileno())
    with tempfile.TemporaryDirectory(dir=private, prefix="edu-ingress-") as work:
        work = Path(work)
        paths = []
        with zipfile.ZipFile(archive) as z:
            index = z.infolist()
            if len(index) > 3000:
                raise ValueError("EDU_ZIP_ENTRIES_BOUND")
            for name, pin in zip(HELPERS, pins):
                lookup = [m for m in index if m.filename == "iKant_EDU-" + head + "/" + name]
                if len(lookup) != 1:
                    raise ValueError("EDU_HELPER_MISSING_OR_AMBIGUOUS")
                m = lookup[0]
                if m.is_dir() or m.file_size > 65536 or m.flag_bits & 1 or (m.external_attr >> 16) & 0o170000 not in (0, stat.S_IFREG):
                    raise ValueError("EDU_HELPER_UNSAFE")
                content = z.read(m)
                digest = hashlib.sha1(b"blob " + str(len(content)).encode("ascii") + b"\0" + content).hexdigest()
                if digest != pin:
                    raise ValueError("EDU_HELPER_PIN_MISMATCH")
                out = work / Path(name).name
                with out.open("xb") as f:
                    f.write(content)
                if out.read_bytes() != content:
                    raise ValueError("EDU_HELPER_READBACK_MISMATCH")
                paths.append(out)
        verifier, converter, loader = paths
        derived, plan = work / "tree.json", work / "plan.json"
        def run(args):
            return subprocess.run(args, check=True, capture_output=True, text=True, timeout=60).stdout
        run([sys.executable, verifier, "--archive", archive, "--head", head, "--tree", tree, "--output", derived])
        run([sys.executable, converter, "--source-zip", archive, "--api-tree", derived,
             "--head", head, "--tree", tree, "--output-plan", plan])
        receipt = json.loads(run(["node", loader, plan, dest, head, tree]))
        if receipt.get("status") != "SOURCE_REOPENED" or receipt.get("source_head") != head or receipt.get("source_tree") != tree:
            raise ValueError("EDU_SOURCE_READBACK_DENIED")
        return {"ok": True, "source_root": str(dest), "objects": receipt["objects"], "head": head,
                "tree": tree, "active": False, "native_delivery_attested": False}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--archive", required=True, type=Path)
    p.add_argument("--head", required=True)
    p.add_argument("--tree", required=True)
    p.add_argument("--helper-pins", nargs=3, required=True)
    p.add_argument("--private-root", required=True, type=Path)
    a = p.parse_args()
    try:
        print(json.dumps(acquire(a.archive, a.head, a.tree, a.helper_pins, a.private_root)))
    except (OSError, ValueError, RuntimeError, zipfile.BadZipFile, subprocess.SubprocessError) as e:
        print(json.dumps({"ok": False, "edge": str(e)[:180], "active": False,
                          "native_delivery_attested": False}))
        raise SystemExit(2)

if __name__ == "__main__":
    main()
