#!/usr/bin/env python3
"""Deterministic HOST candidate: one exact local Git tree -> prompt + ZIP. Not an installer."""
import argparse,hashlib,json,subprocess,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
SHA=lambda b:hashlib.sha256(b).hexdigest()
GIT=lambda *args:subprocess.check_output(['git',*args],cwd=ROOT).decode().strip()
FIVE=('README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md')
def zipwrite(z,name,content):
 info=zipfile.ZipInfo(name,(1980,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
 z.writestr(info,content)
def build(out,expected_tree,expected_commit=None):
 head=GIT('rev-parse','HEAD')
 if expected_commit is not None and expected_commit!=head:raise ValueError('SOURCE_COMMIT_STALE')
 tree=GIT('rev-parse','HEAD^{tree}')
 if expected_tree!=tree:raise ValueError('SOURCE_LOCK_STALE')
 if GIT('status','--porcelain'):raise ValueError('SOURCE_DIRTY_NOT_FROZEN')
 files=GIT('ls-files').splitlines();records={}
 for name in files:
  raw=(ROOT/name).read_bytes();blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
  if GIT('rev-parse',f'HEAD:{name}')!=blob:raise ValueError('SOURCE_BYTES_MISMATCH:'+name)
  records[name]={'git_blob_sha1':blob,'sha256':SHA(raw),'bytes':len(raw)}
 prompt=("iKant OneShell HOST Project candidate. AUTHORITY=0; this ZIP does not install or consent.\n"
  f"SOURCE_TREE_SHA1={tree}\n"
  "GATE 00 INDEX: verify ZIP + external source tree against LIVE GitHub main. If stale: STOP SOURCE_LOCK_STALE, never repin silently.\n"
  "GATE 01 ADMISSION: only NEW exact human `avvia iKant`; read pinned README.md, BOOTSTRAP.json, ADMISSION.json, AGENTS.md, TERMS.md; show TERMS verbatim; STOP.\n"
  "GATE 02 TERMS: later exact `I ACCEPT`; present original standard intro; STOP.\n"
  "GATE 03 MODE: later exact `EDU` (recommended experiment) or `CANONICAL` (requires real MCP-native owner). STOP.\n"
  "EDU: C72/v2 is not C72/v1. Require verified Git-source carrier, C135 EDU/v2 owner, original C107-v2/C70/C100/C87 with independent readback and C125; otherwise NO_VOICE.\n"
  "CANONICAL: MCP source in ZIP != connected plugin; require transport auth, native event identity, original C59 ACTIVE and readback; otherwise NO_VOICE.\n"
  "ONE SHELL: fill fixed six slides ESITO,A,B,PROVA,EDGE,NEXT from original evidence only.\n"
  "ESITO: only verified fact. A: exact original C87 voice_utf8 via original C125 independent readback, otherwise NO_VOICE.\n"
  "B: HOST analysis explicitly labeled. PROVA: independent sha256 proof pointer, not invented link.\n"
  "EDGE: first owner-observed open edge; NEXT: exactly one owner-authorized action or STOP.\n"
  "Never infer ACTIVE, persistence, cognition, plugin installation or human trial success from caller JSON, model prose, historic ZIP or tests.\n"
  "Repo main alone owns rules, ZIP carries immutable source candidate. Project update is a distinct human-controlled transaction.\n").encode()
 manifest={'schema':'ikant-le-s04-project-bundle/v1','git_tree_sha1':tree,'source_commit_sha1':head,
  'source_ref_kind':'LOCAL_PINNED_TREE_REMOTE_MAIN_NOT_ATTESTED','live_main_verified':False,
  'native_plugin_installed':False,'five_blob_lock':{p:records[p]['git_blob_sha1'] for p in FIVE},
  'members':records,'prompt_sha256':SHA(prompt)}
 out.mkdir(parents=True,exist_ok=True);(out/'PROMPT_INNESCO_PREPR.txt').write_bytes(prompt)
 with zipfile.ZipFile(out/'PROJECT_PREPR.zip','w') as z:
  zipwrite(z,'PROMPT_INNESCO_PREPR.txt',prompt)
  zipwrite(z,'MANIFEST.json',(json.dumps(manifest,ensure_ascii=False,sort_keys=True,separators=(',',':'))+'\n').encode())
  for p in files:zipwrite(z,'repo/'+p,(ROOT/p).read_bytes())
 return manifest

def verify(path,expected_tree):
 with zipfile.ZipFile(path) as z:
  m=json.loads(z.read('MANIFEST.json'))
  if m['git_tree_sha1']!=expected_tree:raise ValueError('SOURCE_LOCK_STALE')
  if SHA(z.read('PROMPT_INNESCO_PREPR.txt'))!=m['prompt_sha256']:raise ValueError('PROMPT_INTEGRITY')
  if set(z.namelist())!={'MANIFEST.json','PROMPT_INNESCO_PREPR.txt',*(('repo/'+p) for p in m['members'])}:
   raise ValueError('EXTRA_OR_MISSING_BUNDLE_MEMBER')
  for p,v in m['members'].items():
   raw=z.read('repo/'+p)
   if SHA(raw)!=v['sha256'] or hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()!=v['git_blob_sha1']:
    raise ValueError('BUNDLE_SOURCE_MISMATCH:'+p)
  for p in FIVE:
   if m['five_blob_lock'][p]!=m['members'][p]['git_blob_sha1']:raise ValueError('ORIENTATION_BLOB_DRIFT')
 return {'ok':True,'tree':expected_tree,'members':len(m['members']),'live_main_verified':False,'native_plugin_installed':False}
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('operation',choices=['build','verify']);a.add_argument('--out',required=True);a.add_argument('--expected-tree',required=True);a.add_argument('--expected-commit');o=a.parse_args();p=Path(o.out)
 if o.operation=='build':build(p,o.expected_tree,o.expected_commit)
 print(json.dumps(verify(p/'PROJECT_PREPR.zip',o.expected_tree)))
