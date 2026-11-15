import fs from 'node:fs';
import crypto from 'node:crypto';
import {isProxy} from 'node:util/types';
const C=JSON.parse(fs.readFileSync(new URL('../contracts/c110-experimental-lattice.json',import.meta.url),'utf8'));
if(C.schema!=='ikant-le-c110-experimental-lattice/v1'||C.authority!==0||C.ranking.length!==3)
 throw Error('C110_CONTRACT_DRIFT');
const LIMITS=Object.freeze({authority:0,active:false,canonical_runtime:false,
 native_event_attested:false,native_delivery_attested:false,host_hook_attested:false,
 original_c70_executed:false,original_c87_reopened:false,cognitive_memory_persistent:false});
const hex=/^[a-f0-9]{40}$/;
export const C110_PROFILES=Object.freeze([...C.ranking]);
function plain(x){try{return x!==null&&typeof x==='object'&&!isProxy(x)&&!Array.isArray(x)&&
 Object.getPrototypeOf(x)===Object.prototype&&Reflect.ownKeys(x).every(k=>
  typeof k==='string'&&Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));}catch{return false;}}
const H=x=>crypto.createHash('sha256').update(x).digest('hex');
const secret=/(?:\bpassword\s*[:=]|\bapi[_ -]?key\s*[:=]|\bbearer\s+[a-z0-9._~+-]{12,}|\bprivate[_ -]?key\s*[:=])/i;
const overclaim=/(?:\b(?:ikant\s+(?:e|è|is)\s+active|canonical\s+active|native\s+(?:event|delivery)\s+attested|persisten(?:ce|za)\s+(?:verified|garantita))\b)/i;
export const C110_SYNTHETIC_LABEL='[BOZZA HOST SPERIMENTALE - C70/C87 NON ESEGUITI]';
/** Route selection does not invoke anything: it can never attest Node, C70, C87 or model origin. */
export function selectC110Route(x={}){
 if(!plain(x)||Object.keys(x).sort().join(',')!==[
   'cohostOptIn','originalCallable','sourceHead','syntheticAuthorized','syntheticCallable','turnSafe'].sort().join(',')||
  !hex.test(x.sourceHead||'')||
  !['cohostOptIn','originalCallable','syntheticAuthorized','syntheticCallable','turnSafe'].every(k=>typeof x[k]==='boolean'))
  return Object.freeze({schema:C.schema,status:'C110_DIAGNOSTIC_ONLY',
    first_unclosed_edge:'TYPED_HOST_CAPABILITY_FRAME_REQUIRED',...LIMITS});
 if(!x.cohostOptIn)return Object.freeze({schema:C.schema,status:'C110_DIAGNOSTIC_ONLY',
  first_unclosed_edge:'EXPLICIT_COHOST_OPTIN_REQUIRED',...LIMITS});
 if(!x.turnSafe)return Object.freeze({schema:C.schema,status:'C110_DIAGNOSTIC_ONLY',
  first_unclosed_edge:'SAFE_CURRENT_TURN_REQUIRED',...LIMITS});
 if(x.originalCallable)return Object.freeze({schema:C.schema,status:'C110_ORIGINAL_C108_ELIGIBLE_NOT_EXECUTED',
  route:'ORIGINAL_C108_ELIGIBLE',first_unclosed_edge:'ACTUAL_C108_INVOKE_AND_C87_READBACK_REQUIRED',...LIMITS});
 if(x.syntheticAuthorized&&x.syntheticCallable)
  return Object.freeze({schema:C.schema,status:'C110_SYNTHETIC_HOST_DRAFT_ELIGIBLE_NOT_EXECUTED',
   route:'SYNTHETIC_HOST_DRAFT_ELIGIBLE',first_unclosed_edge:'ACTUAL_HOST_DRAFT_CALLBACK_REQUIRED',...LIMITS});
 return Object.freeze({schema:C.schema,status:'C110_DIAGNOSTIC_ONLY',
  first_unclosed_edge:'NO_ORIGINAL_PORT_AND_NO_AUTHORIZED_SYNTHETIC_DRAFT',...LIMITS});
}
export function sealC110Synthetic({sourceHead,input,voice,nonce,priorCount=0}={}){
 if(!hex.test(sourceHead||'')||typeof input!=='string'||!input.trim()||
  Buffer.byteLength(input,'utf8')>600||secret.test(input)||typeof nonce!=='string'||
  !/^[A-Za-z0-9_-]{12,96}$/.test(nonce)||typeof voice!=='string'||!voice.trim()||
  Buffer.byteLength(voice,'utf8')>15000||secret.test(voice)||overclaim.test(voice)||!Number.isInteger(priorCount)||priorCount<0||priorCount>4)
  return Object.freeze({schema:C.schema,status:'C110_SYNTHETIC_STOP',
   first_unclosed_edge:'SYNTHETIC_BYTES_OR_NONCE_INVALID',...LIMITS});
 const presented=C110_SYNTHETIC_LABEL+'\n'+voice;
 return Object.freeze({schema:C.schema,status:'C110_SYNTHETIC_HOST_DRAFT_NOT_IKANT_RUNTIME',
  surface_a:presented,
  evidence:Object.freeze({grade:'HOST_SYNTHETIC_NOT_ORIGINAL_EXECUTION',source_head:sourceHead,
   input_sha256:H(Buffer.from(input,'utf8')),visible_voice_sha256:H(Buffer.from(presented,'utf8')),
   host_draft_sha256:H(Buffer.from(voice,'utf8')),
   nonce_sha256:H(Buffer.from(nonce,'utf8')),prior_questions_seen_by_host:priorCount,
   c70_original_executed:false,c100_original_bound:false,c87_writer_executed:false,
   ledger_entries:null,ledger_event_sha256:null,model_provider_origin_attested:false,
   source_origin_attested:false,native_chatgpt_hook_attested:false}),
  first_unclosed_edge:'ORIGINAL_C108_AND_C87_NOT_EXECUTED',...LIMITS});
}
