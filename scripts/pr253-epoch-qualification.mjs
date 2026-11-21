#!/usr/bin/env node
/** PR253 history-bound forensics. Never treats an old pass as current release.
 * Exact product HEAD gate + immutable historical PR251 forensic epoch.
 */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {qualifyPr251SourceEpoch,qualifyEduOneZipSourceEpoch} from './v5b-repository-governance-audit.mjs';
export const PR251_EPOCH='888a5878a30864e6db7813b3d8b236cde46cce40';
export const PR251_TREE='6dab517b2ef0462b9c1222dc9ec2a8c164344977';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const git=(...a)=>execFileSync('git',a,{cwd:ROOT,encoding:'utf8',maxBuffer:16e6}).trim();
export function qualifyEpochBoundary(p){
 const sha=/^[0-9a-f]{40}$/;
 const ok=sha.test(p?.head||'')&&sha.test(p?.tree||'')&&
  p?.historical===PR251_EPOCH&&p?.historical_tree===PR251_TREE&&
  p?.ancestor===true&&p?.event_head===p?.head&&p?.clean_index===true&&
  p?.historic?.ok===true&&p.historic.product_go===false&&
  p?.current?.ok===true&&p.current.product_go===false&&
  p?.current?.source_main===PR251_EPOCH&&
  p?.release_claim===false&&p?.native_host_attested===false;
 return Object.freeze({ok,kind:ok?'HISTORY_BOUND_SOURCE_ONLY':'UNQUALIFIED_OR_STALE_EPOCH',
   product_go:false,authority:0,external_consumers:'UNKNOWN',owner_review:'NOT_ATTESTED'});
}
export function readbackEpochBoundary(eventHead){
 const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
 const historical=git('rev-parse',PR251_EPOCH+'^{commit}');
 const historical_tree=git('rev-parse',PR251_EPOCH+'^{tree}');
 let ancestor=false;try{git('merge-base','--is-ancestor',historical,head);ancestor=true;}catch{}
 const audit={head,tree,historical,historical_tree,ancestor,
   event_head:eventHead,clean_index:git('diff','--cached','--name-only')==='',
   historic:qualifyPr251SourceEpoch(PR251_EPOCH),
   current:qualifyEduOneZipSourceEpoch(),
   release_claim:false,native_host_attested:false};
 const decision=qualifyEpochBoundary(audit);
 if(!decision.ok)throw Error('PR253_HISTORIC_CURRENT_EPOCH_PAIR_UNQUALIFIED:'+JSON.stringify({
   head,tree,historical_tree,ancestor,source:audit.current?.edge||audit.current?.status,
   historic:audit.historic?.edge||audit.historic?.status}));
 return {schema:'ikant-pr253-dual-epoch-source-gate/v1',...audit,decision,
   forensic_tests_target:'PINNED_PR251_EPOCH',current_product_tests_target:'PR_HEAD',
   original_owner_changed:false,human_review:'NOT_ATTESTED',product_go:false};
}
const invoked=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
 assert.equal(process.argv.length,3,'USAGE_EXPECTED_EVENT_HEAD_SHA');
 console.log(JSON.stringify(readbackEpochBoundary(process.argv[2]),null,2));
}
