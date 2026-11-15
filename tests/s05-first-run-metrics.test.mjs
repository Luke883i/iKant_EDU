import test from 'node:test';import assert from 'node:assert/strict';
import {summarizeS05Trials} from './pilot/s05-first-run-metrics.mjs';
test('S05 computes p50/p95 on 30 synthetic records but cannot certify 30 users',()=>{
 const xs=Array.from({length:30},(_,i)=>({trial_id:`sim_case_${String(i).padStart(3,'0')}`,elapsed_ms:100+i*10,manual_steps:3,errors:i===2?1:0,completed:true}));
 const r=summarizeS05Trials(xs);
 assert.equal(r.ok,true);assert.equal(r.p50_ms,240);assert.equal(r.p95_ms,380);
 assert.equal(r.trial_count,30);assert.equal(r.pilot_qualified,false);assert.equal(r.provenance,'CALLER_ROWS_UNVERIFIED');
 assert.equal(summarizeS05Trials([xs[0],xs[0]]).ok,false);
});
