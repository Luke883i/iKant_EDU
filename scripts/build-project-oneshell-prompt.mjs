#!/usr/bin/env node
import {assertSevenThreePrompt} from './project-prompt-seven-three-guard.mjs';
/** One exact Git HEAD -> immutable Project prompt artifacts; not an installer. */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const H40=/^[a-f0-9]{40}$/,sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',timeout:15000}).trim();
const original=p=>execFileSync('git',['show','HEAD:'+p],{timeout:15000,maxBuffer:5_000_000});
const blob=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const arg=f=>{const n=process.argv.indexOf(f);return n<0?null:process.argv[n+1]};
const mode=arg('--mode'),head=arg('--head'),tree=arg('--tree'),out=arg('--out');
if(process.argv.length!==10||!['candidate','canonical','portable'].includes(mode)||!H40.test(head||'')||
 !H40.test(tree||'')||typeof out!=='string')throw Error('PROMPT_ARGUMENTS_INVALID');
if(git('rev-parse','HEAD')!==head||git('rev-parse','HEAD^{tree}')!==tree)throw Error('STOP_SOURCE_LOCK_STALE');
// Only immutable Git HEAD blobs are read below; qualification outputs or dirty worktree\n// cannot change the generator input. Blob/readback locks are enforced per original.
const matrix=JSON.parse(original('contracts/project-prompt-generation.json'));
const route=JSON.parse(original('BOOTSTRAP.json')).project_session;
const promptRepository=JSON.parse(original('BOOTSTRAP.json')).canonical_repository;
if(!['Luke883i/iKant_LE','Luke883i/iKant_EDU'].includes(promptRepository))throw Error('PROMPT_REPOSITORY_UNQUALIFIED');
if(matrix.schema!=='ikant-le-project-prompt-generation/v1'||
 matrix.source_prompt!==route.prompt||matrix.runtime_owner!==route.runtime_entry||
 matrix.oneshell_contract!==route.oneshell_contract||
 route.local_bundle_required!==false||route.manual_edu_handoff?.post_mode_only!==true||
 route.manual_edu_handoff?.canonical_active_authority!==false)throw Error('PROMPT_ROUTE_DRIFT');
// Non-authoritative, AFTER-EDU Host plan: exact HEAD blob, never a new receipt store.
if(matrix.host_followthrough_contract!=='contracts/project-host-followthrough.json'||
 route.host_followthrough_contract!==matrix.host_followthrough_contract||
 route.host_followthrough_rule!=='READONLY_AFTER_MODE_OWNER_READBACK_FIRST_NO_NEW_PERSISTENCE_OR_AUTHORITY'||
 matrix.host_followthrough_policy!=='HOST_READONLY_FROM_ORIGINAL_RECEIPTS_NOT_STORAGE'||
 matrix.postmerge_human_trigger!=='PR merged')
 throw Error('HOST_FOLLOWTHROUGH_ROUTE_DRIFT');
const memoryBytes=original(matrix.host_followthrough_contract);
const memory=JSON.parse(memoryBytes);
if(blob(memoryBytes)!==git('rev-parse','HEAD:'+matrix.host_followthrough_contract)||
 memory.schema!=='ikant-le-project-host-followthrough/v1'||memory.authority!==0||
 memory.not_persistent_storage!==true||memory.evidence_policy?.no_new_C72_C59_C135_C87_C125_owner!==true||
 memory.canonical_status!=='LEGACY_UNQUALIFIED_STOP_NOT_EDU_NOT_ACTIVE'||
 !Array.isArray(memory.steps)||memory.steps.length!==12||
 new Set(memory.steps.map(x=>x.id)).size!==12)
 throw Error('HOST_FOLLOWTHROUGH_OWNERLESS_GUARD');
const CRITICAL=['contracts/project-oneshell-compact-continuity.json',
 'contracts/project-oneshell-visual-v2.json'];
