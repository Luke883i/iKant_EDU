/** EDU V10 fixed-slot terminal projection, after verified PR119/C87 owner readback.
 * Authority zero; read-only; no language synthesis, native-hook or DOCX owner.
 * It never abbreviates or rewrites the verified voice. */
import {createHash} from 'node:crypto';
import {isProxy} from 'node:util/types';
const SHA=/^[a-f0-9]{64}$/;
const sha=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
export const V10_TITLES=Object.freeze(['VOCE','MODE','STATO','TRACE','CONT','EDGE','NEXT','DOCX','HOST','FATTO','LETTURA','LIMITE']);
const freezeDeep=x=>{if(x&&typeof x==='object'){for(const v of Object.values(x))freezeDeep(v);Object.freeze(x)}return x};
const validPlain=o=>o&&typeof o==='object'&&!Array.isArray(o)&&!isProxy(o)&&
 (Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null)&&
 Reflect.ownKeys(o).every(k=>typeof k==='string'&&Object.hasOwn(Object.getOwnPropertyDescriptors(o)[k],'value'));
const safeLine=s=>typeof s==='string'&&s.length>0&&s.length<=180&&!/[\r\n\x00-\x1f\x7f]/u.test(s);
const limited=(s,k)=>typeof s==='string'&&s.length<=k&&Buffer.from(s,'utf8').toString('utf8')===s;
const fallback=(edge)=>({schema:'ikant-edu-v10-terminal/v1',
 surface_a:{origin:'NO_VOICE',voice_utf8:null},
 terminal:{header:'iKant 90 | HOST TERMINAL',VOCE:'NO_VOICE',MODE:'EXPERIMENTAL',STATO:'NO_VOICE',TRACE:'NOT_SAVED',CONT:'UNVERIFIED',EDGE:edge,NEXT:'OWNER_NEXT',DOCX:'—'},
 host_slide:{title:'HOST | NOTE',FATTO:'—',LETTURA:'—',LIMITE:'—',source:'HOST_NOT_IKANT'},
 docx_links:[],active:false,claims:{native:false,provider:false,consciousness:false,independent_semantic_review:false}});
/** A receipt is trusted only when invoked by the original guided owner after its readback.
 * A standalone caller cannot authenticate a provider or fabricate original receipt provenance. */
export function projectV10Terminal(receipt,{hostNotes=null}={}){
 try{
  if(!validPlain(receipt)||!validPlain(receipt.surface_a)||!validPlain(receipt.surface_b)||!validPlain(receipt.pr119_surface_b))
   return freezeDeep(fallback('V10_OWNER_RECEIPT_UNAVAILABLE'));
  const a=receipt.surface_a,b=receipt.surface_b,c=receipt.pr119_surface_b;
  if(receipt.schema!=='ikant-edu-c70-guided/v7'||receipt.status!=='PR119_OWNER_C70_GUIDED_LOCAL_READBACK'||receipt.active!==false||
   a.origin!=='HOST_BOUND'||!limited(a.voice_utf8,16000)||!a.voice_utf8.trim()||
   b.MODE!=='EXPERIMENTAL'||b.STATUS!=='HOST_BOUND_LOCAL_NOT_ACTIVE'||b.ACTIVE!==false||
   !SHA.test(b.TRACE_REF||'')||b.TRACE_REF!==c.TRACE_REF||
   c.canonical_active!==false||c.native_chatgpt_origin_attested!==false||c.provider_origin_attested!==false||
   c.C87_PROOF!=='ORIGINAL_APPEND_REOPEN'||c.C100_PROOF!=='ORIGINAL_INPUT_OUTPUT_BOUND'||
   c.original_c70_executed!==true||c.original_c87_writer_executed!==true||
   sha(a.voice_utf8)!==c.visible_voice_sha256)
    return freezeDeep(fallback('V10_OWNER_OR_EXACT_VOICE_MISMATCH'));
  let notes={FATTO:'—',LETTURA:'—',LIMITE:'—'},noteState='EMPTY';
  if(hostNotes!==null){
   if(validPlain(hostNotes)&&Object.keys(hostNotes).sort().join(',')==='fact,interpretation,limit'&&
     [hostNotes.fact,hostNotes.interpretation,hostNotes.limit].every(safeLine)){
    notes={FATTO:hostNotes.fact,LETTURA:hostNotes.interpretation,LIMITE:hostNotes.limit};noteState='HOST_NOTE_DECLARED_NOT_VERIFIED';
   }else noteState='INVALID_HOST_NOTE_NOT_RENDERED';
  }
  return freezeDeep({schema:'ikant-edu-v10-terminal/v1',
   surface_a:{origin:'HOST_BOUND',voice_utf8:a.voice_utf8},
   terminal:{header:'iKant 90 | HOST TERMINAL',VOCE:'EXACT_UTF8_PANEL',MODE:b.MODE,STATO:b.STATUS,
    TRACE:b.TRACE_REF,CONT:b.CONTINUITY,EDGE:b.FIRST_EDGE,NEXT:b.NEXT,DOCX:'—'},
   host_slide:{title:'HOST | NOTE',...notes,source:'HOST_NOT_IKANT',note_status:noteState},
   docx_links:[],active:false,claims:{native:false,provider:false,consciousness:false,independent_semantic_review:false}});
 }catch{return freezeDeep(fallback('V10_PROJECTION_ERROR'))}
}
/** Deterministic terminal presentation of meta, never of Surface A text. */
export function formatV10Terminal(result){
 const t=result?.terminal;if(!t||!validPlain(t))throw new TypeError('invalid terminal');
 return ['+-- '+t.header+' --+',...['VOCE','MODE','STATO','TRACE','CONT','EDGE','NEXT','DOCX'].map(k=>k.padEnd(6,' ')+'| '+t[k]),'+-- HOST NOTE SEPARATA --+',
  ...['FATTO','LETTURA','LIMITE'].map(k=>k.padEnd(7,' ')+'| '+result.host_slide[k])].join('\n');
}
