#!/usr/bin/env node
/** Two independent seeded campaigns. No network, C72, C135 or provider calls. */
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {ACTIONS,screenHostNegativeAction,FIRST_FILES,C72_EIGHT,C72_TRANSIT,POST_ACCEPT_READS,RULE_IDS} from '../host/project-host-negative-rail.mjs';
const HEAD='a'.repeat(40), EPOCH='host-epoch-r2';
const SCHEMA='ikant-le-host-negative-qualification/v2';
const phases=['ORIENTATION','POST_ACCEPT','AWAIT_MODE','POST_EDU','EDU_TURN','EXIT_PENDING','ENGINEERING'];
const tags=[false,true,0,1,'true','false',null,undefined,[],{ok:true},'UNKNOWN'];
let seed=0x187a3026;
const rng=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0};
const pick=x=>x[rng()%x.length];
const truth=x=>x===true;
function valid(action){const e={sourceHead:HEAD,liveHead:HEAD,sourceEpochPinned:true,firstTurnPin:HEAD,
  humanMessage:'I ACCEPT',freshHumanTurn:true,fiveOriginalShaWitness:true,nodeReady:true,
  carrier:'HOST_PACKET',physicalIngressReadback:true,c72SourceReadback:true,e16TransitPinReadback:true,
  ownerOutcome:'NOT_INVOKED',attemptRecordExists:false,
  acceptedReadback:true,introductionReadback:true,originalC72TransitReadback:true,
  originalEduSelectionReadback:true,sourceTreeReadback:true,sourceBlobReadback:true,
  c135OwnerReadback:true,c87SingleWriterReadback:true,c125S03Readback:true,sameInput:true,sameTurn:true,voiceUtf8ByteEqual:true,
  explicitHostAddress:true,hostOperationalScope:true,nodeDns:{status:'OK_OBSERVED',host:'api.github.com',epoch:EPOCH},runtimeEpoch:EPOCH,networkChangedObserved:false,
  physicalTransferFailureObserved:true,sourceState:'ABSENT',extractorReady:true,originalP0CoordinatorReady:true,ownerAlreadyAccepted:false,
  workerLossObserved:true,c87OriginalCheckpointReadback:true,uniqueNonce:true,sameSourceEpoch:true,singleWriter:true,
  providerUiReceiptObserved:true,priorExitExactTurn:true,c87PrecloseReadback:true,qualifiedExitOwner:true,originalCloseReadback:true,
  canonicalOwnerActiveReadback:true,nativeProviderHookReceipt:true,projectInstalledPromptBytesObserved:true,
  path:FIRST_FILES[0],orientationNextIndex:0};
 let phase='POST_ACCEPT';
 if(action==='READ_SOURCE'){phase='ORIENTATION'}
 if(action==='CLAIM_DNS_FAILED')e.nodeDns={status:'FAILED_OBSERVED',host:'api.github.com',epoch:EPOCH};
 if(action==='READ_TREE'){phase='POST_EDU'}
 if(action==='SELECT_EDU'){phase='AWAIT_MODE';e.humanMessage='EDU'}
 if(['START_C135','REQUEST_P1_ZIP'].includes(action)){phase='POST_EDU'}
 if(['CLAIM_A','HOST_ANSWER','REUSE_C87'].includes(action)){phase='EDU_TURN'}
 if(action==='CLAIM_EXITED')phase='EXIT_PENDING';
 if(action==='CLOSE_EXIT'){phase='EXIT_PENDING';e.humanMessage='CONFERMO EXIT IKANT'}
 return {action,phase,evidence:e};
}
/** Separate, affirmative oracle; it does not call or inspect the negative clauses. */
function oracle({action:a,phase:p,evidence:e}){
 const head=typeof e.sourceHead==='string'&&/^[0-9a-f]{40}$/.test(e.sourceHead)&&e.sourceHead===e.liveHead;
 const consent=p==='POST_ACCEPT'&&truth(e.freshHumanTurn)&&e.humanMessage==='I ACCEPT';
 const receipt=truth(e.acceptedReadback)&&truth(e.introductionReadback);
 const dnsSame=e.nodeDns?.status==='FAILED_OBSERVED'&&e.nodeDns?.host==='api.github.com'&&typeof e.nodeDns?.epoch==='string'&&e.nodeDns.epoch!==''&&e.runtimeEpoch===e.nodeDns.epoch;
 switch(a){
 case 'READ_SOURCE':return p==='ENGINEERING'||p==='ORIENTATION'&&FIRST_FILES[e.orientationNextIndex]===e.path&&Number.isInteger(e.orientationNextIndex)||['POST_ACCEPT','AWAIT_MODE'].includes(p)&&POST_ACCEPT_READS.includes(e.path)||['POST_EDU','EDU_TURN','EXIT_PENDING'].includes(p)&&truth(e.sourceEpochPinned);
 case 'READ_TREE':return ['ENGINEERING','POST_EDU','EDU_TURN','EXIT_PENDING'].includes(p);
 case 'INVOKE_C72':return consent&&head&&truth(e.fiveOriginalShaWitness)&&truth(e.physicalIngressReadback)&&truth(e.nodeReady)&&truth(e.c72SourceReadback)&&truth(e.e16TransitPinReadback)&&['CALLBACKS','NODE_HTTPS','HOST_PACKET','HOST_FILE'].includes(e.carrier)&&e.ownerOutcome==='NOT_INVOKED'&&e.attemptRecordExists===false&&!(e.carrier==='NODE_HTTPS'&&dnsSame&&!truth(e.networkChangedObserved));
 case 'CLAIM_C72':return receipt;
 case 'SELECT_EDU':return p==='AWAIT_MODE'&&e.humanMessage==='EDU'&&truth(e.freshHumanTurn)&&receipt&&truth(e.originalC72TransitReadback)&&head;
 case 'START_C135':return ['POST_EDU','EDU_TURN'].includes(p)&&truth(e.sourceTreeReadback)&&truth(e.sourceBlobReadback)&&truth(e.originalEduSelectionReadback)&&head;
 case 'CLAIM_A':return p==='EDU_TURN'&&[e.c135OwnerReadback,e.c87SingleWriterReadback,e.c125S03Readback,e.sameInput,e.sameTurn,e.voiceUtf8ByteEqual].every(truth);
 case 'HOST_ANSWER':return p!=='EDU_TURN'||truth(e.explicitHostAddress)&&truth(e.hostOperationalScope);
 case 'NODE_HTTPS':return p==='POST_ACCEPT'&&truth(e.nodeReady)&&(!dnsSame||truth(e.networkChangedObserved));
 case 'CLAIM_TRANSFER_FAILED':return truth(e.physicalTransferFailureObserved);
 case 'REQUEST_P1_ZIP':return p==='POST_EDU'&&truth(e.originalEduSelectionReadback)&&head&&['ABSENT','PARTIAL'].includes(e.sourceState)&&truth(e.nodeReady)&&truth(e.extractorReady);
 case 'REQUEST_P0_ONEZIP':return consent&&head&&truth(e.fiveOriginalShaWitness)&&truth(e.originalP0CoordinatorReady)&&e.ownerAlreadyAccepted===false;
 case 'RETRY_C72':return false;
 case 'CLAIM_NATIVE_UI':return truth(e.providerUiReceiptObserved);
 case 'AUTO_REPIN':return false;
 case 'EXEC_C71_AS_EDU':return false;
 case 'CLOSE_EXIT':return p==='EXIT_PENDING'&&e.humanMessage==='CONFERMO EXIT IKANT'&&truth(e.priorExitExactTurn)&&truth(e.c87PrecloseReadback)&&truth(e.qualifiedExitOwner);
 case 'CLAIM_EXITED':return p==='EXIT_PENDING'&&truth(e.originalCloseReadback);
 case 'CLAIM_ACTIVE':return false; // EDU Project is never canonical ACTIVE
 case 'CLAIM_DNS_FAILED':return dnsSame;
 case 'CLAIM_BRIDGE':return truth(e.physicalIngressReadback);
 case 'REUSE_C87':return [e.workerLossObserved,e.c87OriginalCheckpointReadback,e.uniqueNonce,e.sameSourceEpoch,e.singleWriter].every(truth);
 case 'CLAIM_PROMPT_INSTALLED':return truth(e.projectInstalledPromptBytesObserved);
 default:return false;
 }
}
const fields=['freshHumanTurn','fiveOriginalShaWitness','nodeReady','physicalIngressReadback','c72SourceReadback','e16TransitPinReadback','attemptRecordExists','acceptedReadback','introductionReadback','originalC72TransitReadback','originalEduSelectionReadback','sourceTreeReadback','sourceBlobReadback','c135OwnerReadback','c87SingleWriterReadback','c125S03Readback','sameInput','sameTurn','voiceUtf8ByteEqual','explicitHostAddress','hostOperationalScope','networkChangedObserved','physicalTransferFailureObserved','extractorReady','originalP0CoordinatorReady','ownerAlreadyAccepted','workerLossObserved','c87OriginalCheckpointReadback','uniqueNonce','sameSourceEpoch','singleWriter','providerUiReceiptObserved','priorExitExactTurn','c87PrecloseReadback','qualifiedExitOwner','originalCloseReadback','canonicalOwnerActiveReadback','nativeProviderHookReceipt','projectInstalledPromptBytesObserved','sourceEpochPinned'];
const hostilePaths=['../../TERMS.md','README.md','contracts/secret.json','host/c71-experimental-host-draft.mjs','scripts/project-c72-cold-mode-cli.mjs',null];
function mutate(q){let e=q.evidence;const mode=rng()%13;
 if(mode<7)e[pick(fields)]=pick(tags);
 else if(mode===7)q.phase=pick(phases);
 else if(mode===8)e.humanMessage=pick(['I ACCEPT','EDU','CONFERMO EXIT IKANT','EXIT IKANT','nope',null]);
 else if(mode===9)e.sourceHead=pick([HEAD,'f'.repeat(40),0,null]);
 else if(mode===10)e.nodeDns=pick([{status:'FAILED_OBSERVED',host:'api.github.com',epoch:EPOCH},{status:'FAILED_OBSERVED',host:'api.github.com',epoch:'old-epoch'},{status:'UNVERIFIED',host:'api.github.com',epoch:EPOCH},null]);
 else if(mode===11)e.path=pick(hostilePaths);
 else e.carrier=pick(['HOST_PACKET','NODE_HTTPS','CALLBACKS','HOST_FILE','UNBOUND',null]);
}
const report={schema:SCHEMA,head:'SOURCE_INDEPENDENT_SYNTHETIC_SHA',r1_seed:'0x187c7102',negative_seed:'0x187a3026',positive_seed:'0x187a3027',negative_cases:500000,positive_cases:500000,rules:RULE_IDS.length,actions:ACTIONS.length,original_calls:0,model_calls:0,provider_calls:0,positive_oracle_mismatches:0,negative_oracle_mismatches:0,blocked:0,passed_to_original_check:0,edge_counts:{},counterexamples:[],positive_preserved:0,metamorphic_checks:0};
const trace=createHash('sha256');
// Negative/adversarial campaign: broad mutated cases checked against separate positive oracle.
for(let i=0;i<report.negative_cases;i++){
 const q=valid(ACTIONS[i%ACTIONS.length]);const count=1+rng()%6;
 for(let j=0;j<count;j++)mutate(q);
 const got=screenHostNegativeAction(q),want=oracle(q);
 if((got.disposition==='PASS_TO_ORIGINAL_CHECK')!==want){report.negative_oracle_mismatches++;if(report.counterexamples.length<8)report.counterexamples.push({i,action:q.action,phase:q.phase,edge:got.first_edge,want})}
 got.disposition==='STOP'?report.blocked++:report.passed_to_original_check++;
 if(got.first_edge)report.edge_counts[got.first_edge]=(report.edge_counts[got.first_edge]??0)+1;
 trace.update(JSON.stringify([i,q.action,q.phase,got.disposition,got.first_edge])+'\n');
}
// New independent seed for positive-preservation: mutate ONLY off-path fields, or
// introduce changes known not to remove a required positive route.
seed=0x187a3027;
const essentials={
 READ_SOURCE:['path','orientationNextIndex'],INVOKE_C72:['freshHumanTurn','fiveOriginalShaWitness','nodeReady','physicalIngressReadback','c72SourceReadback','e16TransitPinReadback','attemptRecordExists'],CLAIM_C72:['acceptedReadback','introductionReadback'],
 SELECT_EDU:['freshHumanTurn','acceptedReadback','introductionReadback','originalC72TransitReadback'],START_C135:['originalEduSelectionReadback','sourceTreeReadback','sourceBlobReadback'],CLAIM_A:['c135OwnerReadback','c87SingleWriterReadback','c125S03Readback','sameInput','sameTurn','voiceUtf8ByteEqual'],HOST_ANSWER:['explicitHostAddress','hostOperationalScope'],NODE_HTTPS:['nodeReady','nodeDns','networkChangedObserved'],CLAIM_TRANSFER_FAILED:['physicalTransferFailureObserved'],REQUEST_P1_ZIP:['originalEduSelectionReadback','nodeReady','extractorReady'],REQUEST_P0_ONEZIP:['freshHumanTurn','fiveOriginalShaWitness','originalP0CoordinatorReady','ownerAlreadyAccepted'],CLAIM_NATIVE_UI:['providerUiReceiptObserved'],CLOSE_EXIT:['priorExitExactTurn','c87PrecloseReadback','qualifiedExitOwner'],CLAIM_EXITED:['originalCloseReadback'],CLAIM_ACTIVE:['canonicalOwnerActiveReadback','nativeProviderHookReceipt'],CLAIM_DNS_FAILED:['nodeDns'],CLAIM_BRIDGE:['physicalIngressReadback'],REUSE_C87:['workerLossObserved','c87OriginalCheckpointReadback','uniqueNonce','sameSourceEpoch','singleWriter'],CLAIM_PROMPT_INSTALLED:['projectInstalledPromptBytesObserved']};
