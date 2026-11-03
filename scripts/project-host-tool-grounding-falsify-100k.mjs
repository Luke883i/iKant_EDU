#!/usr/bin/env node
/** R2 HOST grounding: 100,000 deterministic local-planner scenarios, NOT LLM trials. */
import {createHash} from 'node:crypto';
import {planHostToolGrounding,validateGroundingMap} from '../host/project-host-tool-grounding.mjs';
const N=100000,seed=0x71a2c72e,sha='a'.repeat(40),other='b'.repeat(40);
const five=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const witness={source_head:sha,host_link_displayed:true,distinct_human_message_observed:true,
 terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+sha+'/TERMS.md',
 pinned_blob_shas:Object.fromEntries(five.map(x=>[x,other]))};
const base=()=>({phase:'POST_ACCEPT',humanMessage:'I ACCEPT',freshHumanTurn:true,
 ownerOutcome:'NOT_INVOKED',sourceHead:sha,liveHead:sha,priorTurnEvidence:witness});
const faults=['PRECONSENT','NOT_EXACT_ACCEPT','NOT_FRESH','OWNER_UNKNOWN','STALE_HEAD',
 'HEAD_MISSING','WITNESS_MISSING','TERMS_FAKE','PIN_MISSING','CONSENT_NOT_DISTINCT',
 'HOST_ALREADY_INVOKED','FAKE_SOURCE_READY','FAKE_TOOL_INSTALLED','NODE_DNS_FAILED',
 'SOURCE_8_DISCOVERED','SOURCE_PARTIAL','LZ77_PROPOSED','WEB_SEARCH_SUBSTITUTED',
 'FAKE_RECEIPT','FALSE_BRIDGE_OBSERVATION'];
if(faults.length!==20)throw Error('FAULT_FAMILY_DRIFT');
function mutate(q,j){
 switch(j){
 case 0:q.phase='ORIENTATION';break;
 case 1:q.humanMessage='I accept';break;
 case 2:q.freshHumanTurn=false;break;
 case 3:q.ownerOutcome='UNKNOWN';break;
 case 4:q.liveHead=other;break;
 case 5:q.sourceHead=null;break;
 case 6:q.priorTurnEvidence=null;break;
 case 7:q.priorTurnEvidence={...witness,terms_link:'https://example.net/terms'};break;
 case 8:q.priorTurnEvidence={...witness,pinned_blob_shas:{...witness.pinned_blob_shas,'README.md':'invalid'}};break;
 case 9:q.priorTurnEvidence={...witness,distinct_human_message_observed:false};break;
 case 10:q.ownerOutcome='INVOKED';break;
 default:
  q.claimed={type:faults[j],ready:true,original_receipt:true,provider_attested:true,
   tool_installed:true,source_origin_attested:true};
 }
}
const hard=new Set([0,1,2,3,4,5,6,7,8,9,10]);
let positives=0,stops=0,unexpected=0,privileged=0,unique=0;const seen=new Set();
const dig=createHash('sha256'),byFault=Object.fromEntries(faults.map(x=>[x,0]));
validateGroundingMap();
for(let i=0;i<N;i++){
 const state=(Math.imul(i,0x9e3779b1)+seed)&0x1ffff;
 if(seen.has(state))throw Error('DUPLICATE_SEED_STATE');seen.add(state);unique++;
 const family=i%20,forcePositive=(i%101===0),q=base();
 if(!forcePositive)mutate(q,family);
 const r=planHostToolGrounding(q);
 const expectStop=!forcePositive&&hard.has(family);
 if((r.kind==='STOP')!==expectStop)unexpected++;
 if(expectStop){stops++;byFault[faults[family]]++;}
 else positives++;
 if(r.original_owner_invoked!==false||r.source_origin_attested!==false||
    r.provider_attested!==false||r.bridge_attested!==false||r.runtime_started!==false||
    r.active!==false||!['STOP','PROBE_REQUIRED'].includes(r.kind))privileged++;
 dig.update(i+'|'+state+'|'+family+'|'+r.kind+'|'+r.first_edge+'\n');
}
const report={schema:'ikant-host-tool-grounding-100k/v1',seed:'0x'+seed.toString(16),
 cases:N,unique_states:unique,families:faults.length,model_positive_probe_only:positives,
 model_stopped:stops,unexpected,privileged_promotions:privileged,byFault,
 trace_sha256:dig.digest('hex'),field_host_transfer_attested:false,
 actual_c72_invocations:0,native_delivery_attested:false,release:'PRODUCT_NO_GO'};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(unexpected||privileged||unique!==N||stops===0||positives===0)process.exitCode=1;
