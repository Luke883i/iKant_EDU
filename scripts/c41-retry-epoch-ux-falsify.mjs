import crypto from 'node:crypto';
import {FASTBOOT_ATTEMPT_SCHEMA,FASTBOOT_CAPABILITY_FIELDS,advanceFastbootObservation,buildFastbootChannelLedger,deriveFastbootStep,fastbootObservationTransitionDigest,fastbootReceiptDigest,issueFastbootCapabilityReceipt,recordFastbootFailure,validateFastbootChannelLedger,validateFastbootObservationTransition,validateFastbootStep} from '../src/fastboot-convergence.mjs';
import {runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';
import {buildSessionShell,validateSessionShell} from '../src/session-shell.mjs';

const CASES=10000,HEAD='a'.repeat(40),EVENT='evt-c41-falsify',D=runtimeRootDescriptor(),ROOT=D.runtime_root_sha256;
const proven=()=>Object.fromEntries(FASTBOOT_CAPABILITY_FIELDS.map(k=>[k,true]));
const sign=x=>{const y=structuredClone(x);delete y.receipt_sha256;return{...y,receipt_sha256:fastbootReceiptDigest(y)}};
const resignTransition=x=>({...x,receipt_sha256:fastbootObservationTransitionDigest(x)});
const preState=()=>({status:'DISCOVERED',accepted:true,admission:{terms_presented:true},bootstrap:{terminal:'ACTIVATING'},experience:{turns:0,maturity_mode:'ORIENTING'},psyche:{last_runtime_outcome:'NONE'}});
const activeState=()=>({status:'ACTIVE',accepted:true,probed:true,bootstrap:{terminal:'ACTIVE'},experience:{turns:0,maturity_mode:'ORIENTING'},psyche:{last_runtime_outcome:'NONE'}});
function available(evidence='available',carrier='GITHUB_API_BASE64'){return issueFastbootCapabilityReceipt({carrier,status:'AVAILABLE',capabilities:proven(),evidence,probeOwner:'c41-falsify',operationId:'op-'+evidence,sourceHead:HEAD});}
function unavailable(carrier,evidence='unavailable'){return issueFastbootCapabilityReceipt({carrier,status:'UNAVAILABLE',capabilities:{...proven(),surface_supported:false},evidence,probeOwner:'c41-falsify',operationId:'op-'+evidence,sourceHead:HEAD});}
function baseFailure(tag='base'){const ledger=buildFastbootChannelLedger({receipts:[available('available-'+tag)],sourceHead:HEAD}),step=deriveFastbootStep({ledger,runtimeRootSha256:ROOT}),failed=recordFastbootFailure(ledger,step);return{ledger,step,failed};}
function completeAttempt(step,tag='complete'){const objects=[{path:D.loader.path,blob_sha1:D.loader.blob_sha1},...D.shards.map(s=>({path:s.path,blob_sha1:s.blob_sha1}))].map((x,i)=>({...x,sha256:crypto.createHash('sha256').update(tag+':'+i).digest('hex'),bytes:i+1}));return sign({schema:FASTBOOT_ATTEMPT_SCHEMA,attempt_id:'c41-'+tag,carrier:step.canonical_carrier,acceptance_event_id:EVENT,source_head:HEAD,runtime_root_sha256:ROOT,result:'COMPLETE',source_object_identity:'source-'+tag,runtime_sink_object_id:'sink-'+tag,remote_objects:objects,remote_reads:objects.length,bytes_observed:objects.reduce((n,x)=>n+x.bytes,0),source_fetch_observed:true,byte_preserving_runtime_sink_observed:true,runtime_materializer_bound:true,runtime_executor_bound:true,model_mediated_bytes:false,authoritative_remote_history:false,committed_remote_rounds:0,transfer_receipt_sha256:crypto.createHash('sha256').update('transfer:'+tag).digest('hex'),authority:0})}
function completeCycle(tag='complete'){const ledger=buildFastbootChannelLedger({receipts:[available('available-'+tag)],sourceHead:HEAD}),step=deriveFastbootStep({ledger,runtimeRootSha256:ROOT}),cycle=advanceFastbootObservation({ledger,runtimeRootSha256:ROOT,observation:completeAttempt(step,tag),runtimeRootDescriptor:D,acceptanceEventId:EVENT});return{ledger,step,cycle};}
function probeCycle(tag='probe'){const ledger=buildFastbootChannelLedger({sourceHead:HEAD,receipts:[]}),step=deriveFastbootStep({ledger,runtimeRootSha256:ROOT}),receipt=unavailable(step.canonical_carrier,'probe-'+tag),cycle=advanceFastbootObservation({ledger,runtimeRootSha256:ROOT,observation:receipt});return{ledger,step,cycle};}
function rejects(fn){try{fn();return false}catch{return true}}
function invalidTransition(mutator,tag){const {cycle}=completeCycle(tag),x=structuredClone(cycle);mutator(x);x.receipt_sha256=fastbootObservationTransitionDigest(x);return !validateFastbootObservationTransition(x,{sourceHead:HEAD,runtimeRootSha256:ROOT}).ok;}

const families=[
 ['DIRECT_CALLER_RETRY_MEMORY',i=>{const l=buildFastbootChannelLedger({sourceHead:HEAD,receipts:[]});return rejects(()=>deriveFastbootStep({ledger:l,runtimeRootSha256:ROOT,attemptedClasses:['WARM_CACHE_EXACT']}));}],
 ['VALIDATOR_CALLER_RETRY_MEMORY',i=>{const l=buildFastbootChannelLedger({sourceHead:HEAD,receipts:[]}),s=deriveFastbootStep({ledger:l,runtimeRootSha256:ROOT});return !validateFastbootStep(s,{sourceHead:HEAD,runtimeRootSha256:ROOT,ledger:l,attemptedClasses:['WARM_CACHE_EXACT']}).ok;}],
 ['SHELL_CALLER_RETRY_MEMORY',i=>{const l=buildFastbootChannelLedger({sourceHead:HEAD,receipts:[]}),s=deriveFastbootStep({ledger:l,runtimeRootSha256:ROOT});return rejects(()=>buildSessionShell({surfaceText:'x',state:preState(),bootstrapStep:s,bootstrapLedger:l,attemptedClasses:['WARM_CACHE_EXACT']}));}],
 ['UNRELATED_EVIDENCE_REQUALIFICATION',i=>{const x=baseFailure('u'+i),changed=buildFastbootChannelLedger({previous:x.failed,receipts:[unavailable('WARM_CACHE_EXACT','other-'+i)],sourceHead:HEAD}),n=deriveFastbootStep({ledger:changed,runtimeRootSha256:ROOT});return n.canonical_carrier!==x.step.canonical_carrier;}],
 ['RELATED_EVIDENCE_REQUALIFICATION',i=>{const x=baseFailure('r'+i),changed=buildFastbootChannelLedger({previous:x.failed,receipts:[available('same-'+i)],sourceHead:HEAD}),n=deriveFastbootStep({ledger:changed,runtimeRootSha256:ROOT});return n.canonical_carrier===x.step.canonical_carrier;}],
 ['FAILURE_EPOCH_REMOVAL',i=>{const x=baseFailure('m'+i),y=structuredClone(x.failed);delete y.failed_decisions[0].carrier_evidence_sha256;delete y.receipt_sha256;y.receipt_sha256=fastbootReceiptDigest(y);return !validateFastbootChannelLedger(y,{sourceHead:HEAD}).ok;}],
 ['HANDOFF_ACTION_FORGERY',i=>invalidTransition(x=>{x.handoff.action='FORGED_ACTION'},'a'+i)],
 ['HANDOFF_OWNER_FORGERY',i=>invalidTransition(x=>{x.handoff.owner='FORGED_OWNER';x.handoff_owner='FORGED_OWNER'},'o'+i)],
 ['HANDOFF_ATTEMPT_BINDING_FORGERY',i=>invalidTransition(x=>{x.handoff.attempt_receipt_sha256='f'.repeat(64)},'b'+i)],
 ['HANDOFF_ACTIVE_PROMOTION',i=>invalidTransition(x=>{x.handoff.active_claim=true},'p'+i)],
 ['HANDOFF_AUTHORITY_PROMOTION',i=>invalidTransition(x=>{x.handoff.authority=1},'q'+i)],
 ['HANDOFF_NEXT_STEP_SMUGGLE',i=>invalidTransition(x=>{x.next_step=deriveFastbootStep({ledger:x.ledger,runtimeRootSha256:ROOT});x.next_step_receipt_sha256=x.next_step.receipt_sha256},'n'+i)],
 ['HANDOFF_LEDGER_MUTATION',i=>invalidTransition(x=>{x.to_ledger_receipt_sha256='f'.repeat(64)},'l'+i)],
 ['NON_HANDOFF_ROUTE_SMUGGLE',i=>{const x=probeCycle('h'+i).cycle,y=structuredClone(x);y.handoff_owner='PRE_RUNTIME_HOST_ADAPTER';y.handoff={owner:'PRE_RUNTIME_HOST_ADAPTER',action:'EXECUTE_PRE_RUNTIME_BOOTSTRAP',attempt_receipt_sha256:y.observation_receipt_sha256,active_claim:false,authority:0};y.receipt_sha256=fastbootObservationTransitionDigest(y);return !validateFastbootObservationTransition(y,{sourceHead:HEAD,runtimeRootSha256:ROOT}).ok;}],
 ['SHELL_FORGED_HANDOFF',i=>{const x=completeCycle('s'+i).cycle,y=structuredClone(x);y.handoff.action='FORGED_ACTION';y.receipt_sha256=fastbootObservationTransitionDigest(y);return rejects(()=>buildSessionShell({surfaceText:'x',state:preState(),bootstrapTransition:y}));}],
 ['SHELL_MIXED_GUIDANCE_SOURCES',i=>{const p=probeCycle('mix'+i);return rejects(()=>buildSessionShell({surfaceText:'x',state:preState(),bootstrapStep:p.step,bootstrapLedger:p.ledger,bootstrapTransition:p.cycle}));}],
 ['SHELL_HANDOFF_CONTINUITY',i=>{const x=completeCycle('ui'+i).cycle,s=buildSessionShell({surfaceText:'x',state:preState(),bootstrapTransition:x}),g=s.status.runtime_guidance;return validateSessionShell(s).ok&&g?.next_action==='EXECUTE_PRE_RUNTIME_BOOTSTRAP'&&g?.first_unclosed_edge==='LOCAL_MATERIALIZATION'&&g?.retry_disposition==='OWNER_HANDOFF_ONCE'&&s.status.active===false;}],
 ['SHELL_REENTRY_CONTINUITY',i=>{const x=probeCycle('ri'+i),s=buildSessionShell({surfaceText:'x',state:preState(),bootstrapTransition:x.cycle});return validateSessionShell(s).ok&&s.status.runtime_guidance?.next_action===x.cycle.next_step.canonical_next&&s.status.runtime_guidance?.first_unclosed_edge==='LOCAL_INGRESS';}],
 ['ACTIVE_HIDES_TRANSITION_GUIDANCE',i=>{const x=completeCycle('act'+i).cycle,s=buildSessionShell({surfaceText:'x',state:activeState(),bootstrapTransition:x});return s.status.active===true&&s.status.runtime_guidance===null;}],
 ['DUPLICATE_FAILURE_EPOCH_DEDUP',i=>{const x=baseFailure('d'+i),again=recordFastbootFailure(x.ledger,x.step);return again.failed_decisions.length===1&&again.receipt_sha256===x.failed.receipt_sha256;}]
];

let killed=0,mismatches=0;const familyKills=Object.fromEntries(families.map(([n])=>[n,0]));
for(let i=0;i<CASES;i++){const [name,run]=families[i%families.length];let ok=false;try{ok=run(i)===true}catch{ok=false}if(ok){killed++;familyKills[name]++;}else mismatches++;}
const bf=baseFailure('edge'),unrelatedLedger=buildFastbootChannelLedger({previous:bf.failed,receipts:[unavailable('WARM_CACHE_EXACT','edge-unrelated')],sourceHead:HEAD}),unrelatedNext=deriveFastbootStep({ledger:unrelatedLedger,runtimeRootSha256:ROOT}),relatedLedger=buildFastbootChannelLedger({previous:bf.failed,receipts:[available('edge-related')],sourceHead:HEAD}),relatedNext=deriveFastbootStep({ledger:relatedLedger,runtimeRootSha256:ROOT}),cc=completeCycle('edge-complete'),pc=probeCycle('edge-probe'),handoffShell=buildSessionShell({surfaceText:'x',state:preState(),bootstrapTransition:cc.cycle}),reentryShell=buildSessionShell({surfaceText:'x',state:preState(),bootstrapTransition:pc.cycle});
const malformedLedger=structuredClone(bf.failed);delete malformedLedger.failed_decisions[0].carrier_evidence_sha256;delete malformedLedger.receipt_sha256;malformedLedger.receipt_sha256=fastbootReceiptDigest(malformedLedger);
const forgedRoute=structuredClone(cc.cycle);forgedRoute.handoff.action='FORGED_ACTION';forgedRoute.receipt_sha256=fastbootObservationTransitionDigest(forgedRoute);
const directCallerRejected=rejects(()=>deriveFastbootStep({ledger:bf.ledger,runtimeRootSha256:ROOT,attemptedClasses:['WARM_CACHE_EXACT']})),shellCallerRejected=rejects(()=>buildSessionShell({surfaceText:'x',state:preState(),bootstrapStep:bf.step,bootstrapLedger:bf.ledger,attemptedClasses:['WARM_CACHE_EXACT']})),forgedRouteRejected=!validateFastbootObservationTransition(forgedRoute,{sourceHead:HEAD,runtimeRootSha256:ROOT}).ok;
const edges={
 canonical_step_ledger_only:directCallerRejected,
 step_validator_rejects_caller_retry:!validateFastbootStep(bf.step,{sourceHead:HEAD,runtimeRootSha256:ROOT,ledger:bf.ledger,attemptedClasses:['WARM_CACHE_EXACT']}).ok,
 shell_ledger_only:shellCallerRejected,
 retry_memory_owner:bf.failed.retry_memory_owner==='FASTBOOT_CHANNEL_LEDGER',
 failure_memory_scope:bf.failed.failure_memory_scope==='CARRIER_LOCAL_CHANNEL_EVIDENCE',
 failure_row_has_carrier_epoch:/^[a-f0-9]{64}$/.test(bf.failed.failed_decisions[0].carrier_evidence_sha256),
 malformed_failure_epoch_rejected:!validateFastbootChannelLedger(malformedLedger,{sourceHead:HEAD}).ok,
 same_epoch_failed_carrier_excluded:deriveFastbootStep({ledger:bf.failed,runtimeRootSha256:ROOT}).canonical_carrier!==bf.step.canonical_carrier,
 unrelated_evidence_does_not_requalify:unrelatedNext.canonical_carrier!==bf.step.canonical_carrier,
 unrelated_evidence_changes_global_digest:unrelatedLedger.channel_evidence_sha256!==bf.failed.channel_evidence_sha256,
 same_carrier_evidence_requalifies:relatedNext.canonical_carrier===bf.step.canonical_carrier,
 transition_valid:validateFastbootObservationTransition(cc.cycle,{sourceHead:HEAD,runtimeRootSha256:ROOT}).ok,
 transition_handoff_owner:cc.cycle.handoff?.owner==='PRE_RUNTIME_HOST_ADAPTER',
 transition_handoff_action:cc.cycle.handoff?.action==='EXECUTE_PRE_RUNTIME_BOOTSTRAP',
 transition_handoff_attempt_bound:cc.cycle.handoff?.attempt_receipt_sha256===cc.cycle.observation_receipt_sha256,
 transition_handoff_digest_bound:forgedRouteRejected,
 transition_handoff_no_next_step:cc.cycle.next_step===null&&cc.cycle.next_step_receipt_sha256===null,
 transition_handoff_no_ledger_mutation:cc.cycle.from_ledger_receipt_sha256===cc.cycle.to_ledger_receipt_sha256,
 transition_handoff_non_active:cc.cycle.active_claim===false&&cc.cycle.handoff?.active_claim===false,
 shell_handoff_source:handoffShell.status.runtime_guidance?.source==='VALIDATED_FASTBOOT_TRANSITION',
 shell_handoff_action:handoffShell.status.runtime_guidance?.next_action==='EXECUTE_PRE_RUNTIME_BOOTSTRAP',
 shell_handoff_next_edge:handoffShell.status.runtime_guidance?.first_unclosed_edge==='LOCAL_MATERIALIZATION',
 shell_handoff_retry_mode:handoffShell.status.runtime_guidance?.retry_disposition==='OWNER_HANDOFF_ONCE',
 shell_reentry_next:reentryShell.status.runtime_guidance?.next_action===pc.cycle.next_step.canonical_next,
 shell_reentry_valid:validateSessionShell(reentryShell).ok,
 active_hides_transition:buildSessionShell({surfaceText:'x',state:activeState(),bootstrapTransition:cc.cycle}).status.runtime_guidance===null
};
const covered=Object.values(edges).filter(Boolean).length,total=Object.keys(edges).length,allMutantsKilled=Object.values(familyKills).every(n=>n>0)&&mismatches===0,uiGap=edges.shell_handoff_action&&edges.shell_handoff_next_edge&&edges.shell_handoff_retry_mode?0:1;
const out={schema:'ikant-le-c41-retry-epoch-ux-falsification/v1',cases:CASES,families:families.length,edge_catalog_total:total,edge_catalog_covered:covered,edge_coverage_ratio:covered/total,candidate_oracle_mismatches:mismatches,killed,mutation_kill_ratio:killed/CASES,all_mutants_killed:allMutantsKilled,caller_retry_memory_accepted:directCallerRejected&&shellCallerRejected?0:1,unrelated_requalifications:unrelatedNext.canonical_carrier===bf.step.canonical_carrier?1:0,unbound_handoff_routes:forgedRouteRejected?0:1,actionable_transition_ui_gaps:uiGap,unsafe_active:edges.transition_handoff_non_active?0:1,status:mismatches===0&&covered/total>=0.95&&killed/CASES>=0.95&&allMutantsKilled&&directCallerRejected&&shellCallerRejected&&unrelatedNext.canonical_carrier!==bf.step.canonical_carrier&&forgedRouteRejected&&uiGap===0&&edges.transition_handoff_non_active?'PASS':'FAIL'};
out.receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(out)).digest('hex');
process.stdout.write(JSON.stringify(out,null,2)+'\n');if(out.status!=='PASS')process.exitCode=1;
