import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {qualifyWorkflowPatch,qualifyPrCCISource,observePrCCISource,DIRECTIVE}
 from '../scripts/cora-pr-c-ci.mjs';
import {gitBlobSha1} from '../scripts/v5b-repository-governance-audit.mjs';
const policy=JSON.parse(fs.readFileSync(new URL('../contracts/cora-pr-c-ci-v1.json',import.meta.url),'utf8'));
const yaml=fs.readFileSync(new URL('../.github/workflows/docs-ontology-coverage.yml',import.meta.url),'utf8');
const clone=()=>structuredClone(policy);
test('PR-C eight-node non-compensatory DoD with V5-B and CORA original authority',()=>{
 const ids=['C01','C02','C03','C04','C05','C06','C07','C08'];
 assert.deepEqual(policy.dod.map(x=>x.id),ids);
 assert.deepEqual(policy.dod.map(x=>x.depends_on),[[],['C01'],['C02'],['C03'],
  ['C04'],['C03','C04','C05'],['C06'],['C07']]);
 assert.equal(policy.authority,0);assert.equal(policy.product_go,false);
 assert.equal(policy.retirement_authorized,false);
 assert.equal(policy.bounded_effect.existing_workflows,116);
 assert.equal(policy.bounded_effect.deleted,0);assert.equal(policy.bounded_effect.added,0);
 assert.equal(policy.last_gate,'C08_EXTERNAL_REVIEW_OPEN');
});
test('exact original trigger, job and commands recovered from one physical workflow blob',()=>{
 const r=qualifyWorkflowPatch(policy,yaml);
 assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.pr_superseded_only,true);
 assert.equal(r.baseline_events_jobs_commands_byte_identical,true);
 assert.equal(r.required_checks,'UNKNOWN');
 assert.equal(r.product_go,false);assert.equal(r.retirement_authorized,false);
 const previous=yaml.replace(DIRECTIVE,'');
 const digest=x=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(x)+String.fromCharCode(0)).update(x).digest('hex');
 assert.equal(digest(previous),policy.bounded_effect.before_blob);
 assert.equal(digest(yaml),policy.bounded_effect.after_blob);
 assert.equal(gitBlobSha1(yaml),digest(yaml),'canonical V5-B blob SHA must match independent test oracle');
 assert.equal(gitBlobSha1(previous),digest(previous));
 assert.equal(gitBlobSha1(Buffer.from(yaml,'utf8')),digest(yaml));
 assert.equal(previous.includes('permissions:\n  contents: read\nconcurrency:'),false);
});
test('CI full readback rejects provider promotion and workflow count drift',()=>{
 const a={schema:'ikant-v5b-live-readonly-audit/v1',status:'SOURCE_INDEXED_NOT_HUMAN_REVIEWED',
  errors:[],workflow_count:116,retired_workflows:['A','B','C','D','E'],
  required_checks:'UNKNOWN_PROVIDER_NOT_ATTESTED',product_release:'PRODUCT_NO_GO',
  workflows:Array.from({length:116},(_,i)=>({path:i===0?policy.bounded_effect.path:'ci'+i+'.yml',
    blob_sha1:i===0?policy.bounded_effect.after_blob:'a'.repeat(40),flags:[]}))};
 const c={ok:true,status:'SOURCE_CANDIDATE_REQUIRES_INDEPENDENT_CI',
  goals:{standardized:'BLOCKED_EXTERNAL',product:'BLOCKED_EXTERNAL'},git:{workflow_count:116},
  permission_to_change:false};
 const pass=qualifyPrCCISource({policy,source:yaml,audit:a,cora:c});
 assert.equal(pass.ok,true,JSON.stringify(pass));
 assert.equal(pass.human_review_attested,false);
 for(const mutate of [
  x=>x.a.required_checks='PROVIDER_PASS',
  x=>x.a.workflow_count=115,
  x=>x.a.retired_workflows=[],
  x=>x.a.workflows[0].blob_sha1='f'.repeat(40),
  x=>x.c.goals.standardized='PASS',
  x=>x.c.permission_to_change=true
 ]){
  const x={a:structuredClone(a),c:structuredClone(c)};
  mutate(x);const r=qualifyPrCCISource({policy,source:yaml,audit:x.a,cora:x.c});
  assert.equal(r.ok,false);assert.equal(r.product_go,false);
 }
});
test('10k reproducible semantic faults kill every attempted CI overclaim or executable change',()=>{
 const faults=[
  x=>x.source=x.source.replace('contents: read','contents: write'),
  x=>x.source=x.source.replace("github.event_name == 'pull_request'","github.event_name == 'push'"),
  x=>x.source=x.source.replace('node scripts/ikant-document-atlas.mjs','echo skip'),
  x=>x.source=x.source.replace("      - 'README.md'","      - 'NOBODY.md'"),
  x=>x.source=x.source.replace('  evidence:\n','  shortcut:\n'),
  x=>x.source=x.source.replace('node-version: '+String.fromCharCode(39)+'22','node-version: '+String.fromCharCode(39)+'20'),
  x=>x.source=x.source.replace(DIRECTIVE,''),
  x=>x.source=x.source.replace(DIRECTIVE,DIRECTIVE+DIRECTIVE),
  x=>x.policy.authority=1,
  x=>x.policy.retirement_authorized=true,
  x=>x.policy.release='GO',
  x=>x.policy.bounded_effect.after_blob='f'.repeat(40),
  x=>x.policy.bounded_effect.before_blob='f'.repeat(40),
  x=>x.policy.bounded_effect.deleted=1,
  x=>x.policy.bounded_effect.trigger_paths_unchanged=false,
  x=>x.policy.bounded_effect.main_push_never_cancelled=false
 ];
 const run=()=>{
  let seed=20261104>>>0,rejected=0,unsafe=0,trace=2166136261>>>0;const covered=new Set();
  for(let i=0;i<10000;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const k=i<faults.length?i:seed%faults.length,subject={policy:clone(),source:yaml};
   covered.add(k);faults[k](subject);
   const r=qualifyWorkflowPatch(subject.policy,subject.source);
   if(!r.ok)rejected++;
   else unsafe++;
   assert.equal(r.product_go,false);
   assert.equal(r.retirement_authorized,false);
   trace=Math.imul(trace^(r.ok?1:0)^k,16777619)>>>0;
  }
  return {rejected,unsafe,covered:covered.size,digest:trace.toString(16)};
 };
 const first=run(),second=run();
 assert.deepEqual(first,second);
 assert.equal(first.rejected,10000);assert.equal(first.unsafe,0);
 assert.equal(first.covered,faults.length);
});
test('D2 PR-C source reuses original CORA audit and preserves independent pure qualifier',()=>{
 const source=fs.readFileSync(new URL('../scripts/cora-pr-c-ci.mjs',import.meta.url),'utf8');
 assert.match(source,/observeReticularCensusWithAudit\(\)/);
 assert.doesNotMatch(source,/\bauditRepository\s*\(/);
 assert.match(source,/qualifyPrCCISource\(\{policy,source:yaml,audit,cora\}\)/);
});

test('actual HEAD Git + original V5-B + CORA readback retains 116 workflows',()=>{
 const r=observePrCCISource();
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.workflow_count,116);
 assert.equal(r.deleted_workflows,0);assert.equal(r.added_workflows,0);
 assert.equal(r.retired_workflows,5);
 assert.equal(r.evidence_cuts.human_review,'NOT_ATTESTED');
 assert.equal(r.evidence_cuts.provider,'NOT_ATTESTED');
 assert.equal(r.product_go,false);
});
