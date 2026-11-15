import {makeC98LocalFileArchiveBridge} from './c98-local-file-archive-bridge.mjs';
import {executeC98ExistingC84} from './c98-existing-c84-entry.mjs';
import {validateC72ModeSelection} from './c72-unified-mode-admission.mjs';
import {inspectC99ManualC77Evidence} from './c99-manual-c77-evidence.mjs';

// External host explicitly registers an authorized, already-mounted file as
// its archive capability. This entry never pulls from GitHub in local Node.
// The C84 execution remains under existing C78/C82/C81 owners and requires
// real sourceProof + same-current-input C72 selection, not claims from a file.
const stop=e=>Object.freeze({schema:'ikant-le-c98-file-backed-turn/v1',
 status:'C98_HOST_FILE_STOP',first_unclosed_edge:e,owner_executed:false,
 github_origin_attested:false,native_delivery_attested:false,
 active:false,authority:0});
export async function executeC98FileBackedC84({allowedRoot,archivePath,
 archiveSha256,sourceHead,manifestSha256,manifest,manifestBase64,
 humanInput,selection,sourceProof}={}){
 let port;
 try{port=makeC98LocalFileArchiveBridge({allowedRoot,archivePath,
   sourceHead,manifestSha256,archiveSha256});}
 catch(e){return stop(e?.code||'HOST_FILE_ADMISSION');}
 const r=await executeC98ExistingC84({humanInput,sourceHead,manifest,
  manifestBase64,manifestSha256,selection,sourceProof,
  readC77Archive:port.readC77Archive,nodeGithubNetworkRequested:false});
 if(r?.status!=='C98_EXISTING_C84_OWNER_RECEIPT_READY_NOT_HOST_DELIVERED')
  return stop(r?.first_unclosed_edge||'C84_OWNER_EXECUTION_UNAVAILABLE');
 return Object.freeze({...r,carrier:'HOST_MOUNTED_FILE_READBACK',
  file_bytes_readback_verified:port.statistics().byte_readback_verified,
  github_origin_attested:false,native_delivery_attested:false,active:false});
}

// Post-consent inspection-only port for manually mounted C77 bytes.
// No additional planner, transport, C84 dispatch or host attestation.
export async function inspectC98MountedC77(input){
 const fields=['allowedRoot','archivePath','archiveSha256','sourceHead',
  'manifestSha256','selection'];
 const f={};
 try{
  if(!input||Object.getPrototypeOf(input)!==Object.prototype||
     Reflect.ownKeys(input).length!==fields.length)
   return stop('C99_MOUNTED_INPUT_ENVELOPE');
  for(const key of fields){
   const d=Object.getOwnPropertyDescriptor(input,key);
   if(!d||!Object.hasOwn(d,'value'))return stop('C99_MOUNTED_INPUT_ACCESSOR');
   f[key]=d.value;
  }
 }catch{return stop('C99_MOUNTED_INPUT_ACCESSOR');}
 const {allowedRoot,archivePath,archiveSha256,sourceHead,manifestSha256,selection}=f;
 try{
  if(!validateC72ModeSelection(selection,{mode:'EXPERIMENTAL',sourceHead}))
   return stop('C72_EXPERIMENTAL_SELECTION_REQUIRED');
 }catch{return stop('C72_EXPERIMENTAL_SELECTION_REQUIRED');}
 try{
  const port=makeC98LocalFileArchiveBridge({allowedRoot,archivePath,
   sourceHead,manifestSha256,archiveSha256});
  const packet=await port.readC77Archive(Object.freeze({sourceHead,manifestSha256}));
  return inspectC99ManualC77Evidence({
   archiveBytes:Buffer.from(packet.archiveBase64,'base64'),sourceHead,
   expectedArchiveSha256:archiveSha256,expectedManifestSha256:manifestSha256});
 }catch(e){return stop(e?.code||'HOST_FILE_INSPECTION');}
}
