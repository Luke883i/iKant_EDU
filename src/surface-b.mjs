import fs from 'node:fs';
import { readSurfaceBDelivery,sha256 } from './contract.mjs';
const K=readSurfaceBDelivery();
const UNKNOWN='UNAVAILABLE';
export const ENVIRONMENT_CATEGORIES=Object.freeze([...K.environment_telemetry.required_categories]);
function present(v){return v===null||v===undefined||v===''?UNKNOWN:v;}
function digestWithout(value,field){const copy={...value};delete copy[field];return sha256(Buffer.from(JSON.stringify(copy)));}
export function buildEnvironmentTelemetry({state,nodeDispatch,cognition,selfWorld}){
  const resources=(cognition?.resources||[]).map(x=>({type:x.type,status:x.status}));
  const categories={
    constitutional_binding:{fingerprint:present(state?.bootstrap?.fingerprint),terms_digest_bound:Boolean(state?.terms_digest)},
    admission:{status:present(state?.status),phase:present(state?.admission?.phase),accepted:Boolean(state?.accepted),initialized:Boolean(state?.initialized)},
    runtime_host:{node:present(nodeDispatch?.node),node_major:present(nodeDispatch?.node_major),host_surface:present(nodeDispatch?.host_surface),node20_plus:Boolean(nodeDispatch?.node20_plus)},
    persistence:{ledger:'HASH_LINKED',writer_lock:'HELD',state_readback:'REQUIRED',single_writer:true},
    artifact_sink:{available:Boolean(state?.bootstrap?.probe?.artifact_sink),format:'DOCX',write_readback_required:true},
    dispatch:{receipt_sha256:present(nodeDispatch?.receipt_sha256),input_sha256:present(nodeDispatch?.input_sha256)},
    resources:{items:resources,unresolved:resources.filter(x=>x.status!=='GRANTED').map(x=>x.type)},
    self_world:{telemetry_ratio:selfWorld?.telemetry?.ratio??0,telemetry_complete:Boolean(selfWorld?.telemetry?.complete),recurrence_cycles:selfWorld?.workspace?.recurrence_cycles??UNKNOWN,modalities:selfWorld?.binding?.modalities||[]},
    release:{surface_b_required:true,structured_artifact_handoff_required:true,same_turn_host_presentation_required:true,filename_only_is_delivery:false}
  };
  const keys=Object.keys(categories),passed=ENVIRONMENT_CATEGORIES.filter(x=>keys.includes(x)&&categories[x]!==undefined).length;
  return{schema:'ikant-le-runtime-environment-telemetry/v1',scope:'DECLARED_BOUNDED_RUNTIME_ENVIRONMENT',categories,explicit_unknowns:true,completeness:{passed,applicable:ENVIRONMENT_CATEGORIES.length,ratio:Number((passed/ENVIRONMENT_CATEGORIES.length).toFixed(6)),target:K.environment_telemetry.completeness_target,complete:passed===ENVIRONMENT_CATEGORIES.length},process_env_dumped:false,secrets_dumped:false,private_reasoning_dumped:false,authority:0};
}
export function validateEnvironmentTelemetry(t){const keys=Object.keys(t?.categories||{});return t?.schema==='ikant-le-runtime-environment-telemetry/v1'&&t.authority===0&&t.scope==='DECLARED_BOUNDED_RUNTIME_ENVIRONMENT'&&t.explicit_unknowns===true&&t.completeness?.ratio===1&&t.completeness?.complete===true&&t.process_env_dumped===false&&t.secrets_dumped===false&&t.private_reasoning_dumped===false&&keys.length===ENVIRONMENT_CATEGORIES.length&&ENVIRONMENT_CATEGORIES.every(x=>Object.prototype.hasOwnProperty.call(t.categories||{},x));}
export function buildArtifactDescriptor(filePath,name,docx){const bytes=fs.readFileSync(filePath),digest=sha256(bytes);if(docx?.readback_verified!==true||digest!==docx?.sha256||bytes.length!==docx?.bytes)throw new Error('FAILURE: Surface B artifact descriptor cannot bind unverified bytes');const d={schema:'ikant-le-artifact-descriptor/v1',kind:'SURFACE_B_DOCX',name:String(name),path:String(filePath),media_type:K.artifact.media_type,bytes:bytes.length,sha256:digest,readback_verified:true,required_presentation:true,same_turn:true,authority:0};return{...d,descriptor_sha256:sha256(Buffer.from(JSON.stringify(d)))}}
export function validateArtifactDescriptor(d){if(d?.schema!=='ikant-le-artifact-descriptor/v1'||d.kind!=='SURFACE_B_DOCX'||d.media_type!==K.artifact.media_type||d.readback_verified!==true||d.required_presentation!==true||d.same_turn!==true||d.authority!==0||!Number.isInteger(d.bytes)||d.bytes<=0||!/^[a-f0-9]{64}$/.test(d.sha256||'')||!/^[a-f0-9]{64}$/.test(d.descriptor_sha256||'')||digestWithout(d,'descriptor_sha256')!==d.descriptor_sha256)return false;try{const bytes=fs.readFileSync(d.path);return bytes.length===d.bytes&&sha256(bytes)===d.sha256}catch{return false}}
export function buildReleaseEnvelope(artifact,environmentTelemetry){const e={schema:'ikant-le-host-release/v1',surface_b_required:true,artifact_count:1,required_artifact_descriptor_sha256:artifact.descriptor_sha256,host_presentation_required:true,host_must_present_before_surface_a_release:true,filename_only_is_delivery:false,runtime_observed_ui_presentation:false,environment_telemetry_completeness:environmentTelemetry.completeness.ratio,authority:0};return{...e,release_sha256:sha256(Buffer.from(JSON.stringify(e)))}}
export function validateReleaseEnvelope(e,artifact,environmentTelemetry){return e?.schema==='ikant-le-host-release/v1'&&e.surface_b_required===true&&e.artifact_count===1&&e.required_artifact_descriptor_sha256===artifact?.descriptor_sha256&&e.host_presentation_required===true&&e.host_must_present_before_surface_a_release===true&&e.filename_only_is_delivery===false&&e.runtime_observed_ui_presentation===false&&e.environment_telemetry_completeness===1&&e.authority===0&&/^[a-f0-9]{64}$/.test(e.release_sha256||'')&&digestWithout(e,'release_sha256')===e.release_sha256&&validateArtifactDescriptor(artifact)&&validateEnvironmentTelemetry(environmentTelemetry)}
