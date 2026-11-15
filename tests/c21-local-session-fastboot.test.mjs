import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  FASTBOOT_CAPABILITY_FIELDS,issueFastbootCapabilityReceipt,validateFastbootCapabilityReceipt,
  buildFastbootChannelLedger,validateFastbootChannelLedger,deriveFastbootStep,validateFastbootStep,recordFastbootFailure,
  issueFastbootByteBridgeReceipt,validateFastbootByteBridgeReceipt,LOCAL_SESSION_ACTIVATION_MODALITY
} from '../src/fastboot-convergence.mjs';
import {runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';
import {runProbe} from '../src/probe.mjs';
import {initialState,runtimePaths,readLedger} from '../src/state.mjs';
import {runCommand} from '../src/runtime.mjs';
import {bootstrapEvidence,bootstrapHandoff} from './bootstrap-fixture.mjs';

const HEAD='a'.repeat(40),proven=()=>Object.fromEntries(FASTBOOT_CAPABILITY_FIELDS.map(k=>[k,true]));
const reset=()=>fs.rmSync(runtimePaths().dir,{recursive:true,force:true});

test('C21 state and contract expose one local activation modality',()=>{
 const c=JSON.parse(fs.readFileSync(new URL('../contracts/session-chat-activation.json',import.meta.url),'utf8'));
 assert.equal(c.activation_modality,'SESSION_CHAT_LOCAL');assert.equal(c.hosted_runtime_required,false);assert.equal(c.plugin_or_mcp_registration_required,false);
 assert.equal(initialState().bootstrap.activation_modality,LOCAL_SESSION_ACTIVATION_MODALITY);
});

test('C22 host-attested receipt owns planner input but does not claim physical origin',()=>{
 const r=issueFastbootCapabilityReceipt({carrier:'GITHUB_API_BASE64',status:'AVAILABLE',capabilities:proven(),evidence:'api + local sink observed',probeOwner:'test',operationId:'op-a',sourceHead:HEAD});
 assert.equal(validateFastbootCapabilityReceipt(r,{sourceHead:HEAD}).ok,true);assert.equal(r.observation_class,'HOST_ATTESTED');assert.equal(r.physical_origin_proven,false);
 const l=buildFastbootChannelLedger({receipts:[r],sourceHead:HEAD});assert.equal(validateFastbootChannelLedger(l,{sourceHead:HEAD}).ok,true);assert.equal(l.retry_memory_owner,'FASTBOOT_CHANNEL_LEDGER');assert.equal(l.channels.GITHUB_API_BASE64.status,'AVAILABLE');assert.equal(l.channels.HOST_FILE_BRIDGE.status,'UNKNOWN');
});

test('C21 one NEXT executes once; unchanged evidence cannot retry; changed evidence replans',()=>{
 const root=runtimeRootDescriptor(),a=issueFastbootCapabilityReceipt({carrier:'GITHUB_API_BASE64',status:'AVAILABLE',capabilities:proven(),evidence:'available',probeOwner:'test',operationId:'op-a',sourceHead:HEAD});
 let l=buildFastbootChannelLedger({receipts:[a],sourceHead:HEAD}),first=deriveFastbootStep({ledger:l,runtimeRootSha256:root.runtime_root_sha256});
 assert.equal(first.action,'EXECUTE_CANONICAL_CARRIER');assert.equal(first.first_unclosed_edge,'LOCAL_INGRESS');assert.equal(first.one_next,true);assert.equal(first.one_executor,true);assert.equal(validateFastbootStep(first,{sourceHead:HEAD,runtimeRootSha256:root.runtime_root_sha256,ledger:l}).ok,true);
 const failed=recordFastbootFailure(l,first),retry=deriveFastbootStep({ledger:failed,runtimeRootSha256:root.runtime_root_sha256});assert.notEqual(retry.canonical_carrier,first.canonical_carrier);assert.notEqual(retry.action,'WAIT_CHANGED_EVIDENCE');assert.equal(retry.retry_allowed,true);assert.equal(failed.failed_decisions.length,1);
 const u=issueFastbootCapabilityReceipt({carrier:'GITHUB_API_BASE64',status:'UNAVAILABLE',capabilities:{...proven(),byte_preserving_runtime_sink:false},evidence:'sink unavailable',probeOwner:'test',operationId:'op-b',sourceHead:HEAD});
 l=buildFastbootChannelLedger({previous:failed,receipts:[u],sourceHead:HEAD});const changed=deriveFastbootStep({ledger:l,runtimeRootSha256:root.runtime_root_sha256});assert.notEqual(changed.action,'WAIT_CHANGED_EVIDENCE');
});


test('C22 re-signed fastboot step is rejected unless it recomputes exactly from the ledger',()=>{
 const root=runtimeRootDescriptor(),a=issueFastbootCapabilityReceipt({carrier:'GITHUB_API_BASE64',status:'AVAILABLE',capabilities:proven(),evidence:'available',probeOwner:'test',operationId:'op-recompute',sourceHead:HEAD}),l=buildFastbootChannelLedger({receipts:[a],sourceHead:HEAD}),step=deriveFastbootStep({ledger:l,runtimeRootSha256:root.runtime_root_sha256});
 const forged={...step,decision_key:'f'.repeat(64)};delete forged.receipt_sha256;forged.receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(forged)).digest('hex');const v=validateFastbootStep(forged,{sourceHead:HEAD,runtimeRootSha256:root.runtime_root_sha256,ledger:l});assert.equal(v.ok,false);assert.ok(v.errors.includes('recomputed_decision_key'));
});
test('C22 byte bridge receipt is insufficient until runtime reopens the actual local bytes',()=>{
 const bytes=fs.readFileSync(new URL('../src/runtime-root-verified.mjs',import.meta.url)),blob=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
 const r=issueFastbootByteBridgeReceipt({carrier:'HOST_FILE_BRIDGE',sourceHead:HEAD,objectPath:'src/runtime-root-verified.mjs',sourceBlobSha1:blob,sourceObjectIdentity:'source:1',sourceBytes:bytes,localBytes:bytes,localObjectId:'workspace:src/runtime-root-verified.mjs'});
 const attested=validateFastbootByteBridgeReceipt(r,{sourceHead:HEAD,objectPath:'src/runtime-root-verified.mjs',blobSha1:blob});assert.equal(attested.ok,true);assert.equal(attested.physical_reopen_verified,false);assert.equal(r.physical_verification,false);
 const reopened=validateFastbootByteBridgeReceipt(r,{sourceHead:HEAD,objectPath:'src/runtime-root-verified.mjs',blobSha1:blob,localBytes:bytes});assert.equal(reopened.ok,true);assert.equal(reopened.physical_reopen_verified,true);
 assert.throws(()=>issueFastbootByteBridgeReceipt({carrier:'HOST_FILE_BRIDGE',sourceHead:HEAD,objectPath:'src/runtime-root-verified.mjs',sourceBlobSha1:blob,sourceObjectIdentity:'source:1',sourceBytes:bytes,localBytes:Buffer.from('forged'),localObjectId:'x'}),/mismatch/);
});

