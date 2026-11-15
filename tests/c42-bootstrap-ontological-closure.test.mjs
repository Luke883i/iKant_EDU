import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT} from '../src/contract.mjs';
import {runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';
import {FASTBOOT_CAPABILITY_FIELDS,FASTBOOT_MACHINE_CARRIERS,buildFastbootChannelLedger,issueFastbootCapabilityReceipt} from '../src/fastboot-convergence.mjs';
import {classifyHumanIntent,for_ai_agent_first_entrypoint} from '../src/local-host-meta-prompt.mjs';

const sha=x=>crypto.createHash('sha256').update(Buffer.from(JSON.stringify(x))).digest('hex');
const blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const sign=x=>({...x,receipt_sha256:sha(x)});
const HEAD='a'.repeat(40),D=runtimeRootDescriptor();
const paths=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const orientation=paths.map(p=>{const b=fs.readFileSync(path.join(ROOT,p));return{path:p,blob_sha1:blob(b),bytes:b.length};});
const terms=orientation.find(x=>x.path==='TERMS.md');
const orientationPayloads=paths.map(p=>({path:p,content_utf8:fs.readFileSync(path.join(ROOT,p),'utf8')}));
const preaccept={schema:'ikant-le-preaccept-handoff/v2',repository:'Luke883i/iKant_EDU',source_head:HEAD,terms_presented:true,frozen:true,breached:false,orientation_objects:orientation,orientation_payloads:orientationPayloads,terms_object:{...terms},runtime_observed_terms_presentation:false,host_attested_terms_presentation:true,authority:0};
const runtimeObjects=[{path:D.loader.path,blob_sha1:D.loader.blob_sha1,bytes:fs.readFileSync(path.join(ROOT,D.loader.path)).length},...D.shards.map(s=>({path:s.path,blob_sha1:s.blob_sha1,bytes:s.source_bytes}))];
const executor=sign({schema:'ikant-le-activation-executor/v1',repository:'Luke883i/iKant_EDU',source_head:HEAD,runtime_root_sha256:D.runtime_root_sha256,execution_plane:'SESSION_LOCAL_NODE',capability_probe_passed:true,capability_probe_before_acquisition:true,content_addressed:true,byte_path:'VERIFIED_OPAQUE_RELAY',model_mediated_bytes:true,model_role:'OPAQUE_TRANSPORT_ONLY',model_rewrite_allowed:false,semantic_equivalence_allowed:false,source_arrival_samehash_required:true,source_arrival_samehash_verified:true,opaque_relay_roundtrip_verified:true,retry_semantics:'IDEMPOTENT_BY_OBJECT_IDENTITY',retry_count:0,acquisition_complete:true,orientation_objects:orientation,runtime_objects:runtimeObjects,slo_elapsed_ms:5,authority:0});
const proven=()=>Object.fromEntries(FASTBOOT_CAPABILITY_FIELDS.map(k=>[k,true]));

test('C42 natural start/exit intent is authority-zero and negation-safe',()=>{
 for(const x of ['inizializza iKant','avvia iKant','attiva iKant','start ikant'])assert.equal(classifyHumanIntent(x).kind,'ACTIVATE_IKANT');
 for(const x of ['chiudi iKant','esci da iKant','disattiva iKant','EXIT IKANT'])assert.equal(classifyHumanIntent(x).kind,'EXIT_IKANT');
 assert.equal(classifyHumanIntent('I ACCEPT').kind,'OTHER');
 assert.equal(classifyHumanIntent('non avviare iKant').kind,'OTHER');
 assert.equal(classifyHumanIntent("don't start iKant").kind,'OTHER');
});

test('C42 direct activation-executor reentry removes premature runtime acceptance identity',()=>{
 const x=for_ai_agent_first_entrypoint({preaccept_handoff:preaccept,activation_executor:executor,human_input:'I ACCEPT',acceptance_observed_monotonic_ms:10,runtime_root_descriptor:D});
 assert.equal(x.handoff.action,'EXECUTE_PRE_RUNTIME_BOOTSTRAP');
 assert.equal(x.handoff.owner,'SESSION_CHAT_COMPOSITION_CHANNEL');
 assert.equal(x.handoff.canonical_activation_authority,true);
 assert.equal(x.handoff.active_claim,false);
 assert.equal(x.canonical_handoff.receipt_sha256,x.handoff.receipt_sha256);
 assert.equal(x.legacy_handoff,null);
 assert.equal('acceptance_event_id'in x.handoff,false);
 assert.equal('acceptance_event_id'in x.handoff.direct_handoff.execution_input,false);
 assert.equal(x.acceptance_observation.human_input,'I ACCEPT');
 assert.match(x.acceptance_observation.receipt_sha256,/^[a-f0-9]{64}$/);
 assert.equal(x.readiness.public_line,'iKant · MATERIALIZZA');
});

test('C42 invalid acceptance and executor cannot cross pre-runtime boundary',()=>{
 assert.throws(()=>for_ai_agent_first_entrypoint({preaccept_handoff:preaccept,activation_executor:executor,human_input:'YES',acceptance_observed_monotonic_ms:10,runtime_root_descriptor:D}),/exact I ACCEPT/);
 const bad=sign({...executor,content_addressed:false});
 assert.throws(()=>for_ai_agent_first_entrypoint({preaccept_handoff:preaccept,activation_executor:bad,human_input:'I ACCEPT',acceptance_observed_monotonic_ms:10,runtime_root_descriptor:D}),/activation executor receipt invalid/);
});

test('C42 rejects the retired LE source name even with otherwise valid pinned bytes',()=>{
 const retired={...preaccept,repository:'Luke883i/iKant_LE'};
 assert.throws(()=>for_ai_agent_first_entrypoint({preaccept_handoff:retired,activation_executor:executor,human_input:'I ACCEPT',acceptance_observed_monotonic_ms:10,runtime_root_descriptor:D}),/preaccept handoff invalid/);
});

test('C42 file and warm carriers project only ultra-compressed owner-derived UX',()=>{
 const unavailable=FASTBOOT_MACHINE_CARRIERS.map((carrier,i)=>issueFastbootCapabilityReceipt({carrier,status:'UNAVAILABLE',capabilities:{...proven(),surface_supported:false},evidence:'no-machine-'+i,probeOwner:'c42',operationId:'no-machine-'+i,sourceHead:HEAD}));
 const fileAvailable=issueFastbootCapabilityReceipt({carrier:'HOST_FILE_BRIDGE',status:'AVAILABLE',capabilities:proven(),evidence:'file-ready',probeOwner:'c42',operationId:'file-ready',sourceHead:HEAD});
 const file=for_ai_agent_first_entrypoint({channel_ledger:buildFastbootChannelLedger({sourceHead:HEAD,receipts:[...unavailable,fileAvailable]}),runtime_root_sha256:D.runtime_root_sha256});
 assert.equal(file.next.canonical_carrier,'HOST_FILE_BRIDGE');assert.equal(file.readiness.public_line,'iKant · CARICA FILE');assert.ok(file.readiness.public_line.length<=32);
 const warm=issueFastbootCapabilityReceipt({carrier:'WARM_CACHE_EXACT',status:'AVAILABLE',capabilities:proven(),evidence:'warm',probeOwner:'c42',operationId:'warm',sourceHead:HEAD});
 const ready=for_ai_agent_first_entrypoint({channel_ledger:buildFastbootChannelLedger({sourceHead:HEAD,receipts:[warm]}),runtime_root_sha256:D.runtime_root_sha256});
 assert.equal(ready.readiness.public_line,'iKant · AVVIA');
});

test('C42 contract preserves existing lattice, C40/C41 reentry and authority boundaries',()=>{
 const boot=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8')).for_ai_agent_first_entrypoint;
 const c=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/bootstrap-ontological-closure.json'),'utf8'));
 assert.deepEqual(c.constitutional_lattice_unchanged,['HUMAN_GATE','SOURCE_SNAPSHOT','LOCAL_INGRESS','LOCAL_MATERIALIZATION','EXECUTED_RUNTIME_PROOF','ACTIVE_READBACK']);
 assert.deepEqual(boot.reentry.accepted_observation_schemas,['ikant-le-fastboot-capability-receipt/v1','ikant-le-fastboot-carrier-attempt/v1']);
 assert.equal(boot.intent_adapter.authority,0);assert.equal(boot.intent_adapter.may_accept_terms,false);assert.equal(boot.intent_adapter.may_select_carrier,false);assert.equal(boot.intent_adapter.may_mutate_state,false);
 assert.equal(boot.activation_executor_reentry.acceptance_event_identity_owner,'MATERIALIZED_RUNTIME');
 assert.equal(boot.activation_executor_reentry.runtime_event_identity_required_pre_materialization,false);
 assert.equal(boot.optional_host_bridge.required,false);assert.equal(boot.optional_host_bridge.may_create_authority,false);
 assert.equal(c.dod.ACTIVE_predicate_unchanged,true);assert.equal(c.dod.IKANT_OWNED_predicate_unchanged,true);
});
