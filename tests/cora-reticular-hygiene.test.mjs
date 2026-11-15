import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {qualifyReticularLattice,qualifyReticularCensus,observeReticularCensus,observeReticularCensusWithAudit,qualifyWorkflowTreeEvolution,reopenW1WorkflowEpoch} from '../scripts/cora-minimal-absorption.mjs';
const doc=JSON.parse(fs.readFileSync(new URL('../contracts/cora-reticular-hygiene-v1.json',import.meta.url),'utf8'));
const clone=()=>structuredClone(doc);

const fixture=()=>{
 const paths=['README.md','.github/workflows/ci.yml','tests/cora-minimal-absorption.test.mjs',
  'tests/cora-reticular-hygiene.test.mjs',...doc.reuse.owners];
 const index=paths.map((path,i)=>({path,sha:(i+1).toString(16).padStart(40,'0')}));
 const tree=structuredClone(index);
 const consumer_index=paths.map(path=>({path,status:'UNKNOWN_NOT_UNUSED',
  literal_importers:[],literal_dependencies:[],human_verified:false}));
 const workflows=[{path:'.github/workflows/ci.yml',events:['pull_request'],jobs:['qualify'],
  flags:[],required_check_status:'UNKNOWN_PROVIDER_NOT_DERIVED'}];
 const audit={schema:'ikant-v5b-live-readonly-audit/v1',status:'SOURCE_INDEXED_NOT_HUMAN_REVIEWED',
  errors:[],checked_files:paths.length,workflow_count:1,consumer_index,workflows,
  required_checks:'UNKNOWN_PROVIDER_NOT_ATTESTED',product_release:'PRODUCT_NO_GO',
  dependency_probe:{dynamic_site_candidates:2}};
 return {audit,index,tree,head:'1'.repeat(40),treeSha:'2'.repeat(40),
  ownersStable:true,deltaSafe:true,readme:'<!-- cora-reticular-source-hygiene:v1 -->'};
};

test('19-node reticulum has explicit non-compensatory SOURCE and EXTERNAL cuts',()=>{
 const r=qualifyReticularLattice(doc);
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.nodes,19);assert.equal(r.source_leaves,9);assert.equal(r.external_leaves,4);
 assert.equal(r.permission_to_change,false);assert.equal(r.product_go,false);
 assert.equal(doc.commits.git_absolute_minimum,1);
 assert.equal(doc.commits.reviewable_semantic_minimum,3);
 assert.deepEqual(doc.commits.chain.map(x=>x.depends_on),[[],['C1'],['C2']]);
});

test('full provisional census retains every row and does not promote product, unused or external proof',()=>{
 const source=fixture();
 const r=qualifyReticularCensus(doc,source);
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(r.status,'SOURCE_CANDIDATE_REQUIRES_INDEPENDENT_CI');
 assert.equal(r.git.tracked,source.index.length);
 assert.equal(r.git.workflow_count,1);
 assert.equal(r.rows.length,source.index.length);
 assert(r.rows.every(x=>x.consolidation==='RETAIN_PENDING_CONSUMER_AND_HUMAN_REVIEW'));
 assert(r.rows.every(x=>x.accountability==='HUMAN_OWNER_UNKNOWN'));
 assert(r.rows.every(x=>x.consumer_status==='UNKNOWN_NOT_UNUSED'));
 assert.equal(r.goals.prepared,'SOURCE_CANDIDATE');
 assert.equal(r.goals.standardized,'BLOCKED_EXTERNAL');
 assert.equal(r.goals.product,'BLOCKED_EXTERNAL');
 assert.equal(r.permission_to_change,false);
 assert.equal(r.product_go,false);
 assert.equal(r.unresolved_dynamic_candidates,2);
});

test('missing/forged source rows, Git blobs, workflows and provider statuses fail closed',()=>{
 const mutations=[
  x=>x.index.pop(),
  x=>x.tree.pop(),
  x=>x.tree[0].sha='f'.repeat(40),
  x=>x.index[1].path=x.index[0].path,
  x=>x.audit.consumer_index.pop(),
  x=>x.audit.consumer_index[0].human_verified=true,
  x=>x.audit.consumer_index[0].status='UNUSED',
  x=>x.audit.workflows.pop(),
  x=>x.audit.workflow_count=2,
  x=>x.audit.status='PASS',
  x=>x.audit.required_checks='PROVIDER_PASS',
  x=>x.audit.product_release='PRODUCT_GO',
  x=>x.audit.errors=['SOURCE_DIRTY']
 ];
 for(const [i,mutate] of mutations.entries()){
  const x=fixture();mutate(x);
  const r=qualifyReticularCensus(doc,x);
  assert.equal(r.ok,false,'mutation '+i+' unexpectedly passed');
  assert.equal(r.product_go,false);
 }
 for(const f of ['ownersStable','deltaSafe']){const x=fixture();x[f]=false;
  const r=qualifyReticularCensus(doc,x);
  assert.equal(r.ok,false,f);
  assert.equal(r.goals.standardized,'BLOCKED_EXTERNAL');
 }
});

