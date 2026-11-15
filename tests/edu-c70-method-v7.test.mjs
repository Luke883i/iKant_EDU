import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createGuidedCohostV7} from '../host/edu-c70-method-v7.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const carrier=fs.readFileSync(path.join(root,'release/v8/ikant-c107-source-c734bf934e33.ikc.br'));
const SHA='c734bf934e33703a6a1f91f0f4d5df96eec96945';
const H=s=>crypto.createHash('sha256').update(s).digest('hex');
const auth={human_mode_selected:true,opt_in_confirmed:true,provenance:'LOCAL_TEST_FIXTURE',separate_cohost_draft_authorized:true};
const port=async task=>({text:'La risposta e una bozza linguistica host verificata rispetto al piano C70. Non e ACTIVE.',ack_plan_sha256:task.guidance.plan_sha256,input_sha256:task.plan.input_sha256});
async function fixture(custom=port){
 const privateParent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-v7-test-'));
 const a=await createGuidedCohostV7({carrierBytes:carrier,privateParent,languagePort:custom});
 assert.equal(a.ok,true,JSON.stringify(a.blocked));
 const c72=await import(pathToFileURL(path.join(a.install_root,'host/c72-unified-mode-admission.mjs')).href);
 const terms=fs.readFileSync(path.join(a.install_root,'TERMS.md'));
 const offer=c72.issueC72TermsOffer({sourceHead:SHA,termsDigest:H(terms)});
 const accepted=c72.acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 const selection=c72.selectC72Mode({accepted,orientation:c72.presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
 const finish=()=>{a.dispose();fs.rmSync(privateParent,{recursive:true,force:true});};
 return {a,selection,finish};
}
const frame=selection=>({humanInput:'Spiega il metodo di verifica di una biblioteca.',nonce:'v7-human-fixture-nonce-001',selection,authorization:{...auth},priorMessages:[],resetContext:true});
test('PR119 owner used: authentic stage, original C70, HOST_BOUND, independent C87 readback',async()=>{
 const x=await fixture();try{
  const r=await x.a.runGuidedTurn(frame(x.selection));
  assert.equal(r.status,'PR119_OWNER_C70_GUIDED_LOCAL_READBACK',JSON.stringify(r));
  assert.equal(r.surface_a.origin,'HOST_BOUND');
  assert.equal(r.surface_b.ACK_SCOPE,'PROTOCOL_ONLY_NOT_SEMANTIC_PROOF');
  assert.equal(r.surface_b.ACTIVE,false);assert.equal(r.pr119_surface_b.origin,'CHATGPT_HOST');
  assert.equal(fs.readFileSync(x.a.ledger_file,'utf8').trim().split('\n').length,1);
 }finally{x.finish()}
});
test('absence of separate draft consent denies before C87 and language callback',async()=>{
 let called=0;const x=await fixture(async task=>{called++;return port(task)});try{
  const f=frame(x.selection);f.authorization.separate_cohost_draft_authorized=false;
  const r=await x.a.runGuidedTurn(f);assert.equal(r.surface_a.origin,'NO_VOICE');
  assert.equal(called,0);assert.equal(fs.existsSync(x.a.ledger_file),false);
 }finally{x.finish()}
});
test('wrong acknowledgement blocks before first C87 write',async()=>{
 const x=await fixture(async t=>({...(await port(t)),ack_plan_sha256:'0'.repeat(64)}));try{
  const r=await x.a.runGuidedTurn(frame(x.selection));assert.equal(r.surface_b.FIRST_EDGE,'V7_PLAN_ACK_OR_HOST_TEXT_INVALID');
  assert.equal(fs.existsSync(x.a.ledger_file),false);
 }finally{x.finish()}
});
test('second distinct turn preserves staged owner continuity',async()=>{
 const x=await fixture();try{
  const p=await x.a.runGuidedTurn(frame(x.selection));assert.equal(p.surface_a.origin,'HOST_BOUND',JSON.stringify(p));
  const q={...frame(x.selection),humanInput:'Quale criterio di prova e coerente col precedente?',
   nonce:'v7-human-fixture-nonce-002',priorMessages:[frame(x.selection).humanInput],resetContext:false};
  const r=await x.a.runGuidedTurn(q);assert.equal(r.surface_a.origin,'HOST_BOUND',JSON.stringify(r));
  assert.notEqual(p.surface_b.TRACE_REF,r.surface_b.TRACE_REF);
  assert.equal(fs.readFileSync(x.a.ledger_file,'utf8').trim().split('\n').length,2);
 }finally{x.finish()}
});
test('hostile Proxy and indexed getter denied without executing them',async()=>{
 let traps=0;const x=await fixture();try{
  const proxy=new Proxy(frame(x.selection),{get(){traps++;throw Error('trap')}});
  assert.equal((await x.a.runGuidedTurn(proxy)).surface_b.FIRST_EDGE,'V7_UNSAFE_FRAME');
  const list=['earlier'];Object.defineProperty(list,'0',{enumerable:true,configurable:true,get(){traps++;throw Error('trap')}});
  assert.equal((await x.a.runGuidedTurn({...frame(x.selection),priorMessages:list})).surface_a.origin,'NO_VOICE');
  assert.equal(traps,0);assert.equal(fs.existsSync(x.a.ledger_file),false);
 }finally{x.finish()}
});
test('original C114 protects direct identity route before writer',async()=>{
 const x=await fixture(async t=>({text:'Sono cosciente e provo esperienze interiori certe.',ack_plan_sha256:t.guidance.plan_sha256,input_sha256:t.plan.input_sha256}));try{
  const r=await x.a.runGuidedTurn({...frame(x.selection),humanInput:'chi sei?'});
  assert.equal(r.surface_a.origin,'NO_VOICE');assert.equal(fs.existsSync(x.a.ledger_file),false);
 }finally{x.finish()}
});
test('C87 replay is denied, no extra event',async()=>{
 const x=await fixture();try{
  assert.equal((await x.a.runGuidedTurn(frame(x.selection))).surface_a.origin,'HOST_BOUND');
  assert.equal((await x.a.runGuidedTurn(frame(x.selection))).surface_a.origin,'NO_VOICE');
  assert.equal(fs.readFileSync(x.a.ledger_file,'utf8').trim().split('\n').length,1);
 }finally{x.finish()}
});
test('corrupt original C87 ledger cannot release and cannot append',async()=>{
 const x=await fixture();try{
  assert.equal((await x.a.runGuidedTurn(frame(x.selection))).surface_a.origin,'HOST_BOUND');
  fs.appendFileSync(x.a.ledger_file,'{"fake":true}\n');
  const r=await x.a.runGuidedTurn({...frame(x.selection),nonce:'v7-human-fixture-nonce-002'});
  assert.equal(r.surface_a.origin,'NO_VOICE');
  assert.equal(fs.readFileSync(x.a.ledger_file,'utf8').trim().split('\n').length,2);
 }finally{x.finish()}
});
test('ordinary critical topic remains HOST_BOUND but no claim of independent semantic proof',async()=>{
 const x=await fixture();try{
  const f={...frame(x.selection),humanInput:'Valuta criticamente il metodo di un servizio.'};
  const r=await x.a.runGuidedTurn(f);
  assert.equal(r.surface_a.origin,'HOST_BOUND',JSON.stringify(r));
  assert.equal(r.surface_b.SEMANTIC_CAUSALITY_ATTESTED,false);
  assert.equal(fs.readFileSync(x.a.ledger_file,'utf8').trim().split('\n').length,1);
 }finally{x.finish()}
});
test('checkpoint is read-only local evidence, never native chat persistence',async()=>{
 const x=await fixture();try{
  const r=await x.a.runGuidedTurn(frame(x.selection));assert.equal(r.surface_a.origin,'HOST_BOUND');
  const snap=x.a.checkpoint();assert.equal(snap.count,1);assert.equal(snap.status,'LOCAL_C87_REOPENED');
  assert.equal(snap.persistent_across_chats_attested,false);assert.equal(snap.last_hash,r.surface_b.TRACE_REF);
  assert.equal(fs.readFileSync(x.a.ledger_file,'utf8').trim().split('\n').length,1);
 }finally{x.finish()}
});
