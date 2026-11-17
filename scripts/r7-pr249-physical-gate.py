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
FOUNDING = "7cd95a485f71008dd6aa7c3da6aa76bd0f3ead65"
ROOTS = [".github", "contracts", "host", "project", "scripts", "src", "tests"]
ROOT_FILES = [".gitignore", "ADMISSION.json", "AGENTS.md", "BOOTSTRAP.json", "LICENSE", "README.md", "TERMS.md", "ikant.mjs", "package.json"]
ALLOWED_ADDITIONS = {
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
        observed = listing(repo, "HEAD")
        # Review the ORIGINAL PR249 baseline independently, then qualify every
        # later successor against its exact full-HEAD V5-B source policy.
        # A newer HEAD can never silently rewrite a founding source receipt.
        if head != FOUNDING:
            if subprocess.run(["git", "-C", str(repo), "merge-base",
                               "--is-ancestor", FOUNDING, "HEAD"],
                              capture_output=True).returncode != 0:
                issues.append("PR249_FOUNDING_NOT_ANCESTOR")
            # Preserve the original PR249 epoch independently. A later PR251
            # may only qualify via the complete HEAD-exact V5-B successor; never
            # inherit an older source receipt or infer human/provider approval.
            pr251 = (repo / "contracts/governance/changes/pr251-source-successor.json").is_file()
            fn = "qualifyPr251SourceEpoch" if pr251 else "qualifyPr249SourceEpoch"
            expected = ("PR251_EXACT_SOURCE_ONLY_REVIEW_REQUIRED" if pr251 else
                        "PR249_CHECKOUT_REPAIR_SOURCE_ONLY_REVIEW_REQUIRED")
            probe = subprocess.run([
                "node", "--input-type=module", "-e",
                f"import {{{fn}}} from './scripts/v5b-repository-governance-audit.mjs';"
                f"process.stdout.write(JSON.stringify({fn}()));"
            ], cwd=repo, capture_output=True, text=True, timeout=45)
            if probe.returncode != 0:
                issues.append("SOURCE_SUCCESSOR_CHECK_UNEXECUTABLE")
            else:
                qualification = json.loads(probe.stdout)
                review = qualification.get("review" if pr251 else "owner_review")
                if (qualification.get("ok") is not True
                        or qualification.get("status") != expected
                        or qualification.get("authority") != 0
                        or qualification.get("product_go") is not False
                        or review != "NOT_ATTESTED"
                        or (pr251 and qualification.get("source_main") !=
                            "e270c6e2cc772f960126eecea9f50501339e3656")):
                    issues.append("SOURCE_SUCCESSOR_NOT_QUALIFIED:" +
                                  str(qualification.get("edge", "UNKNOWN"))[:100])
        current = listing(repo, FOUNDING)
        roots = sorted({p.split("/", 1)[0] for p in observed if "/" in p})
        root_files = sorted(p for p in observed if "/" not in p)
        if roots != ROOTS:
            issues.append("ROOT_SET_DRIFT")
        if root_files != sorted(ROOT_FILES):
            issues.append("ROOT_FILE_SET_DRIFT")
        # PR249 owns only a prospective seven-root source epoch; this is not a
        # human owner approval, and old V13 blobs remain reachable in Git.
        founding_path = repo / 'contracts/r7-pr249-founding-contract.json'
        contract = json.loads(founding_path.read_text(encoding='utf-8'))
        epoch = contract.get('pr249_epoch', {})
        if (contract.get('schema') != 'ikant-r7-pr249-founding-contract/v1'
                or contract.get('authority') != 0 or contract.get('product_go') is not False
                or epoch.get('schema') != 'ikant-r7-pr249-source-successor/v1'
                or epoch.get('source_commit') != V13
                or epoch.get('source_tree') != V13_TREE
                or epoch.get('review_required') is not True
                or epoch.get('product_go') is not False):
            issues.append('PR249_EPOCH_CONTRACT_INVALID')
        approved_mods = {r['path']:r for r in epoch.get('modified_originals', [])
                         if isinstance(r, dict) and isinstance(r.get('path'), str)}
        exact_mods = {'.github/workflows/c53-physical-closure-hardening.yml',
                      '.github/workflows/project-session-repo-first.yml',
                      'scripts/cora-minimal-absorption.mjs',
                      'project/docs/IKANT_DOCUMENT_ATLAS.md',
                      'project/docs/START_HERE.md',
                      'scripts/v5b-repository-governance-audit.mjs',
                      'tests/artifacts/qualification/c51-candidate-blob-manifest.json',
                      'tests/artifacts/qualification/c51-supersystem-dod.json',
                      'tests/artifacts/qualification/c52-candidate-blob-manifest.json',
                      'tests/artifacts/qualification/c52-runtime-physical-closure-dod.json'}
        if set(approved_mods) != exact_mods:
            issues.append('PR249_MODIFICATION_REGISTER_DRIFT')
        if sorted(epoch.get('additions', [])) != sorted(ALLOWED_ADDITIONS):
            issues.append('PR249_ADDITION_REGISTER_DRIFT')
        for path, orig in source.items():
            cur = current.get(path)
            if cur is None:
                issues.append("SOURCE_PATH_LOST:" + path)
            elif cur != orig:
                row = approved_mods.get(path)
                if (row is None or path not in exact_mods or cur[0]!=orig[0] or
                        cur[1]!='blob' or row.get('original_sha')!=orig[2] or
                        row.get('prospective_sha')!=cur[2]):
                    issues.append("SOURCE_BLOB_OR_MODE_DRIFT:" + path)
        extras = sorted(set(current) - set(source))
        for path in extras:
            if path not in ALLOWED_ADDITIONS:
                issues.append("UNREGISTERED_ADDITION:" + path)
            elif current[path][0] != "100644" or current[path][1] != "blob":
                issues.append("ADDITION_MODE_OR_KIND_DRIFT:" + path)
            elif (path!='contracts/r7-pr249-founding-contract.json' and
                  current[path][2] != epoch.get('addition_pins',{}).get(path)):
                issues.append("ADDITION_BLOB_DRIFT:" + path)
        if len(source) != 1639:
            issues.append("V13_FILE_CARDINALITY_DRIFT")
        if not issues:
            result = "SOURCE_ONLY_PASS_FIXTURE" if fixture else "SOURCE_ONLY_PASS_REAL_MAIN"
        else:
            result = "SOURCE_ONLY_REFUTED"
        return {"schema":"r7-pr249-physical-gate/v1", "status":result, "head":head,
                "head_tree":observed_tree,"v13_source":V13, "source_files":len(source),
                "observed_files":len(observed), "new_additions":len(extras),"roots":roots,
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
