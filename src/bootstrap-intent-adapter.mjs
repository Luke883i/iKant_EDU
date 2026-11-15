import crypto from 'node:crypto';
import {compileFirstContactPlan} from './first-contact.mjs';
import {classifyLifecycleIntent} from './contract.mjs';
import {validateActivationExecutorReceipt} from './bootstrap-semantic.mjs';
import {runtimeRootDescriptor,validateRuntimeRootDescriptor} from './runtime-root-verified.mjs';
import {validateControlPlaneOwnership} from './control-plane-ownership.mjs';

export const HUMAN_INTENT_SCHEMA='ikant-le-human-intent/v1';
export const ACCEPTANCE_OBSERVATION_SCHEMA='ikant-le-acceptance-observation/v1';
export const DIRECT_EXECUTOR_HANDOFF_SCHEMA='ikant-le-direct-executor-handoff/v1';
export const BOOTSTRAP_READINESS_SCHEMA='ikant-le-bootstrap-readiness/v1';

const digest=x=>crypto.createHash('sha256').update(Buffer.from(JSON.stringify(x))).digest('hex');
export function classifyHumanIntent(input){
 const x=classifyLifecycleIntent(input);
 return{schema:HUMAN_INTENT_SCHEMA,kind:x.kind,raw_sha256:x.raw_sha256,authority:0};
}

export function compileIntentAwareFirstContact(input){
 const intent=classifyHumanIntent(input),plan=compileFirstContactPlan('iKant_EDU'),pendingIntent=String(input??'');
 return{next:{...plan,pending_intent:pendingIntent,preserve_pending_intent:true,first_input_bootstrap:true},intent};
}

export function issueAcceptanceObservation({humanInput,sourceHead,termsObject,observedMonotonicMs}={}){
 const material={schema:ACCEPTANCE_OBSERVATION_SCHEMA,human_input:String(humanInput??''),source_head:sourceHead,terms_blob_sha1:termsObject?.blob_sha1??null,observed_monotonic_ms:Number(observedMonotonicMs),authority:0};
 if(material.human_input!=='I ACCEPT')throw new Error('exact I ACCEPT required');
 if(!/^[a-f0-9]{40}$/.test(String(sourceHead||'')))throw new Error('source head invalid');
 if(!/^[a-f0-9]{40}$/.test(String(material.terms_blob_sha1||'')))throw new Error('terms object invalid');
 if(!Number.isFinite(material.observed_monotonic_ms)||material.observed_monotonic_ms<0)throw new Error('acceptance monotonic observation required');
 return{...material,receipt_sha256:digest(material)};
}

export function directActivationExecutorHandoff({preacceptHandoff,activationExecutor,humanInput,acceptanceObservedMonotonicMs}={}){
 const sourceHead=activationExecutor?.source_head,runtimeRootSha256=activationExecutor?.runtime_root_sha256,descriptor=runtimeRootDescriptor();const dv=validateRuntimeRootDescriptor(descriptor);if(!dv.ok||descriptor?.runtime_root_sha256!==runtimeRootSha256)throw new Error('canonical runtime descriptor mismatch');
 if(!preacceptHandoff||preacceptHandoff.schema!=='ikant-le-preaccept-handoff/v2'||preacceptHandoff.repository!=='Luke883i/iKant_EDU'||preacceptHandoff.source_head!==sourceHead||preacceptHandoff.terms_presented!==true||preacceptHandoff.frozen!==true||preacceptHandoff.breached!==false||preacceptHandoff.authority!==0)throw new Error('preaccept handoff invalid');
 const termsRow=(preacceptHandoff.orientation_objects||[]).find(x=>x?.path==='TERMS.md'),termsObject=preacceptHandoff.terms_object;
 if(!termsRow||!termsObject||termsObject.path!=='TERMS.md'||termsObject.blob_sha1!==termsRow.blob_sha1||termsObject.bytes!==termsRow.bytes)throw new Error('preaccept terms binding invalid');
 const acceptanceObservation=issueAcceptanceObservation({humanInput,sourceHead,termsObject,observedMonotonicMs:acceptanceObservedMonotonicMs});
 const ev=validateActivationExecutorReceipt(activationExecutor,{sourceHead,runtimeRootSha256,runtimeRootDescriptor:descriptor,orientationObjects:preacceptHandoff.orientation_objects||[]});
 if(!ev.ok)throw new Error('activation executor receipt invalid: '+ev.errors.join(','));
 const executionInput={preaccept_handoff:preacceptHandoff,activation_executor:activationExecutor,human_input:'I ACCEPT',acceptance_observed_monotonic_ms:acceptanceObservation.observed_monotonic_ms},material={schema:DIRECT_EXECUTOR_HANDOFF_SCHEMA,owner:'PRE_RUNTIME_HOST_ADAPTER',action:'EXECUTE_PRE_RUNTIME_BOOTSTRAP',source_head:sourceHead,runtime_root_sha256:runtimeRootSha256,preaccept_handoff_sha256:digest(preacceptHandoff),activation_executor_receipt_sha256:activationExecutor.receipt_sha256,acceptance_observation_receipt_sha256:acceptanceObservation.receipt_sha256,execution_input_sha256:digest(executionInput),first_unclosed_edge:'LOCAL_MATERIALIZATION',active_claim:false,authority:0};
 return{handoff:{...material,receipt_sha256:digest(material),execution_input:executionInput},acceptance_observation:acceptanceObservation};
}

