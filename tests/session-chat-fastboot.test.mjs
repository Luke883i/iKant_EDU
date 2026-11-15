import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {runtimeRootDescriptor,validateRuntimeRootDescriptor,materializeRuntimeRoot} from '../src/runtime-root-verified.mjs';
import {readTerms,readOrientationCapsule,sha256} from '../src/contract.mjs';
import {runtimePaths,readLedger} from '../src/state.mjs';
import {runCommand} from '../src/runtime.mjs';
import {bootstrapEvidence} from './bootstrap-fixture.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const terms=readTerms();
function reset(){fs.rmSync(runtimePaths().dir,{recursive:true,force:true});}
function handoff(pending='inizializza'){const c=readOrientationCapsule();return{schema:'ikant-le-preaccept-handoff/v1',repository:'Luke883i/iKant_EDU',source_head:'a'.repeat(40),terms_presented:true,terms_digest:terms.digest,frozen:true,breached:false,pending_intent:pending,pending_intent_sha256:sha256(Buffer.from(pending)),orientation_digests:Object.fromEntries(c.paths.map(rel=>[rel,sha256(fs.readFileSync(path.join(ROOT,rel)))])),runtime_observed_terms_presentation:false,host_attested_terms_presentation:true,authority:0};}
function gitBlobSha1(bytes){const b=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');}

test('C13 bootstrap exposes exactly eight post-accept reads and a valid runtime root',()=>{
  const b=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8'));
  assert.equal(b.post_accept_fastboot.remote_paths.length,8);
  assert.equal(b.post_accept_fastboot.remote_paths[0],'src/runtime-root-verified.mjs');
  assert.equal(b.post_accept_fastboot.deadline_ms,120000);
  assert.equal(b.post_accept_fastboot.deadline_on_exceed,'FAIL_CLOSED_NON_ACTIVE');
  assert.equal(b.session_chat_profile.id,'SESSION_CHAT');
  assert.equal(b.session_chat_profile.managed_local_model_required,false);
  assert.equal(b.session_chat_profile.activation_modality,'SESSION_CHAT_LOCAL');
  assert.equal(b.session_chat_activation.hosted_runtime_required,false);
  const d=runtimeRootDescriptor(ROOT);
  assert.equal(d.member_count,51);
  assert.equal(d.shards.length,7);
  assert.equal(d.runtime_root_sha256,b.post_accept_fastboot.runtime_root.runtime_root_sha256);
  assert.ok(d.members.some(x=>x.path==='stile_comunicativo.md'));
  assert.ok(d.members.some(x=>x.path==='src/runtime-limited-turn.mjs'));assert.ok(d.members.some(x=>x.path==='src/semantic-morphogenesis.mjs'));assert.ok(d.members.some(x=>x.path==='src/session-shell.mjs'));assert.ok(d.members.some(x=>x.path==='contracts/session-shell.json'));assert.ok(d.members.some(x=>x.path==='src/runtime-limited-capability.mjs'));assert.ok(d.members.some(x=>x.path==='src/runtime-dispatch.mjs'));assert.ok(d.members.some(x=>x.path==='src/runtime-evidence.mjs'));assert.ok(d.members.some(x=>x.path==='contracts/bootstrap-transfer-flex.json'));assert.ok(d.members.some(x=>x.path==='contracts/fastboot-convergence.json'));assert.ok(d.members.some(x=>x.path==='contracts/session-chat-activation.json'));assert.equal(d.members.some(x=>x.path==='src/session-chat-deployment.mjs'),false);assert.ok(d.members.some(x=>x.path==='src/fastboot-convergence.mjs'));assert.ok(d.members.some(x=>x.path==='src/runtime-availability.mjs'));assert.ok(d.members.some(x=>x.path==='contracts/runtime-availability-dod.json'));assert.ok(d.members.some(x=>x.path==='src/deadline-integrity.mjs'));assert.ok(d.members.some(x=>x.path==='contracts/deadline-integrity.json'));assert.ok(d.members.some(x=>x.path==='contracts/activation-continuation.json'));
  assert.deepEqual(validateRuntimeRootDescriptor(d),{ok:true,errors:[]});
});

test('C13 shard and member identities are mechanically bound to exact Git blob bytes',()=>{
  const d=runtimeRootDescriptor(ROOT);
  for(const s of d.shards) assert.equal(gitBlobSha1(fs.readFileSync(path.join(ROOT,s.path))),s.blob_sha1);
  for(const m of d.members){
    const shard=JSON.parse(fs.readFileSync(path.join(ROOT,d.shards[m.shard].path),'utf8'));
    const row=shard.members.find(x=>x.path===m.path);
    assert.ok(row,m.path);
    const bytes=Buffer.from(row.content,'utf8');
    assert.equal(bytes.length,m.bytes,m.path);
    assert.equal(gitBlobSha1(bytes),m.blob_sha1,m.path);
  }
});

test('C13 materializes atomically and reopens the exact runtime root',()=>{
  const d=runtimeRootDescriptor(ROOT);
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-le-c13-'));
  const sink=path.join(base,'runtime');
  try{
    const receipt=materializeRuntimeRoot({workspace:ROOT,sink,sourceHead:'a'.repeat(40),transferReceiptSha256:'f'.repeat(64)});
    assert.equal(receipt.runtime_root_sha256,d.runtime_root_sha256);
    assert.equal(receipt.member_count,d.member_count);
    assert.equal(receipt.shard_count,7);
    assert.equal(receipt.atomic_publish,true);
    assert.equal(receipt.reopen_verified,true);
    assert.ok(fs.existsSync(path.join(sink,'.ikant','materialization.json')));
    assert.equal(gitBlobSha1(fs.readFileSync(path.join(sink,'src','runtime-command.mjs'))),d.members.find(x=>x.path==='src/runtime-command.mjs').blob_sha1);
  }finally{fs.rmSync(base,{recursive:true,force:true});}
});

test('C13 pure initialization pending intent folds into ACTIVE without a synthetic turn',{concurrency:false},()=>{
  reset();
  try{
    const out=runCommand('I ACCEPT',{preacceptHandoff:handoff('inizializza'),postAcceptBootstrapEvidence:bootstrapEvidence(),hostEngine:'GPT-TEST'});
    assert.equal(out.code,0);
    assert.match(out.stdout,/intento di inizializzazione/i);
    const events=readLedger();
    const kinds=events.map(x=>x.kind);
    assert.ok(kinds.includes('INITIALIZE'));
    assert.ok(kinds.includes('PENDING_INTENT_FULFILLED_BY_ACTIVE'));
    assert.equal(kinds.includes('TURN'),false);
    assert.equal(events.at(-1).state_after.status,'ACTIVE');
  }finally{reset();}
});

test('C13 mixed initialization plus substantive intent still resumes exactly once',{concurrency:false},()=>{
  reset();
  try{
    const pending='inizializza e spiegami il reticolo minimo';
    const out=runCommand('I ACCEPT',{preacceptHandoff:handoff(pending),postAcceptBootstrapEvidence:bootstrapEvidence(),hostEngine:'GPT-TEST'});
    assert.equal(out.code,0);
    const events=readLedger();
    const kinds=events.map(x=>x.kind);
    assert.equal(kinds.filter(x=>x==='PENDING_INTENT_RESUME').length,1);
    assert.equal(kinds.filter(x=>x==='TURN').length,1);
    assert.equal(kinds.includes('PENDING_INTENT_FULFILLED_BY_ACTIVE'),false);
  }finally{reset();}
});
