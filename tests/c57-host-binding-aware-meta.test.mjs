import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from '../src/contract.mjs';
import {renderLocalHostMetaPrompt,localHostMetaPromptReceipt} from '../src/local-host-meta-prompt.mjs';

const contract=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/local-host-binding-aware-meta-prompt.json'),'utf8'));
const server=fs.readFileSync(path.join(ROOT,'plugins/ikant-le-session-chat/server/server.mjs'),'utf8');
const readme=fs.readFileSync(path.join(ROOT,'plugins/ikant-le-session-chat/README.md'),'utf8');

test('C57 is a four-mechanism scope/binding closure, not a global chat planner',()=>{
 const p=renderLocalHostMetaPrompt(),r=localHostMetaPromptReceipt();
 assert.equal(contract.irreducible_mechanisms.length,4);
 assert.equal(contract.scope.repository_is_global_chat_planner,false);
 assert.equal(contract.scope.ikant_stop_propagates_to_host_tasks,false);
 assert.equal(contract.forbidden_new_owners.includes('GLOBAL_TASK_PLANNER'),true);
 assert.equal(r.schema,'ikant-le-local-host-adapter/v7');
 assert.equal(r.version,'7.0.0');
 assert.ok(r.chars<5000);
 assert.match(p,/Solo un task iKant-owned/);
 assert.match(p,/stop e blocker iKant non diventano stato globale della chat/);
});

test('C57 uses abstract callable binding and does not canonize the reference-app tool name',()=>{
 const p=renderLocalHostMetaPrompt();
 assert.match(p,/binding host fisicamente osservato o validamente attestato come callable/);
 assert.match(p,/non provano callability/);
 assert.match(p,/percorso adapter che espone realmente \[for_ai_agent_first_entrypoint\]/);
 assert.doesNotMatch(p,/ikant_le_open/);
 assert.equal(contract.binding.repository_symbol_is_callability_proof,false);
 assert.equal(contract.binding.reference_app_tool_name_is_universal_identity,false);
});

test('reference SESSION_CHAT app is one witness of the abstract binding contract',()=>{
 assert.match(server,/registerAppTool\(s,'ikant_le_open'/);
 assert.match(server,/visibility:\['model','app'\]/);
 assert.match(readme,/Only `ikant_le_open` is model-visible/);
 assert.match(readme,/Acceptance and substantive ACTIVE turns are app-only/);
 assert.equal(contract.reference_app_witness.model_visible_open_tool,'ikant_le_open');
 assert.equal(contract.reference_app_witness.normative_for_all_hosts,false);
});

test('C57 fences stale and cross-epoch continuation',()=>{
 const p=renderLocalHostMetaPrompt();
 assert.match(p,/stessa sessione, source, edge ed epoch causale/);
 assert.match(p,/callback stale o cross-epoch non riaprono edge/);
 assert.equal(contract.causality.stale_callback_reopens_edge,false);
 assert.equal(contract.causality.cross_epoch_observation_is_changed_evidence,false);
 assert.equal(contract.causality.retry_memory_owner_unchanged,true);
});

test('C57 scopes NO_SUBSTITUTE to iKant output only',()=>{
 const p=renderLocalHostMetaPrompt();
 assert.match(p,/Questo NO_SUBSTITUTE e locale al task iKant/);
 assert.match(p,/task host esplicitamente distinti restano consentiti/);
 assert.match(p,/non devono essere presentati come output iKant/);
 assert.equal(contract.no_substitute.scope,'IKANT_OUTPUT_ONLY');
 assert.equal(contract.no_substitute.independent_host_task_remains_allowed,true);
 assert.equal(contract.no_substitute.host_output_may_be_labeled_ikant,false);
});

test('C57 reuses inherited owners and does not widen runtime root',()=>{
 const boot=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8'));
 assert.equal(boot.post_accept_fastboot.runtime_root.members.some(x=>x.path==='src/local-host-meta-prompt.mjs'),false);
 assert.equal(contract.inherited_owners_reused.next_retry,'C40_C41_FASTBOOT_OWNERS');
 assert.equal(contract.claim_boundary.prompt_is_authority,false);
 assert.equal(contract.claim_boundary.semantic_falsification_is_physical_host_proof,false);
});
