import path from 'node:path';
import {ROOT,sha256,validateSurfaceA} from './contract.mjs';
import {writeBacklogDocxAtomic} from './docx.mjs';
import {nodeDispatchReceiptPure,validateNodeDispatchReceipt} from './runtime-dispatch.mjs';
import {validateLimitedRuntimeCapability} from './runtime-limited-capability.mjs';
import {validateActivationServiceTier,assessLimitedTurnClosure,validateLimitedTurnClosure} from './runtime-availability.mjs';
import {buildSessionShell,validateSessionShell,renderSessionShell} from './session-shell.mjs';

function digestWithout(x,key){const y=structuredClone(x);delete y[key];return sha256(Buffer.from(JSON.stringify(y)));}
function descriptorDigest(d){return sha256(Buffer.from(JSON.stringify(d)));}
export function processLimitedRuntimeTurn({input,candidate,capability,hostSurface='LOCAL_NODE_CHAT_HOST',artifactDir=path.join(ROOT,'.ikant','artifacts')}={}){
 const cv=validateLimitedRuntimeCapability(capability);if(!cv.ok)throw new Error('FAILURE: limited runtime capability invalid: '+cv.errors.join(','));
 const activation={schema:'ikant-le-activation-service-tier/v1',tier:'RUNTIME_BOUND_LIMITED',active:false,runtime_capable:true,limited_turn_eligible:true,claim_class:'IKANT_RUNTIME_LIMITED',first_unclosed_edge:'ACTIVE_READBACK',fault_overlay:'NONE',capabilities:['REPOSITORY_STUDY','MATERIALIZED_RUNTIME_INSPECTION','LIMITED_RUNTIME_TURN'],external_gaps_open:[],persisted:false,replaces_lifecycle:false,authority:0};
 const av=validateActivationServiceTier(activation);if(!av.ok)throw new Error('FAILURE: invalid limited activation projection');
 const inputText=String(input??''),inputSha=sha256(Buffer.from(inputText)),dispatchState={epoch:capability.acceptance_event_id,status:'RUNTIME_BOUND_LIMITED'};
 const nodeDispatch=nodeDispatchReceiptPure(inputText,dispatchState,{hostSurface}),dv=validateNodeDispatchReceipt(nodeDispatch,{input:inputText,epoch:capability.acceptance_event_id,statusBefore:'RUNTIME_BOUND_LIMITED',hostSurface});
 if(!dv.ok)throw new Error('FAILURE: runtime-owned limited dispatch invalid');
 const surfaceA=String(candidate??'').trim(),surfaceValidation=validateSurfaceA(surfaceA);if(!surfaceValidation.ok)throw new Error('FAILURE: limited runtime output violates Surface A bounds');
 const outputSha=sha256(Buffer.from(surfaceA)),activationProjectionSha=sha256(Buffer.from(JSON.stringify(activation)));
 const sealMaterial={schema:'ikant-le-limited-runtime-seal/v2',claim_class:'IKANT_RUNTIME_LIMITED',capability_receipt_sha256:capability.receipt_sha256,activation_projection_sha256:activationProjectionSha,input_sha256:inputSha,output_sha256:outputSha,node_dispatch_receipt_sha256:nodeDispatch.receipt_sha256,first_unclosed_edge:'ACTIVE_READBACK',active:false,canonical_state_mutation:false,authority:0};
 const runtimeSeal={...sealMaterial,seal_sha256:sha256(Buffer.from(JSON.stringify(sealMaterial)))};
 const checks={capability_valid:cv.ok,dispatch_valid:dv.ok,surface_valid:surfaceValidation.ok,runtime_seal_bound:digestWithout(runtimeSeal,'seal_sha256')===runtimeSeal.seal_sha256,artifact_sink_ready:capability.artifact_sink_ready===true,no_canonical_state_mutation:true,no_platform_ack_claim:true,activation_edge_bound:capability.first_unclosed_edge==='ACTIVE_READBACK'};
 const passed=Object.values(checks).filter(Boolean).length,applicable=Object.keys(checks).length;
 const telemetryMaterial={schema:'ikant-le-limited-runtime-telemetry/v2',scope:'RUNTIME_BOUND_LIMITED',claim_class:'IKANT_RUNTIME_LIMITED',source_head:capability.source_head,runtime_root_sha256:capability.runtime_root_sha256,acceptance_event_id:capability.acceptance_event_id,capability_receipt_sha256:capability.receipt_sha256,activation_tier:activation.tier,first_unclosed_edge:activation.first_unclosed_edge,input_sha256:inputSha,output_sha256:outputSha,node_dispatch_receipt_sha256:nodeDispatch.receipt_sha256,runtime_seal_sha256:runtimeSeal.seal_sha256,checks,completeness:{passed,applicable,ratio:applicable?passed/applicable:0,complete:applicable>0&&passed===applicable},docx_write_readback_required:true,platform_ack_required:false,host_delivery_proven:false,canonical_state_mutation:false,active:false,persisted:false,authority:0};
 const telemetry={...telemetryMaterial,telemetry_sha256:sha256(Buffer.from(JSON.stringify(telemetryMaterial)))};if(!telemetry.completeness.complete)throw new Error('FAILURE: limited telemetry incomplete');
 const turnIdentitySha=sha256(Buffer.from(JSON.stringify({capability_receipt_sha256:capability.receipt_sha256,node_dispatch_receipt_sha256:nodeDispatch.receipt_sha256,input_sha256:inputSha,output_sha256:outputSha,runtime_seal_sha256:runtimeSeal.seal_sha256})));
 const backlog={schema:'ikant-le-limited-backlog/v2',title:'iKant_LE Runtime-Limited Backlog',cycle:1,terminal:'LIMITED_OUTPUT_CLOSED',sections:[
  {title:'Activation tier',items:['Tier: RUNTIME_BOUND_LIMITED; ACTIVE: false; claim class: IKANT_RUNTIME_LIMITED.','First unclosed constitutional edge: ACTIVE_READBACK.']},
  {title:'Source and runtime binding',items:[`Source head: ${capability.source_head}.`,`Runtime root: ${capability.runtime_root_sha256}.`,`Capability receipt: ${capability.receipt_sha256}.`]},
  {title:'Human input binding',items:[`Input SHA-256: ${inputSha}.`,`Runtime-owned Node dispatch receipt: ${nodeDispatch.receipt_sha256}.`]},
  {title:'Runtime output binding',items:[`Output SHA-256: ${outputSha}.`,`Runtime seal: ${runtimeSeal.seal_sha256}.`]},
  {title:'Bounded telemetry',items:[`Telemetry SHA-256: ${telemetry.telemetry_sha256}.`,`Completeness: ${passed}/${applicable}; ratio: ${telemetry.completeness.ratio}.`]},
  {title:'State boundary',items:['Canonical lifecycle/ledger state mutated: false.','The limited envelope cannot promote itself to ACTIVE.']},
  {title:'Delivery boundary',items:['Platform delivery ACK required for limited closure: false.','Host delivery proven: false. Artifact atomic publish/readback is the limited-envelope witness.']},
  {title:'Public output',items:[surfaceA]}
 ]};
 const artifactName=`iKant_LE_Limited_${turnIdentitySha}.docx`,artifactPath=path.join(artifactDir,artifactName),docx=writeBacklogDocxAtomic(artifactPath,backlog);
 const descriptorBase={schema:'ikant-le-limited-artifact/v2',kind:'LIMITED_BACKLOG_DOCX',name:artifactName,turn_identity_sha256:turnIdentitySha,media_type:docx.media_type,bytes:docx.bytes,sha256:docx.sha256,readback_verified:docx.readback_verified,atomic_publish:docx.atomic_publish===true,same_turn:true,download_handoff:true,required_presentation:false,host_delivery_proven:false,authority:0};
 const artifact={...descriptorBase,descriptor_sha256:descriptorDigest(descriptorBase),local_path:artifactPath};
 const closure=assessLimitedTurnClosure({blocked_integrity:false,activation_tier:'RUNTIME_BOUND_LIMITED',writer:docx.atomic_publish===true,node_dispatch:dv.ok,runtime_seal:digestWithout(runtimeSeal,'seal_sha256')===runtimeSeal.seal_sha256,docx_written:docx.bytes>0,docx_readback:docx.readback_verified===true,telemetry_complete:telemetry.completeness.complete===true,structured_handoff:artifact.download_handoff===true,exact_delivery_ack_claimed:false,canonical_state_mutation:false});
 const closureValidation=validateLimitedTurnClosure(closure);if(!closureValidation.ok||closure.closed!==true)throw new Error('FAILURE: limited runtime turn closure did not validate');
 const receiptMaterial={schema:'ikant-le-limited-turn-receipt/v2',claim_class:'IKANT_RUNTIME_LIMITED',source_head:capability.source_head,runtime_root_sha256:capability.runtime_root_sha256,acceptance_event_id:capability.acceptance_event_id,capability_receipt_sha256:capability.receipt_sha256,turn_identity_sha256:turnIdentitySha,activation_projection_sha256:activationProjectionSha,input_sha256:inputSha,output_sha256:outputSha,node_dispatch_receipt_sha256:nodeDispatch.receipt_sha256,runtime_seal_sha256:runtimeSeal.seal_sha256,telemetry_sha256:telemetry.telemetry_sha256,artifact_descriptor_sha256:artifact.descriptor_sha256,artifact_sha256:artifact.sha256,first_unclosed_edge:'ACTIVE_READBACK',closed:true,active:false,canonical_state_mutation:false,platform_ack_required:false,host_delivery_proven:false,authority:0};
 const receipt={...receiptMaterial,receipt_sha256:sha256(Buffer.from(JSON.stringify(receiptMaterial)))};
 const shell=buildSessionShell({surfaceText:surfaceA,state:{},events:[],artifacts:[artifact],activation,mode:'IKANT_RUNTIME_LIMITED',environmentTelemetry:telemetry,code:0});const sv=validateSessionShell(shell);if(!sv.ok)throw new Error('FAILURE: limited session shell invalid ('+sv.errors.join(',')+')');
 return{stdout:renderSessionShell(shell),code:0,state:'RUNTIME_BOUND_LIMITED',mode:'IKANT_RUNTIME_LIMITED',active:false,artifacts:[artifact],activation,node_dispatch:nodeDispatch,runtime_seal:runtimeSeal,telemetry,closure,receipt,session_shell:shell};
}
