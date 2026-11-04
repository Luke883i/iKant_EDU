import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT,readTerms} from '../src/contract.mjs';
import {initialState} from '../src/state.mjs';
import {runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';
import {FASTBOOT_CAPABILITY_FIELDS,FASTBOOT_MACHINE_CARRIERS,FASTBOOT_HUMAN_LAST_RESORT,buildFastbootChannelLedger,issueFastbootCapabilityReceipt,selectFastbootCarrier} from '../src/fastboot-convergence.mjs';
import {bootstrapPublicLineFromAction} from '../src/session-shell.mjs';
import {recordCompletedPreacceptAccess,buildPreacceptRemediationReceipt,applyPreacceptRemediation,presentTermsState,canAccept} from '../src/admission.mjs';
import {directActivationExecutorHandoff,validateDirectExecutorHandoff,deriveExitDelegation} from '../src/bootstrap-intent-adapter.mjs';
import {deriveControlPlaneOwnership} from '../src/control-plane-ownership.mjs';
import {for_ai_agent_first_entrypoint} from '../src/local-host-meta-prompt.mjs';

const H='a'.repeat(40),D=runtimeRootDescriptor(),sha=x=>crypto.createHash('sha256').update(Buffer.from(JSON.stringify(x))).digest('hex'),git=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const proven=()=>Object.fromEntries(FASTBOOT_CAPABILITY_FIELDS.map(k=>[k,true]));
const unavailable=(carrier,i=0)=>issueFastbootCapabilityReceipt({carrier,status:'UNAVAILABLE',capabilities:{...proven(),surface_supported:false},evidence:'unavailable-'+carrier+'-'+i,probeOwner:'c43',operationId:'unavailable-'+carrier+'-'+i,sourceHead:H});
const available=(carrier,i=0)=>issueFastbootCapabilityReceipt({carrier,status:'AVAILABLE',capabilities:proven(),evidence:'available-'+carrier+'-'+i,probeOwner:'c43',operationId:'available-'+carrier+'-'+i,sourceHead:H});

test('C43 file handoff is last resort after machine exhaustion, never before machine probe',()=>{
 const fileOnly=buildFastbootChannelLedger({sourceHead:H,receipts:[available(FASTBOOT_HUMAN_LAST_RESORT)]});
 const first=for_ai_agent_first_entrypoint({channel_ledger:fileOnly,runtime_root_sha256:D.runtime_root_sha256});
 assert.equal(first.next.canonical_carrier,'WARM_CACHE_EXACT');
 assert.equal(first.next.action,'PROBE_CANONICAL_CARRIER');
 assert.equal(first.readiness.public_line,'iKant · VERIFICA');
 const receipts=[...FASTBOOT_MACHINE_CARRIERS.map((c,i)=>unavailable(c,i)),available(FASTBOOT_HUMAN_LAST_RESORT,9)];
 const exhausted=buildFastbootChannelLedger({sourceHead:H,receipts});
 const last=for_ai_agent_first_entrypoint({channel_ledger:exhausted,runtime_root_sha256:D.runtime_root_sha256});
 assert.equal(last.next.canonical_carrier,FASTBOOT_HUMAN_LAST_RESORT);
 assert.equal(last.next.action,'EXECUTE_CANONICAL_CARRIER');
 assert.equal(last.readiness.public_line,'iKant · CARICA FILE');
});

test('C43 planner tier is machine execute -> machine probe -> file execute -> file probe',()=>{
 const probeCaps=Object.fromEntries(FASTBOOT_MACHINE_CARRIERS.map(c=>[c,false]));probeCaps.GITHUB_API_BASE64={};probeCaps.HOST_FILE_BRIDGE=proven();
 let p=selectFastbootCarrier({capabilities:probeCaps});
 assert.equal(p.carrier,'GITHUB_API_BASE64');assert.equal(p.state,'PROBE_REQUIRED');
 const execCaps=Object.fromEntries(FASTBOOT_MACHINE_CARRIERS.map(c=>[c,false]));execCaps.GITHUB_API_BASE64=proven();execCaps.HOST_FILE_BRIDGE=proven();
 p=selectFastbootCarrier({capabilities:execCaps});
 assert.equal(p.carrier,'GITHUB_API_BASE64');assert.equal(p.state,'EXECUTABLE');
 const caps=Object.fromEntries(FASTBOOT_MACHINE_CARRIERS.map(c=>[c,false]));caps.HOST_FILE_BRIDGE=proven();
 p=selectFastbootCarrier({capabilities:caps});assert.equal(p.carrier,'HOST_FILE_BRIDGE');assert.equal(p.state,'EXECUTABLE');
 caps.HOST_FILE_BRIDGE={};p=selectFastbootCarrier({capabilities:caps});assert.equal(p.carrier,'HOST_FILE_BRIDGE');assert.equal(p.state,'PROBE_REQUIRED');
});

test('C43 public line is action-first and cannot promote UNKNOWN carrier readiness',()=>{
 assert.equal(bootstrapPublicLineFromAction({action:'PROBE_CANONICAL_CARRIER',carrier:'HOST_FILE_BRIDGE'}),'iKant · VERIFICA');
 assert.equal(bootstrapPublicLineFromAction({action:'EXECUTE_CANONICAL_CARRIER',carrier:'HOST_FILE_BRIDGE'}),'iKant · CARICA FILE');
 assert.equal(bootstrapPublicLineFromAction({action:'EXECUTE_CANONICAL_CARRIER',carrier:'WARM_CACHE_EXACT'}),'iKant · AVVIA');
 assert.equal(bootstrapPublicLineFromAction({action:'WAIT_CHANGED_EVIDENCE',carrier:null}),'iKant · ATTENDI CAMBIO');
});

test('C43 read-only overread is nonretroactive remediation; continuation or hard access requires fresh context',()=>{
 const terms=readTerms();
 const first=recordCompletedPreacceptAccess(initialState(),'SEARCH_REPOSITORY',{target:'x'});
 assert.equal(first.terminal,'REMEDIATION_REQUIRED');assert.equal(first.state.admission.new_chat_required,false);
 const receipt=buildPreacceptRemediationReceipt(first.state,terms.digest),remediated=applyPreacceptRemediation(first.state,receipt,terms.digest);
 assert.equal(remediated.admission.admission_history_label,'REMEDIATED_READ_ONLY_PREACCEPT');
 assert.equal(remediated.admission.historical_breach_fingerprint,first.state.admission.breach_fingerprint);
 assert.equal(canAccept(presentTermsState(remediated,terms.digest),terms.digest),false);
 const ready=structuredClone(remediated);ready.admission.orientation_files=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];ready.admission.orientation_objects=ready.admission.orientation_files.map(path=>({path}));ready.admission.source_head_locked=true;
 assert.equal(canAccept(presentTermsState(ready,terms.digest),terms.digest),true);
 const escalated=recordCompletedPreacceptAccess(first.state,'READ_HISTORY',{target:'y'});
 assert.equal(escalated.terminal,'NEW_CHAT_REQUIRED');assert.equal(escalated.state.status,'SESSION_NONCONFORMING');
 const secondAfterRemediation=recordCompletedPreacceptAccess(remediated,'LIST_TREE',{target:'z'});
 assert.equal(secondAfterRemediation.terminal,'NEW_CHAT_REQUIRED');assert.equal(secondAfterRemediation.state.admission.breach_class,'HARD_PREACCEPT_BREACH');
 const hard=recordCompletedPreacceptAccess(initialState(),'CLONE_REPOSITORY',{target:'repo'});
 assert.equal(hard.terminal,'NEW_CHAT_REQUIRED');assert.equal(hard.state.status,'SESSION_NONCONFORMING');
});