export function validateDirectExecutorHandoff(h){const e=[];if(h?.schema!==DIRECT_EXECUTOR_HANDOFF_SCHEMA||h?.owner!=='PRE_RUNTIME_HOST_ADAPTER'||h?.action!=='EXECUTE_PRE_RUNTIME_BOOTSTRAP'||h?.active_claim!==false||h?.authority!==0)e.push('identity');if('acceptance_event_id'in(h||{})||'acceptance_event_id'in(h?.execution_input||{}))e.push('premature_event');if(!/^[a-f0-9]{64}$/.test(String(h?.preaccept_handoff_sha256||''))||digest(h?.execution_input?.preaccept_handoff)!==h.preaccept_handoff_sha256)e.push('preaccept_binding');if(!/^[a-f0-9]{64}$/.test(String(h?.execution_input_sha256||''))||digest(h?.execution_input)!==h.execution_input_sha256)e.push('execution_binding');const x=structuredClone(h||{}),actual=x.receipt_sha256;delete x.receipt_sha256;delete x.execution_input;if(!/^[a-f0-9]{64}$/.test(String(actual||''))||digest(x)!==actual)e.push('receipt');return{ok:e.length===0,errors:[...new Set(e)]};}
export function deriveExitDelegation({controlPlaneOwnership=null,runtimeActive=false}={}){if(controlPlaneOwnership!==null){const e=validateControlPlaneOwnership(controlPlaneOwnership);if(e.length)throw new Error('control-plane ownership invalid:'+e.join(','));if(controlPlaneOwnership.state==='IKANT_OWNED')return{schema:'ikant-le-exit-next/v1',owner:'CONTROL_PLANE_OWNERSHIP',action:'RELEASE_TO_HOST',active_claim:false,authority:0};}if(runtimeActive===true)return{schema:'ikant-le-exit-next/v1',owner:'CANONICAL_RUNTIME',action:'EXIT IKANT',active_claim:false,authority:0};return{schema:'ikant-le-exit-next/v1',owner:'HOST_ADAPTER',action:'EXIT_COMPLETE',active_claim:false,authority:0};}
export function projectBootstrapReadiness({next=null,handoff=null,intent=null,ownerPublicLine=null}={}){
 let state='WAITING_OWNER',publicLine=ownerPublicLine||'iKant · VERIFICA';
 if(next?.terminal==='CANONICAL_PREACCEPT'){state='ORIENTATION_REQUIRED';publicLine='iKant · PREPARA';}
 else if(next?.terminal==='HOST_ONLY'){state='HOST_ONLY';publicLine='';}
 else if(intent?.kind==='EXIT_IKANT'){state='EXIT_REQUESTED';publicLine='iKant · CHIUDI';}
 else if(handoff?.action==='EXECUTE_PRE_RUNTIME_BOOTSTRAP'){state='MATERIALIZATION_READY';publicLine='iKant · MATERIALIZZA';}
 else if(ownerPublicLine){state='OWNER_GUIDANCE';publicLine=ownerPublicLine;}
 if(publicLine.length>32)throw new Error('compressed bootstrap line too long');
 return{schema:BOOTSTRAP_READINESS_SCHEMA,state,public_line:publicLine,persisted:false,authority:0};
}
