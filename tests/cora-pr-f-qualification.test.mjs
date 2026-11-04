import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {validateFContract,evaluateFReticulation,observePrFSource}
 from '../scripts/cora-pr-f-qualification.mjs';
import {FAMILIES,assessSemanticCut,runFMutations}
 from '../scripts/cora-pr-f-falsify-1m.mjs';

const contract=JSON.parse(fs.readFileSync(new URL('../contracts/cora-pr-f-integrated-qualification-v1.json',import.meta.url),'utf8'));
const clone=x=>structuredClone(x);
const g=(...args)=>execFileSync('git',args,{encoding:'utf8',timeout:20000}).trim();
test('PR-F contract is a retrograde, noncompensatory view of original CORA',()=>{
 const v=validateFContract(contract);
 assert.equal(v.ok,true,JSON.stringify(v));
 assert.equal(v.nodes,18);
 assert.equal(contract.reticulum.filter(x=>x.scope==='GLOBAL').length,2);
 assert.equal(contract.reticulum.filter(x=>x.scope==='INTERMEDIATE').length,3);
 assert.equal(contract.metrics.length,19);
 assert.equal(contract.checklist.length,13);
 assert.deepEqual(contract.reticulum.find(x=>x.id==='G_REPOSITORY_STANDARDIZED').needs,
  ['I_SOURCE','I_ENGINEERING','I_EXTERNAL']);
 assert.deepEqual(contract.reticulum.find(x=>x.id==='G_PRODUCT_QUALIFIED').needs,
  ['G_REPOSITORY_STANDARDIZED','X_PRODUCT']);
 assert.equal(contract.reuse.v5b,'scripts/v5b-repository-governance-audit.mjs#auditRepository');
 assert.equal(contract.reuse.cora,'scripts/cora-minimal-absorption.mjs#observeReticularCensusWithAudit');
 assert.equal(contract.abstract_dod.unknown_is_not_pass,true);
 assert(Object.values(contract.nonpromotion).every(x=>x===false));
});
test('real Git tree contains the eleven original historical blobs, without transfer of runtime ownership',()=>{
 assert.equal(contract.restored_source_blobs.length,11);
 for(const {path,blob} of contract.restored_source_blobs){
  assert.equal(g('rev-parse','HEAD:'+path),blob,'restore mismatch '+path);
 }
 assert.equal(contract.nonpromotion.restored_historical_files_are_runtime,false);
 assert.equal(g('rev-parse','HEAD:.github/workflows'),
  'd81958913446a13f5fb296d20771c7e57e2df224');
});
test('real original source observer reconciles all five slices and refuses external promotion',()=>{
 const r=observePrFSource();
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.status,'PR_F_SOURCE_CANDIDATE_EXTERNAL_GATES_OPEN');
 assert.match(r.source.head,/^[a-f0-9]{40}$/);
 assert.equal(r.source.tree,g('rev-parse','HEAD^{tree}'));
 assert.equal(r.metrics.M01,0);
 assert.equal(r.metrics.M02,1);
 assert.equal(r.metrics.M03,4);
 assert.equal(r.metrics.M04,116);
 assert.equal(r.metrics.M06,11);
 assert.equal(r.metrics.M07,0);
 assert.equal(r.metrics.M08,true);
 assert.equal(r.metrics.M09,8);
 assert.equal(r.metrics.M10,1);
 assert.equal(r.metrics.M11,true);
 assert.equal(r.documents.atlas_exact,true);
 assert.equal(r.recovery.byte_exact_subset,true);
 assert.equal(r.recovery.restored.length,11);
 assert.equal(r.backlog.total,r.source.tracked);
 assert(r.backlog.unverified_consumers>0,'UNKNOWNS must be visible');
 assert.equal(r.original_reticulum.standardized,'BLOCKED_EXTERNAL');
 assert.equal(r.original_reticulum.product,'BLOCKED_EXTERNAL');
 assert.equal(r.model.source_model_complete,true);
 assert.equal(r.model.repository_standardized,false);
 assert.equal(r.model.product_go,false);
 assert.equal(r.repo_standardized,false);
 assert.equal(r.human_review,'NOT_ATTESTED');
 assert.equal(r.ci.required_checks,'UNKNOWN_PROVIDER_NOT_ATTESTED');
 assert.equal(r.first_edge,'F06_CLEAN_CHECKOUT_NOT_PROVEN');
});
test('truth table: one missing mandatory gate blocks; even all-true model has no authority',()=>{
 const leaf=contract.reticulum.filter(n=>n.needs.length===0).map(n=>n.id);
 assert.equal(leaf.length,13);
 const everything=Object.fromEntries(leaf.map(k=>[k,true]));
 const full=evaluateFReticulation(contract,everything);
 assert.equal(full.ok,true);
 assert.equal(full.full_logical_model_complete,true);
 assert.equal(full.product_logical_model_complete,true);
 assert.equal(full.repository_standardized,false);
 assert.equal(full.product_go,false);
 assert.equal(full.approval,'NOT_ATTESTED');
 for(const id of leaf){
  const x=evaluateFReticulation(contract,{...everything,[id]:false});
  assert.equal(x.ok,true);
  assert.equal(x.full_logical_model_complete,id==='X_PRODUCT');
  assert.equal(x.product_logical_model_complete,false);
  assert.equal(x.repo_standardized,undefined);
  assert.equal(x.repository_standardized,false);
 }
 const empty=evaluateFReticulation(contract,{});
 assert.equal(empty.source_model_complete,false);
 assert.equal(empty.first_edge,'F01');
});
test('falsify contract modifications: graph cycles, missing paths, fake authority and evidence',()=>{
 const mutations=[
  x=>x.authority=1,
  x=>x.owner=true,
  x=>x.release='GO',
  x=>x.active=true,
  x=>x.product_go=true,
  x=>x.abstract_dod.logic='WEIGHTED_AVERAGE',
  x=>x.abstract_dod.unknown_is_not_pass=false,
  x=>x.nonpromotion.claims_human_approval_from_git=true,
  x=>x.nonpromotion.automatic_merge=true,
  x=>x.restored_source_blobs[0].blob='not-a-git-sha',
  x=>x.restored_source_blobs[0].path=x.restored_source_blobs[1].path,
  x=>x.reticulum[0].needs=['G_REPOSITORY_STANDARDIZED'],
  x=>x.reticulum.pop(),
  x=>x.reticulum[17].needs=['G_PRODUCT_QUALIFIED'],
  x=>x.reticulum.find(n=>n.id==='I_SOURCE').needs=['F01'],
  x=>x.source.repository='other/repo',
  x=>x.mutation_campaign.families=1
 ];
 for(const [i,mut] of mutations.entries()){
  const x=clone(contract);mut(x);
  const result=validateFContract(x);
  assert.equal(result.ok,false,'mutant '+i+' survived '+JSON.stringify(result));
  assert.equal(result.product_go,false);
  assert.equal(result.repo_standardized,false);
 }
});
test('1,000,000 realistic preseeded vectors replay deterministically with an independent oracle',()=>{
 assert.equal(FAMILIES.length,48);
 const x=runFMutations({cases:1000000,seed:20261104});
 const y=runFMutations({cases:1000000,seed:20261104});
 assert.deepEqual(x,y,'repeat differs');
 assert.equal(x.pass,true,JSON.stringify(x));
 assert.equal(x.cases,1000000);
 assert.equal(x.preseeded_families,48);
 assert.equal(x.covered_families,48);
 assert.equal(x.unsafe_promotions,0);
 assert.equal(x.oracle_disagreements,0);
 assert.equal(x.positive_model_controls+x.negative_semantic_vectors,1000000);
 assert.match(x.digest_sha256,/^[a-f0-9]{64}$/);
 assert.equal(x.git_edits,0);
 assert.equal(x.provider_events,0);
 assert.equal(x.human_reviews,0);
});
test('positive and negative controls can never become provider, human, or active receipts',()=>{
 const full=(1<<12)-1;
 const normal={authority:0,source_kind:'FINITE_SEMANTIC_MODEL',
  claim_human_review:false,claim_product_go:false,
  claim_admin_required_checks:false,claim_native_delivery:false};
 const all=assessSemanticCut(full,normal);
 assert.equal(all.eligible_model,true);
 assert.equal(all.first_edge,'MODEL_COMPLETE_NOT_A_RECEIPT');
 assert.equal(all.repository_standardized,false);
 assert.equal(all.product_go,false);
 for(let i=0;i<12;i++){
  const r=assessSemanticCut(full^(1<<i),normal);
  assert.equal(r.eligible_model,false);
  assert.equal(r.first_edge,'F'+String(i+1).padStart(2,'0')+'_NOT_PROVEN');
 }
 for(const forge of [
  {...normal,claim_human_review:true},
  {...normal,claim_admin_required_checks:true},
  {...normal,claim_native_delivery:true},
  {...normal,claim_product_go:true},
  {...normal,authority:1}]){
  const z=assessSemanticCut(full,forge);
  assert.equal(z.eligible_model,false);
  assert.equal(z.first_edge,'FORGED_EXTERNAL_OR_AUTHORITY');
  assert.equal(z.product_go,false);
 }
});
