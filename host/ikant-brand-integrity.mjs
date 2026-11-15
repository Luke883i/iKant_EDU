/** HOST-only visual integrity check. Never C87 or a native ChatGPT event. */
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
export const BRAND_SOURCE_HEAD='92cc620299e9ee365386782921036e57d2f6bd0e';
export const SIX_SLOTS=Object.freeze(['ESITO','A','B','PROVA','EDGE','NEXT']);
const sha=x=>createHash('sha256').update(x).digest('hex');
const pathOf=s=>(s.match(/<path\s+[^>]*d="([^"]+)"/u)||[])[1];
const vb=s=>{const x=s.match(/\bviewBox="([0-9. ]+)"/u)?.[1];return x?x.trim().split(/\s+/u).map(Number):null;};
const deny=e=>Object.freeze({ok:false,first_edge:e,authority:0,native_chatgpt_icon_attested:false,active:false});
export function validateIkantBrandBytes({manifest,light,dark,pluginLight,pluginDark,html,contract}={}){
 try{
  if(contract?.source_head!==BRAND_SOURCE_HEAD||contract?.authority!==0||contract?.provider_native_icon_attested!==false||contract?.active!==false)return deny('BRAND_UNTRUSTED_EPOCH');
  const i=JSON.parse(manifest)?.extensions?.['com.openai']?.interface;
  if(!i||i.logo!=='./assets/ikant-light.svg'||i.composerIcon!==i.logo||i.logoDark!=='./assets/ikant-dark-square.svg'||i.composerIconDark!==i.logoDark)return deny('BRAND_MANIFEST_PATHS');
  if(pluginLight!==light)return deny('BRAND_LIGHT_NOT_SOURCE_IDENTICAL');
  if(pluginDark!==dark.replace('viewBox="0 0 326 314"','viewBox="0 0 326 326"'))return deny('BRAND_DARK_GEOMETRY_DRIFT');
  for(const x of [pluginLight,pluginDark]){
   if(Buffer.byteLength(x)>5*1024*1024||!x.startsWith('<svg ')||/<script|<foreignObject|(?:href|src)=["'](?:https?:|data:)/iu.test(x))return deny('BRAND_UNSAFE_SVG');
   const v=vb(x);if(!v||v.length!==4||v.some(n=>!Number.isFinite(n))||v[2]!==v[3]||v[2]<48||!pathOf(x))return deny('BRAND_NONSQUARE_ICON');
  }
  const head=html.match(/<header class="ikant-brand-header">([\s\S]*?)<\/header>/u)?.[1];
  const appPath=head?.match(/<svg\s+id="ikant-owned-brand"[^>]*><path\s+[^>]*d="([^"]+)"/u)?.[1];
  if(!appPath||appPath!==pathOf(light)||!head.includes('aria-label="iKant, identità visiva della superficie HOST"'))return deny('BRAND_HOST_ICON_MISSING_OR_TAMPERED');
  if(!html.includes('.ikant-brand-header{display:flex')||html.includes('#ikant-owned-brand{display:none'))return deny('BRAND_HOST_HIDDEN');
  const slots=[...html.matchAll(/<section\s+data-slot="([A-Z]+)"/gu)].map(z=>z[1]);
  if(JSON.stringify(slots)!==JSON.stringify(SIX_SLOTS))return deny('BRAND_SIX_SLOTS_CHANGED');
  if(!html.includes('<div id="voice" aria-live="polite">NO_VOICE</div>'))return deny('BRAND_C87_FALLBACK_CHANGED');
  return Object.freeze({ok:true,asset_sha256:{light:sha(pluginLight),dark:sha(pluginDark)},host_logo_in_source:true,native_chatgpt_icon_attested:false,active:false,authority:0});
 }catch{return deny('BRAND_BYTES_INVALID');}
}
export function verifyIkantBrandCheckout(root){
 const get=p=>readFileSync(join(root,p),'utf8');
 return validateIkantBrandBytes({contract:JSON.parse(get('contracts/host-ikant-brand-projection-v1.json')),manifest:get('plugins/ikant-le-session-chat/plugin.json'),light:get('assets/brand/ikant-light.svg'),dark:get('assets/brand/ikant-dark.svg'),pluginLight:get('plugins/ikant-le-session-chat/assets/ikant-light.svg'),pluginDark:get('plugins/ikant-le-session-chat/assets/ikant-dark-square.svg'),html:get('plugins/ikant-le-session-chat/server/public/ikant-le-app.html')});
}
