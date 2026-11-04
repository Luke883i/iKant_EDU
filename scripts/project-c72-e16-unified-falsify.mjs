#!/usr/bin/env node
/** Seeded, indexed mutations of the real E16 policy boundary, NOT C72/model/provider sessions.
 * Supports immutable 1m indexed batches, independent digest/replay and a full 10m campaign.
 */
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {planC72ProjectE16Ingress,E16_INGRESS_SCHEMA} from '../host/project-c72-e16-unified-ingress.mjs';
import {C72_COLDSTART_FILES} from '../host/project-c72-coldstart-seed.mjs';
const MAX=10000000,START=Number(process.env.E16_START??0),N=Number(process.env.E16_CASES??1000000);
if(!Number.isSafeInteger(START)||START<0||!Number.isSafeInteger(N)||N<1||START+N>MAX)throw Error('E16_SEED_RANGE_INVALID');
const SHA='b'.repeat(40),packet=C72_COLDSTART_FILES.map(p=>({path:p,contentBase64:'YQ=='}));
const anchor=0x20261030,hash=createHash('sha256'),families=Array.from({length:32},(_,j)=>({family:j,executed:0,ready:0,stop:0,probe:0,mismatches:0}));
let mismatches=0,first=null,metamorphic=0;
function mix(x){x=(x^anchor)>>>0;x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return(x^(x>>>16))>>>0;}
function frame(i){
 const u=mix(i),h=u.toString(16).padStart(8,'0').repeat(5),w={source_head:h,
  host_link_displayed:true,distinct_human_message_observed:true,
  terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+h+'/TERMS.md',
  pinned_blob_shas:Object.fromEntries(C72_COLDSTART_FILES.slice(0,5).map(p=>[p,SHA]))};
 const q={schema:E16_INGRESS_SCHEMA,phase:'POST_ACCEPT',projectProfile:'PROJECT_EDU_E15',
  humanMessage:'I ACCEPT',freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',sourceHead:h,liveHead:h,
  node:'AVAILABLE',githubApi:'AVAILABLE',carriers:{CALLBACKS:'UNKNOWN',NODE_HTTPS:'UNKNOWN',HOST_PACKET:'OBSERVED',HOST_FILE:'UNKNOWN'},
  priorTurnEvidence:w,sourcePacket:packet,transitDirectory:'/tmp/e16-campaign',
  expectedBlobShas:Object.fromEntries(C72_COLDSTART_FILES.map(p=>[p,SHA]))};
 return {q,u,w,h};
}
for(let i=START;i<START+N;i++){
 const f=i%32,{q,u,w}=frame(i);let want='READY',via='HOST_PACKET';
 switch(f){
 case 0:break;
 case 1:q.sourcePacket=undefined;q.stageDirectory='/tmp/e16-campaign';q.carriers={...q.carriers,HOST_PACKET:'UNKNOWN',HOST_FILE:'OBSERVED'};via='HOST_FILE';break;
 case 2:q.networkObservation={runtimeEpoch:'epoch1',nodeDns:{status:'FAILED_OBSERVED',host:'api.github.com',epoch:'epoch1'}};q.carriers.NODE_HTTPS='OBSERVED';break;
 case 3:q.sourcePacket=undefined;q.carriers.HOST_PACKET='UNKNOWN';q.carriers.NODE_HTTPS='OBSERVED';want='STOP';break;
 case 4:q.sourcePacket=undefined;q.carriers.HOST_PACKET='UNKNOWN';q.carriers.CALLBACKS='OBSERVED';want='STOP';break;
 case 5:q.ownerOutcome='UNKNOWN';want='STOP';break;
 case 6:q.liveHead='c'.repeat(40);want='STOP';break;
 case 7:q.humanMessage='EDU';want='STOP';break;
 case 8:q.sourcePacket=undefined;want='STOP';break;
 case 9:q.carriers.HOST_PACKET='CALLABLE_UNTESTED';want='PROBE';break;
 case 10:q.sourcePacket=undefined;q.stageDirectory='/tmp/e16-campaign';q.carriers.HOST_FILE='OBSERVED';via='HOST_FILE';break;
 case 11:q.priorTurnEvidence={...w,pinned_blob_shas:{...w.pinned_blob_shas,'TERMS.md':'invalid'}};want='STOP';break;
 case 12:q.priorTurnEvidence={...w,host_link_displayed:false};want='STOP';break;
 case 13:q.priorTurnEvidence={...w,terms_link:'https://fake.invalid/terms'};want='STOP';break;
 case 14:q.githubApi='UNKNOWN';want='STOP';break;
 case 15:q.node='UNKNOWN';want='STOP';break;
 case 16:q.carriers.HOST_PACKET='BAD';want='STOP';break;
 case 17:q.sourceHead='bad';want='STOP';break;
 case 18:q.carriers.HOST_FILE='OBSERVED';q.stageDirectory='/tmp/e16-campaign';break;
 case 19:q.projectProfile='LEGACY';want='STOP';break;
 case 20:q.phase='ORIENTATION';want='STOP';break;
 case 21:q.freshHumanTurn=false;want='STOP';break;
 case 22:q.ownerOutcome='FAILED';want='STOP';break;
 case 23:q.schema='WRONG';want='STOP';break;
 case 24:q.networkObservation={nodeDns:{status:'FAILED_OBSERVED'},runtimeEpoch:'epoch1'};break;
 case 25:q.networkObservation={runtimeEpoch:'epoch1',nodeDns:{status:'FAILED_OBSERVED',host:'api.github.com',epoch:'epoch1'}};break;
 case 26:q.carriers.HOST_PACKET='UNKNOWN';want='STOP';break;
 case 27:q.carriers.HOST_PACKET='CALLABLE_UNTESTED';q.carriers.NODE_HTTPS='OBSERVED';want='PROBE';break;
 case 28:q.sourcePacket=[];q.carriers.HOST_PACKET='CALLABLE_UNTESTED';want='PROBE';break;
 case 29:q.sourceHead='c'.repeat(40);want='STOP';break;
 case 30:q.priorTurnEvidence={...w,distinct_human_message_observed:false};want='STOP';break;
 case 31:q.carriers.NODE_HTTPS='OBSERVED';q.stageDirectory='/tmp/e16-campaign';q.carriers.HOST_FILE='OBSERVED';break;
 }
 if((u&31)===3&&f===0){q.networkObservation={runtimeEpoch:'A',nodeDns:{status:'FAILED_OBSERVED',host:'api.github.com',epoch:'A'}};metamorphic++;}
 if((u&31)===7&&f===1){q.carriers.NODE_HTTPS='OBSERVED';metamorphic++;}
 const a=planC72ProjectE16Ingress(q),r=families[f];r.executed++;
 if(a.kind==='READY')r.ready++;else if(a.kind==='PROBE')r.probe++;else r.stop++;
 const consistent=a.kind===want&&(a.kind!=='READY'||a.carrier===via)&&
  a.authority===0&&a.active===false&&a.original_owner_invoked===false&&
  a.native_event_attested===false&&a.native_delivery_attested===false;
 if(!consistent){mismatches++;r.mismatches++;if(first===null)first={index:i,f,want,via,got:a};}
 hash.update(i+'|'+f+'|'+a.kind+'|'+(a.carrier??'-')+'|'+(a.edge??'-')+'\n');
}
const report={schema:'ikant-e16-unified-host-boundary-10m/v1',seed:'0x20261030',start:START,cases:N,
 end_exclusive:START+N,original_function_calls:{chooseC72HostTransport:'via_policy',screenC72HostIngress:'via_policy',executeC72Coldstart:0},
 physically_observed_real_c72_calls:0,provider_calls:0,synthetic_scenarios_only:true,
 semantic_language_completeness_attested:false,native_delivery_attested:false,product_go:false,
 metamorphic_cases:metamorphic,assertions:N*7,mismatches,first_mismatch:first,
 families,sequence_sha256:hash.digest('hex')};
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({start:START,cases:N,mismatches,metamorphic,sequence_sha256:report.sequence_sha256}));
if(mismatches)process.exitCode=1;
