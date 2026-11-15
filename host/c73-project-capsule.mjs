import {validateHostConsumptionFrame} from '../src/host-consumption-frame.mjs';
import {validateSessionShell} from '../src/session-shell.mjs';
import {validateC72ModeSelection} from './c72-unified-mode-admission.mjs';

const brand=Object.freeze({name:'iKant',alt:'iKant — rete funzionale stilizzata',
  light:'assets/brand/ikant-light.svg',dark:'assets/brand/ikant-dark.svg',
  appearance_is_not_runtime_evidence:true});
const visual=['BRAND','MODE_AND_ATTESTED_STATUS','SURFACE_B_DOWNLOAD_REFERENCES',
  'SURFACE_A_NATIVE_CHAT','FIRST_OPEN_EDGE'];
const causal=['RUNTIME_DOCX_WRITE_AND_REOPEN','HOST_MATERIALIZE_VERIFIED_ARTIFACT',
  'PRESENT_OWNER_BOUND_SURFACE_A'];
const h64=/^[0-9a-f]{64}$/;
function stop(edge,status='C73_PRESENTATION_BLOCKED'){
 return {schema:'ikant-le-c73-project-capsule-plan/v1',status,first_unclosed_edge:edge,
  brand:{...brand},shell_owner:'src/session-shell.mjs',authority:0,active:false,
  native_delivery_attested:false,origin_attested:false,host_runtime_control:false,
  surface_a_chat:null,surface_b_links:[],required_host_actions:[],
  visual_order:[...visual],causal_order:[...causal]};
}
function plan(mode,voice,docs,modeStatus,firstEdge,action){
 return {schema:'ikant-le-c73-project-capsule-plan/v1',
  status:modeStatus,mode,brand:{...brand},shell_owner:'src/session-shell.mjs',
  visual_order:[...visual],causal_order:[...causal],
  surface_a_chat:{kind:'ORDINARY_HOST_CHAT_BODY',text:voice,source:mode==='CANONICAL'?'OWNER_SHELL_VOICE_TEXT':'C71_HOST_OWNED_DRAFT'},
  surface_b_links:[],owner_shell_exact_text:null,surface_b_required:mode==='CANONICAL',
  artifact_requirements:docs,
  required_host_actions:action,
  first_unclosed_edge:firstEdge,
  runtime_claimed_active_but_not_independently_attested:mode==='CANONICAL',
  native_delivery_attested:false,origin_attested:false,host_runtime_control:false,
  inter_turn_persistence_attested:false,
  active:false,authority:0};
}
/**
 * Read-only plan. Never creates a DOCX, URL, event, owner, transcript or memory.
 * Host physically delivers any artifact before publishing the sealed A text.
 */
