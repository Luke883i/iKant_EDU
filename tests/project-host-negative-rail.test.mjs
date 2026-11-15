import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {screenHostNegativeAction,screenThenInvokeHostEffect,RULE_IDS,RAIL_SCHEMA,FIRST_FILES,C72_EIGHT,C72_TRANSIT,POST_ACCEPT_READS} from '../host/project-host-negative-rail.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contract=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/project-host-negative-rail.json'),'utf8'));
const HEAD='90bad7463146b762e46a1fd4c37d434762e9e95a';
const evidence=()=>({sourceHead:HEAD,liveHead:HEAD,firstTurnPin:HEAD,sourceEpochPinned:true,
  freshHumanTurn:true,humanMessage:'I ACCEPT',fiveOriginalShaWitness:true,nodeReady:true,
  carrier:'HOST_PACKET',physicalIngressReadback:true,c72SourceReadback:true,e16TransitPinReadback:true,
  ownerOutcome:'NOT_INVOKED',attemptRecordExists:false,acceptedReadback:true,introductionReadback:true,
  originalC72TransitReadback:true,originalEduSelectionReadback:true,sourceTreeReadback:true,sourceBlobReadback:true,
  c135OwnerReadback:true,c87SingleWriterReadback:true,c125S03Readback:true,sameInput:true,sameTurn:true,voiceUtf8ByteEqual:true,
  explicitHostAddress:true,hostOperationalScope:true,nodeDns:{status:'OK_OBSERVED',host:'api.github.com',epoch:'e1'},runtimeEpoch:'e1',networkChangedObserved:false,
  physicalTransferFailureObserved:true,sourceState:'ABSENT',extractorReady:true,originalP0CoordinatorReady:true,ownerAlreadyAccepted:false,
  workerLossObserved:true,c87OriginalCheckpointReadback:true,uniqueNonce:true,sameSourceEpoch:true,singleWriter:true,
  providerUiReceiptObserved:true,priorExitExactTurn:true,c87PrecloseReadback:true,qualifiedExitOwner:true,originalCloseReadback:true,
  canonicalOwnerActiveReadback:true,nativeProviderHookReceipt:true,projectInstalledPromptBytesObserved:true,path:'README.md',orientationNextIndex:0});
