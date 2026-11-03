#!/usr/bin/env node
/**
 * Read-only GitHub repository-ID cutover/source gate.
 * CANDIDATE: PR checkout readback, not main / admin authorization.
 * MAIN_PRE: old-name main source consistency.
 * MAIN_POST: new-name main source consistency after actual admin cutover.
 * All modes report rename_go=false: no native owner, human/provider/consumer
 * attestation is minted by source code, CI, a hash or this Host tool.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const REPOSITORY_ID=1371330383;
export const OLD='Luke883i/iKant_LE',NEW='Luke883i/iKant_EDU';
export const H40=/^[a-f0-9]{40}$/;
export const CAPSULE=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(ROOT,p));
const JSONFILE=p=>JSON.parse(read(p).toString('utf8'));
const git=(...args)=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8'}).trim();
const blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const stop=(edge,extra={})=>Object.freeze({ok:false,edge,authority:0,rename_go:false,
 original_owner_invoked:false,provider_prompt_installed:'UNKNOWN',
 human_admin_authorized:'UNKNOWN',external_consumers_closed:'UNKNOWN',...extra});
export function evaluateCutoverSource(x){
 if(!x||typeof x!=='object'||Array.isArray(x))return stop('CUTOVER_INPUT_INVALID');
 if(!['CANDIDATE','MAIN_PRE','MAIN_POST'].includes(x.mode))return stop('CUTOVER_PHASE_INVALID');
 if(x.remote_id!==REPOSITORY_ID)return stop('REPOSITORY_ID_DRIFT');
 const expected=x.mode==='MAIN_POST'?NEW:OLD;
 if(x.remote_name!==expected)return stop('GITHUB_NAME_PHASE_MISMATCH');
 if(x.branch!=='main')return stop('GITHUB_DEFAULT_BRANCH_MISMATCH');
 if(!H40.test(x.local_head||'')||!H40.test(x.local_tree||''))
  return stop('LOCAL_HEAD_TREE_UNREADABLE');
 if(x.bootstrap_repository!==expected||x.admission_repository!==expected||
    x.c72_repository!==expected||x.c72_repository_id!==REPOSITORY_ID)
  return stop('ORIGINAL_SOURCE_NAME_CONFLICT');
 if(x.mode==='CANDIDATE'){
  if(x.remote_main_head!==null||x.remote_main_tree!==null)
   return stop('CANDIDATE_CANNOT_CLAIM_MAIN_SOURCE');
 }else if(x.remote_main_head!==x.local_head||x.remote_main_tree!==x.local_tree)
  return stop('GITHUB_MAIN_HEAD_TREE_STALE');
 if(x.prompt_source_id_present!==true||x.prompt_installed_equivalence_claim!==false)
  return stop('PROMPT_SOURCE_OR_PROVIDER_CLAIM_INVALID');
 if(x.originals_git_sha_verified!==true)return stop('ORIGINAL_GIT_BYTES_UNVERIFIED');
 return Object.freeze({ok:true,status:x.mode==='CANDIDATE'?
  'CANDIDATE_SOURCE_COHERENT_NOT_MAIN_OR_RENAME_GO':
  'MAIN_SOURCE_COHERENT_REQUIRES_NATIVE_OWNER_HUMAN_PROVIDER',
  expected_name:expected,source_head:x.local_head,source_tree:x.local_tree,
  original_owner_invoked:false,provider_prompt_installed:'UNKNOWN',
  human_admin_authorized:'UNKNOWN',external_consumers_closed:'UNKNOWN',
  zero_gap_atomicity_proven:false,authority:0,rename_go:false,active:false});
}
async function getJson(url){
 return await new Promise((resolve,reject)=>{
  const headers={'User-Agent':'ikant-original-source-cutover','Accept':'application/vnd.github+json',
   'X-GitHub-Api-Version':'2022-11-28'};
  if(process.env.GITHUB_TOKEN)headers.Authorization='Bearer '+process.env.GITHUB_TOKEN;
  const req=https.get(url,{headers,timeout:12000},res=>{
   if(res.statusCode!==200){res.resume();reject(Error('GITHUB_HTTP_'+res.statusCode));return}
   let body='';res.setEncoding('utf8');
   res.on('data',part=>{body+=part;if(body.length>120000)req.destroy(Error('GITHUB_READ_TOO_LARGE'))});
   res.on('end',()=>{try{resolve(JSON.parse(body))}catch{reject(Error('GITHUB_JSON_INVALID'))}});
  });
  req.on('timeout',()=>req.destroy(Error('GITHUB_TIMEOUT')));
  req.on('error',reject);
 });
}
export async function auditCutover({mode='CANDIDATE'}={}){
 const localHead=git('rev-parse','HEAD'),localTree=git('rev-parse','HEAD^{tree}');
 const names=['BOOTSTRAP.json','ADMISSION.json','contracts/c72-public-mode-admission-v2.json'];
 const originalPaths=[...CAPSULE,...names.filter(p=>!CAPSULE.includes(p)),'project/session-chat/PROMPT.txt'];
 const blobs=originalPaths.map(p=>({path:p,git_blob_sha1:blob(read(p)),git_head_blob_sha1:git('rev-parse','HEAD:'+p)}));
 const originalsOK=blobs.every(x=>x.git_blob_sha1===x.git_head_blob_sha1);
 const b=JSONFILE(names[0]),a=JSONFILE(names[1]),c=JSONFILE(names[2]);
 const prompt=read('project/session-chat/PROMPT.txt').toString('utf8');
 const meta=await getJson('https://api.github.com/repositories/'+REPOSITORY_ID);
 let remoteHead=null,remoteTree=null;
 if(mode==='MAIN_PRE'||mode==='MAIN_POST'){
  const ref=await getJson('https://api.github.com/repos/'+meta.full_name+'/git/ref/heads/main');
  remoteHead=ref.object?.sha||null;
  if(H40.test(remoteHead||'')){
   const commit=await getJson('https://api.github.com/repos/'+meta.full_name+'/git/commits/'+remoteHead);
   remoteTree=commit.tree?.sha||null;
  }
 }
 const input={mode,remote_id:meta.id,remote_name:meta.full_name,branch:meta.default_branch,
  local_head:localHead,local_tree:localTree,remote_main_head:remoteHead,remote_main_tree:remoteTree,
  bootstrap_repository:b.canonical_repository,admission_repository:a.repository,
  c72_repository:c.source_identity?.canonical_repository,c72_repository_id:c.source_identity?.repository_id,
  prompt_source_id_present:prompt.includes('GitHub ID 1371330383'),
  prompt_installed_equivalence_claim:false,originals_git_sha_verified:originalsOK};
 const result=evaluateCutoverSource(input);
 return {schema:'ikant-source-cutover-provider-readback/v1',mode,repository_id:REPOSITORY_ID,
  git_local:{head:localHead,tree:localTree,originals:blobs},
  github_api:{id:meta.id,full_name:meta.full_name,default_branch:meta.default_branch,
   main_head:remoteHead,main_tree:remoteTree},
  original_names:{bootstrap:input.bootstrap_repository,admission:input.admission_repository,
   c72:input.c72_repository},decision:result,installed_prompt_equivalence:'UNKNOWN',
  native_owner_receipts:'NOT_PROBED',two_independent_reviews:'NOT_PROVED',
  admin_rename_performed:false,external_closure:'USER_MANUAL_NOT_ATTESTED',
  zero_gap_atomicity_proven:false,rename_go:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const mode=process.argv[2]||'CANDIDATE';
 const report=await auditCutover({mode});
 const output=JSON.stringify(report,null,2)+'\n';
 const file=process.argv[3];
 if(file){
  if(fs.existsSync(file)||!fs.existsSync(path.dirname(file)))throw Error('FRESH_PRIVATE_REPORT_REQUIRED');
  fs.writeFileSync(file,output,{flag:'wx',mode:0o600});
  if(fs.readFileSync(file,'utf8')!==output)throw Error('REPORT_READBACK_FAILED');
 }
 process.stdout.write(output);
 if(!report.decision.ok)process.exitCode=1;
}
