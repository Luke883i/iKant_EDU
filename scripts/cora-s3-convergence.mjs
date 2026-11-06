#!/usr/bin/env node
/** Read-only original-owner-preserving S3 source qualification; never mints receipts. */
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chooseEDUSourceTransport,chooseC72HostTransport,C72_TRANSPORT_ORDER}
 from '../host/project-c72-transport-frontier.mjs';
import {validateFContract} from './cora-pr-f-qualification.mjs';
import {qualifyRegisteredC72SourceEpoch} from './v5b-repository-governance-audit.mjs';
import {validateStreamProfile} from './cora-three-streams-audit.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE='e719ebfdb8dfa2f1a0382f56ab95fbbdc0f3e005';
const BASE_TREE='9fe5a7d8d757b180aa55df0db86119f446872e03';
const NEW_FRONTIER='88bb9955cea54a98c4c47fe7dec6f385a8e7edf2';
const OLD_FRONTIER='7b16982373779bdd7ff7b8c0535f515731fc5867';
const OWNERS={"host/c72-public-mode-admission.mjs":"eec28e35a1066802edc905c7d61c1ecbcef0082d","host/c135-edu-v2-owner.mjs":"e8bbe5741375e5d51f1caa02fdba2ecc5f6c049d","host/c87-durable-ledger.mjs":"9d4fd4038bd7e109bdbc5e0441f9e9acf497c846","host/c125-output-port.mjs":"14760e40051b2bbe0c3a2ebc9347e125fdd7d65a"};
const STABLE={"BOOTSTRAP.json":"36c7d5beedb54c453fd4d38e551aa123a92c92f1","contracts/project-host-tool-grounding-abi.json":"5d882060167f12d76cb2250fca87bd3e808d241a","project/session-chat/PROMPT.txt":"277b1a5b7a8b9e5fe09702b6cf854b8682791db4","project/edu-oneshell/PROMPT_INNESCO.txt":"dd7a3cb190a7a731ef68701b4e11b68fb71708c2","project-baseline/PROJECT_PROMPT.txt":"9eb7725430f99f24129e2bb8daeb93da67187fc6","project/oneshell-v7/PROMPT_TEMPLATE.txt":"47d83b4fa2cc68699f9fc63ffa107410a970e24f","host/project-oneshell-continuous.mjs":"0355428b71ec4d6aa13ec4b81323ee1c9336b102","contracts/c72-public-mode-admission-v2.json":"0bdb99589d907072917ba31f2938c9b600f39a05"};
const BLUEPRINT=[["S3R1","SOURCE",[]],["S3R2","SOURCE",["S3R1"]],["S3R3","SOURCE",["S3R1"]],["S3R4","SOURCE",["S3R1"]],["S3R5","SOURCE",["S3R1"]],["S3R6","SOURCE",["S3R1"]],["S3R7","SOURCE",["S3R2","S3R3","S3R4","S3R5","S3R6"]],["I_S3_SOURCE","INTERMEDIATE",["S3R1","S3R2","S3R3","S3R4","S3R5","S3R6","S3R7"]],["S3E1","EXTERNAL",["I_S3_SOURCE"]],["S3E2","EXTERNAL",["I_S3_SOURCE"]],["S3E3","EXTERNAL",["S3E2"]],["S3E4","EXTERNAL",["I_S3_SOURCE"]],["I_S3_COMPLETE","INTERMEDIATE",["I_S3_SOURCE","S3E1","S3E2","S3E3","S3E4"]]];
const SHA=/^[a-f0-9]{40}$/u;
const denied=edge=>({ok:false,first_edge:edge,authority:0,active:false,s3_complete:false,
 source_qualified:false,provider:'NOT_ATTESTED',owner_invoked:false,archive_allowed:false});
