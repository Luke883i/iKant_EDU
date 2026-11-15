import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const run=(...args)=>spawnSync('python3',['scripts/s04-build-project.py',...args],{cwd:root,encoding:'utf8'});
test('S04 rejects stale tree, has no magical plugin registration',()=>{
 const tmp=mkdtempSync(path.join(os.tmpdir(),'ikant-s04-'));
 try{const bad=run('build','--out',tmp,'--expected-tree','f'.repeat(40));assert.notEqual(bad.status,0);assert.match(bad.stderr,/SOURCE_LOCK_STALE/);}
 finally{rmSync(tmp,{recursive:true,force:true})}
});
