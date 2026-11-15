import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const runtime=read('src/runtime-command.mjs');
const semantic=read('src/bootstrap-semantic.mjs');
const pre=read('src/runtime-root-verified.mjs');
const entry=read('src/local-host-meta-prompt.mjs');
const cli=read('ikant.mjs');
const deployed=read('src/session-chat-deployment.mjs');
const registry=json('contracts/session-chat-executable-surface-registry.json');
const lattice=json('contracts/session-chat-semantic-lattice.json');

const implementation_checks={
 shared_predicate:semantic.includes('export function validateCanonicalCompositionHandoff')&&semantic.includes("CANONICAL_COMPOSITION_AUTHORITY='C59_CANONICAL'"),
 canonical_entry:runtime.includes('export function runCanonicalSessionChat')&&runtime.includes('export function canonicalActiveReadback'),
 runtime_bridge:pre.includes('export async function executeCanonicalSessionChatBootstrap')&&pre.includes("mod.runCanonicalSessionChat('I ACCEPT'"),
 entrypoint_wraps_c59:entry.includes('issueCanonicalCompositionHandoff(direct.handoff)'),
 raw_requires_compatibility:runtime.includes("postAcceptBootstrapEvidence?.compatibility_only!==true"),
 resume_requires_compatibility:runtime.includes("Legacy activation resume is compatibility-only"),
 canonical_surface_fences_legacy:runtime.includes("Canonical SESSION_CHAT_LOCAL runtime route rejected legacy ACTIVE state."),
 canonical_readback_binds_receipt:runtime.includes('canonical_composition_receipt_sha256')&&runtime.includes('canonical_active_readback===true'),
 cli_explicit_compatibility:cli.includes('--compatibility-activation')&&cli.includes('--canonical-composition-handoff-file'),
 deployed_self_labels_legacy:deployed.includes("composition_authority:'LEGACY_COMPATIBILITY',canonical_session_chat_local:false"),
 closed_registry:registry.invariants?.unregistered_activation_surface_allowed===false&&registry.discovery?.exact_set_required===true,
 minimum_lattice:(lattice.mechanisms||[]).length===12&&lattice.selection?.valid_candidates_required===1&&lattice.selection?.winner_mask===4095
};
const implementation_ready=Object.values(implementation_checks).every(Boolean);

const baseline=()=>({
 entry:'CANONICAL_OWNER',handoff:'C59_VALID',transport:'VERIFIED_OPAQUE_RELAY',compatibility:false,
 surface:'SESSION_CHAT_LOCAL_RUNTIME',source_pinned:true,preaccept_frozen:true,materialization_ok:true,
 readback_ok:true,registry_known:true,prompt_delegates:true,parallel_legacy_handoff:false
});
const families=[
 ['GOOD',x=>x],
 ['SOURCE_DRIFT',x=>({...x,source_pinned:false})],
 ['PREACCEPT_NOT_FROZEN',x=>({...x,preaccept_frozen:false})],
 ['RAW_NO_COMPAT',x=>({...x,entry:'RAW_RUNCOMMAND',handoff:'NONE',compatibility:false,surface:'LOCAL_NODE_CHAT_HOST'})],
 ['RAW_COMPAT_ACTIVE',x=>({...x,entry:'RAW_RUNCOMMAND',handoff:'LEGACY',transport:'LOCAL_DIRECT',compatibility:true,surface:'LEGACY_TEST_HARNESS',readback_ok:false})],
 ['RESUME_COMPAT_ACTIVE',x=>({...x,entry:'RESUME',handoff:'LEGACY',transport:'LOCAL_DIRECT',compatibility:true,surface:'LEGACY_TEST_HARNESS',readback_ok:false})],
 ['DEPLOYED_COMPAT_ACTIVE',x=>({...x,entry:'DEPLOYED',handoff:'LEGACY',transport:'WARM_CACHE_EXACT',compatibility:true,surface:'SESSION_CHAT_DEPLOYED_RUNTIME',readback_ok:false})],
 ['CLI_COMPAT_ACTIVE',x=>({...x,entry:'CLI_RAW',handoff:'LEGACY',transport:'V1_FLEX',compatibility:true,surface:'LOCAL_NODE_CHAT_HOST',readback_ok:false})],
 ['TAMPERED_C59',x=>({...x,handoff:'C59_TAMPERED'})],
 ['LOCAL_DIRECT_CANONICAL_ATTEMPT',x=>({...x,transport:'LOCAL_DIRECT'})],
 ['MATERIALIZATION_FAIL',x=>({...x,materialization_ok:false})],
 ['READBACK_FAIL',x=>({...x,readback_ok:false})],
 ['UNREGISTERED_SURFACE',x=>({...x,registry_known:false,entry:'UNREGISTERED'})],
 ['PROMPT_INVENTS',x=>({...x,prompt_delegates:false})],
 ['WRONG_CANONICAL_SURFACE',x=>({...x,surface:'LOCAL_NODE_CHAT_HOST'})],
 ['PARALLEL_LEGACY_HANDOFF',x=>({...x,parallel_legacy_handoff:true})]
];

