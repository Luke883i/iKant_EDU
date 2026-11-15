import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createGuidedCohostV7} from '../host/edu-c70-method-v7.mjs';
import {createC125ShellSession} from '../host/edu-c125-shell-session.mjs';
import {PIN} from '../host/c107-carrier-consumer.mjs';
import {verifyC124OverlayBytes,C124_SOURCE_EPOCH,C124_OVERLAY_GIT_BLOBS} from '../host/c124-source-overlay.mjs';
import {C124_CHANNEL_IDS} from '../src/c124-channel-bridge.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const carrier=fs.readFileSync(path.join(root,PIN.name));
const overlay=()=>Object.fromEntries(Object.keys(C124_OVERLAY_GIT_BLOBS).map(p=>[p,fs.readFileSync(path.join(root,p))]));
const sourceHead=C124_SOURCE_EPOCH;
const input='Che cosa rende utile leggere romanzi e saggi di filosofia?';
const voice='La lettura allarga le prospettive e rende più articolata la comprensione di esperienze e argomenti.';
const fixture=task=>({text:voice,ack_plan_sha256:task.guidance.plan_sha256,input_sha256:task.plan.input_sha256,
 ...(task.c124_channel_sha256?{ack_c124_channel_sha256:task.c124_channel_sha256}:{})});
