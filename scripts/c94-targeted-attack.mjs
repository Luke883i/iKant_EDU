import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateC94C77Archive} from '../host/c94-zip-c77.mjs';
import {acquireC94Artifact} from '../host/c94-auto-artifact-carrier.mjs';
const n=Number(process.argv[2]||1000),HEAD='66f074b34f34455b3c4188703d83ad71316baa06';
const zip=fs.readFileSync(process.env.C94_C77_TEST_ZIP||fileURLToPath(new URL('../tests/fixtures/c77-historical-head-66f074b3.zip',import.meta.url)));
const e=zip.length-22,cent=zip.readUInt32LE(e+16);
let unsafe=0;const counters={};
for(let i=0;i<n;i++){
 const k=i%4;let r;
 if(k<2){const b=Buffer.from(zip);
  if(k===0){const local=b.readUInt32LE(cent+42);b.writeUInt16LE(1,local+6);}
  else b.writeUInt32LE(0x10000000,cent+38);
  r=validateC94C77Archive(b,{sourceHead:HEAD});
 }else{
  const id=k===2?'../../issues':'../../contents/TERMS.md';
  const client={async json(p){
   if(p.includes('/git/ref/heads/main'))return {ref:'refs/heads/main',object:{sha:HEAD}};
   if(p.includes('/actions/workflows/'))return {workflow_runs:[{id:k===2?id:123,head_sha:HEAD,status:'completed',conclusion:'success'}]};
   if(p.includes('/actions/runs/'))return {artifacts:[{id:k===3?id:456,name:'c77-qualified-standalone-microcapsule',expired:false,size_in_bytes:zip.length}]};
  },async bytes(){return zip;}};
  r=await acquireC94Artifact(client,{sourceHead:HEAD});
 }
 const passes=k<2?r.status==='C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN':r.status==='C94_ACTIONS_ARTIFACT_BYTES_OBSERVED';
 if(passes){unsafe++;counters[k]=(counters[k]||0)+1;}
}
const report={schema:'ikant-le-c94-targeted-falsification/v1',cases:n,classes:4,unsafe_accepts:unsafe,by_class:counters,mutations:['zip_local_encryption_flag','zip_special_file_fifo','github_run_path_injection','github_artifact_path_injection'],not_provider_or_native_proof:true};
console.log(JSON.stringify(report));if(process.argv.includes('--require-clean')&&unsafe)process.exitCode=2;
