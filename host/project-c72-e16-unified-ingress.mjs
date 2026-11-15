/**
 * Project EDU E16 Host ingress: one policy/effect boundary, authority zero.
 * Converts observed Host packet or private files into exactly ONE invocation
 * of the EXISTING C72 cold seed. This is not an owner, issuer, provider hook,
 * source downloader, writer, admission receipt, or retry facility.
 *
 * Five-document callbacks and Node HTTPS are legacy carriers. They may be
 * used upstream to construct an authenticated eight-file packet; they are NOT
 * admitted directly as an E16 coldstart. An unbound adapter is never called.
 */
import path from 'node:path';
import {isProxy} from 'node:util/types';
import {chooseC72HostTransport} from './project-c72-transport-frontier.mjs';
import {screenC72HostIngress} from './project-c72-negative-entry.mjs';
import {admitE15TransportEnvelope,E15_PROFILE} from './project-oneshell-irred-e15.mjs';
import {executeC72Coldstart,C72_COLDSTART_FILES} from './project-c72-coldstart-seed.mjs';

export const E16_INGRESS_SCHEMA='ikant-host-c72-e16-unified-ingress/v1';
const SHA=/^[a-f0-9]{40}$/u;
const STATES=new Set(['OBSERVED','CALLABLE_UNTESTED','UNAVAILABLE_VERIFIED','UNKNOWN']);
const CARRIERS=Object.freeze(['CALLBACKS','NODE_HTTPS','HOST_PACKET','HOST_FILE']);
const plain=x=>{try{return x!==null&&typeof x==='object'&&!Array.isArray(x)&&!isProxy(x)&&
 Object.getPrototypeOf(x)===Object.prototype&&Reflect.ownKeys(x).every(k=>typeof k==='string'&&
 Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));}catch{return false;}};
const stopped=edge=>Object.freeze({ok:false,kind:'STOP',edge,authority:0,active:false,
 voice:'NO_VOICE',original_owner_invoked:false,native_event_attested:false,
 native_delivery_attested:false});
const probe=(edge,carrier)=>Object.freeze({...stopped(edge),kind:'PROBE',carrier});
const wrapped=(decision,physical)=>Object.freeze({ok:true,kind:'READY',carrier:decision.carrier,
 physical,authority:0,active:false,original_owner_invoked:false,
 native_event_attested:false,native_delivery_attested:false});

/** Side-effect-free, deterministic eligibility and policy evaluation.
 * No string flag, boolean, digest or unverified network status becomes a receipt.
 * Old 5-file ingress is deliberately excluded from the E16 effect path.
 */
export function planC72ProjectE16Ingress(q={}){
 if(!plain(q)||!plain(q.carriers)||!plain(q.priorTurnEvidence)||
    !plain(q.priorTurnEvidence.pinned_blob_shas))return stopped('E16_HOST_INPUT_UNTRUSTED');
 if(q.schema!==E16_INGRESS_SCHEMA||q.phase!=='POST_ACCEPT'||q.projectProfile!==E15_PROFILE)
  return stopped('E16_PROJECT_PROFILE_REQUIRED');
 if(CARRIERS.some(k=>!STATES.has(q.carriers[k])))return stopped('E16_CARRIER_STATE_INVALID');
 if(q.humanMessage!=='I ACCEPT'||q.freshHumanTurn!==true)
  return stopped('C72_EXACT_NEW_CONSENT_REQUIRED');
 if(q.ownerOutcome!=='NOT_INVOKED')return stopped('C72_OWNER_OUTCOME_UNKNOWN_NO_REPLAY');
 if(!SHA.test(q.sourceHead||'')||q.liveHead!==q.sourceHead)
  return stopped('STOP_SOURCE_LOCK_STALE');
 if(q.node!=='AVAILABLE')return stopped('C72_NODE_NOT_ATTESTED');
 if(q.githubApi!=='AVAILABLE')return stopped('E16_GITHUB_SOURCE_NOT_OBSERVED');
 const packet=Array.isArray(q.sourcePacket)&&!isProxy(q.sourcePacket)&&
   q.sourcePacket.length===C72_COLDSTART_FILES.length;
 const file=typeof q.stageDirectory==='string'&&path.isAbsolute(q.stageDirectory)&&
   path.normalize(q.stageDirectory)===q.stageDirectory;
 // Preserve UNKNOWN: never rewrite unavailable/untested as VERIFIED ABSENT.
 const eligible={CALLBACKS:'UNKNOWN',NODE_HTTPS:'UNKNOWN',
  HOST_PACKET:q.carriers.HOST_PACKET==='OBSERVED'&&packet?'OBSERVED':
    q.carriers.HOST_PACKET==='CALLABLE_UNTESTED'?'CALLABLE_UNTESTED':'UNKNOWN',
  HOST_FILE:q.carriers.HOST_FILE==='OBSERVED'&&file?'OBSERVED':
    q.carriers.HOST_FILE==='CALLABLE_UNTESTED'?'CALLABLE_UNTESTED':'UNKNOWN'};
 const decision=chooseC72HostTransport({phase:'POST_ACCEPT',humanMessage:'I ACCEPT',
  freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',sourceHead:q.sourceHead,liveHead:q.liveHead,
  firstTurnWitnessVerified:true,node:q.node,githubApi:q.githubApi,carriers:eligible});
 if(decision.kind==='STOP'){
  if(q.carriers.CALLBACKS==='OBSERVED'||q.carriers.NODE_HTTPS==='OBSERVED'||
     (q.carriers.HOST_PACKET==='OBSERVED'&&!packet)||
     (q.carriers.HOST_FILE==='OBSERVED'&&!file))
   return stopped('E16_CARRIER_NORMALIZATION_REQUIRED');
  return stopped(decision.edge);
 }
 if(decision.kind==='PROBE')return probe('E16_PHYSICAL_CARRIER_NOT_YET_OBSERVED',decision.carrier);
 const guarded=screenC72HostIngress({humanMessage:q.humanMessage,freshHumanTurn:q.freshHumanTurn,
  ownerOutcome:q.ownerOutcome,priorTurnEvidence:q.priorTurnEvidence,
  // R3 validates the common owner admission gate; file is an 8-byte-set carrier.
  carrier:'HOST_SOURCE_PACKET',networkObservation:q.networkObservation});
 if(guarded.disposition!=='PASS_TO_ORIGINAL_CHECK')return stopped(guarded.first_edge);
 if(q.priorTurnEvidence.source_head!==q.sourceHead)return stopped('C72_FIRST_TURN_HEAD_MISMATCH');
 return wrapped(decision,decision.carrier==='HOST_PACKET'?'sourcePacket':'stageDirectory');
}

