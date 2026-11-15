import crypto from 'node:crypto';
import {validateC72ModeSelection} from './c72-unified-mode-admission.mjs';
import {C78HostRelay} from './c78-host-relay.mjs';
import {materializeC82ParallelCarriers} from './c82-experimental-carriers.mjs';
import {prepareC79ChatSurface} from './c79-native-chat-surface.mjs';
import {verifyC81SourceReachability} from './c81-git-source-reachability.mjs';
import {projectC81RuntimeTurn} from './c81-runtime-projection.mjs';

const H40=/^[a-f0-9]{40}$/,H64=/^[a-f0-9]{64}$/;
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const flags={authority:0,active:false,canonical_runtime:false,persistent:false,
  source_origin_attested:false,native_event_attested:false,
  native_chat_delivery_attested:false,owner_receipt_issued:false};
const stop=(edge,detail=null)=>({schema:'ikant-le-c84-experimental-turn/v1',
  status:'C84_STOP',first_unclosed_edge:edge,
  ...(detail?{detail:String(detail).slice(0,160)}:{}),...flags});
const validInput=s=>typeof s==='string'&&s.trim().length>0&&
  Buffer.byteLength(s,'utf8')<=600&&
  !/(?:password\s*[:=]|api[_ -]?key\s*[:=]|bearer\s+[a-z0-9._~+-]+)/i.test(s);

// Carries post-consent, source-bound file bytes. Every getFile callback is
// injected by the actual host; a name, promise or Git hash does not attest
// an external provider. This code does not provide network access.
export async function executeC84ExperimentalTurn({
 selection,sourceHead,expectedManifestSha256,manifestBase64,carriers,
 humanInput,sourceProof,parallelism=4,carrierTimeoutMs=5000
}={}){
 if(!H40.test(String(sourceHead))||!H64.test(String(expectedManifestSha256)))
   return stop('FROZEN_SOURCE_AND_MANIFEST_REQUIRED');
 if(!validateC72ModeSelection(selection,{mode:'EXPERIMENTAL',sourceHead}))
   return stop('C72_EXPERIMENTAL_SELECTION');
 if(!validInput(humanInput))return stop('BOUNDED_NONSENSITIVE_CURRENT_HUMAN_INPUT');
 if(typeof manifestBase64!=='string'||manifestBase64.length>140000||
    !Array.isArray(carriers)||carriers.length<1||carriers.length>6||
    !carriers.every(c=>c&&typeof c.name==='string'&&typeof c.getFile==='function'))
   return stop('C84_HOST_CARRIER_ENVELOPE');
 let relay;
 try{
   // Fail before filesystem materialization on missing or inconsistent Git object proof.
   // This proves reachability only, never native GitHub ref origin.
   // This verifier reads actual Git-object byte arguments, not a trust claim.
   if(!sourceProof||typeof sourceProof!=='object'||
      typeof sourceProof.commitBase64!=='string'||!Array.isArray(sourceProof.treeObjects))
     return stop('C81_SOURCE_GIT_OBJECT_BYTES_REQUIRED');
   let readback;
   try{
     readback=verifyC81SourceReachability({expectedSourceHead:sourceHead,
       expectedManifestSha256,manifestBase64,
       commitBase64:sourceProof.commitBase64,treeObjects:sourceProof.treeObjects});
   }catch(e){return stop('C81_SOURCE_PROOF_VERIFICATION',e.message);}
   if(readback.status!=='C81_GIT_REACHABILITY_VERIFIED')
     return stop('C81_SOURCE_GIT_REACHABILITY',readback.first_unclosed_edge);
   relay=new C78HostRelay({selection,sourceHead,expectedManifestSha256,manifestBase64});
   const staged=await materializeC82ParallelCarriers({relay,manifest:JSON.parse(Buffer.from(manifestBase64,'base64').toString('utf8')),
      carriers,parallelism,carrierTimeoutMs});
   if(staged.status!=='C82_C77_BYTES_MATERIALIZED_IN_NODE'||
     staged.all_bytes_reopened!==true)
     return stop(staged.first_unclosed_edge||'C82_CARRIER_MATERIALIZATION',staged.status);
   const dispatched=relay.dispatch({humanInput});
   if(dispatched.status!=='C78_NODE_RESPONSE_READY_HOST_DELIVERY_PENDING')
     return stop(dispatched.first_unclosed_edge||'C78_RUNTIME_DISPATCH',dispatched.status);
   const packet=prepareC79ChatSurface({selection,sourceHead,
     expectedManifestSha256,currentHumanInput:humanInput,relayReadback:dispatched});
   if(packet.status!=='C79_CHAT_PACKET_READY_NOT_DELIVERED')
     return stop(packet.first_unclosed_edge||'C79_SAME_INPUT_PACKET');
   const projected=projectC81RuntimeTurn({sourceReadback:readback,surfacePacket:packet,
     sourceHead,manifestSha:expectedManifestSha256,currentHumanInput:humanInput});
   if(projected.status!=='C81_RUNTIME_SURFACE_A_READY_NOT_NATIVE_DELIVERED')
     return stop(projected.first_unclosed_edge||'C81_RUNTIME_PROJECTION',projected.status);
   const voice=projected.runtime_computed_answer;
   if(typeof voice!=='string'||digest(Buffer.from(voice,'utf8'))!==projected.bound_output_sha256||
      projected.bound_input_sha256!==digest(Buffer.from(humanInput,'utf8')))
     return stop('C84_EXACT_CURRENT_INPUT_OUTPUT_BYTES');
   return {schema:'ikant-le-c84-experimental-turn/v1',
     status:'C84_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED',
     mode:'EXPERIMENTAL',source_head:sourceHead,
     manifest_sha256:expectedManifestSha256,
     input_sha256:projected.bound_input_sha256,
     output_sha256:projected.bound_output_sha256,
     runtime_computed_answer:voice,
     qualified_carriers:staged.selected_carriers,
     staged_files:staged.files,source_reachability:readback.status,
     runtime_projection:projected.status,
     first_unclosed_edge:'HOST_PINNED_GITHUB_REF_ORIGIN',
     downstream_unverified_edge:'HOST_NATIVE_CHAT_SURFACE_A_DELIVERY',
     ...flags};
 }catch(e){return stop('C84_LOCAL_BRIDGE_EXECUTION',e.message);}
 finally{relay?.close();}
}
