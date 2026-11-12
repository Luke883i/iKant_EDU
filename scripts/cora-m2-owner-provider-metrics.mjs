#!/usr/bin/env node
/** M2 original-owner/provider METROLOGY ONLY. Cannot issue owner or provider receipts. */
import path from 'node:path';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateS3Profile} from './cora-s3-convergence.mjs';
import {qualifyRegisteredC72SourceEpoch} from './v5b-repository-governance-audit.mjs';
import {validateFContract} from './cora-pr-f-qualification.mjs';
import {observeM1Source} from './cora-m1-shared-evidence.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE='e8a49c2b1a6ffcff15380518d166b8b55ee890a4';
const TREE='889543abff995f9fcdae1d6ac3903c5b80484cdf';
const PINS={"contracts/c72-public-mode-admission-v2.json":"0bdb99589d907072917ba31f2938c9b600f39a05","host/c72-public-mode-admission.mjs":"eec28e35a1066802edc905c7d61c1ecbcef0082d","host/c135-edu-v2-owner.mjs":"e8bbe5741375e5d51f1caa02fdba2ecc5f6c049d","host/c87-durable-ledger.mjs":"9d4fd4038bd7e109bdbc5e0441f9e9acf497c846","host/c125-output-port.mjs":"14760e40051b2bbe0c3a2ebc9347e125fdd7d65a","host/s03-owner-bound-presentation.mjs":"fbbe31b5265d3885fdd04140b6f7ac2a2ce91399","host/project-oneshell-edu.mjs":"ddafa388f93b6aa1664fbf4a1ce73ba59fb752e1","host/project-oneshell-continuous.mjs":"0355428b71ec4d6aa13ec4b81323ee1c9336b102"};
const NODES=[["M2S0","SOURCE",[]],["M2S1","SOURCE",["M2S0"]],["M2S2","SOURCE",["M2S0"]],["M2S3","SOURCE",["M2S0"]],["M2S4","SOURCE",["M2S0"]],["M2S5","SOURCE",["M2S0"]],["M2S6","SOURCE",["M2S0"]],["I_M2_SOURCE","INTERMEDIATE",["M2S0","M2S1","M2S2","M2S3","M2S4","M2S5","M2S6"]],["M2E1","EXTERNAL",["I_M2_SOURCE"]],["M2E2","EXTERNAL",["M2E1"]],["M2E3","EXTERNAL",["M2E2"]],["M2E4","EXTERNAL",["M2E3"]],["M2E5","EXTERNAL",["M2E4"]],["M2E6","EXTERNAL",["M2E5"]],["M2E7","EXTERNAL",["M2E3","M2E4","M2E5"]],["G_M2","GLOBAL",["I_M2_SOURCE","M2E6","M2E7"]]];
const METRICS=[["SRC_HEAD_TREE","M2S0","GIT","sha1_and_head_tree_exact",2,"SOURCE_GIT"],["SRC_M1_REUSE","M2S1","LOCAL","original_m1_reconciliation",1,"SOURCE_GIT"],["SRC_C72","M2S2","GIT","original_c72_and_contract_pins",2,"SOURCE_GIT"],["SRC_C135","M2S3","GIT","original_c135_pin",1,"SOURCE_GIT"],["SRC_C87","M2S4","GIT","original_c87_pin",1,"SOURCE_GIT"],["SRC_C125_S03","M2S5","GIT","original_c125_and_s03_pins",2,"SOURCE_GIT"],["SRC_DELEGATION","M2S6","GIT","oneshell_edu_and_continuous_pins",2,"SOURCE_GIT"],["HUMAN_ACCEPT","M2E1","OWNER","distinct_exact_accept_original_receipt_reopened",1,"NOT_ATTESTED"],["HUMAN_EDU","M2E2","OWNER","distinct_exact_edu_original_selection_reopened",1,"NOT_ATTESTED"],["COGNITIVE_TURN","M2E3","OWNER","original_c135_bound_language_turn",1,"NOT_ATTESTED"],["LEDGER_EVENT","M2E4","OWNER","single_writer_atomic_append_and_reopen",1,"NOT_ATTESTED"],["SAME_TURN_VOICE","M2E5","OWNER","owner_s03_byte_identity_and_c125_at_most_once",1,"NOT_ATTESTED"],["NATIVE_DELIVERY","M2E6","PROVIDER","native_delivery_identity_and_ack",1,"NOT_ATTESTED"],["NO_REPLAY","M2E7","OWNER","nonce_and_uncertain_send_no_retry_oracle",1,"NOT_ATTESTED"]];
const CHECKS=[["CK01","M2S0","Pinned current HEAD, TREE and original commit identity",false,"UNOBSERVED_UNTIL_INDEPENDENT_READBACK"],["CK02","M2S1","M1 original shared source evidence independently recomputed",false,"UNOBSERVED_UNTIL_INDEPENDENT_READBACK"],["CK03","M2S2","C72 owner, terms/EDU mode contract blobs unchanged",false,"UNOBSERVED_UNTIL_INDEPENDENT_READBACK"],["CK04","M2S3","Original C135 owner and source-bound runtime blob unchanged",false,"UNOBSERVED_UNTIL_INDEPENDENT_READBACK"],["CK05","M2S4","Original C87 ledger sole-writer and reopen source unchanged",false,"UNOBSERVED_UNTIL_INDEPENDENT_READBACK"],["CK06","M2S5","Original C125 output port and S03 same-turn source unchanged",false,"UNOBSERVED_UNTIL_INDEPENDENT_READBACK"],["CK07","M2S6","Original OneShell start and continuous delegation source unchanged",false,"UNOBSERVED_UNTIL_INDEPENDENT_READBACK"],["CK08","M2E1","Separate exact human I ACCEPT and original C72 ACCEPTED receipt reopened",true,"UNOBSERVED_UNTIL_INDEPENDENT_READBACK"],["CK09","M2E2","Distinct exact EDU event and owner mode selection receipt reopened",true,"UNOBSERVED_UNTIL_INDEPENDENT_READBACK"],["CK10","M2E3","Original C135 real turn output bound to event and languagePort",true,"UNOBSERVED_UNTIL_INDEPENDENT_READBACK"],["CK11","M2E4","Exactly one C87 event, nonce fence, private ledger reopened in distinct reader",true,"UNOBSERVED_UNTIL_INDEPENDENT_READBACK"],["CK12","M2E5","Same-turn original C125/S03 bytes with single send attempt or NO_VOICE",true,"UNOBSERVED_UNTIL_INDEPENDENT_READBACK"],["CK13","M2E6","Actual native provider identity, delivery and acknowledgment separately observed",true,"UNOBSERVED_UNTIL_INDEPENDENT_READBACK"],["CK14","M2E7","Replay and uncertain-write/send safety demonstrated with actual attempt fence",true,"UNOBSERVED_UNTIL_INDEPENDENT_READBACK"]];
const H40=/^[a-f0-9]{40}$/u;
const fail=edge=>({ok:false,first_edge:edge,authority:0,active:false,owner_invoked:false,
 original_receipt_issued:false,provider_attested:false,ledger_written:false,
 m2_complete:false,product_go:false,repository_standardized:false});
