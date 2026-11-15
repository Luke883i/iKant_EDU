import crypto from 'node:crypto';
import fs from 'node:fs';
import {isProxy} from 'node:util/types';
import {executeC107HostLanguageTurn} from './c107-host-language-port.mjs';
import {executeC107Turn,inspectC107Ledger,preflightC107Shape} from './c107-experimental-turn.mjs';
import {validateC72ModeSelection} from './c72-unified-mode-admission.mjs';

const SCHEMA='ikant-le-c108-host-machine/v1';
const sha=s=>crypto.createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const limits={authority:0,active:false,canonical_runtime:false,
 native_event_attested:false,native_delivery_attested:false,
 model_provider_origin_attested:false,chatgpt_hook_attested:false,
 durable_cognitive_memory_attested:false};
const stop=(edge,detail={})=>Object.freeze({schema:SCHEMA,status:'C108_STOP',first_unclosed_edge:edge,...detail,...limits});
const plain=(x,allowed)=>{
 try{return !!x&&typeof x==='object'&&!isProxy(x)&&!Array.isArray(x)&&
  Object.getPrototypeOf(x)===Object.prototype&&
  Reflect.ownKeys(x).every(k=>typeof k==='string'&&allowed.includes(k)&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));}catch{return false;}
};
const safeSelection=x=>{
 try{return !!x&&typeof x==='object'&&!isProxy(x)&&!Array.isArray(x)&&
  Object.getPrototypeOf(x)===Object.prototype&&
  Reflect.ownKeys(x).every(k=>typeof k==='string'&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));}catch{return false;}
};
const contract=JSON.parse(fs.readFileSync(new URL('../contracts/c108-machine-matrix.json',import.meta.url),'utf8'));
const ids=['DIRECT','STDIO','BOUND'];
if(contract.schema!=='ikant-le-c108-host-machine-matrix/v1'||contract.authority!==0||
 !Array.isArray(contract.machines)||contract.machines.length!==3||
 contract.machines.some((m,i)=>m.id!==ids[i])||
 JSON.stringify(contract.capability_priority)!==JSON.stringify(ids))throw Error('C108_CONTRACT_DRIFT');
