import crypto from 'node:crypto';
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
const stop=e=>({status:'C94_DERIVATION_STOP',first_unclosed_edge:e,derivation_verified:false,
 cx_anchor_git_reachability_independently_verified:false,active:false,authority:0});
/** Reconstruct C71's original Git blob from the deterministic C77 derivation,
 * then demand its exact Git SHA-1 identity and its unmodified derived bytes.
 * This does not replace C81 Merkle reachability or source-provider trust. */
export function verifyC94C77Derivation(files,manifest){
 try{
  const derivative=files?.get('src/c71-experimental-host-draft.mjs');
  const spec=manifest?.files?.find(f=>f.path==='src/c71-experimental-host-draft.mjs');
  if(!derivative||!spec||spec.generated_derivative!==true||
     typeof spec.original_source_blob_sha1!=='string')return stop('C71_DERIVATIVE_MISSING');
  const prefix="import {validateC77CensusAnchor} from '../host/c77-qualified-census.mjs';\n";
  const derived=derivative.toString('utf8');
  const replacement='!validateC77CensusAnchor(e,x)||';
  const needle="!fs.existsSync(new URL('../'+e.implementation_anchor,import.meta.url))||";
  if(!derived.startsWith(prefix)||derived.split(replacement).length!==2)return stop('C71_DERIVATIVE_UNQUALIFIED');
  const original=derived.slice(prefix.length).replace(replacement,needle);
  const source=Buffer.from(original,'utf8');
  if(gitBlob(source)!==spec.original_source_blob_sha1||
     prefix+original.replace(needle,replacement)!==derived)return stop('C71_ORIGINAL_BLOB_DERIVATION_MISMATCH');
  const proof=JSON.parse(files.get('contracts/c77-cx-build-proof.json').toString('utf8'));
  const censusBytes=files.get('contracts/c71-cx-execution-census.json');
  const census=JSON.parse(censusBytes.toString('utf8'));
  if(proof.source_head!==manifest.source_head||proof.census_sha256!==sha256(censusBytes)||
     proof.entries?.length!==70||census.entries?.length!==70)return stop('C77_CX_CENSUS_DRIFT');
  for(let i=0;i<70;i++){
   const p=proof.entries[i],q=census.entries[i];
   if(!p||!q||p.id!==`C${i+1}`||p.id!==q.id||
      p.path!==q.implementation_anchor||!/^([a-f0-9]{40})$/.test(p.git_blob_sha1)||
      p.path.includes('..'))return stop('C77_CX_PROOF_DRIFT');
   const inBundle=manifest.files.find(f=>f.path===p.path);
   if(inBundle&&inBundle.original_source_blob_sha1!==p.git_blob_sha1)return stop('C77_CX_MANIFEST_GIT_BLOB_DRIFT');
  }
  return {schema:'ikant-le-c94-c77-derivation/v1',status:'C94_C77_DERIVATION_VERIFIED_SOURCE_ANCHORS_PARTIAL',
   original_c71_sha1:spec.original_source_blob_sha1,cx_count:70,cx_census_sha256:proof.census_sha256,
   derivation_verified:true,cx_anchor_git_reachability_independently_verified:false,
   c81_original_source_reachability_still_required:true,active:false,authority:0};
 }catch{return stop('C77_CX_PROOF_PARSE');}
}
