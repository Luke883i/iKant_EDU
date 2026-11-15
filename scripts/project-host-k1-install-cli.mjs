#!/usr/bin/env node
/** K1 local installation from an exact Git commit into a private Node directory.
 * NO ChatGPT provider registration, human event, C72 or runtime owner.
 * This installer is deliberately checkout-dependent: it qualifies the software
 * closure on a real source host, NOT GitHub connector -> ChatGPT binding.
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

export const K1_INSTALL_FILES=Object.freeze([
 'host/project-host-k1-preowner.mjs',
 'host/project-host-effect-decision.mjs',
 'host/project-edu-h1-bound-port.mjs',
 'host/project-c72-e16-unified-ingress.mjs',
 'host/project-c72-coldstart-seed.mjs',
 'host/project-c72-transport-frontier.mjs',
 'host/project-c72-negative-entry.mjs',
 'host/project-oneshell-irred-e15.mjs',
 'host/project-c72-receipt-transit.mjs',
 'host/project-c72-postaccept-reentry.mjs',
 'host/c72-public-mode-admission.mjs',
 'contracts/c72-public-mode-admission-v2.json'
]);
const SHA=/^[0-9a-f]{40}$/u;
const gitblob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const stop=edge=>Object.freeze({ok:false,kind:'STOP',edge,authority:0,original_owner_invoked:false,
 provider_installation_attested:false,source_origin_attested:false});
function git(repo,...args){return execFileSync('git',args,{cwd:repo,maxBuffer:850000,timeout:15000});}
export function installK1Private({repo,head,target}={}){
 if(typeof repo!=='string'||typeof target!=='string'||!path.isAbsolute(repo)||!path.isAbsolute(target)||!SHA.test(head||''))
  return stop('K1_INSTALL_INPUT_INVALID');
 const base=path.resolve(repo),destination=path.resolve(target);
 if(destination!==target||destination===base||destination.startsWith(base+path.sep))
  return stop('K1_INSTALL_TARGET_INVALID');
 try{
  if(!fs.lstatSync(base).isDirectory()||fs.realpathSync(base)!==base)
   return stop('K1_INSTALL_SOURCE_UNSAFE');
  if(git(base,'rev-parse',head+'^{commit}').toString().trim()!==head)
   return stop('K1_INSTALL_COMMIT_NOT_FOUND');
  if(fs.existsSync(destination))return stop('K1_INSTALL_TARGET_ALREADY_EXISTS');
  // Full prevalidation BEFORE writing anything, to avoid incomplete packages.
  const original=[];
  for(const p of K1_INSTALL_FILES){
   const expected=git(base,'rev-parse',head+':'+p).toString().trim();
   if(!SHA.test(expected))return stop('K1_INSTALL_PATH_MISSING:'+p);
   const tree=git(base,'ls-tree',head,'--',p).toString('utf8');
   if(!/^10064[4] blob [0-9a-f]{40}\t/.test(tree))
    return stop('K1_INSTALL_NONREGULAR_FILE:'+p);
   const bytes=git(base,'show',head+':'+p);
   if(bytes.length===0||bytes.length>256000||gitblob(bytes)!==expected)
    return stop('K1_INSTALL_SOURCE_SHA_MISMATCH:'+p);
   original.push({p,bytes,sha:expected});
  }
  fs.mkdirSync(destination,{mode:0o700});
  const installed=[];
  for(const item of original){
   const file=path.join(destination,item.p);
   fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
   const fd=fs.openSync(file,'wx',0o600);
   try{fs.writeSync(fd,item.bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
   const st=fs.lstatSync(file);
   if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||(st.mode&0o077)!==0||
      gitblob(fs.readFileSync(file))!==item.sha)
    return stop('K1_INSTALL_READBACK_FAILED:'+item.p);
   installed.push({path:item.p,git_blob_sha1:item.sha,byte_count:item.bytes.length});
  }
  return Object.freeze({ok:true,kind:'K1_PRIVATE_NODE_INSTALLATION_ONLY',
   source_head:head,installation_directory:destination,files_installed:installed.length,
   installed,authority:0,original_owner_invoked:false,provider_installation_attested:false,
   native_event_attested:false,source_origin_attested:false,
   edge:'K1_CHATGPT_PROVIDER_REGISTRATION_NOT_ATTESTED'});
 }catch(e){return stop('K1_INSTALL_UNKNOWN:'+String(e?.code||e?.message||'UNKNOWN').replace(/[^A-Za-z0-9_:]/g,'_').slice(0,75));}
}
if(process.argv[1]&&process.argv[1].endsWith('/project-host-k1-install-cli.mjs')){
 const v=process.argv;
 const result=installK1Private({repo:v[v.indexOf('--repo')+1],head:v[v.indexOf('--head')+1],target:v[v.indexOf('--target')+1]});
 process.stdout.write(JSON.stringify(result)+'\n');
 if(result.ok!==true)process.exitCode=2;
}
