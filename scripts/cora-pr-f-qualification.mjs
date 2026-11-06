#!/usr/bin/env node
/** Host engineering PR-F source candidate: reuse original owners; no new receipt. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {observeReticularCensusWithAudit} from './cora-minimal-absorption.mjs';
import {derivePrABacklog} from './cora-pr-a-backlog.mjs';
import {qualifyDocumentSet} from './cora-pr-b-docs.mjs';
import {qualifyPrCCISource} from './cora-pr-c-ci.mjs';
import {verify as verifyAtlas} from './ikant-document-atlas.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const CONTRACT='contracts/cora-pr-f-integrated-qualification-v1.json';
const SHA=/^[a-f0-9]{40}$/u;
const IDS=['F01','F02','F03','F04','F05','F06','F07','F08','F09',
 'F10','F11','F12','X_PRODUCT','I_SOURCE','I_ENGINEERING','I_EXTERNAL',
 'G_REPOSITORY_STANDARDIZED','G_PRODUCT_QUALIFIED'];
const SOURCE_IDS=new Set(['F01','F02','F03','F04','F05','F09']);
const git=(...args)=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8',timeout:20000}).trim();
const load=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));

/** Preserve PR-F's frozen workflow TREE as source history after an explicit rename.
 * Reconstruct the original Git tree from current tracked entries and precisely
 * five registered historic blob IDs. Never turn this into CI/provider approval.
 */
export function verifyFrozenWorkflowTree(contract){
 const frozen=contract?.metrics?.find(x=>x.id==='M05')?.target;
 let current;
 try{current=git('rev-parse','HEAD:.github/workflows');}
 catch{return {ok:false,edge:'F_WORKFLOW_CURRENT_TREE_UNKNOWN'};}
 const deny=edge=>({ok:false,edge,historic_tree:null,current_tree:current,
  source_only:true,provider_attested:false,review_attested:false});
 if(!SHA.test(frozen||'')||!SHA.test(current))return deny('F_WORKFLOW_TREE_INVALID');
 if(current===frozen)return {ok:true,historic_tree:frozen,current_tree:current,
  migration_count:0,source_only:true,provider_attested:false,review_attested:false};
 try{
  const register=load('governance/changes/zzzzzzzzzzzzzzzzzzzzzzzzzz-cora-layout-epochs.json');
  const m=register.workflow_migration;
  if(register.schema!=='ikant-v5b-change-extension/v1'||
   register.authority!==0||m?.authority!==0||
   m.original_root_head!==register.source_main||
   m.historic_tree!==frozen||m.current_tree!==current||
   m.original_git_tree_rebuild_required!==true||
   m.human_review!=='REVIEW_REQUIRED'||m.rulesets_status!=='UNKNOWN'||
   !Array.isArray(m.paths)||m.paths.length!==5)
   return deny('F_WORKFLOW_REGISTER_NOT_GROUNDED');
  const changes=new Map();
  for(const change of m.paths){
   if(!/^\.github\/workflows\/[a-z0-9-]+\.yml$/u.test(change.path)||
    !SHA.test(change.before||'')||!SHA.test(change.after||'')||
    change.before===change.after||
    !register.paths.some(x=>x.path===change.path&&x.operation==='MODIFY'))
    return deny('F_WORKFLOW_MIGRATION_ROW_INVALID');
   const name=change.path.slice('.github/workflows/'.length);
   if(changes.has(name))return deny('F_WORKFLOW_MIGRATION_DUPLICATE');
   changes.set(name,change);
  }
  const bytes=execFileSync('git',['ls-tree','-z','HEAD:.github/workflows'],
   {cwd:ROOT,timeout:20000,maxBuffer:2000000});
  const rows=bytes.toString('utf8').split('\0').filter(Boolean).map(item=>{
   const match=/^(100644|100755) blob ([a-f0-9]{40})\t([^\t/]+)$/u.exec(item);
   if(!match)throw Error('F_WORKFLOW_TREE_ENTRY_INVALID');
   return {mode:match[1],sha:match[2],name:match[3]};
  });
  if(rows.length!==116||new Set(rows.map(x=>x.name)).size!==116)
   return deny('F_WORKFLOW_TREE_CARDINALITY_INVALID');
  const seen=new Set();
  const restored=[];
  for(const row of rows){
   const change=changes.get(row.name);
   if(change){
    if(row.sha!==change.after)return deny('F_WORKFLOW_CURRENT_BLOB_UNEXPECTED');
    seen.add(row.name);
    restored.push({...row,sha:change.before});
   }else restored.push(row);
  }
  if(seen.size!==5)return deny('F_WORKFLOW_MIGRATION_NOT_EXACT');
  restored.sort((a,b)=>Buffer.compare(Buffer.from(a.name),Buffer.from(b.name)));
  const tree=Buffer.concat(restored.map(x=>Buffer.concat([
   Buffer.from(x.mode+' '+x.name+'\0'),Buffer.from(x.sha,'hex')])));
  const reconstructed=createHash('sha1').update(Buffer.from('tree '+tree.length+'\0'))
   .update(tree).digest('hex');
  if(reconstructed!==frozen)return deny('F_FROZEN_WORKFLOW_TREE_NOT_RECONSTRUCTED');
  return {ok:true,historic_tree:reconstructed,current_tree:current,
   migration_count:5,source_only:true,provider_attested:false,review_attested:false};
 }catch{return deny('F_WORKFLOW_SOURCE_RECONSTRUCTION_UNKNOWN');}
}

