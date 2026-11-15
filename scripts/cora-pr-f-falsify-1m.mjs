#!/usr/bin/env node
/** Repeatable finite semantic falsifier. No Git edits, owner calls or provider receipts. */
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const GATES=['F01','F02','F03','F04','F05','F06','F07','F08','F09','F10','F11','F12'];
const FULL=(1<<GATES.length)-1;
export const FAMILIES=Object.freeze([
 ['head replaced by prior epoch',0],['tree truncated but HEAD retained',0],
 ['index disagrees with full tree',0],['untracked source passed off as Git',0],
 ['V5B unregistered deletion concealed',1],['V5B changed blob undeclared',1],
 ['V5B consumer UNKNOWN promoted UNUSED',1],['V5B duplicated indexed path',1],
 ['C72 original SHA substituted',2],['C135 runtime module substituted',2],
 ['C87 single writer changed',2],['C125/S03 ack altered or workflow retired',2],
 ['generated Markdown atlas stale',3],['setup references old LE git clone',3],
 ['document hyperlink no longer resolves',3],['history becomes operational owner',3],
 ['CORA census differs from V5B readback',4],['PR-A dynamic consumer silently dropped',4],
 ['PR-C workflow status declared PASS from YAML',4],['PR-D2 duplicate audit reintroduced',4],
 ['test run uses old commit',5],['npm check step omitted',5],
 ['Node20/22 behavior disagreement hidden',5],['clean checkout depends on private cache',5],
 ['seed differs without provenance',6],['falsifier corpus has missing family',6],
 ['mutation outcome unchecked',6],['positive control incorrectly auto promotes',6],
 ['computed dynamic import missed',7],['shell or Python caller unseen',7],
 ['external deployment consumer unqualified',7],['critical consumer marked unused from absence',7],
 ['restore replaces historical bytes',8],['rollback untested',8],
 ['unregistered source deletion retained',8],['workflow restore changes job name',8],
 ['required check inferred from YAML',9],['branch rules unreadable 403',9],
 ['CI from previous SHA accepted',9],['workflow path-filtered required check never ran',9],
 ['author counts as independent approver',10],['CI reviewer counted as human',10],
 ['two reviews by same engineer',10],['human decision absent',10],
 ['postmerge readback on old HEAD',11],['clean checkout not repeated after merge',11],
 ['postmerge negative suite skipped',11],['runtime receipt substituted for merge gate',11]
].map(([name,gate])=>Object.freeze({name,gate})));
const invalid=(edge)=>({eligible_model:false,first_edge:edge,
 repository_standardized:false,product_go:false,active:false,authority:0});
