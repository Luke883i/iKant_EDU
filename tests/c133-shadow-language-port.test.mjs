import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createC133ShadowLanguagePort,qualifyC133LanguageTask} from '../host/c133-shadow-language-port.mjs';
import {createC129ManualEduSession} from '../host/edu-c129-manual-entry.mjs';
import {buildC127SourceCache} from '../host/edu-c127-source-transport.mjs';
import {PIN} from '../host/c107-carrier-consumer.mjs';
import {C124_SOURCE_EPOCH,C124_OVERLAY_GIT_BLOBS} from '../host/c124-source-overlay.mjs';
const root=path.dirname(fileURLToPath(new URL('../package.json',import.meta.url)));
const h=x=>crypto.createHash('sha256').update(x).digest('hex');
const witness={accepted:true,scope:'HOST_WITNESSED_ONLY'};
function sampleTask(input='Explain a useful methodology with evidence.') {
 const plan={schema:'ikant-le-c107-c70-before-language/v1',input_sha256:h(input),c70_output_sha256:'c'.repeat(64),
  central_mode:'CRITIQUE',method:'DIRECT',response_family:'UNSUPPORTED',resource_gap:false,cognitive_window_length:1};
 return Object.freeze({schema:'ikant-edu-c70-language-task/v7',source_head:C124_SOURCE_EPOCH,current_input_utf8:input,
  plan:Object.freeze(plan),guidance:Object.freeze({schema:'ikant-le-c117-semantic-guide/v1',plan_sha256:h(JSON.stringify(plan)),
   original_c70_output_sha256:plan.c70_output_sha256}),prior_messages_utf8:Object.freeze([]),
  statement:'no proof of LLM causality'});
}
function cache(){
 const carrierBytes=fs.readFileSync(path.join(root,PIN.name));
 const overlays=Object.fromEntries(Object.keys(C124_OVERLAY_GIT_BLOBS).map(p=>[p,fs.readFileSync(path.join(root,p))]));
 const built=buildC127SourceCache({carrierBytes,c124OverlayBytes:overlays});assert.equal(built.ok,true);
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c133-'));
 const file=path.join(parent,'cache.json');fs.writeFileSync(file,built.bytes,{flag:'wx',mode:0o600});
 return {file,parent};
}
test('shadow scopes reached by genuine language callback without replacing original plan',async()=>{
 for(const [input,scope] of [
  ['What is my human nature?','HUMAN'],['iKant, cosa sei?','SOFTWARE'],
  ['Gianluca e iKant, confronta natura e runtime','MIXED'],
  ['Explain a useful methodology with evidence.','GENERAL']]){
  const task=sampleTask(input),captured=[];
  const port=createC133ShadowLanguagePort(async next=>{captured.push(next);return {text:'A well-bounded response.'}});
  const result=await port(task);
  assert.equal(result.text,'A well-bounded response.');assert.equal(captured.length,1);
  assert.equal(captured[0].c133_shadow.scope,scope);
  assert.equal(captured[0].plan,task.plan);
  assert.equal(captured[0].guidance,task.guidance);
  assert.equal(captured[0].current_input_utf8,task.current_input_utf8);
  assert.equal(captured[0].c133_shadow.original_c70_overridden,false);
  assert.equal(captured[0].c133_shadow.original_c114_bypassed,false);
  assert.equal(captured[0].c133_shadow.model_generation_or_semantic_quality_attested,false);
  assert.equal(Object.isFrozen(captured[0]),true);
 }
});
test('input and plan tampering fail before HOST callback',async()=>{
 const good=sampleTask();let calls=0;
 const port=createC133ShadowLanguagePort(()=>{calls++;return {text:'ignored'}});
 const damaged=[{...good,current_input_utf8:'a different input'},
  {...good,guidance:{...good.guidance,plan_sha256:'a'.repeat(64)}},
  {...good,plan:{...good.plan,input_sha256:'b'.repeat(64)}},
  {...good,schema:'unknown'},
  {...good,current_input_utf8:'x'.repeat(601)}];
 for(const d of damaged)await assert.rejects(port(d),/C133_UNBOUND/);
 assert.equal(calls,0);
});
test('C133 preserves original C129 manual EDU -> C87 readback -> C125 send',async()=>{
 const x=cache();let session;const seen=[],sent=[];
 try{
  session=await createC129ManualEduSession({manualCachePath:x.file,privateParent:x.parent,afterAcceptWitness:witness,
   send:x=>sent.push(x),languagePort:task=>{
    seen.push(task);
    assert.equal(task.c133_shadow.scope,'GENERAL');
    assert.equal(task.c133_shadow.original_plan_sha256,task.guidance.plan_sha256);
    return {text:'A careful assessment compares the available evidence, its limits, and alternatives.',
      input_sha256:task.plan.input_sha256,ack_plan_sha256:task.guidance.plan_sha256,
      ack_c124_channel_sha256:task.c124_channel_sha256};
   }});
  assert.equal(session.ok,true,JSON.stringify(session));
  const stage=fs.readdirSync(x.parent).find(n=>n.startsWith('ikant-c107-source-'));assert.ok(stage);
  const c72=await import(pathToFileURL(path.join(x.parent,stage,'host/c72-unified-mode-admission.mjs')).href);
  const offer=c72.issueC72TermsOffer({sourceHead:C124_SOURCE_EPOCH,termsDigest:h(fs.readFileSync(path.join(x.parent,stage,'TERMS.md')))});
  const accepted=c72.acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
  const selection=c72.selectC72Mode({accepted,orientation:c72.presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
  const frame={humanInput:'Fai un confronto tra due ipotesi con prove e limiti.',nonce:'c133-guidance-test-20261014',selection,
   priorMessages:[],resetContext:true,authorization:{human_mode_selected:true,opt_in_confirmed:true,
    separate_cohost_draft_authorized:true,provenance:'LOCAL_TEST_FIXTURE'}};
  const r=await session.publishTurn({frame});assert.equal(r.ok,true,JSON.stringify(r));
  assert.equal(r.origin,'HOST_BOUND');assert.equal(seen.length,1);assert.equal(sent.length,1);
  assert.equal((await session.publishTurn({frame})).ok,false);assert.equal(sent.length,1);
 } finally {session?.close();fs.rmSync(x.parent,{recursive:true,force:true});}
});
test('original C114 still denies a human ontology route: no C87, no bypass',async()=>{
 const x=cache();let session;let language=0;let sends=[];
 try{
  session=await createC129ManualEduSession({manualCachePath:x.file,privateParent:x.parent,afterAcceptWitness:witness,
   send:out=>sends.push(out),languagePort:task=>{language++;assert.equal(task.c133_shadow.scope,'HUMAN');
    return {text:'Human identity can be approached via biology, agency and social experience, with uncertainties.',
      input_sha256:task.plan.input_sha256,ack_plan_sha256:task.guidance.plan_sha256,
      ack_c124_channel_sha256:task.c124_channel_sha256};}});
  assert.equal(session.ok,true,JSON.stringify(session));
  const stage=fs.readdirSync(x.parent).find(n=>n.startsWith('ikant-c107-source-'));
  const c72=await import(pathToFileURL(path.join(x.parent,stage,'host/c72-unified-mode-admission.mjs')).href);
  const offer=c72.issueC72TermsOffer({sourceHead:C124_SOURCE_EPOCH,termsDigest:h(fs.readFileSync(path.join(x.parent,stage,'TERMS.md')))});
  const accepted=c72.acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
  const selection=c72.selectC72Mode({accepted,orientation:c72.presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
  const frame={humanInput:'Descrivi la mia natura ontologica, sono un uomo.',nonce:'c133-human-ontolog-20261014',selection,
   priorMessages:[],resetContext:true,authorization:{human_mode_selected:true,opt_in_confirmed:true,
    separate_cohost_draft_authorized:true,provenance:'LOCAL_TEST_FIXTURE'}};
  const r=await session.publishTurn({frame});
  assert.equal(r.ok,true,JSON.stringify(r));
  assert.equal(language,1);
  assert.equal(r.origin,'NO_VOICE');
  assert.equal(sends.length,1); // C125 may send a blocked status, not a forged voice.
  assert.equal(session.status().port.resolved,1);
 }finally{session?.close();fs.rmSync(x.parent,{recursive:true,force:true});}
});
test('published C133 contract is explicit about remaining gaps',()=>{
 const p=JSON.parse(fs.readFileSync(path.join(root,'contracts/c133-shadow-language-port.json'),'utf8'));
 assert.equal(p.authority,0);assert.equal(p.original_c114_policy_bypassed,false);
 assert.equal(p.c87_writer_added,false);assert.equal(p.causal_llm_quality_gain_attested,false);
});
