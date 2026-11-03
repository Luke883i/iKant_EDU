import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT,readTerms} from '../src/contract.mjs';
import {initialState} from '../src/state.mjs';
import {runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';
import {FASTBOOT_CAPABILITY_FIELDS,FASTBOOT_MACHINE_CARRIERS,FASTBOOT_HUMAN_LAST_RESORT,selectFastbootCarrier} from '../src/fastboot-convergence.mjs';
import {bootstrapPublicLineFromAction} from '../src/session-shell.mjs';
import {READ_ONLY_PREACCEPT_OVERREAD,HARD_PREACCEPT_BREACH,classifyCompletedPreacceptAccess,recordCompletedPreacceptAccess,buildPreacceptRemediationReceipt,applyPreacceptRemediation,presentTermsState,canAccept} from '../src/admission.mjs';
import {directActivationExecutorHandoff,validateDirectExecutorHandoff,deriveExitDelegation} from '../src/bootstrap-intent-adapter.mjs';
import {deriveControlPlaneOwnership} from '../src/control-plane-ownership.mjs';

const CASES=Number(process.argv.includes('--cases')?process.argv[process.argv.indexOf('--cases')+1]:1000000);
let seed=0xC43A11CE>>>0;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
const proven=()=>Object.fromEntries(FASTBOOT_CAPABILITY_FIELDS.map(k=>[k,true]));
const unavail=()=>false,unknown=()=>({});
const terms=readTerms(),D=runtimeRootDescriptor(),H='a'.repeat(40);
const sha=x=>crypto.createHash('sha256').update(Buffer.from(JSON.stringify(x))).digest('hex'),git=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const paths=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'],orientation=paths.map(p=>{const b=fs.readFileSync(path.join(ROOT,p));return{path:p,blob_sha1:git(b),bytes:b.length};}),termRow=orientation.find(x=>x.path==='TERMS.md');
const pre={schema:'ikant-le-preaccept-handoff/v2',repository:'Luke883i/iKant_EDU',source_head:H,terms_presented:true,frozen:true,breached:false,orientation_objects:orientation,terms_object:{...termRow},orientation_payloads:paths.map(p=>({path:p,content_utf8:fs.readFileSync(path.join(ROOT,p),'utf8')})),runtime_observed_terms_presentation:false,host_attested_terms_presentation:true,authority:0};
const runtimeObjects=[{path:D.loader.path,blob_sha1:D.loader.blob_sha1,bytes:fs.readFileSync(path.join(ROOT,D.loader.path)).length},...D.shards.map(s=>({path:s.path,blob_sha1:s.blob_sha1,bytes:s.source_bytes}))];
const em={schema:'ikant-le-activation-executor/v1',repository:'Luke883i/iKant_EDU',source_head:H,runtime_root_sha256:D.runtime_root_sha256,execution_plane:'SESSION_LOCAL_NODE',capability_probe_passed:true,capability_probe_before_acquisition:true,content_addressed:true,byte_path:'LOCAL_DIRECT',model_mediated_bytes:false,model_role:'NONE',model_rewrite_allowed:false,semantic_equivalence_allowed:false,source_arrival_samehash_required:true,source_arrival_samehash_verified:true,opaque_relay_roundtrip_verified:false,retry_semantics:'IDEMPOTENT_BY_OBJECT_IDENTITY',retry_count:0,acquisition_complete:true,orientation_objects:orientation,runtime_objects:runtimeObjects,slo_elapsed_ms:5,authority:0},executor={...em,receipt_sha256:sha(em)};
const direct=directActivationExecutorHandoff({preacceptHandoff:pre,activationExecutor:executor,humanInput:'I ACCEPT',acceptanceObservedMonotonicMs:10}).handoff;
const owned=deriveControlPlaneOwnership({runtime_bound:true,model_invocation_gate:true,pre_display_egress_gate:true,durable_session_identity:true,ownership_receipt_valid:true,activate_ikant_requested:true,warm_activation_elapsed_ms:1,warm_runtime:true,github_transfer_during_turn:false,mass_qualification_during_turn:false,repo_self_recheck_ok:true,integrity_fault:false});
const recoverable=['GIT_LS_REMOTE','LIST_TREE','SEARCH_REPOSITORY','READ_ARBITRARY_REPOSITORY_FILE','READ_HISTORY','READ_ISSUE_PR'];
const hard=['CLONE_REPOSITORY','GIT_FETCH','GH_CLI','RAW_WEB_READ','DIRECT_DOWNLOAD','ARCHIVE_DOWNLOAD','SHELL_HTTP_DOWNLOAD','MATERIALIZE_CHECKOUT'];
function machineCaps(fill=false){return Object.fromEntries(FASTBOOT_MACHINE_CARRIERS.map(c=>[c,fill]));}
function firstUnknown(caps){for(const c of FASTBOOT_MACHINE_CARRIERS)if(caps[c]&&typeof caps[c]==='object'&&Object.keys(caps[c]).length===0)return c;return null;}
function anyMachineOpen(caps,attempted=[]){const a=new Set(attempted);return FASTBOOT_MACHINE_CARRIERS.some(c=>!a.has(c)&&caps[c]!==false);}
function rrState(){const x=recordCompletedPreacceptAccess(initialState(),recoverable[rnd()%recoverable.length],{target:'x'});return x;}
const families=[
 ['MACHINE_AVAILABLE_BEATS_FILE',()=>{const caps=machineCaps(false),m=FASTBOOT_MACHINE_CARRIERS[rnd()%FASTBOOT_MACHINE_CARRIERS.length];caps[m]=proven();caps[FASTBOOT_HUMAN_LAST_RESORT]=proven();const p=selectFastbootCarrier({capabilities:caps});return p.state==='EXECUTABLE'&&p.carrier===m;}],
 ['MACHINE_UNKNOWN_BEATS_FILE',()=>{const caps=machineCaps(false),m=FASTBOOT_MACHINE_CARRIERS[rnd()%FASTBOOT_MACHINE_CARRIERS.length];caps[m]=unknown();caps[FASTBOOT_HUMAN_LAST_RESORT]=proven();const p=selectFastbootCarrier({capabilities:caps});return p.state==='PROBE_REQUIRED'&&p.carrier===m;}],
 ['FILE_EXEC_AFTER_MACHINE_EXHAUSTION',()=>{const caps=machineCaps(false);caps[FASTBOOT_HUMAN_LAST_RESORT]=proven();const p=selectFastbootCarrier({capabilities:caps});return p.state==='EXECUTABLE'&&p.carrier===FASTBOOT_HUMAN_LAST_RESORT;}],
 ['FILE_PROBE_AFTER_MACHINE_EXHAUSTION',()=>{const caps=machineCaps(false);caps[FASTBOOT_HUMAN_LAST_RESORT]=unknown();const p=selectFastbootCarrier({capabilities:caps});return p.state==='PROBE_REQUIRED'&&p.carrier===FASTBOOT_HUMAN_LAST_RESORT;}],
 ['FILE_AFTER_MACHINE_FAILURE_MEMORY',()=>{const caps=Object.fromEntries(FASTBOOT_MACHINE_CARRIERS.map(c=>[c,proven()]));caps[FASTBOOT_HUMAN_LAST_RESORT]=proven();const p=selectFastbootCarrier({capabilities:caps,attemptedClasses:[...FASTBOOT_MACHINE_CARRIERS]});return p.carrier===FASTBOOT_HUMAN_LAST_RESORT;}],
 ['PUBLIC_FILE_UNKNOWN_IS_VERIFY',()=>bootstrapPublicLineFromAction({action:'PROBE_CANONICAL_CARRIER',carrier:FASTBOOT_HUMAN_LAST_RESORT})==='iKant · VERIFICA'],
 ['PUBLIC_FILE_EXEC_IS_UPLOAD',()=>bootstrapPublicLineFromAction({action:'EXECUTE_CANONICAL_CARRIER',carrier:FASTBOOT_HUMAN_LAST_RESORT})==='iKant · CARICA FILE'],
 ['PUBLIC_WARM_EXEC_IS_START',()=>bootstrapPublicLineFromAction({action:'EXECUTE_CANONICAL_CARRIER',carrier:'WARM_CACHE_EXACT'})==='iKant · AVVIA'],
 ['PUBLIC_MACHINE_EXEC_IS_ACQUIRE',()=>bootstrapPublicLineFromAction({action:'EXECUTE_CANONICAL_CARRIER',carrier:'GITHUB_API_BASE64'})==='iKant · ACQUISISCI'],
 ['PUBLIC_WAIT_IS_WAIT',()=>bootstrapPublicLineFromAction({action:'WAIT_CHANGED_EVIDENCE'})==='iKant · ATTENDI CAMBIO'],
 ['PUBLIC_HANDOFF_IS_MATERIALIZE',()=>bootstrapPublicLineFromAction({action:'HANDOFF_PRE_RUNTIME'})==='iKant · MATERIALIZZA'],
 ['READ_ONLY_CLASSIFIED',()=>classifyCompletedPreacceptAccess(recoverable[rnd()%recoverable.length])===READ_ONLY_PREACCEPT_OVERREAD],
 ['HARD_CLASSIFIED',()=>classifyCompletedPreacceptAccess(hard[rnd()%hard.length])===HARD_PREACCEPT_BREACH],
 ['READ_ONLY_NOT_FRESH_CHAT',()=>{const x=rrState();return x.terminal==='REMEDIATION_REQUIRED'&&x.state.admission.new_chat_required===false&&x.state.status!=='SESSION_NONCONFORMING';}],
 ['HARD_FRESH_CHAT',()=>{const x=recordCompletedPreacceptAccess(initialState(),hard[rnd()%hard.length],{target:'x'});return x.terminal==='NEW_CHAT_REQUIRED'&&x.state.status==='SESSION_NONCONFORMING'&&x.state.admission.new_chat_required===true;}],
 ['CONTINUED_OVERREAD_ESCALATES',()=>{const x=rrState(),y=recordCompletedPreacceptAccess(x.state,recoverable[rnd()%recoverable.length],{target:'y'});return y.terminal==='NEW_CHAT_REQUIRED'&&y.state.admission.breach_class===HARD_PREACCEPT_BREACH;}],
 ['REMEDIATION_PRESERVES_HISTORY',()=>{const x=rrState(),r=buildPreacceptRemediationReceipt(x.state,terms.digest),s=applyPreacceptRemediation(x.state,r,terms.digest);return s.admission.historical_breach_fingerprint===x.state.admission.breach_fingerprint&&s.admission.admission_history_label==='REMEDIATED_READ_ONLY_PREACCEPT'&&s.admission.content_reacquisition_required===true;}],
 ['REMEDIATION_REQUIRES_REACQUISITION',()=>{const x=rrState(),r=buildPreacceptRemediationReceipt(x.state,terms.digest),s=presentTermsState(applyPreacceptRemediation(x.state,r,terms.digest),terms.digest);return canAccept(s,terms.digest)===false;}],
 ['SECOND_OVERREAD_AFTER_REMEDIATION_ESCALATES',()=>{const x=rrState(),r=buildPreacceptRemediationReceipt(x.state,terms.digest),s=applyPreacceptRemediation(x.state,r,terms.digest),y=recordCompletedPreacceptAccess(s,recoverable[rnd()%recoverable.length],{target:'z'});return y.terminal==='NEW_CHAT_REQUIRED'&&y.state.admission.breach_class===HARD_PREACCEPT_BREACH;}],
 ['EXIT_OWNED_RELEASES_FIRST',()=>deriveExitDelegation({controlPlaneOwnership:owned,runtimeActive:true}).action==='RELEASE_TO_HOST'],
 ['EXIT_ACTIVE_RUNTIME_SECOND',()=>deriveExitDelegation({runtimeActive:true}).action==='EXIT IKANT'],
 ['EXIT_INACTIVE_COMPLETE',()=>deriveExitDelegation({runtimeActive:false}).action==='EXIT_COMPLETE'],
 ['DIRECT_HANDOFF_BOUND',()=>validateDirectExecutorHandoff(direct).ok===true&&direct.active_claim===false&&!('acceptance_event_id'in direct)],
 ['DIRECT_INPUT_TAMPER_REJECTED',()=>{const x=structuredClone(direct);x.execution_input.human_input=(rnd()&1)?'YES':'I ACCEPT ';return validateDirectExecutorHandoff(x).ok===false;}],
 ['DIRECT_EVENT_ID_INJECTION_REJECTED',()=>{const x=structuredClone(direct);x.acceptance_event_id='future-runtime-id';return validateDirectExecutorHandoff(x).ok===false;}]
];
let mismatches=0,killed=0,fileEarly=0,unsafeActive=0,unsafeOwned=0,readOnlyFresh=0;const counts=Object.fromEntries(families.map(([n])=>[n,0])),failures=[];
for(let i=0;i<CASES;i++){
 const [name,run]=families[i%families.length];counts[name]++;let ok=false;try{ok=run()===true}catch(e){if(failures.length<20)failures.push({i,name,error:String(e?.message||e)})}
 if(ok)killed++;else{mismatches++;if(failures.length<20)failures.push({i,name,error:'oracle_mismatch'});}
 if((i&255)===0){const caps=machineCaps(false),m=FASTBOOT_MACHINE_CARRIERS[rnd()%FASTBOOT_MACHINE_CARRIERS.length];caps[m]=(rnd()&1)?unknown():proven();caps[FASTBOOT_HUMAN_LAST_RESORT]=proven();const attempted=[],p=selectFastbootCarrier({capabilities:caps,attemptedClasses:attempted});if(p.carrier===FASTBOOT_HUMAN_LAST_RESORT&&anyMachineOpen(caps,attempted))fileEarly++;}
}
const minFamily=Math.min(...Object.values(counts));
if(direct.active_claim===true)unsafeActive++;
if(owned.state!=='IKANT_OWNED')unsafeOwned++;
const ro=rrState();if(ro.terminal==='NEW_CHAT_REQUIRED')readOnlyFresh++;
const out={schema:'ikant-le-c43-bootstrap-recovery-hardening-falsification/v1',seed:'0xC43A11CE',cases:CASES,families:families.length,profile:'REALISTIC_RUNTIME_SEMANTIC',candidate_oracle_mismatches:mismatches,killed,mutation_kill_ratio:killed/CASES,min_family_cases:minFamily,family_counts:counts,file_selected_before_machine_exhaustion:fileEarly,unsafe_active:unsafeActive,unsafe_ikant_owned:unsafeOwned,read_only_overread_forced_fresh_chat:readOnlyFresh,premature_acceptance_event_identity:'acceptance_event_id'in direct?1:0,failures,status:mismatches===0&&killed===CASES&&minFamily>0&&fileEarly===0&&unsafeActive===0&&unsafeOwned===0&&readOnlyFresh===0&&!('acceptance_event_id'in direct)?'PASS':'FAIL',claim_boundary:{semantic_mutation_is_physical_host_proof:false,scenario_oracle_pass_is_population_statistic:false,file_upload_is_materialization:false,remediation_is_retroactive_authorization:false}};
out.receipt_sha256=sha(out);process.stdout.write(JSON.stringify(out,null,2)+'\n');if(out.status!=='PASS')process.exitCode=1;
