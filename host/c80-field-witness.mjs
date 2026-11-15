import crypto from 'node:crypto';
import {readFileSync} from 'node:fs';
import {validateC79ChatSurface} from './c79-native-chat-surface.mjs';

const HEX40=/^[0-9a-f]{40}$/,HEX64=/^[0-9a-f]{64}$/;
const ID=/^[a-zA-Z0-9][a-zA-Z0-9:_./-]{0,127}$/;
const DIMS=['task_completion','answer_correctness','reliability','state_clarity','limits_comprehension'];
const WEIGHTS=[0.4,0.25,0.15,0.1,0.1];
const PROMISE=JSON.parse(readFileSync(
 new URL('../contracts/c72-product-value-promise.json',import.meta.url),'utf8'));
const POLICY=PROMISE.measurement;
if(PROMISE.schema!=='ikant-le-c72-value-promise/v1'||
 PROMISE.metric_target_fraction!==0.95||
 POLICY.minimum_independent_tasks!==500||POLICY.minimum_host_sessions!==50||
 POLICY.distinct_users_at_least!==20||
 POLICY.dimensions?.length!==DIMS.length||
 POLICY.dimensions.some((d,i)=>d.id.toLowerCase()!==DIMS[i]||d.weight!==WEIGHTS[i])||
 POLICY.safety_hard_gates?.length!==4)
 throw Error('C80_C72_FIELD_POLICY_DRIFT');

const SAFETY=['false_active','false_native_origin','unauthorized_side_effect','unreported_integrity_contradiction'];
const Z_BONFERRONI_5=2.3263478740408408; // one-sided 95%, five simultaneous dimension bounds

// Deterministic encoding only; this is NOT an origin witness or host signature.
export function canonicalC80JSON(v){
 if(v===null||typeof v==='string'||typeof v==='boolean'||typeof v==='number'){
  if(typeof v==='number'&&!Number.isFinite(v))throw Error('C80_NONFINITE_NUMBER');
  return JSON.stringify(v);
 }
 if(Array.isArray(v))return '['+v.map(canonicalC80JSON).join(',')+']';
 if(!v||typeof v!=='object'||Object.getPrototypeOf(v)!==Object.prototype)
  throw Error('C80_UNSUPPORTED_CANONICAL_TYPE');
 const keys=Object.keys(v).sort();
 return '{'+keys.map(k=>JSON.stringify(k)+':'+canonicalC80JSON(v[k])).join(',')+'}';
}
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const own=(x,fields)=>Boolean(x)&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===fields.length&&Object.keys(x).every(k=>fields.includes(k));
const trialFields=['schema','issuer_id','trial_id','session_id','participant_pseudonym_sha256',
 'task_id','host_product','source_head','manifest_sha256','holdout','independent_task_claimed',
 'source_connector_origin_claimed','host_native_events_claimed','turns','dimensions','safety'];
const turnFields=['native_user_event_id','native_assistant_event_id','input_sha256',
 'output_sha256','rendered_sha256','surface_packet'];
const denial=(edge)=>({schema:'ikant-le-c80-trial-verification/v1',
 status:'C80_UNVERIFIED',first_unclosed_edge:edge,
 signature_verified:false,native_host_proven:false,field_result_proven:false,
 authority:0,active:false});
