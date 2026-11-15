/** Original C72/E16 integration with repository fixture data, NOT ChatGPT FIELD_PASS. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {runC72ProjectE16Ingress,E16_INGRESS_SCHEMA} from '../host/project-c72-e16-unified-ingress.mjs';
import {C72_COLDSTART_FILES} from '../host/project-c72-coldstart-seed.mjs';
import {reopenC72Accepted} from '../host/project-c72-receipt-transit.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),H='a'.repeat(40);
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
function fixture(){
 const sources=C72_COLDSTART_FILES.map(p=>{const b=fs.readFileSync(path.join(ROOT,p));
  return {path:p,contentBase64:b.toString('base64'),sha:blob(b)};});
 const transit=fs.readFileSync(path.join(ROOT,'host/project-c72-receipt-transit.mjs'));
 const expectedBlobShas=Object.fromEntries(sources.map(x=>[x.path,x.sha]));
 const priorTurnEvidence={source_head:H,host_link_displayed:true,distinct_human_message_observed:true,
  terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+H+'/TERMS.md',
  pinned_blob_shas:Object.fromEntries(sources.slice(0,5).map(x=>[x.path,x.sha]))};
 return {sources,transit,expectedBlobShas,priorTurnEvidence};
}
function base(f,root){return {schema:E16_INGRESS_SCHEMA,phase:'POST_ACCEPT',
 humanMessage:'I ACCEPT',freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',
 projectProfile:'PROJECT_EDU_E15',sourceHead:H,liveHead:H,githubApi:'AVAILABLE',node:'AVAILABLE',
 carriers:{CALLBACKS:'UNKNOWN',NODE_HTTPS:'UNKNOWN',HOST_PACKET:'OBSERVED',HOST_FILE:'UNKNOWN'},
 priorTurnEvidence:f.priorTurnEvidence,expectedBlobShas:f.expectedBlobShas,
 seedBlobSha1:blob(fs.readFileSync(path.join(ROOT,'host/project-c72-coldstart-seed.mjs'))),
 sourcePacket:f.sources.map(({path,contentBase64})=>({path,contentBase64})),
 transitDirectory:root,transitBlobSha1:blob(f.transit),
 transitSourcePacket:{path:'host/project-c72-receipt-transit.mjs',contentBase64:f.transit.toString('base64')}};}
test('original cold seed C72 is called once, E16 pinned and original acceptance physically reopened',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'e16-real-unified-'));fs.chmodSync(dir,0o700);
 try{
  const f=fixture(),q=base(f,dir);
  const r=await runC72ProjectE16Ingress(q);
  assert.equal(r.ok,true,JSON.stringify(r));
  assert.equal(r.original.original_owner_invoked,true);
  assert.equal(r.original.verified_file_count,8);
  assert.equal(r.original.accepted.receipt_sha256,r.accepted.receipt_sha256);
  assert.equal(r.original.introduction.receipt_sha256,r.introduction.receipt_sha256);
  const saved=reopenC72Accepted({directory:dir,sourceHead:H});
  assert.equal(saved.ok,true,JSON.stringify(saved));
  assert.deepEqual(saved.accepted,r.accepted);
  assert.deepEqual(saved.introduction,r.introduction);
  const pin=JSON.parse(fs.readFileSync(path.join(dir,'c72-e16-source-pin.json'),'utf8'));
  assert.equal(pin.blob_sha1,blob(f.transit));assert.equal(pin.source_head,H);
  const replay=await runC72ProjectE16Ingress(q);
  assert.equal(replay.ok,false);
  assert.equal(replay.original_owner_invoked,false);
  assert.equal(replay.native_event_attested,false);
 }finally{fs.rmSync(dir,{force:true,recursive:true});}
});
test('original E16 denies tampered packet and transit before calling C72',async()=>{
 for(const mode of ['packet','transit']){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'e16-invalid-unified-'));fs.chmodSync(dir,0o700);
  try{
   const f=fixture(),q=base(f,dir);
   if(mode==='packet')q.sourcePacket[7].contentBase64=Buffer.from('invalid\n').toString('base64');
   if(mode==='transit')q.transitBlobSha1='b'.repeat(40);
   const r=await runC72ProjectE16Ingress(q);
   assert.equal(r.ok,false,mode+' '+JSON.stringify(r));
   assert.equal(r.original_owner_invoked,false,mode);
   assert.equal(fs.existsSync(path.join(dir,'c72-original-accepted.json')),false);
  }finally{fs.rmSync(dir,{force:true,recursive:true});}
 }
});
