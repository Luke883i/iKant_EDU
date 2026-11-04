import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {observeReticularCensus,observeReticularCensusWithAudit}
 from '../scripts/cora-minimal-absorption.mjs';
import {auditRepository} from '../scripts/v5b-repository-governance-audit.mjs';
import {derivePrABacklog,observePrABacklog} from '../scripts/cora-pr-a-backlog.mjs';
import {qualifyPrCCISource,observePrCCISource}
 from '../scripts/cora-pr-c-ci.mjs';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const contract=JSON.parse(read('contracts/cora-pr-d2-single-audit-v1.json'));
const register=JSON.parse(read('governance/changes/zzzzzzzzzzzzzzzz-cora-pr-d2-single-audit.json'));
const policyA=JSON.parse(read('contracts/cora-pr-a-backlog-v1.json'));
const policyC=JSON.parse(read('contracts/cora-pr-c-ci-v1.json'));
const yaml=read('.github/workflows/docs-ontology-coverage.yml');
const clone=x=>structuredClone(x);
const objectSha=i=>i.toString(16).padStart(40,'0');

test('D2 original reticulum: nine non-compensatory gates and external V5-G cut',()=>{
 assert.equal(contract.schema,'ikant-cora-pr-d2-single-v5b-readback/v1');
 assert.equal(contract.authority,0);
 assert.equal(contract.release,'NO_GO');
 assert.equal(contract.product_go,false);
 assert.deepEqual(contract.reticular_dod.map(n=>[n.id,n.requires]),[
  ['D2-01',[]],['D2-02',['D2-01']],['D2-03',['D2-02']],
  ['D2-04',['D2-03']],['D2-05',['D2-03']],
  ['D2-06',['D2-04','D2-05']],['D2-07',['D2-06']],
  ['D2-08',['D2-07']],['D2-09',['D2-08']]
 ]);
 assert.equal(contract.slice.new_inventory,false);
 assert.equal(contract.slice.new_owner,false);
 assert.equal(contract.slice.external_audit_injection,false);
 assert.equal(contract.slice.workflow_change,false);
 assert.equal(contract.slice.destructive_change,false);
 assert.equal(contract.slice.before_scans_per_entrypoint.pr_a,2);
 assert.equal(contract.slice.after_scans_per_entrypoint.pr_a,1);
 assert.equal(contract.slice.after_scans_per_entrypoint.pr_c,1);
 assert.equal(contract.evidence.approval,'NOT_ATTESTED');
 assert.equal(contract.result,'SOURCE_ONLY_NOT_REPOSITORY_STANDARDIZED');
 assert(Object.values(contract.forbidden).every(x=>x===false));
});

test('V5-B source lineage has seven explicit predecessors and no invented human review',()=>{
 assert.equal(register.source_main,contract.baseline.head);
 assert.equal(register.paths.length,10);
 assert.equal(register.paths.filter(x=>x.operation==='MODIFY').length,7);
 assert.equal(register.paths.filter(x=>x.operation==='ADD').length,3);
 assert.equal(register.original_owner_unchanged,true);
 assert.equal(register.human_review_completed,false);
 assert(register.paths.every(x=>x.human_review==='REVIEW_REQUIRED'));
 assert.equal(new Set(register.paths.map(x=>x.path)).size,register.paths.length);
 for(const row of register.paths.filter(x=>x.operation==='MODIFY')){
  assert.match(row.supersedes_register,/^governance\/changes\/.+\.json$/);
  assert.match(row.supersedes_source_main,/^[a-f0-9]{40}$/);
  assert.notEqual(row.supersedes_source_main,register.source_main);
 }
});