async function selection(rootStaged,head){
 const c72=await import(pathToFileURL(path.join(rootStaged,'host/c72-unified-mode-admission.mjs')).href);
 const termsDigest=digest(fs.readFileSync(path.join(rootStaged,'TERMS.md')));
 const offer=c72.issueC72TermsOffer({sourceHead:head,termsDigest});
 const accepted=c72.acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 return c72.selectC72Mode({accepted,orientation:c72.presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
}
function frame(sel,nonce='c124-guided-original-0001'){
 return {humanInput:input,nonce,selection:sel,priorMessages:[],resetContext:true,
 authorization:{human_mode_selected:true,opt_in_confirmed:true,separate_cohost_draft_authorized:true,provenance:'LOCAL_TEST_FIXTURE'}};
}
test('exact three-member source Git overlay required; hostile source rejected',()=>{
 const a=verifyC124OverlayBytes(overlay());
 assert.equal(a.ok,true,JSON.stringify(a));assert.equal(a.source_head,sourceHead);
 const damaged=overlay();damaged['src/c124-channel-bridge.mjs'][9]^=1;
 assert.equal(verifyC124OverlayBytes(damaged).ok,false);
 const extra=overlay();extra['src/hijack.mjs']=Buffer.from('unexpected');
 assert.equal(verifyC124OverlayBytes(extra).ok,false);
 let called=0;const proxy=new Proxy(overlay(),{get(){called++;throw Error('hostile')}});
 assert.equal(verifyC124OverlayBytes(proxy).ok,false);assert.equal(called,0);
});
test('C124 guided PR119: twelve source-computed language instructions -> double ACK -> one C87 -> independent reopen',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c124-guided-'));let host,callback=0;
 try{
  host=await createGuidedCohostV7({carrierBytes:carrier,privateParent:parent,c124OverlayBytes:overlay(),
   languagePort:task=>{callback++;
    assert.equal(task.source_head,sourceHead);
    assert.equal(task.c124_channels.channels.length,C124_CHANNEL_IDS.length);
    assert.deepEqual(task.c124_channels.channels.map(x=>x.id),C124_CHANNEL_IDS);
    assert.ok(task.c124_channels.channels.every(x=>x.instruction.length>0&&x.included===true));
    assert.equal(task.c124_channel_sha256,task.c124_channels.channel_sha256);
    return fixture(task);
   }});
  assert.equal(host.ok,true,JSON.stringify(host.blocked));
  const sel=await selection(host.install_root,sourceHead);
  const r=await host.runGuidedTurn(frame(sel));
  assert.equal(r.surface_a.origin,'HOST_BOUND',JSON.stringify(r));
  assert.equal(r.surface_a.voice_utf8,voice);
  assert.equal(r.surface_b.C124_CHANNEL_COVERAGE,'12_OF_12_BOUND_NOT_CAUSAL_PROOF');
  assert.equal(r.active,false);assert.equal(r.surface_b.SEMANTIC_CAUSALITY_ATTESTED,false);
  const ledger=fs.readFileSync(host.ledger_file,'utf8').trimEnd().split('\n');
  assert.equal(ledger.length,1);const last=JSON.parse(ledger[0]);
  assert.equal(last.state.source_head,sourceHead);
  assert.equal(last.state.c124_language_channel_sha256,r.surface_b.C124_CHANNEL_SHA256);
  assert.equal(callback,1);
 }finally{host?.dispose();fs.rmSync(parent,{recursive:true,force:true})}
});
test('bad C124 ACK rejected before writer and no retry automatically',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c124-badack-'));let host;
 try{
  host=await createGuidedCohostV7({carrierBytes:carrier,privateParent:parent,c124OverlayBytes:overlay(),
   languagePort:task=>({...fixture(task),ack_c124_channel_sha256:'0'.repeat(64)})});
  assert.equal(host.ok,true);
  const sel=await selection(host.install_root,sourceHead);
  const r=await host.runGuidedTurn(frame(sel));
  assert.equal(r.surface_a.origin,'NO_VOICE');
  assert.equal(r.surface_b.FIRST_EDGE,'V7_PLAN_ACK_OR_HOST_TEXT_INVALID');
  assert.equal(fs.existsSync(host.ledger_file),false);
 }finally{host?.dispose();fs.rmSync(parent,{recursive:true,force:true})}
});
test('no stale C107 source selection may invoke new source epoch',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c124-stalesel-'));let host;
 try{host=await createGuidedCohostV7({carrierBytes:carrier,privateParent:parent,c124OverlayBytes:overlay(),languagePort:fixture});
 assert.equal(host.ok,true);const sel=await selection(host.install_root,PIN.head);
 const r=await host.runGuidedTurn(frame(sel));
 assert.equal(r.surface_a.origin,'NO_VOICE');assert.equal(r.surface_b.FIRST_EDGE,'V7_ORIGINAL_C72_SELECTION_INVALID');
 assert.equal(fs.existsSync(host.ledger_file),false);
 }finally{host?.dispose();fs.rmSync(parent,{recursive:true,force:true})}
});
test('old C107 carrier alone still supports guided legacy, without C124 claims',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c124-legacy-'));let host;
 try{host=await createGuidedCohostV7({carrierBytes:carrier,privateParent:parent,languagePort:fixture});
 assert.equal(host.ok,true);const sel=await selection(host.install_root,PIN.head);
 const r=await host.runGuidedTurn(frame(sel,'c124-legacy-guided-0001'));
 assert.equal(r.surface_a.origin,'HOST_BOUND',JSON.stringify(r));
 assert.equal(r.surface_b.C124_CHANNEL_COVERAGE,undefined);
 }finally{host?.dispose();fs.rmSync(parent,{recursive:true,force:true})}
});
test('C125 shell session reuses sole PR119 guided C124 lane, then exactly one send',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c124-shell-')),sent=[];let x;
 try{x=await createC125ShellSession({carrierBytes:carrier,c124OverlayBytes:overlay(),privateParent:parent,
  languagePort:fixture,send:async s=>{sent.push(s)},
  afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'}});
 assert.equal(x.ok,true);assert.equal(x.runtime_ready,true,x.initial_edge);
 const staged=fs.readdirSync(parent).filter(n=>n.startsWith('ikant-c107-source-'))[0];
 assert.ok(staged);const sel=await selection(path.join(parent,staged),sourceHead);
 const f=frame(sel,'c124-shell-same-input-0001');
 const r=await x.publishTurn({frame:f});
 assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.origin,'HOST_BOUND');
 assert.equal(sent.length,1);assert.ok(sent[0].includes(voice));assert.ok(sent[0].includes('HOST | NOTE'));
 assert.equal((await x.publishTurn({frame:f})).ok,false);assert.equal(sent.length,1);
 }finally{x?.close();fs.rmSync(parent,{recursive:true,force:true})}
});
