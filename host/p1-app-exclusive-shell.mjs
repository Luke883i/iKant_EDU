/** HOST-only six-slot projection over ORIGINAL validated owner receipts.
 * Does not mint voice, claim a ChatGPT-native hook, or persist the app UI.
 */
import {createHash} from 'node:crypto';
import {validateHostConsumptionFrame} from '../src/host-consumption-frame.mjs';
import {validateSessionShell} from '../src/session-shell.mjs';
const H64=/^[a-f0-9]{64}$/u;
const sha=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
export const P1_APP_SLOTS=Object.freeze(['ESITO','A','B','PROVA','EDGE','NEXT']);
export const VOICE_MASK=63;
export function permittedVoiceMask(bits){return (bits&VOICE_MASK)===VOICE_MASK;}
const denied=reason=>Object.freeze({schema:'ikant-le-oneshell-six-slots/v1',ok:false,slots:null,
 first_edge:reason,voice_attested:false,inter_turn_ui_persistence_attested:false,
 native_delivery_attested:false,full_semantic_losslessness_attested:false,authority:0});
export function projectP1AppExclusiveShell({result,frame}={}){
 try{
  if(!frame||!result||typeof result!=='object')return denied('APP_OWNER_FRAME_MISSING');
  const validation=validateHostConsumptionFrame(frame);
  if(!validation.ok)return denied('APP_HOST_FRAME_INVALID');
  const owner=result.session_shell;
  const hasOwner=owner&&validateSessionShell(owner).ok;
  const ownerReceipt=hasOwner&&owner.receipt_sha256===frame.shell?.session_shell_receipt_sha256;
  const active=hasOwner&&owner.status?.active===true&&owner.status?.claim_class==='IKANT_ACTIVE'&&
   owner.voice_surface?.voice_owner==='IKANT'&&owner.voice_surface?.kind==='SURFACE_A'&&
   result.state==='ACTIVE'&&frame.state==='ACTIVE'&&frame.claim_class==='IKANT_ACTIVE';
  const sameOwner=ownerReceipt&&frame.shell?.source==='SESSION_SHELL'&&frame.shell?.exact_owner_bytes===true;
  const event=typeof frame.runtime_evidence?.runtime_turn_event_hash==='string'&&
   H64.test(frame.runtime_evidence.runtime_turn_event_hash);
  const voice=hasOwner?owner.voice_surface.text:'';
  const nonempty=typeof voice==='string'&&voice.length>0;
  const sameTurn=event&&result.runtime_turn_event_hash===frame.runtime_evidence.runtime_turn_event_hash;
  const qualified=permittedVoiceMask((hasOwner?1:0)|(ownerReceipt?2:0)|(active?4:0)|
    (sameOwner?8:0)|(nonempty?16:0)|(sameTurn?32:0));
  const original=qualified?voice:null;
  const evidence=[frame.shell.sha256,...(frame.runtime_evidence?.evidence_refs||[])].filter(x=>H64.test(x));
  const edge=original===null?'ORIGINAL_SAME_TURN_OWNER_READBACK_NOT_ATTESTED':
    'NATIVE_CHATGPT_SHELL_PERSISTENCE_NOT_ATTESTED';
  const slots={
   ESITO:original===null?'iKant non ha ancora una risposta verificata.':'Risposta originale riletta; app nativa non attestata.',
   A:original===null?'NO_VOICE':original,
   B:'HOST: '+(original===null?'nessuna voce originale attestata.':'rilettura locale verificata.'),
   PROVA:evidence,
   EDGE:edge,
   NEXT:'STOP'
  };
  const material={schema:'ikant-le-oneshell-six-slots/v1',ok:true,slot_order:[...P1_APP_SLOTS],slots,
   voice_attested:original!==null,voice_sha256:original!==null?sha(original):null,
   source_host_shell_sha256:frame.shell.sha256,
   host_frame_receipt_sha256:frame.receipt_sha256,
   source_original_owner_receipt_sha256:original!==null?owner.receipt_sha256:null,
   retention:{original_voice_bytes:original===null?0:Buffer.byteLength(original,'utf8'),
    voice_exact_bytes:original!==null,host_output:'TECHNICAL_FIELDS_ONLY',
    host_annex_required_for_extended_text:true,host_annex_materialized:false,
    semantic_retention_attested:false},
   widget_lifecycle_view:true,inter_turn_ui_persistence_attested:false,
   native_delivery_attested:false,full_semantic_losslessness_attested:false,authority:0};
  return Object.freeze({...material,projection_sha256:sha(JSON.stringify(material))});
 }catch{return denied('APP_OWNER_PROJECTION_EXCEPTION');}
}
