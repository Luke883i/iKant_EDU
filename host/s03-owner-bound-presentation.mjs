/** S03: evidence-preserving HOST view over an already completed S02 local owner turn.
 * This is NOT a provider receipt, and caller JSON cannot authenticate its origin.
 * Original C125 bytes remain separately available without a second send/write.
 */
import {createHash} from 'node:crypto';
import {isProxy} from 'node:util/types';
import {projectS03HostSlides} from './s03-project-six-slides.mjs';
const H=x=>createHash('sha256').update(Buffer.from(x,'utf8')).digest('hex');
const no=edge=>Object.freeze({ok:false,first_edge:edge,active:false,native_delivery_attested:false});
export function projectS03CompletedEduTurn({ownerTurn,originalC125Text,host='HOST_BOUND_LOCAL',next='STOP'}={}){
 if(!ownerTurn||typeof ownerTurn!=='object'||isProxy(ownerTurn)||
    typeof originalC125Text!=='string'||typeof host!=='string'||typeof next!=='string')
  return no('S03_ORIGINAL_C125_AND_OWNER_REQUIRED');
 const t=ownerTurn.original_turn,p=ownerTurn.c125;
 if(ownerTurn.ok!==true||ownerTurn.status!=='S02_EDU_V2_HOST_BOUND_LOCAL_READBACK'||
    ownerTurn.active!==false||ownerTurn.native_event_attested!==false||
    !Number.isSafeInteger(ownerTurn.c87_before)||ownerTurn.c87_after!==ownerTurn.c87_before+1||
    t?.public_mode!=='EDU'||t?.original_c87_writer_executed!==true||
    !(t?.original_c70_executed===true||t?.status==='C140_ORIGINAL_C100_C87_LOCAL_READBACK'&&
      t?.original_c70_executed===false&&t?.c140_open_route===true)||typeof t?.voice_utf8!=='string'||
    p?.ok!==true||p?.origin!=='HOST_BOUND'||p?.send_callback_resolved!==true||
    p?.native_exclusive_attested!==false||p?.platform_delivery_attested!==false||
    p?.frame_sha256!==H(originalC125Text)||p?.voice_sha256!==H(t.voice_utf8))
  return no('S03_LOCAL_OWNER_EVIDENCE_MISMATCH');
 const start='<<<VOICE_UTF8_START>>>\n',end='\n<<<VOICE_UTF8_END>>>';
 const a=originalC125Text.indexOf(start),b=originalC125Text.indexOf(end,a+start.length);
 if(a<0||b<0||originalC125Text.indexOf(start,a+1)!==-1||originalC125Text.indexOf(end,b+1)!==-1||
    originalC125Text.slice(a+start.length,b)!==t.voice_utf8||
    !originalC125Text.includes('MODE  | EDU')&& !originalC125Text.includes('MODE | EDU'))
  return no('S03_C125_VOICE_BYTES_NOT_EXACT');
 const x=projectS03HostSlides({result:'EDU_LOCAL_READBACK',host,
  evidenceSha256:p.frame_sha256,edge:'PROVIDER_NATIVE_DELIVERY_NOT_ATTESTED',next});
 if(!x.ok)return no(x.reason);
 return Object.freeze({...x,slots:Object.freeze({...x.slots,A:'HOST_BOUND'}),
  c125_original_bytes:originalC125Text,c125_original_sha256:H(originalC125Text),
  original_voice_utf8:t.voice_utf8,original_voice_sha256:H(t.voice_utf8),
  same_turn_local_owner_evidence_checked:true,
  origin_scope:'HOST_BOUND_LOCAL_NOT_PROVIDER_AUTHENTICATED',
  c125_provenance_attested_by_host:false,c125_readback_attested:true,
  native_delivery_attested:false,active:false});
}
