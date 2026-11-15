/** Read-only projection over original state/ledger/shell owners. No new lifecycle or voice. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {loadState,readLedger,runtimePaths,withWriterLock} from '../src/state.mjs';
import {buildSessionShell,validateSessionShell} from '../src/session-shell.mjs';
import {reopenC87Ledger} from './c87-durable-ledger.mjs';
import {validateC72V2ModeSelection} from './c72-public-mode-admission.mjs';

const hash=b=>createHash('sha256').update(b).digest('hex');
const unknown=(owner,edge)=>({status:'UNKNOWN',owner,first_open_edge:edge});
export function projectSessionCapsule({shell,source,host,ledgerTip,epoch,admission=null,edu=null}={}){
 if(!validateSessionShell(shell).ok)throw Error('PROJECT_SHELL_INVALID');
 if(!/^[a-f0-9]{40}$/.test(source?.head||'')||!/^[a-f0-9]{40}$/.test(source?.tree||''))throw Error('PROJECT_SOURCE_BINDING_REQUIRED');
 // Complete public owner output remains in the payload; view fields never replace it.
 if(admission!==null&&!validateC72V2ModeSelection(admission,{sourceHead:source.head}))throw Error('PROJECT_ADMISSION_BINDING_INVALID');
 const payload={schema:'ikant-le-project-session-evidence/v1',source,epoch:epoch??null,
  admission,edu:edu??unknown('C135_C87','EDU_LEDGER_BINDING_NOT_ATTESTED'),
  ledger_tip:ledgerTip??'GENESIS',original_session_shell:shell,
  host:{node:host?.node??'UNKNOWN',execution_plane:'SESSION_LOCAL_NODE',
   model_identity:unknown('HOST_PROVIDER','MODEL_IDENTITY_NOT_ATTESTED'),
   tool_inventory:unknown('HOST_PROVIDER','CALLABLE_TOOL_CENSUS_NOT_ATTESTED'),
   current_turn_binding:unknown('HOST_PROVIDER','NATIVE_TURN_ID_NOT_ATTESTED'),
   work_in_progress:unknown('HOST_TASK_OWNER','HOST_TASK_STATE_NOT_ATTESTED'),
   provider_session:unknown('HOST_PROVIDER','NATIVE_SESSION_ID_NOT_ATTESTED'),
   context_window:unknown('HOST_PROVIDER','CONTEXT_USAGE_NOT_ATTESTED'),
   native_ui:unknown('HOST_PROVIDER','NATIVE_UI_NOT_ATTESTED'),
   cross_session_persistence:unknown('HOST_PROVIDER','DURABILITY_NOT_ATTESTED')},
  backlog:{kind:'ORIGINAL_RUNTIME_BACKLOG_TELEMETRY',
   artifacts:shell.backlog_telemetry.session_artifact_history,
   task_queue:unknown('RUNTIME_BACKLOG_OWNER','NO_TASK_QUEUE_RECEIPT')},
  authority:0,private_reasoning:false};
 const bytes=Buffer.from(JSON.stringify(payload));
 const axes={ikant:shell.status,admission:admission?{mode:admission.selected_mode,status:admission.status}:unknown('C72','MODE_SELECTION_UNAVAILABLE'),edu:payload.edu,host:payload.host,backlog:payload.backlog};
 return{schema:'ikant-le-project-session-capsule/v1',authority:0,active:false,
  voice:'NO_VOICE',voice_claim:'HOST_CONTROL_PROJECTION_ONLY',source,
  axes,payload,evidence_sha256:hash(bytes),evidence_bytes:bytes.length,
  coverage:{scope:'ALL_PUBLIC_OWNER_FIELDS_IN_EVIDENCE',complete_for_scope:true,
   global_semantic_equivalence_attested:false},
  first_open_edge:admission?.selected_mode==='EDU'?(edu?.status==='C87_LEDGER_CHAIN_VALID'?
   edu.original_c87_readback.latest_state?.first_unclosed_edge??null:admission.first_unclosed_edge):shell.status.first_unclosed_edge??null,
  next:shell.status.runtime_guidance?.next_action??'STOP',
  persistence_scope:'SESSION_LOCAL_DERIVED_EVIDENCE_NOT_AUTHORITATIVE_STATE',
  product_release:'PRODUCT_NO_GO'};
}
export function verifySessionCapsule(c){
 if(c?.schema!=='ikant-le-project-session-capsule/v1'||c.authority!==0||c.active!==false||c.voice!=='NO_VOICE')return false;
 try{const expected=projectSessionCapsule({shell:c.payload.original_session_shell,
  source:c.payload.source,host:c.payload.host,ledgerTip:c.payload.ledger_tip,epoch:c.payload.epoch,admission:c.payload.admission,edu:c.payload.edu});
 return JSON.stringify(expected)===JSON.stringify(c);}catch{return false;}
}
const cell=s=>String(s??'UNKNOWN').replace(/[\r\n|`<>]/g,' ').slice(0,160);
export function renderSessionCapsule(c,{evidenceHref}={}){
 if(!verifySessionCapsule(c))throw Error('PROJECT_CAPSULE_INVALID');
 if(typeof evidenceHref!=='string'||! /^(sandbox:\/|https:\/\/)/.test(evidenceHref)||/[\s<>\[\]()]/.test(evidenceHref))throw Error('PROJECT_EVIDENCE_HREF_REQUIRED');
 const s=c.axes.ikant,docs=c.axes.backlog.artifacts.length;
 return `ESITO · **iKant · ${cell(c.axes.admission.mode??'Modo non attestato')} · core ${cell(s.display_status)}**\n\n`+
  `A · NO_VOICE\n\n`+
  `B · EDU: ${cell(c.axes.edu.status)}. HOST locale: Node ${cell(c.axes.host.node)}. UI nativa e persistenza tra chat: non attestate.\n\n`+
  `PROVA · [Stato completo e backlog (${docs} documenti)](${evidenceHref})\n\n`+
  `EDGE · ${cell(c.first_open_edge??'Nessun edge dichiarato dall’owner; assenza non certifica completezza.')}\n\n`+
  `NEXT · ${cell(c.next)}`;
}
export function reopenProjectSession({source,outputRoot,admission=null,eduLedgerFile=null}={}){
 // Reuse the existing writer lock to avoid reading two different ledger tips.
 return withWriterLock(()=>{
  const events=readLedger(),state=loadState();
  const shell=buildSessionShell({state,events,surfaceText:'',artifacts:[]});
  let edu=null;
  if(eduLedgerFile!==null){
   if(!admission||!path.isAbsolute(eduLedgerFile)||!fs.existsSync(eduLedgerFile))throw Error('PROJECT_EDU_LEDGER_BINDING_REQUIRED');
   if(fs.existsSync(eduLedgerFile+'.lock'))throw Error('PROJECT_EDU_WRITER_BUSY');
   const before=fs.readFileSync(eduLedgerFile),readback=reopenC87Ledger(eduLedgerFile),entries=before.toString().trim().split('\n').filter(Boolean).map(x=>JSON.parse(x));
   if(!fs.readFileSync(eduLedgerFile).equals(before)||fs.existsSync(eduLedgerFile+'.lock')||entries.some(e=>e.source_head!==source.head)||
    readback.latest_state&&readback.latest_state.public_selection_receipt_sha256!==admission.receipt_sha256)throw Error('PROJECT_EDU_LEDGER_SOURCE_OR_SELECTION_DRIFT');
   edu={status:readback.status,original_c87_readback:readback,ledger_sha256:hash(before),source_head:source.head,selection_receipt_sha256:admission.receipt_sha256,authority:0,active:false};
  }
  const capsule=projectSessionCapsule({shell,source,host:{node:process.versions.node},admission,edu,
   ledgerTip:events.at(-1)?.event_hash??'GENESIS',epoch:state.epoch});
  const dir=outputRoot??path.join(runtimePaths().dir,'project-projections');
  fs.mkdirSync(dir,{recursive:true,mode:0o700});
  const file=path.join(dir,capsule.evidence_sha256+'.json'),bytes=Buffer.from(JSON.stringify(capsule.payload));
  if(!fs.existsSync(file))fs.writeFileSync(file,bytes,{flag:'wx',mode:0o600});
  if(!fs.readFileSync(file).equals(bytes))throw Error('PROJECT_EVIDENCE_READBACK_MISMATCH');
  return{capsule,evidence:{path:file,bytes:bytes.length,sha256:hash(bytes),readback_verified:true,
   required_presentation:true,authority:0},ledger_unchanged:readLedger().at(-1)?.event_hash===events.at(-1)?.event_hash};
 });
}
