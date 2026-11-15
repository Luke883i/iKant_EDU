import crypto from 'node:crypto';
import {validateC94C77Archive} from './c94-zip-c77.mjs';

// Evidence classifier, NOT a transport, native witness, writer or new owner.
// The byte carrier is an explicit human upload/host-mounted file. No Node IO.
const H40=/^[a-f0-9]{40}$/, H64=/^[a-f0-9]{64}$/;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const stop=edge=>Object.freeze({schema:'ikant-le-c99-manual-c77-evidence/v1',
 status:'C99_MANUAL_C77_STOP',first_unclosed_edge:edge,
 c77_content_verified:false,manual_transport_only:true,
 automatic_host_transfer_attested:false,source_origin_attested:false,
 c81_verified:false,c84_owner_executed:false,native_event_attested:false,
 native_delivery_attested:false,active:false,authority:0});
function dataFields(x){
 try{
  if(!x||Object.getPrototypeOf(x)!==Object.prototype)return null;
  const keys=['archiveBytes','sourceHead','expectedArchiveSha256','expectedManifestSha256'];
  if(Reflect.ownKeys(x).length!==keys.length)return null;
  const out={};
  for(const key of keys){
   const d=Object.getOwnPropertyDescriptor(x,key);
   if(!d||!Object.hasOwn(d,'value'))return null;
   out[key]=d.value;
  }
  return out;
 }catch{return null;}
}
/**
 * Validate ACTUAL in-process ZIP bytes via the existing C94 verifier.
 * The expected SHA values must be independently pinned by the host.
 * This function cannot attest who uploaded the ZIP, GitHub ref origin,
 * user-event identity, C81 Git object reachability or C84 execution.
 */
export function inspectC99ManualC77Evidence(input){
 const f=dataFields(input);
 if(!f)return stop('C99_MANUAL_EVIDENCE_ENVELOPE');
 const {archiveBytes,sourceHead,expectedArchiveSha256,expectedManifestSha256}=f;
 if(!H40.test(sourceHead||'')||!H64.test(expectedArchiveSha256||'')||
    !H64.test(expectedManifestSha256||'')||!Buffer.isBuffer(archiveBytes)||
    archiveBytes.length<22||archiveBytes.length>5_000_000)
  return stop('C99_MANUAL_C77_BOUNDS');
 if(sha(archiveBytes)!==expectedArchiveSha256)
  return stop('C99_MANUAL_ARCHIVE_DIGEST_MISMATCH');
 const checked=validateC94C77Archive(archiveBytes,{sourceHead});
 if(checked.status!=='C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN')
  return stop('C99_MANUAL_C77_CONTENT_INVALID');
 if(checked.manifest_sha256!==expectedManifestSha256)
  return stop('C99_MANUAL_C77_MANIFEST_EPOCH_MISMATCH');
 return Object.freeze({schema:'ikant-le-c99-manual-c77-evidence/v1',
  status:'C99_USER_UPLOADED_C77_BYTES_VERIFIED_NOT_C84',
  source_head:sourceHead,manifest_sha256:checked.manifest_sha256,
  archive_sha256:checked.artifact_sha256,verified_c77_members:checked.files,
  c77_content_verified:true,manual_transport_only:true,
  automatic_host_transfer_attested:false,source_origin_attested:false,
  c81_verified:false,c84_owner_executed:false,native_event_attested:false,
  native_delivery_attested:false,active:false,authority:0,
  first_unclosed_edge:'C81_RAW_GIT_PROOF_AND_C84_EXISTING_OWNER'});
}
