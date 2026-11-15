#!/usr/bin/env python3
"""R7/V13 safe transplant: exactly one Git merge with two explicit parent roles.

First parent: this PR's genuine-main draft head.
Second parent: V13's immutable local synthetic-source history (NOT GitHub main).
The final tree is exactly V13. All 35 semantic commits survive as source history.
No push is performed: inspect receipt and gate CI/owner review independently.
"""
import argparse,json,re,subprocess,sys
from pathlib import Path
BASE="8cb80d2230919220ac4b7a1cfcd80950d8467848"
BASE_TREE="4cff62ed12f79390a059784bcbf9770788a3a4d1"
ROOT="27194bb153ff0ab8500bb75277d4d5f7ebb60d45"
SOURCE="86e20abb714fa4000352b61a0c0abf8795775318"
TREE="07f135d6d54ff69b78cc9e7215daa0bdafa9f84c"
FILES=["docs/R7_V13_PR_TRANSPLANT.md","scripts/r7-v13-pr-transplant.py"]
REF="refs/r7-v13/imported"
def g(repo,*args):
 p=subprocess.run(["git","-C",str(repo),*args],text=True,capture_output=True)
 if p.returncode:raise RuntimeError("GIT_BLOCKED:"+repr(args)+":"+p.stderr[:400])
 return p.stdout.strip()
def need(c,edge):
 if not c:raise RuntimeError(edge)
def run(a):
 repo=a.repo.resolve(); bundle=a.bundle.resolve()
 need(bundle.is_file(),"BUNDLE_MISSING")
 need(not g(repo,"status","--porcelain"),"DIRTY_CHECKOUT")
 need(g(repo,"rev-parse",BASE)==BASE,"REAL_MAIN_NOT_AVAILABLE")
 need(g(repo,"rev-parse",BASE+"^{tree}")==BASE_TREE,"REAL_MAIN_TREE_DRIFT")
 draft=g(repo,"rev-parse","HEAD")
 need(g(repo,"merge-base",BASE,draft)==BASE,"DRAFT_BASE_NOT_MAIN")
 need(sorted(g(repo,"diff","--name-only",BASE,draft).splitlines())==sorted(FILES),"DRAFT_ONLY_TWO_FILES_REQUIRED")
 need(all((repo/f).is_file() for f in FILES),"STAGING_FILE_MISSING")
 need(subprocess.run(["git","-C",str(repo),"show-ref","--verify","--quiet",REF]).returncode!=0,"IMPORTED_REF_EXISTS")
 g(repo,"fetch","--no-tags",str(bundle),"+refs/heads/v13:refs/r7-v13/source")
 need(g(repo,"rev-parse","refs/r7-v13/source")==SOURCE,"SOURCE_HEAD_DRIFT")
 need(g(repo,"rev-parse",ROOT+"^{tree}")==BASE_TREE,"SOURCE_ROOT_TREE_DRIFT")
 need(g(repo,"rev-parse",SOURCE+"^{tree}")==TREE,"V13_FINAL_TREE_DRIFT")
 commits=g(repo,"rev-list","--reverse",ROOT+".."+SOURCE).splitlines()
 need(len(commits)==35 and all(len(g(repo,"rev-list","--parents","-n","1",x).split())==2 for x in commits),"SEMANTIC_HISTORY_INVALID")
 msg=("merge(r7-v13): preserve 35 original semantic commits in evidence parent\n\n"
      "First parent = real GitHub main draft.\n"
      "Second parent = synthetic V13 source epochs, not former GitHub main.\n"
      "Exact source tree preserved; owner review and CI not attested.\n")
 c=subprocess.run(["git","-C",str(repo),"commit-tree",TREE,"-p",draft,"-p",SOURCE],
   input=msg,text=True,capture_output=True)
 need(c.returncode==0,"MERGE_CREATION_FAILED:"+c.stderr[:400])
 merged=c.stdout.strip(); need(re.fullmatch("[a-f0-9]{40}",merged)!=None,"MERGE_HASH_INVALID")
 need(g(repo,"rev-parse",merged+"^{tree}")==TREE,"MERGE_CHANGED_TREE")
 need(g(repo,"rev-list","--parents","-n","1",merged).split()==[merged,draft,SOURCE],"PARENT_ORDER_MISMATCH")
 g(repo,"merge-base","--is-ancestor",SOURCE,merged)
 g(repo,"merge-base","--is-ancestor",draft,merged)
 g(repo,"update-ref",REF,merged,"0"*40)
 need(g(repo,"rev-parse","HEAD")==draft,"DRAFT_BRANCH_WAS_CHANGED")
 receipt={"schema":"r7-v13-2parent-semantic-import/v1","status":"LOCAL_ONLY_NOT_PUSHED",
   "base":BASE,"staging_head":draft,"source_head":SOURCE,"merge_commit":merged,
   "tree":TREE,"semantic_commits":35,"synthetic_history_explicit":True,
   "ci":"NOT_ATTESTED","independent_owner_review":"NOT_ATTESTED",
   "cora_process":"DEBT_BLOCKED","global_dod":"HOLD","product_go":False}
 out=a.receipt.resolve();out.parent.mkdir(parents=True,exist_ok=True)
 out.write_text(json.dumps(receipt,sort_keys=True,indent=2)+"\n")
 print(json.dumps(receipt,sort_keys=True))
if __name__=="__main__":
 p=argparse.ArgumentParser()
 p.add_argument("--repo",type=Path,default=Path("."))
 p.add_argument("--bundle",type=Path,required=True)
 p.add_argument("--receipt",type=Path,default=Path("/tmp/r7-v13-pr-import.json"))
 try:run(p.parse_args())
 except Exception as e:print("R7_V13_IMPORT_BLOCKED:",e,file=sys.stderr);sys.exit(20)
