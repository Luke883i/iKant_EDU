import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import http from 'node:http';
import dns from 'node:dns';
import net from 'node:net';
import {makeC98LocalFileArchiveBridge} from '../host/c98-local-file-archive-bridge.mjs';
import {validateC94C77Archive} from '../host/c94-zip-c77.mjs';
const n=Number(process.argv[2]||100000);
if(!Number.isInteger(n)||n<100||n>100000)throw Error('CASES_BOUNDS');
const bytes=fs.readFileSync(new URL('../tests/fixtures/c77-historical-head-66f074b3.zip',import.meta.url));
const head='66f074b34f34455b3c4188703d83ad71316baa06';
const manifest=validateC94C77Archive(bytes,{sourceHead:head}).manifest_sha256;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'c98-file-mutations-'));
const file=path.join(dir,'artifact.zip'),link=path.join(dir,'file.link');
fs.writeFileSync(file,bytes);fs.symlinkSync(file,link);
const original={https:https.request,http:http.request,dns:dns.lookup,net:net.connect,fetch:globalThis.fetch};
let network=0,accepted=0,unknown=0;
const deny=()=>{network++;throw Error('NETWORK_FORBIDDEN');};
https.request=deny;http.request=deny;dns.lookup=deny;net.connect=deny;globalThis.fetch=deny;
const counts=Array(12).fill(0);let sample=[];const start=performance.now();
try{
 for(let i=0;i<n;i++){
  const type=i%12,nonce=i.toString(16).padStart(8,'0');counts[type]++;
  const base={allowedRoot:dir,archivePath:file,sourceHead:head,
   manifestSha256:manifest,archiveSha256:hash(bytes)};
  let q=base,req={sourceHead:head,manifestSha256:manifest};
  switch(type){
   case 0:q={...base,sourceHead:'0'.repeat(32)+nonce};break;
   case 1:q={...base,manifestSha256:'f'.repeat(56)+nonce};break;
   case 2:q={...base,archiveSha256:'e'.repeat(56)+nonce};break;
   case 3:q={...base,archivePath:'/tmp/outside-'+nonce+'.zip'};break;
   case 4:q={...base,archivePath:path.join(dir,'..','outside-'+nonce+'.zip')};break;
   case 5:q={...base,archivePath:'relative-'+nonce+'.zip'};break;
   case 6:q={...base,archivePath:link};break;
   case 7:q={...base,archivePath:dir};break;
   case 8:q={...base,archiveSha256:'0'.repeat(64)};break;
   case 9:q={...base,archivePath:path.join(dir,'missing-'+nonce+'.zip')};break;
   case 10:req={...req,sourceHead:'0'.repeat(32)+nonce};break;
   case 11:req={...req,manifestSha256:'f'.repeat(56)+nonce};break;
  }
  try{await makeC98LocalFileArchiveBridge(q).readC77Archive(req);accepted++;if(sample.length<5)sample.push({i,type});}
  catch(e){if(typeof e?.message!=='string'||!/(C98_FILE_|ENOENT)/.test(e.message))unknown++;}
 }
}finally{
 https.request=original.https;http.request=original.http;dns.lookup=original.dns;
 net.connect=original.net;globalThis.fetch=original.fetch;
 fs.rmSync(dir,{recursive:true,force:true});
}
const out={schema:'ikant-le-c98-file-handoff-falsify/v1',cases:n,classes:12,
 distinct_vectors:n,per_class:counts,accepted,unexpected_errors:unknown,
 local_node_network_attempts:network,owner_executed:false,
 host_github_ref_attested:false,native_event_attested:false,
 real_chatgpt_sessions:0,elapsed_ms:Math.round(performance.now()-start),
 status:accepted===0&&unknown===0&&network===0?'PASS':'FAIL',sample};
console.log(JSON.stringify(out,null,2));if(out.status!=='PASS')process.exitCode=1;
