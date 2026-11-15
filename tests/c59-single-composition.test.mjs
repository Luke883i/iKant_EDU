import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT} from '../src/contract.mjs';
import {FASTBOOT_CARRIERS} from '../src/fastboot-convergence.mjs';
import {ACTIVATION_BYTE_PATHS} from '../src/bootstrap-semantic.mjs';
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));

test('C59 census is closed over every live carrier and byte path',()=>{
 const x=read('contracts/session-chat-composition-census.json'),rows=x.channels,ids=new Set(rows.map(r=>r.id));
 for(const c of FASTBOOT_CARRIERS)assert.ok(ids.has(c),'uncensused carrier:'+c);
 for(const p of ACTIVATION_BYTE_PATHS)assert.ok(ids.has(p),'uncensused byte path:'+p);
 assert.deepEqual(x.invariants.canonical_cold_ids,['GITHUB_API_BASE64','VERIFIED_OPAQUE_RELAY']);
 assert.equal(rows.filter(r=>r.status==='ABSORBED_CANONICAL_COLD').length,2);
 assert.equal(x.invariants.unclassified_live_channel_allowed,false);
 assert.equal(x.invariants.excluded_channel_may_authorize_activation,false);
});

test('C59 bootstrap binds the single channel and no container GitHub dependency',()=>{
 const b=read('BOOTSTRAP.json'),c=read('contracts/session-chat-composition-channel.json'),k=read('contracts/session-chat-local-host-kernel.json');
 assert.equal(b.session_chat_composition.canonical,true);
 assert.equal(b.session_chat_composition.owner_contract,'contracts/session-chat-composition-channel.json');
 assert.equal(b.session_chat_composition.cold_transport,'GITHUB_API_BASE64');
 assert.equal(b.session_chat_composition.byte_path,'VERIFIED_OPAQUE_RELAY');
 assert.equal(b.session_chat_composition.container_github_network_required,false);
 assert.equal(c.canonical_transport.container_github_network_required,false);
 assert.equal(k.postaccept.container_github_network_required,false);
 assert.equal(k.negative_controls.unclassified_live_channel_allowed,false);
});

test('C59 host witness proves connector to container same Git blob identity without container GitHub network',()=>{
 const w=read('artifacts/qualification/c59-host-connector-container-witness.json'),x={...w};delete x.receipt_sha256;
 const digest=crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
 assert.equal(w.receipt_sha256,digest);
 assert.equal(w.source_blob_sha1,w.local_git_blob_sha1);
 assert.equal(w.same_git_blob_sha,true);
 assert.equal(w.container_github_network_used,false);
 assert.equal(w.claim_scope,'OBSERVED_IN_CURRENT_CHAT_HOST_ONLY');
});

test('C59 semantic qualification receipts are strict',()=>{
 const s=read('artifacts/qualification/c59-composition-selection-1k.json');
 const f=read('artifacts/qualification/c59-composition-falsification-100k.json');
 assert.equal(s.cases,1024);assert.equal(s.valid_candidates,1);assert.equal(s.winner_mask,1023);assert.equal(s.status,'PASS');
 assert.equal(f.cases,100000);assert.equal(f.candidate_oracle_mismatches,0);assert.equal(f.unsafe_active,0);assert.equal(f.all_deletion_mutants_killed,true);assert.equal(f.status,'PASS');
 assert.ok(f.family_counts.CONTAINER_DNS_DOWN>0);
 assert.ok(f.good_path_cases>f.family_counts.GOOD,'container DNS loss must coexist with a valid path');
});

test('C59 PR1-68 lineage is total and terminally classified',()=>{
 const l=read('contracts/bootstrap-channel-lineage.json'),reg=new Map(l.registry.map(x=>[x.id,x]));
 assert.deepEqual(l.prs.map(x=>x.pr),Array.from({length:68},(_,i)=>i+1));
 assert.deepEqual(l.prs.filter(x=>x.state==='CLOSED_UNMERGED').map(x=>x.pr),[24,27,34,36,42,43]);
 assert.equal(l.prs.filter(x=>x.state==='MERGED').length,61);
 assert.equal(l.prs.filter(x=>x.state==='OPEN').length,1);
 const refs=new Set();
 for(const p of l.prs)for(const a of p.channel_atoms){refs.add(a);assert.ok(reg.has(a),'unregistered historical atom:'+a);}
 assert.equal(refs.size,l.registry.length);
 for(const r of l.registry)assert.ok(refs.has(r.id),'unreferenced registry atom:'+r.id);
});

test('C59 Cartesian quotient has one and only one canonical composition class',()=>{
 const a=read('artifacts/qualification/c59-cartesian-closure.json'),s=read('contracts/bootstrap-composition-space.json');
 assert.equal(Object.keys(s.axes).length,10);
 assert.equal(a.raw_vectors,1166400);
 assert.equal(a.raw_canonical_alias_vectors,6);
 assert.equal(a.normalized_canonical_classes,1);
 assert.equal(a.rejected_vectors,1166394);
 assert.equal(a.excluded_value_accepted,0);
 assert.equal(a.exclusion_mutants,30);
 assert.equal(a.all_exclusion_mutants_killed,true);
 assert.equal(a.status,'PASS');
});

test('C59 history audit closes all 68 PRs and all registered atoms',()=>{
 const a=read('artifacts/qualification/c59-pr1-68-history-audit.json');
 assert.equal(a.counts.total_prs,68);assert.equal(a.counts.merged,61);assert.equal(a.counts.closed_unmerged,6);assert.equal(a.counts.open,1);
 assert.equal(a.counts.registry_atoms,52);assert.equal(a.counts.referenced_registry_atoms,52);
 assert.deepEqual(a.unclassified,[]);assert.equal(a.status,'PASS');
});

