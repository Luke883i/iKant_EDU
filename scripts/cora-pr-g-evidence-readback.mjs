#!/usr/bin/env node
/** Read-only PR-G evidence packet. Extends original PR-F, not an owner or approval. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {observePrFSource,validateFContract} from './cora-pr-f-qualification.mjs';
import {censusRepo} from './project-review-callsites.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const CONTRACT='contracts/cora-pr-f-integrated-qualification-v1.json';
const SHA=/^[0-9a-f]{40}$/u;
const SOURCE=['F01','F02','F03','F04','F05'];
const CHECK=['F01','F02','F03','F04','F05','F06','F07','F08','F09',
 'F10','F11','F12','X_PRODUCT','I_SOURCE','I_ENGINEERING','I_EXTERNAL',
 'G_REPOSITORY_STANDARDIZED','G_PRODUCT_QUALIFIED'];
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8',timeout:20000}).trim();
const fail=(edge)=>({ok:false,first_edge:edge,status:'SOURCE_DEBT_BLOCKED',
 authority:0,active:false,repository_standardized:false,product_go:false,
 approval:'NOT_ATTESTED',provider:'NOT_ATTESTED'});
/** Pure witness corroboration. Fake CI/review fields do NOT become a PASS. */
export function qualifyGEvidence({f,callsite,contract,head,tree,trackedDigest}={}){
 if(!contract||validateFContract(contract).ok!==true||
   JSON.stringify(contract.reticulum.map(x=>x.id))!==JSON.stringify(CHECK))
  return fail('G_ORIGINAL_F_RETICULUM_INVALID');
 if(f?.ok!==true||f.status!=='PR_F_SOURCE_CANDIDATE_EXTERNAL_GATES_OPEN'||
  f.authority!==0||f.active!==false||f.product_go!==false||
  f.repo_standardized!==false||f.human_review!=='NOT_ATTESTED'||
  f.postmerge!=='NOT_ATTESTED'||
  f.model?.repository_standardized!==false||
  f.model?.product_go!==false||
  f.original_reticulum?.standardized!=='BLOCKED_EXTERNAL'||
  f.original_reticulum?.product!=='BLOCKED_EXTERNAL')
  return fail('G_ORIGINAL_F_NOT_SOURCE_QUALIFIED');
 if(!SHA.test(head||'')||!SHA.test(tree||'')||
  f.source?.head!==head||f.source?.tree!==tree||
  !SHA.test(f.source?.workflow_tree||'')||
  f.source.workflow_tree!=='d81958913446a13f5fb296d20771c7e57e2df224')
  return fail('G_HEAD_TREE_OR_WORKFLOW_DRIFT');
 const metrics=f.metrics||{};
 if(metrics.M01!==0||metrics.M02!==1||metrics.M03!==4||
  metrics.M04!==116||metrics.M05!==f.source.workflow_tree||
  metrics.M06!==11||metrics.M07!==0||metrics.M08!==true||
  metrics.M09!==8||metrics.M10!==1||metrics.M11!==true||
  !f.recovery?.byte_exact_subset||f.recovery.restored?.length!==11||
  f.recovery.historical_status!=='HISTORICAL_NOT_RUNTIME'||
  f.documents?.atlas_exact!==true||f.documents.source_qualified!==true||
  f.ci?.source_qualified!==true||
  f.ci?.required_checks!=='UNKNOWN_PROVIDER_NOT_ATTESTED')
  return fail('G_SOURCE_METRICS_NOT_INDEPENDENTLY_RECONCILED');
 if(!SOURCE.every(k=>f.witnesses?.[k]===true)||
   f.witnesses?.F06!==false||f.witnesses?.F07!==false||
   f.witnesses?.F08!==false||f.witnesses?.F09!==false||
   f.witnesses?.F10!==false||f.witnesses?.F11!==false||
   f.witnesses?.F12!==false||f.witnesses?.X_PRODUCT!==false)
  return fail('G_PREMATURE_F_GATE_PROMOTION');
 if(callsite?.schema!=='ikant-host-callsite-census/v1'||
   callsite.authority!==0||
   callsite.epistemic_status!=='SOURCE_LEXICAL_CENSUS_NOT_RUNTIME_REACHABILITY'||
   !Array.isArray(callsite.callsites)||!Number.isSafeInteger(callsite.callsite_count)||
   !Number.isSafeInteger(callsite.unknown_target_count)||
   callsite.callsite_count!==callsite.callsites.length||
   callsite.tracked_file_count!==f.source.tracked||
   callsite.unknown_target_count!==
      callsite.callsites.filter(x=>x.qualification==='DYNAMIC_TARGET_UNKNOWN').length||
   callsite.source_sha256!==trackedDigest||
   !/^[a-f0-9]{64}$/u.test(trackedDigest||''))
  return fail('G_CALLSITE_SOURCE_NOT_RECONCILED');
 const seen=new Set();
 for(const c of callsite.callsites){
  if(typeof c?.path!=='string'||!Number.isInteger(c.line)||c.line<1||
   !['LITERAL','DYNAMIC_TARGET_UNKNOWN'].includes(c.qualification)||
   (c.qualification==='DYNAMIC_TARGET_UNKNOWN'&&c.target!==null)||
   (c.qualification==='LITERAL'&&typeof c.target!=='string')||
   typeof c.kind!=='string'||typeof c.expression!=='string')
   return fail('G_CALLSITE_ROW_UNQUALIFIED');
  seen.add(c.path);
 }
 const unresolved=callsite.callsites.filter(x=>x.qualification==='DYNAMIC_TARGET_UNKNOWN');
 const sourceObserved=Object.fromEntries(SOURCE.map(id=>[id,'SOURCE_OBSERVED_NOT_HUMAN_REVIEW']));
 const gates={
  ...sourceObserved,
  F06:'CLEAN_ROOM_TEST_AND_EXACT_HEAD_CI_EXTERNAL',
  F07:'CI_ORIGINAL_ONE_MILLION_REPLAY_EXTERNAL',
  F08:'DYNAMIC_EXTERNAL_CONSUMER_REVIEW_OPEN',
  F09:'ELEVEN_BLOBS_REOPENED_FULL_ROLLBACK_REVIEW_OPEN',
  F10:'GITHUB_ADMIN_REQUIRED_CHECKS_UNKNOWN',
  F11:'TWO_INDEPENDENT_ENGINEERS_HUMAN_DECISION_NOT_ATTESTED',
  F12:'POSTMERGE_FRESH_CHECKOUT_NOT_ATTESTED',
  X_PRODUCT:'ORIGINAL_RUNTIME_AND_USER_HOLDOUT_NOT_ATTESTED',
  I_SOURCE:'SOURCE_OBSERVED_NOT_OWNER_APPROVED',
  I_ENGINEERING:'CI_AND_ROLLBACK_OPEN',
  I_EXTERNAL:'HUMAN_PROVIDER_EXTERNAL_OPEN',
  G_REPOSITORY_STANDARDIZED:'BLOCKED_EXTERNAL',
  G_PRODUCT_QUALIFIED:'BLOCKED_EXTERNAL'
 };
 const evidence={
  source:{head,tree,tracked:f.source.tracked,
   workflow_tree:f.source.workflow_tree,owner_pins_observed:metrics.M03,
   historically_registered_missing_paths:f.source.previously_registered_missing_paths,
   restored_original_blobs:metrics.M06},
  original_F_nodes:contract.reticulum.map(n=>({id:n.id,requires:n.needs,
   evidence_level:n.scope,status:gates[n.id]})),
  consumers:{lexical_callsites:callsite.callsite_count,
   dynamic_unknown:unresolved.length,source_files_with_callsites:seen.size,
   original_f_unverified_consumers:f.backlog?.unverified_consumers,
   unresolved_callsites:unresolved.map(x=>({
    path:x.path,line:x.line,kind:x.kind,expression:x.expression,
    closure:'REVIEW_REQUIRED_NOT_RUNTIME_REACHABILITY'})),
   closure:'UNKNOWN_REQUIRES_INDEPENDENT_REVIEW'},
  required_checks:'UNKNOWN_ADMIN_READBACK',
  independent_engineers:0,independent_engineer_evidence:'NOT_ATTESTED',
  human_decision:'NOT_ATTESTED',postmerge_fresh_readback:'NOT_ATTESTED',
  native_delivery:'NOT_ATTESTED',user_value:'NOT_ATTESTED'
 };
 const evidence_digest_sha256=hash(JSON.stringify(evidence));
 return {ok:true,status:'SOURCE_PACKET_READY_EXTERNAL_DOD_BLOCKED',
  first_edge:'F06_CLEAN_ROOM_TEST_AND_EXACT_HEAD_CI_NOT_IN_THIS_PACKET',
  original_DOD:'contracts/cora-pr-f-integrated-qualification-v1.json',
  ...evidence,evidence_digest_sha256,
  source_evidence_only:true,external_closure:false,authority:0,active:false,
  repository_standardized:false,product_go:false,
  permission_to_delete:false,permission_to_merge:false,
  approval:'NOT_ATTESTED',provider:'NOT_ATTESTED'};
}
export function observePrGEvidence(){
 const contract=JSON.parse(fs.readFileSync(path.join(ROOT,CONTRACT),'utf8'));
 const f=observePrFSource(),callsite=censusRepo(ROOT);
 const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
 const paths=execFileSync('git',['ls-files','-z'],{cwd:ROOT})
  .toString('utf8').split('\0').filter(Boolean).sort();
 const trackedDigest=hash(paths.join('\n'));
 return qualifyGEvidence({f,callsite,contract,head,tree,trackedDigest});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('PR_G_UNKNOWN_ARGUMENT');
 let result;
 try{result=observePrGEvidence();}catch(e){
  result={...fail('G_READBACK_EXCEPTION'),
   message:String(e?.message||e).slice(0,250)};
 }
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
 if(!result.ok)process.exitCode=1;
}
