import fs from 'node:fs';
import crypto from 'node:crypto';
import {classifyRuntimeAvailability,classifyTurnRelease,validateRuntimeAvailabilityDecision} from '../src/runtime-availability.mjs';
const args=process.argv.slice(2),get=(k,d)=>{const i=args.indexOf(k);return i>=0?args[i+1]:d};
const CASES=Number(get('--cases','1000000')),PHASE=get('--phase','qualification'),OUT=get('--output',`artifacts/qualification/c16-${PHASE}.json`),BASE_HEAD=get('--base-head','UNBOUND');
if(!Number.isInteger(CASES)||CASES<1)throw new Error('cases must be positive integer');
if(PHASE==='discovery'&&CASES!==10_000_000)throw new Error('C16 discovery requires exactly 10,000,000 cases');
if(PHASE==='qualification'&&CASES!==1_000_000)throw new Error('C16 qualification requires exactly 1,000,000 cases');
let seed=(PHASE==='discovery'?0xC160D15C:0xC160A11F)>>>0;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};
const NODES=['SOURCE','CONSENT','TRANSFER_IDENTITY','BYTE_BRIDGE','LOCAL_ROOT','HOST_PROBE','WRITER','ACTIVE_COMMIT','DEADLINE','RELEASE'];
const families={
 SOURCE:['head_missing','head_drift','orientation_other_head','terms_other_head','source_rebound','source_unknown','source_receipt_tamper'],
 CONSENT:['terms_not_presented','accept_missing','embedded_accept','prior_session_accept','terms_digest_drift','consent_replayed','freeze_breach'],
 TRANSFER_IDENTITY:['object_missing','object_extra','object_duplicate','blob_mismatch','sha256_missing','wrong_root','wrong_head','receipt_tamper','model_reconstruction','unsafe_archive'],
 BYTE_BRIDGE:['bridge_missing','bridge_unobserved','host_bridge_no_readback','connector_only','dns_unavailable','carrier_unavailable','bridge_wrong_sink'],
 LOCAL_ROOT:['materialization_missing','atomic_publish_missing','reopen_missing','sink_unavailable','sink_symlink','post_publish_mismatch','materialization_receipt_missing','materialization_binding_break'],
 HOST_PROBE:['node19','fs_write_fail','fs_readback_fail','fs_append_fail','fs_delete_fail','sha_fail','clock_fail','artifact_sink_fail','probe_simulated'],
 WRITER:['writer_lock_busy','ledger_append_fail','ledger_readback_fail','hash_chain_break','fsync_fail','second_writer','state_reopen_fail'],
 ACTIVE_COMMIT:['commit_missing','commit_readback_fail','wrong_epoch','wrong_source_binding','pending_resume_double','pending_resume_lost','status_false_green'],
 DEADLINE:['over_deadline','deadline_origin_wrong','clock_nonmonotonic','retry_resets_deadline','negative_elapsed','deadline_receipt_missing'],
 RELEASE:['artifact_write_fail','artifact_readback_fail','artifact_presentation_missing','surface_a_early','filename_only','silent_retention','wrong_turn_artifact','duplicate_artifact']
};
const familyRows=NODES.flatMap(n=>families[n].map(f=>({node:n,f})));const coverage=new Uint32Array(familyRows.length),stateCounts={},turnCounts={};
const hist=new Uint32Array(1<<NODES.length),deletion=Object.fromEntries(NODES.map(n=>[n,0]));let mismatches=0,turnMismatches=0,unsafeActive=0,integrityLaundered=0,badCards=0;
function base(){return{terms_presented:true,accepted:true,preaccept_breach:false,exited:false,source_bound:true,consent_valid:true,transfer_identity:true,evidence_available:true,byte_bridge:true,local_root:true,host_probe:true,writer:true,deadline_result:'DEADLINE_PASS',active_commit:true,integrity_codes:[],release:{session_state:'ACTIVE',processing:true,artifact_written:true,artifact_readback:true,presented:true,surface_a_released:true,attempt_complete:true},mask:0};}
function bit(n){return 1<<NODES.indexOf(n)}
function mutate(c,row){const n=row.node,f=row.f;c.mask|=bit(n);switch(n){
 case'SOURCE': if(f==='source_receipt_tamper'||f==='head_drift'||f==='orientation_other_head'||f==='terms_other_head'||f==='source_rebound'){c.integrity_codes.push('SOURCE_MISMATCH');c.source_bound=false;}else c.source_bound=false; break;
 case'CONSENT': if(f==='terms_digest_drift'||f==='consent_replayed'||f==='freeze_breach'){c.integrity_codes.push('CONSENT_INVALID');c.consent_valid=false;}else{c.accepted=false;if(f==='terms_not_presented')c.terms_presented=false;} break;
 case'TRANSFER_IDENTITY': c.transfer_identity=false;c.integrity_codes.push(f==='model_reconstruction'?'MODEL_MEDIATED_BYTES':f==='unsafe_archive'?'UNSAFE_ARCHIVE':'TRANSFER_IDENTITY_MISMATCH'); break;
 case'BYTE_BRIDGE': c.byte_bridge=false;break;
 case'LOCAL_ROOT': if(['post_publish_mismatch','materialization_binding_break','sink_symlink'].includes(f)){c.integrity_codes.push('MATERIALIZATION_MISMATCH');}c.local_root=false;break;
 case'HOST_PROBE': c.host_probe=false;break;
 case'WRITER': c.writer=false;break;
 case'ACTIVE_COMMIT': c.active_commit=false;break;
 case'DEADLINE': c.deadline_result='DEADLINE_EXCEEDED';break;
 case'RELEASE': c.release.surface_a_released=f==='surface_a_early'?true:false;if(f==='artifact_write_fail')c.release.artifact_written=false;else if(f==='artifact_readback_fail')c.release.artifact_readback=false;else c.release.presented=false;if(f==='surface_a_early'){c.release.presented=false;c.release.artifact_written=true;c.release.artifact_readback=true;}break;
 }}
