import {readContract,sha256} from './contract.mjs';
import {renderBootstrapAsciiShell,renderSessionShell,validateSessionShell} from './session-shell.mjs';

export const HOST_CONSUMPTION_FRAME_SCHEMA='ikant-le-host-consumption-frame/v1';
const H40=/^[a-f0-9]{40}$/;
const H64=/^[a-f0-9]{64}$/;
const digest=value=>sha256(Buffer.from(JSON.stringify(value)));
const seal=value=>({...value,receipt_sha256:digest(value)});
const APPLICATION={
 A1:'RUNTIME_OR_BOUNDARY_ENFORCED',A2:'RUNTIME_OR_BOUNDARY_ENFORCED',A3:'RUNTIME_OR_BOUNDARY_ENFORCED',A4:'RUNTIME_OR_BOUNDARY_ENFORCED',
 B1:'HOST_ADMISSION_MATERIALIZATION',B2:'HOST_ADMISSION_MATERIALIZATION',B3:'HOST_ADMISSION_MATERIALIZATION',B4:'HOST_ADMISSION_MATERIALIZATION',
 C1:'RUNTIME_OR_BOUNDARY_ENFORCED',C2:'RUNTIME_OR_BOUNDARY_ENFORCED',C3:'RUNTIME_OR_BOUNDARY_ENFORCED',C4:'RUNTIME_OR_BOUNDARY_ENFORCED',
 D1:'RUNTIME_OR_BOUNDARY_ENFORCED',D2:'RUNTIME_OR_BOUNDARY_ENFORCED',D3:'RUNTIME_OR_BOUNDARY_ENFORCED',D4:'RUNTIME_OR_BOUNDARY_ENFORCED',
 E1:'RUNTIME_OR_BOUNDARY_ENFORCED',E2:'RUNTIME_OR_BOUNDARY_ENFORCED',E3:'HOST_PRESENTATION_REQUIRED',E4:'RUNTIME_OR_BOUNDARY_ENFORCED',
 F1:'RUNTIME_OR_BOUNDARY_ENFORCED',F2:'RUNTIME_OR_BOUNDARY_ENFORCED',F3:'RUNTIME_OR_BOUNDARY_ENFORCED',F4:'EXTERNAL_EVIDENCE_BOUNDARY',
 G1:'RUNTIME_OR_BOUNDARY_ENFORCED',G2:'RUNTIME_OR_BOUNDARY_ENFORCED',G3:'RUNTIME_OR_BOUNDARY_ENFORCED',G4:'RUNTIME_OR_BOUNDARY_ENFORCED',
 H1:'RUNTIME_OR_BOUNDARY_ENFORCED',H2:'RUNTIME_OR_BOUNDARY_ENFORCED',H3:'RUNTIME_OR_BOUNDARY_ENFORCED',H4:'RUNTIME_OR_BOUNDARY_ENFORCED',
 I1:'RUNTIME_OR_BOUNDARY_ENFORCED',I2:'RUNTIME_OR_BOUNDARY_ENFORCED',I3:'EXTERNAL_EVIDENCE_BOUNDARY',I4:'RUNTIME_OR_BOUNDARY_ENFORCED'
};

