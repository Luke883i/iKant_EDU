#!/usr/bin/env python3
"""Exact Git-source V13 preservation + bounded PR249 additions, fail-closed.

This is a SOURCE gate. Native runtime, CODEOWNERS review, CI and CORA remain
independent even if this program passes. No evidence of their approval is minted.
"""
import argparse
import json
from pathlib import Path
import subprocess
import sys

MAIN = "8cb80d2230919220ac4b7a1cfcd80950d8467848"
MAIN_TREE = "4cff62ed12f79390a059784bcbf9770788a3a4d1"
V13 = "86e20abb714fa4000352b61a0c0abf8795775318"
V13_TREE = "07f135d6d54ff69b78cc9e7215daa0bdafa9f84c"
ROOTS = [".github", "contracts", "host", "project", "scripts", "src", "tests"]
ROOT_FILES = [".gitignore", "ADMISSION.json", "AGENTS.md", "BOOTSTRAP.json", "LICENSE", "README.md", "TERMS.md", "ikant.mjs", "package.json"]
ALLOWED_ADDITIONS = {
    ".github/workflows/r7-pr249-assurance.yml",
    "contracts/r7-pr249-founding-contract.json",
    "scripts/r7-pr249-falsify.mjs",
    "scripts/r7-pr249-physical-gate.py",
    "tests/r7-pr249-founding-contract.test.mjs",
    "tests/r7-pr249-physical-gate.test.mjs",
    "project/docs/R7_PR249_FOUNDING_GUIDE.md",
}


def cmd(repo, *args):
    p = subprocess.run(["git", "-C", str(repo), *args], capture_output=True)
    if p.returncode:
        raise RuntimeError("GIT_" + "_".join(args[:3]) + ":" + p.stderr.decode("utf-8", "replace")[:220])
    return p.stdout


def listing(repo, revision):
    d = {}
    for entry in cmd(repo, "ls-tree", "-r", "-z", revision).split(b"\0"):
        if not entry:
            continue
        meta, file_name = entry.split(b"\t", 1)
        mode, kind, sha = meta.decode("ascii").split()
        path = file_name.decode("utf-8")
        if path in d:
            raise RuntimeError("DUPLICATE_PATH_IN_TREE:" + path)
        d[path] = (mode, kind, sha)
    return d


def assess(repo, fixture=False):
    issues = []
    try:
        head = cmd(repo, "rev-parse", "HEAD").decode().strip()
        observed_tree = cmd(repo, "rev-parse", "HEAD^{tree}").decode().strip()
        source_tree = cmd(repo, "rev-parse", V13 + "^{tree}").decode().strip()
        if source_tree != V13_TREE:
            issues.append("V13_SOURCE_TREE_DRIFT")
        if subprocess.run(["git", "-C", str(repo), "merge-base", "--is-ancestor", V13, "HEAD"],capture_output=True).returncode != 0:
            issues.append("V13_NOT_ANCESTOR")
        if not fixture:
            if cmd(repo, "rev-parse", MAIN).decode().strip() != MAIN:
                issues.append("REAL_MAIN_MISSING")
            elif cmd(repo, "rev-parse", MAIN + "^{tree}").decode().strip() != MAIN_TREE:
                issues.append("MAIN_TREE_DRIFT")
            if subprocess.run(["git", "-C", str(repo), "merge-base", "--is-ancestor", MAIN, "HEAD"],capture_output=True).returncode != 0:
                issues.append("REAL_MAIN_NOT_ANCESTOR")
        else:
            if cmd(repo, "rev-parse", "27194bb153ff0ab8500bb75277d4d5f7ebb60d45^{tree}").decode().strip() != MAIN_TREE:
                issues.append("FIXTURE_MAIN_TREE_DRIFT")
        source = listing(repo, V13)
        current = listing(repo, "HEAD")
        roots = sorted({p.split("/", 1)[0] for p in current if "/" in p})
        root_files = sorted(p for p in current if "/" not in p)
        if roots != ROOTS:
            issues.append("ROOT_SET_DRIFT")
        if root_files != sorted(ROOT_FILES):
            issues.append("ROOT_FILE_SET_DRIFT")
        for path, orig in source.items():
            cur = current.get(path)
            if cur is None:
                issues.append("SOURCE_PATH_LOST:" + path)
            elif cur != orig:
                issues.append("SOURCE_BLOB_OR_MODE_DRIFT:" + path)
        extras = sorted(set(current) - set(source))
        for path in extras:
            if path not in ALLOWED_ADDITIONS:
                issues.append("UNREGISTERED_ADDITION:" + path)
            elif current[path][0] != "100644" or current[path][1] != "blob":
                issues.append("ADDITION_MODE_OR_KIND_DRIFT:" + path)
        if len(source) != 1639:
            issues.append("V13_FILE_CARDINALITY_DRIFT")
        if not issues:
            result = "SOURCE_ONLY_PASS_FIXTURE" if fixture else "SOURCE_ONLY_PASS_REAL_MAIN"
        else:
            result = "SOURCE_ONLY_REFUTED"
        return {"schema":"r7-pr249-physical-gate/v1", "status":result, "head":head,
                "head_tree":observed_tree,"v13_source":V13, "source_files":len(source),
                "observed_files":len(current), "new_additions":len(extras),"roots":roots,
                "root_files":root_files,"issues":issues[:90],"issue_count":len(issues),
                "scope":"SOURCE_ONLY_NOT_OWNER_OR_RUNTIME_EVIDENCE", "global_dod":"HOLD", "product_go":False}
    except Exception as exc:
        return {"schema":"r7-pr249-physical-gate/v1", "status":"BLOCKED", "issues":[str(exc)],
                "issue_count":1, "global_dod":"HOLD", "product_go":False}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--fixture", action="store_true", help="explicit original-tree fixture, not real GitHub main")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--require-global", action="store_true")
    args=parser.parse_args()
    result=assess(args.repo.resolve(), args.fixture)
    body=json.dumps(result,sort_keys=True,indent=2)+"\n"
    if args.output:
        args.output.write_text(body,encoding="utf-8")
    else:
        print(body,end="")
    if result["issue_count"] or args.require_global:
        sys.exit(20)


if __name__ == "__main__":
    main()