test('10k deterministic reticular mutations reject owner substitution, graph corruption and false promotion',()=>{
 const mutants=[
  x=>x.authority=1,
  x=>x.active=true,
  x=>x.product_go=true,
  x=>x.retirement_authorized=true,
  x=>x.origin.target='other/repository',
  x=>x.origin.base_main='main',
  x=>x.origin.cora_head='0'.repeat(40),
  x=>x.origin.existing_V5B='some/other-audit.mjs',
  x=>x.abstract_dod.logic='WEIGHTED_SCORE',
  x=>x.abstract_dod.unknown='PASS',
  x=>x.abstract_dod.cleaning='DELETE_WHEN_NO_LITERAL_IMPORT',
  x=>x.proof_boundary.authorization='SELF_APPROVED',
  x=>x.proof_boundary.repo_standardization='PASS',
  x=>x.release='GO',
  x=>x.nodes.pop(),
  x=>x.nodes[0].id='S00',
  x=>x.nodes[0].scope='EXTERNAL',
  x=>x.nodes[0].falsifier='',
  x=>x.nodes[13].depends_on=['G_PRODUCT_QUALIFIED'],
  x=>x.nodes[16].depends_on=['G_PRODUCT_QUALIFIED'],
  x=>x.nodes[12].scope='SOURCE_GIT',
  x=>x.goals.product='G_SOURCE_PREPARED',
  x=>x.commits.reviewable_semantic_minimum=1,
  x=>x.commits.chain[2].depends_on=[],
  x=>x.first_slice.no_deleted_paths=false,
  x=>x.first_slice.no_new_workflow=false,
  x=>x.first_slice.workflow_decision='AUTO_RETIRE',
  x=>x.reuse.owners[0]='host/new-owner.mjs',
  x=>x.reuse.census='host/new-census.mjs'
 ];
 const run=()=>{
  let seed=20261104>>>0,rejected=0,unsafe=0;const seen=new Set(),hash=crypto.createHash('sha256');
  for(let i=0;i<10000;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const a=i<mutants.length?i:seed%mutants.length;
   const copy=clone(),applied=new Set([a]);
   mutants[a](copy);
   if(i>=mutants.length){
    let b=(seed>>>8)%mutants.length;
    while(applied.has(b))b=(b+1)%mutants.length;
    applied.add(b);mutants[b](copy);
   }
   const r=qualifyReticularLattice(copy);
   if(!r.ok)rejected++;
   if(r.ok||r.authority!==0||r.product_go||r.permission_to_change)unsafe++;
   seen.add(a);hash.update(i+'|'+a+'|'+(r.edge||r.status)+';');
  }
  return {rejected,unsafe,families:seen.size,digest:hash.digest('hex')};
 };
 const a=run(),b=run();
 assert.deepEqual(a,b);
 assert.equal(a.rejected,10000);
 assert.equal(a.unsafe,0);
 assert.equal(a.families,mutants.length);
});