function baselineLine(state){
 const s=String(state||'READ_REPO_ONLY');
 if(s==='AWAITING_ACCEPTANCE')return'iKant · ACCETTA TERMS';
 if(s==='RUNTIME_BOUND_LIMITED')return'iKant · RUNTIME LIMITATO';
 if(s==='ACTIVE')return'iKant · ATTIVO';
 if(s==='EXITED')return'iKant · CHIUSO';
 if(s==='BLOCKED_INTEGRITY'||s==='SESSION_NONCONFORMING')return'iKant · BLOCCATO';
 return'iKant · ORIENTAMENTO';
}
function promiseSource(value){
 const p=value||readContract().ontological_promise;
 if(p?.schema!=='ikant-le-ontological-promise/v1'||!Array.isArray(p?.atoms)||p.atoms.length!==36)throw new Error('host frame ontological promise source invalid');
 const ids=p.atoms.map(x=>x.id);
 if(new Set(ids).size!==36||ids.some(id=>!APPLICATION[id]))throw new Error('host frame promise application coverage invalid');
 return p;
}
function artifactProjection(items=[]){
 return(items||[]).map(a=>({
  name:String(a?.name||a?.filename||''),
  media_type:String(a?.media_type||'application/octet-stream'),
  bytes:Number(a?.bytes||0),
  sha256:String(a?.sha256||''),
  descriptor_sha256:String(a?.descriptor_sha256||''),
  readback_verified:a?.readback_verified===true,
  required_presentation:a?.required_presentation===true,
  same_turn:a?.same_turn!==false,
  transport_ref:String(a?.name||a?.filename||''),
  authority:0
 })).filter(a=>a.name);
}
function runtimeEvidenceProjection(result={}){
 const node=H64.test(String(result?.node_dispatch_receipt_sha256||''))?String(result.node_dispatch_receipt_sha256):null;
 const event=H64.test(String(result?.runtime_turn_event_hash||''))?String(result.runtime_turn_event_hash):null;
 const limited=H64.test(String(result?.limited_turn_receipt_sha256||''))?String(result.limited_turn_receipt_sha256):null;
 const physical=H64.test(String(result?.physical_runtime_turn_receipt_sha256||''))?String(result.physical_runtime_turn_receipt_sha256):null;
 const release=H64.test(String(result?.release?.release_sha256||result?.session_shell?.release?.release_sha256||''))?String(result?.release?.release_sha256||result?.session_shell?.release?.release_sha256):null;
 const ratio=result?.environment_telemetry?.completeness?.ratio??result?.session_shell?.release?.environment_telemetry_ratio??null;
 const refs=[node,event,limited,physical,release].filter(Boolean);
 return{schema:'ikant-le-host-runtime-evidence-projection/v1',node_dispatch_receipt_sha256:node,runtime_turn_event_hash:event,limited_turn_receipt_sha256:limited,physical_runtime_turn_receipt_sha256:physical,release_sha256:release,environment_telemetry_ratio:ratio,route_evidence_status:node?'RUNTIME_OWNER_RECEIPT':limited||physical?'RUNTIME_LIMITED_OWNER_RECEIPT':'NOT_EXPOSED_THIS_FRAME',evidence_refs:refs,authority:0};
}
function promiseAtomProjection(atom,{state,runtimeEvidence,artifacts,requiredArtifacts,externalGaps}={}){
 const cls=APPLICATION[atom.id];let status='OWNER_BOUNDARY_DECLARED';const refs=[];
 if(atom.id==='E1'&&runtimeEvidence.node_dispatch_receipt_sha256){status='CURRENT_FRAME_RUNTIME_EVIDENCE';refs.push(runtimeEvidence.node_dispatch_receipt_sha256);}
 if(atom.id==='E2'&&artifacts.length){status='CURRENT_FRAME_RUNTIME_EVIDENCE';refs.push(...artifacts.map(a=>a.descriptor_sha256||a.sha256).filter(Boolean));}
 if(atom.id==='E3'){status=requiredArtifacts.length?'HOST_ACTION_REQUIRED':'NOT_APPLICABLE_THIS_FRAME';refs.push(...requiredArtifacts.map(a=>a.descriptor_sha256||a.sha256).filter(Boolean));}
 if(atom.id==='E4'&&runtimeEvidence.environment_telemetry_ratio===1){status='CURRENT_FRAME_RUNTIME_EVIDENCE';if(runtimeEvidence.release_sha256)refs.push(runtimeEvidence.release_sha256);}
 if(atom.id==='D4'&&state==='ACTIVE'){status='CURRENT_FRAME_STATE_PROJECTION';}
 if(atom.id==='H4'){status='CURRENT_FRAME_CLAIM_BOUNDARY';}
 if(cls==='HOST_ADMISSION_MATERIALIZATION')status=['READ_REPO_ONLY','AWAITING_ACCEPTANCE'].includes(state)?'HOST_ACTION_OR_WITNESS_REQUIRED':'SESSION_STATE_PROJECTED_NOT_HOST_PROOF';
 if(cls==='EXTERNAL_EVIDENCE_BOUNDARY')status='EXTERNAL_UNOBSERVED';
 if(atom.id==='I3')refs.push(...externalGaps.filter(g=>g.status!=='NOT_APPLICABLE_THIS_FRAME').map(g=>g.id));
 return{id:atom.id,domain:atom.domain,application_class:cls,owner:atom.owner,intent:atom.intent,observable:atom.observable,materialization_status:status,evidence_refs:refs,authority:0};
}
function extensionProjection(id,{state,shell,sessionBound}={}){
 if(id==='DETERMINISTIC_ASCII_SESSION_SHELL')return{id,status:'CURRENT_FRAME_EVIDENCE',evidence_refs:[shell.sha256],authority:0};
 if(id==='SESSION_CONTEXT_CONTINUITY')return{id,status:sessionBound?'CURRENT_FRAME_CONTINUITY_BINDING':'SESSION_UNBOUND',evidence_refs:[],authority:0};
 if(id==='EXIT_STOPS_FUTURE_ROUTING')return{id,status:state==='EXITED'?'CURRENT_FRAME_STATE_PROJECTION':'OWNER_BOUNDARY_DECLARED',evidence_refs:[],authority:0};
 return{id,status:'EXTERNAL_UNOBSERVED',evidence_refs:[],authority:0};
}
function shellProjection(result,state){
 const s=result?.session_shell;
 if(s){
  const v=validateSessionShell(s);if(!v.ok)throw new Error('host frame session shell invalid:'+v.errors.join(','));
  const text=renderSessionShell(s);
  if(result?.stdout!=null&&String(result.stdout)!==text)throw new Error('host frame shell/stdout exact-byte mismatch');
  const b=Buffer.from(text);
  return{schema:'ikant-le-host-shell-projection/v1',source:'SESSION_SHELL',owner:'src/session-shell.mjs#renderSessionShell',text,sha256:sha256(b),bytes:b.length,session_shell_receipt_sha256:s.receipt_sha256,style_context_sha256:s?.voice_surface?.context_refs?.[0]?.sha256||null,exact_owner_bytes:true,model_reframe_allowed:false,authority:0};
 }
 const text=renderBootstrapAsciiShell(baselineLine(state)),b=Buffer.from(text);
 return{schema:'ikant-le-host-shell-projection/v1',source:'BOOTSTRAP_SHELL',owner:'src/session-shell.mjs#renderBootstrapAsciiShell',text,sha256:sha256(b),bytes:b.length,session_shell_receipt_sha256:null,style_context_sha256:null,exact_owner_bytes:true,model_reframe_allowed:false,authority:0};
}
function externalGapVector({requiredArtifacts=0,state='READ_REPO_ONLY'}={}){
 const gaps=[
  {id:'HOST_ADMISSION_TRACE',status:['READ_REPO_ONLY','AWAITING_ACCEPTANCE'].includes(state)?'HOST_ACTION_OR_WITNESS_REQUIRED':'NOT_PROVEN_BY_FRAME'},
  {id:'HOST_ROUTE_INTERPOSITION',status:'NOT_PROVEN_BY_FRAME'},
  {id:'HOST_ARTIFACT_PRESENTATION_RECEIPT',status:requiredArtifacts>0?'HOST_ACTION_REQUIRED':'NOT_APPLICABLE_THIS_FRAME'},
  {id:'HOST_NATIVE_PARTICIPANT_LEASE',status:'EXTERNAL_UNOBSERVED'},
  {id:'HOST_NATIVE_TURN_GRANT',status:'EXTERNAL_UNOBSERVED'},
  {id:'HOST_NATIVE_DELIVERY_READBACK',status:'EXTERNAL_UNOBSERVED'},
  {id:'LIVE_SUBSEQUENT_TURN_PERSISTENCE',status:'EXTERNAL_UNOBSERVED'}
 ];
 return gaps.map(x=>({...x,authority:0}));
}
export function buildHostConsumptionFrame({result={},sourceHead=null,runtimeRootSha256=null,sessionRef=null,ontologicalPromise=null}={}){
 const state=String(result?.state||result?.service_state||result?.session_shell?.status?.display_status||'READ_REPO_ONLY');
 const claimClass=String(result?.claim_class||result?.session_shell?.status?.claim_class||(state==='ACTIVE'?'IKANT_ACTIVE':state==='RUNTIME_BOUND_LIMITED'?'IKANT_RUNTIME_LIMITED':'IKANT_NOT_ACTIVE'));
 const promise=promiseSource(ontologicalPromise),shell=shellProjection(result,state),artifacts=artifactProjection(result?.artifacts||[]),runtimeEvidence=runtimeEvidenceProjection(result);
 if(artifacts.some(a=>!H64.test(a.sha256)||!Number.isInteger(a.bytes)||a.bytes<=0||a.readback_verified!==true))throw new Error('host frame artifact proof invalid');
 if(result?.session_shell){const shellArtifacts=result.session_shell?.backlog_telemetry?.current_artifacts||[];if(shellArtifacts.length!==artifacts.length)throw new Error('host frame shell/artifact cardinality mismatch');for(const a of artifacts){const q=shellArtifacts.find(x=>x.name===a.name);if(!q||q.sha256!==a.sha256||q.bytes!==a.bytes||q.readback_verified!==true||q.required_presentation!==a.required_presentation)throw new Error('host frame shell/artifact binding mismatch:'+a.name);}}
 const required=artifacts.filter(a=>a.required_presentation),source=H40.test(String(sourceHead||''))?String(sourceHead):null,root=H64.test(String(runtimeRootSha256||''))?String(runtimeRootSha256):null,session=String(sessionRef||'')||null;
 const continuityMaterial={schema:'ikant-le-host-session-continuity-key/v1',source_head:source,runtime_root_sha256:root,session_ref:session};
 const shellProfileMaterial={schema:'ikant-le-host-shell-profile-key/v1',shell_source:shell.source,session_shell_schema:result?.session_shell?.schema||'ikant-le-ascii-shell/v1',style_context_sha256:shell.style_context_sha256||null};
 const externalGaps=externalGapVector({requiredArtifacts:required.length,state}),promiseAtoms=promise.atoms.map(a=>promiseAtomProjection(a,{state,runtimeEvidence,artifacts,requiredArtifacts:required,externalGaps})),extensionIds=['DETERMINISTIC_ASCII_SESSION_SHELL','SESSION_CONTEXT_CONTINUITY','NATIVE_PARTICIPANT_STANDING','NATIVE_SCHEDULER_TURN_GRANT','NATIVE_EXACT_DELIVERY_READBACK','SUBSEQUENT_TURN_PERSISTENCE','EXIT_STOPS_FUTURE_ROUTING'],extensions=extensionIds.map(id=>extensionProjection(id,{state,shell,sessionBound:session!==null}));
 const presentation={
  schema:'ikant-le-host-presentation-plan/v1',
  order:required.length?['REQUIRED_ARTIFACT_BYTES','ASCII_SHELL']:['ASCII_SHELL'],
  required_artifact_count:required.length,
  required_artifact_refs:required.map(a=>a.transport_ref),
  shell_must_be_exact:true,
  artifact_bytes_must_verify_before_shell:required.length>0,
  filename_only_is_delivery:false,
  runtime_observed_ui_presentation:false,
  host_presentation_receipt_present:false,
  authority:0
 };
 const body={
  schema:HOST_CONSUMPTION_FRAME_SCHEMA,
  materialization_state:'HOST_MATERIALIZATION_READY',
  state,
  claim_class:claimClass,
  source_head:source,
  runtime_root_sha256:root,
  session_ref:session,
  session_bound:session!==null,
  continuity_key_sha256:digest(continuityMaterial),
  shell_profile_sha256:digest(shellProfileMaterial),
  shell,
  artifacts,
  presentation,
  runtime_evidence:runtimeEvidence,
  promise_application:{schema:'ikant-le-host-promise-application/v1',source:'contracts/ikant-le.json#ontological_promise',promise_contract_sha256:digest(promise),atom_count:promiseAtoms.length,atoms:promiseAtoms,all_atoms_projected:promiseAtoms.length===36,status_complete:promiseAtoms.every(a=>String(a.materialization_status||'').length>0),extension_count:extensions.length,extensions,all_extensions_projected:extensions.length===7&&extensions.every(x=>String(x.status||'').length>0),authority:0},
  external_gaps:externalGaps,
  host_actions:[
   ...required.map(a=>({action:'PRESENT_VERIFIED_ARTIFACT_BYTES',ref:a.transport_ref,before:'ASCII_SHELL'})),
   {action:'PRESENT_ASCII_SHELL_EXACT',sha256:shell.sha256,bytes:shell.bytes},
   ...(state==='AWAITING_ACCEPTANCE'?[{action:'COLLECT_EXACT_I_ACCEPT',value:'I ACCEPT'}]:[])
  ],
  claim_boundary:{
   frame_is_runtime_or_host_ui_authority:false,
   frame_is_host_presentation_receipt:false,
   frame_is_native_transcript_proof:false,
   frame_is_live_persistence_proof:false,
   semantic_projection_is_physical_host_proof:false,
   host_app_may_consume_without_semantic_inference:true
  },
  persisted:false,
  new_lifecycle:false,
  new_state_writer:false,
  new_planner:false,
  new_turn_owner:false,
  authority:0
 };
 return seal(body);
}