test('C43 direct executor handoff is fully bound and uses canonical runtime descriptor',()=>{
 const paths=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
 const orientation=paths.map(p=>{const b=fs.readFileSync(path.join(ROOT,p));return{path:p,blob_sha1:git(b),bytes:b.length};}),terms=orientation.find(x=>x.path==='TERMS.md');
 const pre={schema:'ikant-le-preaccept-handoff/v2',repository:'Luke883i/iKant_EDU',source_head:H,terms_presented:true,frozen:true,breached:false,orientation_objects:orientation,terms_object:{...terms},authority:0};
 const runtimeObjects=[{path:D.loader.path,blob_sha1:D.loader.blob_sha1,bytes:fs.readFileSync(path.join(ROOT,D.loader.path)).length},...D.shards.map(s=>({path:s.path,blob_sha1:s.blob_sha1,bytes:s.source_bytes}))];
 const material={schema:'ikant-le-activation-executor/v1',repository:'Luke883i/iKant_EDU',source_head:H,runtime_root_sha256:D.runtime_root_sha256,execution_plane:'SESSION_LOCAL_NODE',capability_probe_passed:true,capability_probe_before_acquisition:true,content_addressed:true,byte_path:'LOCAL_DIRECT',model_mediated_bytes:false,model_role:'NONE',model_rewrite_allowed:false,semantic_equivalence_allowed:false,source_arrival_samehash_required:true,source_arrival_samehash_verified:true,opaque_relay_roundtrip_verified:false,retry_semantics:'IDEMPOTENT_BY_OBJECT_IDENTITY',retry_count:0,acquisition_complete:true,orientation_objects:orientation,runtime_objects:runtimeObjects,slo_elapsed_ms:5,authority:0},executor={...material,receipt_sha256:sha(material)};
 const x=directActivationExecutorHandoff({preacceptHandoff:pre,activationExecutor:executor,humanInput:'I ACCEPT',acceptanceObservedMonotonicMs:10});
 assert.equal(validateDirectExecutorHandoff(x.handoff).ok,true);assert.equal(x.handoff.runtime_root_sha256,D.runtime_root_sha256);assert.equal('acceptance_event_id'in x.handoff,false);
 const forged=structuredClone(x.handoff);forged.execution_input.human_input='YES';assert.equal(validateDirectExecutorHandoff(forged).ok,false);
});

test('C43 exit aliases delegate one existing owner action at a time',()=>{
 const owned=deriveControlPlaneOwnership({runtime_bound:true,model_invocation_gate:true,pre_display_egress_gate:true,durable_session_identity:true,ownership_receipt_valid:true,activate_ikant_requested:true,warm_activation_elapsed_ms:1,warm_runtime:true,github_transfer_during_turn:false,mass_qualification_during_turn:false,repo_self_recheck_ok:true,integrity_fault:false});
 assert.equal(owned.state,'IKANT_OWNED');assert.equal(deriveExitDelegation({controlPlaneOwnership:owned,runtimeActive:true}).action,'RELEASE_TO_HOST');
 assert.equal(deriveExitDelegation({runtimeActive:true}).action,'EXIT IKANT');
 assert.equal(deriveExitDelegation({runtimeActive:false}).action,'EXIT_COMPLETE');
});
