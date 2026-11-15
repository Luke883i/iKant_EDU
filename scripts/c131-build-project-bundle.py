#!/usr/bin/env python3
"""Reproducible, source-exact candidate bundle; never calls it an installed runtime."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import stat
import subprocess
import tempfile
from zipfile import ZipFile, ZIP_DEFLATED, ZipInfo

ROOT = Path(__file__).resolve().parent.parent
SOURCES = {
 '00_HOST_CONTRACT.md':'project/edu-oneshell/00_HOST_CONTRACT.md',
 'PROMPT_INNESCO.txt':'project/edu-oneshell/PROMPT_INNESCO.txt',
 '01_README.md':'README.md',
 '02_START_HERE.md':'docs/START_HERE.md',
 '03_PRODUCT_DASHBOARD.md':'docs/PRODUCT_DASHBOARD.md',
 '04_RELEASE_CATALOG.json':'release/catalog.json',
 '05_PRODUCT_DOD.md':'docs/C130_PRODUCT_DOD.md',
 '06_HOST_CONTRACT_ZERO.json':'contracts/c130-contract-zero.json',
 '07_OPERATOR_EXPERIENCE.json':'contracts/c131-operator-experience.json',
 '08_TERMS_REFERENCE.md':'TERMS.md',
 '09_ADMISSION_REFERENCE.json':'ADMISSION.json',
 '11_PRODUCT_POSITIONING.md':'docs/PRODUCT_POSITIONING.md',
 '12_V1_PRODUCT_DECISIONS.md':'docs/V1_PRODUCT_DECISIONS.md',
 '13_V1_E2E_TRACEABILITY.md':'docs/V1_E2E_TRACEABILITY.md',
 '14_V1_PRODUCT_CONTRACT.json':'contracts/v1-product-baseline.json'
}
def sha(data):return hashlib.sha256(data).hexdigest()
def info(name):
 i=ZipInfo(name,date_time=(1980,1,1,0,0,0))
 i.create_system=3;i.external_attr=(0o100644<<16);i.compress_type=ZIP_DEFLATED
 return i

def build(out):
 bundle={}
 for dst,src in SOURCES.items():
  p=ROOT/src
  if p.is_symlink() or not p.is_file():raise ValueError('unsafe source: '+src)
  bundle[dst]=p.read_bytes()
 with tempfile.TemporaryDirectory(prefix='ikant-c131-') as tmp:
  cache=Path(tmp)/'source-cache.json'
  subprocess.run(['node',str(ROOT/'scripts/c131-build-source-cache.mjs'),str(cache)],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
  bundle['runtime/C128_PROJECT_SOURCE_CACHE.json']=cache.read_bytes()
 try:head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
 except (OSError,subprocess.CalledProcessError):head=None
 if head and (len(head)!=40 or any(c not in '0123456789abcdef' for c in head)):raise ValueError('bad commit')
 bundle['10_BUILD_ORIGIN.json']=(json.dumps({'schema':'ikant-le-c131-build-origin/v1','source_git_commit':head,
  'source_claim':'LOCAL_TREE_BUILD_NOT_OFFICIAL_UNTIL_MAIN_MERGE_AND_RELEASE','authority':0},ensure_ascii=False,separators=(',',':'))+'\n').encode()
 manifest={'schema':'ikant-le-c131-bundle/v1','product_version':'1.0.0-edu.1','role':'CANDIDATE_NOT_RUNTIME_INSTALLATION',
  'source_of_truth':'main after merge; source_git_commit in 10_BUILD_ORIGIN.json',
  'members':[{'path':k,'bytes':len(v),'sha256':sha(v)} for k,v in sorted(bundle.items())]}
 bundle['MANIFEST.json']=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
 out.parent.mkdir(parents=True,exist_ok=True)
 with ZipFile(out,'w') as z:
  for name,data in sorted(bundle.items()):
   if name.startswith('/') or any(p in ('..','') for p in name.split('/')):raise ValueError('unsafe member')
   z.writestr(info(name),data)
 return len(bundle),sha(out.read_bytes())

def verify(path):
 with ZipFile(path) as z:
  names=z.namelist()
  if len(names)!=len(set(names)) or names!=sorted(names):raise ValueError('unsorted or duplicate')
  m=json.loads(z.read('MANIFEST.json'))
  actual={x['path']:(x['bytes'],x['sha256']) for x in m['members']}
  if set(actual)!=(set(names)-{'MANIFEST.json'}):raise ValueError('manifest missing')
  for name in actual:
   data=z.read(name)
   if len(data)!=actual[name][0] or sha(data)!=actual[name][1]:raise ValueError('identity mismatch '+name)
  return len(names)

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('output',type=Path);args=ap.parse_args()
 n,h=build(args.output.resolve());v=verify(args.output.resolve())
 assert n==v
 print(json.dumps({'status':'CANDIDATE_VERIFIED','members':n,'sha256':h,'file':str(args.output.resolve())}))