const screen=(action,phase='POST_ACCEPT',patch={})=>screenHostNegativeAction({action,phase,evidence:{...evidence(),...patch}});
const edge=(x,n)=>assert.equal(x.first_edge,n);
test('contract and implementation have same 23 distinct rule IDs; never grant authority',()=>{
 assert.equal(contract.schema,RAIL_SCHEMA);assert.equal(contract.rule_ids.length,23);
 assert.deepEqual(RULE_IDS,contract.rule_ids);assert.equal(new Set(RULE_IDS).size,23);
 assert.equal(contract.pass_is_permission,false);assert.equal(contract.authority,0);
 for(const action of ['INVOKE_C72','SELECT_EDU','START_C135','CLAIM_A']){
  const phase=action==='SELECT_EDU'?'AWAIT_MODE':action==='START_C135'?'POST_EDU':action==='CLAIM_A'?'EDU_TURN':'POST_ACCEPT';
  const e=evidence();if(action==='SELECT_EDU')e.humanMessage='EDU';
  const g=screenHostNegativeAction({action,phase,evidence:e});assert.equal(g.disposition,'PASS_TO_ORIGINAL_CHECK');
  assert.equal(g.permission_granted,false);assert.equal(g.original_owner_invoked,false);
  assert.equal(g.owner_receipt_issued,false);assert.equal(g.native_delivery_attested,false);
 }
});
test('orientation is five direct files only, postaccept allows original cold seed and ninth carrier, TREE is postmode',()=>{
 for(let i=0;i<5;i++)assert.equal(screen('READ_SOURCE','ORIENTATION',{path:FIRST_FILES[i],orientationNextIndex:i}).disposition,'PASS_TO_ORIGINAL_CHECK');
 edge(screen('READ_SOURCE','ORIENTATION',{path:'host/c72-public-mode-admission.mjs'}),'N01_PRECONSENT_READ_BOUNDARY');
 for(const p of [C72_EIGHT[7],C72_TRANSIT,'scripts/project-c72-cold-mode-cli.mjs'])assert.equal(screen('READ_SOURCE','POST_ACCEPT',{path:p}).disposition,'PASS_TO_ORIGINAL_CHECK');
 edge(screen('READ_SOURCE','POST_ACCEPT',{path:'host/c135-edu-v2-owner.mjs'}),'N01_PRECONSENT_READ_BOUNDARY');
 edge(screen('READ_TREE','ORIENTATION'),'N01_PRECONSENT_READ_BOUNDARY');
 assert.equal(screen('READ_TREE','POST_EDU').disposition,'PASS_TO_ORIGINAL_CHECK');
 assert.equal(screen('READ_TREE','ENGINEERING').disposition,'PASS_TO_ORIGINAL_CHECK');
});
test('C72 exact human gate, observed same-epoch physical ingress and no replay',()=>{
 assert.equal(screen('INVOKE_C72').disposition,'PASS_TO_ORIGINAL_CHECK');
 edge(screen('INVOKE_C72','POST_ACCEPT',{humanMessage:'EDU'}),'N02_EXACT_NEW_ACCEPT');
 edge(screen('INVOKE_C72','POST_ACCEPT',{liveHead:'f'.repeat(40)}),'N03_FIRST_TURN_WITNESS_AND_HEAD');
 edge(screen('INVOKE_C72','POST_ACCEPT',{physicalIngressReadback:false}),'N04_PHYSICAL_C72_CARRIER');
 edge(screen('INVOKE_C72','POST_ACCEPT',{e16TransitPinReadback:false}),'N04_PHYSICAL_C72_CARRIER');
 edge(screen('INVOKE_C72','POST_ACCEPT',{attemptRecordExists:undefined}),'N05_C72_PRIOR_ATTEMPT_FENCE');
 edge(screen('INVOKE_C72','POST_ACCEPT',{ownerOutcome:'UNKNOWN'}),'N05_C72_PRIOR_ATTEMPT_FENCE');
 edge(screen('RETRY_C72'),'N17_NEVER_RETRY_ORIGINAL_C72');
});
test('DNS failure is specific to original host/epoch; unrelated packet remains eligible',()=>{
 const fail={status:'FAILED_OBSERVED',host:'api.github.com',epoch:'e1'};
 edge(screen('NODE_HTTPS','POST_ACCEPT',{nodeDns:fail}),'N12_NO_DNS_BLIND_REPROBE');
 assert.equal(screen('NODE_HTTPS','POST_ACCEPT',{nodeDns:fail,networkChangedObserved:true}).disposition,'PASS_TO_ORIGINAL_CHECK');
 assert.equal(screen('NODE_HTTPS','POST_ACCEPT',{nodeDns:{...fail,epoch:'old'}}).disposition,'PASS_TO_ORIGINAL_CHECK');
 assert.equal(screen('INVOKE_C72','POST_ACCEPT',{carrier:'HOST_PACKET',nodeDns:fail}).disposition,'PASS_TO_ORIGINAL_CHECK');
 edge(screen('INVOKE_C72','POST_ACCEPT',{carrier:'NODE_HTTPS',nodeDns:fail}),'N12_NO_DNS_BLIND_REPROBE');
 edge(screen('CLAIM_DNS_FAILED','POST_ACCEPT',{nodeDns:null}),'N23_DNS_FAILURE_MUST_BE_OBSERVED');
 edge(screen('CLAIM_TRANSFER_FAILED','POST_ACCEPT',{physicalTransferFailureObserved:false}),'N14_UNBOUND_IS_NOT_FAILED_TRANSFER');
});
test('P0 and P1 are mutually phase-gated but do not require evidence only available after upload',()=>{
 assert.equal(screen('REQUEST_P0_ONEZIP','POST_ACCEPT').disposition,'PASS_TO_ORIGINAL_CHECK');
 edge(screen('REQUEST_P0_ONEZIP','POST_ACCEPT',{ownerAlreadyAccepted:undefined}),'N16_P0_ONEZIP_NARROW_GATE');
 edge(screen('REQUEST_P0_ONEZIP','POST_EDU'),'N16_P0_ONEZIP_NARROW_GATE');
 edge(screen('REQUEST_P1_ZIP','POST_ACCEPT'),'N15_P1_ONLY_AFTER_EDU');
 for(const sourceState of ['ABSENT','PARTIAL'])assert.equal(screen('REQUEST_P1_ZIP','POST_EDU',{sourceState,sourceTreeReadback:false}).disposition,'PASS_TO_ORIGINAL_CHECK');
 edge(screen('REQUEST_P1_ZIP','POST_EDU',{sourceState:'SOURCE_UNKNOWN'}),'N15_P1_ONLY_AFTER_EDU');
});
test('original voice, C71, native UI and canonical ACTIVE boundaries',()=>{
 assert.equal(screen('CLAIM_A','EDU_TURN').disposition,'PASS_TO_ORIGINAL_CHECK');
 edge(screen('CLAIM_A','EDU_TURN',{sameInput:false}),'N10_ORIGINAL_SAME_TURN_VOICE');
 edge(screen('HOST_ANSWER','EDU_TURN',{explicitHostAddress:false}),'N11_HOST_NOT_IKANT');
 assert.equal(screen('HOST_ANSWER','EDU_TURN',{explicitHostAddress:true,hostOperationalScope:true}).disposition,'PASS_TO_ORIGINAL_CHECK');
 edge(screen('EXEC_C71_AS_EDU'),'N20_C71_NOT_EDU_OWNER');
 edge(screen('CLAIM_NATIVE_UI','EDU_TURN',{providerUiReceiptObserved:false}),'N18_NATIVE_UI_NEEDS_PROVIDER_RECEIPT');
 edge(screen('CLAIM_ACTIVE','EDU_TURN'),'N22_EDU_NEVER_CANONICAL_ACTIVE');
 edge(screen('AUTO_REPIN'),'N19_NO_AUTOMATIC_EPOCH_REPIN');
 edge(screen('CLAIM_PROMPT_INSTALLED','ENGINEERING',{projectInstalledPromptBytesObserved:false}),'N19_NO_AUTOMATIC_EPOCH_REPIN');
});
test('claim of exited is AFTER close, close operation only requires preclose evidence',()=>{
 assert.equal(screen('CLOSE_EXIT','EXIT_PENDING',{humanMessage:'CONFERMO EXIT IKANT',originalCloseReadback:false}).disposition,'PASS_TO_ORIGINAL_CHECK');
 edge(screen('CLOSE_EXIT','EXIT_PENDING',{humanMessage:'EXIT IKANT'}),'N21_EXIT_TWO_TURN_AND_OWNER');
 edge(screen('CLAIM_EXITED','EXIT_PENDING',{originalCloseReadback:false}),'N21_EXIT_TWO_TURN_AND_OWNER');
 assert.equal(screen('CLAIM_EXITED','EXIT_PENDING',{originalCloseReadback:true}).disposition,'PASS_TO_ORIGINAL_CHECK');
});
test('untrusted proxies/accessors and types cannot trigger effects',async()=>{
 const hostile=new Proxy({}, {get(){throw Error('trap')}});
 assert.equal(screenHostNegativeAction(hostile).disposition,'STOP');
 assert.equal(screenHostNegativeAction({action:'INVOKE_C72',phase:'POST_ACCEPT',evidence:hostile}).disposition,'STOP');
 assert.equal(screenHostNegativeAction({action:'NODE_HTTPS',phase:'POST_ACCEPT',evidence:{nodeDns:hostile}}).disposition,'STOP');
 const x={action:'INVOKE_C72',phase:'POST_ACCEPT',get evidence(){throw Error('getter')}};
 assert.equal(screenHostNegativeAction(x).disposition,'STOP');
 let effects=0;
 const denied=await screenThenInvokeHostEffect({action:'RETRY_C72',phase:'POST_ACCEPT',evidence:evidence()},{originalPreflight:async()=>({ok:true,ownerVerified:true}),invoke:async()=>{effects++}});
 assert.equal(denied.invoked,false);assert.equal(effects,0);
 const unbound=await screenThenInvokeHostEffect({action:'INVOKE_C72',phase:'POST_ACCEPT',evidence:evidence()},{invoke:async()=>{effects++}});
 edge(unbound.gate,'NEGATIVE_RAIL_ORIGINAL_PREFLIGHT_UNBOUND');assert.equal(effects,0);
 const incomplete=await screenThenInvokeHostEffect({action:'INVOKE_C72',phase:'POST_ACCEPT',evidence:evidence()},{originalPreflight:async()=>({ok:true}),invoke:async()=>{effects++}});
 edge(incomplete.gate,'NEGATIVE_RAIL_ORIGINAL_PREFLIGHT_UNVERIFIED');assert.equal(effects,0);
 const good=await screenThenInvokeHostEffect({action:'INVOKE_C72',phase:'POST_ACCEPT',evidence:evidence()},{originalPreflight:async()=>({ok:true,ownerVerified:true}),invoke:async()=>{effects++;return {status:'UNVALIDATED_FIXTURE'}}});
 assert.equal(good.invoked,true);assert.equal(effects,1);assert.equal(good.effect.status,'UNVALIDATED_FIXTURE');assert.equal(good.gate.permission_granted,false);
});
