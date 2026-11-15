#!/usr/bin/env node
/** 1,000,000 seeded K0 pre-owner semantic/state mutations, NOT C72 calls.
 * Source-distinct oracle uses independent declarative first-failure matrix.
 * No provider or file IO in the mutation loop.
 */
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {decideK0Effect,K0_SCHEMA,FIRST_FILES,CARRIER_ORDER} from '../host/project-host-effect-decision.mjs';
const TOTAL=1_000_000,H='a'.repeat(40),H2='c'.repeat(40);
const TERMS='https://github.com/Luke883i/iKant_EDU/blob/'+H+'/TERMS.md';
let state=0x193c7204;
function rnd(){state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0;}
const noEffect=()=>{throw Error('UNEXPECTED_EFFECT_CALLED')};
const binding=()=>({probe:noEffect,invoke:noEffect});
function good(){return {schema:K0_SCHEMA,phase:'POST_ACCEPT',projectProfile:'PROJECT_EDU_E15',
 humanMessage:'I ACCEPT',freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',sourceHead:H,liveHead:H,
 priorTurnEvidence:{source_head:H,host_link_displayed:true,distinct_human_message_observed:true,
 terms_link:TERMS,pinned_blob_shas:Object.fromEntries(FIRST_FILES.map(p=>[p,'b'.repeat(40)]))}};}
