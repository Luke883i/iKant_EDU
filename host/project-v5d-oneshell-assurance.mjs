/** V5-D: read-only cross-medium assurance. Caller MUST first validate original frame.
 * This pure verifier neither authenticates caller JSON nor issues owner/provider receipts.
 */
import {createHash} from 'node:crypto';
export const ORDER=Object.freeze(['ESITO','A','B','PROVA','EDGE','NEXT']);
const digest=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const fail=edge=>Object.freeze({ok:false,edge,authority:0,active:false,provider_delivery_attested:false});
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const obj=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const escaped=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
 .replaceAll('"','&quot;').replaceAll("'",'&#39;');
const escapeMd=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
 .replace(/([\\*_{}\[\]()#+.!|>~-])/gu,'\\$1');
function fence(s){
 const tick=String.fromCharCode(96);
 const runs=[...s.matchAll(new RegExp(tick+'+','gu'))].map(x=>x[0].length);
 const mark=tick.repeat(Math.max(3,...runs.map(n=>n+1)));
 return mark+'text\n'+s+(s.endsWith('\n')?'':'\n')+mark;
}
function excerpt(s,n){const units=Array.from(s);return units.length<=n?s:units.slice(0,n).join('')+'…';}
function exactHtmlSlots(html,slots){
 if(typeof html!=='string'||html.length>300000)return false;
 // Static Host content only: no scripts, UI controls, host command links, event handlers or navigation.
 if(/<\s*\/?\s*(?:script|button|input|select|textarea|form|iframe|object|embed|a)\b|\bon[a-z]{2,}\s*=|\b(?:href|src|action|formaction|tabindex|contenteditable)\s*=/iu.test(html))return false;
 if((html.match(/<section\b/gu)||[]).length!==1||(html.match(/data-slot=/gu)||[]).length!==6)return false;
 for(const k of ORDER){
  const marker='<div class="ikant-row" data-slot="'+k+'">';
  const start=html.indexOf(marker);
  if(start<0||html.indexOf(marker,start+marker.length)!==-1)return false;
  const next=html.indexOf('<div class="ikant-row" data-slot="',start+marker.length);
  const expected='<div class="ikant-value">'+escaped(slots[k])+'</div>';
  const at=html.indexOf(expected,start+marker.length);
  if(at<0||(next!==-1&&at>=next))return false;
 }
 return true;
}
export function assessV5DProjection({frame,projection}={}){
 if(!obj(frame)||!obj(projection)||!obj(frame.slots)||!obj(projection.slots)||
    !obj(projection.view)||!obj(projection.render_plan)||!obj(projection.slot_sha256))return fail('V5D_ENVELOPE_INVALID');
 const plan=projection.render_plan;
 if(projection.ok!==true||projection.schema!=='ikant-oneshell-inchat-presentation/v1'||
    JSON.stringify(plan.order)!==JSON.stringify(ORDER)||
    plan.focus!=='A'||plan.voice_weight!==3||plan.host_weight!==1||
    plan.authority!==0||plan.active!==false||
    !obj(plan.compression)||!obj(plan.brand))return fail('V5D_RENDER_PLAN_DRIFT');
 if(frame.active!==false||frame.authority!==0||frame.native_ui_attested!==false||
    frame.provider_delivery_attested!==false||
    projection.authority!==0||projection.active!==false||
    projection.native_ui_attested!==false||projection.persistent_ui_attested!==false||
    projection.provider_delivery_attested!==false||plan.native_ui_attested!==false||
    plan.persistent_ui_attested!==false||plan.rich_ui_delivery_attested!==false||
    plan.brand.native_avatar_attested!==false)return fail('V5D_FALSE_PROVIDER_OR_ACTIVE_CLAIM');
 if(JSON.stringify(Object.keys(frame.slots))!==JSON.stringify(ORDER)||
    JSON.stringify(Object.keys(projection.slots))!==JSON.stringify(ORDER)||
    JSON.stringify(Object.keys(projection.view))!==JSON.stringify(ORDER))
  return fail('V5D_SIX_SLOT_ORDER_DRIFT');
 for(const k of ORDER){
  if(typeof frame.slots[k]!=='string'||projection.slots[k]!==frame.slots[k]||
     projection.slot_sha256[k]!==digest(frame.slots[k]))return fail('V5D_ORIGINAL_SLOT_BYTE_DRIFT:'+k);
 }
 if(frame.voice_origin!==projection.voice_origin||
    frame.original_voice_sha256!==projection.original_voice_sha256||
    (frame.voice_origin==='NO_VOICE'&&
      (frame.slots.A!=='NO_VOICE'||frame.original_voice_sha256!==null))||
    (frame.voice_origin==='HOST_BOUND_LOCAL'&&
      (frame.original_voice_sha256!==digest(frame.slots.A)||frame.slots.A==='NO_VOICE'))||
    !['NO_VOICE','HOST_BOUND_LOCAL'].includes(frame.voice_origin))
  return fail('V5D_VOICE_FRAME_ORIGIN_DRIFT');
 const report=projection.report;
 if(report!==null&&(!obj(report)||report.status!=='REOPENED_PRIVATE_FILE_NOT_CHAT_ATTACHMENT'||
    report.download_link_attested!==false||!/^[a-f0-9]{64}$/.test(report.sha256||'')||
    !Number.isSafeInteger(report.bytes)||report.bytes<1))return fail('V5D_REPORT_NOT_REOPENED');
 const compact=report!==null;
 if(plan.compression.A!=='NEVER'||plan.compression.EDGE!=='NEVER'||plan.compression.NEXT!=='NEVER'||
    plan.compression.B!==(compact?'LITERAL_EXCERPT_WITH_READBACK':'NONE')||
    plan.compression.PROVA!==(compact?'LITERAL_EXCERPT_WITH_READBACK':'NONE'))return fail('V5D_COMPRESSION_PROMISE_DRIFT');
 for(const k of ORDER){
  const expected=compact&&k==='B'?excerpt(frame.slots[k],168):
   compact&&k==='PROVA'?excerpt(frame.slots[k],200):frame.slots[k];
  if(projection.view[k]!==expected)return fail('V5D_VISIBLE_VALUE_NOT_DERIVED:'+k);
 }
 const brand=plan.brand.verified===true&&/^[a-f0-9]{64}$/.test(plan.brand.sha256||'');
 const mdExpected=[
  '# iKant · OneShell',
  brand?'*Logo SVG verificato: SHA-256 '+plan.brand.sha256+' (non prova di montaggio nel client).*':
   '*Logo non attestato: titolo testuale.*',
  '---','**ESITO** · '+escapeMd(frame.slots.ESITO),
  '## iKant · Superficie A',fence(frame.slots.A),
  '### Host · Superficie B',escapeMd(projection.view.B),
  '### PROVA',escapeMd(projection.view.PROVA),
  ...(report?['*Rapporto integrale riaperto SHA-256 '+report.sha256+
   '; il download richiede consegna effettiva dell’Host.*']:[]),
  '### EDGE',fence(frame.slots.EDGE),
  '### NEXT',fence(frame.slots.NEXT),'---'
 ].join('\n\n')+'\n';
 const md=projection.markdown_fallback_utf8;
 if(md!==mdExpected||digest(mdExpected)!==projection.markdown_sha256)
  return fail('V5D_MARKDOWN_FRAME_MISMATCH');
 const html=projection.verified_host_html_utf8;
 if(html===null){
  if(projection.verified_host_html_sha256!==null||projection.verified_host_brand_sha256!==null||
     plan.rich_ui_requested!==false||projection.required_host_action!=='DISPLAY_MARKDOWN')
   return fail('V5D_UNDELIVERED_RICH_UI_CLAIM');
 }else if(!exactHtmlSlots(html,frame.slots)||
    digest(html)!==projection.verified_host_html_sha256||
    plan.rich_ui_requested!==true||projection.required_host_action!=='RENDER_SUPPORTED_RICH_HOST_UI_OR_TEXT'||
    plan.brand.verified!==true||projection.verified_host_brand_sha256!==plan.brand.sha256)
   return fail('V5D_HTML_UNBOUND_OR_INTERACTIVE');
 if(plan.brand.source!=='assets/brand/ikant-light.svg'||
    plan.brand.inline_svg!=='HOST_HTML_ONLY_WITH_VERIFIED_BYTES'||
    plan.brand.in_chat!=='VERIFIED_HOST_ASSET_IF_CLIENT_SUPPORTS_ELSE_TEXT')
  return fail('V5D_BRAND_NATIVE_PROMOTION');
 return Object.freeze({ok:true,status:'HOST_GRAPHIC_TEXT_FRAME_EQUIVALENT_NOT_NATIVE',
  slots:6,byte_exact:true,host_only:true,local_visual_verified:true,
  owner_receipt_issued:false,provider_delivery_attested:false,
  provider_persistence_attested:false,global_dod_attested:false,
  human_review_attested:false,product_release:'PRODUCT_NO_GO',authority:0,active:false});
}
/** Controlled fixtures for host policy testing only. Never considered genuine owner frames. */
export function v5dFixture({html=false,large=false}={}){
 const values={ESITO:'EDU_SELECTED_NOT_RUNNING',A:'NO_VOICE',B:large?'Host osserva. '.repeat(30):'Host osserva.',
  PROVA:large?'git sha e readback. '.repeat(28):'Prova limitata.',EDGE:'PROVIDER_UNATTESTED',NEXT:'STOP'};
 const slots=Object.freeze(values),slot_sha256=Object.fromEntries(ORDER.map(k=>[k,digest(slots[k])]));
 const frame={slots,authority:0,active:false,native_ui_attested:false,provider_delivery_attested:false,
  voice_origin:'NO_VOICE',original_voice_sha256:null};
 const text=['# iKant · OneShell',
  html?'*Logo SVG verificato: SHA-256 '+'a'.repeat(64)+' (non prova di montaggio nel client).*':
   '*Logo non attestato: titolo testuale.*',
  '---','**ESITO** · '+escapeMd(slots.ESITO),
  '## iKant · Superficie A',fence(slots.A),
  '### Host · Superficie B',escapeMd(slots.B),'### PROVA',escapeMd(slots.PROVA),
  '### EDGE',fence(slots.EDGE),'### NEXT',fence(slots.NEXT),'---'].join('\n\n')+'\n';
 const markup=html?'<section class="ikant-oneshell" data-authority="0">'+ORDER.map(k=>
  '<div class="ikant-row" data-slot="'+k+'"><div class="ikant-value">'+escaped(slots[k])+'</div></div>').join('')+'</section>':null;
 const plan={order:[...ORDER],focus:'A',voice_weight:3,host_weight:1,authority:0,active:false,
  native_ui_attested:false,persistent_ui_attested:false,rich_ui_delivery_attested:false,
  rich_ui_requested:html,compression:{A:'NEVER',B:'NONE',PROVA:'NONE',EDGE:'NEVER',NEXT:'NEVER'},
  brand:{source:'assets/brand/ikant-light.svg',verified:html,sha256:html?'a'.repeat(64):null,
   inline_svg:'HOST_HTML_ONLY_WITH_VERIFIED_BYTES',in_chat:'VERIFIED_HOST_ASSET_IF_CLIENT_SUPPORTS_ELSE_TEXT',native_avatar_attested:false}};
 const projection={ok:true,schema:'ikant-oneshell-inchat-presentation/v1',slots:{...slots},view:{...slots},
  slot_sha256,voice_origin:'NO_VOICE',original_voice_sha256:null,
  markdown_fallback_utf8:text,markdown_sha256:digest(text),report:null,
  verified_host_html_utf8:markup,verified_host_html_sha256:markup===null?null:digest(markup),
  verified_host_brand_sha256:html?'a'.repeat(64):null,
  required_host_action:html?'RENDER_SUPPORTED_RICH_HOST_UI_OR_TEXT':'DISPLAY_MARKDOWN',
  render_plan:plan,authority:0,active:false,native_ui_attested:false,
  persistent_ui_attested:false,provider_delivery_attested:false};
 return {frame,projection};
}
