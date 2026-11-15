import {gateC99ExperimentalEntry} from '../host/c99-route-policy.mjs';
const HEAD='a'.repeat(40),OTHER='b'.repeat(40),N=100000;
let calls=0,getters=0,unexpected=0,stops=0,shapeOnly=0;
const errors={};
for(let i=0;i<N;i++){
 const x={sourceHead:HEAD,selection:{source_head:HEAD,selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'},humanInput:'ciao',readC77Archive:()=>{calls++;}};
 const axis=i%13;
 let expected='C99_STOP';
 switch(axis){
  case 0:x.selection.source_head=OTHER;break;
  case 1:x.selection.source_head='';break;
  case 2:x.selection.source_head=null;break;
  case 3:x.selection.source_head=42;break;
  case 4:x.selection.source_head='B'.repeat(40);break;
  case 5:Object.defineProperty(x.selection,'source_head',{get(){getters++;return HEAD},enumerable:true});break;
  case 6:Object.defineProperty(x,'sourceHead',{get(){getters++;return HEAD},enumerable:true});break;
  case 7:Object.defineProperty(x.selection,'selected_mode',{get(){getters++;return 'EXPERIMENTAL'},enumerable:true});break;
  case 8:Object.defineProperty(x.selection,'status',{get(){getters++;return 'EXPERIMENTAL_SELECTED_NOT_RUNNING'},enumerable:true});break;
  case 9:x.readC77Member=x.readC77Archive;break;
  case 10:delete x.readC77Archive;break;
  case 11:x.nodeGithubNetworkRequested=true;break;
  case 12:x.selection.selected_mode='CANONICAL';break;
 }
 const r=gateC99ExperimentalEntry(x);
 if(r.status!==expected||r.active!==false||r.owner_executed!==false||r.source_origin_attested!==false||r.native_event_attested!==false)unexpected++;
 errors[r.first_unclosed_edge]=(errors[r.first_unclosed_edge]||0)+1;
 if(r.status==='C99_STOP')stops++;else shapeOnly++;
}
const res={schema:'ikant-le-c99-forensic-v5-epoch-mutations/v1',node_executions:N,classes:13,stops,shape_only:shapeOnly,unexpected,getters,callback_calls:calls,native_chats:0,artifact_binary_downloads:0,scope:'FINITE_LOCAL_ENTRY_GATE_FALSIFICATION_NOT_NATIVE_HOST',pass:stops===N&&unexpected===0&&getters===0&&calls===0};
console.log(JSON.stringify(res,null,2));if(!res.pass)process.exitCode=1;
