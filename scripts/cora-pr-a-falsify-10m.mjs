#!/usr/bin/env node
/** Finite pre-seeded evidence-cut mutations; NOT 10M Git edits or user sessions. */
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const EVIDENCE_KEYS=Object.freeze([
 'head_pinned','tree_complete','blob_identical','path_unique',
 'role_human_reviewed','literal_consumers_closed','dynamic_consumers_closed',
 'external_consumers_closed','original_owner_stable','same_head_regressions',
 'behavior_equivalent','rollback_reopened','workflow_checks_readback',
 'permissions_verified','human_two_independent_reviewers','human_decision',
 'document_vigency_reviewed','provider_boundary_honest'
]);
export const PRESEEDED=Object.freeze([
 ['rename HEAD drift','SOURCE',0],['tree truncated','SOURCE',1],
 ['checkout blob mismatch','SOURCE',2],['case-fold path collision','SOURCE',3],
 ['role inferred from directory','INVENTORY',4],['local importer omitted','CONSUMER',5],
 ['computed dynamic import','CONSUMER',6],['external Host caller unseen','CONSUMER',7],
 ['C72 module replaced','OWNER',8],['tests on previous HEAD','SOFTWARE',9],
 ['equal SHA mistaken for behavior','SOFTWARE',10],['restore plan never exercised','SOFTWARE',11],
 ['required check inferred from YAML','WORKFLOW',12],['workflow writes unreviewed','WORKFLOW',13],
 ['CI reviewer counted as human','REVIEW',14],['merge policy without decision','REVIEW',15],
 ['historical doc treated current','DOCUMENT',16],['native delivery claimed from CI','PROVIDER',17],
 ['conditional exports consumer','CONSUMER',6],['Python shell caller','CONSUMER',7],
 ['generated prompt absent','SOURCE',2],['two candidate registries','INVENTORY',4],
 ['workflow dispatch still live','WORKFLOW',12],['branch rule API returned 403','WORKFLOW',12],
 ['self-approval by author','REVIEW',14],['transitive owner consumer missed','OWNER',8],
 ['migration dependency missing','CONSUMER',5],['obsolete README launch URL','DOCUMENT',16],
 ['private callback unbound','PROVIDER',17],['CI green but failed host','PROVIDER',17],
 ['same run generated evidence drift','SOURCE',2],['retired status name mismatch','WORKFLOW',12],
 ['unverified action permissions','WORKFLOW',13],['semantic tests only','SOFTWARE',9],
 ['mutation original control missing','SOFTWARE',10],['restore path not readable','SOFTWARE',11],
 ['manifest path consumer missing','CONSUMER',6],['missing human signoff','REVIEW',15],
 ['unproven user task benefit','PROVIDER',17],['archaeology referenced by live test','DOCUMENT',16]
].map(x=>Object.freeze(x)));
const FULL=(1<<EVIDENCE_KEYS.length)-1;

/** Pure readiness signal, authority zero even with complete evidence. */
export function assessEvidence(f){
 if(!f||typeof f!=='object'||Array.isArray(f)||f.authority!==0||
    f.claim_active!==false||f.claim_auto_retire!==false||
    f.source_status!=='GIT_OBSERVED_NOT_PROVIDER')
  return {evidence_complete:false,automatic_retirement:false,product_go:false,authority:0};
 for(const k of EVIDENCE_KEYS)if(f[k]!==true)
  return {evidence_complete:false,automatic_retirement:false,product_go:false,authority:0};
 return {evidence_complete:true,automatic_retirement:false,product_go:false,authority:0};
}
function factsFromBits(bits){
 const f={authority:0,claim_active:false,claim_auto_retire:false,
  source_status:'GIT_OBSERVED_NOT_PROVIDER'};
 for(let j=0;j<EVIDENCE_KEYS.length;j++)f[EVIDENCE_KEYS[j]]=Boolean(bits&(1<<j));
 return f;
}
export function runSemanticFalsifier({iterations=10000000,seed=20261104}={}){
 if(!Number.isSafeInteger(iterations)||iterations<1||iterations>10000000||
    !Number.isInteger(seed))throw Error('PR_A_FALSIFIER_INPUT_INVALID');
 let state=seed>>>0,negative=0,positive=0,unsafe=0,mismatches=0;
 const seen=new Uint32Array(PRESEEDED.length),hasher=crypto.createHash('sha256');
 for(let i=0;i<iterations;i++){
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  const family=i<PRESEEDED.length?i:state%PRESEEDED.length;
  seen[family]++;
  const primary=PRESEEDED[family][2];
  // 1 in 64 full-gate positive controls, always non-authorizing.
  let bits=(i&63)===0?FULL:FULL^(1<<primary);
  if(bits!==FULL&&i%7===0){const secondary=(state>>>9)%EVIDENCE_KEYS.length;
   bits &= ~(1<<secondary);
  }
  const facts=factsFromBits(bits);
  // Mimic a forged human/provider claim; it must never grant effect authority.
  if(i%131===0)facts.claim_auto_retire=true;
  if(i%173===0)facts.claim_active=true;
  if(i%211===0)facts.source_status='NATIVE_PROVEN_BY_CI';
  const result=assessEvidence(facts);
  // Independent bit-vector oracle with a separate control-signal integrity check.
  const expectedComplete=bits===FULL&&facts.claim_auto_retire===false&&
   facts.claim_active===false&&facts.source_status==='GIT_OBSERVED_NOT_PROVIDER';
  if(result.evidence_complete!==expectedComplete)mismatches++;
  if(result.automatic_retirement||result.product_go||result.authority!==0)unsafe++;
  if(expectedComplete)positive++;else negative++;
  // Digest the observed oracle cut and full seeded family/bits, not only totals.
  const tuple=Buffer.allocUnsafe(12);
  tuple.writeUInt32LE(i,0);tuple.writeUInt32LE(state,4);
  tuple.writeUInt32LE((bits^(result.evidence_complete?0x80000000:0))>>>0,8);
  hasher.update(tuple);
 }
 const result={schema:'ikant-cora-pr-a-semantic-mutations/v1',seed:seed>>>0,
  iterations,preseeded_families:PRESEEDED.length,covered_families:seen.filter(x=>x>0).length,
  negative,positive,unsafe_authority_promotions:unsafe,oracle_mismatches:mismatches,
  digest_sha256:hasher.digest('hex'),source_mutations:0,
  method:'SEEDED_FINITE_FAULT_VECTOR_WITH_INDEPENDENT_BITSET_ORACLE',
  claim:'SEMANTIC_MODEL_ONLY_NO_GIT_RUNTIME_PROVIDER_OR_HUMAN_EVIDENCE',
  pass:mismatches===0&&unsafe===0&&seen.every(x=>x>0)};
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length>4)throw Error('PR_A_FALSIFIER_ARG_COUNT');
 const count=process.argv[2]?Number(process.argv[2]):10000000;
 const seed=process.argv[3]?Number(process.argv[3]):20261104;
 const result=runSemanticFalsifier({iterations:count,seed});
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
 if(!result.pass)process.exitCode=1;
}
