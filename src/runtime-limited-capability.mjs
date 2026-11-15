import {ROOT,sha256} from './contract.mjs';
import {runtimeRootDescriptor,validateRuntimeRootDescriptor} from './runtime-root-verified.mjs';
import {readLocalMaterializationReceipt,validateMaterializedRuntimeRootReadback} from './bootstrap-semantic.mjs';
import {validateExecutedProvenanceReceipt} from './runtime-evidence.mjs';

const H40=/^[a-f0-9]{40}$/,H64=/^[a-f0-9]{64}$/;
function digestWithout(x,key='receipt_sha256'){const y=structuredClone(x||{});delete y[key];return sha256(Buffer.from(JSON.stringify(y)));}
function validateAcceptanceOrigin(r,{sourceHead,termsDigest}={}){
 const e=[];if(!r||r.schema!=='ikant-le-acceptance-origin/v2')e.push('schema');if(r?.authority!==0)e.push('authority');if(r?.source_head!==sourceHead||!H40.test(String(sourceHead||'')))e.push('source_head');if(r?.terms_digest!==termsDigest||!H64.test(String(termsDigest||'')))e.push('terms_digest');if(r?.observed_at_accept!==true||r?.deadline_origin!=='I_ACCEPT'||r?.clock!=='MONOTONIC')e.push('origin');
 const t=r?.origin_ticket;if(!t||t.schema!=='ikant-le-acceptance-origin-ticket/v1'||t?.event_id!==r?.event_id||t?.source_head!==sourceHead||t?.terms_digest!==termsDigest||t?.observed_at_accept!==true||t?.authority!==0)e.push('ticket_binding');
 if(t){const y=structuredClone(t);delete y.ticket_sha256;if(!H64.test(String(t.ticket_sha256||''))||sha256(Buffer.from(JSON.stringify(y)))!==t.ticket_sha256)e.push('ticket_digest');}
 if(!H64.test(String(r?.receipt_sha256||''))||digestWithout(r)!==r?.receipt_sha256)e.push('receipt_digest');return{ok:e.length===0,errors:[...new Set(e)],event_id:r?.event_id||null};
}
function validateMaterialization(m,{descriptor,sourceHead}={}){
 const e=[];if(!m||!['ikant-le-runtime-root-materialization/v1','ikant-le-runtime-root-materialization/v2'].includes(m.schema))e.push('schema');if(m?.authority!==0)e.push('authority');if(m?.source_head!==sourceHead||!H40.test(String(sourceHead||'')))e.push('source_head');if(m?.runtime_root_sha256!==descriptor?.runtime_root_sha256)e.push('runtime_root');if(m?.loader_blob_sha1!==descriptor?.loader?.blob_sha1)e.push('loader');if(m?.atomic_publish!==true||m?.reopen_verified!==true)e.push('publish_reopen');if(m?.member_count!==descriptor?.member_count||m?.source_bytes!==descriptor?.source_bytes)e.push('root_cardinality');
 const binding=m?.schema?.endsWith('/v2')?m?.activation_executor_receipt_sha256:m?.transfer_receipt_sha256;if(!H64.test(String(binding||'')))e.push('activation_binding');if(!H64.test(String(m?.receipt_sha256||''))||digestWithout(m)!==m?.receipt_sha256)e.push('receipt_digest');
 return{ok:e.length===0,errors:[...new Set(e)],binding_sha256:binding||null};
}
function expectedModules(d){return ['src/probe.mjs','src/runtime-command.mjs'].map(p=>{const x=d?.members?.find(m=>m.path===p);return x?{path:p,blob_sha1:x.blob_sha1,bytes:x.bytes}:null;}).filter(Boolean);}
export function validateLimitedRuntimeCapability(c,{workspace=ROOT,sourceHead=null,acceptanceEventId=null,termsDigest=null}={}){
 const e=[],d=runtimeRootDescriptor(workspace),dv=validateRuntimeRootDescriptor(d);if(!dv.ok)e.push(...dv.errors.map(x=>'descriptor:'+x));
 if(!c||c.schema!=='ikant-le-limited-runtime-capability/v1')e.push('schema');if(c?.authority!==0||c?.active!==false||c?.persisted!==false||c?.claim_class!=='IKANT_RUNTIME_LIMITED')e.push('scope');if(c?.first_unclosed_edge!=='ACTIVE_READBACK'||c?.activation_tier!=='RUNTIME_BOUND_LIMITED')e.push('tier');if(c?.artifact_sink_ready!==true)e.push('artifact_sink');
 const sh=sourceHead||c?.source_head,td=termsDigest||c?.terms_digest,ae=acceptanceEventId||c?.acceptance_event_id;if(!H40.test(String(sh||''))||c?.source_head!==sh)e.push('source_head');if(!H64.test(String(td||''))||c?.terms_digest!==td)e.push('terms_digest');if(typeof ae!=='string'||!ae||c?.acceptance_event_id!==ae)e.push('acceptance_event');if(c?.runtime_root_sha256!==d?.runtime_root_sha256)e.push('runtime_root');
 const av=validateAcceptanceOrigin(c?.acceptance_origin,{sourceHead:sh,termsDigest:td});if(!av.ok||av.event_id!==ae)e.push(...av.errors.map(x=>'acceptance:'+x),'acceptance_event_binding');
 const mv=validateMaterialization(c?.materialization,{descriptor:d,sourceHead:sh});if(!mv.ok)e.push(...mv.errors.map(x=>'materialization:'+x));
 const local=readLocalMaterializationReceipt(workspace),lv=validateMaterialization(local,{descriptor:d,sourceHead:sh});if(!lv.ok)e.push(...lv.errors.map(x=>'local_materialization:'+x));if(local?.receipt_sha256!==c?.materialization?.receipt_sha256)e.push('materialization_local_binding');
 const rr=validateMaterializedRuntimeRootReadback(workspace,d);if(!rr.ok)e.push(...rr.errors.map(x=>'local_root:'+x));
 const pv=validateExecutedProvenanceReceipt(c?.executed_provenance,{runtimeRootSha256:d?.runtime_root_sha256,expectedModules:expectedModules(d)});if(!pv.ok)e.push(...pv.errors.map(x=>'provenance:'+x));
 const bindMaterial={source_head:sh,runtime_root_sha256:d?.runtime_root_sha256,acceptance_event_id:ae,terms_digest:td,materialization_receipt_sha256:c?.materialization?.receipt_sha256||null,executed_provenance_receipt_sha256:c?.executed_provenance?.receipt_sha256||null,artifact_sink_ready:true,first_unclosed_edge:'ACTIVE_READBACK'};
 if(c?.runtime_bind_sha256!==sha256(Buffer.from(JSON.stringify(bindMaterial))))e.push('runtime_bind');
 if(!H64.test(String(c?.receipt_sha256||''))||digestWithout(c)!==c?.receipt_sha256)e.push('receipt_digest');
 return{ok:e.length===0,errors:[...new Set(e)],descriptor:d,receipt_sha256:c?.receipt_sha256||null};
}
export async function issueLimitedRuntimeCapability({sourceHead,acceptanceOrigin,termsDigest,hostSurface='LOCAL_NODE_CHAT_HOST',workspace=ROOT}={}){
 const d=runtimeRootDescriptor(workspace),dv=validateRuntimeRootDescriptor(d);if(!dv.ok)throw new Error('limited capability runtime root invalid: '+dv.errors.join(','));
 const av=validateAcceptanceOrigin(acceptanceOrigin,{sourceHead,termsDigest});if(!av.ok)throw new Error('limited capability acceptance invalid: '+av.errors.join(','));
 const m=readLocalMaterializationReceipt(workspace),mv=validateMaterialization(m,{descriptor:d,sourceHead});if(!mv.ok)throw new Error('limited capability materialization invalid: '+mv.errors.join(','));
 const rr=validateMaterializedRuntimeRootReadback(workspace,d);if(!rr.ok)throw new Error('limited capability local root invalid: '+rr.errors.join(','));
 const {runProbe}=await import('./probe.mjs');const probe=runProbe({warm:false,hostSurface});if(probe?.ok!==true||probe?.artifact_sink!==true)throw new Error('limited capability runtime probe unavailable');
 const pv=validateExecutedProvenanceReceipt(probe.executed_provenance,{runtimeRootSha256:d.runtime_root_sha256,expectedModules:expectedModules(d)});if(!pv.ok)throw new Error('limited capability provenance invalid: '+pv.errors.join(','));
 const bindMaterial={source_head:sourceHead,runtime_root_sha256:d.runtime_root_sha256,acceptance_event_id:av.event_id,terms_digest:termsDigest,materialization_receipt_sha256:m.receipt_sha256,executed_provenance_receipt_sha256:probe.executed_provenance.receipt_sha256,artifact_sink_ready:true,first_unclosed_edge:'ACTIVE_READBACK'};
 const material={schema:'ikant-le-limited-runtime-capability/v1',source_head:sourceHead,runtime_root_sha256:d.runtime_root_sha256,acceptance_event_id:av.event_id,terms_digest:termsDigest,acceptance_origin:acceptanceOrigin,materialization:m,executed_provenance:probe.executed_provenance,runtime_bind_sha256:sha256(Buffer.from(JSON.stringify(bindMaterial))),artifact_sink_ready:true,activation_tier:'RUNTIME_BOUND_LIMITED',first_unclosed_edge:'ACTIVE_READBACK',claim_class:'IKANT_RUNTIME_LIMITED',active:false,persisted:false,authority:0};
 const c={...material,receipt_sha256:sha256(Buffer.from(JSON.stringify(material)))},cv=validateLimitedRuntimeCapability(c,{workspace,sourceHead,acceptanceEventId:av.event_id,termsDigest});if(!cv.ok)throw new Error('limited capability self-validation failed: '+cv.errors.join(','));return c;
}
