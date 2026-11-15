/** HOST-only final delivery boundary for repository-controlled OneShell.
 * A prompt or ChatGPT's native chat surface cannot be forced through this API.
 * This guard fails closed on missing source-verified glyph instead of silently
 * producing branded-looking rich HTML without the official iKant SVG. */
import {createHash} from 'node:crypto';
import {renderOneShell} from './project-oneshell-edu.mjs';
import {createOneShellVisualModel,verifyOneShellVisualEquivalence,
 renderOneShellVisualHtml,renderOneShellVisualText} from './project-oneshell-visual.mjs';
const H64=/^[a-f0-9]{64}$/u;
const digest=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const stop=edge=>Object.freeze({ok:false,first_edge:edge,html:null,brand_attested:false,
 native_avatar_attested:false,native_delivery_attested:false,authority:0});
const glyphCount=html=>(html.match(/class="ikant-brand-mark"/gu)||[]).length;
export function emitVerifiedHostOneShell(frame,{format='HTML'}={}){
 if(format!=='HTML'&&format!=='TEXT')return stop('HOST_EMISSION_FORMAT_NOT_SUPPORTED');
 try{
  renderOneShell(frame);
  const model=createOneShellVisualModel(frame);
  const verification=verifyOneShellVisualEquivalence(model,frame);
  if(verification.ok!==true||verification.byte_exact!==true)return stop('HOST_EMISSION_SLOTS_NOT_VERIFIED');
  if(format==='TEXT')return Object.freeze({ok:true,format:'TEXT',content:renderOneShellVisualText(frame),
   html:null,brand_attested:false,brand_state:'TEXT_FALLBACK_NO_SVG',
   native_avatar_attested:false,native_delivery_attested:false,authority:0});
  if(model.brand?.status!=='VERIFIED_HOST_SOURCE'||!H64.test(model.brand.asset_sha256||''))
   return stop('HOST_OFFICIAL_BRAND_UNVERIFIED');
  const html=renderOneShellVisualHtml(frame);
  const mark='data-brand-sha256="'+model.brand.asset_sha256+'"';
  const title='<strong>iKant · OneShell</strong>';
  const markPos=html.indexOf('class="ikant-brand-mark"');
  const titlePos=html.indexOf(title);
  if(glyphCount(html)!==1||!html.includes(mark)||markPos<0||titlePos<markPos||
     (html.match(/data-slot=/gu)||[]).length!==6||
     (html.match(/<section\b/gu)||[]).length!==1||
     html.includes('<button')||html.includes('<script>'))return stop('HOST_BRAND_EMISSION_NOT_VERIFIED');
  return Object.freeze({ok:true,format:'HTML',content:html,html,
   content_sha256:digest(html),brand_sha256:model.brand.asset_sha256,
   slot_sha256:model.visual_receipt_sha256,brand_attested:true,
   brand_state:'VERIFIED_HOST_SOURCE',native_avatar_attested:false,
   native_delivery_attested:false,authority:0});
 }catch{return stop('HOST_ORIGINAL_FRAME_OR_RENDERER_INVALID');}
}