/** Single physical call, no fallback or retry after invoking the seed.
 * The seed alone verifies 8 blobs, BOOTSTRAP's first-turn E16 pin, private
 * source pin, original C72 receipts and intro, and records attempts.
 * There is deliberately no dependency-injection surface for an alternative issuer.
 */
export async function runC72ProjectE16Ingress(q={}){
 const plan=planC72ProjectE16Ingress(q);
 if(plan.kind!=='READY')return plan;
 let envelope;
 try{envelope=admitE15TransportEnvelope({projectProfile:q.projectProfile,
  transitDirectory:q.transitDirectory,transitSourcePacket:q.transitSourcePacket,
  transitBlobSha1:q.transitBlobSha1});}
 catch{return stopped('E16_TRANSPORT_ENVELOPE_UNTRUSTED');}
 if(!envelope.ok)return stopped(envelope.edge);
 if(!plain(q.expectedBlobShas)||C72_COLDSTART_FILES.some(p=>!SHA.test(q.expectedBlobShas[p]||''))||
    !SHA.test(q.seedBlobSha1||''))return stopped('E16_PINNED_COLD_SEED_INPUT_REQUIRED');
 const carrier=plan.carrier==='HOST_PACKET'?{sourcePacket:q.sourcePacket}:
  {stageDirectory:q.stageDirectory};
 const request={schema:'ikant-host-c72-coldstart/v1',humanMessage:'I ACCEPT',
  freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',liveHead:q.liveHead,
  priorTurnEvidence:q.priorTurnEvidence,expectedBlobShas:q.expectedBlobShas,
  seedBlobSha1:q.seedBlobSha1,projectProfile:E15_PROFILE,
  transitDirectory:q.transitDirectory,transitBlobSha1:q.transitBlobSha1,
  transitSourcePacket:q.transitSourcePacket,...carrier};
 // No other producer or issuer: original cold seed is the only real effect.
 let result;
 try{result=await executeC72Coldstart(request);}catch{return stopped('C72_OWNER_OUTCOME_UNKNOWN_NO_RETRY');}
 if(!plain(result)||result.ok!==true||result.original_owner_invoked!==true){
  return Object.freeze({...stopped(result?.edge||'E16_ORIGINAL_COLD_SEED_STOP'),
   original_owner_invoked:result?.original_owner_invoked===true});
 }
 // Preserve the original receipt objects byte-for-byte; do not synthesize A.
 return Object.freeze({ok:true,kind:'ORIGINAL_C72_RESULT',carrier:plan.carrier,
  original:result,accepted:result.accepted,introduction:result.introduction,
  original_owner_invoked:true,authority:0,active:false,native_event_attested:false,
  native_delivery_attested:false});
}
