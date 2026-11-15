import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {readTerms} from '../src/contract.mjs';
import {runtimePaths,readLedger} from '../src/state.mjs';
import {runCommand,transitionPure} from '../src/runtime.mjs';
import {runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';
import {validateChatBootstrapEvidence,readLocalMaterializationReceipt,CHAT_BOOTSTRAP_DEADLINE_MS} from '../src/bootstrap-semantic.mjs';
import {DEADLINE_RESULT} from '../src/deadline-integrity.mjs';
import {bootstrapEvidence,bootstrapHandoff} from './bootstrap-fixture.mjs';

const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function resign(x){const y=structuredClone(x);delete y.receipt_sha256;return{...y,receipt_sha256:digest(y)};}
function reset(){fs.rmSync(runtimePaths().dir,{recursive:true,force:true});}
function validation(e,source='a'.repeat(40)){const root=runtimeRootDescriptor();return validateChatBootstrapEvidence(e,{sourceHead:source,runtimeRootSha256:root.runtime_root_sha256,loaderBlobSha1:root.loader.blob_sha1,localMaterializationReceipt:readLocalMaterializationReceipt(),runtimeRootDescriptor:root,termsDigest:readTerms().digest,deadlineMs:CHAT_BOOTSTRAP_DEADLINE_MS});}

test('C17 missing acceptance origin is distinct from exceeded',()=>{reset();let e=bootstrapEvidence({sourceHead:'a'.repeat(40)});delete e.acceptance_origin;e=resign(e);const v=validation(e);assert.equal(v.ok,false);assert.equal(v.deadline_result,DEADLINE_RESULT.ORIGIN_UNAVAILABLE);assert.notEqual(v.deadline_result,DEADLINE_RESULT.EXCEEDED);reset();});

test('C17 invalid clock is origin invalid, not exceeded',()=>{reset();let e=bootstrapEvidence({sourceHead:'a'.repeat(40)});e.acceptance_origin.clock='WALL';e.acceptance_origin=resign(e.acceptance_origin);e.acceptance_origin_receipt_sha256=e.acceptance_origin.receipt_sha256;e=resign(e);const v=validation(e);assert.equal(v.deadline_result,DEADLINE_RESULT.ORIGIN_INVALID);reset();});

test('C17 missing elapsed is elapsed unavailable, not exceeded',()=>{reset();let e=bootstrapEvidence({sourceHead:'a'.repeat(40)});delete e.acceptance_origin.elapsed_to_runtime_entry_ms;e.acceptance_origin=resign(e.acceptance_origin);e.acceptance_origin_receipt_sha256=e.acceptance_origin.receipt_sha256;e=resign(e);const v=validation(e);assert.equal(v.deadline_result,DEADLINE_RESULT.ELAPSED_UNAVAILABLE);assert.notEqual(v.deadline_result,DEADLINE_RESULT.EXCEEDED);reset();});

test('C17 observed elapsed above ceiling is exactly exceeded',()=>{reset();const e=bootstrapEvidence({sourceHead:'a'.repeat(40),elapsedBeforeRuntimeMs:120001});const v=validation(e);assert.equal(v.deadline_result,DEADLINE_RESULT.EXCEEDED);reset();});

test('C17 acceptance event binding mismatch is integrity-relevant evidence failure',()=>{reset();let e=bootstrapEvidence({sourceHead:'a'.repeat(40)});e.acceptance_event_id='different-acceptance-event-0001';e=resign(e);const v=validation(e);assert.equal(v.ok,false);assert.ok(v.errors.includes('acceptance_event_binding'));reset();});

test('C17 failed first acceptance is consumed and cannot be retried with a new epoch',{concurrency:false},()=>{reset();const source='a'.repeat(40);let e=bootstrapEvidence({sourceHead:source});delete e.acceptance_origin;e=resign(e);const first=runCommand('I ACCEPT',{preacceptHandoff:bootstrapHandoff('inizializza',source),postAcceptBootstrapEvidence:e,hostEngine:'GPT-TEST'});assert.equal(first.code,1);const s1=readLedger().at(-1).state_after;assert.equal(s1.accepted,true);assert.equal(s1.admission.acceptance_consumed,true);assert.equal(s1.status,'ADMISSION_EPOCH_UNRECOVERABLE');assert.equal(s1.bootstrap.deadline_terminal,DEADLINE_RESULT.ORIGIN_UNAVAILABLE);assert.equal(s1.admission.new_chat_required,true);const epoch=s1.epoch;const second=runCommand('I ACCEPT',{postAcceptBootstrapEvidence:bootstrapEvidence({sourceHead:source}),hostEngine:'GPT-TEST'});assert.equal(second.code,1);const s2=readLedger().at(-1).state_after;assert.equal(s2.epoch,epoch);assert.equal(s2.admission.acceptance_consumed,true);assert.notEqual(s2.status,'ACTIVE');reset();});

test('C17 deadline terminal is sticky across manual PROBE and INITIALIZE',{concurrency:false},()=>{reset();const source='a'.repeat(40);const out=runCommand('I ACCEPT',{preacceptHandoff:bootstrapHandoff('inizializza',source),postAcceptBootstrapEvidence:bootstrapEvidence({sourceHead:source,elapsedBeforeRuntimeMs:120001}),hostEngine:'GPT-TEST'});assert.equal(out.code,1);const failed=readLedger().at(-1).state_after;assert.equal(failed.status,'ADMISSION_EPOCH_UNRECOVERABLE');assert.equal(failed.bootstrap.deadline_terminal,DEADLINE_RESULT.EXCEEDED);const p=runCommand('PROBE IKANT',{probeRunner:()=>({ok:true,node:'22.16.0',fs:true,crypto:true,clock:true,artifact_sink:true})});assert.equal(p.code,1);const i=runCommand('INITIALIZE IKANT');assert.equal(i.code,1);assert.notEqual(readLedger().at(-1).state_after.status,'ACTIVE');reset();});

test('C17 pure transitions also deny recovery across sticky deadline',()=>{const s={schema:'ikant-le-state/v6',epoch:'epoch-1',status:'ADMISSION_EPOCH_UNRECOVERABLE',terms_digest:'f'.repeat(64),accepted:true,probed:false,initialized:false,bootstrap:{evidence_verified:true,deadline_result:DEADLINE_RESULT.EXCEEDED,deadline_terminal:DEADLINE_RESULT.EXCEEDED,acceptance_event_id:'accept-event-00000001'},admission:{breached:false,new_chat_required:true,acceptance_consumed:true,acceptance_event_id:'accept-event-00000001'}};assert.equal(transitionPure(s,'PROBE','f'.repeat(64),true).terminal,'DENY');assert.equal(transitionPure({...s,probed:true},'INITIALIZE','f'.repeat(64),true).terminal,'DENY');assert.equal(transitionPure(s,'ACCEPT','f'.repeat(64),true).terminal,'DENY');});
