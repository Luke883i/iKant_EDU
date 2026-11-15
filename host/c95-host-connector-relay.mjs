import crypto from 'node:crypto';
import {buildC94C84AutoPackage} from './c94-auto-artifact-carrier.mjs';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const permitted=/^\/(?:git\/ref\/heads\/main|git\/commits\/[a-f0-9]{40}|git\/trees\/[a-f0-9]{40}|actions\/workflows\/c77-standalone-capsule\.yml\/runs\?branch=main&status=completed&per_page=[0-9]{1,2}|actions\/runs\/[1-9][0-9]*\/artifacts\?per_page=100)$/;
const artifactPath=/^\/actions\/artifacts\/([1-9][0-9]*)\/zip$/;
const stop=edge=>({schema:'ikant-le-c95-host-connector-relay/v1',status:'C95_HOST_RELAY_STOP',first_unclosed_edge:edge,host_authenticated_origin:false,actual_github_provider_attested:false,c81_verified:false,active:false,native_delivery_attested:false});
const keys=(x,k)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===k.sort().join(',');
/** Required host capabilities are injectable only by an installed, real bridge.
 * No implicit conversion from a ChatGPT connector to Node, no model-provided
 * names/tokens, no guessed permissions, no native-delivery receipt. */
export function adaptC95HostConnector({readGithubJSON,readGithubArtifactBase64}={}){
 if(typeof readGithubJSON!=='function'||typeof readGithubArtifactBase64!=='function')return null;
 return Object.freeze({
  async json(path){
   if(typeof path!=='string'||!permitted.test(path))throw Error('C95_UNAUTHORIZED_GET_PATH');
   const value=await readGithubJSON(path);
   if(!value||typeof value!=='object'||Array.isArray(value))throw Error('C95_GITHUB_JSON_SHAPE');
   return value;
  },
  async bytes(path){
   const match=typeof path==='string'&&path.match(artifactPath);
   if(!match)throw Error('C95_ARTIFACT_PATH');
   const raw=await readGithubArtifactBase64({artifact_id:Number(match[1])});
   if(!keys(raw,['contentBase64','artifact_id'])||raw.artifact_id!==Number(match[1])||
      typeof raw.contentBase64!=='string'||raw.contentBase64.length<100||raw.contentBase64.length>6800000||
      raw.contentBase64.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(raw.contentBase64))throw Error('C95_ARTIFACT_TRANSFER_SHAPE');
   const bytes=Buffer.from(raw.contentBase64,'base64');
   if(bytes.length>5000000||bytes.toString('base64')!==raw.contentBase64)throw Error('C95_UNCANONICAL_ARTIFACT_BYTES');
   return bytes;
  }
 });
}
/** This executes C94+C85+C81+C90-source and returns a LOCAL path only.
 * A connector-backed read is not an authenticated host event, model provider or UI. */
export async function acquireC95FromInstalledBridge({sourceHead,hostBridge,parentDir}={}){
 if(!/^[a-f0-9]{40}$/.test(sourceHead||''))return stop('C95_FROZEN_HEAD');
 const client=adaptC95HostConnector(hostBridge);
 if(!client)return stop('HOST_GITHUB_CONNECTOR_TO_NODE_HOOK_NOT_INSTALLED');
 const r=await buildC94C84AutoPackage({sourceHead,client,parentDir});
 if(r.status!=='C94_C84_PACKAGE_REOPENED_C90_NOT_EXECUTED')return stop(r.first_unclosed_edge||'C95_C84_OWNER_SOURCE_UNAVAILABLE');
 if(r.c81_executed!==true||r.c85_executed!==true||r.c90_source_gate_executed!==true)return stop('C95_C85_C81_C90_PROOF_MISSING');
 return {schema:'ikant-le-c95-host-connector-relay/v1',status:'C95_CONNECTOR_BYTES_IN_NODE_VERIFIED_NOT_OWNER_EXECUTED',source_head:sourceHead,
  package_path:r.package_path,package_sha256:r.package_sha256,manifest_sha256:r.manifest_sha256,
  c81_reachability_executed:true,c85_executed:true,c90_source_gate_executed:true,
  host_authenticated_origin:false,native_delivery_attested:false,owner_executed:false,active:false,
  first_unclosed_edge:'C90_ACTUAL_SAME_TURN_OWNER_EXECUTION'};
}
