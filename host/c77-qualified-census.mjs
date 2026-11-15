import fs from 'node:fs';
import crypto from 'node:crypto';
const loc=new URL('../contracts/c77-cx-build-proof.json',import.meta.url);
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const hex40=/^[0-9a-f]{40}$/;
const hex64=/^[0-9a-f]{64}$/;
let proof=null;
export function validateC77CensusAnchor(entry,census){
 try {
  if(!proof)proof=JSON.parse(fs.readFileSync(loc,'utf8'));
  if(proof.schema!=='ikant-le-c77-qualified-cx-census/v1'||proof.authority!==0||
     proof.origin_attested!==false||!hex40.test(proof.source_head)||
     !hex64.test(proof.census_sha256)||!Array.isArray(proof.entries)||
     proof.entries.length!==70)return false;
  const actual=fs.readFileSync(new URL('../contracts/c71-cx-execution-census.json',import.meta.url));
  if(digest(actual)!==proof.census_sha256||!Array.isArray(census.entries)||
      census.entries.length!==70)return false;
  const n=Number(String(entry.id).slice(1))-1;
  if(n<0||n>69||!Number.isInteger(n))return false;
  const v=proof.entries[n];
  return v.id===entry.id&&v.path===entry.implementation_anchor&&
    hex40.test(v.git_blob_sha1)&&
    census.entries[n].implementation_anchor===v.path&&
    census.entries[n].id===v.id;
 }catch{return false;}
}
