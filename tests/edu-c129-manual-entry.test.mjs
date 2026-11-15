import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createC129ManualEduSession} from '../host/edu-c129-manual-entry.mjs';
import {buildC127SourceCache} from '../host/edu-c127-source-transport.mjs';
import {PIN} from '../host/c107-carrier-consumer.mjs';
import {C124_SOURCE_EPOCH,C124_OVERLAY_GIT_BLOBS} from '../host/c124-source-overlay.mjs';
import {compileC117SemanticGuide} from '../host/c117-semantic-guidance.mjs';
const root=path.dirname(fileURLToPath(new URL('../package.json',import.meta.url)));
const h=s=>crypto.createHash('sha256').update(s).digest('hex');
const witness={accepted:true,scope:'HOST_WITNESSED_ONLY'};
function makeCache(){
 const carrierBytes=fs.readFileSync(path.join(root,PIN.name));
 const c124OverlayBytes=Object.fromEntries(Object.keys(C124_OVERLAY_GIT_BLOBS).map(p=>[p,fs.readFileSync(path.join(root,p))]));
 const v=buildC127SourceCache({carrierBytes,c124OverlayBytes});assert.equal(v.ok,true);
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c129-manual-'));
 const file=path.join(parent,'source.json');fs.writeFileSync(file,v.bytes,{flag:'wx',mode:0o600});
 return {parent,file,bytes:v.bytes};
}
test('no admission or machine bridge is acceptable at EDU C129 entry',async()=>{
 let calls=0;
 for(const args of [{}, {manualCachePath:'/nonexistent',privateParent:'/tmp',send:()=>calls++,languagePort:()=>{},bridges:[{fetch(){calls++}}],afterAcceptWitness:witness},
 {manualCachePath:'/nonexistent',privateParent:'/tmp',send:()=>calls++,languagePort:()=>{},afterAcceptWitness:{accepted:false,scope:'HOST_WITNESSED_ONLY'}}]){
  const z=await createC129ManualEduSession(args);assert.equal(z.ok,false);assert.equal(z.active,false);
 }
 assert.equal(calls,0);
});
test('reject symlinks, altered cache and malformed injected fields without execution',async()=>{
 const x=makeCache();let sends=0;
 try{
  const base={manualCachePath:x.file,privateParent:x.parent,languagePort:()=>{},send:()=>sends++,afterAcceptWitness:witness};
  const sym=path.join(x.parent,'sym');fs.symlinkSync(x.file,sym);
  assert.equal((await createC129ManualEduSession({...base,manualCachePath:sym})).ok,false);
  const corrupt=path.join(x.parent,'corrupt');const bytes=Buffer.from(x.bytes);bytes[111]^=1;fs.writeFileSync(corrupt,bytes);
  assert.equal((await createC129ManualEduSession({...base,manualCachePath:corrupt})).ok,false);
  assert.equal((await createC129ManualEduSession({...base,carrierBytes:x.bytes})).first_edge,'C129_UNEXPECTED_OR_MACHINE_TRANSPORT');
  let n=0;const proxy=new Proxy(base,{get(){n++;throw Error('GETTER');}});
  assert.equal((await createC129ManualEduSession(proxy)).ok,false);assert.equal(n,0);
  assert.equal(sends,0);
 }finally{fs.rmSync(x.parent,{recursive:true,force:true})}
});
test('original C127 and PR119/C87/C125 through exactly one verified manual file',async()=>{
 const x=makeCache();let sess=null;const sent=[],input='Confronta due idee in modo argomentato, indicando prove e limiti.';
 try{
  sess=await createC129ManualEduSession({manualCachePath:x.file,privateParent:x.parent,afterAcceptWitness:witness,
   send:s=>sent.push(s),languagePort:task=>({text:'Le idee differiscono nei presupposti, nelle prove e nelle conseguenze. La conclusione resta rivedibile.',
    input_sha256:task.plan.input_sha256,ack_plan_sha256:task.guidance.plan_sha256,
    ack_c124_channel_sha256:task.c124_channel_sha256})});
  assert.equal(sess.ok,true,JSON.stringify(sess));assert.equal(sess.runtime_ready,true);
  assert.equal(sess.machine_transport_attempts,0);assert.equal(sess.single_inode_readback_verified,true);
  assert.match(sess.operatorCard().text,/pronta a ricevere/);
  assert.equal(sess.operatorCard().active,false);
  const staged=fs.readdirSync(x.parent).find(p=>p.startsWith('ikant-c107-source-'));
  assert.ok(staged);
  const c72=await import(pathToFileURL(path.join(x.parent,staged,'host/c72-unified-mode-admission.mjs')).href);
  const terms=h(fs.readFileSync(path.join(x.parent,staged,'TERMS.md')));
  const offer=c72.issueC72TermsOffer({sourceHead:C124_SOURCE_EPOCH,termsDigest:terms});
  const accepted=c72.acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
  const sel=c72.selectC72Mode({accepted,orientation:c72.presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
  const frame={humanInput:input,nonce:'c129-manual-source-20261014',selection:sel,priorMessages:[],resetContext:true,
   authorization:{human_mode_selected:true,opt_in_confirmed:true,separate_cohost_draft_authorized:true,provenance:'LOCAL_TEST_FIXTURE'}};
  const a=await sess.publishTurn({frame});assert.equal(a.ok,true,JSON.stringify(a));assert.equal(a.origin,'HOST_BOUND');assert.equal(sent.length,1);
  assert.equal((await sess.publishTurn({frame})).ok,false);assert.equal(sent.length,1);
  sess.close();assert.match(sess.operatorCard().text,/chiusa/);assert.equal((await sess.publishTurn({frame:{...frame,nonce:'c129-manual-source-afterclose'}})).ok,false);
 }finally{sess?.close();fs.rmSync(x.parent,{recursive:true,force:true})}
});
test('C117 epistemic guide says answer, alternative and uncertainty without falsely claiming efficacy',()=>{
 const plan={schema:'ikant-le-c107-c70-before-language/v1',input_sha256:'a'.repeat(64),c70_output_sha256:'b'.repeat(64),
 central_mode:'CRITIQUE',method:'DIRECT',response_family:'UNSUPPORTED',resource_gap:false,cognitive_window_length:1};
 const g=compileC117SemanticGuide(plan);
 assert.match(g.instruction,/Answer the central critique first/);
 assert.match(g.instruction,/counterexample/);
 assert.equal(g.generated_text_semantically_certified,false);
});
test('declarative entry contract stays narrow and never asserts canonical activation',()=>{
 const c=JSON.parse(fs.readFileSync(path.join(root,'contracts/c129-edu-manual-entry.json'),'utf8'));
 assert.equal(c.authority,0);assert.equal(c.machine_transport_attempts,0);
 assert.equal(c.machine_fallback,false);assert.equal(c.captured_bytes_only_to_stager,true);
 assert.equal(c.source_epoch_unchanged,C124_SOURCE_EPOCH);
 assert.equal(c.canonical_manual_fallback_after_N,'BACKLOG_NOT_INSTALLED');
});
