import crypto from 'node:crypto';

export const FASTBOOT_CONVERGENCE_SCHEMA='ikant-le-fastboot-convergence/v1';
export const FASTBOOT_ATTEMPT_SCHEMA='ikant-le-fastboot-carrier-attempt/v1';
export const FASTBOOT_MACHINE_CARRIERS=Object.freeze(['WARM_CACHE_EXACT','GITHUB_API_BASE64','GITHUB_GIT_BLOB_API','PINNED_GITHUB_ZIP','PINNED_PERMALINK']);
export const FASTBOOT_HUMAN_LAST_RESORT='HOST_FILE_BRIDGE';
export const FASTBOOT_CARRIERS=Object.freeze([...FASTBOOT_MACHINE_CARRIERS,FASTBOOT_HUMAN_LAST_RESORT]);
export const FASTBOOT_CAPABILITY_FIELDS=Object.freeze([
  'surface_supported','authenticated_source_fetch','byte_preserving_runtime_sink','runtime_materializer_bound','runtime_executor_bound'
]);
const HEX40=/^[a-f0-9]{40}$/;
const HEX64=/^[a-f0-9]{64}$/;
const sha256=x=>crypto.createHash('sha256').update(Buffer.from(typeof x==='string'?x:JSON.stringify(x))).digest('hex');
function withoutDigest(value){const x=structuredClone(value||{});delete x.receipt_sha256;return x;}
export function fastbootReceiptDigest(value){return sha256(withoutDigest(value));}
function uniq(a){return [...new Set(a)];}
function expectedObjects(d){return [{path:d?.loader?.path,blob_sha1:d?.loader?.blob_sha1},...(d?.shards||[]).map(s=>({path:s.path,blob_sha1:s.blob_sha1}))];}
function capState(value){
 if(value===true)return 'PROVEN';
 if(value===false)return 'UNAVAILABLE';
 if(!value||typeof value!=='object')return 'UNKNOWN';
 let unknown=false;
 for(const k of FASTBOOT_CAPABILITY_FIELDS){if(value[k]===false)return 'UNAVAILABLE';if(value[k]!==true)unknown=true;}
 return unknown?'UNKNOWN':'PROVEN';
}
export function selectFastbootCarrier({capabilities={},attemptedClasses=[]}={}){
 const attempted=new Set((attemptedClasses||[]).map(String));
 const executable=carriers=>{for(const carrier of carriers){if(attempted.has(carrier))continue;if(capState(capabilities?.[carrier])==='PROVEN')return{schema:'ikant-le-fastboot-plan/v1',state:'EXECUTABLE',carrier,action:'EXECUTE_CARRIER_IN_RUNTIME_EXECUTION_PLANE',authority:0};}return null;};
 const probe=carriers=>{for(const carrier of carriers){if(attempted.has(carrier)||attempted.has('PROBE:'+carrier))continue;if(capState(capabilities?.[carrier])==='UNKNOWN')return{schema:'ikant-le-fastboot-plan/v1',state:'PROBE_REQUIRED',carrier,action:'PROBE_RUNTIME_EXECUTION_PLANE_EDGE',next_attempt_class:'PROBE:'+carrier,authority:0};}return null;};
 return executable(FASTBOOT_MACHINE_CARRIERS)||probe(FASTBOOT_MACHINE_CARRIERS)||executable([FASTBOOT_HUMAN_LAST_RESORT])||probe([FASTBOOT_HUMAN_LAST_RESORT])||{schema:'ikant-le-fastboot-plan/v1',state:'EXHAUSTED',carrier:null,action:'HOST_UNAVAILABLE',authority:0};
}
export function validateFastbootAttempt(attempt,{sourceHead,runtimeRootSha256,runtimeRootDescriptor,acceptanceEventId,maxObjects=8}={}){
 const e=[];
 if(!attempt||attempt.schema!==FASTBOOT_ATTEMPT_SCHEMA)e.push('schema');
 if(attempt?.authority!==0)e.push('authority');
 if(!FASTBOOT_CARRIERS.includes(attempt?.carrier))e.push('carrier');
 if(attempt?.source_head!==sourceHead||!HEX40.test(String(sourceHead||'')))e.push('source_head');
 if(attempt?.runtime_root_sha256!==runtimeRootSha256||!HEX64.test(String(runtimeRootSha256||'')))e.push('runtime_root');
 if(attempt?.acceptance_event_id!==acceptanceEventId||!String(acceptanceEventId||''))e.push('acceptance_event');
 if(!['FAILED','PARTIAL','COMPLETE'].includes(attempt?.result))e.push('result');
 if(attempt?.model_mediated_bytes!==false)e.push('model_mediated_bytes');
 if(attempt?.authoritative_remote_history!==false)e.push('authoritative_history');
 if(attempt?.committed_remote_rounds!==0)e.push('committed_remote_rounds');
 if(!Number.isInteger(attempt?.remote_reads)||attempt.remote_reads<0)e.push('remote_reads');
 if(!Number.isInteger(attempt?.bytes_observed)||attempt.bytes_observed<0)e.push('bytes_observed');
 const exp=new Map(expectedObjects(runtimeRootDescriptor).map(x=>[x.path,x]));
 const rows=Array.isArray(attempt?.remote_objects)?attempt.remote_objects:[];
 if(exp.size<2||exp.size>maxObjects)e.push('descriptor');
 if(rows.length>exp.size)e.push('object_count');
 const seen=new Set();
 for(const r of rows){const x=exp.get(r?.path);if(!x||seen.has(r.path)){e.push('object_set');continue;}seen.add(r.path);if(r.blob_sha1!==x.blob_sha1||!HEX64.test(String(r.sha256||''))||!Number.isInteger(r.bytes)||r.bytes<1)e.push('object_identity');}
 if(attempt?.result==='PARTIAL'&&(rows.length<1||rows.length>=exp.size))e.push('partial_cardinality');
 if(attempt?.result==='FAILED'&&rows.length>=exp.size)e.push('failed_cardinality');
 if(attempt?.result==='COMPLETE'){
   if(rows.length!==exp.size)e.push('complete_cardinality');
   if(attempt?.source_fetch_observed!==true)e.push('source_fetch_observed');
   if(attempt?.byte_preserving_runtime_sink_observed!==true)e.push('runtime_sink_observed');
   if(attempt?.runtime_materializer_bound!==true)e.push('materializer_bound');
   if(attempt?.runtime_executor_bound!==true)e.push('executor_bound');
   if(!String(attempt?.source_object_identity||''))e.push('source_object_identity');
   if(!String(attempt?.runtime_sink_object_id||''))e.push('runtime_sink_object_id');
   if(!HEX64.test(String(attempt?.transfer_receipt_sha256||'')))e.push('transfer_receipt');
 }else{
   if(attempt?.transfer_receipt_sha256!=null)e.push('premature_transfer_receipt');
 }
 if(!HEX64.test(String(attempt?.receipt_sha256||''))||fastbootReceiptDigest(attempt)!==attempt.receipt_sha256)e.push('receipt_digest');
 return{ok:e.length===0,errors:uniq(e),complete:e.length===0&&attempt?.result==='COMPLETE',carrier:attempt?.carrier||null,receipt_sha256:attempt?.receipt_sha256||null};
}
export function validateFastbootConvergence(receipt,{sourceHead,runtimeRootSha256,runtimeRootDescriptor,acceptanceEventId,transferReceiptSha256,maxAttempts=FASTBOOT_CARRIERS.length}={}){
 const e=[];
 if(!receipt||receipt.schema!==FASTBOOT_CONVERGENCE_SCHEMA)e.push('schema');
 if(receipt?.authority!==0)e.push('authority');
 if(receipt?.source_head!==sourceHead||!HEX40.test(String(sourceHead||'')))e.push('source_head');
 if(receipt?.runtime_root_sha256!==runtimeRootSha256||!HEX64.test(String(runtimeRootSha256||'')))e.push('runtime_root');
 if(receipt?.acceptance_event_id!==acceptanceEventId||!String(acceptanceEventId||''))e.push('acceptance_event');
 if(receipt?.acceptance_preserved!==true)e.push('acceptance_preserved');
 if(receipt?.source_preserved!==true)e.push('source_preserved');
 if(receipt?.deadline_origin_preserved!==true)e.push('deadline_origin_preserved');
 if(receipt?.model_mediated_bytes!==false)e.push('model_mediated_bytes');
 if(receipt?.remote_history_commits!==1)e.push('remote_history_commits');
 const attempts=Array.isArray(receipt?.attempts)?receipt.attempts:[];
 if(attempts.length<1||attempts.length>maxAttempts)e.push('attempt_count');
 const carriers=new Set();let completeIndex=-1,completeCount=0,complete=null;
 for(let i=0;i<attempts.length;i++){
   const a=attempts[i],v=validateFastbootAttempt(a,{sourceHead,runtimeRootSha256,runtimeRootDescriptor,acceptanceEventId});
   if(!v.ok)e.push(...v.errors.map(x=>'attempt:'+i+':'+x));
   if(carriers.has(a?.carrier))e.push('materially_distinct_retry');else carriers.add(a?.carrier);
   if(a?.result==='COMPLETE'){completeIndex=i;completeCount++;complete=a;}
 }
 if(completeCount!==1)e.push('complete_attempt_count');
 if(completeIndex!==attempts.length-1)e.push('complete_attempt_must_be_last');
 if(attempts.length>1&&receipt?.materially_distinct_retry!==true)e.push('retry_binding');
 if(attempts.length===1&&receipt?.materially_distinct_retry!==false)e.push('retry_binding');
 if(complete?.carrier!==receipt?.selected_carrier)e.push('selected_carrier');
 if(complete?.transfer_receipt_sha256!==transferReceiptSha256||receipt?.committed_transfer_receipt_sha256!==transferReceiptSha256||!HEX64.test(String(transferReceiptSha256||'')))e.push('transfer_commit_binding');
 if(!HEX64.test(String(receipt?.receipt_sha256||''))||fastbootReceiptDigest(receipt)!==receipt.receipt_sha256)e.push('receipt_digest');
 return{ok:e.length===0,errors:uniq(e),attempt_count:attempts.length,selected_carrier:receipt?.selected_carrier||null,committed_transfer_receipt_sha256:receipt?.committed_transfer_receipt_sha256||null};
}