const fails=(edge,context={})=>({ok:false,first_edge:edge,authority:0,active:false,
 product_go:false,repo_standardized:false,status:'DEBT_BLOCKED',...context});

/** Shape and links are checked without granting authority to any new F owner. */
export function validateFContract(c){
 if(c?.schema!=='ikant-cora-pr-f-integrated-qualification/v1'||c.authority!==0||
  c.owner!==false||c.release!=='NO_GO'||c.product_go!==false||c.active!==false||
  c.abstract_dod?.logic!=='NON_COMPENSATORY_DAG_AND'||c.abstract_dod.unknown_is_not_pass!==true||
  c.abstract_dod.external_not_compensable!==true||
  c.result!=='SOURCE_CANDIDATE_ONLY_UNTIL_EXTERNAL_GATES'||
  !c.nonpromotion||Object.values(c.nonpromotion).some(x=>x!==false)||
  c.source?.repository!=='Luke883i/iKant_EDU'||!SHA.test(c.source.base_head||'')||
  !Array.isArray(c.restored_source_blobs)||c.restored_source_blobs.length!==11||
  !Array.isArray(c.reticulum)||c.reticulum.length!==IDS.length||
  !Array.isArray(c.metrics)||c.metrics.length!==19||
  !Array.isArray(c.checklist)||c.checklist.length!==13 ||
  c.mutation_campaign?.cases!==1000000||c.mutation_campaign?.families!==48)
  return fails('F_CONTRACT_AUTHORITY_OR_SHAPE');
 const ids=c.reticulum.map(x=>x.id);
 if(JSON.stringify(ids)!==JSON.stringify(IDS)||new Set(ids).size!==ids.length||
  new Set(c.metrics.map(x=>x.id)).size!==c.metrics.length||
  new Set(c.checklist.map(x=>x.id)).size!==c.checklist.length)
  return fails('F_RETICULUM_MEMBERSHIP_DRIFT');
 const seen=new Set();
 for(const node of c.reticulum){
  if(!['SOURCE','CI','EXTERNAL','PRODUCT','INTERMEDIATE','GLOBAL'].includes(node.scope)||
   !Array.isArray(node.needs)||!node.needs.every(p=>seen.has(p))||
   new Set(node.needs).size!==node.needs.length||!node.original_cora_dependencies?.length)
   return fails('F_RETICULUM_EDGE_OR_SCOPE:'+node.id);
  seen.add(node.id);
 }
 const r=new Map(c.reticulum.map(x=>[x.id,x]));
 if(JSON.stringify(r.get('G_REPOSITORY_STANDARDIZED').needs)!==
    JSON.stringify(['I_SOURCE','I_ENGINEERING','I_EXTERNAL'])||
   JSON.stringify(r.get('G_PRODUCT_QUALIFIED').needs)!==
    JSON.stringify(['G_REPOSITORY_STANDARDIZED','X_PRODUCT'])||
   JSON.stringify(r.get('I_SOURCE').needs)!==
    JSON.stringify(['F01','F02','F03','F04','F05'])||
   JSON.stringify(r.get('I_EXTERNAL').needs)!==
    JSON.stringify(['F08','F10','F11','F12']))
  return fails('F_NONCOMPENSATORY_JOIN_DRIFT');
 const pathSet=new Set();
 for(const x of c.restored_source_blobs){
  if(!x||!SHA.test(x.blob||'')||typeof x.path!=='string'||
   pathSet.has(x.path)||!(x.path.startsWith('project-baseline/')||
     x.path.startsWith('proposals/c141/')||x.path==='stile_comunicativo.md'))
   return fails('F_RESTORATION_PIN_INVALID');
  pathSet.add(x.path);
 }
 return {ok:true,authority:0,status:'SCHEMA_VALID_NOT_EXECUTION',nodes:IDS.length};
}

