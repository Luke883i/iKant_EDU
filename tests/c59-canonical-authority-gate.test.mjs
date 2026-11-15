import test from 'node:test';
import assert from 'node:assert/strict';
import {bootstrapHandoffV2,bootstrapEvidenceV2} from './bootstrap-fixture.mjs';
import {directActivationExecutorHandoff} from '../src/bootstrap-intent-adapter.mjs';
import {issueCanonicalCompositionHandoff,validateCanonicalCompositionHandoff,canonicalCompositionExecutionInput} from '../src/session-chat-composition.mjs';
import {FASTBOOT_CAPABILITY_FIELDS,issueFastbootCapabilityReceipt,buildFastbootChannelLedger,deriveFastbootStep,advanceFastbootObservation,FASTBOOT_ATTEMPT_SCHEMA,fastbootReceiptDigest} from '../src/fastboot-convergence.mjs';
import {runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';

const HEAD='a'.repeat(40),D=runtimeRootDescriptor();
const sign=x=>{const y=structuredClone(x);delete y.receipt_sha256;return{...y,receipt_sha256:fastbootReceiptDigest(y)}};
const proven=()=>Object.fromEntries(FASTBOOT_CAPABILITY_FIELDS.map(k=>[k,true]));

function direct(bytePath){
 const pre=bootstrapHandoffV2('inizializza',HEAD);
 const executor=bootstrapEvidenceV2({sourceHead:HEAD,bytePath}).activation_executor;
 return directActivationExecutorHandoff({preacceptHandoff:pre,activationExecutor:executor,humanInput:'I ACCEPT',acceptanceObservedMonotonicMs:10}).handoff;
}
function legacyFastbootHandoff(){
 const cap=issueFastbootCapabilityReceipt({carrier:'GITHUB_API_BASE64',status:'AVAILABLE',capabilities:proven(),evidence:'legacy-complete',probeOwner:'c59-test',operationId:'legacy',sourceHead:HEAD});
 const ledger=buildFastbootChannelLedger({receipts:[cap],sourceHead:HEAD}),step=deriveFastbootStep({ledger,runtimeRootSha256:D.runtime_root_sha256});
 const objects=[{path:D.loader.path,blob_sha1:D.loader.blob_sha1},...D.shards.map(s=>({path:s.path,blob_sha1:s.blob_sha1}))].map(x=>({...x,sha256:'d'.repeat(64),bytes:1}));
 const attempt=sign({schema:FASTBOOT_ATTEMPT_SCHEMA,attempt_id:'legacy',carrier:step.canonical_carrier,acceptance_event_id:'legacy-event',source_head:HEAD,runtime_root_sha256:D.runtime_root_sha256,result:'COMPLETE',source_object_identity:'legacy-source',runtime_sink_object_id:'legacy-sink',remote_objects:objects,remote_reads:objects.length,bytes_observed:objects.length,source_fetch_observed:true,byte_preserving_runtime_sink_observed:true,runtime_materializer_bound:true,runtime_executor_bound:true,model_mediated_bytes:false,authoritative_remote_history:false,committed_remote_rounds:0,transfer_receipt_sha256:'e'.repeat(64),authority:0});
 return advanceFastbootObservation({ledger,runtimeRootSha256:D.runtime_root_sha256,observation:attempt,runtimeRootDescriptor:D,acceptanceEventId:'legacy-event'}).handoff;
}

test('C59 canonical authority accepts only direct verified opaque relay',()=>{
 const h=issueCanonicalCompositionHandoff(direct('VERIFIED_OPAQUE_RELAY')),v=validateCanonicalCompositionHandoff(h);
 assert.equal(v.ok,true);
 assert.equal(h.canonical_activation_authority,true);
 assert.equal(h.legacy_compatibility_authority,false);
 assert.equal(h.container_github_network_required,false);
 assert.equal(h.transport,'GITHUB_API_BASE64');
 assert.equal(h.byte_path,'VERIFIED_OPAQUE_RELAY');
 assert.equal(canonicalCompositionExecutionInput(h).activation_executor.byte_path,'VERIFIED_OPAQUE_RELAY');
});

test('C59 rejects LOCAL_DIRECT from canonical authority even when old executor validator accepts it',()=>{
 assert.throws(()=>issueCanonicalCompositionHandoff(direct('LOCAL_DIRECT')),/canonical composition handoff invalid/);
});

test('C59 rejects legacy multi-carrier HANDOFF_PRE_RUNTIME at the canonical authority boundary',()=>{
 const legacy=legacyFastbootHandoff();
 assert.equal(legacy.action,'EXECUTE_PRE_RUNTIME_BOOTSTRAP');
 assert.equal(validateCanonicalCompositionHandoff(legacy).ok,false);
});

test('C59 canonical handoff cannot be widened with planner retry or carrier fields',()=>{
 const h=issueCanonicalCompositionHandoff(direct('VERIFIED_OPAQUE_RELAY'));
 for(const [k,v] of [['channel_ledger',{}],['fastboot_step',{}],['selected_carrier','WARM_CACHE_EXACT'],['attempt_receipt_sha256','f'.repeat(64)],['transfer_mode','PINNED_GITHUB_ZIP']]){
  const x=structuredClone(h);x[k]=v;
  assert.equal(validateCanonicalCompositionHandoff(x).ok,false,k);
 }
});
