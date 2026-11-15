import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createGuidedCohostV7} from '../host/edu-c70-method-v7.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const carrier=fs.readFileSync(path.join(root,'release/v8/ikant-c107-source-c734bf934e33.ikc.br'));
const source='c734bf934e33703a6a1f91f0f4d5df96eec96945';
const fixturePort=task=>({text:'Testo host di verifica non identitaria: una biblioteca permette ricerca e lettura.',ack_plan_sha256:task.guidance.plan_sha256,input_sha256:task.plan.input_sha256});
async function setup(port=fixturePort){
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-v8-gate-'));
 const host=await createGuidedCohostV7({carrierBytes:carrier,privateParent:parent,languagePort:port});
 assert.equal(host.ok,true,JSON.stringify(host.blocked));
 const admission=await import(pathToFileURL(path.join(host.install_root,'host/c72-unified-mode-admission.mjs')).href);
 const offer=admission.issueC72TermsOffer({sourceHead:source,termsDigest:sha(fs.readFileSync(path.join(host.install_root,'TERMS.md')))});
 const accepted=admission.acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 const selection=admission.selectC72Mode({accepted,orientation:admission.presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
 return {host,parent,selection,done(){host.dispose();fs.rmSync(parent,{recursive:true,force:true});}};
}
function input(selection,id='1',priorMessages=[]){return {humanInput:`Spiega il metodo per organizzare una biblioteca: turno ${id}`,nonce:`v8-concurrent-input-nonce-${id.padStart(3,'0')}`,selection,authorization:{human_mode_selected:true,opt_in_confirmed:true,provenance:'LOCAL_TEST_FIXTURE',separate_cohost_draft_authorized:true},priorMessages,resetContext:priorMessages.length===0};}
function count(p){return fs.existsSync(p)?fs.readFileSync(p,'utf8').trim().split('\n').length:0;}
test('two simultaneous distinct inputs never double-issue host callbacks or C87',async()=>{
 let called=0,release;
 const x=await setup(task=>{called++;return new Promise(resolve=>{release=()=>resolve(fixturePort(task));});});
 try{
  const p=x.host.runGuidedTurn(input(x.selection,'1'));
  const denied=await x.host.runGuidedTurn(input(x.selection,'2'));
  assert.equal(denied.surface_a.origin,'NO_VOICE');
  assert.equal(denied.surface_b.FIRST_EDGE,'V8_CONCURRENT_TURN_DENIED');
  assert.equal(called,1);assert.equal(count(x.host.ledger_file),0);
  release();const accepted=await p;
  assert.equal(accepted.surface_a.origin,'HOST_BOUND',JSON.stringify(accepted));
  assert.equal(count(x.host.ledger_file),1);
 }finally{x.done()}
});
test('after a completed turn the lane admits another turn with verified context',async()=>{
 const x=await setup();try{
  const a=await x.host.runGuidedTurn(input(x.selection,'1'));
  const b=await x.host.runGuidedTurn(input(x.selection,'2',[input(x.selection,'1').humanInput]));
  assert.equal(a.surface_a.origin,'HOST_BOUND');assert.equal(b.surface_a.origin,'HOST_BOUND',JSON.stringify(b));
  assert.equal(count(x.host.ledger_file),2);assert.notEqual(a.surface_b.TRACE_REF,b.surface_b.TRACE_REF);
 }finally{x.done()}
});
test('disposing during pending languagePort aborts before C87 append',async()=>{
 let release;const x=await setup(task=>new Promise(resolve=>{release=()=>resolve(fixturePort(task));}));
 try{
  const p=x.host.runGuidedTurn(input(x.selection,'1'));
  x.host.dispose();release();
  const r=await p;
  assert.equal(r.surface_a.origin,'NO_VOICE');assert.equal(r.surface_b.FIRST_EDGE,'V8_DISPOSED_DURING_LANGUAGE_PORT');
  assert.equal(fs.existsSync(x.host.ledger_file),false);
 }finally{x.done()}
});
test('rejected bad input does not retain lane lock',async()=>{
 const x=await setup();try{
  const f=input(x.selection,'1');f.humanInput='   ';
  assert.equal((await x.host.runGuidedTurn(f)).surface_a.origin,'NO_VOICE');
  assert.equal((await x.host.runGuidedTurn(input(x.selection,'1'))).surface_a.origin,'HOST_BOUND');
  assert.equal(count(x.host.ledger_file),1);
 }finally{x.done()}
});
test('failed language callback releases lane; no C87 event for failure',async()=>{
 let called=0;const x=await setup(task=>{called++;if(called===1)throw Error('host unavailable');return fixturePort(task)});
 try{
  const p=await x.host.runGuidedTurn(input(x.selection,'1'));
  assert.equal(p.surface_b.FIRST_EDGE,'V7_HOST_LANGUAGE_ERROR');assert.equal(count(x.host.ledger_file),0);
  assert.equal((await x.host.runGuidedTurn(input(x.selection,'1'))).surface_a.origin,'HOST_BOUND');
  assert.equal(count(x.host.ledger_file),1);
 }finally{x.done()}
});
test('legacy PR119 owner, consent and source remain unchanged by V8 gate',async()=>{
 const x=await setup();try{
  const f=input(x.selection,'1');f.authorization.separate_cohost_draft_authorized=false;
  assert.equal((await x.host.runGuidedTurn(f)).surface_b.FIRST_EDGE,'V7_SEPARATE_DRAFT_AUTHORIZATION');
  assert.equal(count(x.host.ledger_file),0);
  const ok=await x.host.runGuidedTurn(input(x.selection,'1'));
  assert.equal(ok.surface_b.SOURCE_REF,source);assert.equal(ok.surface_b.ACTIVE,false);assert.equal(ok.surface_b.PROVIDER_ATTESTED,false);
  assert.equal(count(x.host.ledger_file),1);
 }finally{x.done()}
});
