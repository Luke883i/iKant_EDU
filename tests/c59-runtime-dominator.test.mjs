import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {bootstrapHandoffV2,bootstrapEvidenceV2} from './bootstrap-fixture.mjs';
import {issueCanonicalSessionChatComposition} from '../src/session-chat-composition.mjs';
import {executeCanonicalSessionChatBootstrap} from '../src/runtime-root-verified.mjs';
import {runCommand,canonicalActiveReadback} from '../src/runtime-command.mjs';
import {runtimePaths} from '../src/state.mjs';

const HEAD='a'.repeat(40);
const cleanSourceState=()=>fs.rmSync(runtimePaths().dir,{recursive:true,force:true});

test('C59 canonical owner materializes a runtime and is the authority read back by ACTIVE',async()=>{
 cleanSourceState();
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c59-canonical-')),sink=path.join(parent,'runtime');
 try{
  const preaccept=bootstrapHandoffV2('inizializza iKant_EDU',HEAD);
  const executor=bootstrapEvidenceV2({sourceHead:HEAD,bytePath:'VERIFIED_OPAQUE_RELAY'}).activation_executor;
  const handoff=issueCanonicalSessionChatComposition({preacceptHandoff:preaccept,activationExecutor:executor,humanInput:'I ACCEPT',acceptanceObservedMonotonicMs:10});
  const out=await executeCanonicalSessionChatBootstrap({sink,sourceHead:HEAD,canonicalCompositionHandoff:handoff});
  assert.equal(out.active,true);
  assert.equal(out.canonical_active_readback.ok,true);
  assert.equal(out.canonical_active_readback.state,'ACTIVE');
  assert.equal(out.canonical_active_readback.composition_authority,'C59_CANONICAL');
  assert.equal(out.canonical_active_readback.canonical_composition_receipt_sha256,handoff.receipt_sha256);
  const events=fs.readFileSync(path.join(sink,'.ikant','ledger.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  const state=events.at(-1).state_after;
  assert.equal(state.status,'ACTIVE');
  assert.equal(state.bootstrap.terminal,'ACTIVE');
  assert.equal(state.bootstrap.composition_authority,'C59_CANONICAL');
  assert.equal(state.bootstrap.canonical_composition_receipt_sha256,handoff.receipt_sha256);
  assert.equal(state.bootstrap.canonical_active_readback,true);
 }finally{
  cleanSourceState();
  fs.rmSync(parent,{recursive:true,force:true});
 }
});

test('C59 raw runtime activation without explicit compatibility evidence cannot consume acceptance',()=>{
 cleanSourceState();
 try{
  const preaccept=bootstrapHandoffV2('inizializza iKant_EDU',HEAD);
  const evidence=bootstrapEvidenceV2({sourceHead:HEAD,bytePath:'VERIFIED_OPAQUE_RELAY'});
  delete evidence.compatibility_only;
  const out=runCommand('I ACCEPT',{preacceptHandoff:preaccept,postAcceptBootstrapEvidence:evidence});
  assert.equal(out.code,1);
  const readback=canonicalActiveReadback();
  assert.equal(readback.ok,false);
  assert.notEqual(readback.composition_authority,'C59_CANONICAL');
 }finally{cleanSourceState();}
});

test('C59 explicit legacy compatibility may remain ACTIVE but can never satisfy canonical readback',()=>{
 cleanSourceState();
 try{
  const preaccept=bootstrapHandoffV2('inizializza iKant_EDU',HEAD);
  const evidence=bootstrapEvidenceV2({sourceHead:HEAD,bytePath:'LOCAL_DIRECT'});
  const out=runCommand('I ACCEPT',{preacceptHandoff:preaccept,postAcceptBootstrapEvidence:evidence,hostSurface:'LEGACY_TEST_HARNESS'});
  assert.equal(out.code,0);
  const readback=canonicalActiveReadback();
  assert.equal(readback.state,'ACTIVE');
  assert.equal(readback.composition_authority,'LEGACY_COMPATIBILITY');
  assert.equal(readback.ok,false);
  assert.equal(readback.canonical_composition_receipt_sha256,null);
  const blocked=runCommand('ciao',{hostSurface:'SESSION_CHAT_LOCAL_RUNTIME'});
  assert.equal(blocked.code,1);
  assert.match(blocked.stdout,/rejected legacy ACTIVE state/);
 }finally{cleanSourceState();}
});
