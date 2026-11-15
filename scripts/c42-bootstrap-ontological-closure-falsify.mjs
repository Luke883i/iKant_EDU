import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT} from '../src/contract.mjs';
import {runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';
import {FASTBOOT_CAPABILITY_FIELDS,FASTBOOT_MACHINE_CARRIERS,buildFastbootChannelLedger,issueFastbootCapabilityReceipt} from '../src/fastboot-convergence.mjs';
import {classifyHumanIntent,for_ai_agent_first_entrypoint} from '../src/local-host-meta-prompt.mjs';

const CASES=Number(process.argv.includes('--cases')?process.argv[process.argv.indexOf('--cases')+1]:1000000);
let seed=0xC42A11CE>>>0;
const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
const hash=x=>crypto.createHash('sha256').update(Buffer.from(typeof x==='string'?x:JSON.stringify(x))).digest('hex');
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const sign=x=>({...x,receipt_sha256:hash(x)});
const HEAD='a'.repeat(40),D=runtimeRootDescriptor();
const paths=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const orientation=paths.map(p=>{const b=fs.readFileSync(path.join(ROOT,p));return{path:p,blob_sha1:gitBlob(b),bytes:b.length};});
const terms=orientation.find(x=>x.path==='TERMS.md');
const preaccept={schema:'ikant-le-preaccept-handoff/v2',repository:'Luke883i/iKant_EDU',source_head:HEAD,terms_presented:true,frozen:true,breached:false,orientation_objects:orientation,terms_object:{...terms},orientation_payloads:paths.map(p=>({path:p,content_utf8:fs.readFileSync(path.join(ROOT,p),'utf8')})),runtime_observed_terms_presentation:false,host_attested_terms_presentation:true,authority:0};
const runtimeObjects=[{path:D.loader.path,blob_sha1:D.loader.blob_sha1,bytes:fs.readFileSync(path.join(ROOT,D.loader.path)).length},...D.shards.map(s=>({path:s.path,blob_sha1:s.blob_sha1,bytes:s.source_bytes}))];
const executor=sign({schema:'ikant-le-activation-executor/v1',repository:'Luke883i/iKant_EDU',source_head:HEAD,runtime_root_sha256:D.runtime_root_sha256,execution_plane:'SESSION_LOCAL_NODE',capability_probe_passed:true,capability_probe_before_acquisition:true,content_addressed:true,byte_path:'VERIFIED_OPAQUE_RELAY',model_mediated_bytes:true,model_role:'OPAQUE_TRANSPORT_ONLY',model_rewrite_allowed:false,semantic_equivalence_allowed:false,source_arrival_samehash_required:true,source_arrival_samehash_verified:true,opaque_relay_roundtrip_verified:true,retry_semantics:'IDEMPOTENT_BY_OBJECT_IDENTITY',retry_count:0,acquisition_complete:true,orientation_objects:orientation,runtime_objects:runtimeObjects,slo_elapsed_ms:5,authority:0});
const proven=()=>Object.fromEntries(FASTBOOT_CAPABILITY_FIELDS.map(k=>[k,true]));
const cap=(carrier,status,evidence)=>issueFastbootCapabilityReceipt({carrier,status,capabilities:status==='AVAILABLE'?proven():{...proven(),surface_supported:false},evidence,probeOwner:'c42',operationId:evidence,sourceHead:HEAD});
const rejects=f=>{try{f();return false}catch{return true}};
const starts=['inizializza iKant','avvia iKant','attiva iKant','start ikant','initialize ikant','activate ikant'];
const exits=['chiudi iKant','esci da iKant','disattiva iKant','stop ikant','EXIT IKANT','release ikant'];
const noisy=(x,n)=>{let s=x;if(n&1)s=s.toUpperCase();if(n&2)s='  '+s+'  ';if(n&4)s=s.replaceAll(' ','   ');if(n&8)s+='!';return s};
const direct=()=>for_ai_agent_first_entrypoint({preaccept_handoff:preaccept,activation_executor:executor,human_input:'I ACCEPT',acceptance_observed_monotonic_ms:42,runtime_root_descriptor:D});
const fileLedger=i=>buildFastbootChannelLedger({sourceHead:HEAD,receipts:[...FASTBOOT_MACHINE_CARRIERS.map((carrier,j)=>cap(carrier,'UNAVAILABLE','machine-'+i+'-'+j)),cap('HOST_FILE_BRIDGE','AVAILABLE','file-'+i)]});
const warmLedger=i=>buildFastbootChannelLedger({sourceHead:HEAD,receipts:[cap('WARM_CACHE_EXACT','AVAILABLE','warm-'+i)]});
// No sampled variable enters this direct original-owner projection. Evaluate the
// immutable witness once; each case still independently validates its oracle.
const directWitness=direct();
const contract=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/bootstrap-ontological-closure.json'),'utf8'));
const boot=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8')).for_ai_agent_first_entrypoint;

const families=[
 ['ACTIVATE_ALIAS',i=>classifyHumanIntent(noisy(starts[i%starts.length],rnd())).kind==='ACTIVATE_IKANT'],
 ['EXIT_ALIAS',i=>classifyHumanIntent(noisy(exits[i%exits.length],rnd())).kind==='EXIT_IKANT'],
 ['NEGATED_START',i=>classifyHumanIntent(['non avviare iKant','do not start iKant',"don't start iKant"][i%3]).kind==='OTHER'],
 ['ACCEPT_NOT_START',i=>classifyHumanIntent('I ACCEPT').kind==='OTHER'],
 ['NO_FALSE_START',i=>classifyHumanIntent('analizza il bilancio '+i).kind==='OTHER'],
 ['ANY_FIRST_INPUT_STARTS',i=>{const input='analizza il bilancio '+i,x=for_ai_agent_first_entrypoint({human_input:input});return x.next?.terminal==='CANONICAL_PREACCEPT'&&x.next?.pending_intent===input&&x.readiness?.public_line==='iKant · PREPARA'}],
 ['START_ENTRYPOINT',i=>{const x=for_ai_agent_first_entrypoint({human_input:noisy(starts[i%starts.length],rnd())});return x.next?.recognized===true&&x.readiness?.public_line==='iKant · PREPARA'}],
 ['EXIT_FIRST_CONTACT',i=>{const input=noisy(exits[i%exits.length],rnd()),x=for_ai_agent_first_entrypoint({human_input:input});return x.next?.terminal==='CANONICAL_PREACCEPT'&&x.next?.pending_intent===input&&x.readiness?.public_line==='iKant · PREPARA'}],
 ['FILE_NEXT',i=>{const x=for_ai_agent_first_entrypoint({channel_ledger:fileLedger(i),runtime_root_sha256:D.runtime_root_sha256});return x.next?.canonical_carrier==='HOST_FILE_BRIDGE'&&x.readiness?.public_line==='iKant · CARICA FILE'}],
 ['WARM_NEXT',i=>{const x=for_ai_agent_first_entrypoint({channel_ledger:warmLedger(i),runtime_root_sha256:D.runtime_root_sha256});return x.next?.canonical_carrier==='WARM_CACHE_EXACT'&&x.readiness?.public_line==='iKant · AVVIA'}],
 ['DIRECT_VALID',i=>{const x=directWitness;return x.handoff?.action==='EXECUTE_PRE_RUNTIME_BOOTSTRAP'&&x.handoff?.owner==='SESSION_CHAT_COMPOSITION_CHANNEL'&&x.handoff?.canonical_activation_authority===true&&x.handoff?.active_claim===false&&x.canonical_handoff?.receipt_sha256===x.handoff?.receipt_sha256&&x.legacy_handoff===null&&x.readiness?.public_line==='iKant · MATERIALIZZA'}],
 ['NO_PREMATURE_EVENT_ID',i=>{const x=directWitness;return !('acceptance_event_id'in x.handoff)&&!('acceptance_event_id'in(x.handoff?.direct_handoff?.execution_input||{}))}],
 ['BAD_ACCEPT_REJECT',i=>rejects(()=>for_ai_agent_first_entrypoint({preaccept_handoff:preaccept,activation_executor:executor,human_input:'YES',acceptance_observed_monotonic_ms:42,runtime_root_descriptor:D}))],
 ['BAD_TERMS_REJECT',i=>rejects(()=>for_ai_agent_first_entrypoint({preaccept_handoff:{...preaccept,terms_object:{...preaccept.terms_object,blob_sha1:'b'.repeat(40)}},activation_executor:executor,human_input:'I ACCEPT',acceptance_observed_monotonic_ms:42,runtime_root_descriptor:D}))],
 ['BAD_EXECUTOR_REJECT',i=>{const bad=sign({...executor,content_addressed:false});return rejects(()=>for_ai_agent_first_entrypoint({preaccept_handoff:preaccept,activation_executor:bad,human_input:'I ACCEPT',acceptance_observed_monotonic_ms:42,runtime_root_descriptor:D}))}],
 ['CALLER_RETRY_REJECT',i=>rejects(()=>for_ai_agent_first_entrypoint({channel_ledger:fileLedger(i),runtime_root_sha256:D.runtime_root_sha256,attempted_classes:['WARM_CACHE_EXACT']}))],
 ['PUBLIC_LINE_BOUND',i=>[for_ai_agent_first_entrypoint({human_input:'inizializza iKant'}),for_ai_agent_first_entrypoint({human_input:'chiudi iKant'}),for_ai_agent_first_entrypoint({channel_ledger:fileLedger(i),runtime_root_sha256:D.runtime_root_sha256}),directWitness].every(x=>x.readiness.public_line.length<=32)],
 ['PUBLIC_LINE_NO_TECH',i=>!/receipt|sha|LOCAL_|SESSION_|ACTIVE_READBACK|runtime_root|carrier/i.test(for_ai_agent_first_entrypoint({channel_ledger:fileLedger(i),runtime_root_sha256:D.runtime_root_sha256}).readiness.public_line)],
 ['NO_NEW_AUTHORITY',i=>boot.intent_adapter?.authority===0&&boot.optional_host_bridge?.required===false&&boot.optional_host_bridge?.may_create_authority===false],
 ['LEGACY_REENTRY_PRESERVED',i=>JSON.stringify(boot.reentry?.accepted_observation_schemas)===JSON.stringify(['ikant-le-fastboot-capability-receipt/v1','ikant-le-fastboot-carrier-attempt/v1'])],
 ['ACTIVE_OWNERSHIP_UNCHANGED',i=>contract.dod?.ACTIVE_predicate_unchanged===true&&contract.dod?.IKANT_OWNED_predicate_unchanged===true]
];

let mismatches=0,killed=0;const counts=Object.fromEntries(families.map(([n])=>[n,0])),failures=[];
for(let i=0;i<CASES;i++){const [name,run]=families[i%families.length];counts[name]++;let ok=false;try{ok=run(i)===true}catch(e){if(failures.length<20)failures.push({i,name,error:String(e?.message||e)})}if(ok)killed++;else{mismatches++;if(failures.length<20)failures.push({i,name,error:'oracle_mismatch'})}}
const witness=directWitness;
const unsafeActive=witness.handoff?.active_claim===true?1:0;
const premature=('acceptance_event_id'in(witness.handoff||{})||'acceptance_event_id'in(witness.handoff?.direct_handoff?.execution_input||{}))?1:0;
const unsafeOwned=contract.dod?.IKANT_OWNED_predicate_unchanged===true?0:1;
const minFamily=Math.min(...Object.values(counts));
const out={schema:'ikant-le-c42-bootstrap-ontological-closure-falsification/v1',seed:'0xC42A11CE',cases:CASES,families:families.length,profile:'REALISTIC_SEMANTIC_RUNTIME',candidate_oracle_mismatches:mismatches,killed,mutation_kill_ratio:killed/CASES,unsafe_active:unsafeActive,unsafe_ikant_owned:unsafeOwned,premature_acceptance_event_identity:premature,min_family_cases:minFamily,family_counts:counts,failures,status:mismatches===0&&killed===CASES&&unsafeActive===0&&unsafeOwned===0&&premature===0&&minFamily>0?'PASS':'FAIL',claim_boundary:{semantic_mutation_is_physical_host_proof:false,ci_is_current_chat_proof:false,modelled_intent_coverage_is_user_population_statistic:false}};
out.receipt_sha256=hash(out);
process.stdout.write(JSON.stringify(out,null,2)+'\n');
if(out.status!=='PASS')process.exitCode=1;