const git=(...args)=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8',timeout:20000,maxBuffer:6000000}).trim();
const bytes=(...args)=>execFileSync('git',args,{cwd:ROOT,timeout:20000,maxBuffer:6000000});
const gitHash=b=>createHash('sha1').update(Buffer.from('blob '+b.length+String.fromCharCode(0))).update(b).digest('hex');
export function validateS3Profile(p){
 if(p?.schema!=='ikant-host-cora-s3-source-convergence/v1'||p.authority!==0||p.owner!==false||
 p.active!==false||p.release!=='NO_GO'||p.abstract?.logic!=='NON_COMPENSATORY_DAG_AND'||
 p.abstract?.unknown_is_not_pass!==true||p.abstract?.source_is_not_runtime!==true||
 p.abstract?.model_is_not_approval!==true||p.source?.repo!=='Luke883i/iKant_EDU'||
 p.source?.base_head!==BASE||p.source?.base_tree!==BASE_TREE||
 p.source?.frontier_base_sha!==OLD_FRONTIER||p.source?.frontier_after_sha!==NEW_FRONTIER||
 p.source?.pr_f!=='contracts/cora-pr-f-integrated-qualification-v1.json'||
 p.source?.original!=='contracts/cora-three-streams-retrograde-v1.json'||
 JSON.stringify(p.owners)!==JSON.stringify(OWNERS)||JSON.stringify(p.stable)!==JSON.stringify(STABLE)||
 p.boundaries?.archive_allowed!==false||p.boundaries?.delete_allowed!==false||
 p.boundaries?.workflow_retirement_allowed!==false||p.boundaries?.prompt_install_allowed!==false||
 p.boundaries?.owner_invoke_allowed!==false||p.boundaries?.product_go!==false||
 p.boundaries?.standardized!==false||p.boundaries?.provider!=='NOT_ATTESTED'||
 p.boundaries?.independent_review!=='NOT_ATTESTED'||
 !Array.isArray(p.cases)||p.cases.length!==8||
 p.cases.some((x,i)=>x.id!=='C'+(i+1)||x.owner_change!==false||
 typeof x.classification!=='string'||x.classification.length<10)||
 !Array.isArray(p.nodes)||p.nodes.length!==BLUEPRINT.length)return denied('S3_PROFILE_OR_AUTHORITY_DRIFT');
 const seen=new Set();
 for(let i=0;i<BLUEPRINT.length;i++){
  const n=p.nodes[i],e=BLUEPRINT[i];
  if(n?.id!==e[0]||n?.scope!==e[1]||JSON.stringify(n.needs)!==JSON.stringify(e[2])||
   typeof n.proof!=='string'||n.proof.length<15||n.needs.some(x=>!seen.has(x))||seen.has(n.id))
   return denied('S3_RETICULUM_TOPOLOGY_DRIFT');
  seen.add(n.id);
 }
 return {ok:true,source_valid:true,authority:0,active:false,s3_complete:false,archive_allowed:false};
}
export function evaluateS3(p,witness={}){
 const q=validateS3Profile(p);if(!q.ok)return q;
 const statuses={};
 for(const n of p.nodes){
  const parents=n.needs.every(k=>statuses[k]==='MODEL_TRUE');
  statuses[n.id]=n.scope==='INTERMEDIATE'?(parents?'MODEL_TRUE':'BLOCKED_DEPENDENCY'):
   witness[n.id]===true&&parents?'MODEL_TRUE':'UNKNOWN_NOT_ATTESTED';
 }
 return {ok:true,statuses,
  source_model_complete:statuses.I_S3_SOURCE==='MODEL_TRUE',
  complete_model:statuses.I_S3_COMPLETE==='MODEL_TRUE',
  first_edge:p.nodes.find(x=>statuses[x.id]!=='MODEL_TRUE')?.id||'MODEL_ONLY_NO_EXTERNAL_RECEIPT',
  authority:0,active:false,s3_complete:false,product_go:false,standardized:false,
  archive_allowed:false,owner_invoked:false,provider:'NOT_ATTESTED',
  human_review:'NOT_ATTESTED'};
}
export function classifyS3Sources({bootstrap,abi,frontier,prompt,derived,legacy,v7,continuous,c72}={}){
 const str=x=>typeof x==='string'?x:'';
 const source={bootstrap:str(bootstrap),abi:str(abi),frontier:str(frontier),
 prompt:str(prompt),derived:str(derived),legacy:str(legacy),v7:str(v7),
 continuous:str(continuous),c72:str(c72)};
 let parsed;try{parsed=JSON.parse(source.abi);}catch{parsed={};}
 let admitted;try{admitted=JSON.parse(source.c72);}catch{admitted={};}
 const ids=parsed.carrier_priority?.map(x=>x.id)||[];
 const carrier=parsed.authority===0&&JSON.stringify(ids)===
 JSON.stringify(['HOST_TOOL_ARG_RELAY','SAME_NODE_CALLBACKS','HOST_SOURCE_PACKET','NODE_GITHUB_HTTPS'])&&
 source.frontier.includes("'CALLBACKS','NODE_HTTPS','HOST_PACKET','HOST_FILE'");
 const oldZip=source.frontier.includes('Luke883i/iKant_LE/archive/');
 const correctZip=source.frontier.includes('Luke883i/iKant_EDU/archive/')&&!oldZip;
 const prefix=source.prompt.length>100&&source.derived.startsWith(source.prompt)&&
 source.derived.slice(source.prompt.length).includes('NOT_INSTALLED')&&
 source.derived.includes('PROJECT_SOURCE=project/session-chat/PROMPT.txt');
 const history=source.legacy.includes('iKant_LE')&&source.v7.includes('iKant_LE')&&
 source.prompt.includes('iKant EDU');
 const delegation=source.continuous.includes("from './project-oneshell-edu.mjs'")&&
 source.continuous.includes("from './c72-public-mode-admission.mjs'");
 const oldMode=Array.isArray(admitted.mode_choices)&&
  JSON.stringify(admitted.mode_choices)===JSON.stringify(['EDU','CANONICAL'])&&
  source.prompt.includes('CANONICAL legacy');
 const newMode=Array.isArray(admitted.mode_choices)&&
  JSON.stringify(admitted.mode_choices)===JSON.stringify(['EDU'])&&
  source.prompt.includes('ulteriore turno esatto EDU⇒selezione.')&&
  !source.prompt.includes('EDU/CANONICAL');
 const mode=admitted.authoritative_claims?.selection_is_active===false&&
 admitted.status?.EDU==='EDU_SELECTED_NOT_RUNNING'&&(oldMode||newMode);
 return {S3R2:correctZip,S3R3:carrier,S3R4:prefix&&history,S3R5:delegation,
 S3R6:mode,old_zip_detected:oldZip,
 classifications:{C1:carrier?'SEPARATE_HOST_ADVISORY_RANKINGS_RUNTIME_UNKNOWN':'UNKNOWN',
 C2:correctZip?'CANONICAL_ZIP_PATH_SOURCE_ONLY':'LEGACY_OR_UNKNOWN',
 C3:prefix?'DERIVED_ALIAS_NOT_INSTALLED':'UNKNOWN',
 C4:history?'HISTORICAL_PROMPTS_CONSUMERS_UNKNOWN':'UNKNOWN',
 C5:delegation?'SOURCE_DELEGATION_OWNER_RUNTIME_UNKNOWN':'UNKNOWN',
 C6:mode?'MODE_SELECTION_NOT_ACTIVE':'UNKNOWN',
 C7:'UPSTREAM_METHOD_VERSION_SKEW_NOT_REPINNED',
 C8:'NO_CLEANUP_AUTHORIZED'},owner_concurrency_proven:false,
 provider_attested:false,archive_allowed:false,authority:0};
}
export function observeS3Source(){
 try{
  const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
  // Source HEAD is verified locally. A shallow CI checkout may omit BASE objects.
  let baseline_local='NOT_PRESENT_IN_LOCAL_GIT_HISTORY';
  try{git('cat-file','-e',BASE+'^{commit}');baseline_local='AVAILABLE';}catch{}
  if(baseline_local==='AVAILABLE'){
   if(git('rev-parse',BASE+'^{tree}')!==BASE_TREE)return denied('S3_BASE_TREE_DRIFT');
   const previous=bytes('show',BASE+':host/project-c72-transport-frontier.mjs');
   if(gitHash(previous)!==OLD_FRONTIER)return denied('S3_FRONTIER_BASE_DRIFT');
   baseline_local='BASE_TREE_AND_BLOB_REOPENED';
  }
  const get=(rev,p)=>bytes('show',rev+':'+p);
  const load=(rev,p)=>JSON.parse(get(rev,p).toString('utf8'));
  const p=load(head,'contracts/cora-s3-source-convergence-v1.json');
  if(!validateS3Profile(p).ok)return denied('S3_PROFILE_INVALID');
  if(!validateStreamProfile(load(head,p.source.original)).ok||
     !validateFContract(load(head,p.source.pr_f)).ok)return denied('S3_ORIGINAL_REUSE_FAILED');
  // Old blob provenance is independently checked via GitHub; do not infer it from a shallow checkout.
  const pinned=[...Object.entries(OWNERS),...Object.entries(STABLE),
   ['host/project-c72-transport-frontier.mjs',NEW_FRONTIER]];
  const all={},observations=[];
  for(const [f,sha] of pinned){
   const b=get(head,f),observed=git('rev-parse',head+':'+f);
   const epoch=qualifyRegisteredC72SourceEpoch({
    path:f,historicalBlobSha1:sha,observedBlobSha1:observed});
   if(epoch.ok!==true||gitHash(b)!==observed)
    return denied('S3_CRITICAL_BLOB_DRIFT:'+f);
   all[f]=b.toString('utf8');observations.push({
    path:f,sha:observed,bytes:b.length,historical_sha1:sha,
    source_epoch_status:epoch.status,prospective_amendment:epoch.amended===true,
    review_attested:false,owner_receipt_attested:false});
  }
  const classified=classifyS3Sources({
   bootstrap:all['BOOTSTRAP.json'],abi:all['contracts/project-host-tool-grounding-abi.json'],
   frontier:all['host/project-c72-transport-frontier.mjs'],
   prompt:all['project/session-chat/PROMPT.txt'],derived:all['project/edu-oneshell/PROMPT_INNESCO.txt'],
   legacy:all['project-baseline/PROJECT_PROMPT.txt'],v7:all['project/oneshell-v7/PROMPT_TEMPLATE.txt'],
   continuous:all['host/project-oneshell-continuous.mjs'],
   c72:get(head,'contracts/c72-public-mode-admission-v2.json').toString('utf8')
  });
  const sha='a'.repeat(40);
  const input={phase:'POST_EDU',originalEduSelectionVerified:true,sourceHead:sha,liveHead:sha,
   node:'AVAILABLE',source:'ABSENT',manualRoute:'EXPLICIT_MANUAL_POST_EDU'};
  const manual=chooseEDUSourceTransport(input);
  const deniedManual=chooseEDUSourceTransport({...input,originalEduSelectionVerified:false});
  const accept=chooseC72HostTransport({phase:'POST_EDU'});
  const negative=manual.kind==='HUMAN_GATE'&&manual.owner_invoked===false&&manual.active===false&&
   manual.source_zip_url==='https://github.com/Luke883i/iKant_EDU/archive/'+sha+'.zip'&&
   deniedManual.kind==='STOP'&&accept.kind==='STOP'&&C72_TRANSPORT_ORDER.length===4;
  const witnesses={S3R1:true,S3R2:classified.S3R2,S3R3:classified.S3R3,
   S3R4:classified.S3R4,S3R5:classified.S3R5,S3R6:classified.S3R6,
   S3R7:negative};
  const logical=evaluateS3(p,witnesses);
  if(git('rev-parse','HEAD')!==head)return denied('S3_LIVE_HEAD_DRIFT');
  return {ok:logical.source_model_complete===true,head,tree,base:BASE,baseline_local,
   source_status:logical.source_model_complete?'S3_SOURCE_MODEL_QUALIFIED':'S3_SOURCE_MODEL_INCOMPLETE',
   model:logical,observations,classifications:classified.classifications,
   negative_admission_gate:negative,first_edge:logical.source_model_complete?p.first_edge:logical.first_edge,
   source_epoch_revisions:observations.filter(x=>x.prospective_amendment).map(x=>x.path),
   consumers:'UNKNOWN',owner_receipt:'NOT_INVOKED',provider:'NOT_ATTESTED',
   original_ledger:'NOT_ATTESTED',review:'NOT_ATTESTED',archive_allowed:false,
   standardized:false,active:false,product_go:false,authority:0};
 }catch(e){return {...denied('S3_GIT_READBACK_OR_EXECUTION_UNKNOWN'),
  diagnostic:String(e?.message||e).slice(0,160)};}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const r=observeS3Source();process.stdout.write(JSON.stringify(r,null,2)+'\n');
 if(!r.ok)process.exitCode=1;
}
