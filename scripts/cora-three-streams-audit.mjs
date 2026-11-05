#!/usr/bin/env node
/** Read-only CORA S1/S2/S3 profile over original V5-B/PR-F. Not an owner. */
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateFContract} from './cora-pr-f-qualification.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const EXPECTED=[["R01","SOURCE",[]],["R02","SOURCE",["R01"]],["R03","SOURCE",["R02"]],["R04","SOURCE",["R02"]],["R05","SOURCE",["R02"]],["R06","SOURCE",["R01"]],["R07","SOURCE",["R01"]],["R08","SOURCE",["R01"]],["R09","SOURCE",["R01"]],["I_SOURCE","INTERMEDIATE",["R01","R02","R03","R04","R05","R06","R07","R08","R09"]],["E01","EXTERNAL",["R03"]],["E02","EXTERNAL",["R06","R07","R08"]],["E03","EXTERNAL",["R05"]],["E04","EXTERNAL",["R08"]],["E05","EXTERNAL",["E04"]],["E06","EXTERNAL",["I_SOURCE"]],["E07","EXTERNAL",["R04"]],["E08","EXTERNAL",["E05"]],["I_S1","INTERMEDIATE",["R02","R03","R04","E01","E06","E07"]],["I_S2","INTERMEDIATE",["R03","R05","E01","E02","E03","E06"]],["I_S3","INTERMEDIATE",["R06","R07","R08","R09","E02","E04","E05","E06"]],["G_REPOSITORY","GLOBAL",["I_S1","I_S2","I_S3"]],["G_PRODUCT","GLOBAL",["G_REPOSITORY","E08"]]];
const FIXED_PINS={"BOOTSTRAP.json":"36c7d5beedb54c453fd4d38e551aa123a92c92f1","contracts/project-host-tool-grounding-abi.json":"5d882060167f12d76cb2250fca87bd3e808d241a","host/project-c72-transport-frontier.mjs":"7b16982373779bdd7ff7b8c0535f515731fc5867","project/session-chat/PROMPT.txt":"277b1a5b7a8b9e5fe09702b6cf854b8682791db4","project/edu-oneshell/PROMPT_INNESCO.txt":"dd7a3cb190a7a731ef68701b4e11b68fb71708c2","project-baseline/PROJECT_PROMPT.txt":"9eb7725430f99f24129e2bb8daeb93da67187fc6","project/oneshell-v7/PROMPT_TEMPLATE.txt":"47d83b4fa2cc68699f9fc63ffa107410a970e24f","host/project-oneshell-continuous.mjs":"0355428b71ec4d6aa13ec4b81323ee1c9336b102"};
export function validateStreamProfile(p){
 const bad=edge=>({ok:false,edge,authority:0,standardized:false,product_go:false,archive_allowed:false});
 if(!p||p.schema!=='ikant-host-cora-3stream-retrograde/v1'||p.authority!==0||
 p.owner!==false||p.active!==false||p.release!=='NO_GO'||p.product_go!==false||
 p.global_closure_attested!==false||p.field_closure_attested!==false||
 p.abstract_dod?.logic!=='NON_COMPENSATORY_DAG_AND'||p.abstract_dod.unknown_is_not_pass!==true||
 p.abstract_dod.host_profile_may_authorize!==false||p.abstract_dod.source_model_is_not_field_proof!==true||
 p.protocol?.allow_archive!==false||p.protocol?.allow_owner_change!==false||
 p.protocol?.allow_prompt_install!==false||p.protocol?.allow_workflow_retirement!==false||
 p.protocol?.require_second_engineer!==true||p.protocol?.require_human_decision!==true||
 p.source?.repository!=='Luke883i/iKant_EDU'||
 p.source?.source_head!=='c4227761ed2f0bfff1cb628922a07245742b43e2'||
 p.source?.source_tree!=='54f40b4cc1f75f7f991aa939022c15df76cf2740'||
 p.source?.cora_original_pin!=='3fdf761167e62cc427b7339fc6c59343c1b0be8f'||
 p.source?.cora_observed_head!=='991e8e338bb6cdf2cd9a7817a1cc2ee23c3a4007'||
 p.reuse?.reticulum!=='contracts/cora-reticular-hygiene-v1.json'||
 p.reuse?.integrated!=='contracts/cora-pr-f-integrated-qualification-v1.json'||
 p.reuse?.inventory!=='scripts/v5b-repository-governance-audit.mjs'||
 p.reuse?.callsite!=='scripts/project-review-callsites.mjs'||
 JSON.stringify(p.protocol?.streams)!==JSON.stringify(['I_S1','I_S2','I_S3'])||
 p.terminal!=='SOURCE_PROFILE_TESTABLE_EXTERNAL_GATES_OPEN')return bad('STREAM_AUTHORITY_OR_SOURCE_DRIFT');
 if(JSON.stringify(p.observed_source_pins)!==JSON.stringify(FIXED_PINS))return bad('STREAM_CRITICAL_BLOB_DRIFT');
 if(!Array.isArray(p.nodes)||p.nodes.length!==EXPECTED.length)return bad('STREAM_DAG_MEMBER_COUNT');
 const seen=new Set();
 for(let i=0;i<EXPECTED.length;i++){
  const n=p.nodes[i],e=EXPECTED[i];
  if(n?.id!==e[0]||n.scope!==e[1]||JSON.stringify(n.needs)!==JSON.stringify(e[2])||
   typeof n.meaning!=='string'||n.meaning.length<12||typeof n.original_f!=='string'||
   !n.needs.every(x=>seen.has(x))||seen.has(n.id))return bad('STREAM_DAG_ORIGINAL_TOPOLOGY_DRIFT');
  seen.add(n.id);
 }
 return {ok:true,status:'SOURCE_PROFILE_SCHEMA_VALID_NOT_RUNTIME',nodes:EXPECTED.length,
  authority:0,standardized:false,product_go:false,archive_allowed:false};
}
export function evaluateStreamLogic(p,claims={}){
 const k=validateStreamProfile(p);if(!k.ok)return k;
 const state={};
 for(const n of p.nodes){
  if(n.scope==='INTERMEDIATE'||n.scope==='GLOBAL')state[n.id]=n.needs.every(x=>state[x]==='MODEL_TRUE')?'MODEL_TRUE':'MODEL_BLOCKED';
  else state[n.id]=claims[n.id]===true&&n.needs.every(x=>state[x]==='MODEL_TRUE')?'MODEL_TRUE':'UNKNOWN_OR_DEPENDENCY';
 }
 return {ok:true,model_source_complete:state.I_SOURCE==='MODEL_TRUE',
  model_engineering_complete:state.G_REPOSITORY==='MODEL_TRUE',
  model_product_complete:state.G_PRODUCT==='MODEL_TRUE',state,
  first_edge:p.nodes.find(n=>state[n.id]!=='MODEL_TRUE')?.id||'LOGICAL_ONLY_NEVER_EXTERNAL_RECEIPT',
  authority:0,active:false,standardized:false,product_go:false,archive_allowed:false,
  provider:'NOT_ATTESTED',original_owner:'NOT_INVOKED',independent_review:'NOT_ATTESTED'};
}
export function classifySemanticSources(s){
 const get=p=>typeof s?.[p]==='string'?s[p]:'';
 const bootstrap=get('BOOTSTRAP.json'),abi=get('contracts/project-host-tool-grounding-abi.json');
 const frontier=get('host/project-c72-transport-frontier.mjs');
 const prompt=get('project/session-chat/PROMPT.txt'),alias=get('project/edu-oneshell/PROMPT_INNESCO.txt');
 const historical=get('project-baseline/PROJECT_PROMPT.txt');
 const oldTemplate=get('project/oneshell-v7/PROMPT_TEMPLATE.txt');
 const continuous=get('host/project-oneshell-continuous.mjs');
 const order=abi.includes('HOST_TOOL_ARG_RELAY')&&abi.includes('SAME_NODE_CALLBACKS')&&frontier.includes("'CALLBACKS','NODE_HTTPS','HOST_PACKET','HOST_FILE'");
 const url=frontier.includes('Luke883i/iKant_LE/archive/')&&bootstrap.includes('Luke883i/iKant_EDU');
 const derived=prompt.length>200&&alias.startsWith(prompt)&&alias.slice(prompt.length).includes('NOT_INSTALLED')&&alias.includes('PROJECT_SOURCE=project/session-chat/PROMPT.txt');
 const old=historical.includes('iKant_LE')&&oldTemplate.includes('iKant_LE')&&prompt.includes('iKant EDU');
 const delegated=continuous.includes("from './project-oneshell-edu.mjs'")&&continuous.includes("from './c72-public-mode-admission.mjs'");
 return {C1:order?'DUAL_DECLARED_PRIORITY_REQUIRES_CALL_PATH_REVIEW':'SOURCE_UNRESOLVED',
 C2:url?'HISTORICAL_ZIP_URL_IN_HOST_MODULE':'SOURCE_UNRESOLVED',
 C3:derived?'DERIVED_ALIAS_PREFIX_BYTE_CHECK':'SOURCE_UNRESOLVED',
 C4:old?'HISTORICAL_PROMPTS_CONSUMER_REVIEW':'SOURCE_UNRESOLVED',
 C5:delegated?'SOURCE_DELEGATION_NOT_PARALLEL_WRITER_PROOF':'SOURCE_UNRESOLVED',
 authority:0,active:false,archive_allowed:false,owner_concurrency_proven:false};
}
const git=(...a)=>execFileSync('git',a,{cwd:ROOT,encoding:'utf8',timeout:20000,maxBuffer:3000000}).trim();
const data=(...a)=>execFileSync('git',a,{cwd:ROOT,timeout:20000,maxBuffer:3000000});
const blobHash=b=>createHash('sha1').update(Buffer.from('blob '+b.length+String.fromCharCode(0))).update(b).digest('hex');
export function observeThreeStreamSource(){
 try{
  const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
  // Immutable post-PR226 historical witness; current S3 source is checked separately.
  const baseline='c4227761ed2f0bfff1cb628922a07245742b43e2';
  try{git('cat-file','-e',baseline+'^{commit}');
   git('merge-base','--is-ancestor',baseline,head);
  }catch{return {ok:false,edge:'STREAM_HISTORICAL_BASELINE_NOT_LOCALLY_AVAILABLE',
   source_pins:[],authority:0,standardized:false,product_go:false,archive_allowed:false};}
  const load=p=>JSON.parse(data('show',head+':'+p).toString('utf8'));
  const profile=load('contracts/cora-three-streams-retrograde-v1.json');
  const valid=validateStreamProfile(profile);if(!valid.ok)return valid;
  if(validateFContract(load('contracts/cora-pr-f-integrated-qualification-v1.json')).ok!==true)
   return {ok:false,edge:'STREAM_ORIGINAL_F_CONTRACT_INVALID',authority:0,standardized:false};
  const sources={},observations=[];
  for(const [p,expected] of Object.entries(FIXED_PINS)){
   const b=data('show',baseline+':'+p),sha=git('rev-parse',baseline+':'+p);
   if(sha!==expected||blobHash(b)!==sha)
    return {ok:false,edge:'STREAM_SOURCE_PIN_DRIFT:'+p,authority:0,standardized:false};
   sources[p]=b.toString('utf8');observations.push({path:p,sha1:sha,bytes:b.length});
  }
  const candidates=classifySemanticSources(sources);
  const cut=evaluateStreamLogic(profile,{R01:true,
   R06:candidates.C3==='DERIVED_ALIAS_PREFIX_BYTE_CHECK',
   R07:candidates.C1!=='SOURCE_UNRESOLVED',
   R08:candidates.C5!=='SOURCE_UNRESOLVED',
   R09:profile.source.cora_original_pin!==profile.source.cora_observed_head});
  if(git('rev-parse','HEAD')!==head)
   return {ok:false,edge:'STREAM_SOURCE_HEAD_DRIFT',authority:0,standardized:false};
  return {ok:true,status:'HISTORICAL_SOURCE_BASELINE_AND_THREE_STREAMS_OPEN',head,tree,baseline,
   source_pins:observations,semantic_candidates:candidates,reticulum:cut,
   original_f:'SCHEMA_VALID_NOT_REEXECUTED',cora_cli:'NOT_EXECUTED',
   consumer_closure:'UNKNOWN',rollback:'NOT_EXECUTED',
   independent_review:'NOT_ATTESTED',admin_required_checks:'UNKNOWN',
   original_owner:'NOT_INVOKED',provider:'NOT_ATTESTED',
   first_edge:cut.first_edge,authority:0,active:false,standardized:false,
   product_go:false,archive_allowed:false};
 }catch(e){return {ok:false,edge:'STREAM_LOCAL_READBACK_UNKNOWN',
  message:String(e?.message||e).slice(0,150),authority:0,active:false,
  standardized:false,product_go:false,archive_allowed:false};}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const r=observeThreeStreamSource();process.stdout.write(JSON.stringify(r,null,2)+'\n');
 if(!r.ok)process.exitCode=1;
}
