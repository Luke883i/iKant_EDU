import fs from 'node:fs';
import crypto from 'node:crypto';
import {createC94GitHubHTTPS,buildC94C84AutoPackage} from './c94-auto-artifact-carrier.mjs';
import {acquireC95FromInstalledBridge} from './c95-host-connector-relay.mjs';
import {bindC94GeneratedSurface,attemptC94HostNativeDelivery} from './c94-native-delivery-boundary.mjs';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const stop=e=>({schema:'ikant-le-c94-cold-host-turn/v1',status:'C94_TURN_STOP',
 first_unclosed_edge:e,source_origin_attested:false,real_provider_attested:false,
 owner_executed:false,native_delivery_attested:false,active:false,authority:0});
/** Actual host should register a C72 selection and current native human input.
 * No direct caller-supplied voice/receipt, no model rewrite, no manual capsule. */
export async function executeC94ColdHostTurn({humanInput,selection,sourceHead,hostBridge,hostPublicKey,githubConnector}={}){
 if(typeof humanInput!=='string'||!humanInput.trim()||Buffer.byteLength(humanInput,'utf8')>600||
   selection?.status!=='EXPERIMENTAL_SELECTED_NOT_RUNNING'||
   selection.selected_mode!=='EXPERIMENTAL'||
   typeof sourceHead!=='string'||!/^[a-f0-9]{40}$/.test(sourceHead))return stop('CURRENT_HUMAN_INGRESS_C72_OR_SOURCE_HEAD');
 const github=githubConnector?null:createC94GitHubHTTPS();
 if(!github&&!githubConnector)return stop('GITHUB_ACTIONS_TOKEN_UNAVAILABLE_IN_NODE');
 const handoff=githubConnector
  ?await acquireC95FromInstalledBridge({sourceHead,hostBridge:githubConnector})
  :await buildC94C84AutoPackage({sourceHead,client:github});
 if(!['C94_C84_PACKAGE_REOPENED_C90_NOT_EXECUTED','C95_CONNECTOR_BYTES_IN_NODE_VERIFIED_NOT_OWNER_EXECUTED'].includes(handoff.status))
  return stop(handoff.first_unclosed_edge||'C94_C84_NOT_BUILT');
 let bytes;try{bytes=fs.readFileSync(handoff.package_path);}catch{return stop('C84_PACKAGE_READBACK_UNAVAILABLE');}
 if(hash(bytes)!==handoff.package_sha256)return stop('C84_PACKAGE_READBACK_DRIFT');
 const q={sourceHead,humanInput,inputSha256:hash(Buffer.from(humanInput,'utf8')),
  manifestSha256:handoff.manifest_sha256,packageSha256:handoff.package_sha256,
  packageBase64:bytes.toString('base64'),selection};
 // This import executes C92's *actual* production owner through C93 on the current input.
 // If Node lacks a configured provider, C92 must fail closed without a generated voice.
 let projected;try{
  const {executeC93HostProjection}=await import('./c93-experimental-projection.mjs');
  projected=await executeC93HostProjection(q);
 }catch{return stop('C93_REAL_OWNER_NOT_INSTALLED_OR_EXECUTABLE');}
 if(projected?.status!=='C93_HOST_SURFACE_READY_NOT_NATIVE_DELIVERED')
  return stop(projected?.first_unclosed_edge||'C90_C91_C92_C93_REAL_OWNER_NOT_READY');
 const bound=bindC94GeneratedSurface(projected);
 if(bound.status!=='C94_OWNER_BOUND_GENERATED_VOICE_NOT_C86_LEGACY')
  return stop(bound.first_unclosed_edge||'C94_OWNER_BINDING');
 const native=await attemptC94HostNativeDelivery(bound,{hostBridge,hostPublicKey});
 return {schema:'ikant-le-c94-cold-host-turn/v1',
  status:'C94_OWNER_GENERATED_EXPERIMENTAL_NOT_PLATFORM_ATTESTED',
  owner_surface_sha256:bound.output_sha256,source_head:sourceHead,input_sha256:q.inputSha256,
  provider_receipt_required_by_c92:true,
  c81_c86_legacy_generated_voice_admission_attested:false,
  native_host_ack:native.status,native_chat_delivery_attested:false,
  first_unclosed_edge:native.first_unclosed_edge||'PLATFORM_NATIVE_EVENT_INDEPENDENT_READBACK',
  active:false,authority:0};
}
