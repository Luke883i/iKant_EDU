/** HOST-only OneShell graphical model; no new voice or native UI authority. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {renderOneShell} from './project-oneshell-edu.mjs';
const spec=JSON.parse(fs.readFileSync(new URL('../contracts/project-oneshell-visual-v2.json',import.meta.url),'utf8'));
const KEYS=Object.freeze(['ESITO','A','B','PROVA','EDGE','NEXT']);
const hash=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const BRAND_SOURCE='assets/brand/ikant-light.svg';
const BRAND_PLUGIN_SOURCE='plugins/ikant-le-session-chat/assets/ikant-light.svg';
const VERIFIED_BRAND_STATUS='VERIFIED_HOST_SOURCE';
const UNAVAILABLE_BRAND_STATUS='TEXT_ONLY_SOURCE_NOT_VERIFIED';
/** Read-only provenance. No network fetch, implicit native avatar or platform registration. */
function sourceBrand(){
 try{
  if(spec.brand?.source!==BRAND_SOURCE||spec.brand?.plugin_source!==BRAND_PLUGIN_SOURCE||
      spec.brand?.placement!=='HEADER_LEFT_OF_TITLE'||spec.brand?.native_registered!==false||
      spec.brand?.asset_sha256!=='b6dc3f6e22149ef9f96348ce8e677af034cd2377f26450af18d51bc5c43ae633')
   return Object.freeze({ok:false,reason:'BRAND_CONTRACT_UNVERIFIED'});
  const bytes=fs.readFileSync(new URL('../assets/brand/ikant-light.svg',import.meta.url));
  const plugin=fs.readFileSync(new URL('../plugins/ikant-le-session-chat/assets/ikant-light.svg',import.meta.url));
  const svg=bytes.toString('utf8');
  if(bytes.length>65536||!bytes.equals(plugin)||hash(svg)!==spec.brand.asset_sha256||
     !/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 1024 1024"/u.test(svg)||
     !/<path\s+fill="#171717"\s+fill-rule="evenodd"\s+d="[A-Za-z0-9 ,.-]+"\s*\/>\s*<\/svg>\s*$/u.test(svg)||
     /<script|<foreignObject|<image|<use\b|<style|<animate|<iframe|(?:href|src)\s*=/iu.test(svg))
   return Object.freeze({ok:false,reason:'BRAND_SOURCE_BYTES_UNVERIFIED'});
  return Object.freeze({ok:true,svg,sha256:hash(svg)});
 }catch{return Object.freeze({ok:false,reason:'BRAND_SOURCE_UNAVAILABLE'});}
}
/** Badge comes only from original validated machine slots. No EXIT click affordance. */
function stateFromOriginal(frame){
 const {ESITO,A,EDGE,NEXT}=frame.slots;
 if(NEXT==='STOP'||ESITO==='BLOCCATO')return 'BLOCCATO';
 if(frame.voice_origin==='HOST_BOUND_LOCAL'&&A!=='NO_VOICE')return 'VOCE_VERIFICATA';
 if(NEXT==='AWAIT_HUMAN_INPUT')return 'PRONTO';
 if(NEXT==='AWAIT_I_ACCEPT')return 'ORIENTAMENTO';
 if(NEXT==='AWAIT_EDU')return 'CONSENSO';
 if(NEXT==='UPLOAD_PINNED_SOURCE_ZIP')return 'ATTESA_SORGENTI';
 if(NEXT.includes('AWAIT')||NEXT.includes('VERIFY')||NEXT.includes('MATERIALIZATION')||NEXT.includes('START_C135'))return 'ATTESA';
 return 'FASE_SCONOSCIUTA';
}
export function createOneShellVisualModel(frame){
 renderOneShell(frame);
 const brand=sourceBrand();
 const slots=KEYS.map(key=>Object.freeze({key,primary:spec.human_display[key].primary,
  secondary:spec.human_display[key].secondary||null,
  strong:spec.human_display[key].primary_weight===700,
  value:frame.slots[key],value_sha256:hash(frame.slots[key])}));
 return Object.freeze({schema:spec.schema,authority:0,header:spec.layout.header,
  brand:Object.freeze({status:brand.ok?VERIFIED_BRAND_STATUS:UNAVAILABLE_BRAND_STATUS,
   asset_sha256:brand.ok?brand.sha256:null,source:BRAND_SOURCE,
   placement:'HEADER_LEFT_OF_TITLE',owned_by:'HOST_CONTENT',native_registered:false,
   provider_avatar_attested:false}),
  layout:Object.freeze({...spec.layout}),machine_order:Object.freeze([...KEYS]),
  slots:Object.freeze(slots),status:Object.freeze({label:stateFromOriginal(frame),
   interactive:false,source:'VALIDATED_OWNER_FRAME_ONLY'}),
  visual_receipt_sha256:hash(JSON.stringify(slots)),native_ui_attested:false,
  provider_delivery_attested:false,semantic_owner:'ORIGINAL_ONESHELL_FRAME'});
}
export function verifyOneShellVisualEquivalence(model,frame){
 renderOneShell(frame);
 if(model?.schema!==spec.schema||model.native_ui_attested!==false||
  JSON.stringify(model.machine_order)!==JSON.stringify(KEYS)||
  model.slots?.length!==6||model.layout?.container!=='SINGLE_UNBROKEN_BORDER_ALL_SIX_SLOTS'||
  model.status?.label!==stateFromOriginal(frame)||model.status?.interactive!==false||
  model.status?.source!=='VALIDATED_OWNER_FRAME_ONLY')
  throw Error('ONESHELL_VISUAL_CONTRACT_MISMATCH');
 const originalBrand=sourceBrand();
 if(model.brand?.source!==BRAND_SOURCE||model.brand?.placement!=='HEADER_LEFT_OF_TITLE'||
   model.brand?.owned_by!=='HOST_CONTENT'||model.brand?.native_registered!==false||
   model.brand?.provider_avatar_attested!==false||
   model.brand?.status!==(originalBrand.ok?VERIFIED_BRAND_STATUS:UNAVAILABLE_BRAND_STATUS)||
   model.brand?.asset_sha256!==(originalBrand.ok?originalBrand.sha256:null))
   throw Error('ONESHELL_BRAND_PROVENANCE_MISMATCH');
 for(let i=0;i<KEYS.length;i++){
  const key=KEYS[i],s=model.slots[i];
  if(s.key!==key||s.primary!==spec.human_display[key].primary||
    s.secondary!==(spec.human_display[key].secondary||null)||
    s.value!==frame.slots[key]||s.value_sha256!==hash(frame.slots[key]))
   throw Error('ONESHELL_VISUAL_VALUE_NOT_BYTE_EXACT');
 }
 if(hash(JSON.stringify(model.slots))!==model.visual_receipt_sha256)
  throw Error('ONESHELL_VISUAL_RECEIPT_MISMATCH');
 return Object.freeze({ok:true,machine_slots:6,byte_exact:true,one_enclosure:true,
  native_ui_attested:false,persistent_ui_attested:false,
  brand_source_verified:originalBrand.ok,provider_registered_app_attested:false});
}
/** One framed fallback; values unmodified in model. Long lines wrap VISUALLY only. */
export function renderOneShellVisualText(frame){
 const model=createOneShellVisualModel(frame);
 const width=58,bodyWidth=width-2,rule='─'.repeat(width);
 const rows=['╭'+rule+'╮'];
 const line=s=>{
  const chars=Array.from(s);
  if(!chars.length){rows.push('│'+' '.repeat(width)+'│');return;}
  while(chars.length){const part=chars.splice(0,bodyWidth).join('');
   rows.push('│ '+part+' '.repeat(bodyWidth-Array.from(part).length)+' │');}
 };
 line('iKant · OneShell | '+model.status.label);rows.push('├'+rule+'┤');
 for(const [index,s] of model.slots.entries()){
  if(index===3)rows.push('├'+rule+'┤');
  const label=s.secondary?s.primary+' ('+s.secondary+')':s.primary;
  const values=s.value.split('\n');line(label+' | '+values[0]);
  for(let i=1;i<values.length;i++)line('  '+values[i]);
 }
 rows.push('╰'+rule+'╯');
 return rows.join('\n');
}

