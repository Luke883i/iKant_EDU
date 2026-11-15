import {isProxy} from 'node:util/types';
import {validateC72ModeSelection} from './c72-unified-mode-admission.mjs';

// An authority-zero C99 planning extension, NOT a dispatcher, owner, adapter,
// host-availability test, receipt, or native ChatGPT hook.
const SCHEMA='ikant-le-c99-postselection-plan/v1';
const HEAD=/^[0-9a-f]{40}$/;
const CAP=new Set(['C84','C102','C100']);
const FAILED=new Set(['NONE','C84','C102','C100']);
const COMMANDS=new Set(['I ACCEPT','CANONICAL','EXPERIMENTAL','EXIT IKANT',
 'STOP BOZZE COHOST','AUTORIZZO BOZZE COHOST SPERIMENTALI NON VERIFICATE']);
const neg={authority:0,active:false,owner_executed:false,
  local_runtime_executed:false,source_origin_attested:false,
  native_event_attested:false,native_delivery_attested:false,persistent:false,
  host_capabilities_attested:false};
const stop=edge=>Object.freeze({schema:SCHEMA,status:'C99_STOP',
  first_unclosed_edge:edge,route:'NONE',...neg});
const safeSelection=x=>{
 try {return !!x&&typeof x==='object'&&!Array.isArray(x)&&!isProxy(x)&&
  Object.getPrototypeOf(x)===Object.prototype&&
  Reflect.ownKeys(x).every(k=>typeof k==='string'&&
  Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));
 }catch{return false;}
};
const safeHints=x=>{
 try {
  if(!Array.isArray(x)||isProxy(x)||Object.getPrototypeOf(x)!==Array.prototype||x.length>3)return null;
  const names=Reflect.ownKeys(x);
  if(names.some(k=>k!=='length'&&!/^(?:0|1|2)$/.test(String(k))))return null;
  const values=[];
  for(let i=0;i<x.length;i++){
   const d=Object.getOwnPropertyDescriptor(x,String(i));
   if(!d||!Object.hasOwn(d,'value')||!CAP.has(d.value)||values.includes(d.value))return null;
   values.push(d.value);
  }
  return values;
 }catch{return null;}
};
const plain=(x,allow)=>{
 try {
  if(!x||typeof x!=='object'||Array.isArray(x)||isProxy(x)||
      Object.getPrototypeOf(x)!==Object.prototype)return null;
  const keys=Reflect.ownKeys(x);
  if(keys.some(k=>typeof k!=='string'||!allow.includes(k)))return null;
  const o={};
  for(const k of allow){const d=Object.getOwnPropertyDescriptor(x,k);
   if(!d||!Object.hasOwn(d,'value'))return null;
   o[k]=d.value;}
  return o;
 }catch{return null;}
};
/**
 * This is host-provided *planning evidence*, NOT an invocation. The host MUST
 * independently execute the selected path and consume its original readback.
 * An unchanged failed route is never retried; viable independent routes may
 * still be planned under their own permissions. Caller never acquires authority.
 */
export function planC99PostSelectionTurn(x={}){
 const f=plain(x,['sourceHead','selection','humanInput','cohostOptInObserved',
   'cohostRevoked','carrierHints','previousFailedRoute','failedEvidenceChanged']);
 if(!f)return stop('C99_POST_SELECTION_DATA_DESCRIPTOR_REQUIRED');
 const {sourceHead,selection,humanInput,cohostOptInObserved,cohostRevoked,
 carrierHints,previousFailedRoute,failedEvidenceChanged}=f;
 if(!HEAD.test(sourceHead||'')||!safeSelection(selection)||
    !validateC72ModeSelection(selection,{mode:'EXPERIMENTAL',sourceHead}))
  return stop('C72_OR_FROZEN_SOURCE_SELECTION_NOT_VERIFIED');
 if(typeof humanInput!=='string'||!humanInput.trim()||
    Buffer.byteLength(humanInput,'utf8')>12000||
    Buffer.from(humanInput,'utf8').toString('utf8')!==humanInput)
  return stop('C99_EXACT_BOUNDED_INPUT_REQUIRED');
 if(COMMANDS.has(humanInput))return stop('C99_CONTROL_COMMAND_NOT_COGNITIVE_TURN');
 if(typeof cohostOptInObserved!=='boolean'||typeof cohostRevoked!=='boolean'||
    typeof failedEvidenceChanged!=='boolean'||!FAILED.has(previousFailedRoute))
  return stop('C99_HOST_OBSERVATION_SHAPE');
 const hints=safeHints(carrierHints);
 if(!hints)return stop('C99_CARRIER_HINTS_INVALID');
 const canTry=r=>hints.includes(r)&&
    (previousFailedRoute!==r||failedEvidenceChanged);
 const short=Buffer.byteLength(humanInput,'utf8')<=600;
 const consent=cohostOptInObserved&&!cohostRevoked;
 let route='NONE';
 // C84 is independently consented by C72 (not by the optional cohost opt-in).
 if(short&&canTry('C84'))route='C84';
 else if(consent&&short&&canTry('C102'))route='C102';
 else if(consent&&canTry('C100'))route='C100';
 else if(consent)route='E0_HOST_DRAFT';
 if(route==='NONE')return stop(previousFailedRoute!=='NONE'&&!failedEvidenceChanged?
  'FIRST_UNCLOSED_EDGE_UNCHANGED_NO_RETRY':
  'HOST_RUNTIME_UNAVAILABLE_AND_COHOST_NOT_OPTED_IN');
 const edge=route==='E0_HOST_DRAFT'?
  'ONLY_HOST_MODEL_DRAFT_UNVERIFIED_NO_RUNTIME':
  'ACTUAL_CURRENT_INPUT_INVOCATION_AND_READBACK_REQUIRED';
 return Object.freeze({schema:SCHEMA,status:'C99_PLAN_ONLY_NOT_EXECUTED',
  route,source_head:sourceHead,first_unclosed_edge:edge,
  routing_order:'C84>C102>C100>E0',
  selected_carrier_is_only_caller_hint:true,
  no_retry_of_unchanged_failed_route:true,...neg});
}
