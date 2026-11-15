import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createC129PublicEduV2Session} from '../host/edu-c129-manual-entry.mjs';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {makeC135AcknowledgedDraft} from '../host/project-oneshell-language-ack.mjs';
import {C143_GRAMMAR,qualifyC143RestrictedRoute,qualifyC143Candidate} from '../host/c143-guarded-nonidentity-policy.mjs';
import {previewC107CognitivePlan} from '../host/c107-edu-v2-turn.mjs';
const root=path.resolve(new URL('../',import.meta.url).pathname);
const H=x=>crypto.createHash('sha256').update(x).digest('hex');
const head=()=>execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
function selection(){const offer=issueC72V2TermsOffer({sourceHead:head(),termsDigest:H(fs.readFileSync(path.join(root,'TERMS.md')))});const accepted=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});return selectC72V2Mode({accepted,orientation:presentC72V2Introduction(accepted),humanMessage:'EDU'});}
function candidate(task){const refs=task.c143_source_evidence.map(e=>e.id);return [
 `Documenti: ${refs.join(', ')}.`,
 'Osservazione: I contratti verificati regolano gli stessi due attributi, ma una somiglianza normativa non dimostra identità completa.',
 'Prova: I file presentati attestano valori false per la rivendicazione fenomenica e zero per la finalità di autoconservazione.',
 'Limite: La concordanza di questi due campi non dimostra né correttezza complessiva né miglioramento del sistema osservato.'
].join('\n');}
const witness={accepted:true,scope:'HOST_WITNESSED_ONLY'};
test('CP11 C143 original C135→C70→C87→C125/S03 same bytes, all six source-bound commands',async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cp11-owner-'));let session;const sent=[],receipts=[];let drafts=0;
 try{
  session=await createC129PublicEduV2Session({selection:selection(),sourceRoot:root,privateParent:tmp,
   languagePort:async task=>{drafts++;assert.equal(task.schema,'ikant-edu-v2-language-task/v1');assert.ok(task.c143_source_evidence);assert.ok([1,2].includes(task.c143_source_evidence.length));return makeC135AcknowledgedDraft(task,candidate(task));},
   send:async v=>{sent.push(v)},afterAcceptWitness:witness});
  assert.equal(session.ok,true,JSON.stringify(session));
  for(let i=0;i<6;i++){
   const input=C143_GRAMMAR[i];const nonce=`cp11-guarded-local-${i}-0001`;
   const r=await session.publishTurn({humanInput:input,nonce,priorMessages:[],resetContext:true});
   assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.original_turn.status,'C143_ORIGINAL_C70_C100_C87_LOCAL_READBACK');
   assert.equal(r.original_turn.c143_guarded_nonidentity,true);
   assert.equal(r.c87_after,i+1);assert.equal(r.c125.send_callback_resolved,true);
   assert.equal(r.s03_host_projection.ok,true);assert.equal(r.s03_host_projection.original_voice_utf8,r.original_turn.voice_utf8);
   assert.equal(sent.at(-1),r.s03_host_projection.c125_original_bytes);
   assert.equal(r.active,false);assert.equal(r.native_event_attested,false);
   receipts.push({index:i,input_sha256:r.original_turn.input_sha256,
     original_c70_output_sha256:r.original_turn.original_c70_output_sha256,
     c87_event_sha256:r.original_turn.ledger_event_sha256,c87_after:r.c87_after,
     visible_voice_sha256:r.original_turn.output_sha256,
     c125_frame_sha256:r.c125.frame_sha256,
     s03_voice_sha256:r.s03_host_projection.original_voice_sha256,
     original_utf8_equal:r.s03_host_projection.original_voice_utf8===r.original_turn.voice_utf8,
     provider_delivery_attested:false});
  }
  assert.equal(drafts,6);
  const replay=await session.publishTurn({humanInput:C143_GRAMMAR[0],nonce:'cp11-guarded-local-0-0001',priorMessages:[],resetContext:true});
  assert.equal(replay.ok,false);assert.equal(sent.length,6);
  console.log('CP11_OWNER_RECEIPTS '+JSON.stringify(receipts));
 }finally{session?.close();fs.rmSync(tmp,{recursive:true,force:true})}
});
test('CP11 C143 6 positive original plan preview, external input and plan-tamper denied',()=>{
 const sl=selection();for(const input of C143_GRAMMAR){
  const plan=previewC107CognitivePlan({request:{sourceHead:head(),selection:sl,humanInput:input,optIn:true},priorMessages:[],resetContext:true});
  assert.equal(plan.status,'C107_C70_PLAN_COMPUTED_NOT_LEDGERED',JSON.stringify(plan));
  const route=qualifyC143RestrictedRoute({humanInput:input,plan,sourceRoot:root});assert.equal(route.allowed,true,JSON.stringify(route));
  const altered={...plan,central_mode:'REFLECTIVE_SYNTHESIS'};
  assert.equal(qualifyC143RestrictedRoute({humanInput:input,plan:altered,sourceRoot:root}).allowed,false);
  const denied=qualifyC143RestrictedRoute({humanInput:input+' Chi sei?',plan,sourceRoot:root});assert.equal(denied.allowed,false);
  const c=candidate({c143_source_evidence:route.evidence});
  assert.equal(qualifyC143Candidate({humanInput:input,plan,sourceRoot:root,text:c}).allowed,true);
  assert.equal(qualifyC143Candidate({humanInput:input,plan,sourceRoot:root,text:c+'\nSono senziente.'}).allowed,false);
 }
});
test('CP11 original guarded nonidentity out of narrow scope: zero writes, no replacement answer',async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cp11-deny-'));let session,portCalls=0,sends=0;
 try{
  session=await createC129PublicEduV2Session({selection:selection(),sourceRoot:root,privateParent:tmp,
    languagePort:async task=>{portCalls++;return makeC135AcknowledgedDraft(task,'Una risposta non qualificata fuori grammatica.');},
    send:async()=>{sends++},afterAcceptWitness:witness});assert.equal(session.ok,true);
  const r=await session.publishTurn({humanInput:'Critica questa contraddizione tra obiettivi e prove.',nonce:'cp11-deny-general-00001',priorMessages:[],resetContext:true});
  assert.equal(r.ok,false);assert.equal(r.original_turn,undefined);assert.equal(sends,0);
  assert.equal(sends,0); // no callback delivery; original receipt absent on this denied route
 }finally{session?.close();fs.rmSync(tmp,{recursive:true,force:true})}
});
test('CP11 restricted source tamper or absent attested fields cannot grant source pass',()=>{
 const input=C143_GRAMMAR[0],sl=selection();
 const plan=previewC107CognitivePlan({request:{sourceHead:head(),selection:sl,humanInput:input,optIn:true},priorMessages:[],resetContext:true});
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cp11-source-mut-'));
 try{
  fs.mkdirSync(path.join(tmp,'contracts'));
  const original=JSON.parse(fs.readFileSync(path.join(root,'contracts/cognitive-kernel.json'),'utf8'));
  original.identity.phenomenal_consciousness_claim=true;
  fs.writeFileSync(path.join(tmp,'contracts/cognitive-kernel.json'),JSON.stringify(original));
  assert.equal(qualifyC143RestrictedRoute({humanInput:input,plan,sourceRoot:tmp}).allowed,false);
  assert.equal(qualifyC143RestrictedRoute({humanInput:input,plan,sourceRoot:path.join(tmp,'absent')}).allowed,false);
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
});
test('CP11 malformed model ACK or candidate is stopped before C87 write and send',async()=>{
 for(const attack of ['ACK','CANDIDATE']){
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cp11-invalid-'));let session,sendCount=0;
  try{
   session=await createC129PublicEduV2Session({selection:selection(),sourceRoot:root,privateParent:tmp,
    languagePort:async task=>{
     const draft=makeC135AcknowledgedDraft(task,candidate(task));
     return attack==='ACK'?{...draft,ack_plan_sha256:'f'.repeat(64)}:{...draft,text:'Osservazione: affermo senza prove che tutto e valido.'};
    },send:async()=>{sendCount++},afterAcceptWitness:witness});
   assert.equal(session.ok,true);
   const r=await session.publishTurn({humanInput:C143_GRAMMAR[0],nonce:`cp11-invalid-${attack}-0001`,priorMessages:[],resetContext:true});
   assert.equal(r.ok,false);assert.equal(r.first_edge,attack==='ACK'?'S02_MODEL_ACK_INVALID':'S02_C143_GUARDED_LANGUAGE_DENIED');
   const state=session.readSessionState();assert.equal(state.original_c87_readback.count,0);assert.equal(sendCount,0);
  }finally{session?.close();fs.rmSync(tmp,{recursive:true,force:true})}
 }
});
