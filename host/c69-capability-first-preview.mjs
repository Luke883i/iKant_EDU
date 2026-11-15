import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {validateC72ModeSelection} from './c72-unified-mode-admission.mjs';

export const C69_EXPERIMENTAL_CONSENT='I ACCEPT EXPERIMENTAL';
export const C69_EXPERIMENTAL_TERMS=[
  'iKant_LE experimental repository preview (not iKant runtime).',
  'The host may use ordinary chat, pinned GitHub source reads and local files when actually callable.',
  'Consent is observed as chat text only. No native message identity, anti-replay, lease or canonical runtime admission is attested.',
  'Outputs are host-owned drafts/repository analysis, not sealed iKant decisions. No ACTIVE, persistent co-host, owner receipt or automatic retry.',
  'No secrets, personal/sensitive inputs, privileged actions, unattended writes or security-critical decisions.',
  'This profile does not resume an interrupted canonical iKant bootstrap. Request it independently with a NEW exact I ACCEPT EXPERIMENTAL.'
].join('\n');
const HEX40=/^[0-9a-f]{40}$/;
const PROHIBITED=Object.freeze(['CANONICAL_ACTIVATION','RETRY_BLOCKED_LIFECYCLE','SESSION_OWNERSHIP',
      'PRIVILEGED_SIDE_EFFECTS','SENSITIVE_DATA','FALSE_NATIVE_ORIGIN']);
const sha256=s=>crypto.createHash('sha256').update(s).digest('hex');
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const reject=(code,edge)=>Object.freeze({schema:'ikant-le-c69-experimental-preview/v1',
  status:code,first_unclosed_edge:edge||null,active:false,canonical_runtime:false,
  native_event_attested:false,github_host_origin_attested:false,
  native_delivery_attested:false,persistent:false,owner_receipt_issued:false,
  permitted_operations:[],authority:0});
const base64Decode=x=>{
  if(typeof x!=='string'||x.length%4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(x))
    return null;
  const b=Buffer.from(x,'base64');return b.toString('base64')===x?b:null;
};
export function issueC69ExperimentalOffer({sourceHead}={}){
  if(!HEX40.test(String(sourceHead||'')))throw Error('pinned source SHA required');
  const material={schema:'ikant-le-c69-experimental-offer/v1',
    source_head:sourceHead,scope:'HOST_OWNED_INDEPENDENT_REPOSITORY_PREVIEW',
    consent:C69_EXPERIMENTAL_CONSENT,terms:C69_EXPERIMENTAL_TERMS,
    prohibited:[...PROHIBITED],
    authority:0};
  return Object.freeze({...material,offer_sha256:sha256(JSON.stringify(material))});
}
/**
 * C69 is an independent host-owned output preview, NOT a low-trust
 * implementation of iKant's canonical admission/runtime.
 *
 * The caller provides source bytes obtained via a currently callable host
 * edge. This module verifies object identity and optional local samehash,
 * but never attests the source connector or human-message provenance.
 */
