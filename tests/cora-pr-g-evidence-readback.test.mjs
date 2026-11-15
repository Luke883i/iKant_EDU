import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {qualifyGEvidence,observePrGEvidence}
 from '../scripts/cora-pr-g-evidence-readback.mjs';
import {validateFContract} from '../scripts/cora-pr-f-qualification.mjs';
import {censusRepo} from '../scripts/project-review-callsites.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contract=JSON.parse(fs.readFileSync(path.join(ROOT,
 'contracts/cora-pr-f-integrated-qualification-v1.json'),'utf8'));
const register=JSON.parse(fs.readFileSync(path.join(ROOT,
 'governance/changes/zzzzzzzzzzzzzzzzzz-cora-pr-g-evidence.json'),'utf8'));
const workflowTree='d81958913446a13f5fb296d20771c7e57e2df224';
const one='a'.repeat(40),two='b'.repeat(40),pathsSha='c'.repeat(64);
const clone=x=>structuredClone(x);
const git=(...a)=>execFileSync('git',a,{cwd:ROOT,encoding:'utf8',timeout:20000}).trim();
const fixture=()=>{
 const f={ok:true,status:'PR_F_SOURCE_CANDIDATE_EXTERNAL_GATES_OPEN',
  authority:0,active:false,product_go:false,repo_standardized:false,
  human_review:'NOT_ATTESTED',postmerge:'NOT_ATTESTED',
  model:{repository_standardized:false,product_go:false},
  original_reticulum:{standardized:'BLOCKED_EXTERNAL',product:'BLOCKED_EXTERNAL'},
  source:{head:one,tree:two,workflow_tree:workflowTree,tracked:3,
   previously_registered_missing_paths:9},
  metrics:{M01:0,M02:1,M03:4,M04:116,M05:workflowTree,M06:11,M07:0,
   M08:true,M09:8,M10:1,M11:true},
  recovery:{byte_exact_subset:true,restored:Array.from({length:11},(_,i)=>({path:'historical/'+i,match:true})),
   historical_status:'HISTORICAL_NOT_RUNTIME'},
  documents:{atlas_exact:true,source_qualified:true},
  ci:{source_qualified:true,required_checks:'UNKNOWN_PROVIDER_NOT_ATTESTED'},
  witnesses:{F01:true,F02:true,F03:true,F04:true,F05:true,
   F06:false,F07:false,F08:false,F09:false,F10:false,F11:false,
   F12:false,X_PRODUCT:false},
  backlog:{unverified_consumers:3}
 };
 const callsite={schema:'ikant-host-callsite-census/v1',authority:0,
  epistemic_status:'SOURCE_LEXICAL_CENSUS_NOT_RUNTIME_REACHABILITY',
  tracked_file_count:3,js_files_parsed:2,callsite_count:2,
  unknown_target_count:1,source_sha256:pathsSha,callsites:[
   {path:'a.mjs',line:1,kind:'import (',expression:'dynamicPath',target:null,qualification:'DYNAMIC_TARGET_UNKNOWN'},
   {path:'b.mjs',line:2,kind:'require (',expression:"'./x.mjs'",target:'./x.mjs',qualification:'LITERAL'}
  ]};
 return {f,callsite,contract,head:one,tree:two,trackedDigest:pathsSha};
};
test('PR-G reuses original PR-F reticulum and V5-B single change register',()=>{
 assert.equal(validateFContract(contract).ok,true);
 assert.equal(register.schema,'ikant-v5b-change-extension/v1');
 assert.equal(register.authority,0);
 assert.equal(register.human_review_completed,false);
 assert.equal(register.source_main,'838c8f7c26353b5256ab236bcc662a2cd6775ffa');
 assert.deepEqual(register.paths.map(x=>[x.path,x.operation]),[
  ['governance/changes/zzzzzzzzzzzzzzzzzz-cora-pr-g-evidence.json','ADD'],
  ['scripts/cora-pr-g-evidence-readback.mjs','ADD'],
  ['tests/cora-pr-g-evidence-readback.test.mjs','ADD'],
  ['README.md','MODIFY']]);
 assert.equal(register.paths.at(-1).supersedes_register,
  'governance/changes/zzzzzzzzzzzzzzzzz-cora-pr-f-qualification.json');
 assert.equal(register.paths.at(-1).human_review,'REVIEW_REQUIRED');
});
test('pure positive source fixture passes without conferring external approval',()=>{
 const r=qualifyGEvidence(fixture());
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.status,'SOURCE_PACKET_READY_EXTERNAL_DOD_BLOCKED');
 assert.equal(r.original_F_nodes.length,18);
 assert.equal(r.consumers.dynamic_unknown,1);
 assert.equal(r.consumers.unresolved_callsites.length,1);
 assert.equal(r.consumers.unresolved_callsites[0].closure,'REVIEW_REQUIRED_NOT_RUNTIME_REACHABILITY');
 assert.equal(r.required_checks,'UNKNOWN_ADMIN_READBACK');
 assert.equal(r.independent_engineers,0);
 assert.equal(r.approval,'NOT_ATTESTED');
 assert.equal(r.human_decision,'NOT_ATTESTED');
 assert.equal(r.repository_standardized,false);
 assert.equal(r.product_go,false);
 assert.equal(r.permission_to_merge,false);
 assert.equal(r.permission_to_delete,false);
 assert.match(r.evidence_digest_sha256,/^[0-9a-f]{64}$/);
});
test('exact main checkout independently reproduces original PR-F plus complete callsite queue',()=>{
 const r=observePrGEvidence();
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.status,'SOURCE_PACKET_READY_EXTERNAL_DOD_BLOCKED');
 assert.equal(r.source.head,git('rev-parse','HEAD'));
 assert.equal(r.source.tree,git('rev-parse','HEAD^{tree}'));
 assert.equal(r.source.current_workflow_tree,git('rev-parse','HEAD:.github/workflows'));
 assert.equal(r.source.workflow_tree,workflowTree);
 assert.equal(r.source.workflow_history?.historic_tree,workflowTree);
 assert.equal(r.source.workflow_history?.current_tree,r.source.current_workflow_tree);
 assert.equal(r.source.workflow_history?.source_only,true);
 assert.equal(r.source.workflow_history?.provider_attested,false);
 const scanned=censusRepo(ROOT);
 assert.equal(r.consumers.dynamic_unknown,scanned.unknown_target_count);
 assert.equal(r.consumers.lexical_callsites,scanned.callsite_count);
 assert.equal(r.consumers.unresolved_callsites.length,scanned.unknown_target_count);
 assert.equal(r.source.tracked,scanned.tracked_file_count);
 assert.equal(r.source.owner_pins_observed,4);
 assert.equal(r.source.restored_original_blobs,11);
 assert.equal(r.consumers.closure,'UNKNOWN_REQUIRES_INDEPENDENT_REVIEW');
 assert.equal(r.original_F_nodes.find(x=>x.id==='F10').status,
  'GITHUB_ADMIN_REQUIRED_CHECKS_UNKNOWN');
 assert.equal(r.original_F_nodes.find(x=>x.id==='F11').status,
  'TWO_INDEPENDENT_ENGINEERS_HUMAN_DECISION_NOT_ATTESTED');
 assert.equal(r.original_F_nodes.find(x=>x.id==='G_REPOSITORY_STANDARDIZED').status,
  'BLOCKED_EXTERNAL');
 assert.equal(r.repository_standardized,false);
 assert.equal(r.permission_to_merge,false);
 assert.equal(r.product_go,false);
});
test('10,000 reproducible semantic evidence faults reject stale, forged and incomplete inputs',()=>{
 const fault=[
  x=>x.f.ok=false,
  x=>x.f.status='ACTIVE',
  x=>x.f.authority=1,
  x=>x.f.active=true,
  x=>x.f.product_go=true,
  x=>x.f.repo_standardized=true,
  x=>x.f.human_review='APPROVED',
  x=>x.f.postmerge='PASS',
  x=>x.f.model.repository_standardized=true,
  x=>x.f.original_reticulum.standardized='PASS',
  x=>x.f.source.head='d'.repeat(40),
  x=>x.f.source.tree='d'.repeat(40),
  x=>x.f.source.workflow_tree='d'.repeat(40),
  x=>x.f.metrics.M01=1,
  x=>x.f.metrics.M02=0.999,
  x=>x.f.metrics.M03=3,
  x=>x.f.metrics.M04=115,
  x=>x.f.metrics.M06=10,
  x=>x.f.metrics.M07=1,
  x=>x.f.metrics.M08=false,
  x=>x.f.metrics.M09=7,
  x=>x.f.metrics.M10=0.9,
  x=>x.f.metrics.M11=false,
  x=>x.f.recovery.historical_status='RUNTIME_ACTIVE',
  x=>x.f.recovery.restored.pop(),
  x=>x.f.documents.source_qualified=false,
  x=>x.f.ci.source_qualified=false,
  x=>x.f.ci.required_checks='PROVIDER_PASS',
  x=>x.f.witnesses.F06=true,
  x=>x.f.witnesses.F09=true,
  x=>x.callsite.schema='runtime-verified',
  x=>x.callsite.authority=1,
  x=>x.callsite.epistemic_status='RUNTIME_REACHABILITY_PROVEN',
  x=>x.callsite.callsite_count++,
  x=>x.callsite.unknown_target_count=0,
  x=>x.callsite.source_sha256='e'.repeat(64),
  x=>x.callsite.callsites[0].line=0,
  x=>x.callsite.callsites[0].target='./forged.mjs',
  x=>x.callsite.callsites[1].target=null,
  x=>x.trackedDigest='f'.repeat(64),
  x=>x.head='e'.repeat(40),
  x=>x.tree='e'.repeat(40)
 ];
 const run=()=>{
  let seed=20261105>>>0,rejected=0,survived=0,unsafe=0;
  const coverage=new Set(),digest=crypto.createHash('sha256');
  for(let i=0;i<10000;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const index=i<fault.length?i:seed%fault.length;
   coverage.add(index);
   const x=fixture();
   fault[index](x);
   const r=qualifyGEvidence(x);
   if(r.ok)survived++;else rejected++;
   if(r.repository_standardized!==false||r.product_go!==false||
     r.active!==false||r.authority!==0)unsafe++;
   digest.update(i+':'+index+':'+r.first_edge+':'+(r.ok?'1':'0')+';');
  }
  return {seed:20261105,rejected,survived,unsafe,
   families:fault.length,covered:coverage.size,digest:digest.digest('hex')};
 };
 const a=run(),b=run();
 assert.deepEqual(a,b,'not reproducible');
 assert.equal(a.rejected,10000,JSON.stringify(a));
 assert.equal(a.survived,0);
 assert.equal(a.unsafe,0);
 assert.equal(a.covered,a.families);
});
test('external promotional claims remain impotent without original review and provider receipts',()=>{
 const x=fixture();
 x.f.fake_provider_installation='ACTIVE';
 x.f.github_administration='APPROVED';
 x.f.benchmark_95_percent='PASS';
 x.f.blessed_by_ci=true;
 x.callsite.external_reviewer='APPROVED';
 const r=qualifyGEvidence(x);
 assert.equal(r.ok,true);
 assert.equal(r.independent_engineers,0);
 assert.equal(r.human_decision,'NOT_ATTESTED');
 assert.equal(r.provider,'NOT_ATTESTED');
 assert.equal(r.required_checks,'UNKNOWN_ADMIN_READBACK');
 assert.equal(r.repository_standardized,false);
 assert.equal(r.permission_to_merge,false);
 assert.equal(r.product_go,false);
});

test('reject unbound changed workflow tree in source-only G packet',()=>{
 const forged=fixture();
 forged.f.source.current_workflow_tree='e'.repeat(40);
 const r=qualifyGEvidence(forged);
 assert.equal(r.ok,false);
 assert.equal(r.first_edge,'G_WORKFLOW_MIGRATION_BOUNDARY_INVALID');
 assert.equal(r.permission_to_merge,undefined);
});
