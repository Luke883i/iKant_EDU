import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from '../src/contract.mjs';
import {buildFastbootChannelLedger,deriveFastbootStep} from '../src/fastboot-convergence.mjs';
import {AI_AGENT_FIRST_ENTRYPOINT_KEY,for_ai_agent_first_entrypoint,localHostMetaPromptReceipt,renderLocalHostMetaPrompt,renderLocalHostMetaPromptDocument,validateAiAgentFirstEntrypoint} from '../src/local-host-meta-prompt.mjs';

const json=rel=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));

test('local-host meta-prompt v7 is a derived byte-exact document',()=>{
 const doc=fs.readFileSync(path.join(ROOT,'docs/LOCAL_HOST_META_PROMPT.md'),'utf8');
 assert.equal(doc,renderLocalHostMetaPromptDocument());
 const r=localHostMetaPromptReceipt();
 assert.equal(r.schema,'ikant-le-local-host-adapter/v7');
 assert.equal(r.version,'7.0.0');
 assert.equal(r.authority,0);
 assert.ok(r.chars<5000);
 assert.match(renderLocalHostMetaPrompt(),/unico ingresso tecnico caller-facing/);
 assert.match(renderLocalHostMetaPrompt(),/Non e un nuovo owner del NEXT/);
 assert.match(renderLocalHostMetaPrompt(),/shell ASCII esatta/);
 assert.match(r.sha256,/^[a-f0-9]{64}$/);
});