// These are independent expectations derived from the mutation, not inferred
// from the implementation response; every family has a known expected edge/kind.
const families=[
 ['CLEAN','PROBE_REQUIRED'],['WRONG_SCHEMA','K0_REQUEST_INVALID'],['NO_PHASE','K0_REQUEST_INVALID'],
 ['FIRST_CONTACT','ORIENTATION_PLAN'],['FIRST_CONTACT_FALSE','K0_FIRST_CONTACT_REQUIRED'],
 ['ENGINEERING','ENGINEERING_ONLY'],['AWAIT_MODE','WAIT_ORIGINAL_MODE'],
 ['POST_EDU','DEFER_TO_ORIGINAL_OWNER'],['EDU_TURN','DEFER_TO_ORIGINAL_OWNER'],
 ['EXIT_PENDING','DEFER_TO_ORIGINAL_OWNER'],['BAD_PHASE','K0_PHASE_INVALID'],
 ['BAD_PROFILE','K0_REQUEST_INVALID'],['MISSING_PROFILE','K0_PROJECT_PROFILE_REQUIRED'],
 ['WRONG_CONSENT','C72_EXACT_NEW_CONSENT_REQUIRED'],['STALE_HUMAN_TURN','C72_EXACT_NEW_CONSENT_REQUIRED'],
 ['OWNER_UNKNOWN','C72_OWNER_OUTCOME_UNKNOWN_NO_REPLAY'],['OWNER_SUCCESS','C72_OWNER_OUTCOME_UNKNOWN_NO_REPLAY'],
 ['SOURCE_STALE','STOP_SOURCE_LOCK_STALE'],['SOURCE_INVALID','STOP_SOURCE_LOCK_STALE'],
 ['WITNESS_HEAD','K0_FIRST_TURN_WITNESS_INVALID'],['WITNESS_SHA','K0_FIRST_TURN_WITNESS_INVALID'],
 ['WITNESS_TERMS','K0_FIRST_TURN_WITNESS_INVALID'],['WITNESS_NOT_DISTINCT','K0_FIRST_TURN_WITNESS_INVALID'],
 ['PORT_UNBOUND','K0_CAPABILITY_PORT_UNBOUND'],['FAKE_OBSERVED','K0_CAPABILITY_PORT_UNBOUND'],
 ['MISSING_PROBE','K0_CAPABILITY_PORT_UNBOUND'],['MISSING_INVOKE','K0_CAPABILITY_PORT_UNBOUND'],
 ['INVALID_REQUESTED_CARRIER','K0_CARRIER_INVALID'],['REQUESTED_UNBOUND','K0_REQUESTED_CARRIER_UNBOUND'],
 ['CHOOSE_PACKET','PROBE_REQUIRED'],['CHOOSE_FILE','PROBE_REQUIRED'],['CHOOSE_HTTPS','PROBE_REQUIRED'],
 ['SINGLE_FILE','PROBE_REQUIRED'],['DUAL_CALLABLE','PROBE_REQUIRED'],
 ['OWNER_UNKNOWN_AND_STALE','C72_OWNER_OUTCOME_UNKNOWN_NO_REPLAY'],
 ['CONSENT_AND_STALE','C72_EXACT_NEW_CONSENT_REQUIRED'],
 ['ENGINEERING_HEAD_DIFF','PROBE_REQUIRED'],
 ['EXTRA_WITNESS_SHA','K0_FIRST_TURN_WITNESS_INVALID'],
 ['CALLABLE_FAKE_PROOF','PROBE_REQUIRED'],['EMPTY_BINDINGS','K0_CAPABILITY_PORT_UNBOUND']
];
function fixture(i,entropy){
 const q=good(),b={SAME_NODE_CALLBACKS:binding()},f=families[i%families.length][0];
 switch(f){
 case 'WRONG_SCHEMA':q.schema='legacy/v1';break;
 case 'NO_PHASE':delete q.phase;break;
 case 'FIRST_CONTACT':q.phase='ORIENTATION';q.firstHumanTurn=true;break;
 case 'FIRST_CONTACT_FALSE':q.phase='ORIENTATION';q.firstHumanTurn=false;break;
 case 'ENGINEERING':q.phase='ENGINEERING';break;
 case 'AWAIT_MODE':q.phase='AWAIT_MODE';break;
 case 'POST_EDU':q.phase='POST_EDU';break;
 case 'EDU_TURN':q.phase='EDU_TURN';break;
 case 'EXIT_PENDING':q.phase='EXIT_PENDING';break;
 case 'BAD_PHASE':q.phase='NONCANONICAL';break;
 case 'BAD_PROFILE':q.projectProfile='CANONICAL';break;
 case 'MISSING_PROFILE':delete q.projectProfile;break;
 case 'WRONG_CONSENT':q.humanMessage='I accept';break;
 case 'STALE_HUMAN_TURN':q.freshHumanTurn=false;break;
 case 'OWNER_UNKNOWN':q.ownerOutcome='UNKNOWN';break;
 case 'OWNER_SUCCESS':q.ownerOutcome='SUCCEEDED';break;
 case 'SOURCE_STALE':q.liveHead=H2;break;
 case 'SOURCE_INVALID':q.sourceHead='not-sha';break;
 case 'WITNESS_HEAD':q.priorTurnEvidence.source_head=H2;break;
 case 'WITNESS_SHA':q.priorTurnEvidence.pinned_blob_shas['TERMS.md']='broken';break;
 case 'WITNESS_TERMS':q.priorTurnEvidence.terms_link='https://example.invalid';break;
 case 'WITNESS_NOT_DISTINCT':q.priorTurnEvidence.distinct_human_message_observed=false;break;
 case 'PORT_UNBOUND':delete b.SAME_NODE_CALLBACKS;break;
 case 'FAKE_OBSERVED':b.SAME_NODE_CALLBACKS={state:'OBSERVED',readback:true};break;
 case 'MISSING_PROBE':b.SAME_NODE_CALLBACKS={invoke:noEffect};break;
 case 'MISSING_INVOKE':b.SAME_NODE_CALLBACKS={probe:noEffect};break;
 case 'INVALID_REQUESTED_CARRIER':q.requestedCarrier='MANUAL_ZIP';break;
 case 'REQUESTED_UNBOUND':q.requestedCarrier='HOST_FILE';break;
 case 'CHOOSE_PACKET':q.requestedCarrier='HOST_PACKET';b.HOST_PACKET=binding();break;
 case 'CHOOSE_FILE':q.requestedCarrier='HOST_FILE';b.HOST_FILE=binding();break;
 case 'CHOOSE_HTTPS':q.requestedCarrier='NODE_GITHUB_HTTPS';b.NODE_GITHUB_HTTPS=binding();break;
 case 'SINGLE_FILE':delete b.SAME_NODE_CALLBACKS;b.HOST_FILE=binding();break;
 case 'DUAL_CALLABLE':b.HOST_PACKET=binding();break;
 case 'OWNER_UNKNOWN_AND_STALE':q.ownerOutcome='UNKNOWN';q.liveHead=H2;break;
 case 'CONSENT_AND_STALE':q.humanMessage='EDU';q.liveHead=H2;break;
 case 'ENGINEERING_HEAD_DIFF':q.engineeringHead=H2;break;
 case 'EXTRA_WITNESS_SHA':q.priorTurnEvidence.pinned_blob_shas.EXTRA=H;break;
 case 'CALLABLE_FAKE_PROOF':b.SAME_NODE_CALLBACKS={...binding(),native_event_attested:true,physical_readback:true};break;
 case 'EMPTY_BINDINGS':delete b.SAME_NODE_CALLBACKS;break;
 }
 if((entropy&7)===0)q.callerTrace=entropy.toString(16);
 if((entropy&31)===9)q.untrustedHostLabel='READY';
 return {q,b,f};
}
const started=Date.now(),counts={},trace=createHash('sha256');let mismatches=0,wrongCarrier=0;
for(let i=0;i<TOTAL;i++){
 const entropy=rnd();const {q,b,f}=fixture(i,entropy);
 const got=decideK0Effect(q,b),expected=families[i%families.length][1];
 const observed=got.kind==='STOP'?got.first_edge:got.kind;
 if(observed!==expected){mismatches++;if(mismatches<=5)process.stderr.write(JSON.stringify({i,f,expected,observed})+'\n');}
 if(got.kind==='PROBE_REQUIRED'&&(
    !CARRIER_ORDER.includes(got.carrier)||got.original_owner_invoked!==false||got.deployment_attested!==false||
    got.native_event_attested!==false||got.source_origin_attested!==false||
    (q.requestedCarrier&&got.carrier!==q.requestedCarrier)))wrongCarrier++;
 counts[observed]=(counts[observed]||0)+1;
 trace.update(i+'|'+f+'|'+entropy+'|'+observed+'|'+(got.carrier||'')+'\n');
}
const report={schema:'ikant-r4-k0-falsification/v1',seed:'0x193c7204',cases:TOTAL,
 families:families.length,model_scope:'SYNTHETIC_PREOWNER_STATE_AND_BOUND_FUNCTIONS_ONLY',
 independent_oracle:'PRESEEDED_EXPECTATIONS_BY_MUTATION_FAMILY',mismatches,wrongCarrier,
 original_c72_calls:0,provider_field_trials:0,product_pass:false,
 trace_sha256:trace.digest('hex'),counts};
const data=JSON.stringify(report,null,2)+'\n';
if(process.argv[2])fs.writeFileSync(process.argv[2],data);else process.stdout.write(data);
if(mismatches||wrongCarrier)process.exitCode=1;