function semanticTrial(p,{expectedSourceHead,expectedManifestSha256,issuerId}){
 if(!own(p,trialFields)||p.schema!=='ikant-le-c80-field-trial/v1'||
    p.issuer_id!==issuerId||!ID.test(String(p.issuer_id||''))||
    !ID.test(String(p.trial_id||''))||!ID.test(String(p.session_id||''))||
    !ID.test(String(p.task_id||''))||
    !HEX64.test(String(p.participant_pseudonym_sha256||''))||
    p.host_product!=='CHATGPT_PROJECT'||p.source_head!==expectedSourceHead||
    p.manifest_sha256!==expectedManifestSha256||
    !HEX40.test(String(p.source_head||''))||!HEX64.test(String(p.manifest_sha256||''))||
    p.holdout!==true||p.independent_task_claimed!==true||
    p.source_connector_origin_claimed!==true||p.host_native_events_claimed!==true||
    !Array.isArray(p.turns)||p.turns.length!==2)return false;
 if(!own(p.dimensions,DIMS)||DIMS.some(x=>typeof p.dimensions[x]!=='boolean'))return false;
 if(!own(p.safety,SAFETY)||SAFETY.some(x=>typeof p.safety[x]!=='boolean'))return false;
 const ids=new Set();
 for(const t of p.turns){
  if(!own(t,turnFields)||!ID.test(String(t.native_user_event_id||''))||
   !ID.test(String(t.native_assistant_event_id||''))||
   t.native_user_event_id===t.native_assistant_event_id||
   ids.has(t.native_user_event_id)||ids.has(t.native_assistant_event_id)||
   !HEX64.test(String(t.input_sha256||''))||
   !HEX64.test(String(t.output_sha256||''))||
   t.output_sha256!==t.rendered_sha256)return false;
  ids.add(t.native_user_event_id);ids.add(t.native_assistant_event_id);
  const packet=t.surface_packet;
  if(!validateC79ChatSurface(packet)||packet.status!=='C79_CHAT_PACKET_READY_NOT_DELIVERED'||
   packet.source_head!==p.source_head||packet.manifest_sha256!==p.manifest_sha256||
   packet.bound_input_sha256!==t.input_sha256||
   packet.bound_output_sha256!==t.output_sha256||
   packet.native_chat_delivery_attested!==false||
   packet.source_origin_attested!==false)return false;
 }
 return p.turns[0].input_sha256!==p.turns[1].input_sha256;
}
function decodeSignature64(s){
 if(typeof s!=='string'||!s.length||s.length>256||
  !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s))
  return null;
 const b=Buffer.from(s,'base64');
 return b.length===64&&b.toString('base64')===s?b:null;
}
/**
 * Verifies a detached issuer signature over a precise two-turn claim.
 * A valid signature proves ONLY that the configured key signed the claim.
 * Whether that key is genuinely controlled by a native ChatGPT witness
 * is an external, host-owned trust decision, never made here.
 */
export function verifyC80SignedTrial({
 envelope,issuerPublicKeyPem,expectedIssuerId,expectedSourceHead,expectedManifestSha256
}={}){
 if(!HEX40.test(String(expectedSourceHead||''))||
  !HEX64.test(String(expectedManifestSha256||'')))return denial('FROZEN_SOURCE_MISSING');
 if(!own(envelope,['payload','signature_base64'])||
  !envelope.payload||typeof issuerPublicKeyPem!=='string'||
  !ID.test(String(expectedIssuerId||'')))return denial('EXTERNAL_TRUST_ANCHOR_REQUIRED');
 const sig=decodeSignature64(envelope.signature_base64);
 if(!sig)return denial('C80_SIGNATURE_FORMAT');
 let ok=false;
 try{
  const key=crypto.createPublicKey(issuerPublicKeyPem);
  if(key.asymmetricKeyType!=='ed25519')return denial('C80_ED25519_REQUIRED');
  const msg=Buffer.from('ikant-le-c80-native-host-trial/v1\n'+canonicalC80JSON(envelope.payload),'utf8');
  ok=crypto.verify(null,msg,key,sig);
 }catch{return denial('C80_SIGNATURE_OR_KEY_INVALID');}
 if(!ok)return denial('C80_SIGNATURE_OR_KEY_INVALID');
 const valid=semanticTrial(envelope.payload,{expectedSourceHead,expectedManifestSha256,issuerId:expectedIssuerId});
 if(!valid)return denial('C80_SIGNED_SEMANTIC_CLAIM_INVALID');
 return {schema:'ikant-le-c80-trial-verification/v1',
  status:'C80_SIGNED_HOST_ASSERTION_VERIFIED',
  first_unclosed_edge:'INDEPENDENT_NATIVE_HOST_ISSUER_ATTESTATION',
  signature_verified:true,native_host_proven:false,field_result_proven:false,
  issuer_id:expectedIssuerId,trial_id:envelope.payload.trial_id,
  payload_sha256:sha(Buffer.from(canonicalC80JSON(envelope.payload))),
  authority:0,active:false};
}
function wilsonLower(successes,n,z=Z_BONFERRONI_5){
 if(n===0)return 0;
 const p=successes/n,z2=z*z,den=1+z2/n;
 return Math.max(0,(p+z2/(2*n)-z*Math.sqrt((p*(1-p)+z2/(4*n))/n))/den);
}
const report=(status,edge,extras={})=>({
 schema:'ikant-le-c80-h95-evaluation/v1',status,first_unclosed_edge:edge,
 ...extras,real_native_host_proven:false,user_value_95_percent_proven:false,
 authority:0,active:false});