// C21.LOCAL_SESSION_FASTBOOT_CONVERGENCE
export const FASTBOOT_CAPABILITY_RECEIPT_SCHEMA='ikant-le-fastboot-capability-receipt/v1';
export const FASTBOOT_CHANNEL_LEDGER_SCHEMA='ikant-le-fastboot-channel-ledger/v1';
export const FASTBOOT_STEP_SCHEMA='ikant-le-fastboot-step/v1';
export const FASTBOOT_OBSERVATION_TRANSITION_SCHEMA='ikant-le-fastboot-observation-transition/v1';
export const FASTBOOT_BYTE_BRIDGE_SCHEMA='ikant-le-fastboot-byte-bridge/v2';
export const LOCAL_SESSION_ACTIVATION_MODALITY='SESSION_CHAT_LOCAL';
export const FASTBOOT_CHANNEL_STATES=Object.freeze(['UNKNOWN','AVAILABLE','UNAVAILABLE']);
function capabilityVector(value){const out={};for(const k of FASTBOOT_CAPABILITY_FIELDS)out[k]=value?.[k]===true;return out;}
export function issueFastbootCapabilityReceipt({carrier,status,capabilities={},evidence,probeOwner,operationId,sourceHead}={}){
 const c=String(carrier||''),s=String(status||'').toUpperCase(),owner=String(probeOwner||'').trim(),op=String(operationId||'').trim(),head=String(sourceHead||'').toLowerCase();
 if(!FASTBOOT_CARRIERS.includes(c))throw new Error('fastboot carrier invalid');
 if(!['AVAILABLE','UNAVAILABLE'].includes(s))throw new Error('fastboot capability status invalid');
 if(!owner||!op)throw new Error('host-attested probe owner/operation required');
 if(!HEX40.test(head))throw new Error('source head invalid');
 const raw=Buffer.isBuffer(evidence)?evidence:Buffer.from(String(evidence??''));if(!raw.length)throw new Error('host-attested evidence required');
 const vector=capabilityVector(capabilities),derived=capState(vector);
 if(s==='AVAILABLE'&&derived!=='PROVEN')throw new Error('AVAILABLE requires complete proven capability vector');
 if(s==='UNAVAILABLE'&&derived!=='UNAVAILABLE')throw new Error('UNAVAILABLE requires at least one mechanically false capability');
 const material={schema:FASTBOOT_CAPABILITY_RECEIPT_SCHEMA,activation_modality:LOCAL_SESSION_ACTIVATION_MODALITY,carrier:c,status:s,capabilities:vector,source_head:head,probe_owner:owner,operation_id:op,evidence_sha256:crypto.createHash('sha256').update(raw).digest('hex'),evidence_bytes:raw.length,observation_class:'HOST_ATTESTED',host_observed:true,physical_origin_proven:false,model_generated:false,authority:0};
 return{...material,receipt_sha256:sha256(material)};
}
export function validateFastbootCapabilityReceipt(receipt,{sourceHead=null}={}){
 const e=[],r=receipt||{};
 if(r.schema!==FASTBOOT_CAPABILITY_RECEIPT_SCHEMA)e.push('schema');
 if(r.activation_modality!==LOCAL_SESSION_ACTIVATION_MODALITY)e.push('activation_modality');
 if(!FASTBOOT_CARRIERS.includes(r.carrier))e.push('carrier');
 if(!['AVAILABLE','UNAVAILABLE'].includes(r.status))e.push('status');
 if(!HEX40.test(String(r.source_head||'')))e.push('source_head');
 if(sourceHead&&r.source_head!==String(sourceHead).toLowerCase())e.push('source_head_binding');
 if(!String(r.probe_owner||'')||!String(r.operation_id||''))e.push('origin');
 if(!HEX64.test(String(r.evidence_sha256||''))||!Number.isInteger(r.evidence_bytes)||r.evidence_bytes<1)e.push('evidence');
 if(r.observation_class!=='HOST_ATTESTED'||r.host_observed!==true||r.physical_origin_proven!==false||r.model_generated!==false||r.authority!==0)e.push('authority');
 const vector=capabilityVector(r.capabilities),derived=capState(vector);
 if(r.status==='AVAILABLE'&&derived!=='PROVEN')e.push('availability_vector');
 if(r.status==='UNAVAILABLE'&&derived!=='UNAVAILABLE')e.push('unavailability_vector');
 if(!HEX64.test(String(r.receipt_sha256||''))||sha256(withoutDigest(r))!==r.receipt_sha256)e.push('receipt_digest');
 return{ok:e.length===0,errors:uniq(e)};
}
export function buildFastbootChannelLedger({receipts=[],previous=null,sourceHead}={}){
 const head=String(sourceHead||'').toLowerCase();if(!HEX40.test(head))throw new Error('source head invalid');
 const channels=Object.fromEntries(FASTBOOT_CARRIERS.map(c=>[c,{status:'UNKNOWN',capabilities:{},evidence_receipt_sha256:null,evidence_sha256:null}]));
 let failures=[],accepted=[];
 if(previous){const pv=validateFastbootChannelLedger(previous,{sourceHead:head});if(!pv.ok)throw new Error('previous channel ledger invalid:'+pv.errors.join(','));for(const c of FASTBOOT_CARRIERS)channels[c]=structuredClone(previous.channels[c]);failures=structuredClone(previous.failed_decisions||[]);accepted=[...(previous.accepted_receipts||[])];}
 const batch=new Set();
 for(const r of receipts||[]){const v=validateFastbootCapabilityReceipt(r,{sourceHead:head});if(!v.ok)throw new Error('invalid capability receipt:'+v.errors.join(','));if(batch.has(r.carrier))throw new Error('duplicate carrier evidence in one ledger batch');batch.add(r.carrier);const prev=channels[r.carrier],nextVector=capabilityVector(r.capabilities);if(prev.status!=='UNKNOWN'&&prev.evidence_sha256===r.evidence_sha256&&(prev.status!==r.status||JSON.stringify(prev.capabilities)!==JSON.stringify(nextVector)))throw new Error('unchanged evidence cannot change channel state');channels[r.carrier]={status:r.status,capabilities:nextVector,evidence_receipt_sha256:r.receipt_sha256,evidence_sha256:r.evidence_sha256};accepted.push(r.receipt_sha256);}
 accepted=[...new Set(accepted)];const channelEvidence=sha256({activation_modality:LOCAL_SESSION_ACTIVATION_MODALITY,source_head:head,channels});
 const material={schema:FASTBOOT_CHANNEL_LEDGER_SCHEMA,activation_modality:LOCAL_SESSION_ACTIVATION_MODALITY,source_head:head,channels,channel_evidence_sha256:channelEvidence,failed_decisions:failures,accepted_receipts:accepted,capability_truth_owner:'HOST_ATTESTED_RECEIPTS',retry_memory_owner:'FASTBOOT_CHANNEL_LEDGER',failure_memory_scope:'CARRIER_LOCAL_CHANNEL_EVIDENCE',unrelated_channel_evidence_requalifies_failed_carrier:false,physical_origin_proven:false,raw_host_booleans_authoritative:false,registry_absence_implies_unavailable:false,unavailable_persists_until_changed_channel_evidence:true,model_selects_carrier:false,authority:0};
 return{...material,receipt_sha256:sha256(material)};
}
export function validateFastbootChannelLedger(ledger,{sourceHead=null}={}){
 const e=[],r=ledger||{};
 if(r.schema!==FASTBOOT_CHANNEL_LEDGER_SCHEMA)e.push('schema');
 if(r.activation_modality!==LOCAL_SESSION_ACTIVATION_MODALITY)e.push('activation_modality');
 if(!HEX40.test(String(r.source_head||'')))e.push('source_head');
 if(sourceHead&&r.source_head!==String(sourceHead).toLowerCase())e.push('source_head_binding');
 if(!r.channels||Object.keys(r.channels).length!==FASTBOOT_CARRIERS.length)e.push('channels');
 for(const c of FASTBOOT_CARRIERS){const row=r.channels?.[c];if(!row||!FASTBOOT_CHANNEL_STATES.includes(row.status))e.push('channel:'+c);if(row?.status==='AVAILABLE'&&capState(row.capabilities)!=='PROVEN')e.push('channel_available:'+c);if(row?.status==='UNAVAILABLE'&&capState(row.capabilities)!=='UNAVAILABLE')e.push('channel_unavailable:'+c);if(row?.status==='UNKNOWN'&&(row?.evidence_receipt_sha256!=null||row?.evidence_sha256!=null))e.push('channel_unknown_evidence:'+c);if(row?.status!=='UNKNOWN'&&(!HEX64.test(String(row?.evidence_receipt_sha256||''))||!HEX64.test(String(row?.evidence_sha256||''))))e.push('channel_evidence:'+c);}
 const expectedEvidence=sha256({activation_modality:LOCAL_SESSION_ACTIVATION_MODALITY,source_head:r.source_head,channels:r.channels});if(r.channel_evidence_sha256!==expectedEvidence)e.push('channel_evidence_digest');
 const failures=Array.isArray(r.failed_decisions)?r.failed_decisions:[];const seen=new Set();for(const f of failures){const key=String(f?.decision_key||'')+'|'+String(f?.carrier_evidence_sha256||'');if(!HEX64.test(String(f?.decision_key||''))||!HEX64.test(String(f?.evidence_sha256||''))||!HEX64.test(String(f?.carrier_evidence_sha256||''))||!FASTBOOT_CARRIERS.includes(f?.carrier)||seen.has(key))e.push('failure_memory');seen.add(key);}
 if(r.capability_truth_owner!=='HOST_ATTESTED_RECEIPTS'||r.retry_memory_owner!=='FASTBOOT_CHANNEL_LEDGER'||r.failure_memory_scope!=='CARRIER_LOCAL_CHANNEL_EVIDENCE'||r.unrelated_channel_evidence_requalifies_failed_carrier!==false||r.physical_origin_proven!==false||r.raw_host_booleans_authoritative!==false||r.registry_absence_implies_unavailable!==false||r.unavailable_persists_until_changed_channel_evidence!==true||r.model_selects_carrier!==false||r.authority!==0)e.push('authority');
 if(!HEX64.test(String(r.receipt_sha256||''))||sha256(withoutDigest(r))!==r.receipt_sha256)e.push('receipt_digest');
 return{ok:e.length===0,errors:uniq(e)};
}
function ledgerCapabilities(ledger){const out={};for(const c of FASTBOOT_CARRIERS){const row=ledger.channels[c];out[c]=row.status==='AVAILABLE'?structuredClone(row.capabilities):row.status==='UNAVAILABLE'?false:{};}return out;}
function carrierEvidenceEpoch(ledger,carrier){if(!FASTBOOT_CARRIERS.includes(carrier))return null;return sha256({activation_modality:LOCAL_SESSION_ACTIVATION_MODALITY,source_head:ledger?.source_head||null,carrier,channel:ledger?.channels?.[carrier]||null});}
function failedCarriersForCurrentEvidence(ledger){return uniq((ledger?.failed_decisions||[]).filter(x=>FASTBOOT_CARRIERS.includes(x?.carrier)&&x?.carrier_evidence_sha256===carrierEvidenceEpoch(ledger,x.carrier)).map(x=>x.carrier));}
export function deriveFastbootAttemptedClasses(ledger,{attemptedClasses=[]}={}){if((attemptedClasses||[]).length)throw new Error('caller attempted classes forbidden; ledger owns retry memory');const v=validateFastbootChannelLedger(ledger,{sourceHead:ledger?.source_head});if(!v.ok)throw new Error('fastboot channel ledger invalid:'+v.errors.join(','));return failedCarriersForCurrentEvidence(ledger);}
export function deriveFastbootStep({ledger,attemptedClasses=[],runtimeRootSha256}={}){
 if((attemptedClasses||[]).length)throw new Error('caller attempted classes forbidden; ledger owns retry memory');
 const v=validateFastbootChannelLedger(ledger,{sourceHead:ledger?.source_head});if(!v.ok)return{schema:FASTBOOT_STEP_SCHEMA,state:'BLOCKED',action:'BLOCK',blocker:'CHANNEL_LEDGER_INVALID',errors:v.errors,one_next:true,one_executor:true,retry_allowed:false,authority:0};
 if(!HEX64.test(String(runtimeRootSha256||'')))return{schema:FASTBOOT_STEP_SCHEMA,state:'BLOCKED',action:'BLOCK',blocker:'RUNTIME_ROOT_INVALID',one_next:true,one_executor:true,retry_allowed:false,authority:0};
 const effectiveAttempts=deriveFastbootAttemptedClasses(ledger),plan=selectFastbootCarrier({capabilities:ledgerCapabilities(ledger),attemptedClasses:effectiveAttempts});
 const carrierEvidenceSha=plan.carrier?carrierEvidenceEpoch(ledger,plan.carrier):null,decisionMaterial={activation_modality:LOCAL_SESSION_ACTIVATION_MODALITY,source_head:ledger.source_head,runtime_root_sha256:runtimeRootSha256,plan_state:plan.state,carrier:plan.carrier,plan_action:plan.action};
 const decisionKey=sha256(decisionMaterial),evidenceSha=ledger.channel_evidence_sha256;
 const repeated=(ledger.failed_decisions||[]).some(x=>x?.decision_key===decisionKey&&x?.carrier_evidence_sha256===carrierEvidenceSha);
 let action,next,blocker=null,retry=true;
 if(repeated){action='WAIT_CHANGED_EVIDENCE';next='WAIT_CHANGED_EVIDENCE';blocker='UNCHANGED_DECISION_EVIDENCE_DO_NOT_RETRY';retry=false;}
 else if(plan.state==='EXECUTABLE'){action='EXECUTE_CANONICAL_CARRIER';next='EXECUTE:'+plan.carrier;}
 else if(plan.state==='PROBE_REQUIRED'){action='PROBE_CANONICAL_CARRIER';next='PROBE:'+plan.carrier;}
 else{action='HOST_UNAVAILABLE';next='HOST_UNAVAILABLE';blocker='ALL_CANONICAL_CARRIERS_EXHAUSTED';retry=false;}
 const material={schema:FASTBOOT_STEP_SCHEMA,activation_modality:LOCAL_SESSION_ACTIVATION_MODALITY,execution_owner:'PRE_RUNTIME_HOST_ADAPTER',runtime_self_bootstrap:false,source_head:ledger.source_head,runtime_root_sha256:runtimeRootSha256,state:plan.state,action,canonical_next:next,first_unclosed_edge:'LOCAL_INGRESS',canonical_carrier:plan.carrier,decision_key:decisionKey,evidence_sha256:evidenceSha,carrier_evidence_sha256:carrierEvidenceSha,retry_allowed:retry,blocker,one_next:true,one_executor:true,model_selects_carrier:false,model_selects_fallback:false,side_infrastructure_forbidden:true,authority:0};
 return{...material,receipt_sha256:sha256(material)};
}
export function recordFastbootFailure(ledger,step){
 const lv=validateFastbootChannelLedger(ledger,{sourceHead:ledger?.source_head}),sv=validateFastbootStep(step,{sourceHead:ledger?.source_head,runtimeRootSha256:step?.runtime_root_sha256,ledger});
 if(!lv.ok||!sv.ok)throw new Error('cannot record invalid fastboot failure');
 if(step.action!=='EXECUTE_CANONICAL_CARRIER'&&step.action!=='PROBE_CANONICAL_CARRIER')throw new Error('only executable/probe steps can fail');
 const next=structuredClone(ledger),row={decision_key:step.decision_key,evidence_sha256:step.evidence_sha256,carrier_evidence_sha256:step.carrier_evidence_sha256,carrier:step.canonical_carrier};
 if(!(next.failed_decisions||[]).some(x=>x.decision_key===row.decision_key&&x.carrier_evidence_sha256===row.carrier_evidence_sha256))next.failed_decisions=[...(next.failed_decisions||[]),row];
 delete next.receipt_sha256;return{...next,receipt_sha256:sha256(next)};
}
function transitionHandoffMaterial(h){return h==null?null:{owner:h.owner,action:h.action,attempt_receipt_sha256:h.attempt_receipt_sha256,active_claim:h.active_claim,authority:h.authority};}
function observationTransitionMaterial(x){return{schema:x.schema,activation_modality:x.activation_modality,source_head:x.source_head,runtime_root_sha256:x.runtime_root_sha256,observation_schema:x.observation_schema,observation_receipt_sha256:x.observation_receipt_sha256,from_ledger_receipt_sha256:x.from_ledger_receipt_sha256,to_ledger_receipt_sha256:x.to_ledger_receipt_sha256,current_step_receipt_sha256:x.current_step_receipt_sha256,next_step_receipt_sha256:x.next_step_receipt_sha256,disposition:x.disposition,handoff_owner:x.handoff_owner,handoff:transitionHandoffMaterial(x.handoff),active_claim:x.active_claim,authority:x.authority};}
export function fastbootObservationTransitionDigest(value){return sha256(observationTransitionMaterial(value||{}));}
export function advanceFastbootObservation({ledger,runtimeRootSha256,observation,runtimeRootDescriptor=null,acceptanceEventId=null}={}){
 const lv=validateFastbootChannelLedger(ledger,{sourceHead:ledger?.source_head});if(!lv.ok)throw new Error('fastboot channel ledger invalid:'+lv.errors.join(','));
 if(!HEX64.test(String(runtimeRootSha256||'')))throw new Error('runtime root invalid');
 const step=deriveFastbootStep({ledger,runtimeRootSha256});if(!validateFastbootStep(step,{sourceHead:ledger.source_head,runtimeRootSha256,ledger}).ok)throw new Error('canonical fastboot step invalid');
 let nextLedger=ledger,nextStep=null,handoff=null,disposition=null;
 if(observation?.schema===FASTBOOT_CAPABILITY_RECEIPT_SCHEMA){
   if(step.action!=='PROBE_CANONICAL_CARRIER')throw new Error('capability receipt requires canonical probe step');
   const ov=validateFastbootCapabilityReceipt(observation,{sourceHead:ledger.source_head});if(!ov.ok)throw new Error('capability receipt invalid:'+ov.errors.join(','));
   if(observation.carrier!==step.canonical_carrier)throw new Error('capability receipt carrier mismatch');
   nextLedger=buildFastbootChannelLedger({previous:ledger,receipts:[observation],sourceHead:ledger.source_head});
   nextStep=deriveFastbootStep({ledger:nextLedger,runtimeRootSha256});disposition='PROBE_EVIDENCE_ACCEPTED';
 }else if(observation?.schema===FASTBOOT_ATTEMPT_SCHEMA){
   if(step.action!=='EXECUTE_CANONICAL_CARRIER')throw new Error('carrier attempt requires canonical execute step');
   const ov=validateFastbootAttempt(observation,{sourceHead:ledger.source_head,runtimeRootSha256,runtimeRootDescriptor,acceptanceEventId});if(!ov.ok)throw new Error('carrier attempt invalid:'+ov.errors.join(','));
   if(observation.carrier!==step.canonical_carrier)throw new Error('carrier attempt mismatch');
   if(observation.result==='COMPLETE'){disposition='HANDOFF_PRE_RUNTIME';handoff={owner:'PRE_RUNTIME_HOST_ADAPTER',action:'EXECUTE_PRE_RUNTIME_BOOTSTRAP',attempt_receipt_sha256:observation.receipt_sha256,active_claim:false,authority:0};}
   else{nextLedger=recordFastbootFailure(ledger,step);nextStep=deriveFastbootStep({ledger:nextLedger,runtimeRootSha256});disposition='DISTINCT_RETRY_REQUIRED';}
 }else throw new Error('typed fastboot observation required');
 const material={schema:FASTBOOT_OBSERVATION_TRANSITION_SCHEMA,activation_modality:LOCAL_SESSION_ACTIVATION_MODALITY,source_head:ledger.source_head,runtime_root_sha256:runtimeRootSha256,observation_schema:observation.schema,observation_receipt_sha256:observation.receipt_sha256,from_ledger_receipt_sha256:ledger.receipt_sha256,to_ledger_receipt_sha256:nextLedger.receipt_sha256,current_step_receipt_sha256:step.receipt_sha256,next_step_receipt_sha256:nextStep?.receipt_sha256??null,disposition,handoff_owner:handoff?.owner??null,handoff:transitionHandoffMaterial(handoff),active_claim:false,authority:0};
 return{...material,ledger:structuredClone(nextLedger),next_step:nextStep?structuredClone(nextStep):null,receipt_sha256:fastbootObservationTransitionDigest(material)};
}
export function validateFastbootObservationTransition(value,{sourceHead=null,runtimeRootSha256=null}={}){
 const r=value||{},e=[];if(r.schema!==FASTBOOT_OBSERVATION_TRANSITION_SCHEMA)e.push('schema');if(r.activation_modality!==LOCAL_SESSION_ACTIVATION_MODALITY)e.push('activation_modality');if(!HEX40.test(String(r.source_head||''))||(sourceHead&&r.source_head!==String(sourceHead).toLowerCase()))e.push('source_head');if(!HEX64.test(String(r.runtime_root_sha256||''))||(runtimeRootSha256&&r.runtime_root_sha256!==runtimeRootSha256))e.push('runtime_root');
 if(![FASTBOOT_CAPABILITY_RECEIPT_SCHEMA,FASTBOOT_ATTEMPT_SCHEMA].includes(r.observation_schema)||!HEX64.test(String(r.observation_receipt_sha256||''))||!HEX64.test(String(r.from_ledger_receipt_sha256||''))||!HEX64.test(String(r.to_ledger_receipt_sha256||''))||!HEX64.test(String(r.current_step_receipt_sha256||'')))e.push('binding');
 if(r.next_step_receipt_sha256!==null&&!HEX64.test(String(r.next_step_receipt_sha256||'')))e.push('next_step');if(!['PROBE_EVIDENCE_ACCEPTED','DISTINCT_RETRY_REQUIRED','HANDOFF_PRE_RUNTIME'].includes(r.disposition))e.push('disposition');const handoff=r.handoff;if(r.disposition==='HANDOFF_PRE_RUNTIME'){if(r.observation_schema!==FASTBOOT_ATTEMPT_SCHEMA||r.handoff_owner!=='PRE_RUNTIME_HOST_ADAPTER'||handoff?.owner!=='PRE_RUNTIME_HOST_ADAPTER'||handoff?.action!=='EXECUTE_PRE_RUNTIME_BOOTSTRAP'||handoff?.attempt_receipt_sha256!==r.observation_receipt_sha256||handoff?.active_claim!==false||handoff?.authority!==0||r.next_step!==null||r.next_step_receipt_sha256!==null||r.to_ledger_receipt_sha256!==r.from_ledger_receipt_sha256)e.push('handoff');}else if(r.handoff_owner!==null||handoff!==null)e.push('handoff');if(r.active_claim!==false||r.authority!==0)e.push('authority');
 if(r.ledger){const lv=validateFastbootChannelLedger(r.ledger,{sourceHead:r.source_head});if(!lv.ok||r.ledger.receipt_sha256!==r.to_ledger_receipt_sha256)e.push('ledger');if(r.disposition==='HANDOFF_PRE_RUNTIME'){const current=deriveFastbootStep({ledger:r.ledger,runtimeRootSha256:r.runtime_root_sha256});if(current.receipt_sha256!==r.current_step_receipt_sha256||current.action!=='EXECUTE_CANONICAL_CARRIER')e.push('handoff_step_binding');}}if(r.next_step){const sv=validateFastbootStep(r.next_step,{sourceHead:r.source_head,runtimeRootSha256:r.runtime_root_sha256,ledger:r.ledger});if(!sv.ok||r.next_step.receipt_sha256!==r.next_step_receipt_sha256)e.push('next_step_binding');}else if(r.next_step_receipt_sha256!==null)e.push('next_step_binding');
 if(!HEX64.test(String(r.receipt_sha256||''))||fastbootObservationTransitionDigest(r)!==r.receipt_sha256)e.push('receipt_digest');return{ok:e.length===0,errors:uniq(e)};
}
export function validateFastbootStep(step,{sourceHead=null,runtimeRootSha256=null,ledger=null,attemptedClasses=[]}={}){
 const e=[],r=step||{};if((attemptedClasses||[]).length)e.push('caller_retry_memory');
 if(r.schema!==FASTBOOT_STEP_SCHEMA)e.push('schema');
 if(r.activation_modality!==LOCAL_SESSION_ACTIVATION_MODALITY)e.push('activation_modality');
 if(!HEX40.test(String(r.source_head||'')))e.push('source_head');
 if(sourceHead&&r.source_head!==String(sourceHead).toLowerCase())e.push('source_head_binding');
 if(!HEX64.test(String(r.runtime_root_sha256||'')))e.push('runtime_root');
 if(runtimeRootSha256&&r.runtime_root_sha256!==runtimeRootSha256)e.push('runtime_root_binding');
 if(r.execution_owner!=='PRE_RUNTIME_HOST_ADAPTER'||r.runtime_self_bootstrap!==false)e.push('execution_owner');if(r.first_unclosed_edge!=='LOCAL_INGRESS')e.push('first_unclosed_edge');if(r.one_next!==true||r.one_executor!==true)e.push('one_next');
 if(r.model_selects_carrier!==false||r.model_selects_fallback!==false||r.side_infrastructure_forbidden!==true||r.authority!==0)e.push('authority');
 if(!HEX64.test(String(r.decision_key||''))||!HEX64.test(String(r.evidence_sha256||''))||(r.canonical_carrier!==null&&!HEX64.test(String(r.carrier_evidence_sha256||'')))||(r.canonical_carrier===null&&r.carrier_evidence_sha256!==null))e.push('binding');
 if(!HEX64.test(String(r.receipt_sha256||''))||sha256(withoutDigest(r))!==r.receipt_sha256)e.push('receipt_digest');
 if(ledger){const d=deriveFastbootStep({ledger,runtimeRootSha256:r.runtime_root_sha256});for(const k of ['state','action','canonical_next','first_unclosed_edge','canonical_carrier','decision_key','evidence_sha256','carrier_evidence_sha256','retry_allowed','blocker'])if(r[k]!==d[k])e.push('recomputed_'+k);}
 return{ok:e.length===0,errors:uniq(e)};
}
export function issueFastbootByteBridgeReceipt({carrier,sourceHead,objectPath,sourceBlobSha1,sourceObjectIdentity,sourceBytes,localBytes,localObjectId}={}){
 if(!FASTBOOT_CARRIERS.includes(carrier))throw new Error('carrier invalid');
 const head=String(sourceHead||'').toLowerCase(),rel=String(objectPath||'');if(!HEX40.test(head))throw new Error('source head invalid');if(!rel||rel.startsWith('/')||rel.includes('..'))throw new Error('object path invalid');if(!HEX40.test(String(sourceBlobSha1||'')))throw new Error('source blob invalid');
 const src=Buffer.isBuffer(sourceBytes)?sourceBytes:Buffer.from(sourceBytes??''),loc=Buffer.isBuffer(localBytes)?localBytes:Buffer.from(localBytes??'');if(!src.length||!loc.length)throw new Error('bridge bytes required');
 const sourceSha=crypto.createHash('sha256').update(src).digest('hex'),localSha=crypto.createHash('sha256').update(loc).digest('hex'),localBlob=crypto.createHash('sha1').update(Buffer.from('blob '+loc.length+'\0')).update(loc).digest('hex');if(sourceSha!==localSha||src.length!==loc.length||localBlob!==sourceBlobSha1)throw new Error('bridge readback mismatch');
 const material={schema:FASTBOOT_BYTE_BRIDGE_SCHEMA,activation_modality:LOCAL_SESSION_ACTIVATION_MODALITY,carrier,source_head:head,object_path:rel,source_blob_sha1:sourceBlobSha1,source_object_identity:String(sourceObjectIdentity||''),local_object_id:String(localObjectId||''),bytes:src.length,source_sha256:sourceSha,local_readback_sha256:localSha,local_blob_sha1:localBlob,receipt_scope:'HOST_ATTESTED_CANDIDATE_REQUIRES_RUNTIME_REOPEN',physical_verification:false,model_mediated_bytes:false,authority:0};if(!material.source_object_identity||!material.local_object_id)throw new Error('bridge identities required');return{...material,receipt_sha256:sha256(material)};
}
export function validateFastbootByteBridgeReceipt(r,{sourceHead=null,objectPath=null,blobSha1=null,localBytes=null}={}){
 const e=[];if(r?.schema!==FASTBOOT_BYTE_BRIDGE_SCHEMA)e.push('schema');if(r?.activation_modality!==LOCAL_SESSION_ACTIVATION_MODALITY)e.push('activation_modality');if(!FASTBOOT_CARRIERS.includes(r?.carrier))e.push('carrier');if(!HEX40.test(String(r?.source_head||'')))e.push('source_head');if(sourceHead&&r?.source_head!==String(sourceHead).toLowerCase())e.push('source_head_binding');if(!String(r?.object_path||'')||r.object_path.startsWith('/')||r.object_path.includes('..'))e.push('object_path');if(objectPath&&r?.object_path!==objectPath)e.push('object_path_binding');if(!HEX40.test(String(r?.source_blob_sha1||'')))e.push('source_blob');if(blobSha1&&r?.source_blob_sha1!==blobSha1)e.push('source_blob_binding');if(!String(r?.source_object_identity||'')||!String(r?.local_object_id||''))e.push('identity');if(!Number.isInteger(r?.bytes)||r.bytes<1||!HEX64.test(String(r?.source_sha256||''))||r?.source_sha256!==r?.local_readback_sha256||r?.receipt_scope!=='HOST_ATTESTED_CANDIDATE_REQUIRES_RUNTIME_REOPEN'||r?.physical_verification!==false||r?.model_mediated_bytes!==false||r?.authority!==0)e.push('bridge');
 if(localBytes!=null){const b=Buffer.isBuffer(localBytes)?localBytes:Buffer.from(localBytes),h=crypto.createHash('sha256').update(b).digest('hex'),g=crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');if(b.length!==r?.bytes||h!==r?.local_readback_sha256||g!==r?.local_blob_sha1||g!==r?.source_blob_sha1)e.push('runtime_reopen_mismatch');}
 if(!HEX64.test(String(r?.receipt_sha256||''))||sha256(withoutDigest(r))!==r.receipt_sha256)e.push('receipt_digest');return{ok:e.length===0,errors:uniq(e),physical_reopen_verified:e.length===0&&localBytes!=null};
}

