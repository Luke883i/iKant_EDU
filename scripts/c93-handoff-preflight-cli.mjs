import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {checkC93SourceEpoch} from '../host/c93-source-epoch.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const stop=e=>({schema:'ikant-le-c93-local-handoff/v1',status:'C93_HANDOFF_STOP',first_unclosed_edge:e,git_origin_attested:false,c81_reachability_attested:false,c78_dispatched:false,active:false,authority:0});
/** Physical receiver preflight: exact file readback, NO synthetic selection, owner or GitHub ref witness. */
export function inspectC93Handoff(packagePath,head){
 if(typeof packagePath!=='string'||!path.isAbsolute(packagePath)||!/^[a-f0-9]{40}$/.test(head||''))return stop('ABSOLUTE_PATH_AND_HEAD');
 let bytes;try{
  const stat=fs.lstatSync(packagePath);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size<100||stat.size>6_000_000)return stop('REAL_REGULAR_PACKAGE_REQUIRED');
  bytes=fs.readFileSync(packagePath);
 }catch{return stop('PACKAGE_NOT_ACCESSIBLE');}
 let p;try{p=JSON.parse(bytes.toString('utf8'));}catch{return stop('PACKAGE_JSON');}
 let manifest;try{manifest=Buffer.from(p.manifestBase64,'base64');}catch{return stop('MANIFEST_BYTES');}
 const q={sourceHead:head,packageBase64:bytes.toString('base64'),packageSha256:sha(bytes),manifestSha256:sha(manifest)};
 const result=checkC93SourceEpoch(q);
 if(result.status!=='C93_SOURCE_BYTES_BOUND_C81_STILL_REQUIRED')return stop(result.first_unclosed_edge);
 if(!fs.readFileSync(packagePath).equals(bytes))return stop('FILE_READBACK_CHANGED');
 return {schema:'ikant-le-c93-local-handoff/v1',status:'C93_HANDOFF_REOPENED_SOURCE_BYTES_NOT_EXECUTED',
  source_head:head,package_sha256:sha(bytes),manifest_sha256:sha(manifest),files:result.files,
  physically_read_and_reopened:true,git_origin_attested:false,c81_reachability_attested:false,
  c78_dispatched:false,host_selection_attested:false,native_delivery_attested:false,active:false,authority:0,
  first_unclosed_edge:'C81_RAW_GIT_SOURCE_PROOF_AND_C72_SELECTION'};
}
if(process.argv[1]?.endsWith('/c93-handoff-preflight-cli.mjs')){
 const x=inspectC93Handoff(process.argv[2],process.argv[3]);
 console.log(JSON.stringify(x));if(x.status!=='C93_HANDOFF_REOPENED_SOURCE_BYTES_NOT_EXECUTED')process.exitCode=2;
}
