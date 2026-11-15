import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {emitC125Shell} from '../host/c125-exclusive-shell.mjs';
import {createC125HostOutputPort} from '../host/c125-output-port.mjs';
import {createC125ShellSession} from '../host/edu-c125-shell-session.mjs';
import {PIN} from '../host/c107-carrier-consumer.mjs';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const H=x=>crypto.createHash('sha256').update(x,'utf8').digest('hex');
const who='EXPERIMENTAL';
const voice='La biblioteca può essere organizzata per autore e per argomento. È un esempio di risposta host.';
const input='Che cosa si trova in una biblioteca?';
const nonce='edu-c125-biblioteca-nonce-001';
const trace='a'.repeat(64);
function receipt(){return {schema:'ikant-edu-c70-guided/v7',status:'PR119_OWNER_C70_GUIDED_LOCAL_READBACK',active:false,
 surface_a:{origin:'HOST_BOUND',voice_utf8:voice},surface_b:{ACTIVE:false,TRACE_REF:trace},
 pr119_surface_b:{TRACE_REF:trace,INPUT_REF:H(input),C100_PROOF:'ORIGINAL_INPUT_OUTPUT_BOUND',C87_PROOF:'ORIGINAL_APPEND_REOPEN',
 canonical_active:false,native_chatgpt_origin_attested:false,provider_origin_attested:false,
 original_c70_executed:true,original_c87_writer_executed:true,visible_voice_sha256:H(voice)}}}
function frame(){return {afterAccept:true,kind:'OWNER_VOICE',mode:who,trace,continuity:'C87_INDEPENDENT_REOPEN',edge:'NATIVE_CHATGPT_PER_TURN_DISPATCH',next:'QUALIFY_NATIVE_HOOK',
 nonce,input_sha256:H(input),ownerReceipt:receipt(),independentReadback:{status:'C107_LEDGER_REOPENED',last_hash:trace,
 latest_state:{nonce,visible_voice_sha256:H(voice),host_language_used:true}}};}
test('exact UTF-8 A inside fixed whole shell, no fake DOCX or native claim',()=>{
 const r=emitC125Shell(frame());
 assert.equal(r.origin,'HOST_BOUND',r.reason);assert.equal(r.voice_sha256,H(voice));
 assert.equal(Buffer.from(r.emit).subarray(r.voice_byte_offset,r.voice_byte_offset+r.voice_byte_length).toString('utf8'),voice);
 assert.equal(r.native_ui_exclusive,false);assert.equal(r.emit.endsWith('+------ END ONE SHELL ------+'),true);
 assert.equal(r.docx_links.length,0);assert.equal(r.outside_shell_characters,0);
});
test('receipt mutation, fake DOCX and getter/proxy fail closed',()=>{
 const x=frame();x.independentReadback.latest_state.nonce='replay';assert.equal(emitC125Shell(x).emit,null);
 const y=frame();y.ownerReceipt.surface_a.voice_utf8+='X';assert.equal(emitC125Shell(y).emit,null);
 const z=frame();z.docxWitness={path:'forged.docx'};assert.equal(emitC125Shell(z).emit,null);
 let traps=0;const p=new Proxy(frame(),{get(){traps++;throw Error('trap')}});
 assert.equal(emitC125Shell(p).emit,null);assert.equal(traps,0);
});
test('preaccept blocks; POSTACCEPT progress, failure, blocked are one-shell NO_VOICE',()=>{
 assert.equal(emitC125Shell({kind:'AUDIT'}).emit,null);
 for(const kind of ['ADMISSION','MODE','OPTIN','TRANSPORT','PLANNING','GUARD','READBACK','BLOCKED','AUDIT','ERROR','PROGRESS','DOCUMENT']){
  const s=emitC125Shell({afterAccept:true,kind,mode:'EXPERIMENTAL',trace:'NOT_SAVED',continuity:'LOCAL',edge:'OPEN',next:'STOP'});
  assert.equal(s.origin,'NO_VOICE',kind);assert.ok(s.emit.includes('HOST | NOTE'));
 }
});
test('at-most-one send, unknown post-send delivery consumes identity',async()=>{
 let count=0;const p=createC125HostOutputPort({afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'},
 send:async()=>{count++;throw Error('unknown')}});
 const f={kind:'BLOCKED',trace:'NOT_SAVED',continuity:'LOCAL',edge:'OPEN',next:'STOP'};
 assert.equal((await p.publish({eventId:nonce,frame:f})).reason,'DELIVERY_UNKNOWN_DO_NOT_RETRY');
 assert.equal((await p.publish({eventId:nonce,frame:f})).ok,false);assert.equal(count,1);
});
test('getter on host envelope blocked without invocation',async()=>{
 let n=0,called=0;const f={kind:'AUDIT',trace:'NOT_SAVED',continuity:'LOCAL',edge:'OPEN',next:'STOP'};
 Object.defineProperty(f,'kind',{enumerable:true,get(){called++;return 'AUDIT'}});
 const p=createC125HostOutputPort({afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'},send:()=>n++});
 assert.equal((await p.publish({eventId:nonce,frame:f})).ok,false);assert.equal(called,0);assert.equal(n,0);
});
function selection(){
 const offer=issueC72TermsOffer({sourceHead:PIN.head,termsDigest:H(fs.readFileSync(path.join(root,'TERMS.md')))});
 const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 return selectC72Mode({accepted,orientation:presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
}
test('FULL OWNER integration: PR119/C70/C87 independent reopen then only shell send',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'edu-c125-shell-'));
 const carrier=fs.readFileSync(path.join(root,PIN.name)),out=[];
 let session;
 try{
  session=await createC125ShellSession({carrierBytes:carrier,privateParent:parent,languagePort:task=>({
   text:voice,ack_plan_sha256:task.guidance.plan_sha256,input_sha256:task.plan.input_sha256}),
   send:async s=>{out.push(s)},afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'}});
  assert.equal(session.ok,true);assert.equal(session.runtime_ready,true,session.initial_edge);
  const f={humanInput:input,nonce,selection:selection(),priorMessages:[],resetContext:true,
   authorization:{human_mode_selected:true,opt_in_confirmed:true,separate_cohost_draft_authorized:true,provenance:'LOCAL_TEST_FIXTURE'}};
  const r=await session.publishTurn({frame:f});
  assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.origin,'HOST_BOUND');assert.equal(out.length,1);
  assert.equal(out[0].includes(voice),true);assert.equal(out[0].endsWith('+------ END ONE SHELL ------+'),true);
  assert.equal((await session.publishTurn({frame:f})).reason,'REPLAY_OR_INVALID_NONCE');assert.equal(out.length,1);
 }finally{session?.close();fs.rmSync(parent,{recursive:true,force:true})}
});
test('HOST controlled status path renders NO_VOICE through only sender',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'edu-c125-blocked-')),out=[];let session;
 try{
  session=await createC125ShellSession({carrierBytes:Buffer.alloc(1),privateParent:parent,
   languagePort:()=>{throw Error('should not run')},send:s=>out.push(s),
   afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'}});
  assert.equal(session.ok,true);assert.equal(session.runtime_ready,false);
  const r=await session.publishStatus({eventId:'edu-c125-status-0001',kind:'ERROR',edge:'CARRIER_NOT_STAGED',next:'HANDOFF'});
  assert.equal(r.ok,true);assert.equal(r.origin,'NO_VOICE');assert.equal(out.length,1);
  assert.equal(out[0].includes('VOCE | NO_VOICE'),true);
 }finally{session?.close();fs.rmSync(parent,{recursive:true,force:true})}
});
