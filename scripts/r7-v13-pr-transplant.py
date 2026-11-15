#!/usr/bin/env python3
"""R7/V13: transplant 35 local-source semantic commits onto actual GitHub main.

Run from a clean, genuine GitHub checkout of the draft branch. No push here.
Copy this script OUTSIDE the checkout before execution: it is removed from
the final V13 tree. Never promote local test receipts to CI/owner evidence.
"""
import argparse
import json
from pathlib import Path
import subprocess
import sys

BASE="8cb80d2230919220ac4b7a1cfcd80950d8467848"
BASE_TREE="4cff62ed12f79390a059784bcbf9770788a3a4d1"
SOURCE_ROOT="27194bb153ff0ab8500bb75277d4d5f7ebb60d45"
SOURCE_HEAD="86e20abb714fa4000352b61a0c0abf8795775318"
TARGET_TREE="07f135d6d54ff69b78cc9e7215daa0bdafa9f84c"
STAGING=["docs/R7_V13_PR_TRANSPLANT.md","scripts/r7-v13-pr-transplant.py"]

def git(repo,*args):
    p=subprocess.run(["git","-C",str(repo),*args],text=True,capture_output=True)
    if p.returncode:
        raise RuntimeError("git "+' '.join(args)+" failed: "+p.stderr[:1200])
    return p.stdout.strip()

def require(ok,msg):
    if not ok: raise RuntimeError(msg)

def run(args):
    repo=args.repo.resolve();bundle=args.bundle.resolve()
    require(bundle.is_file(),"BUNDLE_MISSING")
    require(not git(repo,"status","--porcelain"),"WORKTREE_NOT_CLEAN")
    require(git(repo,"rev-parse",BASE)==BASE,"BASE_COMMIT_MISSING")
    head=git(repo,"rev-parse","HEAD")
    require(git(repo,"merge-base",BASE,head)==BASE,"NOT_DESCENDANT_OF_PINNED_MAIN")
    if args.draft:
        changed=git(repo,"diff","--name-only",BASE,head).splitlines()
        require(sorted(changed)==sorted(STAGING),"STAGING_DIFF_NOT_EXACT")
        require(all((repo/p).is_file() for p in STAGING),"STAGING_FILES_NOT_PRESENT")
        git(repo,"rm","--",*STAGING)
        git(repo,"commit","-m","chore(r7-v13): retire staging files before exact semantic replay")
    else:
        require(head==BASE,"NON_DRAFT_MUST_START_ON_REAL_MAIN")
    require(git(repo,"rev-parse","HEAD^{tree}")==BASE_TREE,"BASE_TREE_MISMATCH")
    git(repo,"fetch","--no-tags",str(bundle),"+refs/heads/v13:refs/r7-v13/source")
    require(git(repo,"rev-parse","refs/r7-v13/source")==SOURCE_HEAD,"SOURCE_HEAD_DRIFT")
    require(git(repo,"rev-parse",SOURCE_ROOT+"^{tree}")==BASE_TREE,"SYNTHETIC_ROOT_TREE_DRIFT")
    sources=git(repo,"rev-list","--reverse",SOURCE_ROOT+".."+SOURCE_HEAD).splitlines()
    require(len(sources)==35,"SOURCE_HISTORY_LENGTH_DRIFT")
    receipt={"schema":"r7-v13-real-main-transplant/v1","base":BASE,"steps":[],"product_go":False}
    for index,source in enumerate(sources,1):
        require(len(git(repo,"rev-list","--parents","-n","1",source).split())==2,
                "MERGE_IN_SOURCE_HISTORY")
        previous=git(repo,"rev-parse","HEAD")
        git(repo,"cherry-pick","--no-commit",source)
        git(repo,"commit","--no-gpg-sign","-C",source)
        observed=git(repo,"rev-parse","HEAD^{tree}")
        expected=git(repo,"rev-parse",source+"^{tree}")
        require(observed==expected,"STEP_TREE_DRIFT:"+str(index))
        receipt["steps"].append({"n":index,"source":source,
                                 "imported":git(repo,"rev-parse","HEAD"),
                                 "tree":observed,"parent":previous})
    require(git(repo,"rev-parse","HEAD^{tree}")==TARGET_TREE,
            "FINAL_TREE_NOT_V13")
    require(not git(repo,"status","--porcelain"),"DIRTY_AFTER_REPLAY")
    receipt.update({"status":"REPLAY_ONLY_CI_AND_OWNERS_OPEN",
                    "head":git(repo,"rev-parse","HEAD"),"tree":TARGET_TREE})
    out=args.receipt.resolve();out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(receipt,indent=2,sort_keys=True)+"\n")
    print(json.dumps({"status":receipt["status"],"head":receipt["head"],
                      "tree":TARGET_TREE,"commits":35,"receipt":str(out)}))

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--repo",type=Path,default=Path("."))
    ap.add_argument("--bundle",type=Path,required=True)
    ap.add_argument("--draft",action="store_true",help="remove exact staging files")
    ap.add_argument("--receipt",type=Path,default=Path("/tmp/r7-v13-transplant.json"))
    try: run(ap.parse_args())
    except Exception as exc:
        print("R7_V13_TRANSPLANT_BLOCKED:",exc,file=sys.stderr)
        sys.exit(20)
