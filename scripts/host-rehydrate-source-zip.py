#!/usr/bin/env python3
"""HOST-only exact-source ZIP to shallow Git checkout. Never installs iKant."""
import argparse
import json
import os
import pathlib
import re
import shutil
import stat
import subprocess
import sys
import zipfile

def git(*args,cwd=None,data=None):
 r=subprocess.run(['git',*args],cwd=cwd,input=data,capture_output=True,check=True)
 return r.stdout.decode('utf-8').strip()

def prepare(archive,commit_file,out,head,tree):
 if not re.fullmatch('[0-9a-f]{40}',head) or not re.fullmatch('[0-9a-f]{40}',tree):
  raise ValueError('INVALID_SOURCE_LOCK')
 if out.exists() or not out.parent.is_dir():raise ValueError('OUTPUT_EXISTS_OR_PARENT_MISSING')
 raw=commit_file.read_bytes()
 if git('hash-object','-t','commit','--stdin',data=raw)!=head:raise ValueError('COMMIT_OBJECT_MISMATCH')
 prefix='iKant_EDU-'+head+'/'
 with zipfile.ZipFile(archive) as z:
  entries=z.infolist()
  if len(entries)>3000 or sum(x.file_size for x in entries)>30*1024*1024:
   raise ValueError('ARCHIVE_LIMIT')
  names=set()
  for entry in entries:
   p=entry.filename
   if not p.startswith(prefix):raise ValueError('ARCHIVE_PREFIX')
   rel=p[len(prefix):]
   if not rel:continue
   parts=pathlib.PurePosixPath(rel).parts
   mode=(entry.external_attr>>16)&0o170000
   if p in names or rel.startswith('/') or '\\' in rel or '..' in parts or '.git' in parts or mode not in (0,stat.S_IFDIR,stat.S_IFREG):
    raise ValueError('ARCHIVE_MEMBER_UNSAFE')
   names.add(p)
  out.mkdir(mode=0o700)
  try:
   for e in entries:
    rel=e.filename[len(prefix):]
    if not rel:continue
    target=out/rel
    target.parent.mkdir(parents=True,exist_ok=True)
    if e.is_dir():
     target.mkdir(exist_ok=True)
    else:
     with z.open(e) as src,target.open('xb') as dst:
      shutil.copyfileobj(src,dst)
     target.chmod(0o755 if (e.external_attr>>16)&0o111 else 0o644)
   git('init','-q','-b','main',str(out))
   git('-c','core.autocrlf=false','add','-A',cwd=out)
   if git('write-tree',cwd=out)!=tree:raise ValueError('SOURCE_TREE_MISMATCH')
   if git('hash-object','-t','commit','-w','--stdin',cwd=out,data=raw)!=head:
    raise ValueError('COMMIT_STORE_MISMATCH')
   (out/'.git'/'shallow').write_text(head+'\n',encoding='ascii')
   git('update-ref','refs/heads/main',head,cwd=out)
   if git('rev-parse','HEAD',cwd=out)!=head or git('rev-parse','HEAD^{tree}',cwd=out)!=tree or git('status','--porcelain',cwd=out):
    raise ValueError('REOPEN_MISMATCH')
   return {'ok':True,'source_head':head,'source_tree':tree,'native_active':False}
  except BaseException:
   shutil.rmtree(out,ignore_errors=True)
   raise

if __name__=='__main__':
 p=argparse.ArgumentParser()
 for x in ('head','tree','source-zip','pinned-commit-object','output'):p.add_argument('--'+x,required=True)
 a=p.parse_args()
 try:
  print(json.dumps(prepare(pathlib.Path(a.source_zip),pathlib.Path(a.pinned_commit_object),
    pathlib.Path(a.output),a.head,a.tree),sort_keys=True))
 except Exception as e:
  print('FAIL_CLOSED: '+str(e),file=sys.stderr);sys.exit(2)