const intrinsicallyBlocked=new Set(['RETRY_C72','AUTO_REPIN','EXEC_C71_AS_EDU','CLAIM_ACTIVE']);
for(let i=0;i<report.positive_cases;i++){
 const action=ACTIONS[i%ACTIONS.length],q=valid(action),blocked=intrinsicallyBlocked.has(action),ess=essentials[action]??[];
 // 1-5 semantically irrelevant mutations, no changes to protected prerequisites.
 for(let j=0,n=1+rng()%5;j<n;j++){
  const eligible=fields.filter(k=>!ess.includes(k)&&!['sourceEpochPinned'].includes(k));
  const k=pick(eligible);q.evidence[k]=pick(tags);
 }
 // Correct benign diversities: allowed source/transport and P1 source state.
 if(action==='READ_SOURCE'){const idx=rng()%5;q.evidence.orientationNextIndex=idx;q.evidence.path=FIRST_FILES[idx]}
 if(action==='REQUEST_P1_ZIP')q.evidence.sourceState=pick(['ABSENT','PARTIAL']);
 if(action==='INVOKE_C72')q.evidence.carrier=pick(['CALLBACKS','NODE_HTTPS','HOST_PACKET','HOST_FILE']);
 if(action==='READ_TREE')q.phase=pick(['ENGINEERING','POST_EDU','EDU_TURN']);
 const got=screenHostNegativeAction(q),want=oracle(q);
 if(want!==!blocked)throw Error('positive fixture mutated a required prerequisite: '+JSON.stringify({i,action,got,want}));
 if((got.disposition==='PASS_TO_ORIGINAL_CHECK')!==want){report.positive_oracle_mismatches++;if(report.counterexamples.length<8)report.counterexamples.push({i,action,phase:q.phase,edge:got.first_edge,want})}
 if(want)report.positive_preserved++;
 trace.update(JSON.stringify(['p',i,action,got.disposition])+'\n');
}
// Metamorphic: fundamental evidence removal must not authorize original effects.
for(const [action,required] of [
 ['INVOKE_C72',['physicalIngressReadback','fiveOriginalShaWitness','e16TransitPinReadback']],
 ['SELECT_EDU',['acceptedReadback','introductionReadback','originalC72TransitReadback']],
 ['START_C135',['sourceTreeReadback','sourceBlobReadback','originalEduSelectionReadback']],
 ['CLAIM_A',['c135OwnerReadback','c87SingleWriterReadback','c125S03Readback','voiceUtf8ByteEqual']],
 ['REUSE_C87',['workerLossObserved','c87OriginalCheckpointReadback','uniqueNonce','singleWriter']],
 ['CLOSE_EXIT',['priorExitExactTurn','c87PrecloseReadback','qualifiedExitOwner']]
 ]){
 const v=valid(action);if(screenHostNegativeAction(v).disposition!=='PASS_TO_ORIGINAL_CHECK')throw Error('witness denied '+action);
 for(const k of required){const x=valid(action);x.evidence[k]=false;if(screenHostNegativeAction(x).disposition!=='STOP')throw Error('missing evidence accepted '+action+' '+k);report.metamorphic_checks++}
}
report.trace_sha256=trace.digest('hex');
const dir=path.dirname(fileURLToPath(import.meta.url));const out=process.argv[2]??path.resolve(dir,'../artifacts/qualification/negative-semantic-1m.json');fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:report.negative_cases+report.positive_cases,negative_mismatches:report.negative_oracle_mismatches,positive_mismatches:report.positive_oracle_mismatches,positive_preserved:report.positive_preserved,blocked:report.blocked,metamorphic_checks:report.metamorphic_checks,trace_sha256:report.trace_sha256}));
if(report.negative_oracle_mismatches||report.positive_oracle_mismatches)process.exitCode=1;
