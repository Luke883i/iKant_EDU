import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {deploySessionChatRuntime,acceptDeployedLimitedSession,runDeployedLimitedSessionTurn} from '../src/session-chat-deployment.mjs';
const candidate=('Questa risposta appartiene al servizio runtime limitato e rimane esplicitamente non ACTIVE. '+
 'La capability e legata alla stessa sorgente, al runtime root materializzato, alla provenienza del codice eseguito e alla acceptance origin osservata. '+
 'Il dispatch Node viene generato dal runtime sul medesimo input, l output viene sigillato e il backlog DOCX viene pubblicato atomicamente e riletto. '+
 'La telemetria e calcolata da check effettivi, non modifica il ledger canonico e non dichiara alcun acknowledgement della piattaforma. '+
 'La sola promozione possibile resta il normale ACTIVE_READBACK del lifecycle canonico.');
test('C31 deployed limited turn closes dispatch seal telemetry and atomic DOCX without ledger mutation',{concurrency:false},async()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-le-c31-turn-')),deployment=path.join(d,'deploy');
 try{deploySessionChatRuntime({deploymentRoot:deployment});await acceptDeployedLimitedSession({deploymentRoot:deployment,sessionId:'CHAT-T',humanInput:'I ACCEPT'});
 const input='Produci una risposta runtime limitata con backlog e telemetria verificabili.',turn=await runDeployedLimitedSessionTurn({deploymentRoot:deployment,sessionId:'CHAT-T',input,candidate});
 assert.equal(turn.state,'RUNTIME_BOUND_LIMITED');assert.equal(turn.mode,'IKANT_RUNTIME_LIMITED');assert.equal(turn.active,false);assert.equal(turn.canonical_state_mutation,false);assert.equal(turn.platform_ack_required,false);assert.equal(turn.host_delivery_proven,false);
 assert.equal(turn.artifacts.length,1);const a=turn.artifacts[0];assert.equal(a.atomic_publish,true);assert.equal(a.readback_verified,true);assert.equal(a.download_handoff,true);assert.match(a.name,/^iKant_LE_Limited_[a-f0-9]{64}\.docx$/);assert.ok(fs.existsSync(a.local_path));assert.ok(fs.statSync(a.local_path).size>1000);
 const sessionDir=path.dirname(path.dirname(a.local_path)),runtimeDir=path.join(sessionDir,'runtime');assert.equal(fs.existsSync(path.join(runtimeDir,'.ikant','ledger.jsonl')),false);
 assert.match(turn.node_dispatch_receipt_sha256,/^[a-f0-9]{64}$/);assert.match(turn.runtime_seal_sha256,/^[a-f0-9]{64}$/);assert.match(turn.telemetry_sha256,/^[a-f0-9]{64}$/);assert.match(turn.limited_turn_receipt_sha256,/^[a-f0-9]{64}$/);
 }finally{fs.rmSync(d,{recursive:true,force:true});}
});
