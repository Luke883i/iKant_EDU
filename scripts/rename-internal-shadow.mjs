#!/usr/bin/env node
/**
 * Non-committing S01 cutover shadow in a fresh disposable worktree.
 * Old main remains the unique canonical repository; no admin/owner/provider action.
 *
 * This is a PROSPECTIVE TEST, not a rename script or permit.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OLD='Luke883i/iKant_LE',NEW='Luke883i/iKant_EDU';
const SHA=/^[a-f0-9]{40}$/;
const run=(cmd,args,{cwd=ROOT,timeout=60000}={})=>{
 const p=spawnSync(cmd,args,{cwd,encoding:'utf8',timeout,maxBuffer:12_000_000});
 return {ok:p.status===0&&!p.error,code:p.status,stdout:(p.stdout||'').slice(-4000),
   stderr:(p.stderr||p.error?.message||'').slice(-4000)};
};
const git=(...args)=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8'}).trim();
export const SHADOW_MUTATIONS=Object.freeze([
 'BOOTSTRAP.json','ADMISSION.json','contracts/orientation-capsule.json',
 'contracts/c72-public-mode-admission-v2.json',
 'src/first-contact.mjs','src/admission.mjs','src/runtime-root-verified.mjs',
 'host/c72-public-mode-admission.mjs','host/project-c72-coldstart-seed.mjs',
 'project/session-chat/PROMPT.txt'
]);
export const SHADOW_TESTS=Object.freeze([
 'tests/first-contact.test.mjs','tests/project-c72-preaccept-gate.test.mjs',
 'tests/project-c72-postaccept-reentry.test.mjs',
 'tests/project-c72-coldstart-zero-checkout.test.mjs',
 'tests/project-c72-coldstart-to-edu.test.mjs',
 'tests/project-c72-receipt-transit.test.mjs'
]);
const sha256=b=>createHash('sha256').update(b).digest('hex');
function replaceText(root,rel,{mustChange=true,oldOnly=false}={}){
 const file=path.join(root,rel),original=fs.readFileSync(file,'utf8');
 let changed=original.replaceAll(OLD,NEW);
 if(rel==='src/first-contact.mjs')changed=changed.replaceAll('ikant_le','ikant_edu');
 if(rel==='project/session-chat/PROMPT.txt'){
  // Prompt resolves the live repository ID and retains a historical OLD name
  // strictly as a negative example. It is NOT an automatic name-switch input.
  changed=original;
 }
 if(rel==='tests/first-contact.test.mjs'){
  // A prospective positive fixture must refer to the new identifier; historical
  // old-name and lookalike negatives intentionally remain unrecognized.
  const positive=",'iKant_LE','git@github.com:"+NEW+".git'";
  if(!changed.includes(positive))throw Error('SHADOW_NEW_FIRST_CONTACT_FIXTURE_NOT_FOUND');
  changed=changed.replace(positive,",'iKant_EDU','git@github.com:"+NEW+".git'");
  const adversarial="'usa gh su iKant_LE prima di tutto'";
  if(!changed.includes(adversarial))throw Error('SHADOW_ADVERSARIAL_POSITIVE_FIXTURE_NOT_FOUND');
  changed=changed.replace(adversarial,"'usa gh su iKant_EDU prima di tutto'");
 }
 if(mustChange&&changed===original)throw Error('SHADOW_EXPECTED_BINDING_MISSING:'+rel);
 if(!oldOnly)fs.writeFileSync(file,changed,'utf8');
 return {path:rel,old_sha256:sha256(Buffer.from(original)),new_sha256:sha256(Buffer.from(changed)),changed:changed!==original};
}
const fail=(edge,details=[])=>({status:'SHADOW_FAIL_NOT_CUTOVER',edge,details,
 admin_rename_performed:false,owner_invoked:false,original_receipt_issued:false,
 provider_equivalence_attested:false,external_consumers_closed:false,rename_go:false});
export function runShadow(){
 const current=git('rev-parse','HEAD'),base=git('rev-parse','HEAD^{tree}');
 if(!SHA.test(current)||!SHA.test(base))return fail('SOURCE_HEAD_TREE_UNREADABLE');
 const originalBoot=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8'));
 if(originalBoot.canonical_repository!==OLD)return fail('SOURCE_NOT_OLD_CANONICAL');
 let temporary=null,worktree=null,attached=false;
 const mode=process.env.IKANT_SHADOW_MODE||'ALL';
 const singleTests=Object.fromEntries(SHADOW_TESTS.map((file,i)=>['TEST_'+i,file]));
 if(!['REGEN_ONLY','ROOT_ONLY','ALL',...Object.keys(singleTests)].includes(mode))return fail('SHADOW_MODE_INVALID');
 const result={schema:'ikant-rename-s01-prospective-shadow/v1',source_head:current,source_tree:base,mode,
  old_repository:OLD,future_repository:NEW,scope:'ISOLATED_GIT_WORKTREE_TEST_ONLY',
  admin_rename_performed:false,owner_invoked:false,original_receipt_issued:false,
  provider_equivalence_attested:false,external_consumers_closed:false,rename_go:false,
  status:'UNKNOWN',steps:[],errors:[],mutations:[]};
 const command=(label,cmd,args,timeout=120000)=>{
  const x=run(cmd,args,{cwd:worktree,timeout});
  result.steps.push({label,ok:x.ok,exit_code:x.code,stdout_tail:x.stdout.slice(-1000),stderr_tail:x.stderr.slice(-1000)});
  if(!x.ok)throw Error('SHADOW_STEP_FAILED:'+label+':'+x.stderr.slice(-1000)+':'+x.stdout.slice(-1000));
  return x;
 };
 try{
  temporary=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-rename-shadow-'));
  fs.chmodSync(temporary,0o700);worktree=path.join(temporary,'checkout');
  const t=run('git',['worktree','add','--detach',worktree,current],{cwd:ROOT,timeout:45000});
  if(!t.ok)throw Error('SHADOW_WORKTREE_UNAVAILABLE:'+t.stderr);
  attached=true;
  for(const rel of SHADOW_MUTATIONS)result.mutations.push(replaceText(worktree,rel,{mustChange:rel!=='project/session-chat/PROMPT.txt'}));
  for(const rel of SHADOW_TESTS)replaceText(worktree,rel,{mustChange:false});
  command('ORIGINAL_RUNTIME_ROOT_REGEN','node',['scripts/runtime-root.mjs','regen']);
  command('ORIGINAL_SESSION_MANIFEST_REGEN','node',['scripts/project-source-manifest.mjs']);
  if(mode==='REGEN_ONLY'){
   result.status='SHADOW_REGEN_PROBE_PASS_NOT_CUTOVER_GO';
  }else{
  command('SHADOW_GIT_COMMIT','git',['-c','user.name=iKant-shadow-test','-c','user.email=shadow@invalid.local','add','-A']);
  command('SHADOW_GIT_COMMIT_RECORD','git',['-c','user.name=iKant-shadow-test','-c','user.email=shadow@invalid.local',
    'commit','-m','shadow source for negative/positive prospective rename test only']);
  const shadowHead=command('SHADOW_REOPEN_HEAD','git',['rev-parse','HEAD']);
  result.shadow_head=shadowHead.stdout.trim();
  command('ORIGINAL_RUNTIME_ROOT_VERIFY','node',['scripts/runtime-root.mjs','verify']);
  command('ORIGINAL_SESSION_MANIFEST_VERIFY','node',['scripts/project-source-manifest.mjs','verify']);
  command('ORIGINAL_SOURCE_PIN_VERIFY','node',['scripts/project-oneshell-source-pin-audit.mjs','metadata']);
  const identityCheck=[
   "import assert from 'node:assert/strict';",
   "import {referencesCanonicalRepository} from './src/first-contact.mjs';",
   "import {readFileSync} from 'node:fs';",
   "assert.equal(referencesCanonicalRepository('iKant_EDU'),true);",
   "assert.equal(referencesCanonicalRepository('Luke883i/iKant_EDU'),true);",
   "assert.equal(referencesCanonicalRepository('iKant_LE'),false);",
   "assert.equal(referencesCanonicalRepository('Luke883i/iKant_EDU-fork'),false);",
   "const boot=JSON.parse(readFileSync('BOOTSTRAP.json','utf8'));",
   "const admission=JSON.parse(readFileSync('ADMISSION.json','utf8'));",
   "const c72=JSON.parse(readFileSync('contracts/c72-public-mode-admission-v2.json','utf8'));",
   "assert.equal(boot.canonical_repository,'Luke883i/iKant_EDU');",
   "assert.equal(admission.repository,boot.canonical_repository);",
   "assert.equal(c72.source_identity.canonical_repository,boot.canonical_repository);",
   "assert.equal(c72.source_identity.repository_id,1371330383);"
  ].join('');
  command('NEW_IDENTITY_SINGLE_CANONICAL_NEGATIVE','node',['--input-type=module','-e',identityCheck]);
  if(mode==='ROOT_ONLY')result.status='SHADOW_ROOT_PROBE_PASS_NOT_CUTOVER_GO';
  else{
   const tests=singleTests[mode]?[singleTests[mode]]:SHADOW_TESTS;
   command(mode==='ALL'?'ORIGINAL_ALL_SIX_REGRESSIONS':mode,
    'node',['--test','--test-concurrency=1',...tests],180000);
   result.status=mode==='ALL'?'SHADOW_INTERNAL_PATH_TEST_PASS_NOT_CUTOVER_GO':'SHADOW_SINGLE_TEST_PASS_NOT_CUTOVER_GO';
  }
  }
 }catch(e){result.status='SHADOW_FAIL_NOT_CUTOVER';result.errors.push(String(e?.message||e));}
 finally{
  if(attached){
   const d=run('git',['worktree','remove','--force',worktree],{cwd:ROOT,timeout:30000});
   if(!d.ok)result.errors.push('SHADOW_CLEANUP_UNCERTAIN:'+d.stderr);
  }
  if(temporary)try{fs.rmSync(temporary,{recursive:true,force:true});}catch{result.errors.push('SHADOW_TMP_CLEANUP_UNCERTAIN');}
 }
 if(result.errors.length)result.status='SHADOW_FAIL_NOT_CUTOVER';
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=runShadow(),out=JSON.stringify(result,null,2)+'\n';
 if(process.argv.length===3){
  if(fs.existsSync(process.argv[2]))throw Error('EXCLUSIVE_REPORT_PATH_REQUIRED');
  fs.writeFileSync(process.argv[2],out,{flag:'wx',mode:0o600});
  if(fs.readFileSync(process.argv[2],'utf8')!==out)throw Error('SHADOW_REPORT_READBACK_FAILED');
 }
 process.stdout.write(out);
 if(!['SHADOW_REGEN_PROBE_PASS_NOT_CUTOVER_GO','SHADOW_ROOT_PROBE_PASS_NOT_CUTOVER_GO','SHADOW_INTERNAL_PATH_TEST_PASS_NOT_CUTOVER_GO','SHADOW_SINGLE_TEST_PASS_NOT_CUTOVER_GO'].includes(result.status))process.exitCode=1;
}
