import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {runtimePaths,readLedger} from '../src/state.mjs';
import {runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';
import {selectFastbootCarrier,validateFastbootAttempt,validateFastbootConvergence,FASTBOOT_CAPABILITY_FIELDS} from '../src/fastboot-convergence.mjs';
import {runCommand} from '../src/runtime.mjs';
import {bootstrapEvidence,bootstrapHandoff,failedFastbootAttempt,bindConvergenceToTransfer} from './bootstrap-fixture.mjs';

const digest=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const resign=x=>{const y=structuredClone(x);delete y.receipt_sha256;return{...y,receipt_sha256:digest(y)}};
const proven=()=>Object.fromEntries(FASTBOOT_CAPABILITY_FIELDS.map(k=>[k,true]));
const reset=()=>fs.rmSync(runtimePaths().dir,{recursive:true,force:true});

test('C19 planner prefers an observed executable carrier over unknown edges',()=>{
 const p=selectFastbootCarrier({capabilities:{PINNED_PERMALINK:{},GITHUB_API_BASE64:proven()}});
 assert.equal(p.state,'EXECUTABLE');assert.equal(p.carrier,'GITHUB_API_BASE64');
});
test('C19 unknown edge is probed once then exhausted when no observed carrier exists',()=>{
 const p=selectFastbootCarrier({capabilities:{PINNED_PERMALINK:{}}});
 assert.equal(p.state,'PROBE_REQUIRED');assert.equal(p.carrier,'WARM_CACHE_EXACT');
 const allProbe=Array.from(['WARM_CACHE_EXACT','HOST_FILE_BRIDGE','GITHUB_API_BASE64','GITHUB_GIT_BLOB_API','PINNED_GITHUB_ZIP','PINNED_PERMALINK'],x=>'PROBE:'+x);
 const q=selectFastbootCarrier({capabilities:{PINNED_PERMALINK:{}},attemptedClasses:allProbe});
 assert.equal(q.state,'EXHAUSTED');
});
test('C19 zero-object failure is quarantined and a distinct complete carrier commits once',()=>{
 reset();const source='a'.repeat(40),event='accept-'+source.slice(0,12)+'-10';
 const failed=failedFastbootAttempt({sourceHead:source,acceptanceEventId:event,carrier:'PINNED_PERMALINK'});
 const e=bootstrapEvidence({sourceHead:source,elapsedBeforeRuntimeMs:10,transferSchema:'v2',flexMode:'GITHUB_API_BASE64',failedAttempts:[failed]});
 const root=runtimeRootDescriptor(),v=validateFastbootConvergence(e.fastboot_convergence,{sourceHead:source,runtimeRootSha256:root.runtime_root_sha256,runtimeRootDescriptor:root,acceptanceEventId:event,transferReceiptSha256:e.transfer.receipt_sha256});
 assert.equal(v.ok,true);assert.equal(v.attempt_count,2);assert.equal(v.selected_carrier,'GITHUB_API_BASE64');reset();
});
test('C19 partial failure is non-authoritative and recoverable before history commit',()=>{
 reset();const source='a'.repeat(40),event='accept-'+source.slice(0,12)+'-10';
 const partial=failedFastbootAttempt({sourceHead:source,acceptanceEventId:event,carrier:'PINNED_GITHUB_ZIP',partial:2});
 const root=runtimeRootDescriptor(),a=validateFastbootAttempt(partial,{sourceHead:source,runtimeRootSha256:root.runtime_root_sha256,runtimeRootDescriptor:root,acceptanceEventId:event});
 assert.equal(a.ok,true);assert.equal(a.complete,false);
 const e=bootstrapEvidence({sourceHead:source,elapsedBeforeRuntimeMs:10,transferSchema:'v2',flexMode:'GITHUB_API_BASE64',failedAttempts:[partial]});
 const v=validateFastbootConvergence(e.fastboot_convergence,{sourceHead:source,runtimeRootSha256:root.runtime_root_sha256,runtimeRootDescriptor:root,acceptanceEventId:event,transferReceiptSha256:e.transfer.receipt_sha256});
 assert.equal(v.ok,true);reset();
});
test('C19 duplicate carrier retry is rejected',()=>{
 reset();const source='a'.repeat(40),event='accept-'+source.slice(0,12)+'-10';
 const failed=failedFastbootAttempt({sourceHead:source,acceptanceEventId:event,carrier:'GITHUB_API_BASE64'});
 const e=bootstrapEvidence({sourceHead:source,elapsedBeforeRuntimeMs:10,transferSchema:'v2',flexMode:'GITHUB_API_BASE64',failedAttempts:[failed]});
 const root=runtimeRootDescriptor(),v=validateFastbootConvergence(e.fastboot_convergence,{sourceHead:source,runtimeRootSha256:root.runtime_root_sha256,runtimeRootDescriptor:root,acceptanceEventId:event,transferReceiptSha256:e.transfer.receipt_sha256});
 assert.equal(v.ok,false);assert.ok(v.errors.includes('materially_distinct_retry'));reset();
});
test('C19 failed attempt cannot claim authoritative history or committed round',()=>{
 const source='a'.repeat(40),event='accept-'+source.slice(0,12)+'-10',root=runtimeRootDescriptor();
 let failed=failedFastbootAttempt({sourceHead:source,acceptanceEventId:event,carrier:'PINNED_PERMALINK'});failed.authoritative_remote_history=true;failed=resign(failed);
 const v=validateFastbootAttempt(failed,{sourceHead:source,runtimeRootSha256:root.runtime_root_sha256,runtimeRootDescriptor:root,acceptanceEventId:event});
 assert.equal(v.ok,false);assert.ok(v.errors.includes('authoritative_history'));
});
test('C19 model-mediated attempt fails closed',()=>{
 const source='a'.repeat(40),event='accept-'+source.slice(0,12)+'-10',root=runtimeRootDescriptor();
 let failed=failedFastbootAttempt({sourceHead:source,acceptanceEventId:event,carrier:'PINNED_PERMALINK'});failed.model_mediated_bytes=true;failed=resign(failed);
 assert.equal(validateFastbootAttempt(failed,{sourceHead:source,runtimeRootSha256:root.runtime_root_sha256,runtimeRootDescriptor:root,acceptanceEventId:event}).ok,false);
});
test('C19 successful failover reaches ACTIVE without second acceptance',{concurrency:false},()=>{
 reset();const source='a'.repeat(40),event='accept-'+source.slice(0,12)+'-10';
 const failed=failedFastbootAttempt({sourceHead:source,acceptanceEventId:event,carrier:'PINNED_PERMALINK'});
 const e=bootstrapEvidence({sourceHead:source,elapsedBeforeRuntimeMs:10,transferSchema:'v2',flexMode:'GITHUB_API_BASE64',failedAttempts:[failed]});
 const out=runCommand('I ACCEPT',{preacceptHandoff:bootstrapHandoff('inizializza',source),postAcceptBootstrapEvidence:e,hostEngine:'GPT-TEST'});
 assert.equal(out.code,0);const ledger=readLedger(),after=ledger.at(-1).state_after;
 assert.equal(after.status,'ACTIVE');assert.equal(after.admission.acceptance_consumed,true);assert.equal(ledger.filter(x=>x.kind==='ACCEPT').length,1);reset();
});
test('C19 convergence transfer binding cannot be rewritten after the final attempt',()=>{
 reset();const source='a'.repeat(40),e=bootstrapEvidence({sourceHead:source,transferSchema:'v2',flexMode:'GITHUB_API_BASE64'}),root=runtimeRootDescriptor();
 e.fastboot_convergence.committed_transfer_receipt_sha256='0'.repeat(64);e.fastboot_convergence=resign(e.fastboot_convergence);
 const v=validateFastbootConvergence(e.fastboot_convergence,{sourceHead:source,runtimeRootSha256:root.runtime_root_sha256,runtimeRootDescriptor:root,acceptanceEventId:e.acceptance_event_id,transferReceiptSha256:e.transfer.receipt_sha256});
 assert.equal(v.ok,false);assert.ok(v.errors.includes('transfer_commit_binding'));reset();
});