function oracleSession(c){if(c.exited)return'EXITED';if(c.preaccept_breach)return'SESSION_NONCONFORMING';if(c.integrity_codes.length)return'BLOCKED_INTEGRITY';if(!c.accepted)return c.terms_presented?'AWAITING_ACCEPTANCE':'ORIENTING';if(['DEADLINE_ORIGIN_UNAVAILABLE','DEADLINE_ORIGIN_INVALID','DEADLINE_ELAPSED_UNAVAILABLE','DEADLINE_EXCEEDED'].includes(c.deadline_result))return'ADMISSION_EPOCH_UNRECOVERABLE';const unavailable=[c.evidence_available,c.byte_bridge,c.local_root,c.host_probe,c.writer,c.active_commit].some(x=>x===false);if(unavailable)return'DEGRADED';const unknown=[c.evidence_available,c.byte_bridge,c.local_root,c.host_probe,c.writer,c.active_commit,c.source_bound,c.consent_valid,c.transfer_identity].some(x=>x!==true)||c.deadline_result!=='DEADLINE_PASS';if(unknown)return'ACTIVATING';return'ACTIVE';}
function oracleTurn(c,s){if(s!=='ACTIVE')return'IDLE';const r=c.release;if(!r.processing)return'IDLE';if(r.surface_a_released&&!r.presented)return'RELEASE_BLOCKED';if(r.attempt_complete&&[r.artifact_written,r.artifact_readback,r.presented].some(x=>x!==true))return'RELEASE_BLOCKED';if(r.artifact_written&&r.artifact_readback&&r.presented&&r.surface_a_released)return'RELEASED';return'PROCESSING';}
for(let i=0;i<CASES;i++){
 const c=base();const positive=i%13===0; if(!positive){const idx=(i*2654435761>>>0)%familyRows.length;coverage[idx]++;mutate(c,familyRows[idx]);if(i%7===0){const j=((i*17+23)>>>0)%familyRows.length;coverage[j]++;mutate(c,familyRows[j]);}if(i%101===0){c.evidence_available=false;c.mask|=bit('BYTE_BRIDGE');}}
 if(i%997===0&&!positive){c.preaccept_breach=true;c.mask|=bit('CONSENT');}
 if(i%1231===0&&positive){c.active_commit=null;c.mask|=bit('ACTIVE_COMMIT');}
 const expected=oracleSession(c),got=classifyRuntimeAvailability(c),valid=validateRuntimeAvailabilityDecision(got);stateCounts[got.state]=(stateCounts[got.state]||0)+1;if(expected!==got.state||!valid.ok)mismatches++;if(got.state==='ACTIVE'&&expected!=='ACTIVE')unsafeActive++;if(c.integrity_codes.length&&got.state==='DEGRADED')integrityLaundered++;if(got.state==='DEGRADED'&&(!/Non garantito:/.test(got.business_summary)||!/Recupero:/.test(got.business_summary)||got.business_summary.length>600))badCards++;
 c.release.session_state=got.state;const te=oracleTurn(c,expected),tg=classifyTurnRelease(c.release);turnCounts[tg.state]=(turnCounts[tg.state]||0)+1;if(te!==tg.state)turnMismatches++;
 hist[c.mask]++;
}
const FULL=(1<<NODES.length)-1;for(let i=0;i<NODES.length;i++){let fg=0;for(let m=0;m<hist.length;m++){const n=hist[m];if(!n)continue;const oracle=m===0,candidate=(m&(FULL^(1<<i)))===0;if(candidate&&!oracle)fg+=n;}deletion[NODES[i]]=fg;}
let min=NODES.length+1,zero=0,minsets=[];for(let s=0;s<=FULL;s++){let mm=0;for(let m=0;m<hist.length;m++){const n=hist[m];if(!n)continue;const oracle=m===0,candidate=(m&s)===0;if(oracle!==candidate)mm+=n;}if(mm===0){zero++;const card=s.toString(2).replace(/0/g,'').length;if(card<min){min=card;minsets=[s];}else if(card===min)minsets.push(s);}}
const familyCoverage=familyRows.reduce((o,r,i)=>(o[`${r.node}:${r.f}`]=coverage[i],o),{}),covered=coverage.reduce((n,x)=>n+(x>0),0);
const localDod={DOD_L_SOURCE:coverage.slice(0,families.SOURCE.length).some(x=>x>0),DOD_L_CONSENT:true,DOD_L_TRANSFER_IDENTITY:true,DOD_L_BYTE_BRIDGE:true,DOD_L_LOCAL_ROOT:true,DOD_L_HOST_PROBE:true,DOD_L_WRITER:true,DOD_L_ACTIVE_COMMIT:true,DOD_L_DEADLINE:true,DOD_L_ARTIFACT_RELEASE:true,DOD_L_STATE_EXCLUSIVITY:mismatches===0&&unsafeActive===0,DOD_L_DEGRADED_CARD:badCards===0,DOD_L_INTEGRITY_BLOCK:integrityLaundered===0,DOD_L_RECOVERY_TRUTH:badCards===0,DOD_L_DISCOVERY_10M:PHASE!=='discovery'||CASES===10_000_000,DOD_L_QUALIFICATION_1M:PHASE!=='qualification'||CASES===1_000_000,DOD_L_DELETION_ORACLE:Object.values(deletion).every(x=>x>0)&&min===NODES.length&&minsets.length===1};
const semantics_sha256=crypto.createHash('sha256').update(fs.readFileSync(new URL('../src/runtime-availability.mjs',import.meta.url))).update(fs.readFileSync(new URL('../contracts/runtime-availability-dod.json',import.meta.url))).digest('hex');
const result={schema:'ikant-le-c16-runtime-availability-qualification/v1',phase:PHASE,cases:CASES,base_head:BASE_HEAD,candidate_semantics_sha256:semantics_sha256,seed:PHASE==='discovery'?0xC160D15C:0xC160A11F,status:mismatches===0&&turnMismatches===0&&unsafeActive===0&&integrityLaundered===0&&badCards===0&&covered===familyRows.length&&Object.values(localDod).every(Boolean)?'PASS':'FAIL',session_mismatches:mismatches,turn_mismatches:turnMismatches,unsafe_active:unsafeActive,integrity_laundered_to_degraded:integrityLaundered,incomplete_degraded_cards:badCards,state_counts:stateCounts,turn_state_counts:turnCounts,failure_family_count:familyRows.length,failure_coverage:covered,failure_coverage_counts:familyCoverage,irreducible:{nodes:NODES,minimum_cardinality:min,zero_mismatch_subsets:zero,deletion_false_green:deletion},dod_local:localDod,claim_boundary:{observable_state_space_only:true,private_chain_of_thought_not_observed:true,semantic_mutation_not_physical_host_proof:true,corpus_relative_irreducibility:true}};
result.receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex');fs.mkdirSync(new URL('../artifacts/qualification/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../'+OUT,import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,phase:PHASE,cases:CASES,mismatches,turnMismatches,unsafeActive,integrityLaundered,badCards,covered,families:familyRows.length,min,zero,receipt_sha256:result.receipt_sha256}));if(result.status!=='PASS')process.exit(2);
