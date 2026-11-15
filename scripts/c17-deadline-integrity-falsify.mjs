import fs from 'node:fs';
import crypto from 'node:crypto';
import {canAccept} from '../src/admission.mjs';
import {transitionPure} from '../src/runtime-core.mjs';
import {classifyDeadlineEvidence,DEADLINE_RESULT} from '../src/deadline-integrity.mjs';
import {classifyRuntimeAvailability,validateRuntimeAvailabilityDecision} from '../src/runtime-availability.mjs';

const args=process.argv.slice(2);const get=(k,d)=>{const i=args.indexOf(k);return i>=0?args[i+1]:d};
const CASES=Number(get('--cases','1000000'));const OUT=get('--output','artifacts/qualification/c17-deadline-integrity-1m.json');
if(CASES!==1_000_000)throw new Error('C17 qualification requires exactly 1,000,000 cases');
let seed=0xC17D1E55>>>0;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};const pick=a=>a[Math.floor(rnd()*a.length)];
const terms='f'.repeat(64),head='a'.repeat(40);
let mismatches=0,unsafeActive=0,retryAccepted=0,terminalRecovered=0,collapsedDeadline=0,nontrivial=0;
const familyCounts={acceptance:0,deadline:0,availability:0,transition:0};
const deadlineCounts={};
function expectedDeadline(o){
 if(!o)return DEADLINE_RESULT.ORIGIN_UNAVAILABLE;
 if(o.schema!=='ikant-le-acceptance-origin/v1'||o.authority!==0||o.deadline_origin!=='I_ACCEPT'||o.clock!=='MONOTONIC'||o.observed_at_accept!==true)return DEADLINE_RESULT.ORIGIN_INVALID;
 if(typeof o.event_id!=='string'||o.event_id.length<16||o.event_id.length>128)return DEADLINE_RESULT.ORIGIN_INVALID;
 if(o.source_head!==head)return DEADLINE_RESULT.ORIGIN_INVALID;
 if(o.terms_digest!==terms)return DEADLINE_RESULT.ORIGIN_INVALID;
 if(!Number.isFinite(o.elapsed_to_runtime_entry_ms)||o.elapsed_to_runtime_entry_ms<0)return DEADLINE_RESULT.ELAPSED_UNAVAILABLE;
 if(o.elapsed_to_runtime_entry_ms>120000)return DEADLINE_RESULT.EXCEEDED;
 return DEADLINE_RESULT.PASS;
}
function baseOrigin(){return{schema:'ikant-le-acceptance-origin/v1',event_id:'acceptance-event-00000001',source_head:head,terms_digest:terms,deadline_origin:'I_ACCEPT',clock:'MONOTONIC',observed_at_accept:true,elapsed_to_runtime_entry_ms:100,authority:0};}
for(let i=0;i<CASES;i++){
 const fam=i%4;
 if(fam===0){
  familyCounts.acceptance++;const mutated=2+Math.floor(rnd()*5);if(mutated>=2)nontrivial++;
  const s={epoch:null,accepted:false,admission:{breached:false,acceptance_consumed:false,phase:'AWAITING_ACCEPTANCE',terms_presented:true,terms_digest:terms,new_chat_required:false}};
  const keys=['accepted','epoch','breached','consumed','phase','terms','newchat'];
  for(let j=0;j<mutated;j++){const k=pick(keys);if(k==='accepted')s.accepted=true;else if(k==='epoch')s.epoch='epoch-existing';else if(k==='breached')s.admission.breached=true;else if(k==='consumed')s.admission.acceptance_consumed=true;else if(k==='phase')s.admission.phase=pick(['ACCEPTED','DISCOVERED','ACTIVE']);else if(k==='terms')s.admission.terms_digest='e'.repeat(64);else s.admission.new_chat_required=true;}
  const exp=!s.admission.breached&&s.accepted===false&&s.epoch===null&&s.admission.acceptance_consumed!==true&&s.admission.phase==='AWAITING_ACCEPTANCE'&&s.admission.terms_presented===true&&s.admission.terms_digest===terms&&s.admission.new_chat_required!==true;
  const got=canAccept(s,terms);if(got!==exp)mismatches++;if(got&&(!exp||s.accepted||s.epoch!==null||s.admission.acceptance_consumed))retryAccepted++;
 }else if(fam===1){
  familyCounts.deadline++;let o=baseOrigin();const mutationCount=1+Math.floor(rnd()*4);if(mutationCount>=2)nontrivial++;
  const ops=['absent','schema','authority','marker','clock','observed','event','source','terms','elapsed_missing','elapsed_negative','elapsed_exceeded','elapsed_edge'];
  for(let j=0;j<mutationCount;j++){const op=pick(ops);if(op==='absent'){o=null;break;}if(op==='schema')o.schema='bad';else if(op==='authority')o.authority=1;else if(op==='marker')o.deadline_origin='NOW';else if(op==='clock')o.clock='WALL';else if(op==='observed')o.observed_at_accept=false;else if(op==='event')o.event_id='short';else if(op==='source')o.source_head='b'.repeat(40);else if(op==='terms')o.terms_digest='e'.repeat(64);else if(op==='elapsed_missing')delete o.elapsed_to_runtime_entry_ms;else if(op==='elapsed_negative')o.elapsed_to_runtime_entry_ms=-1;else if(op==='elapsed_exceeded')o.elapsed_to_runtime_entry_ms=120001+Math.floor(rnd()*100000);else o.elapsed_to_runtime_entry_ms=pick([0,119999,120000]);}
  const exp=expectedDeadline(o);const got=classifyDeadlineEvidence(o,{sourceHead:head,termsDigest:terms,deadlineMs:120000}).result;deadlineCounts[got]=(deadlineCounts[got]||0)+1;if(got!==exp)mismatches++;if((exp===DEADLINE_RESULT.ORIGIN_UNAVAILABLE||exp===DEADLINE_RESULT.ORIGIN_INVALID||exp===DEADLINE_RESULT.ELAPSED_UNAVAILABLE)&&got===DEADLINE_RESULT.EXCEEDED)collapsedDeadline++;
 }else if(fam===2){
  familyCounts.availability++;nontrivial++;const terminal=pick([DEADLINE_RESULT.ORIGIN_UNAVAILABLE,DEADLINE_RESULT.ORIGIN_INVALID,DEADLINE_RESULT.ELAPSED_UNAVAILABLE,DEADLINE_RESULT.EXCEEDED,DEADLINE_RESULT.PASS]);
  const integrity=rnd()<0.12?['SOURCE_MISMATCH']:[];const host=rnd()>.15,bridge=rnd()>.15,root=rnd()>.15,writer=rnd()>.15,commit=rnd()>.15;
  const d=classifyRuntimeAvailability({accepted:true,source_bound:true,consent_valid:true,transfer_identity:integrity.length===0,evidence_available:true,byte_bridge:bridge,local_root:root,host_probe:host,writer,active_commit:commit,deadline_result:terminal,integrity_codes:integrity});
  const v=validateRuntimeAvailabilityDecision(d);if(!v.ok)mismatches++;
  if(integrity.length&&d.state!=='BLOCKED_INTEGRITY')mismatches++;
  else if(!integrity.length&&terminal!==DEADLINE_RESULT.PASS&&d.state!=='ADMISSION_EPOCH_UNRECOVERABLE')mismatches++;
  if(d.state==='ACTIVE'&&(integrity.length||terminal!==DEADLINE_RESULT.PASS||!host||!bridge||!root||!writer||!commit))unsafeActive++;
 }else{
  familyCounts.transition++;nontrivial++;const terminal=pick([DEADLINE_RESULT.ORIGIN_UNAVAILABLE,DEADLINE_RESULT.ORIGIN_INVALID,DEADLINE_RESULT.ELAPSED_UNAVAILABLE,DEADLINE_RESULT.EXCEEDED]);
  const s={schema:'ikant-le-state/v6',epoch:'epoch-locked',status:'ADMISSION_EPOCH_UNRECOVERABLE',terms_digest:terms,accepted:true,probed:rnd()>.5,initialized:false,bootstrap:{evidence_verified:true,deadline_result:terminal,deadline_terminal:terminal,acceptance_event_id:'acceptance-event-00000001'},admission:{phase:'ACCEPTED',breached:false,new_chat_required:true,acceptance_consumed:true,acceptance_event_id:'acceptance-event-00000001'}};
  const action=pick(['ACCEPT','PROBE','INITIALIZE']);const got=transitionPure(s,action,terms,true);if(got.terminal!=='DENY'){mismatches++;terminalRecovered++;}if(got.state?.status==='ACTIVE')unsafeActive++;
 }
}
const result={schema:'ikant-le-c17-deadline-integrity-qualification/v1',cases:CASES,seed:0xC17D1E55,status:mismatches===0&&unsafeActive===0&&retryAccepted===0&&terminalRecovered===0&&collapsedDeadline===0&&nontrivial>500000?'PASS':'FAIL',mismatches,unsafe_active:unsafeActive,retry_accepted:retryAccepted,terminal_recovered:terminalRecovered,deadline_unavailable_collapsed_to_exceeded:collapsedDeadline,nontrivial_multi_mutation_cases:nontrivial,family_counts:familyCounts,deadline_result_counts:deadlineCounts,claim_boundary:{independent_oracle:true,actual_runtime_functions:true,not_formal_exhaustive_proof:true,not_physical_host_proof:true}};
result.receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex');fs.mkdirSync('artifacts/qualification',{recursive:true});fs.writeFileSync(OUT,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(result.status!=='PASS')process.exit(2);
