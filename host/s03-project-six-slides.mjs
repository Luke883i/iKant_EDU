/** Read-only HOST presentation; never rewrites or validates original C125 provenance. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const contract=JSON.parse(readFileSync(new URL('../contracts/s03-host-slides.json',import.meta.url),'utf8'));
const hex=/^[0-9a-f]{64}$/;
const atom=/^[A-Za-z0-9_:.\/-]{1,100}$/;
const printable=s=>typeof s==='string'&&s.length<=96&&
 !/[\r\n\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/u.test(s);
const digest=x=>createHash('sha256').update(Buffer.from(x,'utf8')).digest('hex');
export function projectS03HostSlides({c125=null,result=null,host=null,evidenceSha256=null,edge=null,next=null}={}){
 if(c125!==null && (c125?.schema!=='ikant-le-c125-exclusive-shell/v2'||
  c125?.status!=='ASSISTANT_TEXT_ONLY'||typeof c125.emit!=='string'||c125.outside_shell_characters!==0))
  return Object.freeze({ok:false,reason:'S03_UNVERIFIED_C125_CLAIM',active:false});
 if(evidenceSha256!==null&&!hex.test(evidenceSha256))
  return Object.freeze({ok:false,reason:'S03_UNVERIFIED_EVIDENCE_DIGEST',active:false});
 if([result,host].some(x=>x!==null&&!printable(x))||
  [edge,next].some(x=>x!==null&&!atom.test(x)))
  return Object.freeze({ok:false,reason:'S03_UNSAFE_SLOT',active:false});
 // C125 bytes are opaque and remain available separately, never embedded in generated prose.
 const original=c125?.emit??null;
 const slots={ESITO:result??'NON_ATTESTATO',A:'NO_VOICE',
  B:host??'HOST_ONLY',PROVA:evidenceSha256===null?'NESSUNA_PROVA':`sha256:${evidenceSha256}`,
  EDGE:edge??'UNKNOWN',NEXT:next??'STOP'};
 return Object.freeze({ok:true,schema:contract.schema,mode:'HOST_PROJECTION',
  slots:Object.freeze(slots),slot_order:contract.slots.map(x=>x.id),
  c125_original_bytes:original,c125_original_sha256:original===null?null:digest(original),
  c125_provenance_attested_by_host:false,c125_readback_attested:false,native_delivery_attested:false,
  evidence_inlined:false,active:false,authority:0});
}