function oracleCanonical(x){
 return x.entry==='CANONICAL_OWNER'&&x.handoff==='C59_VALID'&&x.transport==='VERIFIED_OPAQUE_RELAY'&&x.compatibility===false&&
  x.surface==='SESSION_CHAT_LOCAL_RUNTIME'&&x.source_pinned&&x.preaccept_frozen&&x.materialization_ok&&x.readback_ok&&
  x.registry_known&&x.prompt_delegates&&!x.parallel_legacy_handoff;
}
function candidate(x){
 const ownerSelected=x.prompt_delegates&&x.registry_known&&x.entry==='CANONICAL_OWNER';
 const handoffAuthorized=ownerSelected&&x.handoff==='C59_VALID'&&x.transport==='VERIFIED_OPAQUE_RELAY'&&x.source_pinned&&x.preaccept_frozen&&!x.parallel_legacy_handoff;
 const canonicalMaterialized=handoffAuthorized&&x.materialization_ok;
 const canonicalRuntime=canonicalMaterialized&&x.surface==='SESSION_CHAT_LOCAL_RUNTIME';
 const canonicalReadback=canonicalRuntime&&x.readback_ok;
 const legacyEntry=['RAW_RUNCOMMAND','RESUME','DEPLOYED','CLI_RAW'].includes(x.entry);
 const legacyTransport=['LOCAL_DIRECT','V1_FLEX','WARM_CACHE_EXACT','VERIFIED_OPAQUE_RELAY'].includes(x.transport);
 const legacyStateActive=legacyEntry&&x.compatibility===true&&legacyTransport&&x.materialization_ok&&x.surface!=='SESSION_CHAT_LOCAL_RUNTIME';
 const canonicalActive=implementation_ready&&canonicalReadback;
 return{canonicalActive,stateActive:canonicalActive||legacyStateActive,legacyStateActive};
}

const counts=Object.fromEntries(families.map(([n])=>[n,0]));
let mismatches=0,unsafe=0,dead=0,legacyActive=0,stateActive=0,candidateCanonical=0,oracleCanonicalCount=0;
for(let i=0;i<100000;i++){
 const [name,mutate]=families[i%families.length];counts[name]++;
 const x=mutate(baseline()),o=oracleCanonical(x),c=candidate(x);
 if(o)oracleCanonicalCount++;
 if(c.canonicalActive)candidateCanonical++;
 if(c.stateActive)stateActive++;
 if(c.legacyStateActive)legacyActive++;
 if(c.canonicalActive!==o)mismatches++;
 if(c.canonicalActive&&!o)unsafe++;
 if(o&&!c.canonicalActive)dead++;
}
const out={
 schema:'ikant-le-c59-runtime-closure-falsification/v1',
 cases:100000,
 families:families.length,
 family_counts:counts,
 implementation_checks,
 implementation_ready,
 oracle_canonical_active:oracleCanonicalCount,
 candidate_canonical_active:candidateCanonical,
 state_active_total:stateActive,
 legacy_active_noncanonical:legacyActive,
 candidate_oracle_mismatches:mismatches,
 unsafe_canonical_active:unsafe,
 canonical_dead_path:dead,
 status:implementation_ready&&mismatches===0&&unsafe===0&&dead===0&&legacyActive>0?'PASS':'FAIL'
};
console.log(JSON.stringify(out,null,2));
if(out.status!=='PASS')process.exitCode=1;
