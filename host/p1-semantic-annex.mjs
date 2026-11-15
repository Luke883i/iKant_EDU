/** HOST-only evidence retention. Never a C87 or C59 writer/receipt. */
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, openSync, closeSync} from 'node:fs';
import {isProxy} from 'node:util/types';
const sha=x=>createHash('sha256').update(x).digest('hex');
const atomId=/^[A-Za-z0-9_.:-]{1,96}$/;
function deny(edge){return Object.freeze({ok:false,first_edge:edge,author:'HOST',c87_original:false,canonical_active:false,semantically_lossless_attested:false});}
export function buildP1HostAnnex({turnId,atoms,slideAtomIds}={}){
 if(typeof turnId!=='string'||!atomId.test(turnId)||!Array.isArray(atoms)||!Array.isArray(slideAtomIds)||isProxy(atoms)||isProxy(slideAtomIds)||atoms.length>1000)return deny('P1_INVALID_INPUT');
 const seen=new Set(),slides=new Set();
 for(const id of slideAtomIds){if(typeof id!=='string'||!atomId.test(id)||slides.has(id))return deny('P1_INVALID_SLIDE_ATOM');slides.add(id);}
 const retained=[];let exposed=0;
 for(const a of atoms){
  if(!a||typeof a!=='object'||Array.isArray(a)||isProxy(a)||
    typeof a.id!=='string'||!atomId.test(a.id)||seen.has(a.id)||
    typeof a.original_text!=='string'||a.original_text.length===0||a.original_text.length>200000||
    typeof a.source!=='string'||!atomId.test(a.source)||
    typeof a.critical!=='boolean'||typeof a.in_slide!=='boolean'||a.in_slide!==slides.has(a.id))return deny('P1_INVALID_OR_MISSING_ATOM');
  seen.add(a.id);if(a.in_slide)exposed++;
  retained.push(Object.freeze({id:a.id,source:a.source,critical:a.critical,in_slide:a.in_slide,original_text:a.original_text,original_sha256:sha(Buffer.from(a.original_text,'utf8'))}));
 }
 if(slides.size!==exposed||retained.length===0)return deny('P1_ATOM_COVERAGE_UNKNOWN');
 const document={schema:'ikant-host-annex/v1',author:'HOST',turn_id:turnId,atom_count:retained.length,atoms:retained};
 const bytes=Buffer.from(JSON.stringify(document,null,2)+'\n','utf8');
 return Object.freeze({ok:true,annex_utf8:bytes.toString('utf8'),annex_sha256:sha(bytes),atom_ids:retained.map(a=>a.id),critical_atom_ids:retained.filter(a=>a.critical).map(a=>a.id),
  covered_critical_atom_ids:retained.filter(a=>a.critical).map(a=>a.id),atom_coverage:1,
  author:'HOST',c87_original:false,canonical_active:false,annex_materialized:false,semantically_lossless_attested:false});
}
export function verifyP1AnnexBytes(annexUtf8,expectedSha){
 if(typeof annexUtf8!=='string'||typeof expectedSha!=='string'||!/^[0-9a-f]{64}$/.test(expectedSha)||sha(Buffer.from(annexUtf8,'utf8'))!==expectedSha)return deny('P1_ANNEX_BYTES_MISMATCH');
 let o;try{o=JSON.parse(annexUtf8);}catch{return deny('P1_ANNEX_INVALID_JSON');}
 if(o.schema!=='ikant-host-annex/v1'||o.author!=='HOST'||!Array.isArray(o.atoms)||o.atom_count!==o.atoms.length)return deny('P1_ANNEX_FORMAT_MISMATCH');
 for(const a of o.atoms){if(typeof a.original_text!=='string'||sha(Buffer.from(a.original_text,'utf8'))!==a.original_sha256)return deny('P1_ORIGINAL_ATOM_DRIFT');}
 return Object.freeze({ok:true,bytes_sha256:expectedSha,atom_count:o.atom_count,source_kind:'HOST_ANNEX_BYTES_REOPENED_NOT_PROVIDER',semantically_lossless_attested:false});
}
/** Writes only an explicit HOST destination supplied by caller; never creates a C87 ledger. */
export function materializeP1HostAnnex({document,path}={}){
 if(!document?.ok||typeof path!=='string'||!path.endsWith('.json'))return deny('P1_DESTINATION_UNVERIFIED');
 let fd;try{fd=openSync(path,'wx',0o600);writeFileSync(fd,document.annex_utf8,{encoding:'utf8'});closeSync(fd);fd=null;
  const readback=readFileSync(path,'utf8');const valid=verifyP1AnnexBytes(readback,document.annex_sha256);if(!valid.ok)return valid;
  return Object.freeze({ok:true,path,readback_sha256:valid.bytes_sha256,atom_count:valid.atom_count,author:'HOST',native_delivery_attested:false});
 }catch{return deny('P1_HOST_FILE_NOT_MATERIALIZED');}finally{if(fd!==undefined&&fd!==null)try{closeSync(fd);}catch{}}
}
