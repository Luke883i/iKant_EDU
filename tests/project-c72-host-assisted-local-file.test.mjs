import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const paths=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
 'contracts/c72-public-mode-admission-v2.json','host/c72-public-mode-admission.mjs',
 'host/project-c72-postaccept-reentry.mjs'];
const bytes=paths.map((p,i)=>Buffer.from('assisted tool fixture '+i+' '+p+'\n'));
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const expected=Object.fromEntries(paths.map((p,i)=>[p,sha(bytes[i])]));
const head='a'.repeat(40);
const script=new URL('../scripts/project-c72-verified-staging.mjs',import.meta.url).pathname;
function call(q){
 const r=spawnSync(process.execPath,[script],{input:JSON.stringify(q),encoding:'utf8'});
 assert.equal(r.error,undefined,String(r.error));return {status:r.status,value:JSON.parse(r.stdout)};
}
function setup(){
 const outer=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-assist-'));fs.chmodSync(outer,0o700);
 const stage=path.join(outer,'stage');
 return {outer,stage,init:{op:'init',schema:'ikant-host-c72-verified-staging/v1',
  stageDirectory:stage,source_head:head,expectedBlobShas:expected,
  priorTurnEvidence:{source_head:head,host_link_displayed:true,
   terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+head+'/TERMS.md',
   pinned_blob_shas:Object.fromEntries(paths.slice(0,5).map(p=>[p,expected[p]]))}}};
}
function put(stage,i,sourceFile){
 return call({op:'put-local',schema:'ikant-host-c72-verified-put-local/v1',
  stageDirectory:stage,path:paths[i],sourceFile});
}
test('8 physical private source files -> Node stdin put-local -> canonical 8/8 readback',()=>{
 const s=setup();try{
  assert.equal(call(s.init).value.phase,'STAGE_INITIALIZED');
  for(let i=0;i<8;i++){
   const file=path.join(s.outer,'source-'+i+'.txt');
   fs.writeFileSync(file,bytes[i],{flag:'wx',mode:0o600});
   const r=put(s.stage,i,file);
   assert.equal(r.status,0,JSON.stringify(r));
   assert.equal(r.value.phase,'BLOB_REOPENED');
   assert.equal(r.value.blob_sha1,expected[paths[i]]);
   assert.deepEqual(fs.readFileSync(path.join(s.stage,paths[i])),bytes[i]);
   fs.rmSync(file);
  }
  const r=call({op:'verify',schema:'ikant-host-c72-verified-verify/v1',stageDirectory:s.stage});
  assert.equal(r.status,0,JSON.stringify(r));
  assert.equal(r.value.phase,'SOURCE_READY_FOR_ORIGINAL_COLD_SEED');
  assert.equal(r.value.verified_count,8);
  assert.equal(r.value.original_owner_invoked,false);
  assert.equal(r.value.native_event_attested,false);
 }finally{fs.rmSync(s.outer,{recursive:true,force:true});}
});
test('tool-assisted local input is unsafe on relative path, public file, symlink, corruption, replay',()=>{
 const s=setup();try{
  assert.equal(call(s.init).status,0);
  assert.equal(put(s.stage,0,'relative.txt').value.edge,'C72_RELAY_LOCAL_FILE_REQUEST_INVALID');
  const good=path.join(s.outer,'good.txt');fs.writeFileSync(good,bytes[0],{flag:'wx',mode:0o600});
  const link=path.join(s.outer,'link.txt');fs.symlinkSync(good,link);
  assert.equal(put(s.stage,0,link).value.edge,'C72_RELAY_LOCAL_FILE_UNSAFE');
  const pub=path.join(s.outer,'public.txt');
  fs.writeFileSync(pub,bytes[0],{flag:'wx',mode:0o644});fs.chmodSync(pub,0o644);
  assert.equal(put(s.stage,0,pub).value.edge,'C72_RELAY_LOCAL_FILE_UNSAFE');
  const corrupt=path.join(s.outer,'corrupt.txt');
  fs.writeFileSync(corrupt,'not original',{flag:'wx',mode:0o600});
  assert.match(put(s.stage,0,corrupt).value.edge,/C72_RELAY_PINNED_BLOB_DRIFT/);
  assert.equal(put(s.stage,0,good).value.phase,'BLOB_REOPENED');
  assert.equal(put(s.stage,0,good).status,2);
  assert.equal(call({op:'verify',schema:'ikant-host-c72-verified-verify/v1',
   stageDirectory:s.stage}).value.edge,'C72_RELAY_SOURCE_INCOMPLETE');
 }finally{fs.rmSync(s.outer,{recursive:true,force:true});}
});
test('portable project prompt routes callable Host tool to physical relay before STOP',()=>{
 const p=fs.readFileSync(new URL('../project/session-chat/PROMPT.txt',import.meta.url),'utf8');
 for(const s of ['GitHub connector→argomento tool→file privato/Node','senza richiedere DNS Node',
  'C72_SOURCE_BRIDGE_UNBOUND','readback (10/10 originali',
  'GitHub tool disponibile','Tool non vincolato⇒STOP_UNBOUND'])
  assert(p.includes(s),s);
 assert(Buffer.byteLength(p,'utf8')<=8000);
});
