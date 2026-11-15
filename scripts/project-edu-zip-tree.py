#!/usr/bin/env python3
"""Derive a Git TREE from one official pinned ZIP and compare root to a
separately observed GitHub commit tree SHA. Host transport only, authority=0.
Do not describe derived entries as independently downloaded API tree entries.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import stat
import sys
import zipfile
H40=re.compile(r'^[0-9a-f]{40}$')
SAFE=re.compile(r'^[A-Za-z0-9._/-]+$')
def sha(kind,data):
    return hashlib.sha1(kind.encode()+b' '+str(len(data)).encode()+b'\0'+data).hexdigest()
def safe(p):
    return bool(p) and len(p)<512 and SAFE.fullmatch(p) is not None and all(x not in ('','.','..','.git') for x in p.split('/'))
def derive(archive,head,tree):
    if not H40.fullmatch(head or '') or not H40.fullmatch(tree or ''):
        raise ValueError('PINNED_GITHUB_COMMIT_TREE_REQUIRED')
    entries={};dirs=set();names=set();total=0
    with zipfile.ZipFile(archive) as z:
        members=z.infolist()
        if len(members)>3000:raise ValueError('ZIP_FILE_COUNT_BOUNDS')
        for member in members:
            prefix='iKant_EDU-'+head+'/'
            if not member.filename.startswith(prefix):raise ValueError('PINNED_ZIP_PREFIX_MISMATCH')
            raw=member.filename[len(prefix):]
            if not raw:continue
            p=raw[:-1] if member.is_dir() else raw
            if not safe(p) or p in names or member.flag_bits&1 or member.file_size>5*1024*1024 or member.compress_type not in (0,8):
                raise ValueError('ZIP_PATH_OR_MEMBER_UNSAFE')
            names.add(p);total+=member.file_size
            if total>30*1024*1024:raise ValueError('ZIP_TOTAL_BYTES_BOUNDS')
            parts=p.split('/')
            dirs.update('/'.join(parts[:i]) for i in range(1,len(parts)))
            if member.is_dir():dirs.add(p);continue
            mode=(member.external_attr>>16)
            kind=stat.S_IFMT(mode)
            if kind not in (0,stat.S_IFREG,stat.S_IFLNK):raise ValueError('ZIP_SPECIAL_FILE_DENIED')
            gitmode='120000' if kind==stat.S_IFLNK else '100755' if mode&0o111 else '100644'
            data=z.read(member)
            if len(data)!=member.file_size:raise ValueError('ZIP_SIZE_INVALID')
            entries[p]={'path':p,'type':'blob','mode':gitmode,'sha':sha('blob',data)}
    if any(x in entries for x in dirs):raise ValueError('ZIP_FILE_DIRECTORY_COLLISION')
    for d in dirs:entries[d]={'path':d,'type':'tree','mode':'040000','sha':'0'*40}
    def calculate(folder):
        children=[x for p,x in entries.items() if p.rpartition('/')[0]==folder]
        children.sort(key=lambda x:(x['path'].split('/')[-1]+('/' if x['type']=='tree' else '')).encode('utf8'))
        parts=[]
        for x in children:
            if x['type']=='tree':x['sha']=calculate(x['path'])
            mode='40000' if x['type']=='tree' else x['mode']
            parts.append(mode.encode()+b' '+x['path'].split('/')[-1].encode()+b'\0'+bytes.fromhex(x['sha']))
        return sha('tree',b''.join(parts))
    observed=calculate('')
    if observed!=tree:raise ValueError('ZIP_ROOT_DIFFERS_FROM_PINNED_GITHUB_COMMIT_TREE')
    return {'source_head':head,'source_tree':tree,'live_head':head,'truncated':False,
            'tree_evidence_kind':'ZIP_DERIVED_ROOT_VERIFIED_AGAINST_GITHUB_COMMIT_SHA_HOST_WITNESSED',
            'tree':[entries[p] for p in sorted(entries)],'authority':0,'active':False}
def main():
    p=argparse.ArgumentParser()
    for k in ('archive','head','tree','output'):p.add_argument('--'+k,required=True)
    a=p.parse_args()
    try:
        out=Path(a.output)
        if out.exists() or not out.parent.is_dir():raise ValueError('FRESH_OUTPUT_REQUIRED')
        x=derive(a.archive,a.head,a.tree)
        with out.open('x',encoding='utf8') as f:json.dump(x,f,sort_keys=True,separators=(',',':'))
        if json.loads(out.read_text())!=x:raise ValueError('TREE_READBACK_FAILED')
        print(json.dumps({'ok':True,'status':'ZIP_TREE_ROOT_MATCHED','head':a.head,'tree':a.tree,
                          'entries':len(x['tree']),'api_tree_entries_independently_fetched':False,
                          'provider_native_attested':False,'active':False}))
    except Exception as e:
        print(json.dumps({'ok':False,'edge':str(e),'active':False}),file=sys.stderr);sys.exit(2)
if __name__=='__main__':main()