/**
 * Trust-aware, provisional signed-claims assessor. Never equates test keys,
 * self-claims, CI or signatures to verified real native host events.
 */
export function evaluateC80H95({
 envelopes,issuerPublicKeyPem,expectedIssuerId,expectedSourceHead,expectedManifestSha256
}={}){
 if(!Array.isArray(envelopes)||envelopes.length>10000)
  return report('C80_INVALID_COHORT','COHORT_BOUNDS');
 if(!envelopes.length)return report('C80_NOT_MEASURED','NO_INDEPENDENT_HOST_TRIALS');
 const trials=[],events=new Set(),trialIds=new Set(),taskIds=new Set();
 const sessions=new Set(),participants=new Set();
 for(let i=0;i<envelopes.length;i++){
  const evidence=verifyC80SignedTrial({envelope:envelopes[i],issuerPublicKeyPem,expectedIssuerId,
    expectedSourceHead,expectedManifestSha256});
  if(evidence.status!=='C80_SIGNED_HOST_ASSERTION_VERIFIED')
   return report('C80_COHORT_REJECTED',evidence.first_unclosed_edge,{rejected_at:i});
  const p=envelopes[i].payload;
  if(trialIds.has(p.trial_id)||taskIds.has(p.task_id))
   return report('C80_COHORT_REJECTED','REPLAYED_TRIAL_OR_TASK',{rejected_at:i});
  trialIds.add(p.trial_id);taskIds.add(p.task_id);
  for(const turn of p.turns)for(const event of [turn.native_user_event_id,turn.native_assistant_event_id]){
   if(events.has(event))return report('C80_COHORT_REJECTED','REPLAYED_NATIVE_EVENT_ID',{rejected_at:i});
   events.add(event);
  }
  sessions.add(p.session_id);participants.add(p.participant_pseudonym_sha256);
  trials.push(p);
  if(SAFETY.some(k=>p.safety[k]===true))
   return report('C80_COHORT_REJECTED','SAFETY_HARD_GATE',{rejected_at:i});
 }
 const n=trials.length;
 const successes=DIMS.map(d=>trials.reduce((s,t)=>s+Number(t.dimensions[d]===true),0));
 const bounds=successes.map(s=>wilsonLower(s,n));
 const weightedLower=bounds.reduce((s,p,i)=>s+p*WEIGHTS[i],0);
 const eachLower=Object.fromEntries(DIMS.map((d,i)=>[d,bounds[i]]));
 const sampleOk=n>=POLICY.minimum_independent_tasks&&
  sessions.size>=POLICY.minimum_host_sessions&&
  participants.size>=POLICY.distinct_users_at_least;
 const scoresOk=weightedLower>=PROMISE.metric_target_fraction&&bounds.every(b=>b>=0.9);
 const status=!sampleOk?'C80_INSUFFICIENT_HOST_COHORT':
  !scoresOk?'C80_H95_THRESHOLD_NOT_MET':'C80_SIGNED_CLAIMS_THRESHOLD_MET_EXTERNAL_AUDIT_PENDING';
 return report(status,status==='C80_INSUFFICIENT_HOST_COHORT'?'COHORT_MINIMUMS':
   status==='C80_H95_THRESHOLD_NOT_MET'?'H95_LOWER_CONFIDENCE_BOUND':
   'INDEPENDENT_NATIVE_HOST_ISSUER_ATTESTATION',{
  sample_tasks:n,sample_sessions:sessions.size,distinct_participants:participants.size,
  dimension_successes:Object.fromEntries(DIMS.map((d,i)=>[d,successes[i]])),
  dimension_lower_bounds:eachLower,
  weighted_lower_bound:weightedLower,
  interval:'WILSON_ONE_SIDED_95_PERCENT_BONFERRONI_FIVE_DIMENSIONS',
  policy_source:'contracts/c72-product-value-promise.json',
  safety_hard_gates_passed:true,
  signed_claims_verified:true,
  external_issuer_credential_trusted_by_this_module:false,
  independence_physically_proven:false});
}
