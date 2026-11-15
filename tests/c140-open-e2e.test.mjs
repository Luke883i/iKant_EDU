import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createC129PublicEduV2Session} from '../host/edu-c129-manual-entry.mjs';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {c140OpenPolicy} from '../host/c140-open-edu-turn.mjs';
import {qualifyC140Lattice} from '../scripts/c140-qualify.mjs';
import {C107_FILES} from '../scripts/c107-pack.mjs';
import {emitC125Shell} from '../host/c125-exclusive-shell.mjs';
const root=path.resolve(new URL('../',import.meta.url).pathname);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const head=()=>execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const select=()=>{const offer=issueC72V2TermsOffer({sourceHead:head(),termsDigest:sha(fs.readFileSync(path.join(root,'TERMS.md')))});
 const accepted=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 return selectC72V2Mode({accepted,orientation:presentC72V2Introduction(accepted),humanMessage:'EDU'});};
const witness={accepted:true,scope:'HOST_WITNESSED_ONLY'};
const philosophy='Immagina una scienza con previsioni e controllo sempre migliori ma ontologia radicalmente falsa. Sta accumulando conoscenza o solo potere operativo? Definisci un criterio non arbitrario che distingua conoscenza, previsione e controllo. Spiega perche sia autorevole sul piano epistemico, non solo utile, senza promettere garanzie di verita: argomenta contro circolarita e regresso o delimita la giustificazione possibile. Non equiparare conoscenza e certezza. Indica il passaggio esatto dalla descrizione della pratica scientifica alla norma su cosa credere.';
const answer='Dati: le previsioni si possono testare. Inferenza: conoscenza richiede revisione pubblica, non solo efficacia. Falsificatore: un controesempio ripetibile obbliga a cambiare spiegazione. Non attesto che un testo convincente sia vero.';
const language=async task=>({text:answer,input_sha256:task.plan.input_sha256,ack_plan_sha256:task.guidance.plan_sha256,
 ...(task.schema==='ikant-edu-v2-open-language-task/v1'?{}:{ack_c124_channel_sha256:task.channels.channel_sha256})});
