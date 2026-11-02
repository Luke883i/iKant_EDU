#!/usr/bin/env node
/** V5-C Host policy: typed evidence from original tests. It never mints owner/provider receipts. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const REQUIRED=Object.freeze([
 ['first_turn','ORIENTATION_ONLY','L04'],['five_blob_readback',true,'L04'],
 ['terms_link_displayed',true,'L04'],['preaccept_extra_reads',false,'L04'],
 ['accept_message','I ACCEPT','L05'],['accept_distinct_turn',true,'L05'],
 ['accept_owner_outcome','NOT_INVOKED','L05'],['source_epoch_unchanged',true,'L05'],
 ['c72_attempt_once',true,'L06'],['edu_message','EDU','L06'],
 ['edu_distinct_turn',true,'L06'],['c72_mode_receipt_reopened',true,'L06'],
 ['coldstart_8_of_8',true,'L07'],['single_physical_carrier',true,'L07'],
 ['private_files_permissions',true,'L07'],['transit_9_of_9',true,'L08'],
 ['transit_original_sha_verified',true,'L08'],['original_10_of_10',true,'L09'],
 ['original_attempt_fence',true,'L09'],['git_tree_complete',true,'L10'],
 ['manifest_all_files',true,'L10'],['source_local_reopen',true,'L10'],
 ['original_c135_executed',true,'L11'],['original_c87_single_writer',true,'L12'],
 ['ledger_independently_reopened',true,'L12'],['c125_at_most_one_send',true,'L13'],
 ['ambiguous_send_replayed',false,'L13'],['s03_same_turn_byte_exact',true,'L14'],
 ['bootstrap_duration_observed',true,'L15'],['recovery_readonly',true,'L16'],
 ['synthetic_owner_receipt_claim',false,'L18'],['provider_delivery_claim_from_ci',false,'L19'],
 ['installed_prompt_claim_from_git',false,'L20'],['product_active_claim_from_tests',false,'L20']
]);
const isPlain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
export function assessV5CFixture(e){
 if(!isPlain(e))return Object.freeze({ok:false,edge:'V5C_BAD_ENVELOPE',active:false});
 if(e.kind!=='CI_FIXTURE_NOT_NATIVE')return Object.freeze({ok:false,edge:'V5C_ORIGIN_MISLABELED',active:false});
 for(const [field,expected,local] of REQUIRED)if(e[field]!==expected)
  return Object.freeze({ok:false,edge:'V5C_'+local+'_'+field,active:false});
 return Object.freeze({ok:true,status:'CI_FIXTURE_PATH_VALID_NOT_NATIVE',
  local_criteria_exercised:20,original_native_event_attested:false,
  installed_prompt_attested:false,owner_receipt_created:false,provider_delivery_attested:false,
  global_dod_attested:false,product_release:'PRODUCT_NO_GO',active:false,authority:0});
}
export function fixtureCandidate(){
 return Object.freeze({kind:'CI_FIXTURE_NOT_NATIVE',...Object.fromEntries(REQUIRED.map(([k,v])=>[k,v])),
  evidence_scope:'SYNTHETIC_CASE_FOR_POLICY_TEST_ONLY'});
}
export function auditOriginalSource(root=ROOT){
 const contract=JSON.parse(fs.readFileSync(path.join(root,'contracts/project-v5c-edu-minimum-dod.json'),'utf8'));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'contracts/project-session-source.json'),'utf8'));
 const expected=[
 ['host/c135-edu-v2-owner.mjs',['./c125-output-port.mjs','./s03-owner-bound-presentation.mjs','./c87-durable-ledger.mjs','../scripts/project-repo-loader.mjs']],
 ['host/project-c72-coldstart-seed.mjs',['C72_COLDSTART_FILES','ownerOutcome','NOT_INVOKED']],
 ['host/project-c72-receipt-transit.mjs',['reopenC72Transit','reopenC72Accepted']],
 ['scripts/project-repo-loader.mjs',['verifyRepositoryPlan','SOURCE_OBJECT_SET_INCOMPLETE']],
 ['host/c87-durable-ledger.mjs',['appendC87Turn','reopenC87Ledger']],
 ['host/c125-output-port.mjs',['createC125HostOutputPort','DELIVERY_UNKNOWN_DO_NOT_RETRY']],
 ['host/s03-owner-bound-presentation.mjs',['projectS03CompletedEduTurn']]
 ];
 const errors=[];
 for(const [p,needles] of expected){
  const contents=fs.readFileSync(path.join(root,p),'utf8');
  for(const needle of needles)if(!contents.includes(needle))errors.push('ORIGINAL_BOUNDARY_MISSING:'+p+':'+needle);
 }
 const localIds=new Set(contract.local.map(x=>x.id));
 if(localIds.size!==20||contract.intermediate.length!==6||contract.global.requires.length!==6||
  contract.intermediate.some(x=>x.locals.some(id=>!localIds.has(id))))errors.push('V5C_DOD_GRAPH_INVALID');
 if(!Array.isArray(manifest.paths)||new Set(manifest.paths).size!==manifest.paths.length||
  !manifest.paths.includes('host/c135-edu-v2-owner.mjs')||
  !manifest.paths.includes('host/project-c72-receipt-transit.mjs')||
  !manifest.paths.includes('host/c87-durable-ledger.mjs'))errors.push('PROJECT_SOURCE_MANIFEST_GAP');
 return Object.freeze({schema:'ikant-v5c-technical-source-boundary/v1',
  ok:errors.length===0,errors,source_manifest_paths:manifest.paths.length,
  required_original_modules:expected.length,original_owner_executed:false,
  native_provider_attested:false,global_dod_attested:false,
  status:errors.length?'STOP':'SOURCE_BOUNDARIES_PRESENT_NOT_RUNTIME_PROOF'});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const a=auditOriginalSource();process.stdout.write(JSON.stringify(a,null,2)+'\n');if(!a.ok)process.exitCode=1;
}