/** Self-contained rich HOST markup. No script/action dispatch or native UI claim. */
export function renderOneShellVisualHtml(frame){
 const m=createOneShellVisualModel(frame);
 const esc=x=>x.replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
 const css='.ikant-oneshell{box-sizing:border-box;border:1px solid #d7d7dc;border-radius:16px;padding:12px;font-family:system-ui,sans-serif;color:inherit;max-width:100%}'
  +'.ikant-oneshell *{box-sizing:border-box}.ikant-head{display:flex;align-items:center;justify-content:space-between;gap:12px}'
  +'.ikant-head strong{font-size:16px}.ikant-brand-lockup{display:inline-flex;align-items:center;gap:8px;min-width:0}'
  +'.ikant-brand-mark{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;flex:0 0 28px;color:inherit}'
  +'.ikant-brand-mark svg{display:block;width:100%;height:100%}.ikant-brand-mark path{fill:currentColor}'
  +'.ikant-status{border:1px solid #d7d7dc;border-radius:8px;background:#f2f2f3;color:#50515b;font-size:12px;padding:5px 9px;font-weight:600}'
  +'.ikant-row{display:grid;grid-template-columns:112px minmax(0,1fr);gap:12px;padding:7px 0;align-items:start}'
  +'.ikant-name{font-size:12px;color:#686975}.ikant-name strong{font-size:16px;display:block;font-weight:700}'
  +'.ikant-name small{display:block;font-size:11px}.ikant-value{min-width:0;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px}'
  +'.ikant-divider{border:0;border-top:1px solid #e6e6eb;margin:9px 0}'
  +'@media(max-width:480px){.ikant-row{grid-template-columns:minmax(0,1fr);gap:3px}.ikant-head{flex-wrap:wrap}}';
 const brand=sourceBrand();
 const mark=brand.ok?'<span class="ikant-brand-mark" aria-hidden="true" data-brand-sha256="'+brand.sha256+'">'+brand.svg+'</span>':'';
 const rows=m.slots.map(s=>'<div class="ikant-row" data-slot="'+esc(s.key)+'"><div class="ikant-name">'
  +(s.strong?'<strong>'+esc(s.primary)+'</strong>':esc(s.primary))
  +(s.secondary?'<small>'+esc(s.secondary)+'</small>':'')
  +'</div><div class="ikant-value">'+esc(s.value)+'</div></div>');
 return '<style>'+css+'</style><section class="ikant-oneshell" aria-label="iKant OneShell" data-authority="0">'
  +'<header class="ikant-head"><span class="ikant-brand-lockup">'+mark+'<strong>iKant · OneShell</strong></span>'
  +'<span class="ikant-status" aria-label="Stato iKant">'+esc(m.status.label)+'</span></header>'
  +'<hr class="ikant-divider">'+rows.slice(0,3).join('')
  +'<hr class="ikant-divider">'+rows.slice(3).join('')+'</section>';
}