const setup=async({send=async()=>{},draft=language}={})=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'c140-e2e-'));
 const session=await createC129PublicEduV2Session({selection:select(),sourceRoot:root,privateParent:parent,
   languagePort:draft,send,afterAcceptWitness:witness});
 assert.equal(session.ok,true,JSON.stringify(session));
 return {session,done(){session.close();fs.rmSync(parent,{recursive:true,force:true})}};
};
test('C140 structural assurance: 42 mapped issues, 7 levels, 1000 candidates and honest product gate',()=>{
 const q=qualifyC140Lattice();assert.equal(q.candidate_count,1000);assert.equal(q.issues_mapped,42);
 assert.equal(q.levels,7);assert.equal(q.selected,'R4-A4-W4-E7');assert.equal(q.product,'PRODUCT_NO_GO');
 assert.equal(q.semantic_truth_attested,false);assert.ok(C107_FILES.includes('host/c140-open-edu-turn.mjs'));
 const immutable={'host/c107-edu-v2-turn.mjs':'eaabe9556f952626c55971029227b9b537848f87',
  'host/c114-ontology-language-policy.mjs':'7bd24e4eb35eb27774b8954a55987b1fb4c3999f'};
 for(const [p,expected] of Object.entries(immutable)){
  const b=fs.readFileSync(path.join(root,p));const actual=crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
  assert.equal(actual,expected,p);
 }
});
test('C140 original 557-byte general epistemology conflict routes to one C87 and C125 without pretending C70',async()=>{
 assert.equal(Buffer.byteLength(philosophy,'utf8'),557);
 const sent=[];const x=await setup({send:async s=>sent.push(s)});
 try{
  const r=await x.session.publishTurn({humanInput:philosophy,nonce:'c140-philosophy-case-00001',priorMessages:[],resetContext:true});
  assert.equal(r.ok,true,JSON.stringify(r));
  assert.equal(r.original_turn.status,'C140_ORIGINAL_C100_C87_LOCAL_READBACK');
  assert.equal(r.original_turn.original_c70_executed,false);
  assert.equal(r.original_turn.original_c87_writer_executed,true);
  assert.equal(r.original_turn.input_sha256,sha(philosophy));
  assert.equal(r.c87_before,0);assert.equal(r.c87_after,1);assert.equal(sent.length,1);
  assert.equal(r.c125.voice_sha256,sha(answer));
  assert.equal(r.s03_host_projection.original_voice_utf8,answer);
  assert.equal(r.native_event_attested,false);assert.equal(r.active,false);
  const replay=await x.session.publishTurn({humanInput:philosophy,nonce:'c140-philosophy-case-00001',priorMessages:[],resetContext:true});
  assert.equal(replay.ok,false);assert.equal(sent.length,1);
 }finally{x.done()}
});
test('C140 8KB arbitrary-topic input binds entire content, not truncated or topic-filtered',async()=>{
 const huge='Storia dell\u2019architettura e musica: '+ 'misura e falsifica. '.repeat(400);
 assert.ok(Buffer.byteLength(huge,'utf8')>600);assert.ok(Buffer.byteLength(huge,'utf8')<12000);
 const sent=[];const x=await setup({send:async s=>sent.push(s)});
 try{const r=await x.session.publishTurn({humanInput:huge,nonce:'c140-large-nonce-00000001',priorMessages:[],resetContext:true});
  assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.original_turn.input_sha256,sha(huge));
  assert.equal(r.original_turn.original_c70_executed,false);assert.equal(sent.length,1);
  assert.equal(r.s03_host_projection.ok,true);assert.equal(r.c87_after,1);
 }finally{x.done()}
});
test('C140 fail-closed before writer for resource overflow, privacy, unsupported introspection and non-ack',async()=>{
 assert.equal(c140OpenPolicy({humanInput:'storia del cinema'}).allowed,true);
 assert.equal(c140OpenPolicy({humanInput:'password: 12345'}).allowed,undefined);
 assert.equal(c140OpenPolicy({humanInput:'x'.repeat(12001)}).allowed,undefined);
 assert.equal(c140OpenPolicy({humanInput:'storia',text:'Sono davvero cosciente.'}).allowed,undefined);
 let sends=0;const x=await setup({send:async()=>{sends++},draft:async task=>({text:'Sono davvero cosciente.',
    input_sha256:task.plan.input_sha256,ack_plan_sha256:task.guidance.plan_sha256})});
 try{
  const r=await x.session.publishTurn({humanInput:'Storia del cinema',nonce:'c140-overclaim-00000001',priorMessages:[],resetContext:true,openScope:true});
  assert.equal(r.ok,false);assert.equal(sends,0);assert.equal(x.session.status().uncertain,false);
  const resource=await x.session.publishTurn({humanInput:'z'.repeat(12001),nonce:'c140-resource-00000001',priorMessages:[],resetContext:true});
  assert.equal(resource.ok,false);assert.equal(sends,0);
 }finally{x.done()}
});
test('C140 unknown C125 delivery consumes nonce and blocks later turns; no blind retry',async()=>{
 let attempts=0;const x=await setup({send:async()=>{attempts++;throw Error('uncertain transport')}});
 try{const a=await x.session.publishTurn({humanInput:'Storia della musica',nonce:'c140-unknown-send-00001',priorMessages:[],resetContext:true,openScope:true});
  assert.equal(a.ok,false);assert.equal(x.session.status().uncertain,true);assert.equal(attempts,1);
  const b=await x.session.publishTurn({humanInput:'Ancora?',nonce:'c140-unknown-send-00002',priorMessages:[],resetContext:true,openScope:true});
  assert.equal(b.ok,false);assert.equal(attempts,1);
 }finally{x.done()}
});
test('C140 does not hijack original C114 self-ontology route or C139 response-generation route',async()=>{
 const x=await setup();try{
  // A direct question about iKant must never be promoted to a claimed self-introspection by C140.
  const noOpen=await x.session.publishTurn({humanInput:'Chi sei? Descrivi la tua identita.',nonce:'c140-old-route-00000001',priorMessages:[],resetContext:true});
  assert.notEqual(noOpen.original_turn?.status,'C140_ORIGINAL_C100_C87_LOCAL_READBACK');
 }finally{x.done()}
});

test('C125 refuses forged C140 original receipts before any send',()=>{
 const f=emitC125Shell({afterAccept:true,kind:'OWNER_VOICE',mode:'EDU',
  trace:'a'.repeat(64),continuity:'C87_INDEPENDENT_REOPEN',
  edge:'NATIVE_CHATGPT_PER_TURN_DISPATCH',next:'QUALIFY_NATIVE_HOOK',
  nonce:'c140-fake-receipt-00001',input_sha256:'b'.repeat(64),
  ownerReceipt:{schema:'ikant-c140-edu-v2-owner-evidence/v1',
   status:'C140_EDU_V2_C100_C87_READBACK',active:false,
   surface_a:{origin:'HOST_BOUND',voice_utf8:answer}},
  independentReadback:{status:'C107_LEDGER_REOPENED',
   last_hash:'a'.repeat(64),latest_state:{nonce:'c140-fake-receipt-00001'}}});
 assert.equal(f.status,'REJECTED');assert.equal(f.origin,'NO_VOICE');
});
test('C140 longer direct self-identity cannot borrow general route',async()=>{
 let sends=0;const x=await setup({send:async()=>{sends++}});
 try{const long='Chi sei? Descrivi la tua identita. '+'filosofia '.repeat(90);
  assert.ok(Buffer.byteLength(long,'utf8')>600);
  const r=await x.session.publishTurn({humanInput:long,nonce:'c140-long-self-00000001',
   priorMessages:[],resetContext:true,openScope:true});
  assert.equal(r.ok,false);assert.equal(r.first_edge,'C140_SELF_IDENTITY_OWNER_BOUNDED_STOP');
  assert.equal(sends,0);
 }finally{x.done()}
});
