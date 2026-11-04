import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {issueCanonicalSessionChatComposition,validateCanonicalCompositionHandoff} from '../src/session-chat-composition.mjs';
import {runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=x=>crypto.createHash('sha256').update(Buffer.from(JSON.stringify(x))).digest('hex');
const blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const HEAD='a'.repeat(40),D=runtimeRootDescriptor();
const orientation=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'].map(p=>{const b=fs.readFileSync(path.join(ROOT,p));return{path:p,blob_sha1:blob(b),bytes:b.length}});
const terms=orientation.find(x=>x.path==='TERMS.md');
const runtimeObjects=[{path:D.loader.path,blob_sha1:D.loader.blob_sha1,bytes:fs.readFileSync(path.join(ROOT,D.loader.path)).length},...D.shards.map(s=>({path:s.path,blob_sha1:s.blob_sha1,bytes:s.source_bytes}))];
const sign=x=>{const y=structuredClone(x);delete y.receipt_sha256;return{...y,receipt_sha256:sha(y)}};
const executor=()=>sign({schema:'ikant-le-activation-executor/v1',repository:'Luke883i/iKant_EDU',source_head:HEAD,runtime_root_sha256:D.runtime_root_sha256,execution_plane:'SESSION_LOCAL_NODE',capability_probe_passed:true,capability_probe_before_acquisition:true,content_addressed:true,byte_path:'VERIFIED_OPAQUE_RELAY',model_mediated_bytes:true,model_role:'OPAQUE_TRANSPORT_ONLY',model_rewrite_allowed:false,semantic_equivalence_allowed:false,source_arrival_samehash_required:true,source_arrival_samehash_verified:true,opaque_relay_roundtrip_verified:true,retry_semantics:'IDEMPOTENT_BY_OBJECT_IDENTITY',retry_count:0,acquisition_complete:true,orientation_objects:orientation,runtime_objects:runtimeObjects,slo_elapsed_ms:5,authority:0});
const orientationPayloads=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'].map(p=>({path:p,content_utf8:fs.readFileSync(path.join(ROOT,p),'utf8')}));
const preaccept=()=>({schema:'ikant-le-preaccept-handoff/v2',repository:'Luke883i/iKant_EDU',source_head:HEAD,terms_presented:true,terms_object:{...terms},frozen:true,breached:false,pending_intent:'inizializza',orientation_objects:orientation,orientation_payloads:orientationPayloads,runtime_observed_terms_presentation:false,host_attested_terms_presentation:true,authority:0});
const baseline=()=>issueCanonicalSessionChatComposition({preacceptHandoff:preaccept(),activationExecutor:executor(),humanInput:'I ACCEPT',acceptanceObservedMonotonicMs:10});
function resignDirect(d){
 const x=structuredClone(d);delete x.receipt_sha256;const input=x.execution_input;delete x.execution_input;
 x.execution_input_sha256=sha(input);
 return{...x,receipt_sha256:sha(x),execution_input:input};
}
function resignWrapper(h){const x=structuredClone(h);delete x.receipt_sha256;return{...x,receipt_sha256:sha(x)};}
function mutateNested(h,fn){
 const x=structuredClone(h),d=structuredClone(x.direct_handoff),e=structuredClone(d.execution_input.activation_executor);
 fn(e,d.execution_input);
 d.execution_input.activation_executor=sign(e);
 d.activation_executor_receipt_sha256=d.execution_input.activation_executor.receipt_sha256;
 const rd=resignDirect(d);x.direct_handoff=rd;x.direct_handoff_receipt_sha256=rd.receipt_sha256;x.source_head=rd.source_head;x.runtime_root_sha256=rd.runtime_root_sha256;
 return resignWrapper(x);
}
const families=[
 ['SOURCE_PLANE',h=>{h.source_plane='CONTAINER_GITHUB_NETWORK';return resignWrapper(h)}],
 ['TRANSPORT',h=>{h.transport='PINNED_GITHUB_ZIP';return resignWrapper(h)}],
 ['BYTE_PATH_WRAPPER',h=>{h.byte_path='LOCAL_DIRECT';return resignWrapper(h)}],
 ['SINK',h=>{h.sink_plane='CHAT_ONLY';return resignWrapper(h)}],
 ['EXECUTION_PLANE',h=>{h.execution_plane='MODEL';return resignWrapper(h)}],
 ['CONTAINER_NETWORK',h=>{h.container_github_network_required=true;return resignWrapper(h)}],
 ['MODEL_CARRIER',h=>{h.model_selects_carrier=true;return resignWrapper(h)}],
 ['MODEL_FALLBACK',h=>{h.model_selects_fallback=true;return resignWrapper(h)}],
 ['CHAT_LEDGER',h=>{h.chat_is_retry_memory=true;return resignWrapper(h)}],
 ['LEGACY_AUTHORITY',h=>{h.legacy_compatibility_authority=true;return resignWrapper(h)}],
 ['CANONICAL_AUTHORITY',h=>{h.canonical_activation_authority=false;return resignWrapper(h)}],
 ['LEGACY_FIELD',h=>{h.selected_carrier='WARM_CACHE_EXACT';return resignWrapper(h)}],
 ['EXECUTOR_LOCAL_DIRECT',h=>mutateNested(h,e=>{e.byte_path='LOCAL_DIRECT';e.model_mediated_bytes=false;e.model_role='NONE';e.opaque_relay_roundtrip_verified=false})],
 ['EXECUTOR_RETRY',h=>mutateNested(h,e=>{e.retry_count=1})],
 ['EXECUTOR_REWRITE',h=>mutateNested(h,e=>{e.model_rewrite_allowed=true})],
 ['EXECUTOR_SAMEHASH',h=>mutateNested(h,e=>{e.source_arrival_samehash_verified=false})],
 ['EXECUTOR_ROUNDTRIP',h=>mutateNested(h,e=>{e.opaque_relay_roundtrip_verified=false})],
 ['PREACCEPT_UNFROZEN',h=>{const x=structuredClone(h),d=structuredClone(x.direct_handoff);d.execution_input.preaccept_handoff.frozen=false;d.preaccept_handoff_sha256=sha(d.execution_input.preaccept_handoff);const rd=resignDirect(d);x.direct_handoff=rd;x.direct_handoff_receipt_sha256=rd.receipt_sha256;return resignWrapper(x)}]
];
const b=baseline();const baselineOk=validateCanonicalCompositionHandoff(b).ok;let killed=0,survivors=0;const counts=Object.fromEntries(families.map(x=>[x[0],0]));
for(let i=0;i<100000;i++){const [name,fn]=families[i%families.length];counts[name]++;const x=fn(structuredClone(b));if(validateCanonicalCompositionHandoff(x).ok)survivors++;else killed++;}
const out={schema:'ikant-le-c59-canonical-authority-falsification/v1',cases:100000,families:families.length,family_counts:counts,baseline_accepted:baselineOk,killed_mutants:killed,surviving_harmful_mutants:survivors,status:baselineOk&&killed===100000&&survivors===0?'PASS':'FAIL'};
console.log(JSON.stringify(out,null,2));if(out.status!=='PASS')process.exitCode=1;
