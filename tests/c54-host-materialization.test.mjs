import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ROOT,readContract} from '../src/contract.mjs';
import {buildSessionShell,renderSessionShell} from '../src/session-shell.mjs';
import {buildHostConsumptionFrame,validateHostConsumptionFrame} from '../src/host-consumption-frame.mjs';
import {deploySessionChatRuntime,openDeployedSession} from '../src/session-chat-deployment.mjs';

const base={status:'ORIENTING',accepted:false,probed:false,admission:{terms_presented:false,source_head:null,source_head_locked:false,orientation_objects:[]},bootstrap:{terminal:'UNVERIFIED',probe:null},experience:{turns:0,maturity_mode:'ORIENTING'},psyche:{last_runtime_outcome:'NONE'}};
const active={...base,status:'ACTIVE',accepted:true,probed:true,admission:{terms_presented:true,source_head:'a'.repeat(40),source_head_locked:true,orientation_objects:Array(5).fill({})},bootstrap:{terminal:'ACTIVE',probe:{ok:true,executed_provenance_receipt_sha256:'b'.repeat(64)}},experience:{turns:2,maturity_mode:'ESTABLISHED'},psyche:{last_runtime_outcome:'ANSWER'}};
const artifact={name:'backlog.docx',media_type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',sha256:'c'.repeat(64),descriptor_sha256:'d'.repeat(64),bytes:20,readback_verified:true,required_presentation:true,same_turn:true};
function activeResult(text='Active answer'){
 const shell=buildSessionShell({surfaceText:text,state:active,artifacts:[artifact],release:{surface_b_required:true,release_sha256:'e'.repeat(64)}});
 return{state:'ACTIVE',stdout:renderSessionShell(shell),artifacts:[artifact],session_shell:shell};
}

const baselineFrame=()=>buildHostConsumptionFrame({result:{state:'AWAITING_ACCEPTANCE',acceptance_required:true,artifacts:[]},sourceHead:'a'.repeat(40),runtimeRootSha256:'b'.repeat(64),sessionRef:'session-1'});

const canonicalPromise=()=>readContract().ontological_promise;
const baselineFrameExplicit=()=>buildHostConsumptionFrame({result:{state:'AWAITING_ACCEPTANCE',acceptance_required:true,artifacts:[]},sourceHead:'a'.repeat(40),runtimeRootSha256:'b'.repeat(64),sessionRef:'session-1',ontologicalPromise:canonicalPromise()});

test('C54 canonical promise schema',()=>{const p=canonicalPromise();assert.equal(p.schema,'ikant-le-ontological-promise/v1');});
test('C54 canonical promise atoms array',()=>{const p=canonicalPromise();assert.equal(Array.isArray(p.atoms),true);});
test('C54 canonical promise atom count',()=>{const p=canonicalPromise();assert.equal(p.atoms.length,36);});
test('C54 baseline explicit canonical promise builds',()=>{assert.doesNotThrow(()=>baselineFrameExplicit());});
const baselineBuildError=()=>{try{baselineFrame();return null;}catch(e){return String(e?.message||e);}}
test('C54 baseline builder rejects no promise-source error',()=>{const e=baselineBuildError();assert.equal(/ontological promise source invalid/.test(String(e)),false,e||'');});
test('C54 baseline builder rejects no promise-coverage error',()=>{const e=baselineBuildError();assert.equal(/promise application coverage invalid/.test(String(e)),false,e||'');});
test('C54 baseline builder rejects no artifact-proof error',()=>{const e=baselineBuildError();assert.equal(/artifact proof invalid/.test(String(e)),false,e||'');});
test('C54 baseline builder rejects no shell-artifact error',()=>{const e=baselineBuildError();assert.equal(/shell\/artifact/.test(String(e)),false,e||'');});
test('C54 baseline builder does not throw',()=>{assert.doesNotThrow(()=>baselineFrame());});
test('C54 baseline validator schema invariant',()=>{const v=validateHostConsumptionFrame(baselineFrame());assert.equal(v.errors.includes('schema'),false,JSON.stringify(v.errors));});
test('C54 baseline validator authority invariant',()=>{const v=validateHostConsumptionFrame(baselineFrame());assert.equal(v.errors.includes('authority'),false,JSON.stringify(v.errors));});
test('C54 baseline validator shell invariant',()=>{const v=validateHostConsumptionFrame(baselineFrame());assert.equal(v.errors.includes('shell'),false,JSON.stringify(v.errors));});
test('C54 baseline validator continuity invariant',()=>{const v=validateHostConsumptionFrame(baselineFrame());assert.equal(v.errors.includes('continuity'),false,JSON.stringify(v.errors));});
test('C54 baseline validator promise invariant',()=>{const v=validateHostConsumptionFrame(baselineFrame());assert.equal(v.errors.includes('promise'),false,JSON.stringify(v.errors));});
test('C54 baseline validator runtime_evidence invariant',()=>{const v=validateHostConsumptionFrame(baselineFrame());assert.equal(v.errors.includes('runtime_evidence'),false,JSON.stringify(v.errors));});
test('C54 baseline validator presentation invariant',()=>{const v=validateHostConsumptionFrame(baselineFrame());assert.equal(v.errors.includes('presentation'),false,JSON.stringify(v.errors));});
test('C54 baseline validator artifact invariant',()=>{const v=validateHostConsumptionFrame(baselineFrame());assert.equal(v.errors.includes('artifact'),false,JSON.stringify(v.errors));});
test('C54 baseline validator claim_boundary invariant',()=>{const v=validateHostConsumptionFrame(baselineFrame());assert.equal(v.errors.includes('claim_boundary'),false,JSON.stringify(v.errors));});
test('C54 baseline validator receipt invariant',()=>{const v=validateHostConsumptionFrame(baselineFrame());assert.equal(v.errors.includes('receipt'),false,JSON.stringify(v.errors));});
test('C54 baseline frame validates fail-closed',()=>{const v=validateHostConsumptionFrame(baselineFrame());assert.deepEqual(v.errors,[]);assert.equal(v.ok,true);});

test('C54 baseline shell is owner-rendered and exact',()=>{
 const f=baselineFrame();
 assert.equal(f.shell.source,'BOOTSTRAP_SHELL');
 assert.match(f.shell.text,/iKant/);
});

test('C54 baseline projects all 36 promise atoms with typed status',()=>{
 const f=baselineFrame();
 assert.equal(f.promise_application.atom_count,36);
 assert.equal(f.promise_application.status_complete,true);
 assert.equal(new Set(f.promise_application.atoms.map(x=>x.id)).size,36);
 assert.equal(f.promise_application.atoms.find(x=>x.id==='B3').materialization_status,'HOST_ACTION_OR_WITNESS_REQUIRED');
 assert.equal(f.promise_application.atoms.find(x=>x.id==='F4').materialization_status,'EXTERNAL_UNOBSERVED');
});

test('C54 baseline exposes exact acceptance as final host action',()=>{
 const f=baselineFrame();
 assert.equal(f.host_actions.at(-1).action,'COLLECT_EXACT_I_ACCEPT');
});

test('C54 ACTIVE host frame preserves exact shell bytes and blocks shell behind required artifact bytes',()=>{
 const r={...activeResult(),node_dispatch_receipt_sha256:'1'.repeat(64),runtime_turn_event_hash:'2'.repeat(64)},f=buildHostConsumptionFrame({result:r,sourceHead:'a'.repeat(40),runtimeRootSha256:'b'.repeat(64),sessionRef:'session-1'});
 assert.equal(validateHostConsumptionFrame(f).ok,true);
 assert.equal(f.shell.text,r.stdout);
 assert.deepEqual(f.presentation.order,['REQUIRED_ARTIFACT_BYTES','ASCII_SHELL']);
 assert.equal(f.presentation.required_artifact_count,1);
 assert.equal(f.claim_boundary.frame_is_host_presentation_receipt,false);
 assert.equal(f.claim_boundary.frame_is_native_transcript_proof,false);
 assert.equal(f.runtime_evidence.route_evidence_status,'RUNTIME_OWNER_RECEIPT');
 assert.equal(f.promise_application.atoms.find(x=>x.id==='E1').materialization_status,'CURRENT_FRAME_RUNTIME_EVIDENCE');
});

test('C54 shell continuity is stable across turns while exact per-turn shell receipts may change',()=>{
 const a=buildHostConsumptionFrame({result:activeResult('First active answer'),sourceHead:'a'.repeat(40),runtimeRootSha256:'b'.repeat(64),sessionRef:'session-1'});
 const b=buildHostConsumptionFrame({result:activeResult('Second active answer'),sourceHead:'a'.repeat(40),runtimeRootSha256:'b'.repeat(64),sessionRef:'session-1'});
 assert.equal(a.continuity_key_sha256,b.continuity_key_sha256);
 assert.notEqual(a.shell.sha256,b.shell.sha256);
 assert.notEqual(a.receipt_sha256,b.receipt_sha256);
});

test('C54 rejects shell reframing and shell/artifact drift',()=>{
 const r=activeResult();
 assert.throws(()=>buildHostConsumptionFrame({result:{...r,stdout:r.stdout+'\nrewritten'},sourceHead:'a'.repeat(40),runtimeRootSha256:'b'.repeat(64),sessionRef:'s'}),/exact-byte mismatch/);
 const bad={...r,artifacts:[{...artifact,sha256:'f'.repeat(64)}]};
 assert.throws(()=>buildHostConsumptionFrame({result:bad,sourceHead:'a'.repeat(40),runtimeRootSha256:'b'.repeat(64),sessionRef:'s'}),/shell\/artifact binding mismatch/);
});

test('C54 reference deployed baseline returns a host-consumable shell before acceptance',{concurrency:false},()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c54-'));try{
  const dep=path.join(root,'deploy');deploySessionChatRuntime({workspace:ROOT,deploymentRoot:dep});
  const o=openDeployedSession({deploymentRoot:dep,sessionId:'C54-BASELINE'});
  assert.equal(o.host_frame.schema,'ikant-le-host-consumption-frame/v1');
  assert.equal(o.host_frame.materialization_state,'HOST_MATERIALIZATION_READY');
  assert.equal(o.host_frame.shell.source,'BOOTSTRAP_SHELL');
  assert.equal(o.host_frame.promise_application.promise_contract_sha256.length,64);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('C54 host app consumes frame/payload directly and verifies bytes before rendering',()=>{
 const server=fs.readFileSync(path.join(ROOT,'plugins/ikant-le-session-chat/server/server.mjs'),'utf8');
 const app=fs.readFileSync(path.join(ROOT,'plugins/ikant-le-session-chat/server/public/ikant-le-app.html'),'utf8');
 assert.match(server,/ikant-le-host-app-payload\/v1/);
 assert.match(server,/data_base64/);
 assert.match(server,/frame_receipt_sha256/);
 assert.match(server,/required host artifact bytes unavailable/);
 assert.match(app,/host_frame/);
 assert.match(app,/host payload\/frame binding mismatch/);
 assert.match(app,/crypto\.subtle\.digest/);
 assert.match(app,/required artifact bytes unavailable/);
 assert.ok(app.indexOf("artifacts.classList.remove")<app.indexOf("out.textContent=shell.text"));
});

test('C54 frame remains a zero-authority projection over the canonical promise source',()=>{
 const f=buildHostConsumptionFrame({result:{state:'READ_REPO_ONLY',artifacts:[]},ontologicalPromise:readContract().ontological_promise});
 assert.equal(f.authority,0);assert.equal(f.persisted,false);assert.equal(f.new_lifecycle,false);assert.equal(f.new_state_writer,false);assert.equal(f.new_planner,false);assert.equal(f.new_turn_owner,false);
 assert.equal(f.external_gaps.some(x=>x.id==='HOST_NATIVE_TURN_GRANT'&&x.status==='EXTERNAL_UNOBSERVED'),true);
});

test('C54 deployed ACTIVE wrapper projects persisted runtime dispatch evidence instead of reconstructing it',()=>{const src=fs.readFileSync(path.join(ROOT,'src/session-chat-deployment.mjs'),'utf8');assert.match(src,/function readLastEvent/);assert.match(src,/event\?\.detail\?\.node_dispatch_receipt/);assert.match(src,/runtime_turn_event_hash:event\?\.event_hash/);});

test('C54 validator rejects promise status loss and runtime-evidence corruption',()=>{const f=buildHostConsumptionFrame({result:{state:'READ_REPO_ONLY',artifacts:[]},sourceHead:'a'.repeat(40),runtimeRootSha256:'b'.repeat(64),sessionRef:'s'});const bad1=structuredClone(f);bad1.promise_application.status_complete=false;assert.equal(validateHostConsumptionFrame(bad1).ok,false);const bad2=structuredClone(f);bad2.runtime_evidence.evidence_refs=['not-a-digest'];assert.equal(validateHostConsumptionFrame(bad2).ok,false);});

test('C54 baseline and ACTIVE frames keep one session continuity key while shell profile upgrades once',()=>{const base=buildHostConsumptionFrame({result:{state:'AWAITING_ACCEPTANCE',artifacts:[]},sourceHead:'a'.repeat(40),runtimeRootSha256:'b'.repeat(64),sessionRef:'session-1'});const activeFrame=buildHostConsumptionFrame({result:activeResult('Active after acceptance'),sourceHead:'a'.repeat(40),runtimeRootSha256:'b'.repeat(64),sessionRef:'session-1'});assert.equal(base.continuity_key_sha256,activeFrame.continuity_key_sha256);assert.notEqual(base.shell_profile_sha256,activeFrame.shell_profile_sha256);assert.equal(base.promise_application.extension_count,7);assert.equal(base.promise_application.all_extensions_projected,true);assert.equal(base.promise_application.extensions.find(x=>x.id==='DETERMINISTIC_ASCII_SESSION_SHELL').status,'CURRENT_FRAME_EVIDENCE');assert.equal(base.promise_application.extensions.find(x=>x.id==='NATIVE_SCHEDULER_TURN_GRANT').status,'EXTERNAL_UNOBSERVED');});
