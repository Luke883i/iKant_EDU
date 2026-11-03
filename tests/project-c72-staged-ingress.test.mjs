import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {validateC72V2Accepted,validateC72V2Orientation} from '../host/c72-public-mode-admission.mjs';
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const NAMES=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const docs=NAMES.map(p=>({p,sha:execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim(),
 bytes:execFileSync('git',['show','HEAD:'+p])}));
function prepare(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'c72-stage-'),{encoding:'utf8'});
 fs.chmodSync(dir,0o700);
 for(const f of docs)fs.writeFileSync(path.join(dir,f.p),f.bytes,{mode:0o600});
 const request={schema:'ikant-host-c72-staged-request/v1',humanMessage:'I ACCEPT',
  freshHumanTurn:true,liveHead:head,stageDirectory:dir,
  priorTurnEvidence:{source_head:head,host_link_displayed:true,
   distinct_human_message_observed:true,
   terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+head+'/TERMS.md',
   pinned_blob_shas:Object.fromEntries(docs.map(d=>[d.p,d.sha]))}};
 return {dir,request};
}
function launch(p){
 const c=spawnSync(process.execPath,['scripts/project-c72-staged-ingress-cli.mjs'],
  {encoding:'utf8',input:JSON.stringify(p),maxBuffer:2_000_000,timeout:15000});
 return {exit:c.status,stdout:c.stdout,stderr:c.stderr,value:JSON.parse(c.stdout)};
}
test('five staged Host files really enter original C72 in one Node process',()=>{
 const {dir,request}=prepare();
 try{
  const r=launch(request);assert.equal(r.exit,0,r.stdout+' '+r.stderr);
  assert.equal(r.value.ok,true);
  assert.equal(r.value.host_carrier_selected,'HOST_SOURCE_PACKET');
  assert.equal(r.value.local_physical_readback,true);
  assert.equal(r.value.staged_file_count,5);
  assert.equal(r.value.original_owner_invoked,true);
  assert(validateC72V2Accepted(r.value.accepted));
  assert(validateC72V2Orientation(r.value.introduction,r.value.accepted));
  assert.equal(r.value.native_github_event_attested,false);
  assert.equal(r.value.native_delivery_attested,false);
 }finally{fs.rmSync(dir,{force:true,recursive:true});}
});
test('tampering/stale head/no human acceptance prevents C72 owner invocation',()=>{
 for(const mutation of ['missing','tamper','stale','early','no witness','unsafe directory']){
  const {dir,request}=prepare();
  try{
   if(mutation==='missing')fs.rmSync(path.join(dir,'AGENTS.md'));
   if(mutation==='tamper')fs.appendFileSync(path.join(dir,'TERMS.md'),'changed');
   if(mutation==='stale')request.liveHead='f'.repeat(40);
   if(mutation==='early')request.humanMessage='EDU';
   if(mutation==='no witness')delete request.priorTurnEvidence.pinned_blob_shas;
   if(mutation==='unsafe directory')fs.chmodSync(dir,0o755);
   const r=launch(request);assert.equal(r.exit,2);
   assert.equal(r.value.ok,false);assert.equal(r.value.original_owner_invoked,false);
  }finally{fs.chmodSync(dir,0o700);fs.rmSync(dir,{force:true,recursive:true});}
 }
});
test('symlink and hardlink cannot masquerade as staged original bytes',()=>{
 for(const type of ['symlink','hardlink']){
  const {dir,request}=prepare();
  try{
   const target=path.join(dir,'README.md'),alias=path.join(dir,'README.alias');
   fs.renameSync(target,alias);
   if(type==='symlink')fs.symlinkSync(alias,target);
   else fs.linkSync(alias,target);
   const r=launch(request);assert.equal(r.exit,2);
   assert.equal(r.value.original_owner_invoked,false);
  }finally{fs.rmSync(dir,{force:true,recursive:true});}
 }
});
