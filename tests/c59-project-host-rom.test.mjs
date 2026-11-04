import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../src/contract.mjs';

const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const json=p=>JSON.parse(read(p));

test('C59 historical ROM v2 fixture remains exact and does not become EDU authority',()=>{
 const rendered=execFileSync(process.execPath,['scripts/render-project-host-rom.mjs'],{cwd:ROOT,encoding:'utf8'});
 assert.equal(read('docs/PROJECT_META_PROMPT_COBOL.md'),rendered);
 const c=json('contracts/project-host-rom.json');
 assert.equal(c.schema,'ikant-le-project-host-rom/v2');
 assert.equal(c.role,'COLD_START_ROM_ONLY');
 assert.equal(c.authority,0);
 assert.equal(c.repository,'https://github.com/Luke883i/iKant_LE');
 const registry=json('contracts/session-chat-executable-surface-registry.json');
 const rom=registry.surfaces.find(x=>x.id==='PROJECT_HOST_ROM');
 assert.equal(rom.classification,'HISTORICAL_COLDSTART_ADAPTER_NONRUNTIME');
 assert.equal(rom.may_issue_canonical_active,false);
 assert.equal(registry.required_canonical_chain.includes('PROJECT_HOST_ROM'),false);
 assert.equal(rom.superseded_by,'project/session-chat/PROMPT.txt');
 assert.deepEqual(c.preaccept.direct_paths,['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md']);
 assert.equal(c.preaccept.exact_acceptance,'I ACCEPT');
 assert.equal(c.postaccept.invoke_only_repository_named_owner,true);
 assert.equal(c.postaccept.model_selects_carrier,false);
 assert.equal(c.postaccept.model_selects_fallback,false);
 assert.equal(c.postaccept.model_selects_retry,false);
 assert.equal(c.postaccept.model_selects_byte_path,false);
 assert.equal(c.host_binding.repository_symbol_proves_host_capability,false);
 assert.equal(c.host_binding.source_plane_and_sink_plane_are_distinct,true);
 assert.equal(c.host_binding.sink_network_failure_proves_source_failure,false);
 assert.equal(c.evidence.code_is_execution_evidence,false);
 assert.equal(c.evidence.test_pass_is_runtime_readback,false);
 assert.equal(c.failure.autonomous_fallback_search_forbidden,true);
 assert.equal(c.failure.retry_without_repository_owner_instruction_forbidden,true);
 assert.equal(c.runtime.route_only_after_owner_validated_canonical_active_readback,true);
});

test('C59 Project ROM cannot shadow repository composition semantics',()=>{
 const p=read('docs/PROJECT_META_PROMPT_COBOL.md');
 for(const banned of ['GITHUB_API_BASE64','VERIFIED_OPAQUE_RELAY','LOCAL_DIRECT','WARM_CACHE_EXACT','PINNED_GITHUB_ZIP','PINNED_PERMALINK','HOST_FILE_BRIDGE','FASTBOOT_CHANNEL_LEDGER','.mjs','.json#'])assert.equal(p.includes(banned),false,banned);
 assert.match(p,/READ SESSION-CHAT-COMPOSITION FROM FROZEN BOOTSTRAP-CONTRACT/);
 assert.match(p,/INVOKE ONLY THE OWNER NAMED BY THAT REPOSITORY CONTRACT/);
 assert.match(p,/A REPOSITORY SYMBOL DOES NOT PROVE A HOST CAPABILITY IS CALLABLE/);
 assert.match(p,/KEEP SOURCE-PLANE AND SINK-PLANE DISTINCT/);
 assert.match(p,/CODE OR DOCUMENTATION IS NOT EXECUTION EVIDENCE/);
 assert.match(p,/A TEST PASS IS NOT RUNTIME READBACK/);
 assert.match(p,/DO NOT SEARCH FOR A FALLBACK AUTONOMOUSLY/);
 assert.match(p,/MUST NEVER BECOME A SECOND IMPLEMENTATION OF IKANT/);
 const urls=p.match(/https?:\/\/[^\s]+/g)||[];
 assert.equal(urls.length,1);
});

test('C59 frozen BOOTSTRAP names the runtime composition owner consumed after the ROM',()=>{
 const b=json('BOOTSTRAP.json');
 assert.equal(b.session_chat_composition.canonical,true);
 assert.equal(b.session_chat_composition.owner_module,'src/runtime-root-verified.mjs#executeCanonicalColdBootstrap');
 assert.equal(b.session_chat_composition.authority_gate,'src/bootstrap-semantic.mjs#validateCanonicalCompositionHandoff');
 assert.equal(b.session_chat_composition.legacy_fastboot_handoff_authority,false);
});

test('C59 Project ROM v2 survives 100 adversarial semantic mutations with zero harmful survivors',()=>{
 const rendered=execFileSync(process.execPath,['scripts/c59-project-rom-adversarial-100.mjs'],{cwd:ROOT,encoding:'utf8'});
 const actual=JSON.parse(rendered),expected=json('artifacts/qualification/c59-project-rom-adversarial-100.json');
 assert.deepEqual(actual,expected);
 assert.equal(actual.cases,100);
 assert.equal(actual.families,20);
 assert.equal(actual.killed_mutants,100);
 assert.equal(actual.surviving_harmful_mutants,0);
 assert.equal(actual.status,'PASS');
});
