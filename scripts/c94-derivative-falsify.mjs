import crypto from 'node:crypto';
import fs from 'node:fs';
import {unpackC94Zip} from '../host/c94-zip-c77.mjs';
import {verifyC94C77Derivation} from '../host/c94-derived-c77-proof.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const n=Number(process.argv[2]||12000);
if(!Number.isInteger(n)||n<100||n>200000)throw Error('CASES_RANGE');
const b=unpackC94Zip(fs.readFileSync(new URL('../tests/fixtures/c77-historical-head-66f074b3.zip',import.meta.url)));
const m=JSON.parse(b.get('c77-manifest.json'));
let survivors=0;const first=[];
for(let i=0;i<n;i++){
 const x=new Map(b),manifest=structuredClone(m),k=i%4;
 if(k<2){const p='src/c71-experimental-host-draft.mjs';const payload=Buffer.concat([x.get(p),Buffer.from(k?'\n// injection':'\n')]);
  x.set(p,payload);const spec=manifest.files.find(s=>s.path===p);spec.sha256=sha(payload);spec.bytes=payload.length;
 }else{
  const proof=JSON.parse(x.get('contracts/c77-cx-build-proof.json'));
  if(k===2)proof.entries[0].git_blob_sha1='f'.repeat(40);
  else proof.entries[0].path='scripts/not-in-census.mjs';
  x.set('contracts/c77-cx-build-proof.json',Buffer.from(JSON.stringify(proof)));
 }
 const receipt=verifyC94C77Derivation(x,manifest);
 if(receipt.status!=='C94_DERIVATION_STOP'){survivors++;if(first.length<3)first.push({i,k,status:receipt.status});}
}
const r={schema:'ikant-le-c94-derivative-falsification/v1',cases:n,classes:4,survivors,first,
 baseline:'C77_LOCAL_MANIFEST_HASH_ONLY_WOULD_ACCEPT_REHASHED_DERIVATIVE',
 strengthened:'ORIGINAL_GIT_BLOB_PREIMAGE_AND_BUILD_CENSUS_CHECK',
 real_github_native_origin_attested:false,active:false};
console.log(JSON.stringify(r));if(survivors)process.exitCode=2;