if(JSON.stringify(matrix.head_critical_contracts)!==JSON.stringify(CRITICAL)||
 matrix.runtime_head_preflight!=='AFTER_ORIGINAL_C72_MODE_GATE_BEFORE_EDU_MATERIALIZATION'||
 matrix.orientation_read_scope!=='ONLY_HEAD_AND_FIVE_PINNED_DOCUMENTS_PREACCEPT_NO_TREE_OR_BLOBS'||
 matrix.installed_prompt_equality!=='ONLY_IF_ACTUAL_PROJECT_PROMPT_BYTES_ACCESSIBLE_ELSE_UNKNOWN'||
 matrix.explicit_repin!=='FRESH_C72_REQUIRED_NO_RECEIPT_OR_C135_TRANSFER'||
 matrix.host_engineering_route!=='EXPLICIT_HUMAN_REQUEST_INDEPENDENT_NO_C72_NO_IKANT_STATE_TRANSFER'||
 matrix.orientation_witness!=='FIVE_BLOB_SHA1_CAPTURED_IN_FIRST_TURN_BEFORE_TERMS_FREEZE'||
 matrix.postaccept_auto_execution!=='AUTO_MUST_BE_EXECUTED_AND_OBSERVED_NOT_TERMINAL_STOP'||
 matrix.postaccept_executor!=='host/project-c72-host-recovery.mjs#executeC72PostAcceptRecovery'||
 matrix.bridge_unbound!=='C72_SOURCE_BRIDGE_UNBOUND_NOT_PROVEN_UNAVAILABLE'||
 matrix.host_port_standard!=='contracts/project-host-capability-port.json'||
 matrix.host_port_adapter!=='host/project-c72-capability-port.mjs#bindC72Transport'||
 matrix.host_port_cli!=='scripts/project-c72-portable-cli.mjs'||
 matrix.host_physical_orchestrator!=='host/project-c72-physical-ingress.mjs#runC72SelectedHostIngress'||
 route.host_port_orchestrator!==matrix.host_physical_orchestrator||
 matrix.host_staging_cli!=='scripts/project-c72-staged-ingress-cli.mjs'||
 route.host_port_staged_cli!==matrix.host_staging_cli||
 matrix.host_port_not_native_hook!==true||
 route.host_port_contract!==matrix.host_port_standard||
 route.host_port_adapter!==matrix.host_port_adapter||
 route.host_port_cli!==matrix.host_port_cli)
 throw Error('PROMPT_HEAD_GUARD_MATRIX_INVALID');
// This is a checkable route index, not proof of provider dispatch or a new owner.
const rp=matrix.release_protocol;
if(rp?.candidate!=='PR_HEAD_TEST_ONLY_NEVER_INSTALLED_OR_CANONICAL'||
 rp.canonical!=='AFTER_HUMAN_MERGE_ON_MAIN_AND_EXPLICIT_HOST_REQUEST'||
 rp.human_action!=='ONE_POSTMERGE_GENERATE_PROMPT_REQUEST_NO_C72_GATE_FOR_HOST_ENGINEERING'||
 rp.head_read!=='RESOLVE_LIVE_MAIN_ONCE_AND_BIND_EXACT_COMMIT_TREE_BLOBS'||
 rp.installed_equivalence!=='UNKNOWN_UNLESS_REAL_PROJECT_PROMPT_BYTES_OBSERVED'||
 rp.runtime_epoch!=='EXPLICIT_REPIN_REQUIRES_FRESH_C72_NO_RECEIPT_LEDGER_OR_C135_TRANSFER'||
 rp.no_auto_change_runtime!==true||rp.no_native_delivery_claim!==true)
 throw Error('PROMPT_RELEASE_BOUNDARY_DRIFT');
const routes=matrix.responsibility_registry;
if(!Array.isArray(routes)||routes.length!==13||
 new Set(routes.map(x=>x.route)).size!==13||
 routes.some(x=>x.authority!==0||x.provider_bound!==false||
 !x.boundary||!x.proof||!x.scope||
 typeof x.module!=='string'||!/^[A-Za-z0-9._/-]+$/.test(x.module)))
 throw Error('PROMPT_RESPONSIBILITY_MATRIX_INVALID');
for(const row of routes){
 const raw=original(row.module).toString('utf8');
 if(row.export===null){if(row.route!=='ENGINEERING'||!raw.includes('HOST_ENGINEERING'))
  throw Error('PROMPT_HOST_ENGINEERING_OWNER_MISSING');continue}
 if(typeof row.export!=='string'||!/^[A-Za-z][A-Za-z0-9_]*$/.test(row.export)||
  !new RegExp('export\\s+(?:async\\s+)?(?:function|const|class)\\s+'+row.export+'\\b').test(raw))
   throw Error('PROMPT_OWNER_EXPORT_MISSING:'+row.route);
}
const members=[...new Set([...matrix.required_orientation,matrix.source_prompt,
 matrix.oneshell_contract,...CRITICAL,matrix.host_port_standard,
 'host/project-c72-capability-port.mjs',matrix.host_port_cli,
 'contracts/project-prompt-generation.json','scripts/project-prompt-seven-three-guard.mjs',
 'contracts/project-host-tool-grounding-abi.json','host/project-host-tool-grounding.mjs'])];
