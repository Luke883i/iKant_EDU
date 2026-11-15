import https from 'node:https';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validateC94C77Archive,stageC94C77Archive} from './c94-zip-c77.mjs';
import {assembleC94GitProof} from './c94-git-api-proof.mjs';
import {verifyC94C77Derivation} from './c94-derived-c77-proof.mjs';
import {verifyC94CxAnchorReachability} from './c94-cx-anchor-proof.mjs';
import {verifyC81SourceReachability} from './c81-git-source-reachability.mjs';
import {verifyC85TransferredPackage} from './c85-physical-handoff.mjs';
import {verifyC90Source} from './c90-source-boundary.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const H40=/^[a-f0-9]{40}$/;
const stop=e=>({schema:'ikant-le-c94-auto-handoff/v1',status:'C94_AUTO_HANDOFF_STOP',
 first_unclosed_edge:e,source_origin_attested:false,c81_executed:false,
 c90_executed:false,native_chat_delivery_attested:false,active:false,authority:0});
const REPO='Luke883i/iKant_LE';
const MAX=5_000_000;
const artifactName='c77-qualified-standalone-microcapsule';
const C95_GITHUB_API_ALLOWLIST=/^\/(?:git\/ref\/heads\/main|git\/commits\/[a-f0-9]{40}|git\/trees\/[a-f0-9]{40}|actions\/workflows\/c77-standalone-capsule\.yml\/runs\?branch=main&status=completed&per_page=(?:[1-9]|[1-4][0-9]|50)|actions\/runs\/[1-9][0-9]*\/artifacts\?per_page=100)$/;
function domainOK(host){return host==='api.github.com'||host.endsWith('.blob.core.windows.net')||host==='productionresultssa0.blob.core.windows.net';}
/** Actual Node HTTPS only: fixed source host, no arbitrary URL from model/user,
 * redirect token stripped; TLS certificate verification remains ON. */
export function createC94GitHubHTTPS({token=process.env.IKANT_C94_GITHUB_TOKEN}={}){
 if(typeof token!=='string'||token.length<20||/\s/.test(token))return null;
 const request=async(url,redirects=0)=>{
  const target=new URL(url);if(target.protocol!=='https:'||!domainOK(target.hostname)||redirects>4)throw Error('UNAUTHORIZED_REDIRECT');
  const api=target.hostname==='api.github.com';
  return await new Promise((resolve,reject)=>{
   const headers=api?{'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',
    'User-Agent':'ikant-c94-authorized-host','Authorization':`Bearer ${token}`}:{'User-Agent':'ikant-c94-authorized-host'};
   const req=https.get(target,{headers,rejectUnauthorized:true,timeout:20000},res=>{
    if([301,302,303,307,308].includes(res.statusCode)){
     res.resume();if(!res.headers.location){reject(Error('MISSING_REDIRECT_LOCATION'));return;}
     const next=new URL(res.headers.location,target);
     if(api&&next.hostname==='api.github.com'&&next.protocol==='https:'){
      request(next.toString(),redirects+1).then(resolve,reject);return;
     }
     if(next.protocol!=='https:'||!domainOK(next.hostname)||next.hostname==='api.github.com'){
      reject(Error('UNAUTHORIZED_REDIRECT_TARGET'));return;
     }
     request(next.toString(),redirects+1).then(resolve,reject);return;
    }
    if(res.statusCode!==200){res.resume();reject(Error('GITHUB_HTTP_'+res.statusCode));return;}
    const chunks=[];let size=0;
    res.on('data',chunk=>{size+=chunk.length;if(size>MAX){req.destroy(Error('GITHUB_BODY_TOO_LARGE'));return;}chunks.push(chunk);});
    res.on('end',()=>resolve(Buffer.concat(chunks)));
   });req.on('error',reject);req.on('timeout',()=>req.destroy(Error('GITHUB_TIMEOUT')));
  });
 };
 return Object.freeze({
  async json(endpoint){if(typeof endpoint!=='string'||!C95_GITHUB_API_ALLOWLIST.test(endpoint))throw Error('UNSAFE_API_PATH');
   const r=await request(`https://api.github.com/repos/${REPO}${endpoint}`);
   try{return JSON.parse(r.toString('utf8'));}catch{throw Error('GITHUB_API_JSON');}},
  async bytes(endpoint){if(typeof endpoint!=='string'||!endpoint.startsWith('/actions/artifacts/'))throw Error('UNSAFE_ARTIFACT_PATH');
   return request(`https://api.github.com/repos/${REPO}${endpoint}`);}
 });
}
/** GETs actual repository HEAD from HTTPS, then finds an artifact from an exact
 * completed matching main run; no stale run, link-only claim or artifact spoofing. */
