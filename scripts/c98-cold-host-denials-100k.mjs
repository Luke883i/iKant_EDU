import crypto from 'node:crypto';
import https from 'node:https';
import http from 'node:http';
import net from 'node:net';
import dns from 'node:dns';
import {executeC98ExistingC84} from '../host/c98-existing-c84-entry.mjs';

// 100k ACTUAL calls to the local C98 entry, intentionally lacking an installed
// source/provider/native bridge. These are NOT 100k independent ChatGPT sessions.
// Network calls from the tested code are instrumented as forbidden effects.
const original={https: https.request,http:http.request,connect:net.connect,lookup:dns.lookup,fetch:globalThis.fetch};
let networkInvocations=0;
const guard=()=>{networkInvocations++;throw Error('C98_NODE_NETWORK_ATTEMPT_FORBIDDEN');};
https.request=guard;http.request=guard;net.connect=guard;dns.lookup=guard;globalThis.fetch=guard;
const n=Number(process.argv[2]||100000);
if(!Number.isInteger(n)||n<100||n>100000)throw Error('C98_CASES_RANGE');
const head='bc5fbcb938c7ba959de0eaef96f92e754d953d4b';
const selection={selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'};
let callbackInvocations=0,unsafePositive=0,failures=0;
const counts={},start=performance.now();
try{
 for(let i=0;i<n;i++){
  const mode=i%8;
  const packet={sourceHead:head,selection,humanInput:`richiesta corrente ${i}`};
  switch(mode){
   case 0:break; // no callback
   case 1:packet.nodeGithubNetworkRequested=true;break;
   case 2:packet.readC77Member=async()=>{callbackInvocations++;return {};};break;
   case 3:packet.readC77Archive=async()=>{callbackInvocations++;return {};};break;
   case 4:packet.readC77Member=async()=>{callbackInvocations++;return {};};packet.readC77Archive=async()=>{callbackInvocations++;return {};};break;
   case 5:packet.readC77Archive=async()=>{callbackInvocations++;return {};};packet.selection={...selection,selected_mode:'CANONICAL'};break;
   case 6:packet.readC77Member=async()=>{callbackInvocations++;return {};};packet.sourceProof={commitBase64:'',treeObjects:[]};break;
   case 7:packet.readC77Archive=async()=>{callbackInvocations++;return {};};packet.humanInput=`${'x'.repeat(601)}${i}`;break;
  }
  const out=await executeC98ExistingC84(packet);
  if(out?.status!=='C98_STOP'||out.active!==false||out.owner_executed!==false||
     out.native_delivery_attested!==false||out.host_authenticated_origin!==false||
     out.inter_turn_persistence_attested!==false)unsafePositive++;
  const edge=out?.first_unclosed_edge||'UNKNOWN';
  counts[edge]=(counts[edge]||0)+1;
  if(!/^[A-Z0-9_]+$/.test(edge))failures++;
 }
}finally{
 https.request=original.https;http.request=original.http;net.connect=original.connect;
 dns.lookup=original.lookup;globalThis.fetch=original.fetch;
}
const out={schema:'ikant-le-c98-local-entry-negative-cold-100k/v1',
 scope:'ACTUAL_LOCAL_NODE_CALLS_WITHOUT_HOST_BRIDGE_NOT_REAL_CHATGPT_SESSIONS',
 calls:n,distinct_inputs:n,classes:8,denial_edges:counts,
 remote_github_host_callback_calls:callbackInvocations,
 local_node_network_attempts_observed:networkInvocations,
 false_owner_or_native_promotions:unsafePositive,invalid_denial_edges:failures,
 actual_host_installations:0,real_host_sessions:0,real_H95_trials:0,
 elapsed_ms:Number((performance.now()-start).toFixed(3)),active:false,
 status:networkInvocations===0&&callbackInvocations===0&&unsafePositive===0&&failures===0?'PASS':'FAIL'};
console.log(JSON.stringify(out,null,2));
if(out.status!=='PASS')process.exitCode=1;
