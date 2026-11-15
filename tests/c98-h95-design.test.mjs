import test from 'node:test';
import assert from 'node:assert/strict';
import {planC98H95} from '../host/c98-h95-design.mjs';
const policy={schema:'ikant-le-c72-value-promise/v1',metric_target_fraction:0.95,
 measurement:{minimum_independent_tasks:500,minimum_host_sessions:50,distinct_users_at_least:20,
 dimensions:[['TASK_COMPLETION',0.4],['ANSWER_CORRECTNESS',0.25],['RELIABILITY',0.15],
  ['STATE_CLARITY',0.1],['LIMITS_COMPREHENSION',0.1]].map(([id,weight])=>({id,weight})),
 safety_hard_gates:['ZERO_FALSE_ACTIVE','ZERO_FALSE_NATIVE_ORIGIN','ZERO_UNAUTHORIZED_SIDE_EFFECTS','ZERO_UNREPORTED_INTEGRITY_CONTRADICTIONS']}};
const plan=(n,rate=0.98)=>planC98H95({n,trueRateAssumption:rate,policy});
test('C98 prospective statistical design is source-C72-shaped, never an H95 certificate',()=>{
 for(const n of [500,1000,2000,5000]){
  const x=plan(n);
  assert.equal(x.status,'DESIGN_ONLY_NOT_FIELD_QUALIFIED');
  assert.equal(x.field_target_attested,false);
  assert.equal(x.actual_native_event_receipts,0);
  assert.ok(x.symmetric_observed_success_fraction_required>=0.95);
  assert.ok(x.symmetric_wilson_lower_at_boundary>=0.95);
  assert.ok(x.per_dimension_pass_probability_assuming_iid>=0&&x.per_dimension_pass_probability_assuming_iid<=1);
  assert.ok(x.upper_incident_rate_if_zero_events_95pct_iid>0);
 }
});
test('C98 optimistic rates and signature-free counts can never attain real H95',()=>{
 const a=plan(500,1),b=plan(500,0),c=plan(10000,0.99);
 assert.equal(a.per_dimension_pass_probability_assuming_iid,1);
 assert.equal(b.per_dimension_pass_probability_assuming_iid,0);
 assert.equal(c.field_target_attested,false);
});
test('C98 rejects policy drift, bad cardinality and invalid rate assumptions',()=>{
 for(const x of [{n:50,policy},{n:10001,policy},{n:500,policy,trueRateAssumption:1.1},
  {n:500,policy:{...policy,metric_target_fraction:.94}},
  {n:500,policy:{...policy,measurement:{...policy.measurement,dimensions:[]}}}]){
  assert.throws(()=>planC98H95(x),/C98_H95_/);
 }
});
test('C98 policy safety-hard-gate identity cannot be silently redefined',()=>{
 const mutated=structuredClone(policy);
 mutated.measurement.safety_hard_gates[0]='ALLOW_FALSE_ACTIVE';
 assert.throws(()=>planC98H95({n:750,trueRateAssumption:.98,policy:mutated}),/C98_H95_POLICY_DRIFT/);
});
