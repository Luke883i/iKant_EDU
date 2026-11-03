import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {qualifiedSourceCandidate,referencesCanonicalRepository,compileFirstContactPlan} from '../src/first-contact.mjs';
import {runtimeRootDescriptor,validateRuntimeRootDescriptor,validateActivationExecutorReceipt} from '../src/runtime-root-verified.mjs';

const OLD='Luke883i/iKant_LE',NEW='Luke883i/iKant_EDU',H='a'.repeat(40),T='b'.repeat(40);
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const next=()=>({repo_id:1371330383,source_repository:NEW,bootstrap_repository:NEW,
 admission_repository:NEW,c72_contract_repository:NEW,source_head:H,
 source_tree:T,observed_head:H,observed_tree:T,observed_full_name:NEW,
 source_epoch:NEW+'@'+H,terms_link:'https://github.com/'+NEW+'/blob/'+H+'/TERMS.md',
 aliases:[NEW],old_receipt_reused:false,native_owner_proven:false,
 provider_installed_proven:false,authority:0});

test('old first-contact remains exact; future name without source identity cannot become canonical',()=>{
 const old=compileFirstContactPlan('GitHub '+OLD);
 assert.equal(old.recognized,true);
 assert.equal(old.repository,OLD);
 assert.equal(old.authority,0);
 assert.equal(compileFirstContactPlan('GitHub '+NEW).recognized,false);
 assert.equal(referencesCanonicalRepository('https://github.com/Luke883i/iKant_EDU-fork'),false);
});

test('future source structural candidate is lexical only and never native/provider authority',()=>{
 const evidence=next();assert.equal(qualifiedSourceCandidate(evidence),true);
 const p=compileFirstContactPlan('studia '+NEW,{qualifiedSource:evidence});
 assert.equal(p.recognized,true);assert.equal(p.repository,NEW);
 assert.equal(p.source_binding_class,'HOST_STRUCTURAL_CANDIDATE_REQUIRES_GITHUB_READBACK');
 assert.equal(p.native_owner_proven,false);
 assert.equal(p.provider_installed_proven,false);
 assert.equal(p.authority,0);
 assert.equal(p.required_next_human_message,'I ACCEPT');
 assert.equal(compileFirstContactPlan('studia '+OLD,{qualifiedSource:evidence}).recognized,false);
 for(const [field,val] of [
  ['repo_id',123],['source_repository',OLD],['bootstrap_repository',OLD],
  ['admission_repository',OLD],['c72_contract_repository',OLD],
  ['source_head','f'.repeat(40)],['source_tree','f'.repeat(40)],
  ['observed_full_name',NEW+'-fork'],['source_epoch',OLD+'@'+H],
  ['terms_link','https://example.org/TERMS.md'],
  ['aliases',[OLD,NEW]],['old_receipt_reused',true],
  ['native_owner_proven',true],['provider_installed_proven',true],
  ['authority',1]]){
  const x={...evidence,[field]:val};
  assert.equal(qualifiedSourceCandidate(x),false,field);
  assert.equal(compileFirstContactPlan('studia '+NEW,{qualifiedSource:x}).terminal,
   'STOP_SOURCE_BINDING_UNVERIFIED',field);
 }
});

test('original runtime-root source identity and all members are pinned to actual Git HEAD blobs',()=>{
 const b=JSON.parse(read('BOOTSTRAP.json'));
 const a=JSON.parse(read('ADMISSION.json'));
 const c=JSON.parse(read('contracts/c72-public-mode-admission-v2.json'));
 assert.equal(b.canonical_repository,OLD);
 assert.equal(a.repository,b.canonical_repository);
 assert.equal(c.source_identity.canonical_repository,b.canonical_repository);
 const d=runtimeRootDescriptor();
 assert.equal(validateRuntimeRootDescriptor(d).ok,true);
 assert.equal(d.member_count,51);
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 for(const p of ['src/first-contact.mjs','src/admission.mjs']){
  assert.equal(d.members.find(x=>x.path===p).blob_sha1,git('rev-parse','HEAD:'+p));
 }
 for(const e of [d.loader,...d.shards]){
  assert.equal(e.blob_sha1,git('rev-parse','HEAD:'+e.path));
 }
 assert.equal(b.post_accept_fastboot.pre_runtime_kernel.blob_sha1,d.loader.blob_sha1);
});

test('runtime validation refuses an inconsistent independently materialized source',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-rename-identity-'));
 try{
  fs.mkdirSync(path.join(temp,'contracts'),{recursive:true});
  for(const rel of ['BOOTSTRAP.json','ADMISSION.json','contracts/c72-public-mode-admission-v2.json']){
   const dest=path.join(temp,rel);
   fs.writeFileSync(dest,read(rel));
  }
  const d=runtimeRootDescriptor();
  const input={schema:'ikant-le-activation-executor/v1',repository:OLD,
   source_head:H,runtime_root_sha256:d.runtime_root_sha256};
  const a=JSON.parse(read('ADMISSION.json'));a.repository=NEW;
  fs.writeFileSync(path.join(temp,'ADMISSION.json'),JSON.stringify(a));
  assert.throws(()=>validateActivationExecutorReceipt(input,{
   workspace:temp,sourceHead:H,descriptor:d,requireSourceObjectReadback:false
  }),/RUNTIME_ADMISSION_SOURCE_DRIFT/);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});

test('source prompt enforces repository ID and matching original documents without provider installation claim',()=>{
 const s=read('project/session-chat/PROMPT.txt');
 assert.match(s,/GitHub ID 1371330383/);
 assert.match(s,/BOOTSTRAP\/ADMISSION\/C72/);
 assert.match(s,/STOP_SOURCE_LOCK_STALE/);
 const code=read('scripts/build-project-oneshell-prompt.mjs');
 assert(code.includes('https://api.github.com/repositories/1371330383'));
 assert(code.includes('STOP_PROMPT_REPO_SOURCE_IDENTITY_DRIFT'));
 const schema=JSON.parse(read('contracts/repository-rename-install-phase-dod.json'));
 assert.equal(schema.rename_go,false);
});
