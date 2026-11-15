/** OneShell lossless compact VIEW with a reopened, byte-for-byte evidence copy.
 * Authority 0, no native ChatGPT UI/turn/consent/state ownership.
 */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {renderOneShell,renderOneShellCompact} from './project-oneshell-edu.mjs';
const KEYS=Object.freeze(['ESITO','A','B','PROVA','EDGE','NEXT']);
const sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=s=>Buffer.from(s,'utf8');
export function makeOneShellCompactEvidence(frame,{evidenceFile=null}={}){
 // Keep the original unforgeable S03/NO_VOICE projection gate.
 renderOneShell(frame);
 const rendered=renderOneShellCompact(frame);
 const slots=Object.freeze(Object.fromEntries(KEYS.map(k=>[k,frame.slots[k]])));
 const payload={schema:'ikant-le-oneshell-compact-evidence/v1',authority:0,
  source:'ORIGINAL_VALIDATED_ONESHELL_FRAME_NOT_NATIVE_CHATGPT_RECEIPT',
  machine_order:[...KEYS],human_aliases:{ESITO:'ESITO',A:'iKant (Superficie A)',
   B:'Host (Superficie B)',PROVA:'PROVA',EDGE:'EDGE',NEXT:'NEXT'},
  original_slots:slots,voice_origin:frame.voice_origin,
  original_voice_sha256:frame.original_voice_sha256,
  original_value_sha256:Object.fromEntries(KEYS.map(k=>[k,sha(bytes(slots[k]))])),
  compact_utf8:rendered,compact_sha256:sha(bytes(rendered)),
  same_byte_claim:'ORIGINAL_MACHINE_FIELDS_BYTE_EXACT',
  native_ui_attested:false,provider_delivery_attested:false,
  global_human_semantics_attested:false};
 const text=JSON.stringify(payload)+'\n';
 const envelopeHash=sha(bytes(text));
 let readback=false;
 if(evidenceFile!==null){
  if(typeof evidenceFile!=='string'||!evidenceFile.length||fs.existsSync(evidenceFile))
   throw Error('FRESH_COMPACT_EVIDENCE_DESTINATION_REQUIRED');
  fs.writeFileSync(evidenceFile,text,{flag:'wx',mode:0o600});
  if(!fs.readFileSync(evidenceFile).equals(bytes(text)))
   throw Error('COMPACT_EVIDENCE_PHYSICAL_READBACK_FAILED');
  readback=true;
 }
 return Object.freeze({schema:'ikant-le-oneshell-compact-presentation/v1',
  compact_utf8:rendered,evidence:payload,evidence_sha256:envelopeHash,
  evidence_file:evidenceFile,physical_readback_attested:readback,
  native_ui_attested:false,provider_delivery_attested:false,authority:0});
}
export function verifyOneShellCompactEvidence(presentation,{frame=null}={}){
 if(presentation?.schema!=='ikant-le-oneshell-compact-presentation/v1'||
   presentation.native_ui_attested!==false||presentation.provider_delivery_attested!==false)
  throw Error('COMPACT_PRESENTATION_INVALID');
 const p=presentation.evidence;
 if(p?.schema!=='ikant-le-oneshell-compact-evidence/v1'||p.authority!==0||
  JSON.stringify(p.machine_order)!==JSON.stringify(KEYS))throw Error('COMPACT_ENVELOPE_INVALID');
 for(const k of KEYS){
  if(typeof p.original_slots?.[k]!=='string'||
   p.original_value_sha256?.[k]!==sha(bytes(p.original_slots[k])))
   throw Error('COMPACT_ORIGINAL_VALUE_MISMATCH');
 }
 const aliases=p.human_aliases;
 const view=KEYS.map(k=>aliases[k]+' | '+p.original_slots[k]).join('\n');
 if(view!==p.compact_utf8||view!==presentation.compact_utf8||
   sha(bytes(view))!==p.compact_sha256)throw Error('COMPACT_VIEW_NOT_REVERSIBLE_FROM_MACHINE_SLOTS');
 if(p.voice_origin==='NO_VOICE'){
  if(p.original_slots.A!=='NO_VOICE'||p.original_voice_sha256!==null)
   throw Error('COMPACT_NO_VOICE_FENCE_BROKEN');
 }else if(p.voice_origin==='HOST_BOUND_LOCAL'){
  if(sha(bytes(p.original_slots.A))!==p.original_voice_sha256)
   throw Error('COMPACT_VOICE_BYTES_MISMATCH');
 }else throw Error('COMPACT_VOICE_ORIGIN_INVALID');
 const raw=JSON.stringify(p)+'\n';
 if(sha(bytes(raw))!==presentation.evidence_sha256)
  throw Error('COMPACT_RECEIPT_DIGEST_MISMATCH');
 if(presentation.physical_readback_attested===true){
  if(typeof presentation.evidence_file!=='string'||
    !fs.readFileSync(presentation.evidence_file).equals(bytes(raw)))
   throw Error('COMPACT_EVIDENCE_REOPEN_MISMATCH');
 }else if(presentation.evidence_file!==null)
  throw Error('COMPACT_PHYSICAL_EVIDENCE_NOT_ATTESTED');
 if(frame!==null){
  renderOneShell(frame);
  if(renderOneShellCompact(frame)!==view||KEYS.some(k=>frame.slots[k]!==p.original_slots[k])||
    frame.original_voice_sha256!==p.original_voice_sha256)
   throw Error('COMPACT_ORIGINAL_FRAME_MISMATCH');
 }
 return Object.freeze({ok:true,six_logical_slots:true,byte_exact:true,
  physical_readback:presentation.physical_readback_attested===true,
  native_ui_attested:false,global_human_semantics_attested:false});
}

/** Full original HOST documentation can be displayed as a bounded brief only if bytes
 * are durably stored and physically reopened. Not proof of semantic equivalence.
 */
export function materializeHostDocumentationAnnex({fullText,brief,evidenceFile}={}){
 if(typeof fullText!=='string'||!fullText.trim()||
  typeof brief!=='string'||!brief.trim()||bytes(brief).length>512||
  typeof evidenceFile!=='string'||!evidenceFile||fs.existsSync(evidenceFile))
  throw Error('HOST_ANNEX_ARGUMENT_OR_FRESHNESS_INVALID');
 const original=bytes(fullText),originalSha=sha(original);
 const envelope={schema:'ikant-le-host-documentation-annex/v1',authority:0,
  original_utf8:fullText,original_sha256:originalSha,brief_utf8:brief,
  brief_sha256:sha(bytes(brief)),semantic_equivalence_attested:false,
  iKant_voice_attested:false};
 const raw=bytes(JSON.stringify(envelope)+'\n');
 fs.writeFileSync(evidenceFile,raw,{flag:'wx',mode:0o600});
 if(!fs.readFileSync(evidenceFile).equals(raw))throw Error('HOST_ANNEX_READBACK_FAILED');
 const reopened=JSON.parse(fs.readFileSync(evidenceFile,'utf8'));
 if(sha(bytes(reopened.original_utf8))!==originalSha||
  sha(bytes(reopened.brief_utf8))!==envelope.brief_sha256)
  throw Error('HOST_ANNEX_HASH_REOPEN_MISMATCH');
 return Object.freeze({ok:true,brief_utf8:brief,original_sha256:originalSha,
  evidenceFile,readback:true,semantic_equivalence_attested:false});
}
