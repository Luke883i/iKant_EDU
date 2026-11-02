#!/usr/bin/env node
/** Repeatable 100k typed semantic failure states, NOT 100k LLM judgements or owner receipts. */
import {createHash} from 'node:crypto';
import {assessV5DProjection,v5dFixture} from '../host/project-v5d-oneshell-assurance.mjs';
export const SEED=0x5d202611;
let state=SEED;
const next=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0;};
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex');
const roles=['human','auditor','host integrator','operator','reviewer','maintainer','student','provider','CI','runtime'];
const contexts=['orientation','C72 receipt','C135 result','C87 readback','C125 output','S03 frame','evidence report','visual badge','mobile fallback','download'];
const faults=[
 ['owner_A_overwritten',(e,n)=>{e.projection.slots.A='Risposta iKant verificata '+n;}],
 ['owner_A_digest_forged',(e,n)=>{e.projection.slot_sha256.A=hash('other A '+n);}],
 ['host_B_paraphrased',(e,n)=>{e.projection.view.B='Sintesi interpretativa '+n;}],
 ['proof_summarized_without_report',(e,n)=>{e.projection.view.PROVA='Proof verified '+n;}],
 ['edge_hidden',(e)=>{e.projection.view.EDGE='';}],
 ['next_fake_action',(e,n)=>{e.projection.view.NEXT='CLICK TO ACTIVATE '+n;}],
 ['false_active_status',(e)=>{e.projection.render_plan.active=true;}],
 ['native_ui_claim',(e)=>{e.projection.native_ui_attested=true;}],
 ['provider_delivery_claim',(e)=>{e.projection.provider_delivery_attested=true;}],
 ['widget_persistence_claim',(e)=>{e.projection.persistent_ui_attested=true;}],
 ['brand_registration_claim',(e)=>{e.projection.render_plan.brand.native_avatar_attested=true;}],
 ['fake_owner_voice_origin',(e)=>{e.projection.voice_origin='HOST_BOUND_LOCAL';}],
 ['fake_C125_voice_sha',(e,n)=>{e.projection.original_voice_sha256=hash('forged C125 '+n);}],
 ['A_truncation_policy',(e)=>{e.projection.render_plan.compression.A='ELLIPSIS';}],
 ['B_synthetic_compression',(e)=>{e.projection.render_plan.compression.B='LLM_SUMMARY';}],
 ['slot_reordering',(e)=>{e.projection.render_plan.order.reverse();}],
 ['fabricated_report_reopen',(e,n)=>{e.projection.report={sha256:hash('report '+n),bytes:32,status:'UNVERIFIED',download_link_attested:true};}],
 ['markdown_host_injection',(e,n)=>{e.projection.markdown_fallback_utf8+='\n### ACTIVE '+n; e.projection.markdown_sha256=hash(e.projection.markdown_fallback_utf8);}],
 ['clickable_activation_button',(e,n)=>{e.projection.verified_host_html_utf8+='<button onclick="start()">Activate '+n+'</button>'; e.projection.verified_host_html_sha256=hash(e.projection.verified_host_html_utf8);}],
 ['html_invents_slot_content',(e,n)=>{e.projection.verified_host_html_utf8=e.projection.verified_host_html_utf8.replace('NO_VOICE','Voice delivered '+n); e.projection.verified_host_html_sha256=hash(e.projection.verified_host_html_utf8);}]
];
const stream=createHash('sha256');const counts=Object.fromEntries(faults.map(([k])=>[k,0]));
let rejected=0,unsafe_admitted=0,positive_controls=0,positive_stopped=0;
for(let i=0;i<100000;i++){
 const [family,alter]=faults[i%faults.length],nonce=next();
 const scenario={i,family,actor:roles[next()%roles.length],context:contexts[next()%contexts.length],nonce};
 const sample=structuredClone(v5dFixture({html:i%faults.length>=18,large:(i&1)===0}));
 alter(sample,nonce);stream.update(JSON.stringify(scenario)+'\n');
 const outcome=assessV5DProjection(sample);
 if(outcome.ok)unsafe_admitted++;else{rejected++;counts[family]++;}
 if(i%10===0){
  const safe=v5dFixture({html:(next()&1)===1,large:(next()&1)===1});
  const a=assessV5DProjection(safe);
  if(a.ok&&a.global_dod_attested===false&&a.product_release==='PRODUCT_NO_GO'&&a.provider_delivery_attested===false)
   positive_controls++;
  else positive_stopped++;
 }
}
if(unsafe_admitted||rejected!==100000||positive_controls!==10000||positive_stopped||
  Object.values(counts).some(n=>n!==5000))throw Error('V5D_MUTATION_CAMPAIGN_FAILED');
process.stdout.write(JSON.stringify({schema:'ikant-v5d-typed-semantic-falsification/v1',
 seed:'0x5d202611',cases:100000,families:faults.length,scenarios_sha256:stream.digest('hex'),
 negative_rejected:rejected,unsafe_admitted,positive_controls,positive_stopped,
 counts,method:'20_SEEDED_TYPED_SEMANTIC_FAULT_FAMILIES_X_5000_WITH_10000_SAFE_CONTROLS; NOT_LLM_OR_PROVIDER_PROOF',
 owner_invocations:0,provider_attested:false,global_dod_attested:false,product_release:'PRODUCT_NO_GO'},null,2)+'\n');
