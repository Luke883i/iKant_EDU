/** Proves source ZIP remains content-addressed, not an app installation. */
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(new URL('..',import.meta.url).pathname);
function spawn(cmd,args){return spawnSync(cmd,args,{cwd:root,encoding:'utf8',maxBuffer:4e6});}
test('two byte-for-byte identical builds and verified source, stale lock rejected',()=>{
 const d=mkdtempSync(path.join(tmpdir(),'ikant-s04-bytes-'));
 try{
  const tr=spawn('git',['rev-parse','HEAD^{tree}']);assert.equal(tr.status,0,tr.stderr);const tree=tr.stdout.trim();
  // Qualification workflows (e.g. C32) regenerate tracked receipt JSON files.
  // They MUST NOT bypass the builder's dirty-tree fence just to pass npm test.
  const status=spawn('git',['status','--porcelain']);assert.equal(status.status,0,status.stderr);
  if(status.stdout.trim()){
   const denied=spawn('python3',['scripts/s04-build-project.py','build','--out',path.join(d,'dirty'),'--expected-tree',tree]);
   assert.notEqual(denied.status,0,'dirty checkout must not create a Project artifact');
   assert.match(denied.stderr,/SOURCE_DIRTY_NOT_FROZEN/);
   return;
  }
  for(const name of ['a','b']){const res=spawn('python3',['scripts/s04-build-project.py','build','--out',path.join(d,name),'--expected-tree',tree]);assert.equal(res.status,0,res.stderr);assert.equal(JSON.parse(res.stdout).ok,true);}
  const a=readFileSync(path.join(d,'a','PROJECT_PREPR.zip'));const b=readFileSync(path.join(d,'b','PROJECT_PREPR.zip'));
  assert.ok(a.equals(b));assert.ok(a.length>500000);
  const bad=spawn('python3',['scripts/s04-build-project.py','verify','--out',path.join(d,'a'),'--expected-tree','f'.repeat(40)]);
  assert.notEqual(bad.status,0);assert.match(bad.stderr,/SOURCE_LOCK_STALE/);
  const damage=spawn('python3',['-c',`import zipfile,sys
p=sys.argv[1]
with zipfile.ZipFile(p,'a') as z:z.writestr('repo/README.md',b'TAMPERED')`,path.join(d,'a','PROJECT_PREPR.zip')]);
  assert.equal(damage.status,0,damage.stderr);
  const deny=spawn('python3',['scripts/s04-build-project.py','verify','--out',path.join(d,'a'),'--expected-tree',tree]);
  assert.notEqual(deny.status,0);assert.match(deny.stderr,/BUNDLE_SOURCE_MISMATCH/);
 }finally{rmSync(d,{recursive:true,force:true})}
});
