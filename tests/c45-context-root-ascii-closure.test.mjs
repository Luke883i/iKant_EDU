import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {materializeRuntimeRoot,runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';
import {
 deriveCohostSessionLocator,deriveCohostRuntimeSink,prepareCohostRuntimeSink,bindCohostContextRoot,reopenCohostContextRoot,
 routeCohostRuntimeTurn,validateCohostContextRoot,validateCohostDeliveryEnvelope,validateCohostNativeDeliveryReceipt,
 COHOST_NATIVE_RECEIPT_SCHEMA
} from '../src/cohost-context-root.mjs';

const H='a'.repeat(40),T='b'.repeat(64);
const sha=x=>crypto.createHash('sha256').update(Buffer.isBuffer(x)?x:Buffer.from(String(x))).digest('hex');
const sign=x=>({...x,receipt_sha256:sha(Buffer.from(JSON.stringify(x)))});
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-le-c45-')),storage=path.join(root,'cohost'),session='chat-session-secret-value',sink=prepareCohostRuntimeSink({storageRoot:storage,hostSessionId:session});materializeRuntimeRoot({sink:sink.runtime_dir,sourceHead:H,transferReceiptSha256:T});const d=runtimeRootDescriptor(sink.runtime_dir),ctx=bindCohostContextRoot({storageRoot:storage,hostSessionId:session,sourceHead:H,runtimeRootSha256:d.runtime_root_sha256});return{root,storage,session,sink,d,ctx};}
const cleanup=x=>fs.rmSync(x,{recursive:true,force:true});

test('C45 provider session metadata is opaque locator only and distinct sessions isolate roots',()=>{
 const a=deriveCohostSessionLocator('session-A'),b=deriveCohostSessionLocator('session-B');
 assert.match(a.session_locator_sha256,/^[a-f0-9]{64}$/);assert.notEqual(a.session_locator_sha256,b.session_locator_sha256);
 assert.equal(a.raw_session_persisted,false);assert.equal(a.product_identity,false);assert.equal(a.state_authority,false);assert.equal(a.truth_authority,false);
 const root='/tmp/c45-test-root',sa=deriveCohostRuntimeSink({storageRoot:root,hostSessionId:'session-A'}),sb=deriveCohostRuntimeSink({storageRoot:root,hostSessionId:'session-B'});
 assert.notEqual(sa.runtime_dir,sb.runtime_dir);assert.doesNotMatch(sa.runtime_dir,/session-A/);
});

test('C45 durable context manifest binds canonical local runtime without new lifecycle',{concurrency:false},()=>{
 const f=fixture();try{
  const manifest=JSON.parse(fs.readFileSync(f.sink.manifest_path,'utf8'));
  assert.equal(validateCohostContextRoot(manifest).ok,true);assert.equal(manifest.activation_modality,'SESSION_CHAT_LOCAL');assert.equal(manifest.placement,'OPTIONAL_COHOST');
  assert.equal(manifest.hosted_runtime_required,false);assert.equal(manifest.plugin_or_mcp_registration_required,false);assert.equal(manifest.runtime_route,'src/runtime.mjs#runCommand');
  assert.equal(manifest.compatibility_c20_canonical,false);assert.equal(manifest.model_or_conversation_is_persistence,false);assert.equal(manifest.provider_session_is_product_identity,false);
  assert.equal(manifest.runtime_root_sha256,f.d.runtime_root_sha256);assert.equal(reopenCohostContextRoot({storageRoot:f.storage,hostSessionId:f.session}).routable,true);
 }finally{cleanup(f.root);}
});

test('C45 source/runtime binding drift fails closed even when session locator is unchanged',{concurrency:false},()=>{
 const f=fixture();try{
  assert.throws(()=>bindCohostContextRoot({storageRoot:f.storage,hostSessionId:f.session,sourceHead:'c'.repeat(40),runtimeRootSha256:f.d.runtime_root_sha256}),/materialization binding|immutable context binding/);
  const m=JSON.parse(fs.readFileSync(f.sink.manifest_path,'utf8'));m.runtime_root_sha256='d'.repeat(64);const body={...m};delete body.receipt_sha256;m.receipt_sha256=sha(Buffer.from(JSON.stringify(body)));fs.writeFileSync(f.sink.manifest_path,JSON.stringify(m,null,2)+'\n');
  assert.throws(()=>reopenCohostContextRoot({storageRoot:f.storage,hostSessionId:f.session}),/runtime root binding mismatch/);
 }finally{cleanup(f.root);}
});

test('C45 routed turn enters bound canonical runtime and returns exact owner-rendered ASCII shell',{concurrency:false},async()=>{
 const f=fixture();try{
  const out=await routeCohostRuntimeTurn({storageRoot:f.storage,hostSessionId:f.session,input:'TERMS',hostEngine:'TEST_HOST'});
  assert.equal(validateCohostDeliveryEnvelope(out).ok,true);assert.equal(out.native_chat_delivery_observed,false);assert.equal(out.model_reframe_allowed,false);assert.equal(out.owner_render_exact,true);
  assert.match(out.ascii_text,/^\+={2,}\+/);assert.equal(out.ascii_text,out.runtime_output.stdout);assert.equal(out.shell_receipt_sha256,out.runtime_output.session_shell.receipt_sha256);
  const reopened=reopenCohostContextRoot({storageRoot:f.storage,hostSessionId:f.session});assert.equal(reopened.ledger_present,true);assert.ok(reopened.ledger_events>=1);
 }finally{cleanup(f.root);}
});

test('C45 canonical EXITED readback stops routing without host lifecycle tombstone',{concurrency:false},async()=>{
 const f=fixture();try{
  await routeCohostRuntimeTurn({storageRoot:f.storage,hostSessionId:f.session,input:'TERMS'});
  const file=path.join(f.sink.runtime_dir,'.ikant','ledger.jsonl'),lines=fs.readFileSync(file,'utf8').trim().split('\n'),last=JSON.parse(lines.at(-1));
  const material={schema:'ikant-le-ledger-event/v6',id:'c45-exit-witness',at:'2026-10-04T00:00:00.000Z',kind:'EXIT',public_reason:'test canonical exit readback',detail:{authority:0},state_after:{status:'EXITED',epoch:last?.state_after?.epoch||null},prev_hash:last.event_hash};
  const row={...material,event_hash:sha(Buffer.from(JSON.stringify(material)))};fs.appendFileSync(file,JSON.stringify(row)+'\n');
  const reopened=reopenCohostContextRoot({storageRoot:f.storage,hostSessionId:f.session});assert.equal(reopened.released,true);assert.equal(reopened.routable,false);
  await assert.rejects(()=>routeCohostRuntimeTurn({storageRoot:f.storage,hostSessionId:f.session,input:'continua'}),e=>e?.code==='IKANT_COHOST_RELEASED');
 }finally{cleanup(f.root);}
});

test('C45 native chat delivery remains external evidence and is digest-bound',{concurrency:false},async()=>{
 const f=fixture();try{
  const env=await routeCohostRuntimeTurn({storageRoot:f.storage,hostSessionId:f.session,input:'TERMS'});
  const material={schema:COHOST_NATIVE_RECEIPT_SCHEMA,observation_owner:'HOST_NATIVE_CHAT',observed:true,surface:'NATIVE_CHAT',platform_roundtrip_id:'external-roundtrip-1',session_locator_sha256:env.session_locator_sha256,shell_receipt_sha256:env.shell_receipt_sha256,ascii_sha256:env.ascii_sha256,ascii_bytes:env.ascii_bytes,envelope_receipt_sha256:env.receipt_sha256,authority:0},receipt=sign(material);
  assert.equal(validateCohostNativeDeliveryReceipt(receipt,{envelope:env}).ok,true);
  assert.equal(validateCohostNativeDeliveryReceipt(sign({...material,surface:'APP_META'}),{envelope:env}).ok,false);
  assert.equal(validateCohostNativeDeliveryReceipt(sign({...material,ascii_sha256:'0'.repeat(64)}),{envelope:env}).ok,false);
 }finally{cleanup(f.root);}
});
