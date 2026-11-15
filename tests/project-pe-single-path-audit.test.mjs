import test from 'node:test';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {evaluatePESingleSource,auditLocalPE,CANONICAL,REPOSITORY_ID} from '../scripts/project-pe-single-path-audit.mjs';

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

test('original D3 stays exactly 190+manifest; PE adapter and D123 are separately Git-bound',()=>{
 const manifest=JSON.parse(execFileSync('git',['show','HEAD:contracts/project-session-source.json'],{encoding:'utf8'}));
 assert.equal(manifest.paths.length,190);
 assert.equal(manifest.paths.includes('scripts/project-repo-loader.mjs'),true);
 for(const p of ['scripts/project-pe-original-bridge.mjs','scripts/project-bootstrap-d123.mjs'])
  assert.equal(manifest.paths.includes(p),false,'PE Host glue must not modify original D3 source set');
 const result=auditLocalPE({observedGithubId:REPOSITORY_ID,observedGithubName:CANONICAL});
 assert.equal(result.decision.ok,true,JSON.stringify(result.decision));
 assert.equal(result.decision.status,'SOURCE_CONSISTENT_NOT_RUNTIME_ACTIVE');
 assert.equal(result.original_d3_plus_manifest,191);
 assert.equal(result.originals.every(x=>x.readback_verified),true);
 assert.equal(result.adapter_nonowner_source.length,2);
 assert.equal(result.adapter_nonowner_source.every(x=>x.readback_verified),true);
 assert.equal(result.decision.original_owner_invoked,false);
 assert.equal(result.decision.installed_prompt_equivalence,'UNKNOWN');
});
