import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
test('S09 release cannot be claimed from local patches or synthetic trials',()=>{
 const r=spawnSync(process.execPath,['scripts/s09-readiness.mjs'],{encoding:'utf8'});
 assert.equal(r.status,0);const d=JSON.parse(r.stdout);
 assert.equal(d.edu_pilot_qualified,false);assert.equal(d.canonical_qualified,false);
 assert.ok(d.missing_EDU.includes('S02_ORIGINAL_EDU_V2_OWNER_30_SUCCESSFUL_TURNS'));
 assert.ok(d.missing_CANONICAL.includes('S08_C59_OWNER_NATIVE_PROVEN'));
 assert.ok(!d.missing_CANONICAL.includes('S02_ORIGINAL_EDU_V2_OWNER_30_SUCCESSFUL_TURNS'));
 assert.ok(!d.missing_CANONICAL.includes('S05_30_INDEPENDENT_USERS')); 
});
