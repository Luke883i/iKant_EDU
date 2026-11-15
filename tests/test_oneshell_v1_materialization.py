"""Synthetic qualification only; real full-head integration is an independent gate."""
import importlib.util
import io
import json
import pathlib
import subprocess
import tempfile
import unittest
import zipfile

ROOT=pathlib.Path(__file__).resolve().parents[1]
def load(relative,name):
 spec=importlib.util.spec_from_file_location(name,ROOT/relative)
 module=importlib.util.module_from_spec(spec)
 spec.loader.exec_module(module)
 return module

builder=load("scripts/oneshell-v1-build.py","v1builder")
verifier=load("scripts/oneshell-v1-verify.py","v1verifier")

def git(root,*argv):
 return subprocess.run(["git","-C",str(root),*argv],capture_output=True,check=True).stdout.decode().strip()

class SourceMaterialization(unittest.TestCase):
 def setUp(self):
  tmp=tempfile.TemporaryDirectory()
  self.addCleanup(tmp.cleanup)
  self.root=pathlib.Path(tmp.name)
  self.repo=self.root/"checkout"
  self.repo.mkdir()
  git(self.repo,"init","-b","main")
  git(self.repo,"config","user.email","fixture@example.invalid")
  git(self.repo,"config","user.name","Synthetic Fixture")

  base_files={
   "PROMPT_INNESCO.md":("Old "+builder.OLD_HEAD+" / "+builder.OLD_TREE+"\n").encode(),
   "repo_original/docs/IKANT_DOCUMENT_ATLAS.md":b"old source atlas",
   "plugin_source/plugins/ikant-le-session-chat/server/server.mjs":b"old source server",
  }
  for name in builder.ORIENTATION:
   base_files["orientation/"+name]=("orientation "+name).encode()
  for name in builder.SLIDES:
   base_files[name]=("slide "+name+" "+builder.OLD_HEAD).encode()
  self.baseline=self.root/"old.zip"
  manifest={"source_head":builder.OLD_HEAD,"source_tree":builder.OLD_TREE,"files":{
    name:{"bytes":len(data),"sha256":builder.sha(data),
          "git_blob_sha1":builder.git_blob(data) if builder.source_path(name) else None}
    for name,data in base_files.items()
  }}
  with zipfile.ZipFile(self.baseline,"w") as z:
   for name,raw in base_files.items():
    z.writestr(name,raw)
   z.writestr("MANIFEST.json",builder.canonical_json(manifest))

  for name in list(builder.ORIENTATION)+list(builder.MANDATORY)+[
    "docs/IKANT_DOCUMENT_ATLAS.md",
    "plugins/ikant-le-session-chat/server/server.mjs",
  ]:
   p=self.repo/name
   p.parent.mkdir(exist_ok=True,parents=True)
   if not p.exists():
    p.write_bytes(("verified synthetic Git blob of "+name+"\n").encode())
  for name in base_files:
   src=builder.source_path(name)
   if src:
    p=self.repo/src
    p.parent.mkdir(exist_ok=True,parents=True)
    p.write_bytes(("new source at "+src+"\n").encode())
  (self.repo/"docs"/"ONESHELL_V1_MATERIALIZATION.txt").write_bytes(
      (ROOT/"docs"/"ONESHELL_V1_MATERIALIZATION.txt").read_bytes())
  git(self.repo,"add",".")
  git(self.repo,"commit","-m","synthetic deterministic source")
  self.head=git(self.repo,"rev-parse","HEAD")
  self.tree=git(self.repo,"rev-parse","HEAD^{tree}")
  self.old=(builder.HEAD,builder.TREE,builder.BASELINE_SHA256,
            verifier.HEAD,verifier.TREE,verifier.BASELINE_SHA256)
  builder.HEAD=verifier.HEAD=self.head
  builder.TREE=verifier.TREE=self.tree
  builder.BASELINE_SHA256=verifier.BASELINE_SHA256=builder.sha(self.baseline.read_bytes())
  self.addCleanup(self.restore)

 def restore(self):
  builder.HEAD,builder.TREE,builder.BASELINE_SHA256,\
   verifier.HEAD,verifier.TREE,verifier.BASELINE_SHA256=self.old

 def make(self,name):
  path=self.root/name
  builder.build(self.repo,self.baseline,path)
  return path

 def test_exact_source_and_reproducibility(self):
  a,b=self.make("one.zip"),self.make("two.zip")
  self.assertEqual(a.read_bytes(),b.read_bytes())
  with zipfile.ZipFile(a) as z,zipfile.ZipFile(self.baseline) as old:
   self.assertTrue(set(old.namelist()).issubset(z.namelist()))
   for name in builder.MANDATORY:
    self.assertEqual(z.read("repo_original/"+name),(self.repo/name).read_bytes())
  result=verifier.verify(a,self.repo,self.baseline)
  self.assertEqual(result["status"],"SOURCE_EXACT")

 def test_stale_main_stops(self):
  builder.HEAD="0"*40
  with self.assertRaisesRegex(ValueError,"STOP_SOURCE_LOCK_STALE"):
   self.make("invalid.zip")

 def test_missing_original_stops(self):
  git(self.repo,"rm","docs/IKANT_DOCUMENT_ATLAS.md")
  git(self.repo,"commit","-m","remove mandatory source")
  builder.HEAD=git(self.repo,"rev-parse","HEAD")
  builder.TREE=git(self.repo,"rev-parse","HEAD^{tree}")
  with self.assertRaisesRegex(ValueError,"GIT_SOURCE_UNAVAILABLE"):
   self.make("missing.zip")

 def test_tampered_root_baseline_stops(self):
  mutated=self.root/"altered.zip"
  with zipfile.ZipFile(self.baseline) as prior,zipfile.ZipFile(mutated,"w") as z:
   for name in prior.namelist():
    d=prior.read(name)
    if name=="slides/00_ROUTE.md":
     d+=b"unauthorized change"
    z.writestr(name,d)
  with self.assertRaisesRegex(ValueError,"BASELINE_ROOT_MISMATCH"):
   builder.build(self.repo,mutated,self.root/"reject.zip")

 def test_source_omission_even_with_rewritten_manifest_stops(self):
  good=self.make("good.zip")
  bad=self.root/"self_consistent_missing.zip"
  missing="repo_original/host/c135-edu-v2-owner.mjs"
  with zipfile.ZipFile(good) as source:
   manifest=json.loads(source.read("MANIFEST.json"))
   del manifest["files"][missing]
   with zipfile.ZipFile(bad,"w") as z:
    for name in source.namelist():
     if name==missing:
      continue
     if name=="MANIFEST.json":
      z.writestr(name,builder.canonical_json(manifest))
     else:
      z.writestr(name,source.read(name))
  with self.assertRaisesRegex(ValueError,"REQUIRED_SOURCE_ABSENT"):
   verifier.verify(bad,self.repo,self.baseline)

if __name__=="__main__":
 unittest.main()
