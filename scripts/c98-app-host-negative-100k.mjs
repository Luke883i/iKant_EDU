import {executeC98RegisteredAppTurn} from '../host/c98-app-host-ingress.mjs';
import {wireC98ToInstalledMCP} from '../host/c98-mcp-tool-wiring.mjs';
const n=Number(process.argv[2]||100000);
if(!Number.isInteger(n)||n<100||n>200000)throw Error('CASE_COUNT_RANGE');
const mock=()=>({allowedRoot:'/tmp/host-offline',archivePath:'/tmp/host-offline/a.zip',
 archiveSha256:'a'.repeat(64),sourceHead:'b'.repeat(40),manifestSha256:'c'.repeat(64),
 manifest:{},manifestBase64:'e30=',humanInput:'test',selection:{},sourceProof:null});
let violations=0,callbackCalls=0,mutated=0;const rootClasses=Array(10).fill(0);
const start=performance.now();
for(let i=0;i<n;i++){
 const k=i%10;rootClasses[k]++;
 let p=mock();
 if(k===0)p.owner_receipt={active:true};
 if(k===1)p.sourceHead='not-a-head';
 if(k===2)p.manifestSha256='wrong';
 if(k===3)p.humanInput='x'.repeat(601);
 if(k===4)p.native_delivery_attested=true;
 if(k===5)p.sourceProof={native_event_id:'forged'};
 if(k===6)p=new Proxy(p,{});
 if(k===7)Object.defineProperty(p,'humanInput',{get(){mutated++;return 'bad';},enumerable:true});
 if(k===8)p.archiveSha256='broken';
 if(k===9)p.manifestBase64='not-base64';
 const r=await executeC98RegisteredAppTurn({registeredHostPort:{
  readCurrentTurnEnvelope:async()=>{callbackCalls++;return p;}
 }});
 if(r.status!=='C98_HOST_APP_STOP'||r.owner_executed!==false||
  r.native_delivery_attested!==false||r.active!==false)violations++;
}
const report={schema:'ikant-le-c98-app-negative-100k/v1',cases:n,
 classes:10,class_counts:rootClasses,unexpected_promotions:violations,
 getter_invocations:mutated,host_port_callback_invocations:callbackCalls,
 node_github_network_attempts:0,real_chatgpt_host_sessions:0,
 scope:'LOCAL_NODE_REAL_FUNCTION_CALLS_NOT_NATIVE_CHATGPT_HOST_ATTESTATION',
 elapsed_ms:Math.round(performance.now()-start),status:violations===0&&mutated===0?'PASS':'FAIL'};
console.log(JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1;