test('CORA workflow evolution is exactly one or six reversible Git TREE deltas, never retirement',()=>{
 const evolution=doc.reuse.workflow_evolution;
 assert.equal(evolution.expected_count,116);
 assert.equal(evolution.allowed.length,6);
 assert.equal(evolution.baseline_tree,doc.reuse.baseline_workflow_tree);
 assert.equal(qualifyReticularLattice(doc).ok,true);
 const bytes=rows=>Buffer.concat(rows.sort((a,b)=>Buffer.compare(Buffer.from(a.name),Buffer.from(b.name))).map(e=>
  Buffer.concat([Buffer.from(e.mode+' '+e.name+String.fromCharCode(0)),Buffer.from(e.sha,'hex')])));
 const sha=rows=>{const d=bytes(structuredClone(rows));return crypto.createHash('sha1').update(
  Buffer.from('tree '+d.length+String.fromCharCode(0))).update(d).digest('hex')};
 const rows=[{mode:'100644',name:'a.yml',sha:'a'.repeat(40)},
  {mode:'100644',name:'b.yml',sha:'b'.repeat(40)}];
 const base=sha(rows),delta={...evolution,baseline_tree:base,expected_count:2,
  allowed:[{path:'.github/workflows/b.yml',before:'b'.repeat(40),after:'c'.repeat(40)}]};
 const evolved=rows.map(x=>x.name==='b.yml'?{...x,sha:'c'.repeat(40)}:x);
 const ok=qualifyWorkflowTreeEvolution(delta,{entries:evolved,observedTree:sha(evolved)});
 assert.equal(ok.ok,true,JSON.stringify(ok));
 assert.equal(ok.status,'ONE_REVERSED_DELTA_MATCHES_BASELINE');
 assert.equal(ok.retirement_authorized,false);
 assert.equal(qualifyWorkflowTreeEvolution(delta,{entries:rows,observedTree:base}).status,'UNCHANGED_BASELINE');
 const sixBase=Array.from({length:6},(_,i)=>({mode:'100644',name:'fixture'+i+'.yml',sha:(i+1).toString(16).repeat(40)}));
 const sixDelta={...evolution,expected_count:6,baseline_tree:sha(sixBase),
  allowed:sixBase.map((e,i)=>({path:'.github/workflows/'+e.name,before:e.sha,
   after:(i+7).toString(16).repeat(40)}))};
 const sixCurrent=sixBase.map((e,i)=>({...e,sha:(i+7).toString(16).repeat(40)}));
 const qualified=qualifyWorkflowTreeEvolution(sixDelta,{entries:sixCurrent,observedTree:sha(sixCurrent)});
 assert.equal(qualified.ok,true,JSON.stringify(qualified));
 assert.equal(qualified.status,'SIX_REVERSED_DELTAS_MATCH_BASELINE');
 assert.equal(qualified.changed_paths.length,6);
 assert.equal(qualified.retirement_authorized,false);
 for(const tamper of [
  x=>x.allowed.pop(),
  x=>x.allowed[1].path=x.allowed[0].path,
  x=>x.allowed[2].before='f'.repeat(40),
  x=>x.allowed[3].after='f'.repeat(40),
  x=>x.allowed[4].path='.github/workflows/other.yml'
 ]){
  const bad=structuredClone(sixDelta);tamper(bad);
  const result=qualifyWorkflowTreeEvolution(bad,{entries:sixCurrent,observedTree:sha(sixCurrent)});
  assert.equal(result.ok,false,'forged multi-delta not rejected');
  assert.equal(result.product_go,false);
 }
 for(const [name,bad,tree] of [
  ['omitted',evolved.slice(0,1),sha(evolved.slice(0,1))],
  ['unregistered',[evolved[0],{...evolved[1],sha:'f'.repeat(40)}],sha([evolved[0],{...evolved[1],sha:'f'.repeat(40)}])],
  ['wrong mode',[{...evolved[0],mode:'100755'},evolved[1]],sha([{...evolved[0],mode:'100755'},evolved[1]])],
  ['duplicate',[evolved[1],evolved[1]],sha([evolved[1],evolved[1]])],
  ['false tree',evolved,'f'.repeat(40)]
 ]){
  const result=qualifyWorkflowTreeEvolution(delta,{entries:bad,observedTree:tree});
  assert.equal(result.ok,false,name);
  assert.equal(result.product_go,false,name);
 }
 for(const mutate of [
  x=>x.reuse.workflow_evolution.authority=1,
  x=>x.reuse.workflow_evolution.retirement_authorized=true,
  x=>x.reuse.workflow_evolution.allowed[0].after='f'.repeat(40),
  x=>x.reuse.workflow_evolution.allowed[0].path='.github/workflows/ci.yml',
  x=>x.reuse.workflow_evolution.allowed.pop(),
  x=>x.reuse.workflow_evolution.revised_migration_epoch='0'.repeat(40),
  x=>x.reuse.workflow_evolution.baseline_tree='0'.repeat(40)]){
  const x=clone();mutate(x);
  assert.equal(qualifyReticularLattice(x).ok,false);
 }
});