test('C59 canonical authority owner supersedes legacy fastboot handoff authority',()=>{
 const b=read('BOOTSTRAP.json'),k=read('contracts/session-chat-local-host-kernel.json');
 const a=k.action_program.find(x=>x.id==='300');
 assert.equal(a.owner_module,'src/runtime-root-verified.mjs#executeCanonicalColdBootstrap');
 assert.equal(a.authority_gate,'src/bootstrap-semantic.mjs#validateCanonicalCompositionHandoff');
 assert.equal(a.legacy_handoff_may_authorize,false);
 assert.equal(b.session_chat_composition.owner_module,'src/runtime-root-verified.mjs#executeCanonicalColdBootstrap');
 assert.equal(b.session_chat_composition.legacy_fastboot_handoff_authority,false);
 assert.equal(b.for_ai_agent_first_entrypoint.canonical_composition.legacy_fastboot_reentry_role,'LEGACY_COMPATIBILITY_ONLY');
 assert.equal(b.for_ai_agent_first_entrypoint.canonical_composition.legacy_fastboot_handoff_may_authorize,false);
});

test('C59 runtime closure uses the 12-mechanism minimum lattice and one canonical ACTIVE issuer',()=>{
 const c=read('contracts/session-chat-composition-channel.json');
 const l=read('artifacts/qualification/c59-semantic-lattice-selection-4k.json');
 const f=read('artifacts/qualification/c59-runtime-closure-falsification-100k.json');
 const x=read('artifacts/qualification/c59-executable-surface-audit.json');
 assert.equal(c.mechanisms.length,12);
 assert.equal(c.qualification.selection_cases,4096);
 assert.equal(l.cases,4096);assert.equal(l.mechanism_count,12);assert.equal(l.valid_candidates,1);assert.equal(l.winner_mask,4095);assert.equal(l.oracle_candidate_mismatches,0);assert.equal(l.all_deletion_mutants_killed,true);assert.equal(l.status,'PASS');
 assert.equal(f.cases,100000);assert.equal(f.implementation_ready,true);assert.equal(f.candidate_oracle_mismatches,0);assert.equal(f.unsafe_canonical_active,0);assert.equal(f.canonical_dead_path,0);assert.ok(f.legacy_active_noncanonical>0);assert.equal(f.status,'PASS');
 assert.equal(c.qualification.executable_activation_related_files,x.activation_related_files);
 assert.equal(x.activation_related_files,25);assert.equal(x.canonical_active_issuer_count,1);assert.equal(x.canonical_active_issuer,'src/runtime-command.mjs#runCanonicalSessionChat');assert.deepEqual(x.errors,[]);assert.equal(x.status,'PASS');
});

test('C59 enforcement predicate and ACTIVE readback live inside the materialized runtime root',()=>{
 const b=read('BOOTSTRAP.json'),members=new Set(b.post_accept_fastboot.runtime_root.members.map(x=>x.path));
 for(const p of ['src/bootstrap-semantic.mjs','src/runtime-command.mjs','src/runtime.mjs','src/state.mjs'])assert.ok(members.has(p),p);
 assert.equal(b.session_chat_composition.shared_runtime_predicate,'src/bootstrap-semantic.mjs#validateCanonicalCompositionHandoff');
 assert.equal(b.session_chat_composition.canonical_materializer,'src/runtime-root-verified.mjs#executeCanonicalSessionChatBootstrap');
 assert.equal(b.session_chat_composition.canonical_runtime_entry,'src/runtime-command.mjs#runCanonicalSessionChat');
 assert.equal(b.session_chat_composition.canonical_active_readback,'src/runtime-command.mjs#canonicalActiveReadback');
 assert.equal(b.session_chat_composition.canonical_authority,'C59_CANONICAL');
 assert.equal(b.session_chat_composition.legacy_active_is_canonical,false);
});

test('C59 historical ROM is censused but excluded from the live canonical chain',()=>{
 const b=read('BOOTSTRAP.json'),c=read('contracts/session-chat-composition-channel.json'),r=read('contracts/session-chat-executable-surface-registry.json');
 assert.equal(b.session_chat_composition.project_host_rom,'contracts/project-host-rom.json');
 assert.equal(c.project_host_rom,'contracts/project-host-rom.json');
 const rom=r.surfaces.find(x=>x.id==='PROJECT_HOST_ROM');
 assert.equal(rom.classification,'HISTORICAL_COLDSTART_ADAPTER_NONRUNTIME');
 assert.equal(rom.may_issue_canonical_active,false);
 assert.equal(r.required_canonical_chain.includes('PROJECT_HOST_ROM'),false);
 assert.equal(c.executable_surface_registry,'contracts/session-chat-executable-surface-registry.json');
 assert.equal(c.minimum_semantic_lattice,'contracts/session-chat-semantic-lattice.json');
 assert.equal(r.invariants.unregistered_activation_surface_allowed,false);
 assert.equal(r.discovery.exact_set_required,true);
 const c136=r.surfaces.filter(x=>x.id==='C136_MANUAL_RECOVERY');
 assert.equal(c136.length,1);
 assert.equal(c136[0].ref,'src/c136-canonical-recovery.mjs#materializeC136ManualCarrier');
 assert.equal(c136[0].classification,'CANONICAL_PRE_RUNTIME_BYTE_ADAPTER');
 assert.equal(c136[0].may_issue_canonical_active,false);
 assert.ok(r.discovery.activation_related_files.includes('src/c136-canonical-recovery.mjs'));
});