/** A logical projection; supplying true values cannot forge a human/provider receipt. */
export function evaluateFReticulation(c,witness={}){
 const contract=validateFContract(c);
 if(!contract.ok)return contract;
 const states=new Map();
 for(const n of c.reticulum){
  const dependenciesProven=n.needs.every(d=>states.get(d)==='MODEL_TRUE');
  if(n.scope==='INTERMEDIATE'||n.scope==='GLOBAL'){
   states.set(n.id,dependenciesProven?'MODEL_TRUE':'BLOCKED_DEPENDENCY');
  }else if(witness[n.id]!==true){
   states.set(n.id,'UNKNOWN_NOT_ATTESTED');
  }else{
   // A source/CI/external/product proof is mandatory even if all predecessors pass.
   states.set(n.id,dependenciesProven?'MODEL_TRUE':'BLOCKED_DEPENDENCY');
  }
 }
 const state=Object.fromEntries(states),source=state.I_SOURCE==='MODEL_TRUE';
 return {ok:true,source_model_complete:source,
  engineering_model_complete:state.I_ENGINEERING==='MODEL_TRUE',
  full_logical_model_complete:state.G_REPOSITORY_STANDARDIZED==='MODEL_TRUE',
  product_logical_model_complete:state.G_PRODUCT_QUALIFIED==='MODEL_TRUE',
  // Never turn model inputs into native review, runtime, approval or product claims.
  repository_standardized:false,product_go:false,active:false,authority:0,
  approval:'NOT_ATTESTED',provider:'NOT_ATTESTED',human_review:'NOT_ATTESTED',
  state,first_edge:IDS.find(id=>state[id]!=='MODEL_TRUE')||'LOGICAL_ONLY_NO_OWNER_RECEIPT'};
}