test('prompt exposes only repository URL plus the single caller-facing entrypoint',()=>{
 const p=renderLocalHostMetaPrompt();
 assert.match(p,/https:\/\/github\.com\/Luke883i\/iKant_EDU/);
 assert.match(p,/\[for_ai_agent_first_entrypoint\]/);
 for(const banned of [/src\//i,/contracts\//i,/\.mjs\b/i,/\.json\b/i,/\bC\d+\b/,/LOCAL_[A-Z_]+/,/SESSION_[A-Z_]+/,/ACTIVE_READBACK/,/RUNTIME_BOUND_LIMITED/,/ikant-le-[a-z0-9-]+\/v\d+/i])assert.equal(banned.test(p),false,String(banned));
 const urls=p.match(/https?:\/\/[^\s]+/g)||[];
 assert.deepEqual(urls,['https://github.com/Luke883i/iKant_EDU.']);
});

test('prompt does not promote the caller-facing entrypoint into NEXT ownership',()=>{
 const p=renderLocalHostMetaPrompt();
 assert.match(p,/Non e un nuovo owner del NEXT/);
 assert.match(p,/delega agli owner del repository/);
 assert.match(p,/proiezioni, stato e chat non autorizzano azioni/);
 assert.doesNotMatch(p,/unico owner del NEXT/i);
 assert.doesNotMatch(p,/il modello.*decide.*NEXT/i);
});

test('prompt has no caller-side shadow ledger or attempted-carrier memory',()=>{
 const p=renderLocalHostMetaPrompt();
 assert.match(p,/Non usare la conversazione come ledger, retry memory, capability cache o stato/);
 assert.match(p,/oggetti owner-returned richiesti dalla re-entry, trattandoli come opachi/);
 assert.match(p,/non mantenere attempted carrier/);
 assert.doesNotMatch(p,/Mantieni come memoria operativa minima/i);
});

test('prompt scopes UNKNOWN and tool errors to owner-defined evidence',()=>{
 const p=renderLocalHostMetaPrompt();
 assert.match(p,/UNKNOWN non e evidenza negativa/);
 assert.match(p,/probe soltanto se la direttiva owner-derived lo richiede/);
 assert.match(p,/errore di tool resta nel tool layer/i);
 assert.doesNotMatch(p,/UNKNOWN significa PROBE/i);
});

test('prompt rejects receipt minting and evidence completion by default',()=>{
 const p=renderLocalHostMetaPrompt();
 assert.match(p,/Non creare un receipt salvo trasformazione deterministica esplicitamente delegata/);
 assert.match(p,/Non completare campi mancanti per inferenza/);
 assert.match(p,/Nessun placeholder/);
});

test('single entrypoint creates no parallel authority and recycles existing owners',()=>{
 const boot=json('BOOTSTRAP.json'),raw=boot[AI_AGENT_FIRST_ENTRYPOINT_KEY],call=for_ai_agent_first_entrypoint();
 assert.deepEqual(validateAiAgentFirstEntrypoint(raw),[]);
 assert.deepEqual(call.entrypoint,raw);
 assert.equal(raw.authority,0);
 assert.equal(raw.role,'PROJECTION_AND_DELEGATION_ONLY');
 assert.equal(raw.new_lifecycle,false);
 assert.equal(raw.new_planner,false);
 assert.equal(raw.new_state_writer,false);
 assert.equal(raw.new_truth_owner,false);
 assert.equal(raw.ai_cycle.one_next,true);
 assert.equal(raw.ai_cycle.one_executor,true);
 assert.equal(raw.reentry.caller_attempted_classes_forbidden,true);
 assert.equal(raw.reentry.retry_memory_from_ledger,true);
 assert.equal(raw.reentry.requalification_scope,'SAME_CARRIER_EVIDENCE_ONLY');
 assert.equal(raw.reentry.unrelated_carrier_evidence_may_requalify_failed_carrier,false);
 assert.equal(raw.reentry.canonical_step_caller_attempted_classes_forbidden,true);
 assert.equal(raw.reentry.session_shell_caller_attempted_classes_forbidden,true);
 assert.equal(raw.reentry.complete_attempt_handoff_digest_bound,true);
 assert.equal(raw.reentry.complete_attempt_next_edge,'LOCAL_MATERIALIZATION');
 assert.equal(raw.bootstrap_type_registry_cache.persisted_separately,false);
 assert.equal(raw.bootstrap_type_registry_cache.partial_exact_cache_is_executable,false);
 assert.deepEqual(raw.bootstrap_type_registry_cache.canonical_byte_paths,['LOCAL_DIRECT','VERIFIED_OPAQUE_RELAY']);
 assert.equal(raw.ux_shell.model_may_synthesize_next,false);
 assert.equal(boot.post_accept_fastboot.runtime_root.members.some(x=>x.path==='src/local-host-meta-prompt.mjs'),false);
});

test('entrypoint delegates first-contact and fastboot NEXT derivation to existing owners',()=>{
 const first=for_ai_agent_first_entrypoint({human_input:'inizializza iKant_EDU'});
 assert.equal(first.next.recognized,true);
 const sourceHead='a'.repeat(40),ledger=buildFastbootChannelLedger({sourceHead,receipts:[]}),root='b'.repeat(64),expected=deriveFastbootStep({ledger,runtimeRootSha256:root}),actual=for_ai_agent_first_entrypoint({channel_ledger:ledger,runtime_root_sha256:root}).next;
 assert.deepEqual(actual,expected);
 assert.throws(()=>for_ai_agent_first_entrypoint({human_input:'x',channel_ledger:ledger,runtime_root_sha256:root}),/one delegated NEXT source/);
});

test('bootstrap registry/cache keeps unknown and partial evidence fail-closed',()=>{
 const e=for_ai_agent_first_entrypoint().entrypoint,c=e.bootstrap_type_registry_cache,relay=c.types.find(x=>x.id==='VERIFIED_OPAQUE_RELAY');
 assert.equal(c.registry_absence_implies_unavailable,false);
 assert.equal(c.complete_object_set_required,true);
 assert.equal(c.partial_exact_cache_is_executable,false);
 assert.equal(c.resume_only_missing_or_invalid_objects,true);
 for(const x of ['CHUNK_MANIFEST','ENCODED_CHUNK_HASH','RAW_CHUNK_HASH','MANIFEST_ORDER_REASSEMBLY','AGGREGATE_SAMEHASH','LOCAL_WRITE_REOPEN_HASH','ROUNDTRIP_VERIFIED'])assert.ok(relay.requires.includes(x));
 assert.equal(relay.rewrite_allowed,false);
 assert.equal(relay.semantic_equivalence_allowed,false);
});

test('entrypoint rejects unvalidated caller shell instead of synthesizing UX truth',()=>{
 assert.throws(()=>for_ai_agent_first_entrypoint({session_shell:{}}),/session shell invalid/);
});

test('entrypoint forbids caller retry memory and raw reentry outcomes',()=>{
 const sourceHead='a'.repeat(40),ledger=buildFastbootChannelLedger({sourceHead,receipts:[]}),root='b'.repeat(64);
 assert.throws(()=>for_ai_agent_first_entrypoint({channel_ledger:ledger,runtime_root_sha256:root,attempted_classes:['WARM_CACHE_EXACT']}),/ledger owns retry memory/);
 assert.throws(()=>for_ai_agent_first_entrypoint({channel_ledger:ledger,runtime_root_sha256:root,observation:true}),/typed fastboot observation required/);
});
