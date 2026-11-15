/** Optional EDU-only HOST observer, never an owner or C87 voice. */
import {createHash} from 'node:crypto';
import {isProxy} from 'node:util/types';
export const NEEDLE_SOURCE_HEAD='08e1bc0ad8ae80d43b628fb13a89a38c165094eb';
const SHA=x=>createHash('sha256').update(x).digest('hex');
const bad=(edge,digest=null)=>Object.freeze({schema:'ikant-le-needle-shadow-observation/v1',status:'STOP',first_edge:edge,input_sha256:digest,authority:0,active:false,writer_calls:0,native_identity_attested:false,hints:[]});
const denyKeys=new Set(['__proto__','constructor','prototype','authority','active','response','owner','voice_utf8','original_c87','session','write','receipt_sha256','native_event_attested']);
function plain(x,depth=0){
 if(depth>5||isProxy(x))return false;
 if(x===null||typeof x==='string'||typeof x==='boolean')return true;
 if(typeof x==='number')return Number.isFinite(x);
 if(typeof x!=='object')return false;
 if(!Array.isArray(x)&&Object.getPrototypeOf(x)!==Object.prototype)return false;
 if(Array.isArray(x)&&x.length>5)return false;
 const d=Object.getOwnPropertyDescriptors(x);
 return Reflect.ownKeys(d).every(k=>typeof k==='string'&&k!=='__proto__'&&k!=='constructor'&&k!=='prototype'&&Object.hasOwn(d[k],'value')&&!Object.hasOwn(d[k],'get')&&!Object.hasOwn(d[k],'set')&&(k==='length'&&Array.isArray(x)||!denyKeys.has(k)&&!k.startsWith('$')&&plain(d[k].value,depth+1)));
}
export function qualifyNeedleOutput(x){
 try{
  if(!plain(x)||x===null||Array.isArray(x)||Buffer.byteLength(JSON.stringify(x),'utf8')>4096)return bad('NEEDLE_OUTPUT_UNSAFE');
  if(Object.keys(x).some(k=>!['type','confidence','function_calls','suppressed_calls','reasoning','latency_ms'].includes(k)))return bad('NEEDLE_OUTPUT_EXECUTION_OR_UNEXPECTED_FIELDS');
  if(!['call','none','refusal'].includes(x.type)||!Array.isArray(x.function_calls)||x.function_calls.length>3)return bad('NEEDLE_RESULT_TYPE_OR_CALL_COUNT');
  if(x.suppressed_calls!==undefined&&(!Array.isArray(x.suppressed_calls)||x.suppressed_calls.length>3))return bad('NEEDLE_SUPPRESSED_INVALID');
  if(x.function_calls.length===0){
   if(x.type==='call')return bad('NEEDLE_CALL_WITH_NO_CALLS');
   return Object.freeze({status:'ABSTAIN',hints:[],score_present:typeof x.confidence==='number'&&Number.isFinite(x.confidence)});
  }
  if(x.type!=='call')return bad('NEEDLE_CALL_TYPE_MISMATCH');
  if(x.confidence!==null&&x.confidence!==undefined&&(typeof x.confidence!=='number'||!Number.isFinite(x.confidence)||x.confidence<0||x.confidence>1))return bad('NEEDLE_CONFIDENCE_INVALID');
  const hints=[];
  for(const c of x.function_calls){
   if(!plain(c)||!c||Array.isArray(c)||Object.keys(c).sort().join(',')!=='arguments,name'||typeof c.name!=='string'||!plain(c.arguments)||!c.arguments||Array.isArray(c.arguments))return bad('NEEDLE_CALL_NOT_PLAIN');
   if(c.name==='route_hint'){
    if(Object.keys(c.arguments).join(',')!=='route'||!['UNKNOWN','OPERATIONAL','GENERAL_STUDY'].includes(c.arguments.route))return bad('NEEDLE_ROUTE_UNTRUSTED');
   }else if(c.name==='extract_slots'){
    const f=c.arguments.fields;
    if(Object.keys(c.arguments).join(',')!=='fields'||!Array.isArray(f)||f.length>4||f.some(v=>typeof v!=='string'||v.length<1||v.length>64||/[\u0000-\u001f]/u.test(v)))return bad('NEEDLE_SLOTS_UNTRUSTED');
   }else return bad('NEEDLE_TOOL_NOT_WHITELISTED');
   const bytes=Buffer.from(JSON.stringify(c.arguments),'utf8');
   if(bytes.length>1024)return bad('NEEDLE_ARGS_OVER_BUDGET');
   hints.push(Object.freeze({name:c.name,args_sha256:SHA(bytes),confidence_untrusted:typeof x.confidence==='number'?x.confidence:null,authority:0}));
  }
  return Object.freeze({status:'SHADOW_ONLY',hints:Object.freeze(hints),score_present:typeof x.confidence==='number'});
 }catch{return bad('NEEDLE_OBJECT_ACCESS_DENIED');}
}
export async function observeNeedleShadow({humanInputBytes,sourceHead=NEEDLE_SOURCE_HEAD,mode,enabled=false,explicitDataPermission=false,localOnly=false,modelComplete,timeoutMs=2000}={}){
 let hash=null;
 try{
  if(sourceHead!==NEEDLE_SOURCE_HEAD)return bad('NEEDLE_SOURCE_LOCK_STALE');
  if(mode!=='EDU')return bad('NEEDLE_MODE_NOT_EDU');
  if(!enabled||!explicitDataPermission||!localOnly)return bad('NEEDLE_OPTIN_OR_LOCAL_PERMISSION_REQUIRED');
  if(!Buffer.isBuffer(humanInputBytes)&&!(humanInputBytes instanceof Uint8Array))return bad('NEEDLE_EXACT_UTF8_BUFFER_REQUIRED');
  const bytes=Buffer.from(humanInputBytes);
  hash=SHA(bytes);
  if(!bytes.length||bytes.length>8192||bytes.includes(0))return bad('NEEDLE_INPUT_BUDGET_OR_NUL',hash);
  const txt=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  if(Buffer.compare(Buffer.from(txt,'utf8'),bytes)!==0)return bad('NEEDLE_NONCANONICAL_UTF8',hash);
  if(typeof modelComplete!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<50||timeoutMs>2000)return bad('NEEDLE_PROVIDER_OR_TIMEOUT_UNAVAILABLE',hash);
  // In production modelComplete MUST be the bounded OS subprocess adapter; the
  // Promise race is only a second host guard, NOT proof that a hung model was killed.
  let timer;
  try{
   const result=await Promise.race([Promise.resolve().then(()=>modelComplete(txt)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),timeoutMs);})]);
   const q=qualifyNeedleOutput(result);
   if(q.status==='STOP')return bad(q.first_edge,hash);
   return Object.freeze({schema:'ikant-le-needle-shadow-observation/v1',status:q.status,source_head:sourceHead,input_sha256:hash,first_edge:null,hints:q.hints,score_present:q.score_present,authority:0,writer_calls:0,active:false,native_identity_attested:false,model_efficacy_attested:false});
  }finally{clearTimeout(timer);}
 }catch{return bad('NEEDLE_FAILED_OR_TIMED_OUT_NO_RETRY',hash);}
}