export async function acquireC94Artifact(client,{sourceHead,runLimit=30}={}){
 if(!client||!H40.test(sourceHead||''))return stop('GITHUB_HOST_CLIENT_AND_SHA_REQUIRED');
 if(!Number.isInteger(runLimit)||runLimit<1||runLimit>50)return stop('GITHUB_RUN_LIMIT_UNSAFE');
 try{
  const ref=await client.json('/git/ref/heads/main');
  if(ref.ref!=='refs/heads/main'||ref.object?.sha!==sourceHead)return stop('HOST_GITHUB_REF_HEAD_DRIFT');
  const runs=await client.json(`/actions/workflows/c77-standalone-capsule.yml/runs?branch=main&status=completed&per_page=${runLimit}`);
  const eligible=(runs.workflow_runs||[]).filter(r=>r.head_sha===sourceHead&&r.status==='completed'&&r.conclusion==='success');
  if(!eligible.length)return stop('C77_HEAD_EXACT_SUCCESSFUL_RUN_MISSING');
  for(const run of eligible){
   if(!Number.isSafeInteger(run.id)||run.id<=0)return stop('GITHUB_RUN_ID_UNSAFE');
   const listing=await client.json(`/actions/runs/${run.id}/artifacts?per_page=100`);
   const artifact=(listing.artifacts||[]).find(a=>a.name===artifactName&&a.expired===false&&a.size_in_bytes<=MAX);
   if(!artifact)continue;
   if(!Number.isSafeInteger(artifact.id)||artifact.id<=0||
      !Number.isSafeInteger(artifact.size_in_bytes)||artifact.size_in_bytes<100||artifact.size_in_bytes>MAX)
     return stop('GITHUB_ARTIFACT_ID_OR_SIZE_UNSAFE');
   const zip=await client.bytes(`/actions/artifacts/${artifact.id}/zip`);
   const checked=validateC94C77Archive(zip,{sourceHead});
   if(checked.status!=='C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN')return stop(checked.first_unclosed_edge||'ARTIFACT_SOURCE_DRIFT');
   // Freeze the ref over transport: a main-HEAD race cannot silently launder stale bytes.
   const finalRef=await client.json('/git/ref/heads/main');
   if(finalRef?.ref!=='refs/heads/main'||finalRef.object?.sha!==sourceHead)return stop('HOST_GITHUB_REF_CHANGED_DURING_TRANSPORT');
   return {schema:'ikant-le-c94-actions-handoff/v1',status:'C94_ACTIONS_ARTIFACT_BYTES_OBSERVED',
    artifactBytes:zip,artifact_id:artifact.id,run_id:run.id,sourceHead,
    artifact_sha256:sha(zip),manifest_sha256:checked.manifest_sha256,
    host_ref_read_through_github_api:true,github_ref_cryptographically_authenticated:false,
    native_delivery_attested:false,authority:0,active:false};
  }
  return stop('C77_HEAD_EXACT_ARTIFACT_MISSING');
 }catch(e){return stop('GITHUB_API_OR_BINARY_TRANSPORT_'+String(e?.message||e).slice(0,80));}
}
/** C84 raw source package built on the original automatically received C77 ZIP.
 * Important: C90 must still run C85+C81, and no C72 selection is manufactured. */
