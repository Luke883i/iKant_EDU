import test from 'node:test';
import assert from 'node:assert/strict';
import {assessC72UserValue} from '../host/c72-value-assessor.mjs';
const ids=['TASK_COMPLETION','ANSWER_CORRECTNESS','RELIABILITY','STATE_CLARITY','LIMITS_COMPREHENSION'];
const fixture=n=>({dimensions:ids.map(id=>({id,trials:n,successes:n})),independent_sessions:60,distinct_users:25,safety_incidents:[0,0,0,0]});
test('C72 good numeric metrics are still NOT independent host or world evidence',()=>{
 const a=assessC72UserValue(fixture(1000));
 assert.equal(a.status,'NUMERIC_TARGET_CANDIDATE_UNATTESTED');
 assert.equal(a.metric_target_met,true);
 assert.equal(a.user_value_attested,false);
 assert.equal(a.external_host_witness_verified,false);
 assert.equal(a.first_unclosed_edge,'INDEPENDENT_HOST_EVIDENCE');
});
test('C72 subthreshold counts, missing dimensions, incidents and invalid input cannot support 95-percent promise',()=>{
 for(const x of [fixture(10),{...fixture(1000),distinct_users:2},
 {...fixture(1000),safety_incidents:[0,1,0,0]},
 {...fixture(1000),dimensions:fixture(1000).dimensions.slice(1)},
 {...fixture(1000),dimensions:fixture(1000).dimensions.map(d=>({...d,successes:Math.floor(d.trials*.92)}))},
 null]){const v=assessC72UserValue(x);assert.equal(v.metric_target_met,false);
 assert.equal(v.user_value_attested,false);}
});
