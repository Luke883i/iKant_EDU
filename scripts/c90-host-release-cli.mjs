import fs from 'node:fs';
import {executeC90HostRelease} from '../host/c90-physical-delivery.mjs';
const stop=edge=>({schema:'ikant-le-c90-host-release/v2',
 status:'C90_HOST_RELEASE_STOP',first_unclosed_edge:edge,
 native_chat_delivery_attested:false,active:false});
let out;
try{
 const bytes=fs.readFileSync(0);
 if(bytes.length===0||bytes.length>9500000)throw Error('C90_STDIN_LIMIT');
 const q=JSON.parse(bytes.toString('utf8'));
 if(!q||q.schema!=='ikant-le-c90-host-turn-request/v2'||
  !q.request||typeof q.request!=='object'||Array.isArray(q.request)||
  Object.keys(q).sort().join(',')!=='request,schema')
  throw Error('C90_REQUEST_ENVELOPE');
 const forbidden=['runtimeReceipt','voice','runtime_computed_answer','hostCandidate',
  'nativeChatEvent','active','evidenceDir','scratchLedgerFile','turnNonce'];
 if(forbidden.some(k=>Object.hasOwn(q.request,k)))throw Error('C90_FORGED_PROVENANCE_OR_OUTPUT');
 out=await executeC90HostRelease(q.request);
}catch(e){out=stop(String(e?.message||e).slice(0,100));}
process.stdout.write(JSON.stringify(out)+'\n');
if(out.status!=='C90_HOST_RELEASE_READY_NOT_NATIVE_PRESENTED')process.exitCode=2;
