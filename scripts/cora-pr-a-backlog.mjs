#!/usr/bin/env node
/** PR-A is a read-only V5-B/CORA projection, not a new inventory or an owner. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {auditRepository} from './v5b-repository-governance-audit.mjs';
import {observeReticularCensus} from './cora-minimal-absorption.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const CONTRACT='contracts/cora-pr-a-backlog-v1.json';
const SHA=/^[a-f0-9]{40}$/u;
const ORIGINAL=Object.freeze(new Set([
 'README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
 'project/session-chat/PROMPT.txt','contracts/project-session-source.json',
 'host/c72-public-mode-admission.mjs','host/c135-edu-v2-owner.mjs',
 'host/c87-durable-ledger.mjs','host/c125-output-port.mjs'
]));
const PRIO=Object.freeze({P0:0,P1:1,P2:2,P3:3});
const HISTORICAL=/(?:^|[\/_-])(?:legacy|historical|history|archive|archaeology|obsolete|cobol|prepr|old)(?:[\/_.-]|$)/i;
const invalid=edge=>({ok:false,first_edge:edge,authority:0,active:false,
 product_go:false,delete_authorized:false,workflow_retirement_authorized:false});
const unique=x=>new Set(x).size===x.length;

/** A review priority is NOT evidence that a file can safely be removed. */
export function classifyCandidate(row,{dynamicPaths=new Set()}={}){
 if(!row||typeof row.path!=='string'||!SHA.test(row.git_blob_sha1||'')||
    !Array.isArray(row.literal_importers)||!Array.isArray(row.literal_dependencies)||
    !unique(row.literal_importers)||!unique(row.literal_dependencies)||
    !['UNKNOWN_NOT_UNUSED','LITERAL_CONSUMER_OBSERVED'].includes(row.consumer_status))
  return invalid('PR_A_ROW_UNTRUSTED');
 const pathName=row.path,signals=[];
 if(ORIGINAL.has(pathName))signals.push('ORIGINAL_SOURCE_GUARD');
 if(dynamicPaths.has(pathName))signals.push('DYNAMIC_CONSUMER');
 if(row.workflow){
  if(!Array.isArray(row.workflow.flags)||!Array.isArray(row.workflow.events)||
    !Array.isArray(row.workflow.jobs))return invalid('PR_A_WORKFLOW_UNTRUSTED');
  if(row.workflow.flags.length||row.workflow.events.length===0)signals.push('WORKFLOW_HAZARD');
  else signals.push('WORKFLOW_REVIEW');
 }
 if(pathName.startsWith('docs/')&&HISTORICAL.test(pathName))signals.push('DOCUMENT_VIGENCY');
 if(/^(?:host|src|scripts)\//.test(pathName)&&!row.literal_importers.length)
  signals.push('NO_LITERAL_IMPORTER');
 if(!signals.length)signals.push('UNCLASSIFIED_RETAIN');
 const priority=signals.includes('ORIGINAL_SOURCE_GUARD')?'P0':
  signals.some(x=>['DYNAMIC_CONSUMER','WORKFLOW_HAZARD'].includes(x))?'P1':
  signals.includes('UNCLASSIFIED_RETAIN')?'P3':'P2';
 const decision=priority==='P0'?'RETAIN_GUARDED':priority==='P3'?
  'RETAIN_PENDING_REVIEW':'INVESTIGATE_ONLY';
 const next_proof=signals.includes('DYNAMIC_CONSUMER')?
  'TRACE_REAL_DYNAMIC_TARGET_AND_NEGATIVE_CALLPATH':
  signals.includes('WORKFLOW_HAZARD')?'CHECK_TRIGGER_PERMISSIONS_REQUIRED_STATUS_AND_EQUIVALENCE':
  signals.includes('WORKFLOW_REVIEW')?'COMPARE_TRIGGER_JOB_CONSUMER_AND_REPLACEMENT':
  signals.includes('DOCUMENT_VIGENCY')?'HUMAN_VIGENCY_REVIEW_LINKS_AND_LIVE_REFERENCES':
  signals.includes('NO_LITERAL_IMPORTER')?'PROVE_ENTRYPOINT_OR_INDIRECT_AND_EXTERNAL_CALLERS':
  'PRESERVE_PENDING_MANUAL_SCOPE_AND_CONSUMER_REVIEW';
 return {ok:true,path:pathName,git_blob_sha1:row.git_blob_sha1,priority,decision,
  signals,provisional_role:row.provisional_role,
  consumer_status:row.consumer_status,
  literal_importers:row.literal_importers,
  literal_dependencies:row.literal_dependencies,
  workflow:row.workflow||null,
  next_proof,consumer_closure:'UNKNOWN',human_review:'NOT_ATTESTED',
  delete_authorized:false,workflow_retirement_authorized:false,product_go:false,
  authority:0};
}

/** Cross-check two projections of the SAME original auditor; no invented consumer facts. */
export function derivePrABacklog(census,audit,contract){
 if(contract?.schema!=='ikant-cora-pr-a-backlog/v1'||contract.authority!==0||
   contract.release!=='NO_GO'||contract.evidence_model?.product!=='NO_GO'||
   !Object.values(contract.authority_boundaries||{}).every(x=>x===false)||
   contract.existing_inventory!=='scripts/v5b-repository-governance-audit.mjs#auditRepository'||
   contract.existing_reticulum!=='scripts/cora-minimal-absorption.mjs#observeReticularCensus')
  return invalid('PR_A_CONTRACT_OR_AUTHORITY');
 if(census?.ok!==true||census?.status!=='SOURCE_CANDIDATE_REQUIRES_INDEPENDENT_CI'||
  census.goals?.standardized!=='BLOCKED_EXTERNAL'||census.goals?.product!=='BLOCKED_EXTERNAL'||
  census.permission_to_change!==false||census.product_go!==false||
  !SHA.test(census.git?.head||'')||!SHA.test(census.git?.tree||'')||
  !Array.isArray(census.rows)||census.rows.length!==census.git.tracked)
  return invalid('PR_A_CORa_CENSUS_NOT_QUALIFIED');
 if(audit?.schema!=='ikant-v5b-live-readonly-audit/v1'||
    audit.status!=='SOURCE_INDEXED_NOT_HUMAN_REVIEWED'||audit.errors?.length||
    audit.checked_files!==census.git.tracked||audit.workflow_count!==census.git.workflow_count||
    audit.required_checks!=='UNKNOWN_PROVIDER_NOT_ATTESTED'||
    audit.product_release!=='PRODUCT_NO_GO'||
    !Array.isArray(audit.consumer_index)||audit.consumer_index.length!==census.rows.length||
    !Array.isArray(audit.workflows)||audit.workflows.length!==audit.workflow_count||
    !Array.isArray(audit.dependency_probe?.unresolved_dynamic_candidates))
  return invalid('PR_A_V5B_OR_PROVIDER_MISMATCH');
 const known=new Map();for(const row of audit.consumer_index){
  if(known.has(row.path))return invalid('PR_A_DUPLICATE_CONSUMER');known.set(row.path,row);
 }
 const wf=new Set(audit.workflows.map(x=>x.path));
 if(wf.size!==audit.workflow_count)return invalid('PR_A_DUPLICATE_WORKFLOW');
 const dynamicPaths=new Set();
 for(const entry of audit.dependency_probe.unresolved_dynamic_candidates){
  if(!known.has(entry.path)||!(Number.isInteger(entry.candidates)&&entry.candidates>0))
    return invalid('PR_A_DYNAMIC_TARGET_UNBOUND');
  dynamicPaths.add(entry.path);
 }
 if(dynamicPaths.size!==audit.dependency_probe.dynamic_site_candidates)
  return invalid('PR_A_DYNAMIC_COUNT_DISAGREES');
 const queue=[];const covered=new Set();
 for(const row of census.rows){
  if(covered.has(row.path))return invalid('PR_A_DUPLICATE_RETICULAR_ROW');
  covered.add(row.path);
  const src=known.get(row.path);if(!src||JSON.stringify(src.literal_importers)!==JSON.stringify(row.literal_importers)||
   JSON.stringify(src.literal_dependencies)!==JSON.stringify(row.literal_dependencies)||
   src.status!==row.consumer_status||src.human_verified!==false)
   return invalid('PR_A_CONSUMER_FACT_DRIFT');
  const result=classifyCandidate(row,{dynamicPaths});if(!result.ok)return result;
  if(Boolean(row.workflow)!==wf.has(row.path))return invalid('PR_A_WORKFLOW_SET_DRIFT');
  queue.push(result);
 }
 if(covered.size!==known.size)return invalid('PR_A_MISSING_CENSUS_MEMBER');
 queue.sort((a,b)=>PRIO[a.priority]-PRIO[b.priority]||a.path.localeCompare(b.path,'en'));
 const by_priority={P0:0,P1:0,P2:0,P3:0};const by_signal={};
 for(const r of queue){by_priority[r.priority]++;for(const s of r.signals)by_signal[s]=(by_signal[s]||0)+1;}
 return {ok:true,schema:'ikant-cora-pr-a-live-backlog/v1',source_head:census.git.head,
  source_tree:census.git.tree,source_census:'ORIGINAL_V5B_CORa_READBACK',
  counted_files:queue.length,counted_workflows:wf.size,
  dynamic_path_count:dynamicPaths.size,by_priority,by_signal,rows:queue,
  pr_a_state:'SOURCE_BACKLOG_CANDIDATE_REQUIRES_INDEPENDENT_REVIEW',
  abstract_dod:'PARTIAL_SOURCE_EVIDENCE_ONLY',
  reticulum:{prepared:census.goals.prepared,standardized:census.goals.standardized,
   product:census.goals.product},
  unresolved:{dynamic_and_external_consumers:true,required_checks:true,
   human_review:true,physical_retirement_equivalence:true,product_field_proof:true},
  delete_authorized:false,workflow_retirement_authorized:false,product_go:false,
  authority:0};
}
export function observePrABacklog(){
 const contract=JSON.parse(fs.readFileSync(path.join(ROOT,CONTRACT),'utf8'));
 const census=observeReticularCensus();
 if(!census.ok)return invalid('PR_A_UPSTREAM_CENSUS_FAILED');
 const audit=auditRepository();
 return derivePrABacklog(census,audit,contract);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),all=args.includes('--full'),topArg=args.find(x=>/^--top=\d+$/.test(x));
 if(args.some(x=>x!=='--full'&&!/^--top=\d+$/.test(x)))throw Error('PR_A_UNKNOWN_ARG');
 const top=topArg?Number(topArg.split('=')[1]):20;
 if(!Number.isSafeInteger(top)||top>1000)throw Error('PR_A_TOP_OUT_OF_RANGE');
 const result=observePrABacklog();
 const out=!result.ok?result:all?result:{...result,rows:result.rows.filter(x=>x.priority!=='P3').slice(0,top),
  displayed_rows:Math.min(top,result.by_priority.P0+result.by_priority.P1+result.by_priority.P2)};
 process.stdout.write(JSON.stringify(out,null,2)+'\n');
 if(!result.ok)process.exitCode=1;
}
