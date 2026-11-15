import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {deploySessionChatRuntime,ensureSessionChatDeployment,readSessionChatDeployment,openDeployedSession,acceptDeployedSession,runDeployedSessionTurn} from '../src/session-chat-deployment.mjs';
import {validateAcceptanceOriginReceipt} from '../src/bootstrap-semantic.mjs';
import {availabilityFromBootstrapFailure} from '../src/runtime-availability.mjs';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'ikant-le-c20-'));
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');

test('C58 ensure-on-start creates once, reopens exactly and is idempotent',{concurrency:false},()=>{
 const d=temp(),deployment=path.join(d,'deploy');try{
  const first=ensureSessionChatDeployment({deploymentRoot:deployment});
  assert.equal(first.created,true);assert.equal(first.ensured,true);
  assert.match(first.deployment.deployment_id,/^auto-[a-f0-9]{12}-[a-f0-9]{12}$/);
  const second=ensureSessionChatDeployment({deploymentRoot:deployment});
  assert.equal(second.created,false);assert.equal(second.ensured,true);
  assert.equal(second.deployment.receipt_sha256,first.deployment.receipt_sha256);
  assert.equal(second.deployment.source_head,first.deployment.source_head);
  assert.equal(second.descriptor.runtime_root_sha256,first.descriptor.runtime_root_sha256);
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});

test('C58 ensure-on-start fails closed on nonempty unattested deployment root',{concurrency:false},()=>{
 const d=temp(),deployment=path.join(d,'deploy');try{fs.mkdirSync(deployment,{recursive:true});fs.writeFileSync(path.join(deployment,'junk'),'x');assert.throws(()=>ensureSessionChatDeployment({deploymentRoot:deployment}),/deployment root exists without attestation/);}finally{fs.rmSync(d,{recursive:true,force:true});}
});

test('C58 deployment source binding rejects dirty distributed bytes',{concurrency:false},()=>{
 const file=path.join(root,'README.md'),before=fs.readFileSync(file);const d=temp();try{
  fs.appendFileSync(file,'\nC58-DIRTY-SOURCE-PROBE\n');
  assert.throws(()=>ensureSessionChatDeployment({deploymentRoot:path.join(d,'deploy')}),/deployment source worktree drift/);
 }finally{fs.writeFileSync(file,before);fs.rmSync(d,{recursive:true,force:true});}
});

test('C20 deploy-once store attests exact candidate HEAD and reference runtime',{concurrency:false},()=>{
 const d=temp();try{const dep=deploySessionChatRuntime({deploymentRoot:path.join(d,'deploy'),deploymentId:'D-C20'});const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();assert.equal(dep.source_head,head);assert.equal(dep.repository_transfer_per_chat,false);assert.equal(dep.reference_root_reopen_verified,true);assert.equal(dep.physical_chatgpt_registration_proven,false);assert.equal(readSessionChatDeployment(path.join(d,'deploy')).deployment.receipt_sha256,dep.receipt_sha256);}finally{fs.rmSync(d,{recursive:true,force:true});}
});

test('C20 original C72 source is physically present and reopened in legacy store and runtime',{concurrency:false},()=>{
 const d=temp(),deployment=path.join(d,'deploy'),rel='contracts/c72-public-mode-admission-v2.json';
 try{deploySessionChatRuntime({deploymentRoot:deployment});const original=fs.readFileSync(path.join(root,rel));
  for(const stage of ['store','reference-runtime'])assert.deepEqual(fs.readFileSync(path.join(deployment,stage,rel)),original);
  const c=JSON.parse(original.toString('utf8'));assert.equal(c.source_identity.canonical_repository,'Luke883i/iKant_EDU');
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});

test('C20 exact I ACCEPT reaches real persisted/read-back ACTIVE with zero remote rounds',{concurrency:false},async()=>{
 const d=temp(),deployment=path.join(d,'deploy');try{deploySessionChatRuntime({deploymentRoot:deployment,deploymentId:'D-ACTIVE'});const before=openDeployedSession({deploymentRoot:deployment,sessionId:'CHAT-1'});assert.equal(before.acceptance_required,true);const active=await acceptDeployedSession({deploymentRoot:deployment,sessionId:'CHAT-1',humanInput:'I ACCEPT'});assert.equal(active.state,'ACTIVE');assert.equal(active.runtime_readback_active,true);assert.equal(active.repository_transfer_per_chat,false);assert.equal(active.transfer_mode,'WARM_CACHE_EXACT');assert.equal(active.remote_rounds,0);assert.equal(active.deadline_result,'DEADLINE_PASS');assert.match(active.acceptance_origin_ticket_sha256,/^[a-f0-9]{64}$/);assert.match(active.acceptance_origin_receipt_sha256,/^[a-f0-9]{64}$/);const after=openDeployedSession({deploymentRoot:deployment,sessionId:'CHAT-1'});assert.equal(after.active,true);assert.equal(after.acceptance_required,false);}finally{fs.rmSync(d,{recursive:true,force:true});}
});

test('C20 acceptance origin v2 binds the persisted monotonic ticket and rejects reconstruction',{concurrency:false},async()=>{
 const d=temp(),deployment=path.join(d,'deploy');try{deploySessionChatRuntime({deploymentRoot:deployment});await acceptDeployedSession({deploymentRoot:deployment,sessionId:'CHAT-ORIGIN',humanInput:'I ACCEPT'});const sessionDir=path.join(deployment,'sessions',fs.readdirSync(path.join(deployment,'sessions'))[0]),runtimeDir=path.join(sessionDir,'runtime'),origin=JSON.parse(fs.readFileSync(path.join(runtimeDir,'.ikant','acceptance-origin.json'),'utf8')),ticket=JSON.parse(fs.readFileSync(path.join(sessionDir,'acceptance-origin-ticket.json'),'utf8')),terms=crypto.createHash('sha256').update(fs.readFileSync(path.join(deployment,'store','TERMS.md'))).digest('hex');assert.equal(origin.schema,'ikant-le-acceptance-origin/v2');assert.equal(origin.origin_ticket.ticket_sha256,ticket.ticket_sha256);assert.equal(validateAcceptanceOriginReceipt(origin,{sourceHead:origin.source_head,termsDigest:terms}).ok,true);const bad=structuredClone(origin);bad.origin_ticket.origin_monotonic_ms+=1;const material=structuredClone(bad);delete material.receipt_sha256;bad.receipt_sha256=sha(material);const v=validateAcceptanceOriginReceipt(bad,{sourceHead:bad.source_head,termsDigest:terms});assert.equal(v.ok,false);assert.equal(v.result,'DEADLINE_ORIGIN_INVALID');}finally{fs.rmSync(d,{recursive:true,force:true});}
});

test('C20 non-exact or second acceptance cannot create another epoch',{concurrency:false},async()=>{
 const d=temp(),deployment=path.join(d,'deploy');try{deploySessionChatRuntime({deploymentRoot:deployment});await assert.rejects(()=>acceptDeployedSession({deploymentRoot:deployment,sessionId:'CHAT-X',humanInput:'ACCEPT'}),/exact I ACCEPT/);const active=await acceptDeployedSession({deploymentRoot:deployment,sessionId:'CHAT-X',humanInput:'I ACCEPT'});assert.equal(active.state,'ACTIVE');await assert.rejects(()=>acceptDeployedSession({deploymentRoot:deployment,sessionId:'CHAT-X',humanInput:'I ACCEPT'}),/already consumed/);}finally{fs.rmSync(d,{recursive:true,force:true});}
});

test('C20 deployed ACTIVE executes a real subsequent runtime turn from session-local root',{concurrency:false},async()=>{
 const d=temp(),deployment=path.join(d,'deploy');try{deploySessionChatRuntime({deploymentRoot:deployment});await acceptDeployedSession({deploymentRoot:deployment,sessionId:'CHAT-TURN',humanInput:'I ACCEPT'});const turn=await runDeployedSessionTurn({deploymentRoot:deployment,sessionId:'CHAT-TURN',input:'continuiamo con una risposta breve ma rigorosa'});assert.equal(turn.code,0);assert.equal(turn.state,'ACTIVE');assert.equal(turn.runtime_readback,true);assert.ok(turn.stdout.length>0);assert.match(turn.stdout,/Backlog e telemetria:/);assert.equal(turn.session_shell?.status?.display_status,'ACTIVE');assert.equal(turn.artifacts?.length,1);}finally{fs.rmSync(d,{recursive:true,force:true});}
});

test('C20 deployment tamper fails closed before session binding',{concurrency:false},()=>{
 const d=temp(),deployment=path.join(d,'deploy');try{deploySessionChatRuntime({deploymentRoot:deployment});const file=path.join(deployment,'deployment.json'),dep=JSON.parse(fs.readFileSync(file,'utf8'));dep.source_head='e'.repeat(40);fs.writeFileSync(file,JSON.stringify(dep));assert.throws(()=>openDeployedSession({deploymentRoot:deployment,sessionId:'CHAT-T'}),/deployment attestation invalid|deployment identity invalid/);}finally{fs.rmSync(d,{recursive:true,force:true});}
});

test('C20 reference MCP package keeps acceptance and turns app-only',()=>{
 const server=fs.readFileSync(path.join(root,'plugins/ikant-le-session-chat/server/server.mjs'),'utf8'),manifest=JSON.parse(fs.readFileSync(path.join(root,'plugins/ikant-le-session-chat/plugin.json'),'utf8'));assert.equal(manifest.name,'ikant-le-session-chat');assert.match(server,/ikant_le_open/);assert.match(server,/ikant_le_accept/);assert.match(server,/ikant_le_turn/);assert.match(server,/visibility:\['model','app'\]/);assert.ok((server.match(/visibility:\['app'\]/g)||[]).length>=2);
});


test('C20 compatibility contradiction is translated to canonical transfer binding before availability',()=>{
 const d=availabilityFromBootstrapFailure({accepted:true,sourceBound:true,consentValid:true,evidenceValidation:{ok:false,deadline_result:'DEADLINE_PASS',errors:['transfer_binding','bridge_observed']},probe:null,writer:true});
 assert.equal(d.state,'BLOCKED_INTEGRITY');
 assert.ok(d.integrity_codes.includes('TRANSFER_IDENTITY_MISMATCH'));
 assert.equal(d.fresh_chat_required,true);
});

test('C38 canonical deployed turn exposes CONTROL evidence unavailability without simulating OS',{concurrency:false},async()=>{const d=temp(),deployment=path.join(d,'deploy');try{deploySessionChatRuntime({deploymentRoot:deployment});await acceptDeployedSession({deploymentRoot:deployment,sessionId:'CHAT-C38',humanInput:'I ACCEPT'});const turn=await runDeployedSessionTurn({deploymentRoot:deployment,sessionId:'CHAT-C38',input:'verifica la chiusura semantica del control evidence'});const q=turn.session_shell?.self_summary?.subject_projection;assert.equal(turn.state,'ACTIVE');assert.equal(q?.schema,'ikant-le-subject-projection/v3');assert.equal(q?.runtime_evidence_available,true);assert.equal(q?.control_evidence?.availability,'UNAVAILABLE');assert.equal(q?.operational_subject,'UNAVAILABLE');assert.equal(q?.control_plane_implication,'NONE');}finally{fs.rmSync(d,{recursive:true,force:true});}});
