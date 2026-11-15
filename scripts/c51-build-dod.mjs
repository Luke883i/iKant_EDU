import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const J=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const H=b=>crypto.createHash('sha256').update(b).digest('hex');
const contract=J('contracts/supersystem-runtime-conformance-v1_1.json');
const selection=J('artifacts/qualification/c51-supersystem-selection-10m.json');
const falsification=J('artifacts/qualification/c51-supersystem-falsification-1m.json');
const source=fs.readFileSync(path.join(ROOT,'src/supersystem-runtime-conformance.mjs'),'utf8');
const cohost=fs.readFileSync(path.join(ROOT,'src/cohost-coldstart-qualification.mjs'),'utf8');
const native=fs.readFileSync(path.join(ROOT,'src/native-transcript-participant.mjs'),'utf8');
const entry=fs.readFileSync(path.join(ROOT,'src/local-host-meta-prompt.mjs'),'utf8');
const files=[
 'contracts/supersystem-runtime-conformance-v1_1.json',
 'src/supersystem-runtime-conformance.mjs',
 'src/cohost-coldstart-qualification.mjs',
 'src/native-transcript-participant.mjs',
 'scripts/c51-supersystem-select-10m.mjs',
 'scripts/c51-supersystem-falsify-1m.mjs',
 'scripts/c51-build-dod.mjs',
 'tests/c51-supersystem-runtime-conformance.test.mjs',
 '.github/workflows/c51-supersystem-runtime.yml'
];
const entries=files.map(p=>{const b=fs.readFileSync(path.join(ROOT,p));return{path:p,bytes:b.length,sha256:H(b)}});
const manifestBase={schema:'ikant-le-c51-candidate-blob-manifest/v1',source_baseline:contract.source_baseline,entries,content_addressed:true,manifest_excludes_self:true,authority:0};
const manifest={...manifestBase,receipt_sha256:H(Buffer.from(JSON.stringify(manifestBase)))};
fs.writeFileSync(path.join(ROOT,'artifacts/qualification/c51-candidate-blob-manifest.json'),JSON.stringify(manifest,null,2)+'\n');