export const C108_MACHINES=Object.freeze([...ids]);
const port=x=>plain(x,['generate'])&&typeof x.generate==='function';
const relay=x=>plain(x,['turn'])&&typeof x.turn==='function';
function check({request,nonce,priorMessages,resetContext}){
 if(!plain(request,['sourceHead','selection','humanInput','optIn'])||
 request.optIn!==true||!safeSelection(request.selection)||
 !validateC72ModeSelection(request.selection,{mode:'EXPERIMENTAL',sourceHead:request.sourceHead}))
 return 'ORIGINAL_C72_EXPERIMENTAL_OPTIN_REQUIRED';
 if(!Array.isArray(priorMessages)||isProxy(priorMessages)||typeof resetContext!=='boolean')
 return 'C108_CONTEXT_DESCRIPTOR';
 return preflightC107Shape({head:request.sourceHead,nonce,
  humanInput:request.humanInput,priorMessages,resetContext});
}
export function planC108({request,nonce,priorMessages=[],resetContext=false,
 languagePort,relayPort,candidate,prefer}={}){
 const error=check({request,nonce,priorMessages,resetContext});
 if(error)return stop(error);
 if(prefer!==undefined&&!ids.includes(prefer))return stop('C108_UNKNOWN_MACHINE');
 const available={
  DIRECT:port(languagePort),STDIO:relay(relayPort),
  BOUND:plain(candidate,['input_sha256','text'])&&
   candidate.input_sha256===sha(request.humanInput)&&
   typeof candidate.text==='string'&&candidate.text.trim().length>0};
 const machine=prefer||ids.find(id=>available[id]);
 if(!machine||!available[machine])return stop('C108_NO_CALLABLE_HOST_MACHINE');
 return Object.freeze({schema:SCHEMA,status:'C108_PLAN_ONLY',machine,
 source_head:request.sourceHead,input_sha256:sha(request.humanInput),
 original_runtime_executed:false,...limits});
}
function qualify(machine,r,before,after,request,nonce){
 const callback=machine==='DIRECT'||machine==='STDIO';
 const required=callback?'C107_HOST_CALLBACK_LOCAL_RUNTIME_READBACK':
   'C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK';
 const digest=callback?r?.c87_event_sha256:r?.ledger_event_sha256;
 if(r?.status!==required)return stop(r?.first_unclosed_edge||'C108_RUNTIME_STOP');
 if(typeof r.voice_utf8!=='string'||!r.voice_utf8.trim()||
  r.output_sha256!==sha(r.voice_utf8)||r.input_sha256!==sha(request.humanInput)||
  typeof digest!=='string'||!/^[a-f0-9]{64}$/.test(digest)||
  after.status!=='C107_LEDGER_REOPENED'||after.count!==before.count+1||
  after.last_hash!==digest||after.last_hash===before.last_hash||
  after.latest_state?.nonce!==nonce||
  after.latest_state?.source_head!==request.sourceHead||
  after.latest_state?.visible_voice_sha256!==r.output_sha256||
  after.count!==r.ledger_entries||
  (callback&&(r.c70_original_executed!==true||r.c100_original_bound!==true||
    r.c87_original_writer_executed!==true||r.c87_reopened!==true))||
  (!callback&&(r.original_c70_executed!==true||
    r.original_c87_writer_executed!==true||r.model_draft_used!==true)))
 return stop('C108_EXACT_C107_C87_PHYSICAL_READBACK_REQUIRED');
 return Object.freeze({schema:SCHEMA,status:'C108_LOCAL_RUNTIME_REOPENED_NOT_NATIVE',
  machine,source_head:request.sourceHead,input_sha256:r.input_sha256,
  output_sha256:r.output_sha256,voice_utf8:r.voice_utf8,
  ledger_event_sha256:digest,ledger_entries:after.count,
  original_c70_executed:true,original_c100_voice_bound:true,
  original_c87_reopened:true,physically_invoked_machine:true,
  model_callback_invoked:callback,
  first_unclosed_edge:'REAL_MODEL_PROVIDER_AND_CHATGPT_EDU_DELIVERY_NOT_ATTESTED',
  ...limits});
}
export async function executeC108({request,nonce,ledgerFile,
 priorMessages=[],resetContext=false,languagePort,relayPort,candidate,prefer}={}){
 const p=planC108({request,nonce,priorMessages,resetContext,
  languagePort,relayPort,candidate,prefer});
 if(p.status!=='C108_PLAN_ONLY')return p;
 const before=inspectC107Ledger(ledgerFile);
 if(before.status!=='C107_LEDGER_REOPENED')return stop('C108_C87_PRIOR_READBACK_REQUIRED');
 let r;
 try{
  if(p.machine==='DIRECT')r=await executeC107HostLanguageTurn({
   ledgerFile,nonce,request,priorMessages,resetContext,languagePort});
  else if(p.machine==='STDIO')r=await relayPort.turn(Object.freeze({
   ledgerFile,nonce,request,priorMessages:Object.freeze([...priorMessages]),resetContext}));
  else r=executeC107Turn({ledgerFile,nonce,request:{...request,modelCandidate:candidate},
   priorMessages,resetContext,requireHostLanguage:true});
 }catch{return stop('C108_ACTUAL_MACHINE_INVOKE_FAILED',{machine:p.machine});}
 const after=inspectC107Ledger(ledgerFile);
 return qualify(p.machine,r,before,after,request,nonce);
}
export function equivalentC108(a,b,{byteExact=false}={}){
 if(a?.status!=='C108_LOCAL_RUNTIME_REOPENED_NOT_NATIVE'||
 b?.status!=='C108_LOCAL_RUNTIME_REOPENED_NOT_NATIVE')return false;
 for(const field of ['source_head','input_sha256','original_c70_executed',
  'original_c100_voice_bound','original_c87_reopened'])
 if(a[field]!==b[field])return false;
 return !byteExact||['voice_utf8','output_sha256','ledger_event_sha256']
  .every(field=>a[field]===b[field]);
}
