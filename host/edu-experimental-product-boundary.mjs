/**
 * EDU experimental boundary: HOST diagnostics, never C72/C135/C87/C125 authority.
 * Waivers remove unsupported enterprise claims only, not original owner gates.
 */
import {createHash} from 'node:crypto';
import {isProxy} from 'node:util/types';

const hash=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
export const EXPERIMENTAL_NONCLAIMS=Object.freeze({
 NATIVE_EVENT:'PROVIDER_NATIVE_EVENT_NOT_ATTESTED',
 MCP_OAUTH:'MCP_C59_ACTIVE_NOT_ATTESTED',
 CROSS_CHAT:'CROSS_CHAT_PERSISTENCE_NOT_ATTESTED',
 NATIVE_UI:'NATIVE_UI_NOT_ATTESTED',
 DOCX_PRESENTATION:'DOCX_NOT_PRODUCED_UNLESS_OWNER_REQUIRES_IT',
 PROMPT_INSTALL:'INSTALLED_PROMPT_EQUIVALENCE_UNKNOWN',
 MODEL_EFFICACY:'COGNITIVE_UPLIFT_NOT_MEASURED',
 SLA_HA_TELEMETRY:'ENTERPRISE_SERVICE_LEVELS_NOT_ATTESTED',
 RELEASE_ADMIN:'PUBLIC_RELEASE_NOT_QUALIFIED',
 ANCILLARY_DOCS:'OPTIONAL_DOCS_NOT_READ_OWNER_SOURCE_UNCHANGED'
});
const deny=first_edge=>Object.freeze({ok:false,authority:0,active:false,
 first_edge,original_owner_receipt:false,voice:'NO_VOICE'});
const plain=v=>{if(v===null||typeof v!=='object'||isProxy(v))return false;
 try{return Object.getPrototypeOf(v)===Object.prototype&&Reflect.ownKeys(v).every(k=>
 typeof k==='string'&&Object.hasOwn(Object.getOwnPropertyDescriptor(v,k),'value'));}
 catch{return false;}};
/** No grants of authority: each entry is solely a narrowing nonclaim. */
export function declareEduExperimentalBoundary(options={}){
 if(!plain(options)||Object.keys(options).some(k=>k!=='waivers'))return deny('EDU_WAIVER_REQUEST_INVALID');
 const waivers=options.waivers===undefined?[]:options.waivers;
 if(!Array.isArray(waivers)||isProxy(waivers)||waivers.length>10||
   Object.keys(waivers).length!==waivers.length||
   Object.keys(waivers).some(k=>!Object.hasOwn(Object.getOwnPropertyDescriptor(waivers,k)||{},'value'))||
   new Set(waivers).size!==waivers.length||
   waivers.some(id=>typeof id!=='string'||!Object.hasOwn(EXPERIMENTAL_NONCLAIMS,id)))
  return deny('EDU_UNSUPPORTED_EXPERIMENTAL_WAIVER');
 const declarations=waivers.map(id=>Object.freeze({id,nonclaim:EXPERIMENTAL_NONCLAIMS[id],
  scope:'EXTERNAL_ASSURANCE_ONLY',original_owner_preconditions_unchanged:true}));
 return Object.freeze({ok:true,status:'EDU_EXPERIMENTAL_NONCLAIMS_ONLY',mode:'EDU',
  authority:0,active:false,original_owner_receipt:false,
  grants_original_effect:false,owner_source_closure_waived:false,
  declarations:Object.freeze(declarations)});
}
/**
 * Called exclusively *after* original.publishTurn and original.readSessionState
 * inside startOneShellEdu. Even a PASS is a Host consistency check, not an
 * independent issuer of C135/C87 receipts or provider delivery.
 */
export function checkEduExperimentalOriginalTurn(input={}){
 try{
  if(!plain(input))return deny('EDU_BOUNDARY_UNSAFE_OR_UNREADABLE_EVIDENCE');
  const {turn,frame,c125Bytes,readback}=input;
  if(!plain(turn)||!plain(frame)||!plain(readback)||
     turn.ok!==true||turn.active!==false||turn.native_event_attested!==false||
     typeof frame.humanInput!=='string'||typeof frame.nonce!=='string'||
     !/^[A-Za-z0-9_-]{12,96}$/.test(frame.nonce)||
     !Number.isSafeInteger(turn.c87_before)||!Number.isSafeInteger(turn.c87_after)||
     turn.c87_after!==turn.c87_before+1)return deny('EDU_BOUNDARY_ORIGINAL_TURN_INVALID');
  const origin=turn.original_turn, s=turn.s03_host_projection, r=readback.original_c87_readback;
  if(!plain(origin)||!plain(s)||!plain(r)||!plain(r.latest_state)||
     s.ok!==true||s.same_turn_local_owner_evidence_checked!==true||
     r.count!==turn.c87_after||r.last_hash!==origin.ledger_event_sha256||
     r.latest_state.nonce!==frame.nonce||
     r.latest_state.source_head!==turn.source_head||
     origin.input_sha256!==hash(frame.humanInput)||
     origin.output_sha256!==hash(s.original_voice_utf8)||
     typeof c125Bytes!=='string'||c125Bytes!==s.c125_original_bytes||
     s.original_voice_sha256!==hash(s.original_voice_utf8)||
     s.c125_original_sha256!==hash(c125Bytes)||
     r.latest_state.visible_voice_sha256!==hash(s.original_voice_utf8))
    return deny('EDU_BOUNDARY_OWNER_READBACK_MISMATCH');
  const open=origin.c140_open_route===true;
  if(open){
   if(origin.status!=='C140_ORIGINAL_C100_C87_LOCAL_READBACK'||
      origin.original_c70_executed!==false||
      r.latest_state.c140_open_route!==true||
      r.latest_state.c140_original_c70_executed!==false)
    return deny('EDU_BOUNDARY_C140_MISREPRESENTED');
  }else if(!['C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK',
      'C139_ORIGINAL_C70_C100_C87_LOCAL_READBACK',
      'C143_ORIGINAL_C70_C100_C87_LOCAL_READBACK'].includes(origin.status)||
      origin.original_c70_executed!==true||r.latest_state.c140_open_route===true)
   return deny('EDU_BOUNDARY_ORIGINAL_C70_NOT_ATTESTED');
  return Object.freeze({ok:true,status:'EDU_HOST_BOUNDARY_CHECKED_NOT_NATIVE',
   cognitive_route:open?'C140_OPEN':'C107_FAMILY',
   original_c70_executed:!open,authority:0,active:false,
   native_event_attested:false,original_owner_receipt:false,
   proof_kind:'HOST_CHECK_OF_ORIGINAL_OWNER_OUTPUT_NOT_AN_OWNER_ISSUER'});
 }catch{return deny('EDU_BOUNDARY_UNSAFE_OR_UNREADABLE_EVIDENCE');}
}
