import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createLocalCohostAdapter,denyHostTurn} from '../host/edu-cohost-outcome.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const raw=()=>fs.readFileSync(path.join(root,'release/v8/ikant-c107-source-c734bf934e33.ikc.br'));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const auth=Object.freeze({human_mode_selected:true,opt_in_confirmed:true,provenance:'LOCAL_TEST_FIXTURE',separate_cohost_draft_authorized:false});
async function make(){
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'edu-pr119-'));
 const host=await createLocalCohostAdapter({carrierBytes:raw(),privateParent:parent});
 assert.equal(host.ok,true,host.blocked?.surface_b.FIRST_EDGE);
 const a=await import(pathToFileURL(path.join(host.install_root,'host/c72-unified-mode-admission.mjs')));
 const terms=fs.readFileSync(path.join(host.install_root,'TERMS.md'));
 const offer=a.issueC72TermsOffer({sourceHead:'c734bf934e33703a6a1f91f0f4d5df96eec96945',termsDigest:sha(terms)});
 const accepted=a.acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 const selection=a.selectC72Mode({accepted,orientation:a.presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
 assert.equal(selection.status,'EXPERIMENTAL_SELECTED_NOT_RUNNING');
 return {host,parent,selection,finish(){host.dispose();fs.rmSync(parent,{recursive:true,force:true})}};
}
test('P01 missing and corrupted physical carrier fail closed, no second payload',async()=>{
 assert.equal((await createLocalCohostAdapter({carrierBytes:null})).ok,false);
 const b=raw();b[5]^=1;
 const a=await createLocalCohostAdapter({carrierBytes:b});
 assert.equal(a.ok,false);assert.equal(a.blocked.surface_a.origin,'NO_VOICE');
 assert.match(a.blocked.manual_source_url,/c734bf934e33703a6a1f91f0f4d5df96eec96945\.zip/);
});
test('P02 missing human mode/optin blocks BEFORE C87 append',async()=>{
 const x=await make();try{
  const p=x.host.runTurn({humanInput:'Spiega il processo',nonce:'v9-test-nonce-000001',selection:x.selection});
  assert.equal(p.surface_a.origin,'NO_VOICE');assert.equal(fs.existsSync(x.host.ledger_file),false);
  const q=x.host.runTurn({humanInput:'Spiega il processo',nonce:'v9-test-nonce-000001',selection:x.selection,
   authorization:{...auth,human_mode_selected:false}});
  assert.equal(q.surface_a.origin,'NO_VOICE');assert.equal(fs.existsSync(x.host.ledger_file),false);
 }finally{x.finish()}
});
test('P03 two original demo turns reuse original C70-C100-C87 and local continuity',async()=>{
 const x=await make();try{
  const i1='Spiega il metodo di valutazione in due passaggi';
  const i2='Quale criterio e coerente con quanto detto prima?';
  const p=x.host.runTurn({humanInput:i1,nonce:'v9-test-nonce-000001',selection:x.selection,authorization:auth,resetContext:true});
  assert.equal(p.surface_a.origin,'ORIGINAL_DEMO',JSON.stringify(p.surface_b));
  assert.equal(p.surface_b.origin,'CHATGPT_HOST');assert.equal(p.surface_b.canonical_active,false);
  assert.equal(p.surface_b.CONTINUITY,'C87_LOCAL_REOPENED_NOT_NATIVE');
  for(const key of ['PHASE','STATE','SOURCE_REF','INPUT_REF','C70_PROOF','C100_PROOF','C87_PROOF','AUTHOR_ORIGIN','HOST_CARRIER','PROVIDER_PROOF','EVENT_REF','TRACE_REF','CONTINUITY','FIRST_EDGE','NEXT','HOST_COMMENT','TECH_ARTIFACT'])assert.ok(Object.hasOwn(p.surface_b,key),key);
  const q=x.host.runTurn({humanInput:i2,nonce:'v9-test-nonce-000002',selection:x.selection,authorization:auth,priorMessages:[i1]});
  assert.equal(q.surface_a.origin,'ORIGINAL_DEMO',JSON.stringify(q.surface_b));
  assert.notEqual(p.surface_b.TRACE_REF,q.surface_b.TRACE_REF);
  assert.equal(fs.readFileSync(x.host.ledger_file,'utf8').trimEnd().split('\n').length,2);
  const replay=x.host.runTurn({humanInput:i1,nonce:'v9-test-nonce-000001',selection:x.selection,authorization:auth,resetContext:true});
  assert.equal(replay.surface_a.origin,'NO_VOICE');
  assert.equal(fs.readFileSync(x.host.ledger_file,'utf8').trimEnd().split('\n').length,2);
  assert.equal(p.surface_b.native_chatgpt_origin_attested,false);
 }finally{x.finish()}
});
test('P03 fixture draft requires separate cohost authorization and cannot impersonate provider',async()=>{
 const x=await make();try{
  const i='Spiega il metodo di valutazione in due passaggi';
  const candidate={input_sha256:sha(Buffer.from(i)),text:'Bozza host di prova (non attestazione provider).'};
  const denied=x.host.runTurn({humanInput:i,nonce:'v9-test-draft-00001',selection:x.selection,authorization:auth,resetContext:true,modelCandidate:candidate});
  assert.equal(denied.surface_a.origin,'NO_VOICE');assert.equal(fs.existsSync(x.host.ledger_file),false);
  const yes=x.host.runTurn({humanInput:i,nonce:'v9-test-draft-00001',selection:x.selection,authorization:{...auth,separate_cohost_draft_authorized:true},resetContext:true,modelCandidate:candidate});
  assert.equal(yes.surface_a.origin,'HOST_BOUND',JSON.stringify(yes.surface_b));
  assert.equal(yes.surface_b.provider_origin_attested,false);assert.equal(yes.surface_b.llm_provider_origin,'NOT_ATTESTED');
 }finally{x.finish()}
});
test('C87 corruption fails closed and does not create a second original ledger writer',async()=>{
 const x=await make();try{
  const i='Spiega il metodo di valutazione in due passaggi';
  const r=x.host.runTurn({humanInput:i,nonce:'v9-test-nonce-000001',selection:x.selection,authorization:auth,resetContext:true});
  assert.equal(r.surface_a.origin,'ORIGINAL_DEMO');
  fs.appendFileSync(x.host.ledger_file,'{"fake":"event"}\n');
  const broken=x.host.runTurn({humanInput:'Ancora',nonce:'v9-test-nonce-000002',selection:x.selection,authorization:auth,priorMessages:[i]});
  assert.equal(broken.surface_a.origin,'NO_VOICE');
 }finally{x.finish()}
});
test('P04 fresh-evidence retries stop and output pinned manual handoff',async()=>{
 const x=await make();try{
  assert.equal(x.host.recovery().attempt,1);
  assert.equal(x.host.recovery().status,'MANUAL_SOURCE_HANDOFF');
  assert.equal(x.host.recovery({freshEvidenceId:'evidence2'}).attempt,2);
  assert.equal(x.host.recovery({freshEvidenceId:'evidence3'}).attempt,3);
  const v=x.host.recovery({freshEvidenceId:'evidence4'});
  assert.equal(v.status,'MANUAL_SOURCE_HANDOFF');
  assert.equal(v.url,'https://github.com/Luke883i/iKant_LE/archive/c734bf934e33703a6a1f91f0f4d5df96eec96945.zip');
 }finally{x.finish()}
});
test('A/B strictly distinct even under forged voice descriptions',()=>{
 const no=denyHostTurn('FORGED_HOST_TEXT');
 assert.equal(no.surface_a.origin,'NO_VOICE');assert.equal(no.surface_a.voice_utf8,null);
 assert.equal(no.surface_b.origin,'CHATGPT_HOST');
 assert.equal(no.surface_b.FIRST_EDGE,'FORGED_HOST_TEXT');
});
test('hostile Proxy/getter in turn input cannot invoke original owner or user getter',async()=>{
 const x=await make();try{
  let traps=0;
  const proxy=new Proxy({humanInput:'hello'}, {get(){traps++;throw Error('trap')}});
  const p=x.host.runTurn(proxy);
  assert.equal(p.surface_a.origin,'NO_VOICE');assert.equal(traps,0);
  const candidate={};Object.defineProperty(candidate,'text',{enumerable:true,get(){traps++;throw Error('getter')}});
  const q=x.host.runTurn({humanInput:'hello',nonce:'v9-test-nonce-000001',selection:x.selection,
   authorization:{...auth,separate_cohost_draft_authorized:true},resetContext:true,modelCandidate:candidate});
  assert.equal(q.surface_a.origin,'NO_VOICE');assert.equal(traps,0);
  assert.equal(fs.existsSync(x.host.ledger_file),false);
  const r=x.host.recovery(new Proxy({}, {get(){traps++;throw Error('trap')}}));
  assert.equal(r.status,'MANUAL_SOURCE_HANDOFF');assert.equal(traps,0);
 }finally{x.finish()}
});
test('hardening: inherited and indexed array getters never execute in hostile frames',async()=>{
 const x=await make();try{
  let calls=0;
  const arr=['previous'];
  Object.defineProperty(arr,'0',{configurable:true,enumerable:true,get(){calls++;throw Error('indexed accessor')}});
  const q=x.host.runTurn({humanInput:'hello',nonce:'v9-array-getter-00001',selection:x.selection,
   authorization:auth,resetContext:true,priorMessages:arr});
  assert.equal(q.surface_a.origin,'NO_VOICE');
  assert.equal(q.surface_b.FIRST_EDGE,'HOST_FRAME_GETTER_PROXY_OR_SHAPE');
  assert.equal(calls,0);
  assert.equal(fs.existsSync(x.host.ledger_file),false);
 }finally{x.finish()}
});
