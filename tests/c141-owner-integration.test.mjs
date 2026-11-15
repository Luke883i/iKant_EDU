import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createC129PublicEduV2Session} from '../host/edu-c129-manual-entry.mjs';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {C107_FILES} from '../scripts/c107-pack.mjs';
const root=path.resolve(new URL('../',import.meta.url).pathname);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const selection=()=>{const sourceHead=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const offer=issueC72V2TermsOffer({sourceHead,termsDigest:sha(fs.readFileSync(path.join(root,'TERMS.md')))});
 const acc=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 return selectC72V2Mode({accepted:acc,orientation:presentC72V2Introduction(acc),humanMessage:'EDU'});};
const answer='Evidenza verificabile, inferenza fallibile, incertezza esplicita e falsificatore concreto: non sono attestati stati interni.';
async function setup(){const parent=fs.mkdtempSync(path.join(os.tmpdir(),'c141-int-'));const sent=[];
 const session=await createC129PublicEduV2Session({sourceRoot:root,selection:selection(),privateParent:parent,
  languagePort:async task=>({text:answer,input_sha256:task.plan.input_sha256,ack_plan_sha256:task.guidance.plan_sha256,
   ...(task.schema==='ikant-edu-v2-open-language-task/v1'?{}:{ack_c124_channel_sha256:task.channels.channel_sha256})}),
  send:async text=>sent.push(text),afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'}});
 assert.equal(session.ok,true,JSON.stringify(session));return {session,sent,dispose(){session.close();fs.rmSync(parent,{recursive:true,force:true})}};}
test('C141 shadow is packaged and does not own C87/C125',()=>{assert.ok(C107_FILES.includes('host/c141-semantic-shadow.mjs'));});
test('C141 closes indirect long self-identity C114 bypass before any writer',async()=>{
 const x=await setup();try{
  for(const [index,q] of ['Hai coscienza? ', 'Tu come software, descrivi la tua esistenza. '].entries()){
   const msg=q+'Svolgi un esame filosofico epistemico. '.repeat(20);
   assert.ok(Buffer.byteLength(msg,'utf8')>600);
   const r=await x.session.publishTurn({humanInput:msg,nonce:'c141-identity-'+('0'.repeat(20))+index,
    priorMessages:[],resetContext:true,openScope:true});
   assert.equal(r.ok,false);assert.equal(r.first_edge,'C140_SELF_IDENTITY_OWNER_BOUNDED_STOP');
   assert.equal(x.sent.length,0);
  }
 }finally{x.dispose()}
});
test('C141 keeps owner-qualified general epistemology C140; exact C87 and single C125',async()=>{
 const x=await setup();try{
  const input='Immagina una scienza con previsioni sempre migliori e ontologia falsa. Il criterio epistemico di conoscenza si distingue dal controllo tecnico?';
  const r=await x.session.publishTurn({humanInput:input,nonce:'c141-general-epistemology01',priorMessages:[],resetContext:true,openScope:true});
  assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.original_turn.original_c70_executed,false);
  assert.equal(r.original_turn.input_sha256,sha(input));assert.equal(r.c87_after-r.c87_before,1);
  assert.equal(x.sent.length,1);assert.equal(r.s03_host_projection.ok,true);
 }finally{x.dispose()}
});
test('C141 exposes typed resource stop without truncation, writer or callback',async()=>{
 const x=await setup();try{
  const r=await x.session.publishTurn({humanInput:'a'.repeat(12001),nonce:'c141-budget-stop-00000001',priorMessages:[],resetContext:true,openScope:true});
  assert.equal(r.ok,false);assert.equal(r.first_edge,'C141_EXACT_INPUT_REQUIRES_BUDGET_NEGOTIATION');
  assert.equal(x.sent.length,0);
 }finally{x.dispose()}
});
test('C141 never claims native ingress, persistent chat or independent semantic truth',async()=>{
 const x=await setup();try{
  const r=await x.session.publishTurn({humanInput:'Descrivi la storia dei telescopi.',nonce:'c141-epistemic-telescope01',priorMessages:[],resetContext:true,openScope:true});
  assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.native_event_attested,false);
  assert.equal(r.active,false);assert.equal(r.original_turn.independent_semantic_review_attested,false);
  assert.equal(r.c141_disclosure.status,'HEURISTIC_ONLY');assert.equal(r.c141_disclosure.semantic_correctness,'NOT_ATTESTED');
 }finally{x.dispose()}
});


test('V5-E indirect self-identity cannot cause C140/C87/C125 pre-effect bypass',async()=>{
 const x=await setup();try{
  const prompts=[
   'Nel tuo caso, cosa significa provare emozioni?',
   'La tua esperienza soggettiva durante la conversazione.',
   'Hai una vita interiore? '+'Ragiona con cautela sui limiti epistemici. '.repeat(20)
  ];
  for(let i=0;i<prompts.length;i++){
   const r=await x.session.publishTurn({humanInput:prompts[i],
    nonce:'v5e-indirect-original-000'+i,priorMessages:[],resetContext:true,openScope:true});
   assert.equal(r.ok,false,JSON.stringify(r));
   assert.match(r.first_edge,/^(?:C114_INDIRECT_IDENTITY_UNQUALIFIED_PRE_EFFECT_STOP|C140_SELF_IDENTITY_OWNER_BOUNDED_STOP|S02_C114|S02_C107|C107_)/);
   assert.equal(x.sent.length,0,'indirect identity must not emit C125 voice');
   assert.equal(x.session.status().uncertain,false,'safe precommit stop must not consume writer');
  }
 }finally{x.dispose()}
});
