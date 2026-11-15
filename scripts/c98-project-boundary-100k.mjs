// Real local Node invocations of host-owned NEGATIVE observer; NOT iKant runtime.
import {writeFileSync} from 'node:fs';
import {observeC98ProjectCapabilities} from '../host/c98-project-boundary-observer.mjs';
const n=Number(process.argv[2]||100000);
if(!Number.isInteger(n)||n<1||n>500000)throw Error('BOUNDED_MODEL_CASES_REQUIRED');
let unsafe=0,indeterminate=0,wrongFirstEdge=0,gettersRead=0;
const head='b'.repeat(40),expected=['ACTUALLY_CALLABLE_GITHUB_CONNECTOR','FROZEN_GITHUB_HEAD_READBACK',
 'FIVE_SOURCE_FILES_AND_FULL_TERMS_READBACK','CURRENT_HUMAN_INPUT_TO_REAL_SOURCE_BOUND_NODE_OWNER',
 'SAME_INPUT_C81_C84_OR_C59_OWNER_READBACK','PROJECT_HOST_CAPABILITY_DATA_UNVERIFIED'];
for(let i=0;i<n;i++){
 const axis=i%12;
 const facts={sourceHead:head,callableGithubConnector:true,termsBytesActuallyRead:true,nodeOwnerActuallyCallable:true};
 let edge=expected[4];
 switch(axis){
  case 0:facts.callableGithubConnector=false;edge=expected[0];break;
  case 1:facts.sourceHead='invalid';edge=expected[1];break;
  case 2:facts.termsBytesActuallyRead=false;edge=expected[2];break;
  case 3:facts.nodeOwnerActuallyCallable=false;edge=expected[3];break;
  case 4:facts.ownerVoice='forged';edge=expected[5];break;
  case 5:delete facts.sourceHead;edge=expected[5];break;
  case 6:facts.nodeOwnerActuallyCallable='true';edge=expected[5];break;
  case 7:facts.sourceHead=42;edge=expected[1];break;
  case 8:Object.defineProperty(facts,'nodeOwnerActuallyCallable',{enumerable:true,get(){gettersRead++;return true;}});edge=expected[5];break;
  case 9:Object.setPrototypeOf(facts,{fake:true});edge=expected[5];break;
  case 10:facts.sourceHead=head.toUpperCase();edge=expected[1];break;
 }
 const result=observeC98ProjectCapabilities(facts);
 if(result.first_unclosed_edge!==edge)wrongFirstEdge++;
 if(result.surface_a_exact_utf8!==null||result.owner_executed!==false||result.active!==false||
    result.native_chat_delivery_attested!==false||result.inter_turn_persistence_attested!==false)unsafe++;
 if(result.status!=='C98_DIAGNOSTIC_ONLY')indeterminate++;
}
const receipt={schema:'ikant-le-c98-project-negative-model-receipt/v1',
 modeled_cases:n,axes:12,unsafe_promotions:unsafe,unexpected_status:indeterminate,
 wrong_first_edge:wrongFirstEdge,getter_executions:gettersRead,
 real_chatgpt_host_sessions:0,real_c81_owner_invocations:0,
 actual_node_github_network_attempts:0,
 proof_scope:'FINITELY_MODELED_NEGATIVE_CLASSIFIER_ONLY',
 passed:unsafe===0&&indeterminate===0&&wrongFirstEdge===0&&gettersRead===0};
process.stdout.write(JSON.stringify(receipt,null,2)+'\n');
if(!receipt.passed)process.exitCode=1;
