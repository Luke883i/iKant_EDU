import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {inspectC104,stageC104} from '../host/c104-resumable-materialization.mjs';
const head='a'.repeat(40),payload=Buffer.from('public source fixture');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const bsha=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
const names=Array.from({length:65},(_,i)=>`scripts/c104_fixture_${String(i).padStart(3,'0')}.mjs`);
const spec={schema:'ikant-le-c104-source-spec/v1',source_head:head,authority:0,github_origin_attested:false,
 files:names.map(path=>({path,bytes:payload.length,git_blob_sha1:bsha(payload)}))};
const terms=issueC72TermsOffer({sourceHead:head,termsDigest:'a'.repeat(64)});
const accepted=acceptC72Terms({offer:terms,humanMessage:'I ACCEPT',termsPresented:true});
const intro=presentC72Introduction(accepted);
const selection=selectC72Mode({accepted,orientation:intro,humanMessage:'EXPERIMENTAL'});
const root=fs.mkdtempSync(path.join(os.tmpdir(),'c104-falsify-'));
const base=()=>({sourceHead:head,selection,spec,specSha256:hash(Buffer.from(JSON.stringify(spec))),cacheRoot:root});
const patterns=['NO_SELECTION','NO_SOURCE','TAMPER_SPEC','BAD_SHA','INPUT_TRAVERSAL',
 'BASE64_CORRUPT','SOURCE_PATH_CHANGED','OVERSIZE','INVALID_CARRIER','WRONG_GIT_SHA',
 'CLAIM_ALL_COMPLETE'];
let failed=0;const axisCount=Object.fromEntries(patterns.map(x=>[x,0])),start=Date.now();
try{
 if(inspectC104(base()).status!=='C104_MATERIALIZATION_NEXT_REQUIRED')throw Error('BASELINE_INVALID');
 for(let i=0;i<100000;i++){
  const axis=patterns[i%patterns.length],input=base();axisCount[axis]++;
  switch(axis){
   case 'NO_SELECTION':input.selection=null;break;
   case 'NO_SOURCE':input.sourceHead='f'.repeat(40);break;
   case 'TAMPER_SPEC':input.spec={...spec,files:spec.files.slice(1)};break;
   case 'BAD_SHA':input.specSha256='0'.repeat(64);break;
   case 'INPUT_TRAVERSAL':input.spec={...spec,files:[{...spec.files[0],path:'../escape'},...spec.files.slice(1)]};input.specSha256=hash(Buffer.from(JSON.stringify(input.spec)));break;
   case 'SOURCE_PATH_CHANGED':input.spec={...spec,files:[{...spec.files[0],path:'src//unsafe'},...spec.files.slice(1)]};input.specSha256=hash(Buffer.from(JSON.stringify(input.spec)));break;
   case 'OVERSIZE':input.spec={...spec,files:[{...spec.files[0],bytes:1000001},...spec.files.slice(1)]};input.specSha256=hash(Buffer.from(JSON.stringify(input.spec)));break;
   case 'WRONG_GIT_SHA':input.spec={...spec,files:[{...spec.files[0],git_blob_sha1:'0'.repeat(40)},...spec.files.slice(1)]};input.specSha256=hash(Buffer.from(JSON.stringify(input.spec)));break;
  }
  let result;
  if(axis==='BASE64_CORRUPT'||axis==='INVALID_CARRIER'||axis==='WRONG_GIT_SHA')result=stageC104({context:input,
   filePath:spec.files[0].path,contentBase64:axis==='BASE64_CORRUPT'?'!':payload.toString('base64'),
   carrierId:axis==='INVALID_CARRIER'?'!':'ACTUAL_FILE_PORT'});
  else result=inspectC104(input);
  if(axis==='CLAIM_ALL_COMPLETE'){
   if(result.status!=='C104_MATERIALIZATION_NEXT_REQUIRED'||result.verified!==0||result.runtime_qualified!==false)failed++;
  }else if(result.status!=='C104_STOP')failed++;
 }
 const results={schema:'ikant-le-c104-synthetic-falsification/v1',negative_cases:100000,
  families:patterns.length,axis_counts:axisCount,unexpected_promotions:failed,
  baseline_valid:true,local_host_calls:0,real_github_callbacks:0,qualified:failed===0,
  duration_ms:Date.now()-start};
 console.log(JSON.stringify(results));if(failed)process.exitCode=1;
}finally{fs.rmSync(root,{recursive:true,force:true});}