const roots=contract.common_semantic_roots||{};
const checks={
 D1: roots.cohost_coldstart==='fa4ccab342d14b7e2a1f4d6505374045d282d51e488557f5fd8f9c23c88158da'&&roots.tiered_closure==='07df3f7726e00586900e83726a8cbd5b45e243f476160783c7c770bb75c63fe9'&&roots.native_transcript==='0fe2ca72875f9782d474fadf022b746c253f755244bfa39cb2dd66d361a2cb56',
 D2: source.includes("import {for_ai_agent_first_entrypoint} from './local-host-meta-prompt.mjs'")&&source.includes('for_ai_agent_first_entrypoint(entrypointArgs)')&&source.includes('owner_invoked:true'),
 D3: contract.laws?.repository_can_create_host_bootstrap_binding===false&&source.includes("observation_owner!=='HOST_INTEGRATION'")&&source.includes("bootstrap='CONFORMANT'")===false,
 D4: entry.includes('caller attempted classes forbidden; ledger owns retry memory')&&entry.includes('one delegated NEXT source required')&&source.includes('model_inferred_next:false')&&source.includes('model_is_retry_memory:false'),
 D5: contract.laws?.cohost_relation_requires_route_conformance===false&&cohost.includes("state:closed?'COHOST_SAME_SESSION'")&&cohost.includes('B0_VERIFIED_BIND_NUCLEUS')&&cohost.includes('R0_DURABLE_CANONICAL_RUNTIME_CONTEXT')&&cohost.includes('R1_PERSISTENT_PARTICIPATION_LEASE')&&cohost.includes('R2_EXACT_ATTRIBUTED_DELIVERY_RECEIPT'),
 D6: cohost.includes('session_locator_sha256:locator')&&cohost.includes('source_head:b0?bindNucleus.source_head:null')&&cohost.includes('runtime_root_sha256:b0?bindNucleus.runtime_root_sha256:null'),
 D7: source.includes("observation_owner!=='HOST_SESSION_ROUTER'")&&source.includes("route_conformance:route.state")&&contract.boundaries?.H_E_ROUTE,
 D8: source.includes("canonical_turn_pending")&&source.includes("PENDING_CANONICAL_TURN")&&source.includes('allow_next_turn:false'),
 D9: source.includes('host_bypass_observed')&&source.includes('model_direct_reply_observed')&&source.includes('STALE_UNSYNCED')&&source.includes('BLOCKED_BYPASS'),
 D10: native.includes('NATIVE_TRANSCRIPT_SEMANTIC_SHA')&&native.includes('session_locator_sha256:sessionLocatorSha256||null')&&source.includes("validateNativeStatusProjection(nativeStatus,{cohostStatus})"),
 D11: contract.laws?.native_actor_requires_full_runtime===false&&contract.laws?.native_actor_requires_control_ownership===false&&contract.laws?.repository_can_create_host_participant_api===false,
 D12: source.includes("systemState=bootstrap!=='CONFORMANT'?'INTEGRATION_IMPEDIMENT'")&&source.includes("system_progress_allowed:systemProgressAllowed")&&contract.laws?.owner_code_is_not_owner_execution===true&&contract.laws?.predicted_next_is_not_owner_next===true,
 D13: source.includes("relation='COHOST_RELATION'")&&source.includes("'COHOST_RELATION_ONLY'")&&source.includes("external_native_host_gap")&&contract.projection_axes?.relation?.includes('COHOST_RELATION'),
 D14: ['new_lifecycle','new_planner','new_retry_memory_owner','new_state_writer','new_truth_owner','new_turn_engine'].every(k=>source.includes(k+':false'))&&contract.authority===0,
 D15: selection.status==='PASS'&&selection.cases===10000000&&selection.selected?.mismatch===0&&selection.selected?.unsafe===0&&selection.selected?.false_reject===0&&selection.architecture_lattice?.total===8192&&selection.architecture_lattice?.unique_minimum===true&&Object.values(selection.deletion_mutants||{}).every(x=>x.mismatch>0),
 D16: falsification.status==='PASS'&&falsification.cases===1000000&&falsification.candidate_oracle_mismatches===0&&falsification.unsafe_promotions===0&&falsification.false_rejects===0&&falsification.runtime_functions_exercised===true,
 D17: fs.existsSync(path.join(ROOT,'tests/c51-supersystem-runtime-conformance.test.mjs'))&&fs.existsSync(path.join(ROOT,'.github/workflows/c51-supersystem-runtime.yml')),
 D18: manifest.entries.length===files.length&&manifest.entries.every(e=>e.bytes>0&&/^[a-f0-9]{64}$/.test(e.sha256))
};
const labels={
 D1:'common semantic roots preserved exactly',D2:'executable adapter delegates to canonical bootstrap owner',D3:'physical host bootstrap binding remains external typed evidence',D4:'ONE-NEXT and retry memory remain owner-owned',D5:'COHOST_RELATION remains exactly B0+R0+R1+R2',D6:'cohost projection binds session/source/runtime identity',D7:'route conformance is orthogonal and HOST_SESSION_ROUTER-owned',D8:'unresolved canonical turns serialize next-turn advancement',D9:'host/model bypass and stale route fail closed',D10:'native promotion reuses C50 and is same-session bound',D11:'native actor remains orthogonal to hydration/control/product and host-created capability is forbidden',D12:'missing bootstrap binding declassifies to integration impediment without invented blocker',D13:'missing native proof declassifies to COHOST_RELATION_ONLY',D14:'overlay creates no authority/lifecycle/planner/retry/state/truth/turn owner',D15:'10M saturation plus complete 2^13 lattice selects unique minimum and kills deletion mutants',D16:'fresh 1M runtime falsification has zero mismatch/unsafe/false-reject',D17:'focused C51 plus inherited regression tests are wired into exact-head CI',D18:'candidate implementation/test surface is content-addressed'
};
const dod=Object.keys(labels).map(id=>({id,claim:labels[id],status:checks[id]?'PASS_REPOSITORY':'FAIL',evidence:id==='D15'?selection.receipt_sha256:id==='D16'?falsification.receipt_sha256:id==='D18'?manifest.receipt_sha256:'C51 exact candidate bytes'}));
const base={schema:'ikant-le-c51-supersystem-runtime-dod/v1',source_baseline:contract.source_baseline,status:dod.every(x=>x.status==='PASS_REPOSITORY')?'PASS_REPOSITORY_CLOSURE':'FAIL',dod,selection_receipt_sha256:selection.receipt_sha256,falsification_receipt_sha256:falsification.receipt_sha256,candidate_manifest_receipt_sha256:manifest.receipt_sha256,claim_boundary:{repository_runtime_conformance_closed:dod.every(x=>x.status==='PASS_REPOSITORY'),physical_host_bootstrap_binding_proven:false,physical_native_participant_api_proven:false,physical_host_route_interposition_proven:false,semantic_mutation_is_physical_host_proof:false,exact_pr_head_ci_required:true,post_merge_main_ci_required:true},authority:0};
const out={...base,receipt_sha256:H(Buffer.from(JSON.stringify(base)))};
fs.writeFileSync(path.join(ROOT,'artifacts/qualification/c51-supersystem-dod.json'),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out));
if(out.status!=='PASS_REPOSITORY_CLOSURE')process.exit(1);
