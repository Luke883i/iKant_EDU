/** E12: read-only, source-verified OneShell focus app.
 * Original owner frame in; verified HTML + full UTF-8 report out.
 * Never a native ChatGPT widget, model, consent or C87 writer.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {renderOneShell} from './project-oneshell-edu.mjs';
import {emitVerifiedHostOneShell} from './project-oneshell-emission.mjs';
import {makeOneShellCompactEvidence,verifyOneShellCompactEvidence} from './project-oneshell-compact.mjs';
const KEYS=['ESITO','A','B','PROVA','EDGE','NEXT'];
const H64=/^[0-9a-f]{64}$/u, NAME=/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/u;
const hash=b=>createHash('sha256').update(b).digest('hex');
const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const stop=edge=>Object.freeze({ok:false,edge,voice:'NO_VOICE',authority:0,active:false,native_ui_attested:false,persistent_ui_attested:false});
const css=[
'.ikant-oneshell.ikant-focus{display:grid;grid-template-columns:minmax(0,2.15fr) minmax(220px,.9fr);gap:12px;max-width:1140px;margin:auto;background:Canvas;color:CanvasText}',
'.ikant-focus .ikant-head,.ikant-focus .ikant-divider{grid-column:1/-1}',
'.ikant-focus .ikant-row{display:block;min-width:0;border:1px solid #d7d7dc;border-radius:12px;padding:12px;background:Canvas;color:CanvasText}',
'.ikant-focus .ikant-row[data-slot="A"]{grid-column:1;grid-row:3 / span 6;min-height:380px;padding:clamp(16px,3vw,28px);border-width:2px}',
'.ikant-focus .ikant-row[data-slot="A"] .ikant-value{font-family:ui-serif,Georgia,serif;font-size:clamp(17px,2vw,22px);line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}',
'.ikant-focus .ikant-row[data-slot="A"] .ikant-name strong{font-size:22px}',
'.ikant-focus .ikant-row[data-slot="ESITO"]{grid-column:2;grid-row:3}',
'.ikant-focus .ikant-row[data-slot="B"]{grid-column:2;grid-row:4}',
'.ikant-focus .ikant-row[data-slot="PROVA"]{grid-column:2;grid-row:5}',
'.ikant-focus .ikant-row[data-slot="EDGE"]{grid-column:2;grid-row:6}',
'.ikant-focus .ikant-row[data-slot="NEXT"]{grid-column:2;grid-row:7}',
'.ikant-focus .ikant-condensed{font-size:13px;line-height:1.5;overflow-wrap:anywhere}',
'.ikant-focus details{font-size:12px;margin-top:8px}.ikant-focus summary{cursor:pointer;font-weight:600}',
'.ikant-focus pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:240px;overflow:auto;font:12px/1.5 ui-monospace,monospace}',
'.ikant-focus .ikant-download{display:inline-block;font-size:12px;margin-top:8px;text-decoration:underline}',
'.ikant-focus .ikant-focus-readback{font-size:11px;opacity:.75;overflow-wrap:anywhere}',
'@media(max-width:760px){.ikant-oneshell.ikant-focus{display:flex;flex-direction:column}.ikant-focus .ikant-row[data-slot="A"]{order:1;min-height:240px}.ikant-focus .ikant-row[data-slot="ESITO"]{order:2}.ikant-focus .ikant-row[data-slot="B"]{order:3}.ikant-focus .ikant-row[data-slot="PROVA"]{order:4}.ikant-focus .ikant-row[data-slot="EDGE"]{order:5}.ikant-focus .ikant-row[data-slot="NEXT"]{order:6}.ikant-focus .ikant-divider{order:7}.ikant-focus .ikant-head{order:0}}'
].join('');
function safeDir(dir){
 if(typeof dir!=='string'||!path.isAbsolute(dir)||!fs.existsSync(dir))return false;
 const s=fs.lstatSync(dir);
 return s.isDirectory()&&!s.isSymbolicLink()&&(s.mode&0o077)===0&&fs.realpathSync(dir)===path.resolve(dir);
}
function readAttachment(a,dir){
 if(!a||!NAME.test(a.name||'')||!H64.test(a.sha256||'')||typeof a.path!=='string')throw Error('FOCUS_ATTACHMENT_DESCRIPTOR_INVALID');
 const p=path.resolve(a.path);if(path.dirname(p)!==path.resolve(dir))throw Error('FOCUS_ATTACHMENT_OUTSIDE_ROOT');
 const st=fs.lstatSync(p);if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||st.size>262144||(st.mode&0o077)!==0)throw Error('FOCUS_ATTACHMENT_UNSAFE');
 const b=fs.readFileSync(p);if(hash(b)!==a.sha256)throw Error('FOCUS_ATTACHMENT_HASH_MISMATCH');return b;
}
function valueReplace(html,key,original,value){
 const marker='<div class="ikant-row" data-slot="'+key+'">',start=html.indexOf(marker);
 const needle='<div class="ikant-value">'+esc(original)+'</div>',at=html.indexOf(needle,start),next=html.indexOf('<div class="ikant-row" data-slot="',start+marker.length);
 if(start<0||at<0||(next>=0&&at>=next)||html.indexOf(marker,start+marker.length)>=0)throw Error('FOCUS_SLOT_NOT_UNIQUE');
 return html.slice(0,at)+'<div class="ikant-value">'+value+'</div>'+html.slice(at+needle.length);
}
const brief=(x,max=180)=>{const t=x.replace(/\s+/gu,' ').trim();if(t.length<=max)return t;const n=t.slice(0,max).lastIndexOf(' ');return t.slice(0,n>max/2?n:max)+'…';};
const link=(n,b,type='text/plain')=>'<a class="ikant-download" download="'+esc(n)+'" href="data:'+type+';base64,'+b.toString('base64')+'">Scarica '+esc(n)+'</a>';
export function materializeOneShellFocusApp({frame,outputDirectory,reportName='oneshell-rapporto',attachments=[]}={}){
 try{
  renderOneShell(frame); // Validates original no-voice / owner WeakSet.
  if(!safeDir(outputDirectory)||!NAME.test(reportName)||!Array.isArray(attachments)||attachments.length>6)
   return stop('FOCUS_OUTPUT_OR_ARTIFACT_ARGS_INVALID');
  const verified=emitVerifiedHostOneShell(frame,{format:'HTML'});
  if(verified.ok!==true)return stop(verified.first_edge||'FOCUS_VERIFIED_ORIGINAL_HTML_REQUIRED');
  const compact=makeOneShellCompactEvidence(frame);
  if(verifyOneShellCompactEvidence(compact,{frame}).ok!==true)return stop('FOCUS_ORIGINAL_SLOT_EVIDENCE_MISSING');
  const txt=path.join(outputDirectory,reportName+'.txt'),htmlFile=path.join(outputDirectory,reportName+'.html');
  if(fs.existsSync(txt)||fs.existsSync(htmlFile))return stop('FOCUS_DESTINATION_EXISTS_NO_REPLAY');
  const seen=new Set(),extra=[];
  for(const a of attachments){
   if(seen.has(a?.name)||a?.name===reportName+'.txt'||a?.name===reportName+'.html')return stop('FOCUS_ATTACHMENT_NAME_REUSE');
   seen.add(a?.name);extra.push({name:a.name,sha256:a.sha256,bytes:readAttachment(a,outputDirectory)});
  }
  const full=Buffer.from('iKant · OneShell | rapporto Host integrale\n'+KEYS.map(k=>'\n=== '+k+' ===\n'+frame.slots[k]+'\n').join('')+'\nLimiti: UI, consegna e persistenza nativa non attestate.\n','utf8');
  if(full.length>196608)return stop('FOCUS_REPORT_TOO_LARGE');
  fs.writeFileSync(txt,full,{flag:'wx',mode:0o600});if(!fs.readFileSync(txt).equals(full))return stop('FOCUS_REPORT_READBACK_FAILED');
  let html=verified.content.replace('<style>','<style>'+css).replace('<section class="ikant-oneshell"','<section class="ikant-oneshell ikant-focus" data-view="HOST_FOCUS_NOT_NATIVE"');
  const labels={ESITO:'Stato completo',B:'Osservazione Host integrale',PROVA:'Riscontri originali',EDGE:'Primo limite completo',NEXT:'Prossima azione completa'};
  for(const key of ['ESITO','B','PROVA','EDGE','NEXT']){
   const val=frame.slots[key];
   let content='<div class="ikant-condensed">'+esc(key==='PROVA'?'Riscontri verificabili e rapporto integrale.':brief(val,key==='NEXT'?190:160))+'</div>'+
    '<details><summary>'+labels[key]+'</summary><pre>'+esc(val)+'</pre></details>';
   if(key==='PROVA')content+='<div class="ikant-focus-readback">Rapporto SHA-256 '+hash(full)+'</div>'+link(reportName+'.txt',full)+extra.map(x=>link(x.name,x.bytes,'application/octet-stream')).join(' ');
   html=valueReplace(html,key,val,content);
  }
  if((html.match(/<div class="ikant-row" data-slot=/gu)||[]).length!==6||
     (html.match(/class="ikant-divider"/gu)||[]).length!==2||
     (html.match(/class="ikant-brand-mark"/gu)||[]).length!==1||
     html.includes('<script')||html.includes('<button'))return stop('FOCUS_LAYOUT_INVARIANT_FAILED');
  const output=Buffer.from('<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>iKant · OneShell</title><body>'+html+'</body></html>','utf8');
  fs.writeFileSync(htmlFile,output,{flag:'wx',mode:0o600});if(!fs.readFileSync(htmlFile).equals(output))return stop('FOCUS_HTML_READBACK_FAILED');
  return Object.freeze({ok:true,schema:'ikant-host-oneshell-focus-app/v1',format:'SELF_CONTAINED_HTML',focus_slot:'A',machine_order:[...KEYS],voice_origin:frame.voice_origin,original_voice_sha256:frame.original_voice_sha256,report_path:txt,report_sha256:hash(full),app_path:htmlFile,app_sha256:hash(output),attachments:extra.map(x=>({name:x.name,sha256:x.sha256,bytes:x.bytes.length,download_embedded:true})),original_slot_sha256:compact.evidence.original_value_sha256,original_frame_readback:true,host_report_readback:true,host_app_readback:true,native_ui_attested:false,persistent_ui_attested:false,provider_delivery_attested:false,authority:0,active:false});
 }catch{return stop('FOCUS_OWNER_OR_FILE_READBACK_UNKNOWN');}
}
