import crypto from 'node:crypto';
import {verifyC90Source} from './c90-source-boundary.mjs';
import {executeC84ExperimentalTurn} from './c84-experimental-transport.mjs';
import {prepareC86Surface} from './c86-surface-a.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const H64=/^[a-f0-9]{64}$/;
const stop=edge=>({schema:'ikant-le-c90-current-turn/v2',status:'C90_TURN_STOP',
 first_unclosed_edge:edge,runtime_executed:false,active:false,native_chat_delivery_attested:false});
export function checkC90Ingress(q={}){
 if(typeof q.humanInput!=='string'||!q.humanInput.trim()||
  Buffer.byteLength(q.humanInput,'utf8')>600||
  Buffer.from(q.humanInput,'utf8').toString('utf8')!==q.humanInput||
  !H64.test(q.inputSha256||'')||sha(q.humanInput)!==q.inputSha256)
  return stop('CURRENT_INPUT_BYTES');
 if(q.selection?.selected_mode!=='EXPERIMENTAL'||
  q.selection.status!=='EXPERIMENTAL_SELECTED_NOT_RUNNING')
  return stop('C72_EXPERIMENTAL_MODE');
 if(Object.hasOwn(q,'runtimeReceipt')||Object.hasOwn(q,'voice')||
  Object.hasOwn(q,'runtime_computed_answer')||Object.hasOwn(q,'hostCandidate'))
  return stop('CALLER_SUPPLIED_VOICE_FORBIDDEN');
 return {status:'C90_CURRENT_INPUT_ADMISSIBLE_NOT_EXECUTED',runtime_executed:false};
}
/** One real repository execution on current input. No caller-injected C84 receipt. */
export async function executeC90ProductionTurn(q={}){
 const ingress=checkC90Ingress(q);
 if(ingress.status!=='C90_CURRENT_INPUT_ADMISSIBLE_NOT_EXECUTED')return ingress;
 const source=verifyC90Source(q);
 if(source.status!=='C90_SOURCE_REACHABLE_NOT_HOST_ORIGIN_ATTESTED')
  return stop(source.first_unclosed_edge||'C90_SOURCE');
 let packet;
 try{packet=JSON.parse(Buffer.from(q.packageBase64,'base64').toString('utf8'));}
 catch{return stop('C90_PACKAGE_DECODE');}
 const files=new Map(packet.files?.map(f=>[f.path,f.contentBase64]));
 if(files.size!==packet.files?.length)return stop('C90_DUPLICATE_PACKAGE_FILES');
 let result;
 try{
  result=await executeC84ExperimentalTurn({
   selection:q.selection,sourceHead:q.sourceHead,expectedManifestSha256:q.manifestSha256,
   manifestBase64:packet.manifestBase64,sourceProof:packet.sourceProof,
   humanInput:q.humanInput,
   carriers:[{name:'C90_SHA_BOUND_LOCAL_PACKAGE',getFile:async file=>{
    if(!files.has(file))throw Error('C90_MISSING_SOURCE_PATH');
    return {contentBase64:files.get(file)};
   }}]});
 }catch{return stop('C84_ACTUAL_NODE_EXECUTION');}
 if(result?.status!=='C84_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED')
  return stop(result?.first_unclosed_edge||'C84_NO_VERIFIED_RUNTIME_RESULT');
 const voice=prepareC86Surface({runtimeReceipt:result,currentHumanInput:q.humanInput,
  sourceHead:q.sourceHead,manifestSha256:q.manifestSha256});
 if(voice.status!=='C86_SURFACE_A_READY_NOT_NATIVE_DELIVERED')
  return stop(voice.first_unclosed_edge||'C86_VOICE_BINDING');
 if(voice.input_sha256!==q.inputSha256||
  voice.surface_a_text!==result.runtime_computed_answer)
  return stop('C90_SAME_TURN_VOICE_DRIFT');
 return {schema:'ikant-le-c90-current-turn/v2',status:'C90_RUNTIME_VOICE_READY_NOT_NATIVE_DELIVERED',
  mode:'EXPERIMENTAL',source_head:q.sourceHead,manifest_sha256:q.manifestSha256,
  package_sha256:q.packageSha256,input_sha256:q.inputSha256,output_sha256:voice.output_sha256,
  voice_exact:voice.surface_a_text,staged_files:result.staged_files,
  qualified_carriers:result.qualified_carriers,runtime_executed:true,
  git_reachability_attested:true,host_origin_attested:false,active:false,
  native_chat_delivery_attested:false,inter_turn_persistence_attested:false,
  first_unclosed_edge:'HOST_NATIVE_CHAT_SURFACE_A_DELIVERY',authority:0};
}
