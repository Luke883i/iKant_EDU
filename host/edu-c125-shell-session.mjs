/** One-host-controlled output path around existing PR119 guided owner.
 * It can constrain ONLY the outputs passed to the caller-supplied send port.
 * Not a ChatGPT native renderer hook or a second C87 writer. */
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createGuidedCohostV7} from './edu-c70-method-v7.mjs';
import {createC125HostOutputPort} from './c125-output-port.mjs';
import {loadC127SourceCache} from './edu-c127-source-transport.mjs';
const H=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const ID=/^[A-Za-z0-9_-]{12,96}$/;
const META=/^[A-Za-z0-9_:.\/-]{1,120}$/;
function inspect(guided){
 if(!guided?.ok||!guided.install_root||!guided.ledger_file)return null;
 try{
  const x=spawnSync(process.execPath,['scripts/c107-turn-cli.mjs',guided.ledger_file],
   {cwd:guided.install_root,encoding:'utf8',input:JSON.stringify({action:'INSPECT'}),timeout:15000,maxBuffer:1_000_000});
  return x.status===0?JSON.parse(x.stdout):null;
 }catch{return null}
}
export async function createC125ShellSession({carrierBytes,privateParent,languagePort,send,afterAcceptWitness,c124OverlayBytes=null,c127CachePath=null}={}){
 const port=createC125HostOutputPort({send,afterAcceptWitness});
 if(!port.ok)return Object.freeze({ok:false,first_edge:port.reason,native_ui_exclusive:false});
 let guided=null,initEdge='PR119_UNAVAILABLE';
 // Optional real file transport. Never treat a filename as proof of source bytes.
 if(c127CachePath!==null){
  if(carrierBytes!==undefined||c124OverlayBytes!==null)return Object.freeze({ok:false,first_edge:'C127_AMBIGUOUS_SOURCE_INPUT',native_ui_exclusive:false});
  const cache=loadC127SourceCache(c127CachePath);
  if(!cache.ok)return Object.freeze({ok:false,first_edge:cache.first_edge,native_ui_exclusive:false});
  carrierBytes=cache.carrierBytes;c124OverlayBytes=cache.c124OverlayBytes;
 }
 try{
  guided=await createGuidedCohostV7({carrierBytes,privateParent,languagePort,c124OverlayBytes});
  if(!guided.ok)initEdge=guided.first_edge||'PR119_INITIALIZATION_BLOCKED';
 }catch{initEdge='PR119_INITIALIZATION_EXCEPTION'}
 let closed=false,busy=false;const seen=new Set();
 function close(){closed=true;port.close();if(guided?.ok)guided.dispose();}
 async function publishStatus({eventId,kind='BLOCKED',mode='EXPERIMENTAL',edge='UNKNOWN',next='STOP',hostNotes=null}={}){
  if(closed||busy)return Object.freeze({ok:false,reason:closed?'SESSION_CLOSED':'CONCURRENT_TURN_DENIED'});
  if(typeof eventId!=='string'||!ID.test(eventId)||seen.has(eventId))return Object.freeze({ok:false,reason:'REPLAY_OR_INVALID_EVENT'});
  seen.add(eventId);busy=true;
  try{return await port.publish({eventId,frame:{kind,mode,trace:'NOT_SAVED',continuity:'HOST_LOCAL_ONLY',edge,next,hostNotes}})}
  finally{busy=false}
 }
 async function publishTurn({frame,hostNotes=null}={}){
  if(closed||busy)return Object.freeze({ok:false,reason:closed?'SESSION_CLOSED':'CONCURRENT_TURN_DENIED'});
  const id=frame?.nonce;
  if(typeof id!=='string'||!ID.test(id)||seen.has(id))return Object.freeze({ok:false,reason:'REPLAY_OR_INVALID_NONCE'});
  seen.add(id);busy=true;
  try{
   let owner=null;
   if(guided?.ok){try{owner=await guided.runGuidedTurn(frame)}catch{owner=null}}
   if(closed)return Object.freeze({ok:false,reason:'SESSION_DISPOSED_NO_EMIT'});
   const good=owner?.surface_a?.origin==='HOST_BOUND'&&owner.status==='PR119_OWNER_C70_GUIDED_LOCAL_READBACK';
   const w=good?inspect(guided):null;
   const trace=good?owner.surface_b?.TRACE_REF:'NOT_SAVED';
   const voiceEligible=good&&w?.status==='C107_LEDGER_REOPENED'&&w.last_hash===trace&&
    w.latest_state?.nonce===id&&owner.pr119_surface_b?.INPUT_REF===H(frame.humanInput);
   const edge=voiceEligible?'NATIVE_CHATGPT_PER_TURN_DISPATCH':
    (good?'C125_INDEPENDENT_READBACK_MISMATCH':(owner?.surface_b?.FIRST_EDGE||initEdge));
   const safeEdge=typeof edge==='string'&&META.test(edge)?edge:'OWNER_EDGE_UNAVAILABLE';
   return await port.publish({eventId:id,frame:{kind:voiceEligible?'OWNER_VOICE':'BLOCKED',
    mode:'EXPERIMENTAL',trace:voiceEligible?trace:'NOT_SAVED',continuity:voiceEligible?'C87_INDEPENDENT_REOPEN':'HOST_LOCAL_ONLY',
    edge:safeEdge,next:voiceEligible?'QUALIFY_NATIVE_HOOK':'RECONCILE_OWNER',
    ownerReceipt:voiceEligible?owner:null,independentReadback:voiceEligible?w:null,
    nonce:voiceEligible?id:null,input_sha256:voiceEligible?H(frame.humanInput):null,hostNotes}});
  }finally{busy=false}
 }
 return Object.freeze({ok:true,runtime_ready:guided?.ok===true,initial_edge:guided?.ok?null:initEdge,
   publishTurn,publishStatus,close,status(){return Object.freeze({closed,busy,attempted_events:seen.size,
    port:port.status(),native_ui_exclusive:false,provider_origin_attested:false})}});
}
