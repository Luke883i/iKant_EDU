#!/usr/bin/env node
/** Finite 1000 contract candidates + 1,000,000 pre-owner mutations.
 * Not 1,000,000 C72 executions or empirical ChatGPT host success rates. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {H1_SCHEMA,validateH1Gate} from '../host/project-edu-h1-bound-port.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const contract=JSON.parse(fs.readFileSync(path.join(dir,'../contracts/project-edu-h1-irreducible.json'),'utf8'));
const transport=['PROMPT_ONLY','FIVE_FILE_CALLBACK','NODE_HTTPS_UNBOUND','HOST_PACKET_UNBOUND',
 'HOST_FILE_MANUAL','SAME_NODE_BOUND_READWRITE','ZIP_HUMAN','MCP_UNINSTALLED','APP_UI_ONLY','MULTISTEP_OPERATOR'];
const issuers=['LEGACY_C72V1','ALTERNATE_ISSUER','E16_WITHOUT_TRANSIT','ORIGINAL_E16_SINGLE_OWNER',
 'DIRECT_C135','FIVE_FILE_DIRECT','ZIP_DIRECT','C72_REPLAY','HOST_FAKE_RECEIPT','CONSENTLESS'];
const release=['CI_MEANS_PRODUCT','FLAGS_MEAN_NATIVE','SOURCE_MEANS_RUNTIME','ONE_TURN_IS_FULL',
 'PROMPT_MEANS_INSTALL','SINGLE_R_S_D_T_P_PROOF_LATTICE','C59_FROM_EDU','HOST_HTML_IS_NATIVE',
 'NO_OWNER_READBACK','NO_HUMAN_GATES'];
const issues=contract.historical_40_obligations;
if(issues.length!==40||new Set(issues.map(x=>x.id)).size!==40)throw Error('GOLD_40_INVALID');
const candidates=[];
for(let a=0;a<10;a++)for(let b=0;b<10;b++)for(let c=0;c<10;c++){
 const callable=a===5,original=b===3,truthful=c===5;
 const cutOk=cut=>({
  EXTERNAL_DEPLOYMENT_WITNESS_NOT_CI:truthful,
  ORIGINAL_HUMAN_TURN_AND_SOURCE_LOCK:original,
  ONE_EXECUTABLE_BOUND_EFFECT:callable,
  CALLBACK_AND_READBACK_SAME_NODE:callable,
  STERILE_COLD_SEED:original,
  PINNED_GIT_SHA_8PLUS1:original&&callable,
  ONE_ORIGINAL_C72_AND_PRIVATE_RECEIPT:original,
  SEPARATE_EDU_ORIGINAL_C135:original&&truthful,
  NATIVE_DELIVERY_SEPARATE:truthful,
  R_S_D_T_P_RELEASE_CLAIMS:truthful
 }[cut]===true);
 candidates.push({id:'H1-'+String(candidates.length).padStart(4,'0'),
  transport:transport[a],issuer:issuers[b],releasePolicy:release[c],
  covered:issues.filter(x=>cutOk(x.cut)).length,valid:callable&&original&&truthful});
}
if(candidates.length!==1000)throw Error('NOT_1000');
const selected=candidates.filter(x=>x.valid&&x.covered>=40);
if(selected.length!==1)throw Error('NOT_UNIQUE_IRREDUCIBLE');
const H='a'.repeat(40),TERM='https://github.com/Luke883i/iKant_EDU/blob/'+H+'/TERMS.md';
const SHAS=Object.fromEntries(['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'].map(x=>[x,'b'.repeat(40)]));
const fixture=()=>({schema:H1_SCHEMA,humanMessage:'I ACCEPT',freshHumanTurn:true,
 ownerOutcome:'NOT_INVOKED',sourceHead:H,
 priorTurnEvidence:{source_head:H,host_link_displayed:true,
  distinct_human_message_observed:true,terms_link:TERM,pinned_blob_shas:{...SHAS}}});
function oracle(q){
 if(q.schema!==H1_SCHEMA||q.humanMessage!=='I ACCEPT'||q.freshHumanTurn!==true)return 'H1_DISTINCT_ACCEPT_REQUIRED';
 if(q.ownerOutcome!=='NOT_INVOKED')return 'H1_OWNER_ATTEMPT_ALREADY_KNOWN_OR_UNKNOWN';
 const w=q.priorTurnEvidence;
 if(!w||!w.pinned_blob_shas||!/^[a-f0-9]{40}$/u.test(w.source_head||'')||
  w.host_link_displayed!==true||w.distinct_human_message_observed!==true||
  w.terms_link!=='https://github.com/Luke883i/iKant_EDU/blob/'+w.source_head+'/TERMS.md'||
  Object.keys(SHAS).some(p=>!/^[a-f0-9]{40}$/u.test(w.pinned_blob_shas[p]||'')))
  return 'H1_FIRST_TURN_WITNESS_INVALID';
 if(!/^[a-f0-9]{40}$/u.test(q.sourceHead||'')||q.sourceHead!==w.source_head)return 'STOP_SOURCE_LOCK_STALE';
 return null;
}
const families=['CLEAN','FIRST_TURN_NOT_SEPARATE','WRONG_CONSENT','OWNER_UNKNOWN','OWNER_FAILED',
 'SOURCE_HEAD_STALE','WITNESS_SHA_MISSING','WITNESS_TERMS_BAD','SOURCE_HEAD_NONHEX',
 'NO_FIRST_LINK','NO_HUMAN_ORIGIN_WITNESS','NO_REQUIRED_SCHEMA','DUPLICATE_OWNER',
 'ALTERED_PRIOR_HEAD','FIRST_TURN_WRONG_SHAS','NO_PROVIDED_WITNESS',
 'NEW_SHA_BUT_OLD_HEAD','CONSENT_EMBEDDED','READ_BEFORE_CONSENT','MODE_SAME_TURN',
 'UNKNOWN_WRITE','LEGACY_ACCEPT','CLAIM_ONLY','ONE_BLOB_ONLY','FULL_E16_LOCAL'];
let seed=0x31e16004;
function rnd(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;}
let mismatch=0,eligible=0,denied=0,naiveUnsafe=0;
const edges={},trace=createHash('sha256');
for(let n=0;n<1000000;n++){
 const f=n%25,q=fixture(),x=rnd();
 switch(f){
  case 1:q.freshHumanTurn=false;break;
  case 2:q.humanMessage='I accept';break;
  case 3:q.ownerOutcome='UNKNOWN';break;
  case 4:q.ownerOutcome='FAILED';break;
  case 5:q.sourceHead='c'.repeat(40);break;
  case 6:delete q.priorTurnEvidence.pinned_blob_shas['TERMS.md'];break;
  case 7:q.priorTurnEvidence.terms_link='https://example.com';break;
  case 8:q.sourceHead='not SHA';break;
  case 9:q.priorTurnEvidence.host_link_displayed=false;break;
  case 10:q.priorTurnEvidence.distinct_human_message_observed=false;break;
  case 11:q.schema='legacy/v1';break;
  case 12:q.ownerOutcome='SUCCEEDED';break;
  case 13:q.priorTurnEvidence.source_head='f'.repeat(40);break;
  case 14:q.priorTurnEvidence.pinned_blob_shas['README.md']='broken';break;
  case 15:q.priorTurnEvidence=null;break;
  case 16:q.sourceHead='e'.repeat(40);break;
  case 17:q.humanMessage='I ACCEPT EDU';break;
  case 18:q.freshHumanTurn=false;break;
  case 19:q.humanMessage='EDU';break;
  case 20:q.ownerOutcome='UNKNOWN';break;
  case 21:q.schema='ikant-legacy-c72/v1';break;
  case 22:q.priorTurnEvidence.host_link_displayed=1;break;
  case 23:q.priorTurnEvidence.pinned_blob_shas['ADMISSION.json']='';break;
 }
 if(x%101===0&&f!==0&&f!==24)q.ownerOutcome='UNKNOWN';
 const expect=oracle(q),got=validateH1Gate(q);
 if(expect!==got)mismatch++;
 const key=got||'PREOWNER_ELIGIBLE';edges[key]=(edges[key]||0)+1;
 if(got)denied++;else eligible++;
 if(q.humanMessage.includes('ACCEPT')&&got)naiveUnsafe++;
 trace.update(n+'|'+families[f]+'|'+(got||'OK')+'\n');
}
const result={schema:'ikant-h1-semantic-qualification/v1',seed:'0x31e16004',
 candidates:1000,selected:selected[0],mapped_obligations:40,
 coverage_denominator:'normative mapping, not field outcomes',field_problems_resolved_by_simulation:0,
 mutated_cases:1000000,families:families.length,mismatches:mismatch,eligible_preowner:eligible,
 denied_preowner:denied,naive_promotions_denied:naiveUnsafe,by_first_edge:edges,
 trace_sha256:trace.digest('hex'),original_c72_calls:0};
console.log(JSON.stringify(result,null,2));
if(mismatch||selected[0].covered!==40)process.exitCode=1;