export function qualifyC69ExperimentalPreview(x={}){
  const {sourceHead,offer,observedConsent,sourceObject,sessionRoot}=x;
  if(x.canonicalContinuation===true||x.blockedRuntimeResume===true||
     x.requestCanonicalRuntime===true||x.acceptanceEventId!==undefined||
     x.acceptanceObservedMonotonicMs!==undefined||
     x.nativeOriginClaim===true||x.claimActive===true)
    return reject('EXPERIMENTAL_SCOPE_REJECTED','INDEPENDENT_WORK_BOUNDARY');
  if(!offer||offer.schema!=='ikant-le-c69-experimental-offer/v1'||
     !HEX40.test(String(sourceHead||''))||offer.source_head!==sourceHead||
     !HEX40.test(String(offer.source_head||''))||
     offer.consent!==C69_EXPERIMENTAL_CONSENT||
     offer.terms!==C69_EXPERIMENTAL_TERMS||
     offer.scope!=='HOST_OWNED_INDEPENDENT_REPOSITORY_PREVIEW'||
     offer.authority!==0||!Array.isArray(offer.prohibited)||
     offer.prohibited.length!==PROHIBITED.length||
     !offer.prohibited.every((p,i)=>p===PROHIBITED[i]))
    return reject('EXPERIMENTAL_OFFER_INVALID','EXPERIMENTAL_TERMS');
  const {offer_sha256,...body}=offer;
  if(sha256(JSON.stringify(body))!==offer_sha256)
    return reject('EXPERIMENTAL_OFFER_INVALID','EXPERIMENTAL_TERMS');
  const unifiedMode=x.unifiedSelection!==undefined&&
    validateC72ModeSelection(x.unifiedSelection,{mode:'EXPERIMENTAL',sourceHead});
  if(x.unifiedSelection!==undefined&&!unifiedMode)
    return reject('EXPERIMENTAL_UNIFIED_SELECTION_INVALID','MODE_CHOICE');
  if(unifiedMode&&observedConsent!==undefined)
    return reject('EXPERIMENTAL_CONSENT_COLLISION','COMMON_GATE');
  if(!unifiedMode&&observedConsent!==C69_EXPERIMENTAL_CONSENT)
    return reject('EXPERIMENTAL_CONSENT_REQUIRED','EXPERIMENTAL_CONSENT');
  if(!sourceObject||sourceObject.path!=='README.md'||
     !HEX40.test(String(sourceObject.blob_sha1||''))||
     typeof sourceObject.content_base64!=='string')
    return reject('EXPERIMENTAL_SOURCE_REQUIRED','PINNED_SOURCE_OBJECT');
  const bytes=base64Decode(sourceObject.content_base64);
  if(!bytes||gitBlob(bytes)!==sourceObject.blob_sha1)
    return reject('EXPERIMENTAL_SOURCE_INTEGRITY_STOP','PINNED_SOURCE_OBJECT');
  let reopened=false;
  if(sessionRoot!==undefined){
    if(typeof sessionRoot!=='string'||!path.isAbsolute(sessionRoot))
      return reject('EXPERIMENTAL_SINK_UNAVAILABLE','LOCAL_FILESYSTEM');
    // No persistent writer: unique private staging, readback, immediate cleanup.
    let stage=null;
    try{
      const root=fs.realpathSync(sessionRoot);
      if(!fs.statSync(root).isDirectory())throw Error('not directory');
      stage=fs.mkdtempSync(path.join(root,'.c69-preview-'));
      const file=path.join(stage,'README.md');
      fs.writeFileSync(file,bytes,{flag:'wx',mode:0o600});
      const opened=fs.readFileSync(file);
      if(!opened.equals(bytes)||gitBlob(opened)!==sourceObject.blob_sha1)
        return reject('EXPERIMENTAL_LOCAL_INTEGRITY_STOP','LOCAL_READBACK');
      reopened=true;
    }catch{return reject('EXPERIMENTAL_SINK_UNAVAILABLE','LOCAL_FILESYSTEM');}
    finally{if(stage!==null)fs.rmSync(stage,{recursive:true,force:true});}
  }
  return Object.freeze({
    schema:'ikant-le-c69-experimental-preview/v1',
    status:reopened?'EXPERIMENTAL_LOCAL_PREVIEW':'EXPERIMENTAL_SOURCE_PREVIEW',
    mode:'HOST_OWNED_INDEPENDENT_REPOSITORY_PREVIEW',
    source_head:offer.source_head,object_path:'README.md',
    source_blob_sha1:sourceObject.blob_sha1,source_blob_identity_checked:true,
    local_samehash_verified:reopened,source_origin:'CALLER_SUPPLIED_BYTES_UNATTESTED',
    consent_basis:unifiedMode?'C72_COMMON_I_ACCEPT_WITH_EXPLICIT_MODE_SELECTION':'LEGACY_EXACT_MODEL_OBSERVED_EXPERIMENTAL_TEXT',
    consent_native_identity:'UNVERIFIED',first_unclosed_edge:null,
    active:false,canonical_runtime:false,native_event_attested:false,
    github_host_origin_attested:false,native_delivery_attested:false,
    persistent:false,owner_receipt_issued:false,
    permitted_operations:Object.freeze(['REPOSITORY_STUDY','EXPERIMENTAL_DESIGN',
      'DRAFT_USER_REQUESTED_OUTPUT']),authority:0
  });
}