export async function buildC94C84AutoPackage({sourceHead,client,parentDir=os.tmpdir()}={}){
 if(!path.isAbsolute(parentDir))return stop('OUTPUT_ABSOLUTE_PARENT');
 const acquired=await acquireC94Artifact(client,{sourceHead});
 if(acquired.status!=='C94_ACTIONS_ARTIFACT_BYTES_OBSERVED')return acquired;
 const checked=validateC94C77Archive(acquired.artifactBytes,{sourceHead});
 if(checked.status!=='C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN')return stop('C77_CARRIER_RECHECK');
 const derivative=verifyC94C77Derivation(checked.content,checked.manifest);
 if(derivative.status!=='C94_C77_DERIVATION_VERIFIED_SOURCE_ANCHORS_PARTIAL')return stop(derivative.first_unclosed_edge||'C77_DERIVATIVE_UNVERIFIED');
 const staged=stageC94C77Archive(acquired.artifactBytes,{sourceHead,parentDir});
 if(staged.status!=='C94_C77_STAGED_REOPENED_NOT_RUNTIME_EXECUTED')return stop('C77_MATERIALIZATION');
 const manifestBytes=checked.content.get('c77-manifest.json');
 const proof=await assembleC94GitProof({sourceHead,manifest:checked.manifest,manifestBytes,
  gitApi:p=>client.json(p)});
 if(proof.status!=='C94_GIT_RAW_OBJECTS_RECONSTRUCTED_AND_VERIFIED'){
  fs.rmSync(staged.output_dir,{recursive:true,force:true});
  return stop('C81_GIT_OBJECT_PROOF_'+proof.first_unclosed_edge);
 }
 const cxProof=await verifyC94CxAnchorReachability({sourceHead,
  proofBytes:checked.content.get('contracts/c77-cx-build-proof.json'),
  commitBase64:proof.commitBase64,gitApi:p=>client.json(p)});
 if(cxProof.status!=='C94_CX_70_GIT_ANCHORS_REACHABLE_NOT_GITHUB_NATIVE_ORIGIN'){
  fs.rmSync(staged.output_dir,{recursive:true,force:true});
  return stop('C77_CX_70_ANCHORS_'+cxProof.first_unclosed_edge);
 }
 const files=checked.manifest.files.map(f=>({path:f.path,contentBase64:checked.content.get(f.path).toString('base64')}));
 const packet={schema:'ikant-le-c84-single-source-package/v1',sourceHead,
  expectedManifestSha256:proof.manifest_sha256,manifestBase64:manifestBytes.toString('base64'),
  sourceProof:{commitBase64:proof.commitBase64,treeObjects:proof.treeObjects},files,
  active:false,source_origin_attested:false,native_chat_delivery_attested:false,authority:0};
 const raw=Buffer.from(JSON.stringify(packet)+'\n','utf8');
 if(raw.length>6_000_000){fs.rmSync(staged.output_dir,{recursive:true,force:true});return stop('C84_PACKET_TOO_LARGE');}
 // C95: run the actual C85/C81/C90 source validators before publishing C84.
 // Git Merkle consistency is NOT an attestation of origin; current-turn C90 owner
 // execution still happens later inside C93/C92, using this exact frozen package.
 const pin={packageBase64:raw.toString('base64'),expectedPackageSha256:sha(raw),
  sourceHead,expectedManifestSha256:proof.manifest_sha256};
 const c85=verifyC85TransferredPackage(pin);
 if(c85.status!=='C85_PACKAGE_SAMEHASH_VERIFIED_NOT_MATERIALIZED'){
  fs.rmSync(staged.output_dir,{recursive:true,force:true});return stop('C85_ACTUAL_SOURCE_'+(c85.first_unclosed_edge||'INVALID'));
 }
 const c81=verifyC81SourceReachability({expectedSourceHead:sourceHead,
  expectedManifestSha256:proof.manifest_sha256,manifestBase64:packet.manifestBase64,
  commitBase64:proof.commitBase64,treeObjects:proof.treeObjects});
 if(c81.status!=='C81_GIT_REACHABILITY_VERIFIED'){
  fs.rmSync(staged.output_dir,{recursive:true,force:true});return stop('C81_ACTUAL_EXECUTION_'+(c81.first_unclosed_edge||'INVALID'));
 }
 const c90source=verifyC90Source({packageBase64:pin.packageBase64,packageSha256:pin.expectedPackageSha256,
  sourceHead,manifestSha256:pin.expectedManifestSha256});
 if(c90source.status!=='C90_SOURCE_REACHABLE_NOT_HOST_ORIGIN_ATTESTED'){
  fs.rmSync(staged.output_dir,{recursive:true,force:true});return stop('C90_SOURCE_GATE_'+(c90source.first_unclosed_edge||'INVALID'));
 }
 const output=path.join(staged.output_dir,'c84-source-package.json');
 try{const fd=fs.openSync(output,'wx',0o600);try{if(fs.writeSync(fd,raw)!==raw.length)throw Error('SHORT_WRITE');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  if(!fs.readFileSync(output).equals(raw))throw Error('C84_REOPEN');}
 catch(e){fs.rmSync(staged.output_dir,{recursive:true,force:true});return stop('C84_PACKAGE_WRITE_REOPEN_'+String(e?.message||e));}
 return {schema:'ikant-le-c94-auto-handoff/v1',status:'C94_C84_PACKAGE_REOPENED_C90_NOT_EXECUTED',
  source_head:sourceHead,manifest_sha256:proof.manifest_sha256,package_sha256:sha(raw),
  package_path:output,package_bytes:raw.length,staged_files:staged.files,
  github_actions_artifact_id:acquired.artifact_id,github_actions_run_id:acquired.run_id,
  physical_download_and_reopen:true,git_raw_objects_reconstructed:true,
  c71_generated_derivation_verified:true,cx_anchor_git_reachability_independently_verified:true,
  c81_executed:true,c85_executed:true,c90_source_gate_executed:true,
  c81_git_object_reachability_verified:true,host_origin_authenticated:false,c90_executed:false,
  native_chat_delivery_attested:false,active:false,authority:0};
}