export function validateHostConsumptionFrame(frame){
 const f=frame||{},e=[];
 if(f.schema!==HOST_CONSUMPTION_FRAME_SCHEMA||f.materialization_state!=='HOST_MATERIALIZATION_READY')e.push('schema');
 if(f.authority!==0||f.persisted!==false||f.new_lifecycle!==false||f.new_state_writer!==false||f.new_planner!==false||f.new_turn_owner!==false)e.push('authority');
 if(!H64.test(String(f?.shell?.sha256||''))||Buffer.byteLength(String(f?.shell?.text||''))!==f?.shell?.bytes||sha256(Buffer.from(String(f?.shell?.text||'')))!==f?.shell?.sha256||f?.shell?.exact_owner_bytes!==true||f?.shell?.model_reframe_allowed!==false)e.push('shell');
 if(!H64.test(String(f.continuity_key_sha256||''))||!H64.test(String(f.shell_profile_sha256||'')))e.push('continuity');
 if(f?.promise_application?.atom_count!==36||f?.promise_application?.all_atoms_projected!==true||f?.promise_application?.status_complete!==true||new Set((f?.promise_application?.atoms||[]).map(x=>x.id)).size!==36||(f?.promise_application?.atoms||[]).some(x=>!String(x?.materialization_status||'')||x?.authority!==0)||f?.promise_application?.extension_count!==7||f?.promise_application?.all_extensions_projected!==true||new Set((f?.promise_application?.extensions||[]).map(x=>x.id)).size!==7||(f?.promise_application?.extensions||[]).some(x=>!String(x?.status||'')||x?.authority!==0))e.push('promise');
 if(f?.runtime_evidence?.schema!=='ikant-le-host-runtime-evidence-projection/v1'||f?.runtime_evidence?.authority!==0||(f?.runtime_evidence?.evidence_refs||[]).some(x=>!H64.test(String(x))))e.push('runtime_evidence');
 const required=(f.artifacts||[]).filter(a=>a.required_presentation);
 const expected=required.length?['REQUIRED_ARTIFACT_BYTES','ASCII_SHELL']:['ASCII_SHELL'];
 if(JSON.stringify(f?.presentation?.order)!==JSON.stringify(expected)||f?.presentation?.required_artifact_count!==required.length||f?.presentation?.runtime_observed_ui_presentation!==false)e.push('presentation');
 if((f.artifacts||[]).some(a=>a.authority!==0||a.readback_verified!==true||!H64.test(String(a.sha256||''))))e.push('artifact');
 if(f?.claim_boundary?.frame_is_host_presentation_receipt!==false||f?.claim_boundary?.frame_is_native_transcript_proof!==false)e.push('claim_boundary');
 if(!H64.test(String(f.receipt_sha256||'')))e.push('receipt');else{const x=structuredClone(f);delete x.receipt_sha256;if(digest(x)!==f.receipt_sha256)e.push('receipt');}
 return{ok:e.length===0,errors:[...new Set(e)]};
}