test('C21 real local Node probe binds executed code to current verified runtime root',{concurrency:false},()=>{
 reset();const p=runProbe({hostSurface:'SESSION_LOCAL_NODE'}),d=runtimeRootDescriptor();assert.equal(p.ok,true);assert.equal(p.executed_provenance.runtime_root_sha256,d.runtime_root_sha256);assert.equal(p.executed_provenance.readback_verified,true);assert.ok(p.executed_provenance.modules.some(x=>x.path==='src/probe.mjs'));assert.ok(p.executed_provenance.modules.some(x=>x.path==='src/runtime-command.mjs'));reset();
});

test('C21 canonical local activation reaches persisted/read-back ACTIVE with executed provenance',{concurrency:false},()=>{
 reset();const source=HEAD,e=bootstrapEvidence({sourceHead:source,transferSchema:'v2',flexMode:'GITHUB_API_BASE64'});const out=runCommand('I ACCEPT',{preacceptHandoff:bootstrapHandoff('inizializza',source),postAcceptBootstrapEvidence:e,hostEngine:'GPT-TEST',hostSurface:'SESSION_LOCAL_NODE'});
 assert.equal(out.code,0);const s=readLedger().at(-1).state_after;assert.equal(s.status,'ACTIVE');assert.equal(s.bootstrap.activation_modality,'SESSION_CHAT_LOCAL');assert.equal(s.bootstrap.probe.executed_provenance.readback_verified,true);assert.equal(s.bootstrap.probe.executed_provenance.runtime_root_sha256,runtimeRootDescriptor().runtime_root_sha256);reset();
});


test('C22 activation rejects bootstrap evidence with the C21 transcript removed',{concurrency:false},()=>{
 reset();const source=HEAD,e=bootstrapEvidence({sourceHead:source,transferSchema:'v2',flexMode:'GITHUB_API_BASE64'});delete e.fastboot_channel_ledger;const x=structuredClone(e);delete x.receipt_sha256;e.receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');const out=runCommand('I ACCEPT',{preacceptHandoff:bootstrapHandoff('inizializza',source),postAcceptBootstrapEvidence:e,hostEngine:'GPT-TEST',hostSurface:'SESSION_LOCAL_NODE'});assert.equal(out.code,1);assert.notEqual(readLedger().at(-1).state_after.status,'ACTIVE');reset();
});

test('C22 production activation ignores caller probeRunner injection and uses the runtime-owned probe',{concurrency:false},()=>{
 reset();const source=HEAD,e=bootstrapEvidence({sourceHead:source,transferSchema:'v2',flexMode:'GITHUB_API_BASE64'});const out=runCommand('I ACCEPT',{preacceptHandoff:bootstrapHandoff('inizializza',source),postAcceptBootstrapEvidence:e,hostEngine:'GPT-TEST',hostSurface:'SESSION_LOCAL_NODE',probeRunner:()=>{throw new Error('caller probe must never execute')}});assert.equal(out.code,0);const s=readLedger().at(-1).state_after;assert.equal(s.status,'ACTIVE');assert.equal(s.bootstrap.probe.executed_provenance.readback_verified,true);reset();
});
