import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 validateStreamProfile,evaluateStreamLogic,classifySemanticSources,observeThreeStreamSource
} from '../scripts/cora-three-streams-audit.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const CONTRACT=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/cora-three-streams-retrograde-v1.json'),'utf8'));
const copy=x=>JSON.parse(JSON.stringify(x));
const LEAVES=CONTRACT.nodes.filter(x=>x.scope==='SOURCE'||x.scope==='EXTERNAL');
const ALL=Object.fromEntries(LEAVES.map(x=>[x.id,true]));
test('retrograde DAG is ordered, non-promoting and bound to existing PR-F ownerless source',()=>{
 const r=validateStreamProfile(CONTRACT);
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.nodes,23);
 assert.deepEqual(CONTRACT.protocol.streams,['I_S1','I_S2','I_S3']);
 assert.equal(CONTRACT.reuse.integrated,'contracts/cora-pr-f-integrated-qualification-v1.json');
 assert.equal(CONTRACT.protocol.allow_archive,false);
 assert.equal(CONTRACT.protocol.allow_workflow_retirement,false);
 assert.equal(CONTRACT.protocol.allow_prompt_install,false);
});
test('all-true *synthetic* model never mints runtime, review, release or archive',()=>{
 const x=evaluateStreamLogic(CONTRACT,ALL);
 assert.equal(x.ok,true);
 assert.equal(x.model_engineering_complete,true);
 assert.equal(x.model_product_complete,true);
 assert.equal(x.standardized,false);
 assert.equal(x.product_go,false);
 assert.equal(x.archive_allowed,false);
 assert.equal(x.original_owner,'NOT_INVOKED');
 assert.equal(x.independent_review,'NOT_ATTESTED');
 assert.equal(x.provider,'NOT_ATTESTED');
});
test('source-only observations cannot close S1 S2 or S3',()=>{
 const q=Object.fromEntries(LEAVES.filter(x=>x.scope==='SOURCE').map(x=>[x.id,true]));
 const x=evaluateStreamLogic(CONTRACT,q);
 for(const id of ['I_S1','I_S2','I_S3','G_REPOSITORY','G_PRODUCT'])
  assert.notEqual(x.state[id],'MODEL_TRUE',id);
 assert.equal(x.first_edge,'E01');
});
test('remove one source or external prerequisite and the required AND root falls',()=>{
 for(const leaf of LEAVES){
  const claims={...ALL,[leaf.id]:false};
  const x=evaluateStreamLogic(CONTRACT,claims);
  assert.equal(x.model_product_complete,false,leaf.id);
  if(leaf.id!=='E08')assert.equal(x.model_engineering_complete,false,leaf.id);
  assert.equal(x.standardized,false);
 }
});
test('source classifier separates actual declared conflict from proof of active concurrency',()=>{
 const fake={
  'BOOTSTRAP.json':'canonical_repository: Luke883i/iKant_EDU',
  'contracts/project-host-tool-grounding-abi.json':'HOST_TOOL_ARG_RELAY, SAME_NODE_CALLBACKS',
  'host/project-c72-transport-frontier.mjs':"['CALLBACKS','NODE_HTTPS','HOST_PACKET','HOST_FILE']; Luke883i/iKant_LE/archive/",
  'project/session-chat/PROMPT.txt':'iKant EDU'+'X'.repeat(250),
  'project-baseline/PROJECT_PROMPT.txt':'iKant_LE historical',
  'project/oneshell-v7/PROMPT_TEMPLATE.txt':'iKant_LE historical',
  'host/project-oneshell-continuous.mjs':"from './project-oneshell-edu.mjs'; from './c72-public-mode-admission.mjs'"
 };
 fake['project/edu-oneshell/PROMPT_INNESCO.txt']=fake['project/session-chat/PROMPT.txt']+'\\nPROJECT_SOURCE=project/session-chat/PROMPT.txt; NOT_INSTALLED';
 const a=classifySemanticSources(fake);
 assert.equal(a.C1,'DUAL_DECLARED_PRIORITY_REQUIRES_CALL_PATH_REVIEW');
 assert.equal(a.C2,'HISTORICAL_ZIP_URL_IN_HOST_MODULE');
 assert.equal(a.C3,'DERIVED_ALIAS_PREFIX_BYTE_CHECK');
 assert.equal(a.C4,'HISTORICAL_PROMPTS_CONSUMER_REVIEW');
 assert.equal(a.C5,'SOURCE_DELEGATION_NOT_PARALLEL_WRITER_PROOF');
 assert.equal(a.owner_concurrency_proven,false);
 const b=classifySemanticSources({});
 for(const k of ['C1','C2','C3','C4','C5'])assert.equal(b[k],'SOURCE_UNRESOLVED');
});
test('read real pinned source blobs with Git object replay; no runtime promotion',()=>{
 const r=observeThreeStreamSource();
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.source_pins.length,8);
 assert.equal(r.semantic_candidates.C1,'DUAL_DECLARED_PRIORITY_REQUIRES_CALL_PATH_REVIEW');
 assert.equal(r.semantic_candidates.C2,'HISTORICAL_ZIP_URL_IN_HOST_MODULE');
 assert.equal(r.semantic_candidates.C3,'DERIVED_ALIAS_PREFIX_BYTE_CHECK');
 assert.equal(r.semantic_candidates.C5,'SOURCE_DELEGATION_NOT_PARALLEL_WRITER_PROOF');
 assert.equal(r.standardized,false);
 assert.equal(r.archive_allowed,false);
 assert.equal(r.original_owner,'NOT_INVOKED');
 assert.equal(r.provider,'NOT_ATTESTED');
 assert.equal(r.first_edge,'R02');
});
test('20k deterministic realistic profile mutants are all rejected, same digest twice',()=>{
 const faults=[
 x=>x.authority=1,x=>x.owner=true,x=>x.active=true,x=>x.release='GO',
 x=>x.product_go=true,x=>x.global_closure_attested=true,
 x=>x.field_closure_attested=true,x=>x.abstract_dod.logic='OR',
 x=>x.abstract_dod.unknown_is_not_pass=false,
 x=>x.abstract_dod.host_profile_may_authorize=true,
 x=>x.protocol.allow_archive=true,x=>x.protocol.allow_owner_change=true,
 x=>x.protocol.allow_prompt_install=true,x=>x.protocol.allow_workflow_retirement=true,
 x=>x.protocol.require_second_engineer=false,x=>x.protocol.require_human_decision=false,
 x=>x.nodes.pop(),x=>x.nodes[0].id='FAKE',x=>x.nodes[1].needs=[],
 x=>x.nodes[9].needs=['E01'],x=>x.nodes[18].scope='SOURCE',
 x=>x.observed_source_pins['BOOTSTRAP.json']='a'.repeat(40),
 x=>x.source.source_head='a'.repeat(40),
 x=>x.source.cora_observed_head='a'.repeat(40),
 x=>x.reuse.integrated='fake'
 ];
 function run(){
  let seed=20261105>>>0,rejected=0,survived=0,unsafe=0;
  const coverage=new Set(),sequence=[];
  for(let i=0;i<20000;i++){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const j=i<faults.length?i:seed%faults.length;
   coverage.add(j);const p=copy(CONTRACT);faults[j](p);
   const v=validateStreamProfile(p);
   if(v.ok)survived++;else rejected++;
   if(v.standardized!==false||v.product_go!==false||v.archive_allowed!==false)unsafe++;
   sequence.push(j+':'+(v.ok?'S':'R'));
  }
  return {cases:20000,rejected,survived,unsafe,covered:coverage.size,families:faults.length,trace:sequence.join(';')};
 }
 const a=run(),b=run();assert.deepEqual(a,b);
 assert.equal(a.covered,a.families);
 assert.equal(a.rejected,20000);
 assert.equal(a.survived,0);
 assert.equal(a.unsafe,0);
});
