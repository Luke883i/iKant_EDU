import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifyCandidate,derivePrABacklog,observePrABacklog} from '../scripts/cora-pr-a-backlog.mjs';
import {EVIDENCE_KEYS,PRESEEDED,assessEvidence,runSemanticFalsifier} from '../scripts/cora-pr-a-falsify-10m.mjs';

const contract=JSON.parse(fs.readFileSync(new URL('../contracts/cora-pr-a-backlog-v1.json',import.meta.url),'utf8'));
const id=s=>s.toString(16).padStart(40,'0');
function fixture(){
 const specs=[
  ['README.md',null,'UNKNOWN_NOT_UNUSED',[],[]],
  ['host/c72-public-mode-admission.mjs',null,'LITERAL_CONSUMER_OBSERVED',['tests/a.test.mjs'],[]],
  ['scripts/helper.mjs',null,'UNKNOWN_NOT_UNUSED',[],[]],
  ['scripts/dynamic.mjs',null,'UNKNOWN_NOT_UNUSED',[],[]],
  ['docs/LEGACY_COBOL.md',null,'UNKNOWN_NOT_UNUSED',[],[]],
  ['.github/workflows/ci.yml',{events:['push'],jobs:['qualify'],flags:[],required_check_status:'UNKNOWN_PROVIDER_NOT_DERIVED'},'UNKNOWN_NOT_UNUSED',[],[]],
  ['.github/workflows/write.yml',{events:['pull_request_target'],jobs:['publish'],flags:['WRITE_PERMISSION_REVIEW'],required_check_status:'UNKNOWN_PROVIDER_NOT_DERIVED'},'UNKNOWN_NOT_UNUSED',[],[]],
  ['tests/a.test.mjs',null,'UNKNOWN_NOT_UNUSED',[],[]]
 ];
 const rows=specs.map(([path,workflow,status,literal_importers,literal_dependencies],i)=>({path,
  git_blob_sha1:id(i+1),provisional_role:'PROVISIONAL',consumer_status:status,
  literal_importers,literal_dependencies,workflow,accountability:'HUMAN_OWNER_UNKNOWN'}));
 const census={ok:true,status:'SOURCE_CANDIDATE_REQUIRES_INDEPENDENT_CI',
  git:{head:id(91),tree:id(92),tracked:rows.length,workflow_count:2},rows,
  goals:{prepared:'SOURCE_CANDIDATE',standardized:'BLOCKED_EXTERNAL',product:'BLOCKED_EXTERNAL'},
  permission_to_change:false,product_go:false};
 const audit={schema:'ikant-v5b-live-readonly-audit/v1',status:'SOURCE_INDEXED_NOT_HUMAN_REVIEWED',
  checked_files:rows.length,workflow_count:2,errors:[],
  required_checks:'UNKNOWN_PROVIDER_NOT_ATTESTED',product_release:'PRODUCT_NO_GO',
  consumer_index:rows.map(r=>({path:r.path,literal_importers:r.literal_importers,
   literal_dependencies:r.literal_dependencies,status:r.consumer_status,human_verified:false})),
  workflows:rows.filter(r=>r.workflow).map(r=>({path:r.path,...r.workflow})),
  dependency_probe:{dynamic_site_candidates:1,unresolved_dynamic_candidates:[
   {path:'scripts/dynamic.mjs',kind:'DYNAMIC_POSSIBLY_UNRESOLVED',candidates:2}]}};
 return {census,audit,contract:structuredClone(contract)};
}

test('PR-A is derived from original census; all file paths covered exactly once',()=>{
 const {census,audit,contract}=fixture(),r=derivePrABacklog(census,audit,contract);
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.counted_files,8);assert.equal(r.counted_workflows,2);
 assert.equal(new Set(r.rows.map(x=>x.path)).size,8);
 assert.equal(r.dynamic_path_count,1);
 assert.equal(r.rows.find(x=>x.path==='README.md').decision,'RETAIN_GUARDED');
 assert(r.rows.find(x=>x.path==='scripts/dynamic.mjs').signals.includes('DYNAMIC_CONSUMER'));
 assert(r.rows.find(x=>x.path==='.github/workflows/write.yml').signals.includes('WORKFLOW_HAZARD'));
 assert(r.rows.find(x=>x.path==='docs/LEGACY_COBOL.md').signals.includes('DOCUMENT_VIGENCY'));
 assert.equal(r.rows.find(x=>x.path==='scripts/helper.mjs').consumer_closure,'UNKNOWN');
 assert.equal(r.reticulum.standardized,'BLOCKED_EXTERNAL');
 assert(r.rows.every(x=>x.delete_authorized===false&&x.workflow_retirement_authorized===false));
 assert.equal(r.authority,0);assert.equal(r.product_go,false);
});

