import test from 'node:test';
import assert from 'node:assert/strict';
import {decideK0Effect,k0SafePlan,FIRST_FILES,CARRIER_ORDER,K0_SCHEMA} from '../host/project-host-effect-decision.mjs';
const H='a'.repeat(40);
const witness={source_head:H,host_link_displayed:true,distinct_human_message_observed:true,
 terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+H+'/TERMS.md',
 pinned_blob_shas:Object.fromEntries(FIRST_FILES.map(p=>[p,'b'.repeat(40)]))};
const base=()=>({schema:K0_SCHEMA,phase:'POST_ACCEPT',projectProfile:'PROJECT_EDU_E15',humanMessage:'I ACCEPT',
 freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',sourceHead:H,liveHead:H,priorTurnEvidence:witness});
const binding=()=>({probe:()=>{},invoke:()=>{throw Error('MUST_NOT_EXECUTE')}});
test('orientation reads exactly the first five without extra or owner',()=>{
 const x=decideK0Effect({schema:K0_SCHEMA,phase:'ORIENTATION',firstHumanTurn:true});
 assert.equal(x.kind,'ORIENTATION_PLAN');assert.deepEqual(x.ordered_paths,FIRST_FILES);assert.equal(x.preaccept_tree_allowed,false);
});
test('unbound / advertised flags cannot authorize owner',()=>{
 assert.equal(decideK0Effect(base()).first_edge,'K0_CAPABILITY_PORT_UNBOUND');
 assert.equal(decideK0Effect(base(),{HOST_PACKET:{OBSERVED:true,probeOK:true}}).kind,'STOP');
});
test('retired LE terms witness never authorizes a K0 probe',()=>{
 const stale={...base(),priorTurnEvidence:{...witness,
  terms_link:'https://github.com/Luke883i/iKant_LE/blob/'+H+'/TERMS.md'}};
 assert.equal(decideK0Effect(stale,{HOST_PACKET:binding()}).first_edge,'K0_FIRST_TURN_WITNESS_INVALID');
});
test('callable ports yield PROBE_REQUIRED, never owner execution',()=>{
 const x=decideK0Effect(base(),{HOST_PACKET:binding(),SAME_NODE_CALLBACKS:binding()});
 assert.equal(x.kind,'PROBE_REQUIRED');assert.equal(x.carrier,CARRIER_ORDER[0]);assert.equal(x.original_owner_invoked,false);
 assert.equal(x.deployment_attested,false);assert.equal(x.source_origin_attested,false);
});
test('explicit carrier wins only when callable',()=>{
 const x=decideK0Effect({...base(),requestedCarrier:'HOST_PACKET'},
  {HOST_PACKET:binding(),SAME_NODE_CALLBACKS:binding()});
 assert.equal(x.carrier,'HOST_PACKET');assert.match(x.route,/E16|e16/);
 assert.equal(decideK0Effect({...base(),requestedCarrier:'HOST_FILE'},{HOST_PACKET:binding()}).first_edge,'K0_REQUESTED_CARRIER_UNBOUND');
});
test('stale, owner unknown, consent, witness and profile stop in order',()=>{
 assert.equal(decideK0Effect({...base(),liveHead:'c'.repeat(40)},{HOST_PACKET:binding()}).first_edge,'STOP_SOURCE_LOCK_STALE');
 assert.equal(decideK0Effect({...base(),ownerOutcome:'UNKNOWN'},{HOST_PACKET:binding()}).first_edge,'C72_OWNER_OUTCOME_UNKNOWN_NO_REPLAY');
 assert.equal(decideK0Effect({...base(),humanMessage:'EDU'},{HOST_PACKET:binding()}).first_edge,'C72_EXACT_NEW_CONSENT_REQUIRED');
 assert.equal(decideK0Effect({...base(),priorTurnEvidence:{...witness,pinned_blob_shas:{}}},{HOST_PACKET:binding()}).first_edge,'K0_FIRST_TURN_WITNESS_INVALID');
 assert.equal(decideK0Effect({...base(),projectProfile:'CANONICAL'},{HOST_PACKET:binding()}).first_edge,'K0_REQUEST_INVALID');
});
test('frozen objects and getters fail closed and never execute',()=>{
 const q=base(),v=Object.defineProperty({},'HOST_PACKET',{get(){throw Error('getter')}});
 assert.equal(k0SafePlan(q,v).kind,'STOP');
 assert.equal(k0SafePlan(q,new Proxy({},{})).kind,'STOP');
});
test('mode and engineering are outside K0 runtime owner',()=>{
 for(const phase of ['ENGINEERING','AWAIT_MODE','POST_EDU','EDU_TURN','EXIT_PENDING']){
  assert.notEqual(decideK0Effect({schema:K0_SCHEMA,phase}).kind,'PROBE_REQUIRED');
 }
});
