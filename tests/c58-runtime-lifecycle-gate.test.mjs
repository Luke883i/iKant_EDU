import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from '../src/contract.mjs';
import {renderSessionChatLocalPrompt,renderSessionChatLocalPromptDocument,sessionChatLocalPromptReceipt} from '../src/session-chat-local-prompt.mjs';
import {compileIntentAwareFirstContact} from '../src/bootstrap-intent-adapter.mjs';

test('C58 executable first contact still starts from repo for any first user input',()=>{
 for(const input of ['ciao','audit della sessione','EXIT IKANT','I ACCEPT','inizializza iKant']){
  const x=compileIntentAwareFirstContact(input);
  assert.equal(x.next.terminal,'CANONICAL_PREACCEPT',input);
  assert.equal(x.next.pending_intent,input,input);
  assert.equal(x.next.preserve_pending_intent,true,input);
  assert.equal(x.next.first_input_bootstrap,true,input);
 }
});

test('C59 composition preserved and C67 v5 prompt adds no second retry owner',()=>{
 const p=renderSessionChatLocalPrompt(),r=sessionChatLocalPromptReceipt();
 assert.equal(r.schema,'ikant-le-session-chat-local-prompt/v7');
 assert.equal(r.version,'7.0.0');assert.equal(r.authority,0);assert.ok(r.chars<8000); assert.ok(p.includes('CONTROLLO 360 INGRESS_ORIGIN_C68'));assert.ok(p.includes('CONTROLLO 370 PREVIEW_C69'));
 for(const x of ['AZIONE 000 START_FROM_REPO','AZIONE 100 BIND_SOURCE','AZIONE 110 READ_ORIENTATION','AZIONE 120 PRESENT_TERMS','STOP 140 WAIT_ACCEPTANCE','AZIONE 200 ACCEPT','AZIONE 300 ACTIVATE_FIRST','AZIONE 310 MATERIALIZE_LOCAL','AZIONE 400 RUNTIME_ROUTE','AZIONE 900 EXIT','STOP 990 EDGE_STOP'])assert.ok(p.includes(x),x);
 for(const x of ['GITHUB_API_BASE64','VERIFIED_OPAQUE_RELAY','La rete GitHub del container non è una dipendenza','Un canale vivo non censito è un errore di composizione','Riprendi PENDING_INTENT soltanto dopo ACTIVE readback','owner canonico','materializer canonico','stesso receipt di composizione','C59_CANONICAL_ACTIVE'])assert.ok(p.includes(x),x);
 for(const x of ['CONTROLLO 320 PROOF_LOOP','CONTROLLO 330 RETRY_LOCAL_C67','CONTROLLO 340 ESITO_LIMITATO_C66','CONTROLLO 350 SEPARA_LAVORO_INDIPENDENTE','ESEGUI quell\'azione','Solo l\'owner canonico può autorizzare'])assert.ok(p.includes(x),'C67 prompt control: '+x);
 for(const line of p.split('\n'))assert.equal(/^\s/.test(line),false,'prompt indentation forbidden: '+JSON.stringify(line));
 assert.equal(fs.readFileSync(path.join(ROOT,'docs/SESSION_CHAT_LOCAL_PROMPT.md'),'utf8'),renderSessionChatLocalPromptDocument());
 const k=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/session-chat-local-host-kernel.json'),'utf8'));
 assert.equal(k.schema,'ikant-le-session-chat-local-host-kernel/v4');
 assert.equal(k.trigger.event,'ANY_FIRST_USER_INPUT');assert.equal(k.trigger.action,'START_FROM_REPO');
 assert.equal(k.preaccept.transport,'GITHUB_API_ONLY');assert.equal(k.preaccept.materialize_local,false);
 assert.equal(k.postaccept.mode,'SINGLE_COMPOSITION_CHANNEL');
 assert.equal(k.postaccept.cold_transport,'GITHUB_API_BASE64');assert.equal(k.postaccept.byte_path,'VERIFIED_OPAQUE_RELAY');
 assert.equal(k.postaccept.container_github_network_required,false);assert.equal(k.postaccept.canonical_materializer,'src/runtime-root-verified.mjs#executeCanonicalSessionChatBootstrap');assert.equal(k.postaccept.canonical_runtime_entry,'src/runtime-command.mjs#runCanonicalSessionChat');assert.equal(k.postaccept.canonical_active_readback,'src/runtime-command.mjs#canonicalActiveReadback');assert.equal(k.postaccept.canonical_authority,'C59_CANONICAL');
 assert.deepEqual(k.action_program.map(x=>x.name),['START_FROM_REPO','BIND_SOURCE','READ_ORIENTATION','PRESENT_TERMS','FREEZE','WAIT_ACCEPTANCE','ACCEPT','ACTIVATE_FIRST','MATERIALIZE_LOCAL','RUNTIME_ROUTE','EXIT','EDGE_STOP']);
});
