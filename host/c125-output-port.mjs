/** C125: at-most-once host-owned transmission. Not a native ChatGPT UI lock. */
import {createHash} from 'node:crypto';
import {isProxy} from 'node:util/types';
import {emitC125Shell} from './c125-exclusive-shell.mjs';
const H=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const EVENT=/^[A-Za-z0-9_-]{12,96}$/;
export function createC125HostOutputPort({send,afterAcceptWitness}={}){
 if(typeof send!=='function'||afterAcceptWitness?.accepted!==true||afterAcceptWitness?.scope!=='HOST_WITNESSED_ONLY')
  return Object.freeze({ok:false,reason:'SEND_OR_REAL_ACCEPTANCE_WITNESS_REQUIRED',native_exclusive_attested:false});
 let inFlight=false,closed=false;const attempted=new Set(),delivered=new Set();
 async function publish({eventId,frame}={}){
  if(closed)return Object.freeze({ok:false,reason:'PORT_CLOSED'});
  if(inFlight)return Object.freeze({ok:false,reason:'CONCURRENT_EMIT_DENIED'});
  if(typeof eventId!=='string'||!EVENT.test(eventId)||attempted.has(eventId))return Object.freeze({ok:false,reason:'EVENT_ID_INVALID_OR_ALREADY_ATTEMPTED'});
  inFlight=true;
  try{
   if(!frame||typeof frame!=='object'||Array.isArray(frame)||isProxy(frame)||
      (Object.getPrototypeOf(frame)!==Object.prototype&&Object.getPrototypeOf(frame)!==null))
    return Object.freeze({ok:false,reason:'INVALID_FRAME_SHAPE',send_attempted:false});
   const descriptors=Object.getOwnPropertyDescriptors(frame);
   if(Reflect.ownKeys(descriptors).some(k=>typeof k!=='string'||!Object.hasOwn(descriptors[k],'value')))
    return Object.freeze({ok:false,reason:'HOST_FRAME_GETTER_OR_SYMBOL',send_attempted:false});
   const clean=Object.fromEntries(Object.entries(descriptors).map(([k,d])=>[k,d.value]));
   const result=emitC125Shell({...clean,afterAccept:true});
   if(result.status!=='ASSISTANT_TEXT_ONLY')return Object.freeze({ok:false,reason:result.reason,send_attempted:false});
   // Consume identity *before* send: uncertain post-send failures must never retry.
   attempted.add(eventId);
   try{await send(result.emit);}catch{return Object.freeze({ok:false,reason:'DELIVERY_UNKNOWN_DO_NOT_RETRY',send_attempted:true,native_exclusive_attested:false})}
   delivered.add(eventId);
   return Object.freeze({ok:true,eventId,frame_sha256:H(result.emit),voice_sha256:result.voice_sha256,
    origin:result.origin,send_callback_resolved:true,native_exclusive_attested:false,platform_delivery_attested:false});
  }catch{return Object.freeze({ok:false,reason:'PORT_PROJECTION_EXCEPTION',send_attempted:attempted.has(eventId)})}
  finally{inFlight=false}
 }
 return Object.freeze({ok:true,publish,close(){closed=true},status(){return Object.freeze({closed,inFlight,attempted:attempted.size,resolved:delivered.size,native_exclusive_attested:false})}});
}
