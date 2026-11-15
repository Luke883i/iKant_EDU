import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {verifyC85TransferredPackage,materializeC85TransferredPackage} from '../host/c85-physical-handoff.mjs';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourceHead='a'.repeat(40);const files=Array.from({length:20},(_,i)=>{
 const data=Buffer.from('verified-unit-'+i);return {path:'src/unit-'+i+'.mjs',bytes:data.length,sha256:hash(data),contentBase64:data.toString('base64')};
});
const mb=Buffer.from(JSON.stringify({source_head:sourceHead,files:files.map(({contentBase64,...rest})=>rest)}));
const p={schema:'ikant-le-c84-single-source-package/v1',sourceHead,
 expectedManifestSha256:hash(mb),manifestBase64:mb.toString('base64'),
 sourceProof:{commitBase64:'Z2l0Ynl0ZXM=',treeObjects:[{sha1:'1'.repeat(40),content_base64:'dHJlZQ=='}]},files:files.map(({bytes,sha256,...rest})=>rest),
 active:false,source_origin_attested:false,native_chat_delivery_attested:false,authority:0};
const pb=Buffer.from(JSON.stringify(p));const req={packageBase64:pb.toString('base64'),expectedPackageSha256:hash(pb),sourceHead,expectedManifestSha256:hash(mb)};
assert.equal(verifyC85TransferredPackage(req).status,'C85_PACKAGE_SAMEHASH_VERIFIED_NOT_MATERIALIZED');
const ready=materializeC85TransferredPackage(req);assert.equal(ready.status,'C85_HOST_LOCAL_BYTES_REOPENED');
assert.equal(hash(fs.readFileSync(ready.absolute_path)),req.expectedPackageSha256);
fs.rmSync(ready.absolute_path.substring(0,ready.absolute_path.lastIndexOf('/')),{recursive:true,force:true});
let denied=0;const seen=new Set();
for(let i=0;i<100000;i++){
 const k=i%10,n=Math.floor(i/10);let x={...req};
 if(k===0)x.sourceHead=n.toString(16).padStart(40,'0');
 if(k===1)x.expectedPackageSha256=n.toString(16).padStart(64,'0');
 if(k===2)x.expectedManifestSha256=n.toString(16).padStart(64,'0');
 if(k===3)x.packageBase64=req.packageBase64.slice(0,-4)+'AAAA';
 if(k===4)x.packageBase64='?'+req.packageBase64.slice(1);
 if(k>=5){const v=structuredClone(p);if(k===5)v.sourceHead='b'.repeat(40);
 if(k===6)v.files[n%20].contentBase64=Buffer.from('changed-'+n).toString('base64');
 if(k===7)v.active=true;
 if(k===8)v.files[1].path=v.files[0].path;
 if(k===9)v.sourceProof=null;
 const b=Buffer.from(JSON.stringify(v));x.packageBase64=b.toString('base64');x.expectedPackageSha256=hash(b);}
 const result=verifyC85TransferredPackage(x);assert.equal(result.status,'C85_STOP',JSON.stringify({i,result}));seen.add(result.first_unclosed_edge);denied++;
}
console.log(JSON.stringify({slice:'C85',cases:100000,denied,unexpected_accepts:0,denial_classes:[...seen].sort(),positive_write_reopen:true}));