test('source drift, false provider proof, orphan dynamic site and forged consumer are rejected',()=>{
 const mutations=[
  x=>x.census.ok=false,
  x=>x.census.goals.standardized='PASS',
  x=>x.census.git.head='main',
  x=>x.census.rows.pop(),
  x=>x.census.rows[2].path=x.census.rows[1].path,
  x=>x.audit.checked_files++,
  x=>x.audit.consumer_index.pop(),
  x=>x.audit.consumer_index[1].status='UNUSED',
  x=>x.audit.consumer_index[1].human_verified=true,
  x=>x.audit.workflows.pop(),
  x=>x.audit.workflows[1].path=x.audit.workflows[0].path,
  x=>x.audit.dependency_probe.unresolved_dynamic_candidates[0].path='ghost.mjs',
  x=>x.audit.dependency_probe.dynamic_site_candidates=0,
  x=>x.audit.required_checks='CI_GREEN_PROVIDER_VERIFIED',
  x=>x.audit.product_release='PRODUCT_GO',
  x=>x.contract.authority_boundaries.automatic_delete=true,
  x=>x.contract.evidence_model.product='PASS',
  x=>x.audit.errors.push('GIT_HEAD_CHANGED')
 ];
 for(const [i,m] of mutations.entries()){
  const x=fixture();m(x);
  const r=derivePrABacklog(x.census,x.audit,x.contract);
  assert.equal(r.ok,false,'mutant '+i+' passed');
  assert.equal(r.product_go,false);assert.equal(r.delete_authorized,false);
 }
});

test('unknown or unproven consumers never authorize deletion, even with zero literal imports',()=>{
 const x=fixture();const row=x.census.rows[2];
 const r=classifyCandidate(row,{dynamicPaths:new Set()});
 assert.equal(r.ok,true);assert.equal(r.consumer_status,'UNKNOWN_NOT_UNUSED');
 assert.equal(r.consumer_closure,'UNKNOWN');assert.equal(r.decision,'INVESTIGATE_ONLY');
 assert.equal(r.delete_authorized,false);
 const bad=classifyCandidate({...row,consumer_status:'UNUSED'});
 assert.equal(bad.ok,false);
});

test('pure evidence evaluator has independent positive and negative controls',()=>{
 const f={authority:0,claim_active:false,claim_auto_retire:false,
  source_status:'GIT_OBSERVED_NOT_PROVIDER'};
 for(const k of EVIDENCE_KEYS)f[k]=true;
 assert.equal(assessEvidence(f).evidence_complete,true);
 assert.equal(assessEvidence(f).automatic_retirement,false);
 assert.equal(assessEvidence(f).product_go,false);
 for(const k of EVIDENCE_KEYS){const changed={...f,[k]:false};
  assert.equal(assessEvidence(changed).evidence_complete,false,k);
 }
 for(const key of ['claim_active','claim_auto_retire']){
  assert.equal(assessEvidence({...f,[key]:true}).evidence_complete,false);
 }
});

test('preseeded 10 million semantic vectors repeat and reject false owner/provider promotions',()=>{
 assert.equal(PRESEEDED.length,40);
 const a=runSemanticFalsifier({iterations:10000000,seed:20261104});
 assert.equal(a.pass,true,JSON.stringify(a));
 assert.equal(a.negative+a.positive,10000000);
 assert.equal(a.covered_families,40);
 assert.equal(a.unsafe_authority_promotions,0);
 assert.equal(a.oracle_mismatches,0);
 assert.equal(a.digest_sha256,'fadc21e2d1d342e2e8be640f5e4841e472aa96c5f8ad8d3517ef86718f0c12d0');
 const x=runSemanticFalsifier({iterations:20000,seed:883});
 const y=runSemanticFalsifier({iterations:20000,seed:883});
 assert.deepEqual(x,y);
});

test('D2 PR-A source imports one CORA-owned audit snapshot without secondary V5-B scan',()=>{
 const source=fs.readFileSync(new URL('../scripts/cora-pr-a-backlog.mjs',import.meta.url),'utf8');
 assert.match(source,/observeReticularCensusWithAudit\(\)/);
 assert.doesNotMatch(source,/\bauditRepository\s*\(/);
 assert.match(source,/derivePrABacklog\(census,audit,contract\)/);
});

test('actual checkout: original V5-B and CORA full readback generates finite backlog',()=>{
 const r=observePrABacklog();
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.rows.length,r.counted_files);
 assert(r.counted_files>=1500);
 assert.equal(r.counted_workflows,116);
 assert.equal(r.by_priority.P0+r.by_priority.P1+r.by_priority.P2+r.by_priority.P3,r.counted_files);
 assert.equal(new Set(r.rows.map(x=>x.path)).size,r.counted_files);
 assert(r.rows.every(x=>x.authority===0&&x.product_go===false));
 assert.equal(r.pr_a_state,'SOURCE_BACKLOG_CANDIDATE_REQUIRES_INDEPENDENT_REVIEW');
 assert.equal(r.reticulum.standardized,'BLOCKED_EXTERNAL');
 assert.equal(r.reticulum.product,'BLOCKED_EXTERNAL');
});
