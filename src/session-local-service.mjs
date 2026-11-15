import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {ROOT,readTerms,sha256} from './contract.mjs';
import {runtimeRootDescriptor,validateRuntimeRootDescriptor,preRuntimeSelfCheck,validatePreacceptKernelInput,validateActivationExecutorReceipt} from './runtime-root-verified.mjs';
import {issueLimitedRuntimeCapability,validateLimitedRuntimeCapability} from './runtime-limited-capability.mjs';
import {processLimitedRuntimeTurn} from './runtime-limited-turn.mjs';

const HEX40=/^[a-f0-9]{40}$/,HEX64=/^[a-f0-9]{64}$/;
const LEDGER=path.join(ROOT,'.ikant','ledger.jsonl'),CAP=path.join(ROOT,'.ikant','limited-capability.json'),ORIGIN=path.join(ROOT,'.ikant','acceptance-origin.json');
export const RUNTIME_EXECUTION_RECEIPT_SCHEMA='ikant-le-runtime-execution/v1';
export const HOST_ROUTE_INTERPOSITION_RECEIPT_SCHEMA='ikant-le-host-route-interposition/v1';
export const PHYSICAL_RUNTIME_TURN_RECEIPT_SCHEMA='ikant-le-physical-runtime-turn/v1';
function gitBlobSha1(bytes){const b=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');}
function digestWithout(x,key='receipt_sha256'){const y=structuredClone(x||{});delete y[key];return sha256(Buffer.from(JSON.stringify(y)));}
function atomicJson(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.tmp-'+crypto.randomUUID();let fd=null;try{fd=fs.openSync(tmp,'wx',0o600);fs.writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fs.fsyncSync(fd);}finally{if(fd!==null)fs.closeSync(fd);}fs.renameSync(tmp,file);const reread=JSON.parse(fs.readFileSync(file,'utf8'));if(JSON.stringify(reread)!==JSON.stringify(value))throw new Error('runtime local ingress readback mismatch:'+path.basename(file));}
function signTicket(material){return{...material,ticket_sha256:sha256(Buffer.from(JSON.stringify(material)))}};
function signReceipt(material){return{...material,receipt_sha256:sha256(Buffer.from(JSON.stringify(material)))}};
function readMaterialization(){return JSON.parse(fs.readFileSync(path.join(ROOT,'.ikant','materialization.json'),'utf8'));}
function runtimeInstanceId(capability){const m={source_head:capability?.source_head||null,runtime_root_sha256:capability?.runtime_root_sha256||null,acceptance_event_id:capability?.acceptance_event_id||null,capability_receipt_sha256:capability?.receipt_sha256||null};return 'ikant-runtime-'+sha256(Buffer.from(JSON.stringify(m))).slice(0,32);}
function readLocalCohostSessionBinding({sourceHead,runtimeRootSha256}={}){const sessionRoot=path.dirname(ROOT),manifestPath=path.join(sessionRoot,'context-root.json');if(!fs.existsSync(manifestPath))throw new Error('physical route local cohost context unavailable');const x=JSON.parse(fs.readFileSync(manifestPath,'utf8')),e=[];if(x?.schema!=='ikant-le-cohost-context-root/v1')e.push('schema');if(!HEX64.test(String(x?.session_locator_sha256||''))||path.basename(sessionRoot)!==x.session_locator_sha256)e.push('session');if(x?.source_head!==sourceHead||!HEX40.test(String(sourceHead||'')))e.push('source');if(x?.runtime_root_sha256!==runtimeRootSha256||!HEX64.test(String(runtimeRootSha256||'')))e.push('runtime_root');if(x?.runtime_relpath!=='runtime'||x?.reopen_before_every_turn!==true||x?.exit_readback_stops_routing!==true||x?.authority!==0)e.push('route_contract');if(!HEX64.test(String(x?.receipt_sha256||''))||digestWithout(x)!==x.receipt_sha256)e.push('receipt');if(e.length)throw new Error('physical route local cohost context invalid:'+e.join(','));return x;}

export function validatePreRuntimeHandoff(h){
 const e=[],d=runtimeRootDescriptor(ROOT),dv=validateRuntimeRootDescriptor(d);if(!dv.ok)e.push(...dv.errors.map(x=>'descriptor:'+x));
 if(!h||h.schema!=='ikant-le-pre-runtime-handoff/v2')e.push('schema');if(h?.authority!==0)e.push('authority');if(!HEX40.test(String(h?.source_head||'')))e.push('source_head');if(h?.runtime_root_sha256!==d?.runtime_root_sha256)e.push('runtime_root_digest');if(h?.runtime_owner!=='src/session-local-service.mjs')e.push('runtime_owner');if(h?.first_unclosed_edge!=='ACTIVE_READBACK'||h?.active!==false)e.push('active_boundary');
 const ingress=h?.acceptance_ingress;if(!ingress||ingress.human_input!=='I ACCEPT'||ingress.authority!==0||!Number.isFinite(ingress.observed_monotonic_ms))e.push('acceptance_ingress');
 const ph=h?.preaccept_handoff,pv=validatePreacceptKernelInput(ph,{workspace:ROOT,sourceHead:h?.source_head});
 if(!pv.ok)e.push(...pv.errors.map(x=>'preaccept:'+x));if(sha256(Buffer.from(JSON.stringify(ph||{})))!==h?.preaccept_handoff_sha256)e.push('preaccept_digest');
 const ax=h?.activation_executor,av=validateActivationExecutorReceipt(ax,{workspace:ROOT,sourceHead:h?.source_head,descriptor:d,orientation:pv.orientation||[],requireSourceObjectReadback:false});
 if(!av.ok)e.push(...av.errors.map(x=>'executor:'+x));if(ax?.receipt_sha256!==h?.activation_executor_receipt_sha256)e.push('executor_receipt_binding');
 const self=preRuntimeSelfCheck({workspace:ROOT});if(!self.ok)e.push('kernel_self_check');if(h?.kernel_self_check?.receipt_sha256!==h?.kernel_self_check_receipt_sha256||self.receipt.receipt_sha256!==h?.kernel_self_check_receipt_sha256)e.push('kernel_self_binding');
 if(JSON.stringify(h?.kernel_self_check)!==JSON.stringify(self.receipt))e.push('kernel_self_object');
 const termsObject=h?.terms_object,projectedTerms=readTerms(),termsBytes=Buffer.from(projectedTerms.text,'utf8');if(termsObject?.path!=='TERMS.md'||!HEX40.test(String(termsObject?.blob_sha1||''))||termsObject?.bytes!==termsBytes.length||termsObject?.blob_sha1!==gitBlobSha1(termsBytes)||projectedTerms.digest!==sha256(termsBytes)||JSON.stringify(termsObject)!==JSON.stringify(ph?.terms_object))e.push('terms_object');
 let m=null;try{m=readMaterialization();}catch{e.push('materialization_missing');}
 if(m&&(m.schema!=='ikant-le-runtime-root-materialization/v2'||m.source_head!==h?.source_head||m.runtime_root_sha256!==d?.runtime_root_sha256||m.receipt_sha256!==h?.materialization_receipt_sha256||m.reopen_verified!==true||m.atomic_publish!==true))e.push('materialization_binding');
 if(m&&m.activation_executor_receipt_sha256!==h?.activation_executor_receipt_sha256)e.push('materialization_executor_binding');
 if(m&&JSON.stringify(m.reverified_orientation_objects||[])!==JSON.stringify(pv.orientation||[]))e.push('materialization_orientation_binding');
 if(!HEX64.test(String(h?.activation_executor_receipt_sha256||''))||!HEX64.test(String(h?.kernel_self_check_receipt_sha256||''))||!HEX64.test(String(h?.preaccept_handoff_sha256||'')))e.push('evidence_digest');
 if(!HEX64.test(String(h?.receipt_sha256||''))||digestWithout(h)!==h.receipt_sha256)e.push('receipt_digest');
 return{ok:e.length===0,errors:[...new Set(e)],descriptor:d};
}
export async function acceptLocalLimitedSession({handoff,hostSurface='SESSION_CHAT_LOCAL_RUNTIME'}={}){
 if(fs.existsSync(LEDGER))throw new Error('canonical ledger already exists');if(fs.existsSync(CAP))throw new Error('limited acceptance already consumed');
 const v=validatePreRuntimeHandoff(handoff);if(!v.ok)throw new Error('pre-runtime handoff invalid: '+v.errors.join(','));
 const terms=readTerms(),origin=Number(handoff.acceptance_ingress.observed_monotonic_ms),entry=Number(performance.now()),eventId='acceptance-event-'+crypto.randomUUID();
 const ticket=signTicket({schema:'ikant-le-acceptance-origin-ticket/v1',event_id:eventId,source_head:handoff.source_head,terms_digest:terms.digest,deadline_origin:'I_ACCEPT',clock:'MONOTONIC',observed_at_accept:true,origin_monotonic_ms:origin,authority:0});
 const originReceipt=signReceipt({schema:'ikant-le-acceptance-origin/v2',event_id:eventId,source_head:handoff.source_head,terms_digest:terms.digest,deadline_origin:'I_ACCEPT',clock:'MONOTONIC',observed_at_accept:true,origin_ticket:ticket,origin_monotonic_ms:origin,runtime_entry_monotonic_ms:entry,elapsed_to_runtime_entry_ms:Math.max(0,entry-origin),authority:0});
 atomicJson(ORIGIN,originReceipt);
 const capability=await issueLimitedRuntimeCapability({sourceHead:handoff.source_head,acceptanceOrigin:originReceipt,termsDigest:terms.digest,hostSurface,workspace:ROOT});
 const cv=validateLimitedRuntimeCapability(capability,{workspace:ROOT,sourceHead:handoff.source_head,acceptanceEventId:eventId,termsDigest:terms.digest});if(!cv.ok)throw new Error('issued limited capability invalid: '+cv.errors.join(','));
 atomicJson(CAP,capability);if(fs.existsSync(LEDGER))throw new Error('limited acceptance mutated canonical ledger');
 const runtimeExecution=issueRuntimeExecutionReceipt({capability});
 const material={schema:'ikant-le-session-local-limited-accept/v1',state:'RUNTIME_BOUND_LIMITED',claim_class:'IKANT_RUNTIME_LIMITED',source_head:handoff.source_head,runtime_root_sha256:v.descriptor.runtime_root_sha256,runtime_instance_id:runtimeExecution.runtime_instance_id,acceptance_event_id:eventId,pre_runtime_handoff_receipt_sha256:handoff.receipt_sha256,acceptance_origin_receipt_sha256:originReceipt.receipt_sha256,capability_receipt_sha256:capability.receipt_sha256,runtime_execution_receipt_sha256:runtimeExecution.receipt_sha256,first_unclosed_edge:'ACTIVE_READBACK',canonical_state_mutation:false,active:false,authority:0};
 return{...material,runtime_execution_receipt:runtimeExecution,receipt_sha256:sha256(Buffer.from(JSON.stringify(material)))};
}

export function issueRuntimeExecutionReceipt({capability}={}){
 if(!capability||capability.schema!=='ikant-le-limited-runtime-capability/v1')throw new Error('runtime capability required');
 const body={schema:RUNTIME_EXECUTION_RECEIPT_SCHEMA,observation_owner:'MATERIALIZED_RUNTIME',observed:true,source_head:capability.source_head,runtime_root_sha256:capability.runtime_root_sha256,runtime_instance_id:runtimeInstanceId(capability),acceptance_event_id:capability.acceptance_event_id,capability_receipt_sha256:capability.receipt_sha256,materialization_receipt_sha256:capability.materialization?.receipt_sha256||null,executed_provenance_receipt_sha256:capability.executed_provenance?.receipt_sha256||null,exact_runtime_root:true,materialization_reopened:capability.materialization?.reopen_verified===true,owner_executed:true,execution_tier:'RUNTIME_BOUND_LIMITED',legacy_active_required:false,authority:0};
 return signReceipt(body);
}

export function validateRuntimeExecutionReceipt(value,{sourceHead=null,runtimeRootSha256=null}={}){
 const x=value||{},e=[];
 if(x.schema!==RUNTIME_EXECUTION_RECEIPT_SCHEMA)e.push('schema');
 if(x.observation_owner!=='MATERIALIZED_RUNTIME'||x.observed!==true||x.owner_executed!==true)e.push('owner');
 if(!HEX40.test(String(x.source_head||''))||(sourceHead&&x.source_head!==sourceHead))e.push('source');
 if(!HEX64.test(String(x.runtime_root_sha256||''))||(runtimeRootSha256&&x.runtime_root_sha256!==runtimeRootSha256))e.push('runtime_root');
 if(!String(x.runtime_instance_id||'').startsWith('ikant-runtime-'))e.push('runtime_instance');
 if(!String(x.acceptance_event_id||'').trim())e.push('acceptance_event');
 for(const k of ['capability_receipt_sha256','materialization_receipt_sha256','executed_provenance_receipt_sha256'])if(!HEX64.test(String(x[k]||'')))e.push(k);
 if(x.exact_runtime_root!==true||x.materialization_reopened!==true||x.execution_tier!=='RUNTIME_BOUND_LIMITED'||x.legacy_active_required!==false)e.push('execution');
 if(x.authority!==0)e.push('authority');
 if(!HEX64.test(String(x.receipt_sha256||''))||digestWithout(x)!==x.receipt_sha256)e.push('receipt');
 return{ok:e.length===0,errors:[...new Set(e)]};
}

export function validateLimitedRuntimeTurnReceipt(value,{sourceHead=null,runtimeRootSha256=null}={}){
 const x=value||{},e=[];
 if(x.schema!=='ikant-le-limited-turn-receipt/v2')e.push('schema');
 if(!HEX40.test(String(x.source_head||''))||(sourceHead&&x.source_head!==sourceHead))e.push('source');
 if(!HEX64.test(String(x.runtime_root_sha256||''))||(runtimeRootSha256&&x.runtime_root_sha256!==runtimeRootSha256))e.push('runtime_root');
 if(!HEX64.test(String(x.output_sha256||''))||!HEX64.test(String(x.node_dispatch_receipt_sha256||''))||!HEX64.test(String(x.runtime_seal_sha256||'')))e.push('runtime_output');
 if(x.closed!==true||x.active!==false||x.canonical_state_mutation!==false||x.authority!==0)e.push('scope');
 if(!HEX64.test(String(x.receipt_sha256||''))||digestWithout(x)!==x.receipt_sha256)e.push('receipt');
 return{ok:e.length===0,errors:[...new Set(e)]};
}

export function validateHostRouteInterpositionReceipt(value,{sourceHead=null,runtimeRootSha256=null,runtimeInstanceId=null,sessionLocatorSha256=null}={}){
 const x=value||{},e=[];
 if(x.schema!==HOST_ROUTE_INTERPOSITION_RECEIPT_SCHEMA)e.push('schema');
 if(x.observation_owner!=='HOST_SESSION_ROUTER'||x.external_observation!==true||x.observed!==true)e.push('observation');
 if(!HEX64.test(String(x.session_locator_sha256||''))||(sessionLocatorSha256&&x.session_locator_sha256!==sessionLocatorSha256))e.push('session');
 if(!HEX40.test(String(x.source_head||''))||(sourceHead&&x.source_head!==sourceHead))e.push('source');
 if(!HEX64.test(String(x.runtime_root_sha256||''))||(runtimeRootSha256&&x.runtime_root_sha256!==runtimeRootSha256))e.push('runtime_root');
 if(!String(x.runtime_instance_id||'').trim()||(runtimeInstanceId&&x.runtime_instance_id!==runtimeInstanceId))e.push('runtime_instance');
 if(!String(x.turn_id||'').trim()||!String(x.route_epoch||'').trim()||x.route_fresh!==true)e.push('turn_freshness');
 if(x.canonical_route!=='src/session-local-service.mjs#runPhysicalClosureLimitedTurn'||x.interposition_active!==true||x.runtime_turn_offered!==true)e.push('route');
 if(typeof x.canonical_turn_pending!=='boolean'||typeof x.host_bypass_observed!=='boolean'||typeof x.model_direct_reply_observed!=='boolean')e.push('flags');
 if(!Number.isInteger(x.host_visible_turn_ordinal)||x.host_visible_turn_ordinal<0||!Number.isInteger(x.runtime_turn_ordinal)||x.runtime_turn_ordinal<0)e.push('ordinal');
 if(x.authority!==0)e.push('authority');
 if(!HEX64.test(String(x.receipt_sha256||''))||digestWithout(x)!==x.receipt_sha256)e.push('receipt');
 let state='SAFE';if(e.length)state='EXTERNAL_ROUTE_GAP';else if(x.host_bypass_observed||x.model_direct_reply_observed)state='BLOCKED_BYPASS';else if(x.canonical_turn_pending)state='PENDING_CANONICAL_TURN';else if(x.host_visible_turn_ordinal!==x.runtime_turn_ordinal)state='STALE_UNSYNCED';
 return{ok:e.length===0,errors:[...new Set(e)],state,allow_next_turn:e.length===0&&state==='SAFE'};
}

export function validatePhysicalRuntimeTurnReceipt(value,{routeReceipt=null,runtimeExecutionReceipt=null,limitedTurnReceipt=null,sessionLocatorSha256=null,sourceHead=null,runtimeRootSha256=null}={}){
 const x=value||{},e=[];
 if(x.schema!==PHYSICAL_RUNTIME_TURN_RECEIPT_SCHEMA)e.push('schema');
 if(x.observation_owner!=='MATERIALIZED_RUNTIME'||x.observed!==true)e.push('owner');
 if(!HEX64.test(String(x.session_locator_sha256||''))||(sessionLocatorSha256&&x.session_locator_sha256!==sessionLocatorSha256))e.push('session');
 if(!HEX40.test(String(x.source_head||''))||(sourceHead&&x.source_head!==sourceHead))e.push('source');
 if(!HEX64.test(String(x.runtime_root_sha256||''))||(runtimeRootSha256&&x.runtime_root_sha256!==runtimeRootSha256))e.push('runtime_root');
 if(!String(x.runtime_instance_id||'').trim()||(runtimeExecutionReceipt&&x.runtime_instance_id!==runtimeExecutionReceipt.runtime_instance_id))e.push('runtime_instance');
 if(!String(x.host_turn_id||'').trim()||(routeReceipt&&x.host_turn_id!==routeReceipt.turn_id))e.push('host_turn');
 if(!HEX64.test(String(x.host_route_receipt_sha256||''))||(routeReceipt&&x.host_route_receipt_sha256!==routeReceipt.receipt_sha256))e.push('route_ref');
 if(!HEX64.test(String(x.limited_runtime_turn_receipt_sha256||''))||(limitedTurnReceipt&&x.limited_runtime_turn_receipt_sha256!==limitedTurnReceipt.receipt_sha256))e.push('limited_turn_ref');
 if(!HEX64.test(String(x.runtime_turn_identity_sha256||''))||(limitedTurnReceipt&&x.runtime_turn_identity_sha256!==limitedTurnReceipt.turn_identity_sha256))e.push('runtime_turn_identity');
 if(!HEX64.test(String(x.input_sha256||''))||(limitedTurnReceipt&&x.input_sha256!==limitedTurnReceipt.input_sha256))e.push('input');
 if(!HEX64.test(String(x.output_sha256||''))||(limitedTurnReceipt&&x.output_sha256!==limitedTurnReceipt.output_sha256))e.push('output');
 if(x.exact_runtime_bytes!==true||x.authority!==0)e.push('scope');
 if(!HEX64.test(String(x.receipt_sha256||''))||digestWithout(x)!==x.receipt_sha256)e.push('receipt');
 return{ok:e.length===0,errors:[...new Set(e)]};
}

export async function runLocalLimitedTurn({input,candidate,hostSurface='SESSION_CHAT_LOCAL_RUNTIME'}={}){
 if(fs.existsSync(LEDGER))throw new Error('limited turn canonical ledger mutation detected');if(!fs.existsSync(CAP))throw new Error('limited capability unavailable');
 const capability=JSON.parse(fs.readFileSync(CAP,'utf8')),out=processLimitedRuntimeTurn({input:String(input??''),candidate:String(candidate??''),capability,hostSurface,artifactDir:path.join(ROOT,'.ikant','artifacts')});
 if(fs.existsSync(LEDGER))throw new Error('limited turn mutated canonical ledger');
 return{schema:'ikant-le-session-local-limited-turn/v1',state:'RUNTIME_BOUND_LIMITED',mode:out.mode,active:false,stdout:out.stdout,code:out.code,artifacts:out.artifacts,session_shell:out.session_shell,capability_receipt_sha256:capability.receipt_sha256,node_dispatch_receipt_sha256:out.node_dispatch.receipt_sha256,runtime_seal_sha256:out.runtime_seal.seal_sha256,telemetry_sha256:out.telemetry.telemetry_sha256,limited_turn_receipt_sha256:out.receipt.receipt_sha256,first_unclosed_edge:'ACTIVE_READBACK',canonical_state_mutation:false,platform_ack_required:false,host_delivery_proven:false,authority:0};
}

export async function runPhysicalClosureLimitedTurn({input,candidate,hostRouteInterpositionReceipt,hostSurface='SESSION_CHAT_LOCAL_RUNTIME'}={}){
 if(fs.existsSync(LEDGER))throw new Error('limited turn canonical ledger mutation detected');if(!fs.existsSync(CAP))throw new Error('limited capability unavailable');
 const capability=JSON.parse(fs.readFileSync(CAP,'utf8')),cv=validateLimitedRuntimeCapability(capability,{workspace:ROOT});if(!cv.ok)throw new Error('limited capability invalid: '+cv.errors.join(','));
 const sessionBinding=readLocalCohostSessionBinding({sourceHead:capability.source_head,runtimeRootSha256:capability.runtime_root_sha256});
 const runtimeExecution=issueRuntimeExecutionReceipt({capability}),rv=validateRuntimeExecutionReceipt(runtimeExecution,{sourceHead:capability.source_head,runtimeRootSha256:capability.runtime_root_sha256});if(!rv.ok)throw new Error('runtime execution receipt invalid: '+rv.errors.join(','));
 const route=validateHostRouteInterpositionReceipt(hostRouteInterpositionReceipt,{sourceHead:capability.source_head,runtimeRootSha256:capability.runtime_root_sha256,runtimeInstanceId:runtimeExecution.runtime_instance_id,sessionLocatorSha256:sessionBinding.session_locator_sha256});
 if(!route.ok||route.state!=='SAFE')throw new Error('physical route blocked:'+route.state+(route.errors.length?':'+route.errors.join(','):''));
 const out=processLimitedRuntimeTurn({input:String(input??''),candidate:String(candidate??''),capability,hostSurface,artifactDir:path.join(ROOT,'.ikant','artifacts')});
 if(fs.existsSync(LEDGER))throw new Error('limited turn mutated canonical ledger');
 const tv=validateLimitedRuntimeTurnReceipt(out.receipt,{sourceHead:capability.source_head,runtimeRootSha256:capability.runtime_root_sha256});if(!tv.ok)throw new Error('runtime turn receipt invalid:'+tv.errors.join(','));
 const physicalTurnBody={schema:PHYSICAL_RUNTIME_TURN_RECEIPT_SCHEMA,observation_owner:'MATERIALIZED_RUNTIME',observed:true,session_locator_sha256:sessionBinding.session_locator_sha256,source_head:capability.source_head,runtime_root_sha256:capability.runtime_root_sha256,runtime_instance_id:runtimeExecution.runtime_instance_id,host_turn_id:hostRouteInterpositionReceipt.turn_id,host_route_receipt_sha256:hostRouteInterpositionReceipt.receipt_sha256,limited_runtime_turn_receipt_sha256:out.receipt.receipt_sha256,runtime_turn_identity_sha256:out.receipt.turn_identity_sha256,input_sha256:out.receipt.input_sha256,output_sha256:out.receipt.output_sha256,exact_runtime_bytes:true,authority:0},physicalTurn=signReceipt(physicalTurnBody),pv=validatePhysicalRuntimeTurnReceipt(physicalTurn,{routeReceipt:hostRouteInterpositionReceipt,runtimeExecutionReceipt:runtimeExecution,limitedTurnReceipt:out.receipt,sessionLocatorSha256:sessionBinding.session_locator_sha256,sourceHead:capability.source_head,runtimeRootSha256:capability.runtime_root_sha256});if(!pv.ok)throw new Error('physical runtime turn receipt invalid:'+pv.errors.join(','));
 return{schema:'ikant-le-session-local-physical-closure-turn/v1',state:'RUNTIME_BOUND_LIMITED',physical_route_guard_passed:true,turn_id:hostRouteInterpositionReceipt.turn_id,session_locator_sha256:hostRouteInterpositionReceipt.session_locator_sha256,source_head:capability.source_head,runtime_root_sha256:capability.runtime_root_sha256,runtime_instance_id:runtimeExecution.runtime_instance_id,runtime_execution_receipt:runtimeExecution,runtime_turn_receipt:out.receipt,physical_runtime_turn_receipt:physicalTurn,runtime_output_sha256:out.receipt.output_sha256,stdout:out.stdout,code:out.code,artifacts:out.artifacts,session_shell:out.session_shell,canonical_state_mutation:false,active:false,authority:0};
}

function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const op=process.argv[2];
 try{
  if(op==='accept'){const f=arg('--handoff');if(!f)throw new Error('handoff path required');const out=await acceptLocalLimitedSession({handoff:JSON.parse(fs.readFileSync(f,'utf8'))});process.stdout.write(JSON.stringify(out)+'\n');}
  else if(op==='turn'){const i=arg('--input-file'),c=arg('--candidate-file');if(!i||!c)throw new Error('input and candidate files required');const out=await runLocalLimitedTurn({input:fs.readFileSync(i,'utf8'),candidate:fs.readFileSync(c,'utf8')});process.stdout.write(JSON.stringify(out)+'\n');}
  else if(op==='physical-turn'){const i=arg('--input-file'),c=arg('--candidate-file'),r=arg('--route-receipt');if(!i||!c||!r)throw new Error('input, candidate and route receipt files required');const out=await runPhysicalClosureLimitedTurn({input:fs.readFileSync(i,'utf8'),candidate:fs.readFileSync(c,'utf8'),hostRouteInterpositionReceipt:JSON.parse(fs.readFileSync(r,'utf8'))});process.stdout.write(JSON.stringify(out)+'\n');}
  else throw new Error('usage: node src/session-local-service.mjs <accept|turn|physical-turn> ...');
 }catch(e){process.stderr.write(String(e?.message||e)+'\n');process.exitCode=1;}
}
