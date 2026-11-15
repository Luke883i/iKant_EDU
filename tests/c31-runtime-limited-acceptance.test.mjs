import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {deploySessionChatRuntime,openDeployedSession,acceptDeployedLimitedSession} from '../src/session-chat-deployment.mjs';
test('C31 exact limited acceptance creates source-bound capability without canonical ledger',{concurrency:false},async()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-le-c31-accept-')),deployment=path.join(d,'deploy');
 try{deploySessionChatRuntime({deploymentRoot:deployment,deploymentId:'D-C31-ACCEPT'});const before=openDeployedSession({deploymentRoot:deployment,sessionId:'CHAT-L'});assert.equal(before.acceptance_required,true);assert.equal(before.limited,false);
 const limited=await acceptDeployedLimitedSession({deploymentRoot:deployment,sessionId:'CHAT-L',humanInput:'I ACCEPT'});assert.equal(limited.state,'RUNTIME_BOUND_LIMITED');assert.equal(limited.active,false);assert.equal(limited.first_unclosed_edge,'ACTIVE_READBACK');assert.match(limited.capability_receipt_sha256,/^[a-f0-9]{64}$/);
 const sessionDir=path.join(deployment,'sessions',fs.readdirSync(path.join(deployment,'sessions'))[0]),runtimeDir=path.join(sessionDir,'runtime');assert.equal(fs.existsSync(path.join(runtimeDir,'.ikant','ledger.jsonl')),false);assert.equal(fs.existsSync(path.join(sessionDir,'limited-capability.json')),true);
 const after=openDeployedSession({deploymentRoot:deployment,sessionId:'CHAT-L'});assert.equal(after.limited,true);assert.equal(after.active,false);assert.equal(after.acceptance_required,false);assert.equal(after.service_state,'RUNTIME_BOUND_LIMITED');
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});
