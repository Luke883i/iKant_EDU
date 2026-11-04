#!/usr/bin/env node
/** PR-C read-only CI hygiene report derived from original V5-B and CORA. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {auditRepository} from './v5b-repository-governance-audit.mjs';
import {observeReticularCensus} from './cora-minimal-absorption.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const POLICY='contracts/cora-pr-c-ci-v1.json';
export const DIRECTIVE=[
 'permissions:',
 '  contents: read',
 'concurrency:',
 '  group: docs-ontology-'+String.fromCharCode(36)+'{{ github.event.pull_request.number || github.ref }}',
 "  cancel-in-progress: "+String.fromCharCode(36)+"{{ github.event_name == 'pull_request' }}",
 ''
].join('\n');
const blobSha=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+String.fromCharCode(0)).update(s).digest('hex');
const invalid=(edge)=>({ok:false,edge,authority:0,retirement_authorized:false,product_go:false,
 human_review_attested:false,required_checks:'UNKNOWN'});
/** Physical byte equivalence via exact Git SHA-1 blob before/after and exact directive removal. */
export function qualifyWorkflowPatch(policy,source){
 const s=policy?.bounded_effect;
 if(policy?.schema!=='ikant-cora-pr-c-ci/v1'||policy.authority!==0||policy.active!==false||
   policy.product_go!==false||policy.release!=='NO_GO'||policy.no_new_authority!==true||
   policy.retirement_authorized!==false||s?.path!=='.github/workflows/docs-ontology-coverage.yml'||
   s.before_blob!=='792fb99a98655cb22c40a7d4002a4c1b147c2843'||
   s.after_blob!=='62d1e83724dcb2d66f933bbdacdd5358dada6c1b'||
   s.deleted!==0||s.added!==0||s.existing_workflows!==116||
   !s.job_names_unchanged||!s.trigger_paths_unchanged||!s.steps_unchanged||
   !s.read_permission_only||!s.main_push_never_cancelled)
  return invalid('PR_C_POLICY_UNBOUND');
 if(typeof source!=='string'||source.split(DIRECTIVE).length!==2||
   !source.includes('\n'+DIRECTIVE+'jobs:\n')||
   blobSha(source)!==s.after_blob)
  return invalid('PR_C_WORKFLOW_NEW_BLOB_NOT_PINNED');
 const previous=source.replace(DIRECTIVE,'');
 if(blobSha(previous)!==s.before_blob)return invalid('PR_C_WORKFLOW_BASELINE_NON_EQUIVALENCE');
 return {ok:true,status:'ONE_EXACT_REVERSIBLE_CI_DELTA',path:s.path,old_blob:s.before_blob,
  new_blob:s.after_blob,contents_read:true,pr_superseded_only:true,
  baseline_events_jobs_commands_byte_identical:true,authority:0,product_go:false,
  retirement_authorized:false,human_review_attested:false,required_checks:'UNKNOWN'};
}
export function qualifyPrCCISource({policy,source,audit,cora}={}){
 const scoped=qualifyWorkflowPatch(policy,source);if(!scoped.ok)return scoped;
 if(audit?.schema!=='ikant-v5b-live-readonly-audit/v1'||
   audit.status!=='SOURCE_INDEXED_NOT_HUMAN_REVIEWED'||audit.errors?.length||
   audit.workflow_count!==116||audit.retired_workflows?.length!==5||
   audit.required_checks!=='UNKNOWN_PROVIDER_NOT_ATTESTED'||audit.product_release!=='PRODUCT_NO_GO'||
   !Array.isArray(audit.workflows)||audit.workflows.length!==116||
   cora?.ok!==true||cora.status!=='SOURCE_CANDIDATE_REQUIRES_INDEPENDENT_CI'||
   cora.goals?.standardized!=='BLOCKED_EXTERNAL'||cora.goals?.product!=='BLOCKED_EXTERNAL'||
   cora.git?.workflow_count!==116||cora.permission_to_change!==false)
  return invalid('PR_C_ORIGINAL_V5B_CORA_RECONCILIATION_FAILED');
 const rows=audit.workflows,found=rows.filter(x=>x.path===policy.bounded_effect.path);
 if(found.length!==1||found[0].blob_sha1!==policy.bounded_effect.after_blob)
  return invalid('PR_C_WORKFLOW_NOT_IN_ORIGINAL_INVENTORY');
 const flags={};
 for(const w of rows){for(const flag of w.flags||[])flags[flag]=(flags[flag]||0)+1;}
 return {ok:true,source_status:'SOURCE_CANDIDATE_REQUIRES_EXTERNAL_REVIEW',
  original_census:'V5B_AND_CORA_SAME_CHECKOUT',workflow_count:rows.length,
  retired_workflows:5,added_workflows:0,deleted_workflows:0,
  scoped_delta:scoped,workflow_flag_counts:flags,
  evidence_cuts:{git:'SOURCE_OBSERVED',source_ci:'SOURCE_CANDIDATE',
   required_checks:'UNKNOWN',human_review:'NOT_ATTESTED',provider:'NOT_ATTESTED',
   product:'NO_GO'},authority:0,product_go:false,retirement_authorized:false,
  human_review_attested:false};
}
export function observePrCCISource(){
 const policy=JSON.parse(fs.readFileSync(path.join(ROOT,POLICY),'utf8'));
 const yaml=fs.readFileSync(path.join(ROOT,policy.bounded_effect.path),'utf8');
 const audit=auditRepository();
 const cora=observeReticularCensus();
 return qualifyPrCCISource({policy,source:yaml,audit,cora});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('PR_C_UNKNOWN_ARGUMENT');
 const r=observePrCCISource();process.stdout.write(JSON.stringify(r,null,2)+'\n');
 if(!r.ok)process.exitCode=1;
}
