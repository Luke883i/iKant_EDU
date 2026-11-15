"""Cold Host EDU manual handoff against the ACTUAL PR HEAD tree and Git archive.
Git checkout = CI fixture; this does NOT authenticate GitHub API or native UI.
"""
import io
import importlib.util
import json
import pathlib
import subprocess
import tempfile
import unittest
import zipfile

ROOT=pathlib.Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location("manual",ROOT/"scripts/project-manual-source.py")
M=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(M)

def git(*args):
    return subprocess.check_output(["git",*args],cwd=ROOT)

class ManualFullHead(unittest.TestCase):
    def test_exact_head_zip_tree_to_original_node_loader(self):
        head=git("rev-parse","HEAD").decode().strip()
        tree=git("rev-parse","HEAD^{tree}").decode().strip()
        rows=[]
        for entry in git("ls-tree","-r","-t","-z","HEAD").split(b"\0"):
            if not entry:continue
            metadata,rawpath=entry.split(b"\t",1)
            mode,kind,sha=metadata.decode().split()
            rows.append({"path":rawpath.decode(),"mode":mode,"type":kind,"sha":sha})
        self.assertTrue(len(rows)>100)
        self.assertTrue(any(r["path"]=="contracts/project-session-source.json" for r in rows))
        raw=git("archive","--format=zip","--prefix=iKant_EDU-"+head+"/","HEAD")
        self.assertLess(len(raw),30*1024*1024)
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            self.assertLess(len(z.infolist()),3000)
            self.assertTrue(any(n.filename.endswith("/TERMS.md") for n in z.infolist()))
        api={"source_head":head,"source_tree":tree,"live_head":head,"truncated":False,"tree":rows}
        plan=M.convert(io.BytesIO(raw),api,head,tree)
        expected=json.loads(git("show","HEAD:contracts/project-session-source.json"))["paths"]
        expected=set(expected)|{"contracts/project-session-source.json"}
        self.assertEqual(set(x["path"] for x in plan["files"]),expected)
        with tempfile.TemporaryDirectory() as tmp:
            root=pathlib.Path(tmp)
            src=root/"original-source"
            data=root/"source-plan.json"
            data.write_text(json.dumps(plan),encoding="utf8")
            run=subprocess.run(["node",str(ROOT/"scripts/project-repo-loader.mjs"),
                str(data),str(src),head,tree],capture_output=True,text=True,timeout=90)
            self.assertEqual(run.returncode,0,run.stderr)
            out=json.loads(run.stdout)
            self.assertEqual(out["status"],"SOURCE_REOPENED")
            self.assertEqual(out["objects"],len(expected))
            for p in ["TERMS.md","host/c135-edu-v2-owner.mjs",
                "scripts/project-repo-loader.mjs","contracts/project-session-source.json"]:
                self.assertEqual((src/p).read_bytes(),git("show","HEAD:"+p))
            badhead="f"*40 if head!="f"*40 else "e"*40
            forged=subprocess.run(["node",str(ROOT/"scripts/project-repo-loader.mjs"),
                str(data),str(root/"other-source"),badhead,tree],
                capture_output=True,text=True,timeout=20)
            self.assertNotEqual(forged.returncode,0)
            self.assertFalse((root/"other-source"/".project-source-readback.json").exists())
        print(json.dumps({"status":"FULL_HEAD_ZIP_NODE_LOADER_PASS",
            "head":head,"tree":tree,"api_tree_entries":len(rows),
            "archive_bytes":len(raw),"materialized_members":len(expected),
            "live_github_origin_attested":False,"native_delivery_attested":False}))

if __name__=="__main__":unittest.main()