test('D2 exposes one original V5-B audit together with the same CORA-qualified census',()=>{
 assert.equal(observeReticularCensusWithAudit.length,0,'no external audit injection');
 const {census,audit}=observeReticularCensusWithAudit();
 assert.equal(census.ok,true,JSON.stringify(census.obligations||census));
 assert.equal(audit.schema,'ikant-v5b-live-readonly-audit/v1');
 assert.equal(audit.status,'SOURCE_INDEXED_NOT_HUMAN_REVIEWED');
 assert.equal(audit.errors.length,0);
 assert.equal(census.git.tracked,audit.checked_files);
 assert.equal(census.git.workflow_count,audit.workflow_count);
 assert.equal(census.rows.length,audit.consumer_index.length);
 assert.equal(census.permission_to_change,false);
 assert.equal(census.goals.product,'BLOCKED_EXTERNAL');
 assert.equal(census.goals.standardized,'BLOCKED_EXTERNAL');
 const legacy=observeReticularCensus();
 assert.deepEqual(census,legacy,'legacy CORA observer must remain byte-equivalent on unchanged HEAD');
});

test('actual Git-indexed V5-B census covers the full checkout; owners unchanged, no workflow deletion',()=>{
 const r=observeReticularCensus();
 assert.equal(r.ok,true,JSON.stringify(r.errors||r.obligations));
 assert.equal(r.status,'SOURCE_CANDIDATE_REQUIRES_INDEPENDENT_CI');
 assert(r.git.tracked>1500,'unexpected tracked-source loss');
 assert.equal(r.git.workflow_count,116);
 assert.equal(r.rows.length,r.git.tracked);
 assert(r.rows.every(x=>x.accountability==='HUMAN_OWNER_UNKNOWN'));
 assert(r.rows.every(x=>x.consolidation==='RETAIN_PENDING_CONSUMER_AND_HUMAN_REVIEW'));
 assert.equal(r.goals.prepared,'SOURCE_CANDIDATE');
 assert.equal(r.goals.standardized,'BLOCKED_EXTERNAL');
 assert.equal(r.goals.product,'BLOCKED_EXTERNAL');
 assert.equal(r.product_go,false);assert.equal(r.permission_to_change,false);
});

test('W1 trigger move preserves original source-tree proof and refuses forgery',()=>{
 const original='eea411a6fd465ee3b1f35d0c2fa8fd615c116750';
 const amended='ff86094e725bf876f09ac0587fe2ce6d3218c065';
 const digest=rows=>{
  const sorted=[...rows].sort((a,b)=>Buffer.compare(Buffer.from(a.name),Buffer.from(b.name)));
  const body=Buffer.concat(sorted.map(x=>Buffer.concat([
   Buffer.from(x.mode+' '+x.name+String.fromCharCode(0)),Buffer.from(x.sha,'hex')])));
  return crypto.createHash('sha1').update(Buffer.from('tree '+body.length+String.fromCharCode(0))).update(body).digest('hex');
 };
 const before=[{name:'a.yml',mode:'100644',sha:'a'.repeat(40)},
  {name:'s03-s09-mvp1-candidate.yml',mode:'100644',sha:original}];
 const after=before.map(x=>x.name==='s03-s09-mvp1-candidate.yml'?{...x,sha:amended}:x);
 const register={schema:'ikant-v5b-change-extension/v1',authority:0,
  self_path:'governance/changes/'+'z'.repeat(40)+'-r7-pilot-root-contraction.json',
  source_main:'b2f550043d5fca89ab1d1efc2ee06a0c7c163f2c',
  automatic_approval:false,human_signoffs:0,
  paths:[{path:'.github/workflows/s03-s09-mvp1-candidate.yml',
   operation:'MODIFY',human_review:'REVIEW_REQUIRED'}]};
 const args={entries:after,observedTree:digest(after),previousTree:digest(before),
  register,historyBlob:original,liveBlob:amended};
 const good=reopenW1WorkflowEpoch(args);
 assert.equal(good.ok,true,JSON.stringify(good));assert.equal(good.review_attested,false);
 assert.equal(good.product_go,false);assert.equal(digest(good.entries),digest(before));
 for(const wrong of [
  {historyBlob:'b'.repeat(40)},{liveBlob:'f'.repeat(40)},
  {observedTree:'e'.repeat(40)},{previousTree:'f'.repeat(40)},
  {register:{...register,source_main:'f'.repeat(40)}},
  {register:{...register,human_signoffs:1}},
  {register:{...register,paths:[]}},
  {entries:after.map(x=>({...x,mode:'100755'}))}
 ]){
  const invalid=reopenW1WorkflowEpoch({...args,...wrong});
  assert.equal(invalid.ok,false,JSON.stringify(wrong));
  assert.equal(invalid.product_go,false);
 }
});
