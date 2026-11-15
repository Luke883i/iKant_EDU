import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,rmSync,appendFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const root=new URL('..',import.meta.url).pathname;
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const run=(args,cwd)=>execFileSync('python3',['scripts/p2-build-oneshell-release.py',...args],{cwd,encoding:'utf8'});
test('P2 exact source double-build and stale commit denied',()=>{
 const h=git('rev-parse','HEAD'),t=git('rev-parse','HEAD^{tree}'),dir=mkdtempSync(join(tmpdir(),'ikant-p2-'));
 const clean=join(dir,'clean-worktree');let added=false;
 try{
  // C32 and other workflows legitimately update tracked qualification receipts.
  // Build from an independently checked-out exact HEAD, never mask a dirty release source.
  execFileSync('git',['worktree','add','--detach',clean,h],{cwd:root,stdio:'pipe'});added=true;
  const a=join(dir,'a'),b=join(dir,'b'),opts=['--expected-commit',h,'--expected-tree',t];
  const x=JSON.parse(run(['build','--out',a,...opts],clean));const y=JSON.parse(run(['build','--out',b,...opts],clean));
  assert.equal(x.ok,true);assert.equal(x.zip_sha256,y.zip_sha256);
  assert.equal(x.plugin_installed,false);assert.equal(x.project_applied,false);
  assert.throws(()=>run(['verify','--out',a,'--expected-commit','0'.repeat(40),'--expected-tree',t],clean));
  assert.throws(()=>run(['build','--out',a,'--expected-commit',h,'--expected-tree','1'.repeat(40)],clean));
  // Mutate source and rehash both the manifest and internal plugin lock.
  // Self-consistency is insufficient: require the original pinned Git blob.
  const evil=join(dir,'evil');mkdirSync(evil);const py=`import sys,json,zipfile,hashlib,os
p,q=sys.argv[1:]
with zipfile.ZipFile(p) as z: d={x:z.read(x) for x in z.namelist()}
k='plugin_source/plugins/ikant-le-session-chat/server/server.mjs'
d[k]+=b'\\n// attacker-added behavior\\n'
v=json.loads(d['MANIFEST.json']);lock=json.loads(d['SOURCE_LOCK.json'])
b=d[k];h=lambda x:hashlib.sha1(b'blob '+str(len(x)).encode()+b'\\0'+x).hexdigest()
v['files'][k]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'git_blob_sha1':h(b)}
lock['plugin_source_blobs']['server/server.mjs']=h(b)
d['MANIFEST.json']=(json.dumps(v)+'\\n').encode();d['SOURCE_LOCK.json']=(json.dumps(lock)+'\\n').encode()
with zipfile.ZipFile(q,'w') as z:
 for k,b in d.items():z.writestr(k,b)
`;
  execFileSync('python3',['-c',py,join(a,'ONESHELL_PROJECT_V7.zip'),join(evil,'ONESHELL_PROJECT_V7.zip')]);
  assert.throws(()=>run(['verify','--out',evil,...opts],clean));
  appendFileSync(join(clean,'project/oneshell-v7/PROMPT_TEMPLATE.txt'),'\n# uncommitted test mutation\n');
  assert.throws(()=>run(['build','--out',join(dir,'dirty'),...opts],clean),/DIRTY_SOURCE_NOT_RELEASEABLE/);
 }finally{
  if(added)execFileSync('git',['worktree','remove','--force',clean],{cwd:root,stdio:'pipe'});
  rmSync(dir,{recursive:true,force:true});
 }
});
