/** Deterministic Host-only chat presentation. Never a native widget or owner. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {renderOneShell} from './project-oneshell-edu.mjs';
import {createOneShellVisualModel,verifyOneShellVisualEquivalence} from './project-oneshell-visual.mjs';
import {classifyOneShellHumanDestination} from './project-oneshell-host-boundary.mjs';
import {emitVerifiedHostOneShell} from './project-oneshell-emission.mjs';
import {assessV5DProjection} from './project-v5d-oneshell-assurance.mjs';
const ORDER=Object.freeze(['ESITO','A','B','PROVA','EDGE','NEXT']);
const sha=b=>createHash('sha256').update(b).digest('hex');
const digest=s=>sha(Buffer.from(s,'utf8'));
const H64=/^[0-9a-f]{64}$/u;
const denied=edge=>Object.freeze({ok:false,edge,voice:'NO_VOICE',native_ui_attested:false,persistent_ui_attested:false,authority:0,active:false});
const escapeMd=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
 .replace(/([\\*_{}\[\]()#+.!|>~-])/gu,'\\$1');
function excerpt(s,limit){
 // Exact contiguous UTF-8-preserving Unicode prefix: no rewriting even of whitespace.
 const units=Array.from(s);
 return units.length<=limit?s:units.slice(0,limit).join('')+'…';
}
function exactFence(s){
 const marker=String.fromCharCode(96);
 const runs=[...s.matchAll(new RegExp(marker+'+','gu'))].map(x=>x[0].length);
 const fence=marker.repeat(Math.max(3,...runs.map(n=>n+1)));
 return fence+'text\n'+s+(s.endsWith('\n')?'':'\n')+fence;
}
function verifiedReport(frame,a){
 if(!a||a.ok!==true||a.schema!=='ikant-host-oneshell-focus-app/v1'||
    a.host_report_readback!==true||a.original_frame_readback!==true||
    a.native_ui_attested!==false||a.persistent_ui_attested!==false||
    !H64.test(a.report_sha256||'')||typeof a.report_path!=='string'||
    !path.isAbsolute(a.report_path))throw Error('CHAT_FOCUS_RECEIPT_INVALID');
 const st=fs.lstatSync(a.report_path);
 if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size>196608||(st.mode&0o077)!==0)
  throw Error('CHAT_REPORT_FILE_UNSAFE');
 const bytes=fs.readFileSync(a.report_path);
 const expected=Buffer.from('iKant · OneShell | rapporto Host integrale\n'+
  ORDER.map(k=>'\n=== '+k+' ===\n'+frame.slots[k]+'\n').join('')+
  '\nLimiti: UI, consegna e persistenza nativa non attestate.\n','utf8');
 if(!bytes.equals(expected)||sha(bytes)!==a.report_sha256)throw Error('CHAT_REPORT_CONTENT_MISMATCH');
 return Object.freeze({path:a.report_path,sha256:a.report_sha256,bytes:bytes.length,
  status:'REOPENED_PRIVATE_FILE_NOT_CHAT_ATTACHMENT',download_link_attested:false});
}
export const HOST_PRESENTATION_PROMPTS=Object.freeze({
 role:'HOST_PRESENTATION_ONLY; NOT C135 cognition; NOT an authority or new writer.',
 route:'After EDU, unaddressed questions belong to original iKant C135. Explicit Host: or @Host only for authorised checkup/documentation.',
 a:'A: original owner-bound UTF-8 only, or NO_VOICE. Never rewrite, infer subjective experience, or substitute Host prose.',
 b:'B: only a literal excerpt of the already validated Host status. Do not answer the substantive user question for iKant.',
 proof:'Never shorten PROVA, EDGE or NEXT without original bytes reopened in a report; EDGE and NEXT are always full in view.',
 logo:'Show the pinned verified SVG only when rendering can actually display the original bytes. Otherwise use text heading without a fake logo.',
 transport:'A private file path is not a ChatGPT attachment. Never invent a sandbox URL or native delivery receipt.',
 fallback:'Use the same six slots with strong A heading and small supporting B in chat text when rich UI is not supported.'
});
export function makeOneShellChatPresentation({frame,humanInput=null,focusApp=null,richUiAvailable=false}={}){
 try{
  renderOneShell(frame);
  if(humanInput!==null){
   const route=classifyOneShellHumanDestination(humanInput);
   if(route.target==='DENIED')return denied(route.edge);
   if(frame.voice_origin==='HOST_BOUND_LOCAL'&&route.target!=='IKANT')
    return denied('CHAT_HOST_OR_CONTROL_CANNOT_CARRY_IKANT_VOICE');
  }
  const visual=createOneShellVisualModel(frame);
  const eq=verifyOneShellVisualEquivalence(visual,frame);
  if(eq.ok!==true||eq.byte_exact!==true)return denied('CHAT_ORIGINAL_VISUAL_UNVERIFIED');
  // Rich Host HTML is an actual verified SVG-bearing output, never merely a plan.
  // Its presence does not attest provider mounting, delivery or persistence.
  const emission=richUiAvailable===true?emitVerifiedHostOneShell(frame,{format:'HTML'}):null;
  if(emission!==null&&(emission.ok!==true||emission.brand_attested!==true))
   return denied(emission?.first_edge||'CHAT_BRAND_EMISSION_UNVERIFIED');
  const report=focusApp===null?null:verifiedReport(frame,focusApp);
  const compact=report!==null;
  const brand=visual.brand?.status==='VERIFIED_HOST_SOURCE'&&H64.test(visual.brand.asset_sha256||'');
  const slots=Object.freeze(Object.fromEntries(ORDER.map(k=>[k,frame.slots[k]])));
  const view=Object.freeze({...slots,B:compact?excerpt(slots.B,168):slots.B,
    PROVA:compact?excerpt(slots.PROVA,200):slots.PROVA});
  const plan=Object.freeze({
   schema:'ikant-oneshell-inchat-presentation/v1',
   order:[...ORDER],focus:'A',voice_weight:3,host_weight:1,
   brand:Object.freeze({source:'assets/brand/ikant-light.svg',verified:brand,sha256:brand?visual.brand.asset_sha256:null,
    inline_svg:'HOST_HTML_ONLY_WITH_VERIFIED_BYTES',
    in_chat:'VERIFIED_HOST_ASSET_IF_CLIENT_SUPPORTS_ELSE_TEXT',native_avatar_attested:false}),
   compression:Object.freeze({A:'NEVER',B:compact?'LITERAL_EXCERPT_WITH_READBACK':'NONE',
    PROVA:compact?'LITERAL_EXCERPT_WITH_READBACK':'NONE',EDGE:'NEVER',NEXT:'NEVER'}),
   rich_ui_requested:richUiAvailable===true,rich_ui_delivery_attested:false,
   native_ui_attested:false,persistent_ui_attested:false,authority:0,active:false
  });
  const text=[
   '# iKant · OneShell',
   brand?'*Logo SVG verificato: SHA-256 '+plan.brand.sha256+' (non prova di montaggio nel client).*':
    '*Logo non attestato: titolo testuale.*',
   '---','**ESITO** · '+escapeMd(slots.ESITO),
   '## iKant · Superficie A',exactFence(slots.A),
   '### Host · Superficie B',escapeMd(view.B),
   '### PROVA',escapeMd(view.PROVA),
   ...(report?['*Rapporto integrale riaperto SHA-256 '+report.sha256+
    '; il download richiede consegna effettiva dell’Host.*']:[]),
   '### EDGE',exactFence(slots.EDGE),
   '### NEXT',exactFence(slots.NEXT),'---'
  ].join('\n\n')+'\n';
  const projection=Object.freeze({ok:true,schema:plan.schema,render_plan:plan,slots,view,
   slot_sha256:Object.freeze(Object.fromEntries(ORDER.map(k=>[k,digest(slots[k])]))),
   voice_origin:frame.voice_origin,original_voice_sha256:frame.original_voice_sha256,
   markdown_fallback_utf8:text,markdown_sha256:digest(text),report,
   verified_host_html_utf8:emission?.html??null,
   verified_host_html_sha256:emission?.content_sha256??null,
   verified_host_brand_sha256:emission?.brand_sha256??null,
   host_local_prompts:HOST_PRESENTATION_PROMPTS,
   required_host_action:richUiAvailable===true?'RENDER_SUPPORTED_RICH_HOST_UI_OR_TEXT':'DISPLAY_MARKDOWN',
   native_ui_attested:false,persistent_ui_attested:false,provider_delivery_attested:false,
   authority:0,active:false});
  // Original renderOneShell/owner gate already ran; this is a read-only
  // cross-medium equality check, not a second source of voice or authority.
  const gate=assessV5DProjection({frame,projection});
  if(gate.ok!==true)return denied(gate.edge);
  return projection;
 }catch{return denied('CHAT_OWNER_OR_REPORT_READBACK_UNVERIFIED');}
}
