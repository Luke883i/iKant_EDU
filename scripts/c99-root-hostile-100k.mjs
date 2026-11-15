import {gateC99ExperimentalEntry,gateC99SourceHandoff} from '../host/c99-route-policy.mjs';
const H='a'.repeat(40),M='b'.repeat(64);
let executed=0,unexpected=0,accessors=0,callbackCalls=0;
for(let i=0;i<100000;i++){
 const x={sourceHead:H,selection:{selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'},humanInput:'hello',readC77Archive:()=>{callbackCalls++;}};
 const fields=['sourceHead','selection','humanInput','readC77Member','readC77Archive','nodeGithubNetworkRequested'];
 const bad=i%9;
 let r;
 if(bad<6){const k=fields[bad];Object.defineProperty(x,k,{enumerable:true,get(){accessors++;return 'malicious';}});r=gateC99ExperimentalEntry(x);}
 else {const y={sourceHead:H,manifestSha256:M,sourceProof:{commitBase64:'x',treeObjects:[{}]}};const k=['sourceHead','manifestSha256','sourceProof'][bad-6];Object.defineProperty(y,k,{enumerable:true,get(){accessors++;return 'malicious';}});r=gateC99SourceHandoff(y);}
 if(r.status!=='C99_STOP'||r.first_unclosed_edge!=='C99_INPUT_ENVELOPE_ACCESSOR'||r.active!==false||r.owner_executed!==false)unexpected++;
 executed++;
}
// 100000 extra *executed* Proxy classes: reject proxy trap code before data inspection.
let proxyUnexpected=0,proxyTraps=0;
for(let i=0;i<100000;i++){
 const original={sourceHead:H,selection:{selected_mode:'EXPERIMENTAL',
   status:'EXPERIMENTAL_SELECTED_NOT_RUNNING',source_head:H},
   humanInput:'current user',readC77Archive:()=>{callbackCalls++;}};
 const hostile=t=>new Proxy(t,{
  getOwnPropertyDescriptor(o,k){proxyTraps++;return Reflect.getOwnPropertyDescriptor(o,k)},
  getPrototypeOf(o){proxyTraps++;return Reflect.getPrototypeOf(o)},
  get(o,k){proxyTraps++;return Reflect.get(o,k)}});
 let r;
 switch(i%4){
 case 0:r=gateC99ExperimentalEntry(hostile(original));break;
 case 1:r=gateC99ExperimentalEntry({...original,selection:hostile(original.selection)});break;
 case 2:r=gateC99SourceHandoff({sourceHead:H,manifestSha256:M,
  sourceProof:hostile({commitBase64:'data',treeObjects:[{}]})});break;
 case 3:r=gateC99SourceHandoff({sourceHead:H,manifestSha256:M,
  sourceProof:{commitBase64:'data',treeObjects:hostile([{}])}});break;
 }
 if(r.status!=='C99_STOP'||r.active!==false||r.owner_executed!==false)proxyUnexpected++;
 executed++;
}
const result={schema:'ikant-le-c99-root-accessor-falsification/v1',local_node_executions:executed,mutation_classes:13,unexpected,proxy_unexpected:proxyUnexpected,proxy_traps_invoked:proxyTraps,accessors_invoked:accessors,owner_callbacks_invoked:callbackCalls,real_edu_sessions:0,pass:unexpected===0&&proxyUnexpected===0&&proxyTraps===0&&accessors===0&&callbackCalls===0};
console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
