import test from 'node:test';
import assert from 'node:assert/strict';
import {certifyCounterfactual,minimizeFailure} from '../scripts/pr251-causal-oracle.mjs';
const A='a'.repeat(40),B='b'.repeat(40);
function sample({accepted=[]}={}){
  return {schema:'ikant-pr251-adaptive-counterfactual/v1',head:A,tree:B,
    candidate_total:425,baseline:{key:'baseline',removed:0,bytes:0,pass:true,
      gates:{native:{exit_code:0},contract:{exit_code:0}}},
    strata:[{key:'docs',group_files:25,removed:25,bytes:1800,pass:false,
      gates:{native:{exit_code:1,first_tap:'not ok 1 - original source'},contract:{exit_code:0}}}],
    accepted,accepted_files:accepted.length,
    accepted_bytes:accepted.reduce((a,b)=>a+b.bytes,0),
    external_unknown:true,product_go:false,global_equivalence:'NOT_ATTESTED'};
}
test('real 425-cut rejection stays rejected even if the CI execution job succeeded',()=>{
  const q=certifyCounterfactual(sample(),'REJECTED_BY_NATIVE_OR_CONTRACT');
  assert.equal(q.radical_cut,'REJECTED_BY_NATIVE_OR_CONTRACT');
  assert.equal(q.accepted_status,'NO_POSITIVE_CUT');
  assert.equal(q.accepted_files,0);
  assert.equal(q.global_dod,'HOLD');
  assert.equal(q.product_go,false);
  assert.equal(q.authorized_deletion,false);
});
test('bounded passing stratum cannot become external equivalence or deletion authority',()=>{
  const r=sample({accepted:[{path:'project/docs/candidate.md',bytes:120}]});
  r.strata=[{key:'docs',removed:1,bytes:120,group_files:1,pass:true,
    gates:{native:{exit_code:0},contract:{exit_code:0}}}];
  const q=certifyCounterfactual(r,'NATIVE_PASS_EXTERNAL_UNKNOWN');
  assert.equal(q.accepted_status,'BOUNDED_NATIVE_ONLY');
  assert.equal(q.product_go,false);
  assert.equal(q.behavioral_equivalence,'NOT_ATTESTED');
  assert.equal(q.external_consumers,'UNKNOWN');
});
test('false green in an outcome field is rejected, not explained away by workflow success',()=>{
  const r=sample();r.strata[0].pass=true;
  assert.throws(()=>certifyCounterfactual(r,'REJECTED_BY_NATIVE_OR_CONTRACT'),/FORGED_PASS/);
});
test('missing or failing baseline, forged cut size, duplicate path and release claims fail closed',()=>{
  const r=sample();
  r.baseline.gates.native.exit_code=1;
  assert.throws(()=>certifyCounterfactual(r,'REJECTED_BY_NATIVE_OR_CONTRACT'),/FORGED_PASS|NONQUALIFIED/);
  r.baseline.gates.native.exit_code=0;
  r.accepted_files=1;
  assert.throws(()=>certifyCounterfactual(r,'REJECTED_BY_NATIVE_OR_CONTRACT'),/FORGED_ACCEPTANCE/);
  r.accepted_files=0;
  r.product_go=true;
  assert.throws(()=>certifyCounterfactual(r,'REJECTED_BY_NATIVE_OR_CONTRACT'),/REPORT_SCOPE_OR_AUTHORITY/);
});
test('unknown, timeout or forged approval cannot be laundered into positive evidence',()=>{
  const r=sample();
  r.strata[0].gates.native.exit_code='TIMEOUT';
  assert.throws(()=>certifyCounterfactual(r,'REJECTED_BY_NATIVE_OR_CONTRACT'),/FORGED_PASS/);
  r.strata[0].pass=false;
  assert.equal(certifyCounterfactual(r,'REJECTED_BY_NATIVE_OR_CONTRACT').adaptive_strata[0].native,'UNKNOWN');
  assert.throws(()=>certifyCounterfactual(r,'APPROVED_FOR_RELEASE'),/UNKNOWN_RADICAL_VERDICT/);
});
test('seeded counterexamples with two necessary triggers yield a one-minimal failure kernel',async()=>{
  const input=['c','a','z','b','q','x','k','y'];
  const oracle=async subset=>subset.includes('a')&&subset.includes('b')?'FAIL':'PASS';
  const r=await minimizeFailure(input,oracle,{maxProbes:100});
  assert.equal(r.status,'ONE_MINIMAL_FAILURE_KERNEL');
  assert.deepEqual(new Set(r.kernel),new Set(['a','b']));
  assert.equal(r.global_minimum_proven,false);
  assert.equal(r.product_go,false);
  assert.ok(r.probes>=2&&r.probes<=100);
});
test('UNKNOWN from a native oracle blocks one-minimal certification',async()=>{
  const r=await minimizeFailure(['a','b'],async group=>group.length===2?'FAIL':'UNKNOWN');
  assert.equal(r.status,'INCONCLUSIVE_UNKNOWN');
  assert.equal(r.authorized_deletion,false);
});
test('bounded probe budget never becomes a proven minimal cut',async()=>{
  const r=await minimizeFailure(['a','b','c','d','e','f'],
    async()=> 'FAIL',{maxProbes:2});
  assert.equal(r.status,'INCONCLUSIVE_BUDGET');
  assert.equal(r.probes,2);
  assert.equal(r.global_dod,'HOLD');
});
test('a non-reproducible initial failure does not select or delete any candidate',async()=>{
  const r=await minimizeFailure(['a','b'],async()=> 'PASS');
  assert.equal(r.status,'NOT_REPRODUCED');
  assert.deepEqual(r.kernel,[]);
});
test('invalid oracle answer and duplicate candidate names are rejected',async()=>{
  await assert.rejects(()=>minimizeFailure(['x','x'],async()=> 'FAIL'),/INVALID_DDMIN_ARGUMENTS/);
  await assert.rejects(()=>minimizeFailure(['x'],async()=> 'SUCCESS'),/INVALID_ORACLE_OUTCOME/);
});

