import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {issueC72V2LinkedTermsOffer,acceptC72V2LinkedTerms,presentC72V2Introduction,
 selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {bindManagedOneShellEdu,closeOneShellOnHumanExit,IKANT_EXIT_WARNING} from '../host/project-oneshell-continuity.mjs';
const head='a'.repeat(40);
const offer=issueC72V2LinkedTermsOffer({sourceHead:head,termsDigest:createHash('sha256').update('terms').digest('hex')});
const accepted=acceptC72V2LinkedTerms({offer,humanMessage:'I ACCEPT',termsLinkPresented:true});
const orientation=presentC72V2Introduction(accepted);
const selection=selectC72V2Mode({accepted,orientation,humanMessage:'EDU'});
const f=humanInput=>({humanInput});
const owner=()=>{let closed=false,calls=0,turns=0;
 return {owner:'C135_EDU_V2',status:()=>({closed,busy:false,uncertain:false}),
  close:()=>{closed=true;calls++;},getCalls:()=>calls,getTurns:()=>turns,
  readSessionState:()=>({owner:'C135_EDU_V2',source_head:head,
   selection_receipt_sha256:selection.receipt_sha256,
   original_c87_readback:{status:'C107_LEDGER_REOPENED',count:turns}}),
  publishTurn:async()=>{turns++;return {slots:{A:'NO_VOICE'}};}};
};
test('EXIT request warns but never closes, cancel is safe, direct confirmation blocked',async()=>{
 const c=owner(),managed=bindManagedOneShellEdu({selection,sourceHead:head,originalSession:c,readMain:async()=>head});
 const a=await managed.routeHumanTurn({frame:f('EXIT IKANT'),humanMessageObserved:true});
 assert.equal(a.kind,'REQUEST_EXIT_CONFIRMATION');
 assert.equal(a.warning,"ATTENZIONE: L'INFRASTRUTTURA IKANT VERRA CHIUSA");
 assert.equal(a.warning,IKANT_EXIT_WARNING);assert.equal(c.getCalls(),0);
 assert.equal((await managed.routeHumanTurn({frame:f('ciao'),humanMessageObserved:true})).edge,'HUMAN_EXIT_CONFIRMATION_PENDING');
 assert.equal(c.getTurns(),0);
 assert.equal((await managed.routeHumanTurn({frame:f('ANNULLA EXIT IKANT'),humanMessageObserved:true})).kind,'EXIT_CANCELLED');
 assert.equal((await managed.routeHumanTurn({frame:f('CONFERMO EXIT IKANT'),humanMessageObserved:true})).edge,'EXIT_CONFIRMATION_NOT_PENDING');
 assert.equal((await closeOneShellOnHumanExit({selection,sourceHead:head,liveHead:head,
  humanInput:'CONFERMO EXIT IKANT',humanMessageObserved:true,originalSession:c})).edge,
  'TWO_DISTINCT_HUMAN_MESSAGES_REQUIRED');
 assert.equal(c.getCalls(),0);
});
test('real dedicated child worker terminated only after human confirmation',async()=>{
 const worker=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});
 assert(worker.pid!==process.pid);let exited=false;
 const supervisor={dedicated:true,terminate:async()=>{
  assert(worker.kill('SIGTERM'));await new Promise((resolve,reject)=>{
   worker.once('exit',()=>{exited=true;resolve()});worker.once('error',reject);});
 },readback:async()=>({dedicated:true,terminated:exited,verified:worker.exitCode!==null||worker.signalCode!==null})};
 const c=owner(),managed=bindManagedOneShellEdu({selection,sourceHead:head,originalSession:c,
  readMain:async()=>head,workerSupervisor:supervisor});
 assert.equal((await managed.routeHumanTurn({frame:f('EXIT IKANT'),humanMessageObserved:true})).next,
  'AWAIT_EXACT_EXIT_CONFIRMATION');
 assert.equal(c.getCalls(),0);
 const path=join(mkdtempSync(join(tmpdir(),'oneshell-exit-')),'evidence.json');
 const r=await managed.routeHumanTurn({frame:f('CONFERMO EXIT IKANT'),humanMessageObserved:true,evidenceFile:path});
 assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.shell,'HOST_CHATGPT');
 assert.equal(c.getCalls(),1);assert.equal(exited,true);
 assert.equal(JSON.parse(readFileSync(path,'utf8')).human_confirmation,'CONFERMO EXIT IKANT');
 assert.equal((await managed.routeHumanTurn({frame:f('ciao'),humanMessageObserved:true})).edge,'IKANT_ALREADY_EXITED');
 assert.equal(c.getCalls(),1);
});
test('no exclusive worker supervisor means no close, no HOST release',async()=>{
 const c=owner(),managed=bindManagedOneShellEdu({selection,sourceHead:head,originalSession:c,readMain:async()=>head});
 await managed.routeHumanTurn({frame:f('EXIT IKANT'),humanMessageObserved:true});
 const out=await managed.routeHumanTurn({frame:f('CONFERMO EXIT IKANT'),humanMessageObserved:true,
  evidenceFile:join(mkdtempSync(join(tmpdir(),'no-worker-')),'exit.json')});
 assert.equal(out.edge,'DEDICATED_WORKER_SUPERVISOR_REQUIRED');
 assert.equal(c.getCalls(),0);
});
test('SOURCE_LOCK drift blocks exit preparation',async()=>{
 const c=owner(),managed=bindManagedOneShellEdu({selection,sourceHead:head,originalSession:c,
  readMain:async()=> 'b'.repeat(40)});
 assert.equal((await managed.routeHumanTurn({frame:f('EXIT IKANT'),humanMessageObserved:true})).edge,'STOP_SOURCE_LOCK_STALE');
 assert.equal(c.getCalls(),0);
});

test('explicit Host checkup/documentation never routes C135 or writes owner ledger',async()=>{
 const c=owner(),managed=bindManagedOneShellEdu({selection,sourceHead:head,originalSession:c,readMain:async()=>head});
 const check=await managed.routeHumanTurn({frame:f('Host: checkup iKant ledger'),humanMessageObserved:true});
 assert.equal(check.kind,'HOST_CHECKUP');assert.equal(check.next,'HOST_ONLY_NO_C87');
 const doc=await managed.routeHumanTurn({frame:f('@Host documenta la PR'),humanMessageObserved:true});
 assert.equal(doc.kind,'HOST_DOCUMENTATION');
 const denied=await managed.routeHumanTurn({frame:f('Host: racconta chi sei'),humanMessageObserved:true});
 assert.equal(denied.ok,false);assert.equal(denied.edge,'HOST_SCOPE_DENIED');
 assert.equal(c.getTurns(),0);assert.equal(c.getCalls(),0);
});
