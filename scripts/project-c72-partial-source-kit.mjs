#!/usr/bin/env node
/** Builds a DATA-ONLY, partial C72 source kit from original Git objects.
 * Release kit is no consent, code installer, owner receipt or source attestation.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {C72_COLDSTART_FILES} from '../host/project-c72-coldstart-seed.mjs';
const git=(...args)=>execFileSync('git',args,{maxBuffer:2000000});
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
export function buildPartialKit({head=git('rev-parse','HEAD').toString('utf8').trim()}={}){
 if(!/^[a-f0-9]{40}$/.test(head))throw Error('C72_KIT_HEAD_INVALID');
 const files=C72_COLDSTART_FILES.map(p=>{
  const b=git('show',head+':'+p);
  const id=git('rev-parse',head+':'+p).toString('utf8').trim();
  if(sha(b)!==id)throw Error('C72_KIT_BLOB_MISMATCH:'+p);
  return {path:p,blob_sha1:id,contentBase64:b.toString('base64')};
 });
 const later=git('show',head+':scripts/project-c72-cold-mode-cli.mjs');
 const laterId=git('rev-parse',head+':scripts/project-c72-cold-mode-cli.mjs').toString('utf8').trim();
 if(sha(later)!==laterId)throw Error('C72_LATER_CLI_BLOB_DRIFT');
 const seed=git('show',head+':host/project-c72-coldstart-seed.mjs');
 const seedId=git('rev-parse',head+':host/project-c72-coldstart-seed.mjs').toString('utf8').trim();
 if(sha(seed)!==seedId)throw Error('C72_KIT_SEED_DRIFT');
 return {schema:'ikant-host-c72-partial-source-kit/v1',source_head:head,
  instructions:'DATA_ONLY. After later exact I ACCEPT, Host independently rechecks live main HEAD and eight original GitHub API blobs, then invokes unchanged C72/v2. No origin or consent is attested by this kit.',
  no_authority:true,native_event_attested:false,owner_invoked:false,active:false,
  seed:{path:'host/project-c72-coldstart-seed.mjs',blob_sha1:seedId,contentBase64:seed.toString('base64')},
  later_mode_cli:{path:'scripts/project-c72-cold-mode-cli.mjs',blob_sha1:laterId,contentBase64:later.toString('base64')},
  files};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const [head,dest]=process.argv.slice(2);
  if(!head||!dest||fs.existsSync(dest))throw Error('USAGE: node scripts/project-c72-partial-source-kit.mjs HEAD FRESH_DEST.json');
  const kit=buildPartialKit({head});
  fs.writeFileSync(dest,JSON.stringify(kit)+'\n',{flag:'wx',mode:0o600});
  const bytes=fs.readFileSync(dest),again=JSON.parse(bytes);
  if(again.source_head!==head||again.files.length!==C72_COLDSTART_FILES.length)
   throw Error('C72_KIT_READBACK_INVALID');
  process.stdout.write(JSON.stringify({ok:true,source_head:head,path:dest,
   file_count:again.files.length,bytes:bytes.length,
   sha256:createHash('sha256').update(bytes).digest('hex'),
   authority:0,active:false,native_origin_attested:false})+'\n');
 }catch(e){process.stderr.write(String(e.message)+'\n');process.exitCode=1;}
}