test('HEAD-bound graph rebuilds full stratum sequence and exact accepted path/SHA',()=>{
  const d={path:'project/docs/old.md',sha:'c'.repeat(40),bytes:11,tier:'DOCUMENTARY_ARCHIVE_HYPOTHESIS'};
  const s={path:'scripts/old.mjs',sha:'d'.repeat(40),bytes:14,tier:'TOOL_OR_LEGACY'};
  const g={head:A,tree:B,exact_source_epoch:true,product_go:false,
    total_source_supergraph:{schema:'ikant-pr251-total-source-supergraph/v1',
      product_go:false,external_consumers:'UNKNOWN',
      product_first_solution:{outside_paths:[d,s]}}};
  const r=sample({accepted:[s]});
  r.candidate_total=2;
  r.strata=[
    {key:'docs',group_files:1,removed:1,bytes:11,pass:false,
      gates:{native:{exit_code:1},contract:{exit_code:0}}},
    {key:'scripts',group_files:1,removed:1,bytes:14,pass:true,
      gates:{native:{exit_code:0},contract:{exit_code:0}}}
  ];
  const certified=certifyCounterfactual(r,'REJECTED_BY_NATIVE_OR_CONTRACT',g);
  assert.equal(certified.source_graph_bound,true);
  assert.equal(certified.accepted_files,1);
  assert.equal(certified.global_dod,'HOLD');
  r.accepted[0]={...s,path:'scripts/forged.mjs'};
  assert.throws(()=>certifyCounterfactual(r,'REJECTED_BY_NATIVE_OR_CONTRACT',g),/ACCEPTED_IDENTITY_NOT_FROM_HEAD/);
  r.accepted[0]=s;
  r.strata[1].bytes=15;
  assert.throws(()=>certifyCounterfactual(r,'REJECTED_BY_NATIVE_OR_CONTRACT',g),/STRATUM_NOT_RECONSTRUCTIBLE/);
  r.strata[1].bytes=14;
  g.tree='e'.repeat(40);
  assert.throws(()=>certifyCounterfactual(r,'REJECTED_BY_NATIVE_OR_CONTRACT',g),/UNTRUSTED_SOURCE_GRAPH/);
});
