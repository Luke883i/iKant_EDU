import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {C72_COLDSTART_FILES} from '../host/project-c72-coldstart-seed.mjs';
import {buildPartialKit} from '../scripts/project-c72-partial-source-kit.mjs';
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const kit=buildPartialKit({head});
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
function request(){
 return {schema:'ikant-host-c72-coldstart/v1',humanMessage:'I ACCEPT',freshHumanTurn:true,
  ownerOutcome:'NOT_INVOKED',liveHead:head,seedBlobSha1:kit.seed.blob_sha1,
  expectedBlobShas:Object.fromEntries(kit.files.map(d=>[d.path,d.blob_sha1])),
  priorTurnEvidence:{source_head:head,host_link_displayed:true,
   distinct_human_message_observed:true,
   terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+head+'/TERMS.md',
   pinned_blob_shas:Object.fromEntries(kit.files.slice(0,5).map(d=>[d.path,d.blob_sha1]))},
  sourcePacket:kit.files.map(d=>({path:d.path,contentBase64:d.contentBase64}))};
}
function run(q){
 const p=spawnSync(process.execPath,['host/project-c72-coldstart-seed.mjs'],
  {input:JSON.stringify(q),encoding:'utf8',timeout:15000,maxBuffer:2000000});
 assert.equal(p.error,undefined);return {status:p.status,data:JSON.parse(p.stdout)};
}
function stage(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'c72-kit-'));fs.chmodSync(root,0o700);
 for(const d of kit.files){
  const f=path.join(root,d.path);
  fs.mkdirSync(path.dirname(f),{recursive:true,mode:0o700});
  fs.writeFileSync(f,Buffer.from(d.contentBase64,'base64'),{mode:0o600});
 }
 return root;
}
test('no checkout: eight original blobs invoke original C72 and return full intro',()=>{
 const a=run(request());assert.equal(a.status,0,JSON.stringify(a.data));
 assert.equal(a.data.ok,true);assert.equal(a.data.original_owner_invoked,true);
 assert.equal(a.data.verified_file_count,C72_COLDSTART_FILES.length);
 assert.equal(a.data.accepted.schema,'ikant-le-c72-public-accepted/v2');
 assert.equal(a.data.introduction.schema,'ikant-le-c72-public-orientation/v2');
 assert.equal(a.data.introduction.acceptance_receipt_sha256,a.data.accepted.receipt_sha256);
 assert.equal(a.data.active,false);assert.equal(a.data.native_event_attested,false);
});
test('manual partial handoff: private stage invokes unchanged original C72',()=>{
 const root=stage();try{
  const q=request();delete q.sourcePacket;q.stageDirectory=root;
  const a=run(q);assert.equal(a.status,0,JSON.stringify(a.data));
  assert.equal(a.data.ok,true);assert.equal(a.data.carrier,'HOST_STAGED_PARTIAL_SOURCE');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('eight independent negative boundaries reject without invoking owner',()=>{
 for(const kind of ['tamper','witness','stale','early','ambiguous','seed','source-sha','prior-unknown']){
  const q=request();
  if(kind==='tamper')q.sourcePacket[7].contentBase64=Buffer.from('wrong').toString('base64');
  if(kind==='witness')delete q.priorTurnEvidence.pinned_blob_shas['TERMS.md'];
  if(kind==='stale')q.liveHead='f'.repeat(40);
  if(kind==='early')q.humanMessage='EDU';
  if(kind==='ambiguous')q.stageDirectory='/tmp';
  if(kind==='seed')q.seedBlobSha1='1'.repeat(40);
  if(kind==='source-sha')q.expectedBlobShas['host/c72-public-mode-admission.mjs']='2'.repeat(40);
  if(kind==='prior-unknown')q.ownerOutcome='UNKNOWN';
  const a=run(q);assert.equal(a.status,2,kind);assert.equal(a.data.original_owner_invoked,false,kind);
 }
});
test('unsafe private source: symlink, world-readable, modified source all deny',()=>{
 for(const kind of ['symlink','permissions','tamper']){
  const root=stage();try{
   const q=request();delete q.sourcePacket;q.stageDirectory=root;
   const target=path.join(root,'host/c72-public-mode-admission.mjs');
   if(kind==='symlink'){fs.renameSync(target,target+'.bak');fs.symlinkSync(target+'.bak',target);}
   if(kind==='permissions')fs.chmodSync(root,0o755);
   if(kind==='tamper')fs.appendFileSync(target,'\n// TAMPER');
   const a=run(q);assert.equal(a.status,2,kind);assert.equal(a.data.original_owner_invoked,false,kind);
  }finally{fs.chmodSync(root,0o700);fs.rmSync(root,{recursive:true,force:true});}
 }
});
test('partial kit is data-only, exact source blobs, not complete EDU source',()=>{
 assert.equal(kit.files.length,8);assert.equal(kit.files[0].path,'README.md');
 assert.equal(kit.files[4].path,'TERMS.md');
 assert.equal(kit.files[7].path,'host/project-c72-postaccept-reentry.mjs');
 for(const d of kit.files)assert.equal(blob(Buffer.from(d.contentBase64,'base64')),d.blob_sha1);
 assert.equal(blob(Buffer.from(kit.seed.contentBase64,'base64')),kit.seed.blob_sha1);
 assert.equal(kit.active,false);assert.equal(kit.no_authority,true);
});