test('actual call graph invokes one original V5-B audit in the CORA owner only',()=>{
 const cora=read('scripts/cora-minimal-absorption.mjs'),
  a=read('scripts/cora-pr-a-backlog.mjs'),c=read('scripts/cora-pr-c-ci.mjs'),
  b=read('scripts/cora-pr-b-docs.mjs');
 const body=cora.split('export function observeReticularCensusWithAudit(){')[1]
  ?.split('export function observeReticularCensus(){')[0];
 assert.equal(typeof body,'string');
 assert.equal((body.match(/\bauditRepository\(\)/g)||[]).length,1);
 assert.match(body,/return \{census,audit\}/);
 assert.match(cora,/return observeReticularCensusWithAudit\(\)\.census/);
 for(const [name,text] of [['PR-A',a],['PR-C',c]]){
  assert.match(text,/observeReticularCensusWithAudit\(\)/,name);
  assert.doesNotMatch(text,/\bauditRepository\s*\(/,name);
 }
 assert.match(b,/observePrABacklog\(\)/);
 assert.equal(observeReticularCensusWithAudit.length,0,'caller cannot supply foreign audit bytes');
});

test('single original audit readback matches independent legacy projections on exact checkout',()=>{
 const {census,audit}=observeReticularCensusWithAudit();
 assert.equal(census.ok,true,JSON.stringify(census.obligations||census));
 assert.equal(audit.status,'SOURCE_INDEXED_NOT_HUMAN_REVIEWED');
 assert.deepEqual(audit.errors,[]);
 assert.equal(audit.checked_files,census.git.tracked);
 assert.equal(audit.workflow_count,census.git.workflow_count);
 assert.equal(census.git.workflow_count,116);
 assert.equal(census.permission_to_change,false);
 assert.equal(census.goals.standardized,'BLOCKED_EXTERNAL');
 assert.equal(census.goals.product,'BLOCKED_EXTERNAL');
 const previousCensus=observeReticularCensus(),previousAudit=auditRepository();
 assert.deepEqual(census,previousCensus,'public CORA observer output unchanged');
 const candidateA=derivePrABacklog(census,audit,policyA);
 const independentA=derivePrABacklog(previousCensus,previousAudit,policyA);
 assert.equal(candidateA.ok,true,JSON.stringify(candidateA));
 assert.deepEqual(candidateA,independentA,'PR-A backlog semantics unchanged');
 const candidateC=qualifyPrCCISource({policy:policyC,source:yaml,audit,cora:census});
 const independentC=qualifyPrCCISource({policy:policyC,source:yaml,audit:previousAudit,cora:previousCensus});
 assert.equal(candidateC.ok,true,JSON.stringify(candidateC));
 assert.deepEqual(candidateC,independentC,'PR-C workflow risk semantics unchanged');
 assert.equal(candidateA.product_go,false);
 assert.equal(candidateA.delete_authorized,false);
 assert.equal(candidateC.product_go,false);
 assert.equal(candidateC.human_review_attested,false);
 assert.equal(candidateC.evidence_cuts.required_checks,'UNKNOWN');
 const observedA=observePrABacklog(),observedC=observePrCCISource();
 assert.deepEqual(observedA,candidateA,'PR-A uses same source projection');
 assert.deepEqual(observedC,candidateC,'PR-C uses same source projection');
});

const synthetic=()=>{
 const paths=['README.md','.github/workflows/ci.yml','scripts/example.mjs'];
 const rows=paths.map((path,i)=>({
  path,git_blob_sha1:objectSha(i+1),provisional_role:'PROVISIONAL',
  consumer_status:'UNKNOWN_NOT_UNUSED',literal_importers:[],
  literal_dependencies:[],workflow:path.startsWith('.github/workflows/')?
   {events:['pull_request'],jobs:['qualify'],flags:[],required_check_status:'UNKNOWN_PROVIDER_NOT_DERIVED'}:null
 }));
 const census={ok:true,status:'SOURCE_CANDIDATE_REQUIRES_INDEPENDENT_CI',
  git:{head:objectSha(90),tree:objectSha(91),tracked:rows.length,workflow_count:1},
  goals:{prepared:'SOURCE_CANDIDATE',standardized:'BLOCKED_EXTERNAL',product:'BLOCKED_EXTERNAL'},
  permission_to_change:false,product_go:false,rows};
 const audit={schema:'ikant-v5b-live-readonly-audit/v1',status:'SOURCE_INDEXED_NOT_HUMAN_REVIEWED',
  errors:[],checked_files:rows.length,workflow_count:1,
  required_checks:'UNKNOWN_PROVIDER_NOT_ATTESTED',product_release:'PRODUCT_NO_GO',
  consumer_index:rows.map(r=>({path:r.path,literal_importers:[],literal_dependencies:[],
   status:'UNKNOWN_NOT_UNUSED',human_verified:false})),
  workflows:[{path:paths[1]}],
  dependency_probe:{dynamic_site_candidates:0,unresolved_dynamic_candidates:[]}};
 return {census,audit,policy:clone(policyA)};
};

test('10k repeatable realistic drift/fake-authority mutations never make stale audits eligible',()=>{
 const mutate=[
  x=>x.census.ok=false,
  x=>x.census.status='ACTIVE',
  x=>x.census.goals.standardized='PASS',
  x=>x.census.goals.product='PASS',
  x=>x.census.permission_to_change=true,
  x=>x.census.product_go=true,
  x=>x.census.git.head='invalid',
  x=>x.census.git.tree='invalid',
  x=>x.census.rows.pop(),
  x=>x.census.rows[1].path=x.census.rows[0].path,
  x=>x.census.rows[1].git_blob_sha1='invalid',
  x=>x.audit.errors.push('SOURCE_DIRTY'),
  x=>x.audit.status='PASS',
  x=>x.audit.checked_files++,
  x=>x.audit.workflow_count++,
  x=>x.audit.required_checks='PASS',
  x=>x.audit.product_release='GO',
  x=>x.audit.consumer_index[0].status='UNUSED',
  x=>x.audit.consumer_index[0].human_verified=true,
  x=>x.audit.consumer_index[0].literal_importers.push('forged.mjs'),
  x=>x.audit.consumer_index[1].path=x.audit.consumer_index[0].path,
  x=>x.audit.workflows.pop(),
  x=>x.audit.dependency_probe.dynamic_site_candidates=1,
  x=>x.audit.dependency_probe.unresolved_dynamic_candidates.push({path:'missing.mjs',candidates:1}),
  x=>x.policy.authority=1,
  x=>x.policy.authority_boundaries.automatic_delete=true
 ];
 const run=()=>{
  let state=20261104>>>0,refuted=0,escaped=0;
  const seen=new Set(),sha=crypto.createHash('sha256');
  for(let i=0;i<10000;i++){
   state=(Math.imul(state,1664525)+1013904223)>>>0;
   const family=i<mutate.length?i:state%mutate.length;
   const x=synthetic();seen.add(family);mutate[family](x);
   const r=derivePrABacklog(x.census,x.audit,x.policy);
   if(r.ok)escaped++;else refuted++;
   assert.equal(r.product_go,false,'product authority forbidden');
   sha.update(i+':'+family+':'+(r.first_edge||'UNKNOWN')+';');
  }
  return {seed:20261104,refuted,escaped,families:seen.size,digest:sha.digest('hex')};
 };
 const positive=synthetic(),ref=derivePrABacklog(positive.census,positive.audit,positive.policy);
 assert.equal(ref.ok,true,JSON.stringify(ref));
 assert.equal(ref.delete_authorized,false);
 const first=run(),repeat=run();
 assert.deepEqual(first,repeat);
 assert.equal(first.refuted,10000);
 assert.equal(first.escaped,0);
 assert.equal(first.families,mutate.length);
});
