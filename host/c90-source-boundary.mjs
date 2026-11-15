import crypto from 'node:crypto';
import {verifyC85TransferredPackage} from './c85-physical-handoff.mjs';
import {verifyC81SourceReachability} from './c81-git-source-reachability.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const stop=e=>({schema:'ikant-le-c90-source/v2',status:'C90_SOURCE_STOP',
 first_unclosed_edge:e,git_reachability_attested:false,host_github_ref_origin_attested:false,
 active:false,native_chat_delivery_attested:false});
/** SHA-consistent source does not authenticate a GitHub ref; source proof must actually execute in Node. */
export function verifyC90Source(q={}){
 const accepted=verifyC85TransferredPackage({
  packageBase64:q.packageBase64,expectedPackageSha256:q.packageSha256,
  sourceHead:q.sourceHead,expectedManifestSha256:q.manifestSha256});
 if(accepted.status!=='C85_PACKAGE_SAMEHASH_VERIFIED_NOT_MATERIALIZED')
  return stop('C85_'+(accepted.first_unclosed_edge||'SAMEHASH'));
 let packet;
 try{packet=JSON.parse(Buffer.from(q.packageBase64,'base64').toString('utf8'));}
 catch{return stop('C90_PACKAGE_DECODE');}
 if(!packet?.sourceProof||!Array.isArray(packet.sourceProof.treeObjects)||
  typeof packet.sourceProof.commitBase64!=='string')
  return stop('C81_RAW_GIT_OBJECTS_MISSING');
 let proof;
 try{proof=verifyC81SourceReachability({
  expectedSourceHead:q.sourceHead,expectedManifestSha256:q.manifestSha256,
  manifestBase64:packet.manifestBase64,commitBase64:packet.sourceProof.commitBase64,
  treeObjects:packet.sourceProof.treeObjects});
 }catch{return stop('C81_GIT_PROOF_EXECUTION');}
 if(proof.status!=='C81_GIT_REACHABILITY_VERIFIED')
  return stop(proof.first_unclosed_edge||'C81_GIT_REACHABILITY');
 return {schema:'ikant-le-c90-source/v2',status:'C90_SOURCE_REACHABLE_NOT_HOST_ORIGIN_ATTESTED',
  source_head:q.sourceHead,manifest_sha256:q.manifestSha256,package_sha256:q.packageSha256,
  package_files:accepted.files,source_proof_receipt_sha256:sha(Buffer.from(JSON.stringify(proof))),
  git_reachability_attested:true,host_github_ref_origin_attested:false,active:false,
  native_chat_delivery_attested:false};
}
