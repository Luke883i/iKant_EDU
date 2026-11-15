import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
test('physical gate: original V13 tree and explicit new files only',()=>{
 const x=spawnSync('python3',['scripts/r7-pr249-physical-gate.py','--fixture'],{cwd:root,encoding:'utf8'});
 assert.equal(x.status,0,x.stderr+x.stdout);
 const result=JSON.parse(x.stdout);assert.equal(result.issue_count,0);
 assert.equal(result.status,'SOURCE_ONLY_PASS_FIXTURE');
 assert.equal(result.roots.length,7);assert.equal(result.root_files.length,9);
 assert.equal(result.source_files,1639);
});
test('physical gate: --require-global cannot be satisfied by source check alone',()=>{
 const x=spawnSync('python3',['scripts/r7-pr249-physical-gate.py','--fixture','--require-global'],{cwd:root,encoding:'utf8'});
 assert.equal(x.status,20,x.stderr+x.stdout);
 const result=JSON.parse(x.stdout);assert.equal(result.global_dod,'HOLD');
});
