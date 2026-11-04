import base64
import hashlib
import importlib.util
import io
import json
import pathlib
import stat
import unittest
import zipfile

ROOT=pathlib.Path(__file__).resolve().parents[1]
S=importlib.util.spec_from_file_location("manual",ROOT/"scripts/project-manual-source.py")
M=importlib.util.module_from_spec(S);S.loader.exec_module(M)

def gid(t,b):
    return hashlib.sha1(t.encode()+b" "+str(len(b)).encode()+b"\0"+b).hexdigest()

class ManualSource(unittest.TestCase):
    def setUp(self):
        self.head="a"*40
        self.raw={"a.mjs":b"export const test=1;\n"}
        self.raw["contracts/project-session-source.json"]=json.dumps(
            {"schema":"ikant-le-project-session-source/v1","paths":["a.mjs"]}).encode()
        self.blobs={p:gid("blob",b) for p,b in self.raw.items()}
        c=gid("tree",b"100644 project-session-source.json\0"+bytes.fromhex(self.blobs["contracts/project-session-source.json"]))
        t=gid("tree",b"100644 a.mjs\0"+bytes.fromhex(self.blobs["a.mjs"])+b"40000 contracts\0"+bytes.fromhex(c))
        self.tree=t
        self.api={"source_head":self.head,"source_tree":t,"live_head":self.head,"truncated":False,"tree":[
            {"path":"a.mjs","sha":self.blobs["a.mjs"],"mode":"100644","type":"blob"},
            {"path":"contracts","sha":c,"mode":"040000","type":"tree"},
            {"path":"contracts/project-session-source.json","sha":self.blobs["contracts/project-session-source.json"],"mode":"100644","type":"blob"}
        ]}
    def archive(self,change=None):
        b=io.BytesIO()
        with zipfile.ZipFile(b,"w") as z:
            for p,raw in self.raw.items():
                name="iKant_EDU-"+self.head+"/"+p
                value=change(p,raw) if change else raw
                z.writestr(name,value)
        b.seek(0)
        return b
    def test_positive_exact_zip_transport_plan(self):
        plan=M.convert(self.archive(),self.api,self.head,self.tree)
        self.assertEqual(plan["source_tree"],self.tree)
        self.assertEqual({x["path"]:base64.b64decode(x["content"]) for x in plan["files"]},self.raw)
        self.assertEqual(plan["truncated"],False)
    def test_negative_source_and_archive_mutations(self):
        for name,modify in [
          ("wrong_head",lambda z,a,h,t:(z,a,"b"*40,t)),
          ("wrong_tree",lambda z,a,h,t:(z,a,h,"b"*40)),
          ("api_drift",lambda z,a,h,t:(z,{**a,"live_head":"b"*40},h,t)),
          ("truncated",lambda z,a,h,t:(z,{**a,"truncated":True},h,t)),
          ("missing",lambda z,a,h,t:(self.archive(lambda p,b:b if p!="a.mjs" else b""),a,h,t)),
          ("mutated",lambda z,a,h,t:(self.archive(lambda p,b:b+b"tamper" if p=="a.mjs" else b),a,h,t)),
          ("wrong_manifest",lambda z,a,h,t:(self.archive(lambda p,b:b+b"!" if p.endswith(".json") else b),a,h,t)),
        ]:
            with self.subTest(name=name):
                z,a,h,t=modify(self.archive(),self.api,self.head,self.tree)
                with self.assertRaises((ValueError,KeyError,json.JSONDecodeError)):
                    M.convert(z,a,h,t)
    def test_retired_LE_archive_prefix_denied(self):
        b=io.BytesIO()
        with zipfile.ZipFile(b,"w") as z:
            for p,raw in self.raw.items():
                z.writestr("iKant_LE-"+self.head+"/"+p,raw)
        b.seek(0)
        with self.assertRaisesRegex(ValueError,"ARCHIVE_WRONG_HEAD_PREFIX"):
            M.convert(b,self.api,self.head,self.tree)

    def test_zip_symlink_rejected(self):
        b=io.BytesIO()
        with zipfile.ZipFile(b,"w") as z:
            for p,raw in self.raw.items():z.writestr("iKant_EDU-"+self.head+"/"+p,raw)
            symlink=zipfile.ZipInfo("iKant_EDU-"+self.head+"/link")
            symlink.create_system=3
            symlink.external_attr=(stat.S_IFLNK|0o777)<<16
            z.writestr(symlink,"target")
        b.seek(0)
        with self.assertRaisesRegex(ValueError,"ARCHIVE_SPECIAL_MEMBER"):
            M.convert(b,self.api,self.head,self.tree)


    def test_cold_host_bootstraps_transport_tools_from_zip_with_no_bundle(self):
        import os
        import subprocess
        import tempfile
        assets={
            **self.raw,
            "scripts/project-manual-source.py":(ROOT/"scripts/project-manual-source.py").read_bytes(),
            "scripts/project-repo-loader.mjs":(ROOT/"scripts/project-repo-loader.mjs").read_bytes(),
        }
        shas={p:gid("blob",b) for p,b in assets.items()}
        c=gid("tree",b"100644 project-session-source.json\0"+bytes.fromhex(shas["contracts/project-session-source.json"]))
        script_rows=sorted(p for p in assets if p.startswith("scripts/"))
        scripts=gid("tree",b"".join(b"100644 "+p.split("/")[-1].encode()+b"\0"+bytes.fromhex(shas[p]) for p in script_rows))
        tree=gid("tree",b"100644 a.mjs\0"+bytes.fromhex(shas["a.mjs"])+b"40000 contracts\0"+bytes.fromhex(c)+b"40000 scripts\0"+bytes.fromhex(scripts))
        rows=[{"path":p,"sha":shas[p],"mode":"100644","type":"blob"} for p in assets]
        rows.extend([{"path":"contracts","sha":c,"mode":"040000","type":"tree"},
                     {"path":"scripts","sha":scripts,"mode":"040000","type":"tree"}])
        api={"source_head":self.head,"source_tree":tree,"live_head":self.head,"truncated":False,"tree":rows}
        doc=(ROOT/"docs/PROJECT_SESSION_REPO_FIRST.md").read_text()
        marker=chr(96)*3+"python\n"
        start=doc.index(marker)+len(marker)
        snippet=doc[start:doc.index("\n"+chr(96)*3,start)]
        with tempfile.TemporaryDirectory() as temp:
            temp=pathlib.Path(temp)
            archive=temp/"source.zip";j=temp/"api.json";tools=temp/"tools"
            with zipfile.ZipFile(archive,"w") as z:
                for p,b in assets.items():z.writestr("iKant_EDU-"+self.head+"/"+p,b)
            j.write_text(json.dumps(api))
            env={**os.environ,"FROZEN_HEAD":self.head,"FROZEN_TREE":tree,
                "API_TREE_JSON":str(j),"SOURCE_ZIP":str(archive),"FRESH_TOOL_DIR":str(tools)}
            run=subprocess.run(["python3","-c",snippet],capture_output=True,text=True,env=env)
            self.assertEqual(run.returncode,0,run.stderr)
            for name in ("project-manual-source.py","project-repo-loader.mjs"):
                self.assertEqual((tools/name).read_bytes(),assets["scripts/"+name])
            plan=temp/"plan.json";stage=temp/"source"
            run=subprocess.run(["python3",str(tools/"project-manual-source.py"),
                "--source-zip",str(archive),"--api-tree",str(j),"--head",self.head,
                "--tree",tree,"--output-plan",str(plan)],capture_output=True,text=True)
            self.assertEqual(run.returncode,0,run.stderr)
            run=subprocess.run(["node",str(tools/"project-repo-loader.mjs"),
                str(plan),str(stage),self.head,tree],capture_output=True,text=True)
            self.assertEqual(run.returncode,0,run.stderr)
            self.assertEqual((stage/"a.mjs").read_bytes(),self.raw["a.mjs"])
            self.assertTrue((stage/".project-source-readback.json").exists())
            forged={**api,"source_tree":"f"*40}
            j.write_text(json.dumps(forged))
            other=temp/"forged-tools"
            bad={**env,"FROZEN_TREE":"f"*40,"FRESH_TOOL_DIR":str(other)}
            x=subprocess.run(["python3","-c",snippet],capture_output=True,text=True,env=bad)
            self.assertNotEqual(x.returncode,0)
            self.assertFalse(other.exists())

if __name__=="__main__":unittest.main()