const git=(...args)=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8',timeout:30000,maxBuffer:5000000}).trim();
const data=(...args)=>execFileSync('git',args,{cwd:ROOT,timeout:30000,maxBuffer:5000000});
const hash=b=>createHash('sha1').update(Buffer.from('blob '+b.length+String.fromCharCode(0))).update(b).digest('hex');
/** A graph evaluator for logical counterexamples; it never promotes to a real event. */
export function validateM2Profile(p){
 if(!p||p.schema!=='ikant-host-cora-m2-owner-provider-metrics/v1'||
  p.authority!==0||p.owner!==false||p.active!==false||p.release!=='NO_GO'||
  p.source_status!=='SOURCE_ONLY_ORIGINAL_OWNERS_NOT_INVOKED'||
  p.source?.repository!=='Luke883i/iKant_EDU'||p.source?.base_head!==BASE||
  p.source?.base_tree!==TREE||
  p.source?.original_pr_f!=='contracts/cora-pr-f-integrated-qualification-v1.json'||
  p.source?.original_s3!=='contracts/cora-s3-source-convergence-v1.json'||
  p.source?.original_m1!=='scripts/cora-m1-shared-evidence.mjs'||
  p.source?.original_oneshell!=='host/project-oneshell-edu.mjs'||
  JSON.stringify(p.pinned_original_blobs)!==JSON.stringify(PINS)||
  p.abstract_dod?.logic!=='NON_COMPENSATORY_DAG_AND'||
  p.abstract_dod?.source_not_owner_receipt!==true||
  p.abstract_dod?.local_ledger_not_provider_persistence!==true||
  p.abstract_dod?.callback_not_native_delivery!==true||
  p.abstract_dod?.zero_native_receipt_minted!==true||
  p.abstract_dod?.unknown_not_pass!==true||
  JSON.stringify(p.metric_policy?.source_metric_states)!==JSON.stringify(['SOURCE_OBSERVED','SOURCE_BLOCKED'])||
  JSON.stringify(p.metric_policy?.external_metric_states)!==JSON.stringify(['NOT_ATTESTED'])||
  p.abstract_dod?.formula!=='M2_SOURCE_AND_DISTINCT_ORIGINAL_C72_ACCEPTED_AND_DISTINCT_EDU_SELECTED_AND_ORIGINAL_C135_EVENT_AND_ONE_C87_REOPENED_LEDGER_AND_C125_S03_SAME_TURN_AT_MOST_ONCE_AND_NATIVE_PROVIDER_DELIVERY_ACK_AND_REPLAY_FENCE'||
  p.metric_policy?.numeric_ratio_never_proves_field_success!==true||
  p.metric_policy?.source_coverage_is_not_m2_completion!==true||
  p.metric_policy?.finite_mutations_are_not_independent_trials!==true||
  p.metric_policy?.field_evidence_requires_original_receipts_and_independent_readback!==true||
  p.metric_policy?.provider_evidence_requires_native_authenticated_ack!==true||
  p.nonpromotion&&Object.values(p.nonpromotion).some(x=>x!==false)||
  !p.nonpromotion||p.not_a_receipt!==true||
  p.first_unclosed!=='M2E1_ORIGINAL_C72_RECEIPT_NOT_ATTESTED')
   return fail('M2_AUTHORITY_SOURCE_OR_POLICY_DRIFT');
 if(!Array.isArray(p.nodes)||p.nodes.length!==NODES.length||
  !Array.isArray(p.metrics)||p.metrics.length!==METRICS.length||
  !Array.isArray(p.checklist)||p.checklist.length!==CHECKS.length)
  return fail('M2_RETICULUM_METRIC_CHECKLIST_COUNT_DRIFT');
 const seen=new Set();
 for(let i=0;i<NODES.length;i++){
  const n=p.nodes[i],e=NODES[i];
  if(n?.id!==e[0]||n.scope!==e[1]||JSON.stringify(n.needs)!==JSON.stringify(e[2])||
   typeof n.proof!=='string'||n.proof.length<25||
   n.needs.some(x=>!seen.has(x))||seen.has(n.id))return fail('M2_DAG_ORIGINAL_DEPENDENCY_DRIFT');
  seen.add(n.id);
 }
 for(let i=0;i<METRICS.length;i++){
  const m=p.metrics[i],e=METRICS[i];
  if(JSON.stringify([m?.id,m?.node,m?.layer,m?.measure,m?.target,m?.default_state])!==JSON.stringify(e)||
   !seen.has(m.node)||Object.keys(m).length!==6)
   return fail('M2_MEASURE_METRIC_OR_AUTHORIZATION_DRIFT');
 }
 for(let i=0;i<CHECKS.length;i++){
  const c=p.checklist[i],e=CHECKS[i];
  if(JSON.stringify([c?.id,c?.node,c?.criterion,c?.external,c?.verdict])!==JSON.stringify(e)||
    Object.keys(c).length!==5)return fail('M2_CHECKLIST_REVIEW_STATUS_DRIFT');
 }
 return {ok:true,status:'M2_SCHEMA_VALID_NOT_RUNTIME',nodes:NODES.length,metrics:METRICS.length,
  checklist:CHECKS.length,authority:0,owner_invoked:false,provider_attested:false,m2_complete:false};
}
export function modelM2Cut(p,claims={}){
 const q=validateM2Profile(p);if(!q.ok)return q;
 const state={};
 for(const n of p.nodes){
  const deps=n.needs.every(x=>state[x]==='MODEL_TRUE');
  state[n.id]=n.scope==='INTERMEDIATE'||n.scope==='GLOBAL'?
   (deps?'MODEL_TRUE':'BLOCKED_DEPENDENCY'):
   claims[n.id]===true&&deps?'MODEL_TRUE':'UNKNOWN_OR_UNPROVEN';
 }
 return {ok:true,model_source:state.I_M2_SOURCE==='MODEL_TRUE',
  model_full:state.G_M2==='MODEL_TRUE',state,
  first_edge:p.nodes.find(x=>state[x.id]!=='MODEL_TRUE')?.id||'LOGICAL_ONLY_NOT_ORIGINAL_RECEIPT',
  authority:0,active:false,m2_complete:false,owner_invoked:false,provider_attested:false,
  ledger_written:false,voice_sent:false,original_receipt_issued:false,
  repository_standardized:false,product_go:false,permission_to_retry:false};
}
/** Prospective PR1 presentation-only change; immutable original pins retained. */
export function qualifyPr1OneShellPresentation({historicalBytes,observedBytes,observedSha1,registration}={}){
 const denied=edge=>({ok:false,first_edge:edge,authority:0,provider_attested:false,original_receipt_issued:false});
 if(!Buffer.isBuffer(historicalBytes)||!Buffer.isBuffer(observedBytes)||typeof observedSha1!=='string')
  return denied('PR1_M2_INVALID_BYTES');
 const old=historicalBytes.toString('utf8');
 const before="esito:'RISPOSTA EDU VERIFICATA',b:'Risposta originale iKant verificata: il suo valore dipende da utilita, limiti, decisione umana e riscontri; consegna nativa non attestata.'";
 const after="esito:'TURNO EDU TRACCIATO',b:'Integrita e readback del turno verificati localmente; verita fattuale della risposta NON valutata. Consegna nativa ChatGPT NON attestata.'";
 if(old.split(before).length!==2)return denied('PR1_M2_HISTORICAL_ANCHOR_MISMATCH');
 const candidate=Buffer.from(old.replace(before,after),'utf8');
 if(!candidate.equals(observedBytes)||hash(candidate)!==observedSha1)
  return denied('PR1_M2_UNAUTHORIZED_SOURCE_DELTA');
 const regPath='governance/changes/zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz-pr1-product-truth.json';
 const row=registration?.paths?.filter(x=>x.path==='host/project-oneshell-edu.mjs')||[];
 if(registration?.schema!=='ikant-v5b-change-extension/v1'||
   registration?.source_main!=='09798d194c1fc6a8557465b8d8875fd1972de940'||
   registration?.self_path!==regPath||registration?.release!=='NO_GO'||
   registration?.human_review_completed!==false||registration?.original_owner_unchanged!==true||
   registration?.native_provider_attested!==false||registration?.product_go!==false||
   row.length!==1||row[0].operation!=='MODIFY'||row[0].human_review!=='REVIEW_REQUIRED'||
   row[0].historical_git_blob_sha1!==hash(historicalBytes)||
   row[0].prospective_git_blob_sha1!==observedSha1)
  return denied('PR1_M2_SUCCESSOR_UNQUALIFIED');
 return {ok:true,status:'PR1_PRESENTATION_SOURCE_ONLY_REVIEW_REQUIRED',amended:true,
  review_attested:false,owner_invoked:false,provider_attested:false,authority:0};
}