export function buildC73ProjectCapsule({selection=null,ownerResult=null,hostFrame=null,canonicalActiveReadback=null,experimentalResult=null,hostUrls=null}={}){
 if(!validateC72ModeSelection(selection))return stop('C72_MODE_SELECTION');
 if(hostUrls!==null)return stop('HOST_URLS_MUST_BE_NATIVE_DELIVERY_ACTIONS');
 if(selection.selected_mode==='EXPERIMENTAL'){
  if(ownerResult!==null||hostFrame!==null||canonicalActiveReadback!==null)return stop('EXPERIMENTAL_CANNOT_INHERIT_CANONICAL_AUTHORITY');
  const x=experimentalResult;
  if(!x||x.schema!=='ikant-le-c71-experimental-host-draft/v1'||
     x.status!=='EXPERIMENTAL_HOST_DRAFT'||x.authority!==0||
     x.active!==false||x.canonical_runtime!==false||
     x.native_event_attested!==false||x.persistent!==false||
     x.owner_receipt_issued!==false||x.host_delivery_attested!==false||
     !Array.isArray(x.routed_turns)||x.routed_turns.length!==1)
   return stop('C71_ACTUAL_EXECUTION_REQUIRED','EXPERIMENTAL_SELECTED_NOT_RUNNING');
  const t=x.routed_turns[0];
  if(t.authority!==0||t.action_executed!==false||typeof t.text!=='string'||
     t.text.length<1||t.text.length>7000||!h64.test(String(t.input_sha256||''))||
     !h64.test(String(t.output_sha256||'')))
   return stop('C71_TURN_INVALID');
  return plan('EXPERIMENTAL',t.text,[],'C73_EXPERIMENTAL_DRAFT_PRESENTATION_PLAN',
    'HOST_E2E_ORIGIN_AND_FUTURE_TURN_EVIDENCE',[
      {action:'PRESENT_HOST_OWNED_DRAFT_AS_CHAT',unsealed:true},
      {action:'OPTIONAL_DOCX_IF_PHYSICALLY_CREATED',canonical_surface_b:false}
    ]);
 }
 if(experimentalResult!==null)return stop('CANONICAL_EXPERIMENTAL_RESULT_COLLISION');
 // A well-formed ACTIVE shell is not a canonical owner readback. This is still
 // a structural check, never proof of native host event origin.
 const cr=canonicalActiveReadback;
 if(!cr||cr.schema!=='ikant-le-c59-canonical-active-readback/v1'||
    cr.ok!==true||cr.state!=='ACTIVE'||cr.terminal!=='ACTIVE'||
    cr.composition_authority!=='C59_CANONICAL'||cr.authority!==0||
    !h64.test(String(cr.canonical_composition_receipt_sha256||''))||
    !h64.test(String(cr.runtime_root_sha256||''))||
    cr.source_head!==selection.source_head||
    (hostFrame!==null&&cr.runtime_root_sha256!==hostFrame.runtime_root_sha256))
   return stop('CANONICAL_OWNER_ACTIVE_READBACK_REQUIRED','CANONICAL_REQUESTED_NOT_ACTIVE');
 const r=ownerResult,f=hostFrame;
 if(!r||!f)return stop('CANONICAL_OWNER_FRAME_REQUIRED','CANONICAL_REQUESTED_NOT_ACTIVE');
 if(!validateHostConsumptionFrame(f).ok||!r.session_shell||
    !validateSessionShell(r.session_shell).ok||
    f.state!=='ACTIVE'||r.state!=='ACTIVE'||
    f.claim_class!=='IKANT_ACTIVE'||r.session_shell.status?.tier!=='ACTIVE'||
    r.session_shell.status.active!==true||
    f.shell?.source!=='SESSION_SHELL'||
    f.shell?.session_shell_receipt_sha256!==r.session_shell.receipt_sha256||
    f.source_head!==selection.source_head||
    f.runtime_root_sha256!==cr.runtime_root_sha256||
    !h64.test(String(f.runtime_root_sha256||''))||
    !h64.test(String(f.runtime_evidence?.node_dispatch_receipt_sha256||'')))
  return stop('CANONICAL_OWNER_FRAME_INVALID');
 const docs=f.artifacts||[];
 if(docs.length!==1||f.presentation?.required_artifact_count!==1||
    docs[0].required_presentation!==true||docs[0].readback_verified!==true||
    !/\.docx$/i.test(String(docs[0].name||''))||
    r.session_shell.voice_surface.kind!=='SURFACE_A'||
    r.session_shell.voice_surface.voice_owner!=='IKANT')
  return stop('SAME_TURN_CANONICAL_DOCX_REQUIRED');
 const art=docs[0];
 return {...plan('CANONICAL',r.session_shell.voice_surface.text,
    [{name:art.name,sha256:art.sha256,bytes:art.bytes,
      checked_against_runtime_readback:true,host_download_url:null}],
    'C73_CANONICAL_FRAME_READY_NOT_HOST_DELIVERED','HOST_NATIVE_ARTIFACT_DELIVERY',
    [{action:'MATERIALIZE_AND_VERIFY_OWNER_DOCX_IN_HOST',name:art.name,sha256:art.sha256,bytes:art.bytes},
     {action:'EMIT_REAL_HOST_DOWNLOAD_LINK',name:art.name,url_must_not_be_invented:true},
     {action:'PRESENT_SEALED_SURFACE_A_IN_ORDINARY_CHAT',text_must_equal_owner:true} ]),owner_shell_exact_text:f.shell.text,canonical_active_readback_shape_valid:true,canonical_active_readback_receipt_sha256:cr.canonical_composition_receipt_sha256,owner_origin_independently_attested:false};
}
