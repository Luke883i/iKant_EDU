/** HOST technical projection: no conversational text or credentials may escape. */
import {isProxy} from 'node:util/types';
const FIELDS=Object.freeze({status:/^[A-Z0-9_]{3,100}$/u,first_edge:/^[A-Z0-9_]{3,120}$/u,
 mode:/^(?:EDU|CANONICAL)$/u,source_head:/^[a-f0-9]{40}$/u,
 c87_event_sha256:/^[a-f0-9]{64}$/u});
export function projectSafeHostEvidence(candidate){
 try{
  if(!candidate||typeof candidate!=='object'||Array.isArray(candidate)||isProxy(candidate)||
    Object.getPrototypeOf(candidate)!==Object.prototype)
    return Object.freeze({ok:false,first_edge:'HOST_UNSAFE_ENVELOPE'});
  const descriptors=Object.getOwnPropertyDescriptors(candidate);
  if(Reflect.ownKeys(descriptors).some(k=>typeof k!=='string'||!Object.hasOwn(descriptors[k],'value')))
    return Object.freeze({ok:false,first_edge:'HOST_ACCESSOR_OR_SYMBOL_DENIED'});
  const safe={schema:'ikant-host-technical-evidence/v1',ok:true,authority:0,
   conversation_text_included:false,native_event_attested:false,active:false};
  for(const [key,regex] of Object.entries(FIELDS)){
   const d=descriptors[key];if(d===undefined)continue;
   if(typeof d.value!=='string'||!regex.test(d.value))
    return Object.freeze({ok:false,first_edge:'HOST_PUBLIC_FIELD_INVALID'});
   safe[key]=d.value;
  }
  return Object.freeze(safe);
 }catch{return Object.freeze({ok:false,first_edge:'HOST_UNSAFE_ENVELOPE'});}
}