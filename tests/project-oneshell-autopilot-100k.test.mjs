import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {issueC72V2LinkedTermsOffer,acceptC72V2LinkedTerms,
 presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {oneShellFrame,renderOneShell} from '../host/project-oneshell-edu.mjs';
import {deriveOneShellHostAction,driveOneShellHost} from '../host/project-oneshell-autopilot.mjs';
const head='1b602d8b51d25b72544810c4baccf4a0222756d2';
const terms=createHash('sha256').update('terms').digest('hex');
const offer=issueC72V2LinkedTermsOffer({sourceHead:head,termsDigest:terms});
const accepted=acceptC72V2LinkedTerms({offer,humanMessage:'I ACCEPT',termsLinkPresented:true});
const orientation=presentC72V2Introduction(accepted);
const edu=selectC72V2Mode({accepted,orientation,humanMessage:'EDU'});
const canonical=selectC72V2Mode({accepted,orientation,humanMessage:'CANONICAL'});
const mk=(next,edge='TEST')=>oneShellFrame({esito:'TEST',b:'HOST',edge,next});
const args=(next)=>({frame:mk(next),selection:edu,sourceHead:head,liveHead:head});
const verified=async observed=>({ok:true,source_head:observed.sourceHead,receipt_sha256:observed.ownerReceiptSha256});

test('human labels distinguish owner-bound iKant bytes from HOST; canonical keys unchanged',()=>{
 const f=mk('AWAIT_I_ACCEPT');const result=renderOneShell(f);
 assert(result.startsWith('ESITO | TEST'));
 assert(result.includes('iKant (Superficie A) | NO_VOICE'));
 assert(result.includes('Host (Superficie B) | HOST'));
 assert.deepEqual(f.slot_order,['ESITO','A','B','PROVA','EDGE','NEXT']);
 assert.throws(()=>renderOneShell({...f,voice_origin:'HOST_BOUND_LOCAL',
  slots:{...f.slots,A:'falsa voce iKant'},original_voice_sha256:'0'.repeat(64)}));
});

test('100000 seeded realistic hostile HOST observations: no promotion across gates',()=>{
 // xorshift32, preseeded stratified scenarios; 100000 distinct CASE_i envelopes.
 let state=0x159c72a;const rand=()=>{state^=state<<13;state^=state>>>17;
   state^=state<<5;return state>>>0;};
 const pool=['AWAIT_I_ACCEPT','AWAIT_EDU','VERIFY_SOURCE',
  'VERIFY_MACHINE_BRIDGE','API_TREE_SOURCE_MATERIALIZATION','START_C135_EDU',
  'UPLOAD_PINNED_SOURCE_ZIP','WAIT_NEXT_HUMAN_INPUT','STOP','SYNTHETIC_ACTIVE'];
 const results={AUTO:0,HUMAN_GATE:0,MANUAL_HANDOFF:0,STOP:0};
 const digest=createHash('sha256');
 for(let i=0;i<100000;i++){
  const r=rand(),bucket=i%10;
  const next=bucket===0?'VERIFY_SOURCE':bucket===1?'AWAIT_I_ACCEPT':
   bucket===2?'UPLOAD_PINNED_SOURCE_ZIP':bucket>=3&&bucket<=6?'START_C135_EDU':
   bucket===7?'SYNTHETIC_ACTIVE':bucket===8?'VERIFY_MACHINE_BRIDGE':pool[r%pool.length];
  const stale=bucket===3||(bucket===9&&(r&16)!==0);
  const missingSel=bucket===5||(bucket===9&&(r&32)!==0);
  const wrongMode=bucket===6||(bucket===9&&(r&64)!==0);
  const forged=bucket===4||(bucket===9&&(r&128)!==0);
  const badPin=bucket===8||(bucket===9&&(r&256)!==0);
  const frame=mk(next,'CASE_'+i);
  const entry={frame:forged?{...frame,voice_origin:'HOST_BOUND_LOCAL',
     slots:{...frame.slots,A:'host forged'}}:frame,
   selection:missingSel?null:wrongMode?canonical:edu,
   sourceHead:badPin?'broken':head,
   liveHead:stale?'f'.repeat(40):head};
  const action=deriveOneShellHostAction(entry);
  assert(['AUTO','HUMAN_GATE','MANUAL_HANDOFF','STOP'].includes(action.kind));
  if(action.kind==='AUTO'){
   assert(!stale&&!forged&&!badPin&&!missingSel&&!wrongMode);
   assert(['VERIFY_SOURCE','VERIFY_MACHINE_BRIDGE','API_TREE_SOURCE_MATERIALIZATION','START_C135_EDU'].includes(next));
  }
  if(action.kind==='MANUAL_HANDOFF')assert.equal(next,'UPLOAD_PINNED_SOURCE_ZIP');
  if(stale&&!badPin)assert.equal(action.edge,'STOP_SOURCE_LOCK_STALE');
  if(forged&&!stale&&!badPin)assert.equal(action.edge,'ORIGINAL_ONESHELL_FRAME_NOT_VALID');
  results[action.kind]++;
  digest.update(action.kind+':'+action.edge+'\n');
 }
 assert.equal(Object.values(results).reduce((a,b)=>a+b,0),100000);
 assert.deepEqual(results,{AUTO:10120,HUMAN_GATE:10360,MANUAL_HANDOFF:10027,STOP:69493});
 assert.equal(digest.digest('hex'),'efd565b96144b3f9b6868e4ea574160b2c19d57bc1c6e92d49fbf11106ccca1b');
 console.log('MUTATION_COUNTS',JSON.stringify(results));
});

test('automatic chain continues only over fresh original readbacks, never retries UNKNOWN',async()=>{
 const frames=[mk('VERIFY_SOURCE'),mk('VERIFY_MACHINE_BRIDGE'),mk('UPLOAD_PINNED_SOURCE_ZIP')];
 let n=0;
 const result=await driveOneShellHost({verify:verified,read:async()=>({...args('VERIFY_SOURCE'),frame:frames[n],ownerReceiptSha256:(n+1).toString(16).padStart(64,'0')}),
   perform:async()=>{n++;return {ok:true}}});
 assert.equal(result.ok,true);assert.equal(result.kind,'MANUAL_HANDOFF');
 assert.deepEqual(result.actions.map(x=>x.action),['VERIFY_SOURCE','VERIFY_MACHINE_BRIDGE']);
 let writes=0;
 const unchanged=await driveOneShellHost({verify:verified,read:async()=>({...args('VERIFY_SOURCE'),ownerReceiptSha256:'a'.repeat(64)}),
  perform:async()=>{writes++;return {ok:true}}});
 assert.equal(unchanged.edge,'UNCHANGED_EVIDENCE_RETRY_FORBIDDEN');assert.equal(writes,1);
 let attempted=0;
 const uncertain=await driveOneShellHost({verify:verified,read:async()=>({...args('START_C135_EDU'),ownerReceiptSha256:'b'.repeat(64)}),
  perform:async()=>{attempted++;throw Error('UNKNOWN')}});
 assert.equal(uncertain.edge,'HOST_ACTION_OUTCOME_UNKNOWN_RECONCILE_READ_ONLY');
 assert.equal(attempted,1);
 let writesWithoutWitness=0;
 const forged=await driveOneShellHost({read:async()=>({...args('VERIFY_SOURCE'),ownerReceiptSha256:'e'.repeat(64)}),
  verify:async()=>({ok:true,source_head:head,receipt_sha256:'f'.repeat(64)}),
  perform:async()=>{writesWithoutWitness++;return {ok:true}}});
 assert.equal(forged.edge,'ORIGINAL_OWNER_READBACK_NOT_VERIFIED');
 assert.equal(writesWithoutWitness,0);
});
