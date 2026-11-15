import {draftC91AfterOwner} from './c91-language-delegation.mjs';

const stop=e=>({schema:'ikant-le-c91-delegation/v1',status:'C91_STOP',first_unclosed_edge:e,
 active:false,native_chat_delivery_attested:false,actual_model_provider_attested:false,authority:0});
/** Production-only entry: actual C90 owner is IMPORTED and RUN with the same input.
 * The language port remains a host callback; no source of native provider origin is invented. */
export async function executeC91FromRealC90(request,{languagePort,reviewPort}={}){
 if(!request||Object.keys(request).some(k=>
     ['hostCandidate','voice','runtimeReceipt','runtime_computed_answer'].includes(k)))
   return stop('CALLER_SUPPLIED_VOICE_FORBIDDEN');
 let owner;
 try{
   const {executeC90ProductionTurn}=await import('./c90-turn-owner.mjs');
   owner=await executeC90ProductionTurn(request);
 }catch{return stop('C90_REAL_OWNER_UNAVAILABLE');}
 if(owner?.status!=='C90_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED')
   return stop(owner?.first_unclosed_edge||'C90_REAL_OWNER_UNEXECUTED');
 return draftC91AfterOwner({request,ownerReceipt:owner,languagePort,reviewPort});
}
