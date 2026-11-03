#!/usr/bin/env node
/**
 * One million deterministic SEMANTIC source-bound candidate mutations:
 * 25 failure families x 40,000 seeded cases, plus 2,000 positive controls.
 * Tests the real structural gate. Never contacts providers, executes C72,
 * issues receipts, changes GitHub name, or claims administrative GO.
 */
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {assessRenameSourceCandidate,buildRenameSourceCandidate,
 RENAME_OLD,RENAME_NEW} from './repository-rename-source-phase.mjs';

export const SEED=0x5eed2026;
export const FAMILIES=25;
export const CASES_PER_FAMILY=40000;
const names=['REPOSITORY_ID_SPOOF','EXACT_NAME_LOOKALIKE','BOOTSTRAP_NAME_DRIFT',
 'ADMISSION_NAME_DRIFT','C72_CONTRACT_NAME_DRIFT','CASE_SPOOF','UNICODE_HOMOGRAPH',
 'FOREIGN_BRANCH','HEAD_DRIFT','HEAD_TRUNCATION','TREE_DRIFT','TREE_TRUNCATION',
 'SOURCE_EPOCH_TRANSFER','TERMS_REPO_DRIFT','TERMS_HEAD_DRIFT',
 'TERMS_EVIL_HOST','HUMAN_ACCEPT_VARIANT','SAME_TURN_ACCEPTANCE',
 'OWNER_OUTCOME_UNKNOWN','OLD_RECEIPT_TRANSFER','NATIVE_RECEIPT_FORGERY',
 'PROVIDER_INSTALL_FORGERY','ADMIN_RENAME_CLAIM','DUAL_CANONICAL_ALIAS',
 'EXTRA_UNTRUSTED_FIELD'];
const EXPECTED=['REPOSITORY_ID_MISMATCH','SINGLE_CANONICAL_SOURCE_MISMATCH',
 'SINGLE_CANONICAL_SOURCE_MISMATCH','SINGLE_CANONICAL_SOURCE_MISMATCH',
 'SINGLE_CANONICAL_SOURCE_MISMATCH','SINGLE_CANONICAL_SOURCE_MISMATCH',
 'SINGLE_CANONICAL_SOURCE_MISMATCH','SOURCE_BRANCH_NOT_MAIN','SOURCE_HEAD_DRIFT',
 'SOURCE_HEAD_DRIFT','SOURCE_TREE_DRIFT','SOURCE_TREE_DRIFT','SOURCE_EPOCH_MISMATCH',
 'TERMS_SOURCE_OR_HEAD_MISMATCH','TERMS_SOURCE_OR_HEAD_MISMATCH',
 'TERMS_SOURCE_OR_HEAD_MISMATCH','HUMAN_GATE_NOT_OBSERVED_IN_DISTINCT_TURN',
 'HUMAN_GATE_NOT_OBSERVED_IN_DISTINCT_TURN','OWNER_ATTEMPT_FENCE',
 'UNAUTHORIZED_AUTHORITY_PROMOTION','UNAUTHORIZED_AUTHORITY_PROMOTION',
 'UNAUTHORIZED_AUTHORITY_PROMOTION','UNAUTHORIZED_AUTHORITY_PROMOTION',
 'DUAL_CANONICAL_OR_ALIAS','INCOMPLETE_OR_SURPLUS_EVIDENCE'];
