#!/usr/bin/env node
/** One million deterministic structural variations, not model/provider calls. */
import {createHash} from 'node:crypto';
import {adjudicateE15,E15_PROFILE,E15_STAGES} from '../host/project-oneshell-irred-e15.mjs';
const seed=0xE1502026,N=1000000,H='a'.repeat(40),OTHER='b'.repeat(40);
const trace=createHash('sha256');let pass=0,reject=0,errors=0,first=null;
let state=seed>>>0;
const bound={ACCEPT:4,EDU:5,MATERIALIZED:6,READY:7,TURN:10,RECOVERED:11,DELIVERED:13};
const keys=['orientationWitness','transitReadback','originalAccepted','originalEduMode',
 'sourceTreeBlobReadback','originalC135','originalC87Readback','originalC125S03',
 'sixSlotsOriginal','workerLossFence','verifiedLogoOrTextFallback','hostDeliveryObserved'];
function oracle(stage,mask,headOk){
 if(!headOk)return 'STOP_SOURCE_LOCK_STALE';
 const edges=['','E15_ORIENTATION_WITNESS_REQUIRED','E15_ORIGINAL_C72_TRANSIT_REQUIRED',
 'E15_ORIGINAL_ACCEPTANCE_READBACK_REQUIRED','E15_ORIGINAL_MODE_READBACK_REQUIRED',
 'E15_PINNED_TREE_BLOB_READBACK_REQUIRED','E15_ORIGINAL_C135_REQUIRED',
 'E15_ORIGINAL_C87_READBACK_REQUIRED','E15_ORIGINAL_S03_REQUIRED',
 'E15_SIX_SLOTS_ORIGINAL_REQUIRED','E15_RECOVERY_WORKER_FENCE_REQUIRED',
 'E15_VERIFIED_LOGO_OR_TEXT_REQUIRED','E15_HOST_DELIVERY_UNKNOWN'];
 for(let j=1;j<bound[stage];j++){
  if(j===10&&stage!=='RECOVERED')continue;
  if(j===11&&stage==='RECOVERED')continue;
  if(((mask>>>(j-1))&1)===0)return edges[j];
 }
 if(stage==='RECOVERED'&&((mask>>>9)&1)===0)return edges[10];
 return null;
}
for(let i=0;i<N;i++){
 state^=state<<13;state^=state>>>17;state^=state<<5;state>>>=0;
 const stage=E15_STAGES[(i+state)%E15_STAGES.length];
 const mask=(state^(i*2654435761))>>>0,headOk=(i%23)!==0;
 const q={profile:E15_PROFILE,stage,sourceHead:H,liveHead:headOk?H:OTHER};
 keys.forEach((k,j)=>q[k]=Boolean(mask&(1<<j)));
 const actual=adjudicateE15(q),expected=oracle(stage,mask,headOk);
 if(actual.edge!==expected||actual.ok!==(expected===null)||actual.authority!==0||
    actual.active!==false||(!actual.ok&&actual.voice!=='NO_VOICE')){
  errors++;if(!first)first={i,stage,mask,expected,actual};
 }
 actual.ok?pass++:reject++;
 trace.update([i,stage,mask,headOk,actual.edge??'PASS'].join('|')+'\n');
}
const report={schema:'ikant-e15-irred-1m/v1',seed,cases:N,structural_cases:N,
 pass,reject,errors,first_error:first,trace_sha256:trace.digest('hex'),
 model_calls:0,provider_calls:0,native_ui_attested:false,no_original_c72_or_c135_calls:true};
console.log(JSON.stringify(report,null,2));if(errors)process.exitCode=1;
