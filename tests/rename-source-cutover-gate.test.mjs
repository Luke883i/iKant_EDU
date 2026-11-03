import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateCutoverSource,OLD,NEW,REPOSITORY_ID} from '../scripts/rename-source-cutover-gate.mjs';
const H='a'.repeat(40),T='b'.repeat(40);
function snapshot(mode='CANDIDATE'){
 const name=mode==='MAIN_POST'?NEW:OLD;
 return {mode,remote_id:REPOSITORY_ID,remote_name:name,branch:'main',
  local_head:H,local_tree:T,remote_main_head:mode==='CANDIDATE'?null:H,
  remote_main_tree:mode==='CANDIDATE'?null:T,
  bootstrap_repository:name,admission_repository:name,
  c72_repository:name,c72_repository_id:REPOSITORY_ID,
  prompt_source_id_present:true,prompt_installed_equivalence_claim:false,
  originals_git_sha_verified:true};
}
test('same GitHub ID with OLD PR source yields only structural candidate, never rename GO',()=>{
 const r=evaluateCutoverSource(snapshot());
 assert.equal(r.ok,true);
 assert.equal(r.status,'CANDIDATE_SOURCE_COHERENT_NOT_MAIN_OR_RENAME_GO');
 assert.equal(r.rename_go,false);
 assert.equal(r.provider_prompt_installed,'UNKNOWN');
 assert.equal(r.original_owner_invoked,false);
 assert.equal(r.zero_gap_atomicity_proven,false);
});
test('MAIN_PRE requires independent remote HEAD/TREE match before any cutover',()=>{
 const r=evaluateCutoverSource(snapshot('MAIN_PRE'));assert.equal(r.ok,true);
 assert.equal(r.rename_go,false);
 for(const field of ['remote_main_head','remote_main_tree']){
  const x={...snapshot('MAIN_PRE'),[field]:'f'.repeat(40)};
  assert.equal(evaluateCutoverSource(x).edge,'GITHUB_MAIN_HEAD_TREE_STALE');
 }
});
test('ADMIN rename first with OLD Git sources is a mandatory STOP, not zero-gap proof',()=>{
 const x=snapshot('MAIN_POST');x.bootstrap_repository=OLD;
 assert.equal(evaluateCutoverSource(x).edge,'ORIGINAL_SOURCE_NAME_CONFLICT');
 x.bootstrap_repository=NEW;x.admission_repository=OLD;
 assert.equal(evaluateCutoverSource(x).edge,'ORIGINAL_SOURCE_NAME_CONFLICT');
 x.admission_repository=NEW;x.c72_repository=OLD;
 assert.equal(evaluateCutoverSource(x).edge,'ORIGINAL_SOURCE_NAME_CONFLICT');
});
test('Git source updated to NEW before GitHub rename must fail closed',()=>{
 const x=snapshot('MAIN_PRE');x.bootstrap_repository=NEW;x.admission_repository=NEW;x.c72_repository=NEW;
 assert.equal(evaluateCutoverSource(x).edge,'ORIGINAL_SOURCE_NAME_CONFLICT');
});
test('NEW source matching NEW GitHub identity still cannot attest installed provider or admin',()=>{
 const r=evaluateCutoverSource(snapshot('MAIN_POST'));
 assert.equal(r.ok,true);
 assert.equal(r.expected_name,NEW);
 assert.equal(r.human_admin_authorized,'UNKNOWN');
 assert.equal(r.provider_prompt_installed,'UNKNOWN');
 assert.equal(r.external_consumers_closed,'UNKNOWN');
 assert.equal(r.rename_go,false);
});
test('falsifiers: provider forgery, fake repository ID and mismatched source bytes',()=>{
 const a=snapshot();
 for(const [key,value,edge] of [
  ['remote_id',REPOSITORY_ID+1,'REPOSITORY_ID_DRIFT'],
  ['remote_name',NEW,'GITHUB_NAME_PHASE_MISMATCH'],
  ['branch','dev','GITHUB_DEFAULT_BRANCH_MISMATCH'],
  ['originals_git_sha_verified',false,'ORIGINAL_GIT_BYTES_UNVERIFIED'],
  ['prompt_installed_equivalence_claim',true,'PROMPT_SOURCE_OR_PROVIDER_CLAIM_INVALID'],
  ['c72_repository_id',1,'ORIGINAL_SOURCE_NAME_CONFLICT']]){
  assert.equal(evaluateCutoverSource({...a,[key]:value}).edge,edge);
 }
});
