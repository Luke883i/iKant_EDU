import {readC99SelectionFields,gateC99SourceHandoff,readC99EntryData} from './c99-route-policy.mjs';
import crypto from 'node:crypto';
import {makeC98C82Carrier} from './c98-c82-connector-port.mjs';
import {preflightC98ChatGPTOffline} from './c98-chatgpt-offline-boundary.mjs';
import {makeC98ArchiveC82Carrier} from './c98-archive-c82-port.mjs';
const sha=s=>crypto.createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const H40=/^[a-f0-9]{40}$/;
const stop=e=>({schema:'ikant-le-c98-host-interop/v1',status:'C98_STOP',
 first_unclosed_edge:e,owner_executed:false,host_authenticated_origin:false,
 native_delivery_attested:false,inter_turn_persistence_attested:false,
 actual_provider_calls_attested:false,active:false,authority:0});
/** Adapter at the existing C84 entry; DOES NOT replace C82/C78 writer/owner.
 * This entry is inert until an actual host explicitly registers readC77Member
 * and provides same-turn C72 selection, Git proof and current human input.
 */
export async function executeC98ExistingC84(args={}){
 const safe=readC99EntryData(args);
 if(!safe)return stop('C99_INPUT_ENVELOPE_ACCESSOR');
 const {humanInput,sourceHead,manifest,manifestBase64,manifestSha256,
   selection,sourceProof,readC77Member,readC77Archive}=safe;
 const nodeGithubNetworkRequested=safe.nodeGithubNetworkRequested===undefined?
   false:safe.nodeGithubNetworkRequested;
 const offline=preflightC98ChatGPTOffline({humanInput,sourceHead,selection,
   readC77Member,readC77Archive,nodeGithubNetworkRequested});
 if(offline.status!=='C98_CALLBACK_SHAPE_READY_NOT_HOST_AUTHENTICATED'){
   // Preserve C98.4/7 public stop edges; add a separate explicit no-DNS
   // boundary without changing stable caller-visible failures.
   const edge=offline.first_unclosed_edge==='C72_OR_SOURCE_CURRENT_INPUT_REQUIRED'?
     'C72_NATIVE_CURRENT_HUMAN_SELECTION_OR_SOURCE_REQUIRED':
     offline.first_unclosed_edge==='HOST_CONNECTOR_TO_NODE_BYTE_CALLBACK_UNAVAILABLE_NO_NODE_DNS_RETRY'?
     'HOST_CONNECTOR_NODE_CALLBACK_NOT_INSTALLED':offline.first_unclosed_edge;
   return stop(edge);
 }
 if(typeof humanInput!=='string'||!humanInput.trim()||
    Buffer.byteLength(humanInput,'utf8')>600||
    Buffer.from(humanInput,'utf8').toString('utf8')!==humanInput||
    !H40.test(sourceHead||'')||readC99SelectionFields(selection).selected_mode!=='EXPERIMENTAL'||
    readC99SelectionFields(selection).status!=='EXPERIMENTAL_SELECTED_NOT_RUNNING')
   return stop('C72_NATIVE_CURRENT_HUMAN_SELECTION_OR_SOURCE_REQUIRED');
 const methods=Number(typeof readC77Member==='function')+Number(typeof readC77Archive==='function');
 if(methods===0)return stop('HOST_CONNECTOR_NODE_CALLBACK_NOT_INSTALLED');
 if(methods!==1)return stop('AMBIGUOUS_HOST_CARRIER_SELECT_ONE');
 if(gateC99SourceHandoff({sourceHead,manifestSha256,sourceProof}).status!==
    'C99_C81_PROOF_SHAPE_ONLY_NOT_VERIFIED')
   return stop('C81_VERIFIED_SOURCE_PROOF_REQUIRED');
 let bound;try{bound=typeof readC77Archive==='function'?
    makeC98ArchiveC82Carrier({sourceHead,manifestBase64,manifestSha256,manifest,readC77Archive}):
    makeC98C82Carrier({sourceHead,manifestBase64,manifestSha256,manifest,readC77Member});}
 catch(e){return stop(e.code||'C98_HOST_BYTE_ENVELOPE_INVALID');}
 let owner;
 try{
  // Imports the **existing repository** C84 owner only when a physically
  // registered callback and valid source envelope were supplied. No mock.
  const {executeC84ExperimentalTurn}=await import('./c84-experimental-transport.mjs');
  owner=await executeC84ExperimentalTurn({selection,sourceHead,
    expectedManifestSha256:manifestSha256,manifestBase64,
    carriers:[bound.carrier],humanInput,sourceProof});
 }catch{return stop('C84_EXISTING_OWNER_UNAVAILABLE');}
 if(owner?.status!=='C84_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED')
  return stop(owner?.first_unclosed_edge||'C84_EXISTING_OWNER_NOT_READY');
 if(owner.input_sha256!==sha(humanInput)||owner.source_head!==sourceHead||
    owner.manifest_sha256!==manifestSha256||
    typeof owner.runtime_computed_answer!=='string'||
    sha(owner.runtime_computed_answer)!==owner.output_sha256||
    owner.native_chat_delivery_attested!==false||owner.active!==false)
  return stop('C84_OWNER_RECEIPT_DRIFT');
 // Does not rewrite, render, summarize, or re-seal the owner's voice.
 return {schema:'ikant-le-c98-host-interop/v1',
  status:'C98_EXISTING_C84_OWNER_RECEIPT_READY_NOT_HOST_DELIVERED',
  current_input_sha256:sha(humanInput),source_head:sourceHead,
  owner_receipt:owner, // exact owner object untouched, NOT an independent witness
  owner_executed:true,host_authenticated_origin:false,
  native_delivery_attested:false,inter_turn_persistence_attested:false,
  actual_provider_calls_attested:false,active:false,authority:0,
  first_unclosed_edge:'HOST_NATIVE_DELIVERY_AND_GITHUB_REF_ORIGIN'};
}
