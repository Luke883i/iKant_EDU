import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from '../src/contract.mjs';
import {readAiAgentFirstEntrypoint,renderLocalHostMetaPrompt,localHostMetaPromptReceipt} from '../src/local-host-meta-prompt.mjs';

const contract=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/local-host-post-meta-prompt.json'),'utf8'));

test('C55 contract and prompt remain authority-zero',()=>{
 const p=renderLocalHostMetaPrompt(),e=readAiAgentFirstEntrypoint(),r=localHostMetaPromptReceipt();
 assert.equal(contract.irreducible_mechanisms.length,17);
 assert.equal(contract.qualification.full_architecture_lattice,131072);
 assert.equal(r.schema,'ikant-le-local-host-adapter/v7');
 assert.equal(r.authority,0);
 assert.match(p,/unico ingresso tecnico caller-facing/);
 assert.match(p,/Non e un nuovo owner del NEXT/);
 assert.equal(e.role,'PROJECTION_AND_DELEGATION_ONLY');
 assert.equal(e.new_planner,false);
});

test('C55 forbids caller shadow state and caller-selected UNKNOWN handling',()=>{
 const p=renderLocalHostMetaPrompt(),e=readAiAgentFirstEntrypoint();
 assert.match(p,/Non usare la conversazione come ledger, retry memory, capability cache o stato/);
 assert.match(p,/trattandoli come opachi/);
 assert.match(p,/UNKNOWN non e evidenza negativa/);
 assert.match(p,/probe soltanto se la direttiva owner-derived lo richiede/);
 assert.match(p,/usando soltanto la forma di input che esso ammette/);
 assert.match(p,/re-entry richiede un'osservazione/);
 assert.equal(e.reentry.retry_memory_from_ledger,true);
 assert.equal(e.reentry.caller_attempted_classes_forbidden,true);
 assert.equal(e.bootstrap_type_registry_cache.registry_absence_implies_unavailable,false);
});

test('C55 blocks receipt invention, lateral exploration and post-handoff planning',()=>{
 const p=renderLocalHostMetaPrompt(),e=readAiAgentFirstEntrypoint();
 assert.match(p,/Non creare un receipt salvo trasformazione deterministica esplicitamente delegata/);
 assert.match(p,/Nessun placeholder/);
 assert.match(p,/non fare azioni laterali/);
 assert.match(p,/smetti di pianificare il bootstrap/);
 assert.match(p,/Quando il runtime prende ownership/);
 assert.equal(e.ai_cycle.stop_on_runtime_ownership,true);
 assert.equal(e.ux_shell.model_may_synthesize_next,false);
});

test('C55 projection stays outside canonical runtime root',()=>{
 const boot=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8'));
 assert.equal(boot.post_accept_fastboot.runtime_root.members.some(x=>x.path==='src/local-host-meta-prompt.mjs'),false);
 assert.equal(contract.claim_boundary.prompt_is_runtime_owner,false);
 assert.equal(contract.claim_boundary.prompt_is_next_owner,false);
 assert.equal(contract.claim_boundary.prompt_is_retry_memory,false);
});
