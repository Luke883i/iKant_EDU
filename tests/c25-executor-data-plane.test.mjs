import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT,readOrientationCapsule} from '../src/contract.mjs';
import {validatePreacceptHandoff} from '../src/admission.mjs';
import {materializeRuntimeRoot,runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';
import {runCommand,resumeActivation} from '../src/runtime.mjs';
import {runtimePaths,readLedger} from '../src/state.mjs';
import {bootstrapHandoffV2,bootstrapEvidenceV2} from './bootstrap-fixture.mjs';

const reset=()=>fs.rmSync(runtimePaths().dir,{recursive:true,force:true});
const gitBlobSha1=bytes=>{const b=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex')};
const orientationObjects=()=>readOrientationCapsule().paths.map(rel=>{const b=fs.readFileSync(path.join(ROOT,rel));return{path:rel,blob_sha1:gitBlobSha1(b),bytes:b.length};});

test('C25 preaccept handoff uses immutable object identities without pre-runtime digest obligations',()=>{
 const h=bootstrapHandoffV2('inizializza','a'.repeat(40));
 assert.equal('terms_digest' in h,false);
 assert.equal('pending_intent_sha256' in h,false);
 assert.equal('orientation_digests' in h,false);
 const v=validatePreacceptHandoff(h,'0'.repeat(64));
 assert.equal(v.ok,true);
 assert.match(v.orientation_object_set_sha256,/^[a-f0-9]{64}$/);
});

test('C25 orientation identity mismatch fails before acceptance state import',()=>{
 const h=bootstrapHandoffV2('inizializza','a'.repeat(40));
 h.orientation_objects[0]={...h.orientation_objects[0],blob_sha1:'0'.repeat(40)};
 const v=validatePreacceptHandoff(h,'0'.repeat(64));
 assert.equal(v.ok,false);
 assert.equal(v.code,'HANDOFF_ORIENTATION_IDENTITY_MISMATCH');
});

test('C25 local executor materialization re-verifies orientation and reopens bytes',{concurrency:false},()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c25-')),sink=path.join(parent,'root');
 try{
  const pre=bootstrapHandoffV2('inizializza','a'.repeat(40)),r=materializeRuntimeRoot({workspace:ROOT,sink,sourceHead:'a'.repeat(40),orientationObjects:pre.orientation_objects,preacceptHandoff:pre,activationExecutorReceiptSha256:'b'.repeat(64)});
  assert.equal(r.schema,'ikant-le-runtime-root-materialization/v2');
  assert.equal(r.reopen_verified,true);
  assert.equal(r.reverified_orientation_objects.length,readOrientationCapsule().paths.length);
 }finally{fs.rmSync(parent,{recursive:true,force:true});}
});

test('C25 SLO >120s is telemetry and does not invalidate an otherwise valid ACTIVE',{concurrency:false},()=>{
 reset();const source='a'.repeat(40),e=bootstrapEvidenceV2({sourceHead:source,sloElapsedMs:180000});
 const out=runCommand('I ACCEPT',{preacceptHandoff:bootstrapHandoffV2('inizializza',source),postAcceptBootstrapEvidence:e,hostEngine:'GPT-TEST',hostSurface:'SESSION_LOCAL_NODE'});
 assert.equal(out.code,0);
 const s=readLedger().at(-1).state_after;
 assert.equal(s.status,'ACTIVE');
 assert.equal(s.bootstrap.integrity_time_gate_required,false);
 assert.equal(s.bootstrap.deadline_terminal,null);
 assert.equal(s.bootstrap.activation_slo_exceeded,true);
 reset();
});

test('C25 unverified model-mediated executor bytes are integrity failure and never ACTIVE',{concurrency:false},()=>{
 reset();const source='a'.repeat(40),e=bootstrapEvidenceV2({sourceHead:source,modelMediatedBytes:true});
 const out=runCommand('I ACCEPT',{preacceptHandoff:bootstrapHandoffV2('inizializza',source),postAcceptBootstrapEvidence:e,hostEngine:'GPT-TEST'});
 assert.equal(out.code,1);
 const s=readLedger().at(-1).state_after;
 assert.equal(s.status,'BLOCKED_INTEGRITY');
 reset();
});

test('C27 verified opaque relay may carry bytes but cannot gain authority',{concurrency:false},()=>{
 reset();const source='a'.repeat(40),e=bootstrapEvidenceV2({sourceHead:source,bytePath:'VERIFIED_OPAQUE_RELAY'});
 const out=runCommand('I ACCEPT',{preacceptHandoff:bootstrapHandoffV2('inizializza',source),postAcceptBootstrapEvidence:e,hostEngine:'GPT-TEST',hostSurface:'SESSION_LOCAL_NODE'});
 assert.equal(out.code,0);const state=readLedger().at(-1).state_after;assert.equal(state.status,'ACTIVE');assert.equal(e.activation_executor.model_mediated_bytes,true);assert.equal(e.activation_executor.model_role,'OPAQUE_TRANSPORT_ONLY');assert.equal(e.activation_executor.authority,0);reset();
});

test('C27 opaque relay without samehash fails closed before ACTIVE',{concurrency:false},()=>{
 reset();const source='a'.repeat(40),e=bootstrapEvidenceV2({sourceHead:source,bytePath:'VERIFIED_OPAQUE_RELAY',samehashVerified:false});
 const out=runCommand('I ACCEPT',{preacceptHandoff:bootstrapHandoffV2('inizializza',source),postAcceptBootstrapEvidence:e,hostEngine:'GPT-TEST'});
 assert.equal(out.code,1);assert.equal(readLedger().at(-1).state_after.status,'BLOCKED_INTEGRITY');reset();
});

test('C25 executor unavailability degrades; same-object retry reaches ACTIVE without second acceptance',{concurrency:false},()=>{
 reset();const source='a'.repeat(40);
 const first=runCommand('I ACCEPT',{preacceptHandoff:bootstrapHandoffV2('inizializza',source),postAcceptBootstrapEvidence:bootstrapEvidenceV2({sourceHead:source,executorAvailable:false}),hostEngine:'GPT-TEST'});
 assert.equal(first.code,1);
 const before=readLedger().at(-1).state_after,epoch=before.epoch,event=before.admission.acceptance_event_id;
 assert.equal(before.status,'DEGRADED');
 assert.equal(before.admission.new_chat_required,false);
 const second=resumeActivation({postAcceptBootstrapEvidence:bootstrapEvidenceV2({sourceHead:source,executorAvailable:true,retryCount:7,sloElapsedMs:150000}),hostEngine:'GPT-TEST'});
 assert.equal(second.code,0);
 const after=readLedger().at(-1).state_after;
 assert.equal(after.status,'ACTIVE');
 assert.equal(after.epoch,epoch);
 assert.equal(after.admission.acceptance_event_id,event);
 assert.equal(after.bootstrap.activation_slo_exceeded,true);
 reset();
});

test('C25 canonical executor evidence has no carrier or remote-round ontology',()=>{
 const e=bootstrapEvidenceV2({sourceHead:'a'.repeat(40),retryCount:9});
 for(const k of ['mode','carrier','remote_rounds','remote_reads'])assert.equal(k in e.activation_executor,false);
 assert.equal(e.activation_executor.retry_semantics,'IDEMPOTENT_BY_OBJECT_IDENTITY');
 reset();
});

test('C25 runtime-root remains content-addressed',()=>{
 const d=runtimeRootDescriptor();
 assert.equal(d.schema,'ikant-le-runtime-root/v1');
 assert.equal(d.member_count,d.members.length);
 assert.match(d.runtime_root_sha256,/^[a-f0-9]{64}$/);
});

test('C25 canonical contracts cannot expose unmarked v1 activation truth',()=>{
 const a=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/session-chat-activation.json'),'utf8'));
 const l=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/local-session-fastboot.json'),'utf8'));
 assert.equal('required' in a,false);assert.equal('fastboot_law' in a,false);
 assert.ok(Array.isArray(a.canonical_v2_required));assert.ok(Array.isArray(a.legacy_v1_required));
 assert.equal('required_mechanisms' in l,false);assert.equal('causal_planes' in l,false);
 assert.ok(Array.isArray(l.canonical_v2_required_mechanisms));assert.ok(l.canonical_v2_causal_planes.local_activation_executor);
 assert.equal(a.claim_boundary.unmarked_v1_fastboot_fields_may_define_v2,false);
 assert.equal(l.claim_boundary.unmarked_legacy_mechanisms_are_canonical,false);
});
