#!/usr/bin/env node
/** Read-only post-rename source/Host/owner boundary auditor.
 * A SOURCE check is NOT a native provider or original-owner receipt.
 * Never triggers C72, C135, C87, C125/S03, consent, writes or retries. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const CANONICAL='Luke883i/iKant_EDU';
export const REPOSITORY_ID=1371330383;
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const BLOB=/^[a-f0-9]{40}$/u;
const SOURCE=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
 'contracts/c72-public-mode-admission-v2.json','contracts/orientation-capsule.json',
 'project/session-chat/PROMPT.txt'];
function stop(first_edge,observed={}){
 return Object.freeze({ok:false,status:'STOP',first_edge,authority:0,
  source_bound:false,installed_prompt_equivalence:'UNKNOWN',
  original_owner_invoked:false,provider_delivery_attested:false,
  active:false,observed});
}
export function evaluatePESingleSource(q={}){
 if(q.repo_id!==REPOSITORY_ID||q.repo_name!==CANONICAL||q.branch!=='main')
  return stop('PE_REPO_ID_OR_NAME_NOT_CURRENT');
 if(!BLOB.test(q.head||'')||!BLOB.test(q.tree||'')||q.tree_complete!==true)
  return stop('PE_GIT_HEAD_TREE_NOT_VERIFIED');
 if(q.bootstrap_repository!==CANONICAL||q.admission_repository!==CANONICAL||
    q.c72_repository!==CANONICAL||q.orientation_repository!=='https://github.com/'+CANONICAL)
  return stop('RENAME_SOURCE_CUTOVER_INCOMPLETE',{
   bootstrap:q.bootstrap_repository,admission:q.admission_repository,
   c72:q.c72_repository,orientation:q.orientation_repository});
 if(q.all_original_blobs_verified!==true)return stop('PE_ORIGINAL_GIT_BLOB_NOT_VERIFIED');
 if(q.prompt_source_matches_gate!==true)return stop('PE_PROMPT_NOT_DERIVED_FROM_SINGLE_PATH');
 if(q.original_pe_adapter_present!==true)return stop('PE_D123_ADAPTER_NOT_IN_SOURCE');
 if(q.original_runtime_loader_present!==true)return stop('PE_ORIGINAL_LOADER_NOT_BOUND');
 return Object.freeze({ok:true,status:'SOURCE_CONSISTENT_NOT_RUNTIME_ACTIVE',first_edge:'PE_PROVIDER_FIELD_NOT_ATTESTED',
  authority:0,source_bound:true,installed_prompt_equivalence:'UNKNOWN',
  original_owner_invoked:false,provider_delivery_attested:false,active:false,
  next:'Require original C72/EDU and C135-C87-C125/S03 receipts plus native provider and novice holdout'});
}
function git(...args){return execFileSync('git',args,{cwd:ROOT,encoding:'utf8',timeout:20000}).trim();}
function show(p){return execFileSync('git',['show','HEAD:'+p],{cwd:ROOT,timeout:20000,maxBuffer:6e6}).toString('utf8');}
export function auditLocalPE({observedGithubId=null,observedGithubName=null,observedGithubBranch='main'}={}){
 const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
 const boot=JSON.parse(show('BOOTSTRAP.json')),admission=JSON.parse(show('ADMISSION.json'));
 const c72=JSON.parse(show('contracts/c72-public-mode-admission-v2.json'));
 const orient=JSON.parse(show('contracts/orientation-capsule.json'));
 const prompt=show('project/session-chat/PROMPT.txt');
 const identity=SOURCE.map(p=>({path:p,blob_sha1:git('rev-parse','HEAD:'+p)}));
 const allOriginals=identity.every(x=>BLOB.test(x.blob_sha1));
 const manifest=JSON.parse(show('contracts/project-session-source.json'));
 const inputs={repo_id:observedGithubId,repo_name:observedGithubName,
  branch:observedGithubBranch,head,tree,tree_complete:true,
  bootstrap_repository:boot.canonical_repository,admission_repository:admission.repository,
  c72_repository:c72.source_identity?.canonical_repository,
  orientation_repository:orient.canonical_repository,
  all_original_blobs_verified:allOriginals,
  prompt_source_matches_gate:prompt.includes('GitHub ID 1371330383')&&
   prompt.includes('BOOTSTRAP/ADMISSION/C72'),
  original_pe_adapter_present:fs.existsSync(path.join(ROOT,'scripts/project-pe-original-bridge.mjs'))&&
   manifest.paths.includes('scripts/project-pe-original-bridge.mjs'),
  original_runtime_loader_present:manifest.paths.includes('scripts/project-repo-loader.mjs')};
 const decision=evaluatePESingleSource(inputs);
 return Object.freeze({schema:'ikant-pe-postrename-readonly-audit/v1',head,tree,
  witness_source:'GIT_LOCAL_ONLY_PLUS_EXPLICIT_GITHUB_IDENTITY_INPUT',
  originals:identity,decision});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=auditLocalPE({observedGithubId:Number(process.env.IKANT_OBSERVED_GITHUB_ID||0),
  observedGithubName:process.env.IKANT_OBSERVED_GITHUB_NAME||null});
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
 if(!result.decision.ok)process.exitCode=2;
}
