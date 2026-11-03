import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluatePESingleSource,CANONICAL,REPOSITORY_ID} from '../scripts/project-pe-single-path-audit.mjs';

const H='a'.repeat(40),T='b'.repeat(40);
function sample(){return {repo_id:REPOSITORY_ID,repo_name:CANONICAL,branch:'main',
head:H,tree:T,tree_complete:true,bootstrap_repository:CANONICAL,
admission_repository:CANONICAL,c72_repository:CANONICAL,
orientation_repository:'https://github.com/'+CANONICAL,
all_original_blobs_verified:true,prompt_source_matches_gate:true,
original_pe_adapter_present:true,original_runtime_loader_present:true};}
test('full source predicates do not grant runtime authority',()=>{
 const r=evaluatePESingleSource(sample());
 assert.equal(r.ok,true);assert.equal(r.active,false);
 assert.equal(r.original_owner_invoked,false);
 assert.equal(r.installed_prompt_equivalence,'UNKNOWN');
});
test('postrename source disagreements STOP',()=>{
 const q=sample();
 const negative=[
  ['repo_id',0],['repo_name','wrong'],['tree_complete',false],
  ['head','unverified'],['bootstrap_repository','historical'],
  ['admission_repository','historical'],['c72_repository','historical'],
  ['orientation_repository','historical'],['all_original_blobs_verified',false],
  ['prompt_source_matches_gate',false],['original_pe_adapter_present',false],
  ['original_runtime_loader_present',false]
 ];
 for(const [key,value] of negative){
  const r=evaluatePESingleSource({...q,[key]:value});
  assert.equal(r.ok,false,key);assert.equal(r.active,false,key);
  assert.equal(r.original_owner_invoked,false,key);
 }
});
