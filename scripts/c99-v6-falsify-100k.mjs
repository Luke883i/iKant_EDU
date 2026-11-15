// 100k executed finite model calls + 100 CRC/central-directory corruptions.
// No network, no fake original ChatGPT events, no C84 invocation.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {unpackC94Zip} from '../host/c94-zip-c77.mjs';
import {inspectC99ManualC77Evidence as check} from '../host/c99-manual-c77-evidence.mjs';
const zip=fs.readFileSync(new URL('../tests/fixtures/c77-historical-head-66f074b3.zip',import.meta.url));
const mf=unpackC94Zip(zip).get('c77-manifest.json');
const m=JSON.parse(mf.toString('utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const valid={archiveBytes:zip,sourceHead:m.source_head,
 expectedArchiveSha256:sha(zip),expectedManifestSha256:sha(mf)};
const positive=check({...valid});
if(positive.status!=='C99_USER_UPLOADED_C77_BYTES_VERIFIED_NOT_C84')throw Error('VALID_FIXTURE_NOT_ADMITTED');
let wrong=0,getters=0,mutations=0,physicallyDecodedMutants=0;
for(let i=0;i<100000;i++){
 const axis=i%10,x={...valid};
 switch(axis){
  case 0:x.sourceHead='a'.repeat(40);break;
  case 1:x.sourceHead='INVALID';break;
  case 2:x.expectedArchiveSha256='0'.repeat(64);break;
  case 3:x.expectedArchiveSha256='not-a-hash';break;
  case 4:x.expectedManifestSha256='0'.repeat(64);break;
  case 5:x.expectedManifestSha256='INVALID';break;
  case 6:x.archiveBytes=Buffer.from('not zip');break;
  case 7:x.archiveBytes=null;break;
  case 8:Object.defineProperty(x,'archiveBytes',{enumerable:true,get(){getters++;return zip;}});break;
  case 9:x.rogueOwnerReceipt={active:true};break;
 }
 const r=check(x);mutations++;
 if(r.status!=='C99_MANUAL_C77_STOP'||r.c77_content_verified!==false||
    r.c84_owner_executed!==false||r.active!==false)wrong++;
}
for(let i=0;i<100;i++){
 const broken=Buffer.from(zip);
 broken[broken.length-1-(i%20)]^=(1+(i%253));
 const x={...valid,archiveBytes:broken,expectedArchiveSha256:sha(broken)};
 const r=check(x);physicallyDecodedMutants++;
 if(r.status!=='C99_MANUAL_C77_STOP'||r.active!==false)wrong++;
}
const receipt={schema:'ikant-le-c99-v6-manual-evidence-test/v1',
 executed_negative_inputs:mutations,axes:10,
 rehashed_zip_corruptions:physicallyDecodedMutants,
 accepted_real_valid_zip:positive.status==='C99_USER_UPLOADED_C77_BYTES_VERIFIED_NOT_C84',
 wrong_promotion:wrong,getter_invocations:getters,
 real_chatgpt_sessions:0,c81_raw_proof_executed:false,c84_executed:false,
 automatic_host_byte_transfer_attested:false,
 success:wrong===0&&getters===0};
process.stdout.write(JSON.stringify(receipt)+'\n');
if(!receipt.success)process.exitCode=1;