if(members.length!==16)throw Error('PROMPT_ANCHOR_MATRIX_INVALID');
const refs={};
for(const p of members){
 if(!/^[A-Za-z0-9._/-]+$/.test(p)||p.split('/').some(s=>s===''||s==='..'))
  throw Error('PROMPT_MEMBER_PATH_INVALID');
 const b=original(p),id=git('rev-parse','HEAD:'+p);
 if(blob(b)!==id)throw Error('PROMPT_SOURCE_BLOB_DRIFT:'+p);
 refs[p]={git_blob_sha1:id,sha256:sha(b),bytes:b.length};
}
const source=original(matrix.source_prompt).toString('utf8');
if(matrix.project_instruction_limit_chars!==8000||
 matrix.project_instruction_limit_utf8_bytes!==8000||
 [...source].length>matrix.project_instruction_limit_chars||
 Buffer.byteLength(source,'utf8')>matrix.project_instruction_limit_utf8_bytes)
 throw Error('PROJECT_INSTRUCTIONS_EXCEED_8000');
assertSevenThreePrompt(source);
async function liveHead(){
 return new Promise((resolve,reject)=>{
  const req=https.get('https://api.github.com/repos/'+promptRepository+'/git/ref/heads/main',
   {headers:{'User-Agent':'ikant-head-prompt-build','Accept':'application/vnd.github+json'},timeout:12000},res=>{
    if(res.statusCode!==200){res.resume();reject(Error('LIVE_MAIN_UNAVAILABLE'));return}
    let b='';res.setEncoding('utf8');res.on('data',s=>{b+=s;if(b.length>64000)req.destroy(Error('MAIN_RESPONSE_TOO_LARGE'))});
    res.on('end',()=>{try{resolve(JSON.parse(b).object.sha)}catch{reject(Error('LIVE_MAIN_INVALID'))}});
   });req.on('timeout',()=>req.destroy(Error('LIVE_MAIN_TIMEOUT')));req.on('error',reject);
 });
}
let liveMainVerified=false;
if(mode==='canonical'){
 if(process.env.GITHUB_REF!=='refs/heads/main'||process.env.GITHUB_EVENT_NAME!=='push')
  throw Error('CANONICAL_MAIN_PUSH_REQUIRED');
 if((await liveHead())!==head)throw Error('STOP_SOURCE_LOCK_STALE');
 liveMainVerified=true;
}
const prompt=mode==='portable'?Buffer.from(source,'utf8'):Buffer.from('iKant · OneShell | HEAD='+head+' | TREE='+tree+'\n'+
 'Before operations compare live main to HEAD. Drift => STOP_SOURCE_LOCK_STALE; never auto-repin.\n'+source);
const lock={schema:'ikant-le-project-prompt-source-lock/v1',source_head:mode==='portable'?null:head,source_tree:mode==='portable'?null:tree,
 generated_from_head:head,generated_from_tree:tree,session_source_lock:'RESOLVE_LIVE_MAIN_ON_FIRST_PROJECT_CHAT_MESSAGE',
 mode,live_main_verified:liveMainVerified,portable_head_agnostic:mode==='portable',source_prompt:matrix.source_prompt,
 prompt_source_blob:refs[matrix.source_prompt].git_blob_sha1,
 critical_contract_blobs:Object.fromEntries(CRITICAL.map(p=>[p,refs[p].git_blob_sha1])),
 runtime_preflight_required:true,installed_prompt_equivalence_attested:false,
 versioned_c72_receipt_transfer_allowed:false,bundle_required:false,
 native_ui_attested:false,installed:false,active:false};
const receipt={schema:'ikant-le-project-prompt-generation-receipt/v1',head,tree,mode,
 live_main_verified:liveMainVerified,source_blobs:refs,prompt_sha256:sha(prompt),
 prompt_bytes:prompt.length,authority:0,active:false,product_release:'PRODUCT_NO_GO'};
const artifacts={'PROMPT_INNESCO.txt':prompt,
 'SOURCE_LOCK.json':Buffer.from(JSON.stringify(lock,null,2)+'\n'),
 'RECEIPT.json':Buffer.from(JSON.stringify(receipt,null,2)+'\n')};
const dest=path.resolve(out);
if(fs.existsSync(dest)||!fs.existsSync(path.dirname(dest)))throw Error('FRESH_OUTPUT_REQUIRED');
fs.mkdirSync(dest,{mode:0o700});
for(const [name,b] of Object.entries(artifacts)){
 const p=path.join(dest,name);fs.writeFileSync(p,b,{flag:'wx',mode:0o600});
 if(!fs.readFileSync(p).equals(b))throw Error('PROMPT_READBACK_FAILED');
}
console.log(JSON.stringify({status:'PROMPT_MATERIALIZED',mode,head,tree,sha256:receipt.prompt_sha256,
 live_main_verified:liveMainVerified,files:Object.keys(artifacts),product_release:'PRODUCT_NO_GO'}));
