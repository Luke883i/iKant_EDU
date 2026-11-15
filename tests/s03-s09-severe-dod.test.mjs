import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';
const x=JSON.parse(readFileSync(new URL('../contracts/s03-s09-severe-dod.json',import.meta.url),'utf8'));
test('seven S03-S09 severe DoD contracts are closed-world, explicit external owners',()=>{
 assert.deepEqual(Object.keys(x.slices),['S03','S04','S05','S06','S07','S08','S09']);
 assert.equal(x.authority,0);assert.equal(x.claims.mcp_plugin_registered,false);
 for(const v of Object.values(x.slices)){assert.ok(v.checks.length>=4);assert.ok(v.external.length>=1);assert.ok(Object.keys(v.metrics).length>=1);assert.equal(v.external_gate_complete,false);}
 assert.equal(x.slices.S03.metrics.original_voice_byte_changes,0);
 assert.equal(x.slices.S05.metrics.independent_humans_min,30);
 assert.equal(x.slices.S06.metrics.unauthorized_success_max,0);
 assert.equal(x.slices.S07.metrics.real_successful_authenticated_provider_calls_min,3);
 assert.ok(!x.slices.S09.checks.includes('REQUIRE_30_EDU_USERS_FOR_CANONICAL'));
});
test('standalone audit cannot claim release, provider or pilot success',()=>{
 const r=spawnSync(process.execPath,['scripts/s03-s09-dod-audit.mjs'],{cwd:new URL('..',import.meta.url).pathname,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);const j=JSON.parse(r.stdout);
 assert.equal(j.candidate_contract_valid,true);assert.equal(j.all_external_gates_closed,false);
 assert.equal(j.edu_pilot_release_ready,false);assert.equal(j.canonical_release_ready,false);
});