function prng(seed){let x=seed>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;};}
function hex40(next){let s='';for(let i=0;i<5;i++)s+=next().toString(16).padStart(8,'0');return s;}
function mutation(x,f,i,other){
 switch(f){
 case 0:x.repo_id=1371330384+(i%80);break;
 case 1:x.observed_full_name+='-fork-'+i;break;
 case 2:x.bootstrap_repository=other;break;
 case 3:x.admission_repository=other;break;
 case 4:x.c72_contract_repository=other;break;
 case 5:x.observed_full_name=x.observed_full_name.toLowerCase();break;
 case 6:x.observed_full_name=x.observed_full_name.replace('iKant','іKant');break; // Cyrillic i.
 case 7:x.observed_branch=i%2?'develop':'master';break;
 case 8:x.observed_head=String((BigInt('0x'+x.source_head)+1n).toString(16)).padStart(40,'0');break;
 case 9:x.source_head=x.source_head.slice(1);break;
 case 10:x.observed_tree=String((BigInt('0x'+x.source_tree)+1n).toString(16)).padStart(40,'0');break;
 case 11:x.source_tree=x.source_tree.slice(0,-1);break;
 case 12:x.source_epoch=x.source_epoch+'/previous';break;
 case 13:x.terms_link=x.terms_link.replace(x.observed_full_name,other);break;
 case 14:x.terms_link=x.terms_link.replace('/'+x.source_head+'/','/'+x.source_tree+'/');break;
 case 15:x.terms_link=x.terms_link.replace('github.com','github.com.attacker.invalid');break;
 case 16:x.human_message=['I ACCEPT ','i accept','I ACCEPT\n','EDU'][i%4];break;
 case 17:x.human_turn=i%2?1:3;break;
 case 18:x.owner_outcome=['UNKNOWN','SUCCEEDED','INVOKED'][i%3];break;
 case 19:x.old_receipt_reused=true;break;
 case 20:x.native_receipt_claim=true;break;
 case 21:x.provider_installed_claim=true;break;
 case 22:x.admin_rename_performed=true;break;
 case 23:x.aliases=[x.observed_full_name,other];break;
 case 24:x.__untrusted_authority_override='allow-rename-'+i;break;
 default:throw Error('FAMILY_NOT_IMPLEMENTED');
 }
}
export function millionMutationReport({seed=SEED}={}){
 const next=prng(seed),digest=createHash('sha256'),failures=[],counts=[];
 for(let f=0;f<FAMILIES;f++){
  let rejected=0;
  for(let i=0;i<CASES_PER_FAMILY;i++){
   const phase=(next()&1)?'OLD':'NEW',head=hex40(next),tree=hex40(next);
   const candidate=buildRenameSourceCandidate(phase,head,tree);
   const opposite=phase==='OLD'?RENAME_NEW:RENAME_OLD;
   mutation(candidate,f,i,opposite);
   const result=assessRenameSourceCandidate(candidate);
   if(result.ok!==false||result.edge!==EXPECTED[f]||result.rename_go!==false||
      result.active!==false||result.authority!==0){
    failures.push({family:names[f],index:i,edge:result.edge,ok:result.ok});
    if(failures.length>=5)throw Error('MUTATION_ASSERTION_FAILED:'+JSON.stringify(failures));
   }else rejected++;
   // Deterministic transcript digest: no reliance on wall clock or ephemeral run ID.
   digest.update(f+':'+i+':'+result.edge+'\n');
  }
  counts.push({family:names[f],tested:CASES_PER_FAMILY,rejected,edge:EXPECTED[f]});
 }
 let positive=0;
 for(let i=0;i<2000;i++){
  const phase=i%2?'OLD':'NEW',x=buildRenameSourceCandidate(phase,hex40(next),hex40(next));
  const result=assessRenameSourceCandidate(x);
  if(result.ok!==true||result.status!=='STRUCTURAL_SOURCE_CONSISTENT_ONLY'||
      result.authority!==0||result.rename_go!==false||result.provider_proven!==false||
      result.native_owner_proven!==false)throw Error('POSITIVE_CONTROL_FAILED:'+i);
  positive++;digest.update('P:'+i+':'+result.status+'\n');
 }
 return Object.freeze({schema:'ikant-rename-million-semantic-mutations/v1',seed:'0x'+seed.toString(16),
  model:'STRUCTURAL_SOURCE_BOUNDARY_NOT_NATIVE_PROVENANCE',
  families:FAMILIES,per_family:CASES_PER_FAMILY,
  negative_cases:FAMILIES*CASES_PER_FAMILY,negative_rejected:counts.reduce((n,x)=>n+x.rejected,0),
  positive_controls:2000,positive_admitted:positive,counts,
  transcript_sha256:digest.digest('hex'),failures,
  actual_admin_rename:false,owner_invoked:false,provider_attested:false,rename_go:false});
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const a=millionMutationReport(),output=JSON.stringify(a,null,2)+'\n';
 const file=process.argv[2];
 if(file){
  const fd=fs.openSync(file,'wx',0o600);
  try{fs.writeFileSync(fd,output);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  if(fs.readFileSync(file,'utf8')!==output)throw Error('MUTATION_REPORT_READBACK_FAILED');
 }
 process.stdout.write(output);
 if(a.negative_rejected!==1000000||a.positive_admitted!==2000||a.failures.length)process.exitCode=1;
}