/** Original Git source readback and M1 cross-check. External metrics are not injectable. */
export function observeM2Source(){
 try{
  const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
  if(!H40.test(head)||!H40.test(tree))return fail('M2_HEAD_TREE_INVALID');
  const p=JSON.parse(data('show',head+':contracts/cora-m2-owner-provider-metrics-v1.json').toString('utf8'));
  const valid=validateM2Profile(p);if(!valid.ok)return valid;
  const f=JSON.parse(data('show',head+':'+p.source.original_pr_f).toString('utf8'));
  const s3=JSON.parse(data('show',head+':'+p.source.original_s3).toString('utf8'));
  if(validateFContract(f).ok!==true||validateS3Profile(s3).ok!==true)
   return fail('M2_ORIGINAL_RETICULA_NOT_VALID');
  if(JSON.stringify(s3.owners)!==JSON.stringify(Object.fromEntries(
   Object.entries(PINS).filter(([k])=>['host/c72-public-mode-admission.mjs',
    'host/c135-edu-v2-owner.mjs','host/c87-durable-ledger.mjs',
    'host/c125-output-port.mjs'].includes(k)))))
   return fail('M2_ORIGINAL_OWNER_S3_PIN_MISMATCH');
  const observed={};
  for(const [fpath,expect] of Object.entries(PINS)){
   const b=data('show',head+':'+fpath);
   const sha=git('rev-parse',head+':'+fpath);
   let epoch=qualifyRegisteredC72SourceEpoch({
    path:fpath,historicalBlobSha1:expect,observedBlobSha1:sha});
   if(fpath==='host/project-oneshell-edu.mjs'&&sha!==expect){
    const regPath='governance/changes/zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz-pr1-product-truth.json';
    epoch=qualifyPr1OneShellPresentation({historicalBytes:data('cat-file','blob',expect),
     observedBytes:b,observedSha1:sha,registration:JSON.parse(data('show',head+':'+regPath).toString('utf8'))});
   }
   if(epoch.ok!==true||hash(b)!==sha)
    return fail('M2_ORIGINAL_OWNER_BLOB_CHANGED:'+fpath);
   observed[fpath]={sha1:sha,bytes:b.length,historical_sha1:expect,
    source_epoch_status:epoch.status,prospective_amendment:epoch.amended===true,
    review_attested:false,native_owner_receipt_attested:false};
  }
  const ownerM1=observeM1Source();
  if(ownerM1.ok!==true||ownerM1.status!=='M1_SHARED_SOURCE_EVIDENCE_CUT_ONLY'||
   ownerM1.head!==head||ownerM1.tree!==tree||
   ownerM1.repository_standardized!==false||ownerM1.m1_complete!==false)
   return fail('M2_ORIGINAL_M1_SOURCE_UNQUALIFIED');
  if(git('rev-parse','HEAD')!==head||git('rev-parse','HEAD^{tree}')!==tree)
   return fail('M2_HEAD_CHANGED_DURING_PROBE');
  const source={"M2S0":true,"M2S1":true,"M2S2":true,
   "M2S3":true,"M2S4":true,"M2S5":true,"M2S6":true};
  const reticulum=modelM2Cut(p,source);
  if(!reticulum.model_source||reticulum.model_full)return fail('M2_SOURCE_GRAPH_FAILED');
  const sourceMetrics=new Set(p.metrics.filter(m=>m.layer==='GIT'||m.layer==='LOCAL').map(m=>m.node));
  const metrics=p.metrics.map(m=>({id:m.id,node:m.node,layer:m.layer,
   numerator:sourceMetrics.has(m.node)?m.target:null,denominator:m.target,
   status:sourceMetrics.has(m.node)?'SOURCE_OBSERVED':'NOT_ATTESTED',
   claim:sourceMetrics.has(m.node)?'GIT_OR_SOURCE_ONLY':'NO_NATIVE_READBACK'}));
  const checklist=p.checklist.map(c=>({id:c.id,node:c.node,
   status:c.external?'NOT_ATTESTED':'SOURCE_OBSERVED',
   approval:'NOT_ATTESTED'}));
  return {ok:true,status:'M2_SOURCE_METROLOGY_ONLY_EXTERNAL_DOD_OPEN',
   source:{head,tree,base_head:BASE,base_tree:TREE,original_owner_blobs:observed,
    m1_source_sha256:ownerM1.evidence_digest_sha256},
   reticulum:{source_model:true,field_model:false,full_model:false,
    first_edge:p.first_unclosed},
   metrics,checklist,metrics_total:metrics.length,checklist_total:checklist.length,
   source_metric_count:metrics.filter(x=>x.status==='SOURCE_OBSERVED').length,
   external_metric_count:metrics.filter(x=>x.status==='NOT_ATTESTED').length,
   first_edge:p.first_unclosed,readback:'SOURCE_ONLY_NOT_ORIGINAL_RECEIPT',
   native_delivery:'NOT_ATTESTED',c87_owner_readback:'NOT_INVOKED',
   s03_same_turn:'NOT_ATTESTED',provider:'NOT_ATTESTED',
   authority:0,active:false,owner_invoked:false,original_receipt_issued:false,
   ledger_written:false,voice_sent:false,permission_to_retry:false,
   m2_complete:false,product_go:false,repository_standardized:false};
 }catch(e){return {...fail('M2_ORIGINAL_SOURCE_READBACK_UNKNOWN'),
  diagnostic:String(e?.message||e).slice(0,180)};}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('M2_UNKNOWN_ARGUMENTS');
 const r=observeM2Source();process.stdout.write(JSON.stringify(r,null,2)+'\n');
 if(!r.ok)process.exitCode=1;
}
