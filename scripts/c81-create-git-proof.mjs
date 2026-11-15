import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {verifyC81SourceReachability} from '../host/c81-git-source-reachability.mjs';

const ROOT=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(root,...args)=>execFileSync('git',args,{cwd:root,maxBuffer:2_000_000});
function safePath(p){
 return typeof p==='string'&&!p.includes('..')&&!p.includes('\\')&&!p.startsWith('/')&&
 /^[a-zA-Z0-9_.\/-]+$/.test(p);
}
/**
 * Local Git object proof producer. Requires an actual checked-out Git repo.
 * It is not an independent GitHub connector receipt.
 */
export function createC81LocalGitProof({manifestPath,repoRoot=ROOT}={}){
 if(typeof manifestPath!=='string'||!path.isAbsolute(manifestPath)||
    !path.isAbsolute(repoRoot))throw Error('C81_ABSOLUTE_PATHS_REQUIRED');
 const original=fs.readFileSync(manifestPath);
 if(original.length>120000)throw Error('C81_MANIFEST_OVERSIZE');
 const manifest=JSON.parse(original.toString('utf8'));
 const head=git(repoRoot,'rev-parse','HEAD').toString('utf8').trim();
 if(manifest.source_head!==head)throw Error('C81_CHECKOUT_SOURCE_HEAD_MISMATCH');
 const rootTree=git(repoRoot,'rev-parse','HEAD^{tree}').toString('utf8').trim();
 const treeIds=new Set([rootTree]);
 for(const f of manifest.files){
  if(!safePath(f.path)||!f.original_source_blob_sha1)continue;
  const segments=f.path.split('/');
  let name='';
  for(const seg of segments.slice(0,-1)){
   name+=(name?'/':'')+seg;
   const sha=git(repoRoot,'rev-parse','HEAD:'+name).toString('utf8').trim();
   treeIds.add(sha);
  }
 }
 const trees=[...treeIds].sort().map(id=>({
  sha1:id,content_base64:git(repoRoot,'cat-file','tree',id).toString('base64')}));
 const bundle={expectedSourceHead:head,expectedManifestSha256:sha256(original),
   manifestBase64:original.toString('base64'),
   commitBase64:git(repoRoot,'cat-file','commit',head).toString('base64'),
   treeObjects:trees};
 const validation=verifyC81SourceReachability(bundle);
 if(validation.status!=='C81_GIT_REACHABILITY_VERIFIED')
  throw Error('C81_SELF_REPRODUCTION_FAILED:'+validation.first_unclosed_edge);
 return {schema:'ikant-le-c81-source-git-objects/v1',
  verification:validation,proof:bundle,producer:'ACTUAL_LOCAL_GIT_CHECKOUT',
  github_native_origin_attested:false,authority:0,active:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const i=process.argv.indexOf('--manifest');
 if(i<0||!process.argv[i+1])throw Error('C81_USE --manifest /absolute/c77-manifest.json');
 const r=createC81LocalGitProof({manifestPath:process.argv[i+1]});
 if(process.argv.includes('--output')){
  const j=process.argv.indexOf('--output');
  if(!path.isAbsolute(process.argv[j+1]||''))throw Error('C81_OUTPUT_ABSOLUTE_REQUIRED');
  fs.writeFileSync(process.argv[j+1],JSON.stringify(r,null,2)+'\n',{flag:'wx',mode:0o600});
  process.stdout.write(JSON.stringify({schema:r.schema,verification:r.verification})+'\n');
 }else process.stdout.write(JSON.stringify(r)+'\n');
}