/** Model only: even ALL true cannot authorize standardization or owner evidence. */
export function assessSemanticCut(mask,metadata){
 if(!Number.isInteger(mask)||mask<0||mask>FULL)return invalid('INVALID_BITSET');
 if(metadata?.authority!==0||metadata?.source_kind!=='FINITE_SEMANTIC_MODEL'||
  metadata.claim_human_review!==false||metadata.claim_product_go!==false||
  metadata.claim_admin_required_checks!==false||metadata.claim_native_delivery!==false)
  return invalid('FORGED_EXTERNAL_OR_AUTHORITY');
 for(let i=0;i<GATES.length;i++){
  if((mask&(1<<i))===0)return invalid(GATES[i]+'_NOT_PROVEN');
 }
 return {eligible_model:true,first_edge:'MODEL_COMPLETE_NOT_A_RECEIPT',
  repository_standardized:false,product_go:false,active:false,authority:0};
}
export function runFMutations({cases=1000000,seed=20261104}={}){
 if(!Number.isSafeInteger(cases)||cases<FAMILIES.length||cases>1000000||
    !Number.isInteger(seed)||FAMILIES.length!==48)
  throw new Error('F_MUTATOR_INPUT_OUT_OF_BOUNDS');
 let state=seed>>>0,negative=0,positive=0,escaped=0,oracle_disagreements=0;
 const byFamily=new Uint32Array(FAMILIES.length),hash=crypto.createHash('sha256');
 const batch=Buffer.allocUnsafe(2048*12);let offset=0;
 const metadataBase={authority:0,source_kind:'FINITE_SEMANTIC_MODEL',
  claim_human_review:false,claim_product_go:false,
  claim_admin_required_checks:false,claim_native_delivery:false};
 for(let i=0;i<cases;i++){
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  const family=i<FAMILIES.length?i:state%FAMILIES.length;
  byFamily[family]++;
  const positiveControl=(i%256)===255;
  let mask=positiveControl?FULL:FULL^(1<<FAMILIES[family].gate);
  // Independent overlapping hazards; one defect never repairs a second defect.
  if(!positiveControl&&i%17===0)mask&=~(1<<((state>>>8)%GATES.length));
  const metadata={...metadataBase};
  if(!positiveControl){
   if(i%97===0)metadata.claim_product_go=true;
   if(i%101===0)metadata.claim_human_review=true;
   if(i%103===0)metadata.claim_admin_required_checks=true;
   if(i%107===0)metadata.claim_native_delivery=true;
   if(i%109===0)metadata.authority=1;
  }
  const actual=assessSemanticCut(mask,metadata);
  // Independent integer oracle, separate from the model's ordered loop.
  const metadataValid=metadata.authority===0&&
   metadata.claim_product_go===false&&metadata.claim_human_review===false&&
   metadata.claim_admin_required_checks===false&&metadata.claim_native_delivery===false;
  const expectedFull=metadataValid&&mask===FULL;
  const missing=FULL&(~mask);
  let expectedEdge='MODEL_COMPLETE_NOT_A_RECEIPT';
  if(!metadataValid)expectedEdge='FORGED_EXTERNAL_OR_AUTHORITY';
  else if(missing!==0){
   const lowest=missing&(-missing);
   const bit=31-Math.clz32(lowest);
   expectedEdge=GATES[bit]+'_NOT_PROVEN';
  }
  if(actual.eligible_model!==expectedFull||actual.first_edge!==expectedEdge)
   oracle_disagreements++;
  if(actual.repository_standardized||actual.product_go||actual.active||actual.authority!==0)
   escaped++;
  if(expectedFull)positive++;else negative++;
  batch.writeUInt32LE(i,offset);
  batch.writeUInt32LE(state,offset+4);
  batch.writeUInt32LE(((mask<<16)^(family<<8)^(actual.eligible_model?1:0)^
   (actual.first_edge==='FORGED_EXTERNAL_OR_AUTHORITY'?2:0))>>>0,offset+8);
  offset+=12;
  if(offset===batch.length){hash.update(batch);offset=0;}
 }
 if(offset)hash.update(batch.subarray(0,offset));
 const covered=byFamily.filter(x=>x>0).length;
 return {schema:'ikant-cora-pr-f-falsification/v1',seed:seed>>>0,cases,
  preseeded_families:FAMILIES.length,covered_families:covered,
  positive_model_controls:positive,negative_semantic_vectors:negative,
  unsafe_promotions:escaped,oracle_disagreements,
  digest_sha256:hash.digest('hex'),
  git_edits:0,owner_calls:0,provider_events:0,human_reviews:0,
  meaning:'FINITE_SEMANTIC_MODEL_NOT_PHYSICAL_GIT_OR_PROVIDER_EVIDENCE',
  pass:covered===FAMILIES.length&&escaped===0&&oracle_disagreements===0&&
   positive>0&&negative>0};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length>4)throw Error('F_MUTATOR_UNKNOWN_ARG');
 const cases=process.argv[2]?Number(process.argv[2]):1000000;
 const seed=process.argv[3]?Number(process.argv[3]):20261104;
 const r=runFMutations({cases,seed});
 process.stdout.write(JSON.stringify(r,null,2)+'\n');
 if(!r.pass)process.exitCode=1;
}