/** All values originate from existing original V5-B/CORA/PR-A/B/C or raw Git readback. */
export function observePrFSource(){
 const c=load(CONTRACT),check=validateFContract(c);
 if(!check.ok)return check;
 const {census,audit}=observeReticularCensusWithAudit();
 if(!census?.ok||audit?.errors?.length||audit?.status!=='SOURCE_INDEXED_NOT_HUMAN_REVIEWED')
  return fails('F01_V5B_CORA_FIRST_EDGE',{upstream:{
   census_edge:census?.edge||census?.first_edge||null,
   v5b_errors:(audit?.errors||[]).slice(0,20)}});
 const base=load('contracts/cora-reticular-hygiene-v1.json');
 const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
 const workflowTree=git('rev-parse','HEAD:.github/workflows');
 const workflowHistory=verifyFrozenWorkflowTree(c);
 const ownerRows=Object.entries(base.reuse.owner_blob_pins).map(([p,sha])=>({
  path:p,match:git('rev-parse','HEAD:'+p)===sha}));
 const restoreRows=c.restored_source_blobs.map(x=>({
  path:x.path,match:git('rev-parse','HEAD:'+x.path)===x.blob}));
 const ar=derivePrABacklog(census,audit,load('contracts/cora-pr-a-backlog-v1.json'));
 const brC=load('contracts/cora-pr-b-documentation-v1.json');
 const docs=Object.fromEntries(brC.documents.map(d=>[d.path,fs.readFileSync(path.join(ROOT,d.path),'utf8')]));
 const atlas=verifyAtlas();
 const br=qualifyDocumentSet(brC,docs,{atlasExact:atlas.atlas_exact===true,sourceQualified:true});
 const crC=load('contracts/cora-pr-c-ci-v1.json');
 const cr=qualifyPrCCISource({policy:crC,
  source:fs.readFileSync(path.join(ROOT,crC.bounded_effect.path),'utf8'),
  audit,cora:census});
 const allPaths=new Set(census.rows.map(x=>x.path));
 const unverified=ar.ok?ar.rows.filter(x=>x.consumer_closure==='UNKNOWN').length:null;
 const metrics={
  M01:audit.errors.length,
  M02:census.rows.length/audit.checked_files,
  M03:ownerRows.filter(x=>x.match).length,
  M04:audit.workflow_count,
  M05:workflowHistory.ok?workflowHistory.historic_tree:workflowTree,
  M06:restoreRows.filter(x=>x.match).length,
  M07:(audit.errors||[]).filter(x=>x.startsWith('UNREGISTERED_DELETION:')).length,
  M08:atlas.atlas_exact===true,
  M09:br.ok?br.checked_documents:0,
  M10:ar.ok?ar.counted_files/audit.checked_files:0,
  M11:cr.ok===true,
  M12:null,M13:null,M14:null,M15:null,M16:null,M17:null,M18:null,M19:null
 };
 const witnesses={
  F01:SHA.test(head)&&SHA.test(tree)&&census.git.head===head&&
   census.git.tree===tree&&audit.checked_files===allPaths.size,
  F02:audit.errors.length===0&&audit.checked_files===census.rows.length&&
   census.rows.every(x=>x.consumer_status!=='UNUSED'),
  F03:ownerRows.length===4&&ownerRows.every(x=>x.match)&&
   audit.workflow_count===116&&workflowHistory.ok===true&&
   workflowHistory.historic_tree===c.metrics.find(x=>x.id==='M05').target,
  F04:br.ok===true&&metrics.M08===true&&br.checked_documents===8,
  F05:ar.ok===true&&cr.ok===true&&ar.counted_files===audit.checked_files&&
   ar.product_go===false&&cr.product_go===false&&
   census.goals.standardized==='BLOCKED_EXTERNAL',
  F06:false,F07:false,F08:false,F09:false,F10:false,F11:false,F12:false,
  X_PRODUCT:false
 };
 const model=evaluateFReticulation(c,witnesses);
 const sourceCandidate=['F01','F02','F03','F04','F05'].every(x=>witnesses[x]);
 return {ok:sourceCandidate,status:sourceCandidate?
   'PR_F_SOURCE_CANDIDATE_EXTERNAL_GATES_OPEN':'PR_F_SOURCE_DOD_OPEN',
  first_edge:sourceCandidate?'F06_CLEAN_CHECKOUT_NOT_PROVEN':
   ['F01','F02','F03','F04','F05'].find(x=>!witnesses[x]),
  source:{head,tree,tracked:allPaths.size,workflow_tree:metrics.M05,
    current_workflow_tree:workflowTree,workflow_history:workflowHistory,
   source_baseline:c.source.base_head,
   previously_registered_missing_paths:(audit.missing_paths||[]).length},metrics,witnesses,model,
  original_reticulum:census.goals,
  recovery:{restored:restoreRows,original_tree:c.source.before_tree,
   recovered_original_tree_in_F0_commit:c.source.source_restore_commit,
   byte_exact_subset:restoreRows.every(x=>x.match),historical_status:'HISTORICAL_NOT_RUNTIME'},
  backlog:{total:ar.ok?ar.counted_files:null,unverified_consumers:unverified,
   priority:ar.ok?ar.by_priority:null},
  documents:{source_qualified:br.ok===true,atlas_exact:atlas.atlas_exact===true},
  ci:{source_qualified:cr.ok===true,required_checks:'UNKNOWN_PROVIDER_NOT_ATTESTED'},
  provenance:{head_tree_from:'GIT_LOCAL',census:'ORIGINAL_CORa_V5B',
   owner:'ORIGINAL_GIT_BLOBS',provider:'NOT_ATTESTED',human:'NOT_ATTESTED'},
  authority:0,active:false,product_go:false,repo_standardized:false,
  human_review:'NOT_ATTESTED',postmerge:'NOT_ATTESTED'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('F_UNKNOWN_ARG');
 let result;
 try{result=observePrFSource();}catch(e){result=fails('F_SOURCE_READBACK_EXCEPTION',
  {message:String(e.message||e).slice(0,300)});}
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
 if(!result.ok)process.exitCode=1;
}
