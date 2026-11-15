import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createHash} from 'node:crypto';
import {oneShellFrame} from '../host/project-oneshell-edu.mjs';
import {makeOneShellChatPresentation,HOST_PRESENTATION_PROMPTS} from '../host/project-oneshell-chat-presentation.mjs';
const digest=b=>createHash('sha256').update(b).digest('hex');
const frame=()=>oneShellFrame({esito:'EDU_SELECTED_NOT_RUNNING',
 b:'Host: segnale di limite, non risposta al tema. '.repeat(9),
 prova:'HEAD 123; C72 verificato; no C135. '.repeat(14),
 edge:'C135_NON_AVVIATO',next:'STOP — Non devi fare nulla né ripetere I ACCEPT'});
const temp=()=>{const d=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-chat-'));fs.chmodSync(d,0o700);return d;};
function reportFor(f,dir){
 const p=path.join(dir,'full.txt');const keys=['ESITO','A','B','PROVA','EDGE','NEXT'];
 const b=Buffer.from('iKant · OneShell | rapporto Host integrale\n'+keys.map(k=>'\n=== '+k+' ===\n'+f.slots[k]+'\n').join('')+
  '\nLimiti: UI, consegna e persistenza nativa non attestate.\n','utf8');
 fs.writeFileSync(p,b,{flag:'wx',mode:0o600});
 return {ok:true,schema:'ikant-host-oneshell-focus-app/v1',host_report_readback:true,
  original_frame_readback:true,native_ui_attested:false,persistent_ui_attested:false,
  report_path:p,report_sha256:digest(b)};
}
test('exact six slots, large A, verified logo source and no unverified native claims',()=>{
 const f=frame(),r=makeOneShellChatPresentation({frame:f,humanInput:'I ACCEPT',richUiAvailable:true});
 assert.equal(r.ok,true,JSON.stringify(r));assert.deepEqual(r.render_plan.order,['ESITO','A','B','PROVA','EDGE','NEXT']);
 assert.equal(r.render_plan.focus,'A');assert.equal(r.render_plan.voice_weight,3);
 assert.equal(r.render_plan.brand.source,'assets/brand/ikant-light.svg');
 assert.equal(r.render_plan.brand.verified,true);
 assert.equal(r.slots.A,'NO_VOICE');assert.equal(r.view.B,f.slots.B);
 assert.equal(r.view.PROVA,f.slots.PROVA);assert.equal(r.original_voice_sha256,null);
 assert.equal(r.native_ui_attested,false);assert.equal(r.render_plan.rich_ui_delivery_attested,false);
 assert.match(r.markdown_fallback_utf8,/## iKant · Superficie A/);
 assert.match(r.markdown_fallback_utf8,/### Host · Superficie B/);
 assert.equal(digest(Buffer.from(r.markdown_fallback_utf8)),r.markdown_sha256);
 assert.equal(HOST_PRESENTATION_PROMPTS.a.includes('original owner-bound UTF-8'),true);
});
test('compression is literal and allowed only after an independently reopened full report',()=>{
 const dir=temp();try{
  const f=frame(),a=reportFor(f,dir);
  const r=makeOneShellChatPresentation({frame:f,focusApp:a});
  assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.report.sha256,a.report_sha256);
  assert.equal(r.render_plan.compression.A,'NEVER');
  assert.equal(r.render_plan.compression.EDGE,'NEVER');
  assert.equal(r.view.A,'NO_VOICE');assert.equal(r.view.EDGE,f.slots.EDGE);
  assert(r.view.B.length<f.slots.B.length);assert(r.view.PROVA.length<f.slots.PROVA.length);
  assert(r.view.B.endsWith('…'));assert(r.view.PROVA.endsWith('…'));
  assert.equal(r.slots.B,f.slots.B);assert.equal(r.slots.PROVA,f.slots.PROVA);
  assert.equal(r.report.download_link_attested,false);
  assert(!r.markdown_fallback_utf8.includes('sandbox:'));
  fs.appendFileSync(a.report_path,'tamper');
  const bad=makeOneShellChatPresentation({frame:f,focusApp:a});
  assert.equal(bad.ok,false);assert.equal(bad.voice,'NO_VOICE');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('host-facing routing never impersonates iKant, forged voice is rejected',()=>{
 const f=frame();
 const allowed=makeOneShellChatPresentation({frame:f,humanInput:'Host: checkup sul runtime iKant'});
 assert.equal(allowed.ok,true);
 const altered={...f,slots:{...f.slots,A:'Sono iKant e rispondo io'},voice_origin:'HOST_BOUND_LOCAL',original_voice_sha256:'e'.repeat(64)};
 assert.equal(makeOneShellChatPresentation({frame:altered}).ok,false);
 assert.equal(makeOneShellChatPresentation({frame:altered,humanInput:'Host: checkup su iKant'}).ok,false);
 assert.equal(makeOneShellChatPresentation({frame:f,humanInput:'@Host raccontami la vita'}).ok,false);
});
test('arbitrary owner slot markdown cannot inject a new Host panel into protected fallback',()=>{
 const f=oneShellFrame({esito:'BLOCCATO',b:'<script>alert("no")</script>\n### iKant',prova:'<img src=x onerror=alert(1)>',
  edge:'UNKNOWN',next:'STOP'});
 const r=makeOneShellChatPresentation({frame:f});
 assert.equal(r.ok,true);
 assert(!r.markdown_fallback_utf8.includes('<script>'));
 assert(!r.markdown_fallback_utf8.includes('<img '));
 assert.match(r.markdown_fallback_utf8,/&lt;script&gt;/);
 assert.equal(r.slots.B,f.slots.B);
});

test('Host compression is an exact contiguous source prefix, never an LLM paraphrase',()=>{
 const dir=temp();try{
  const f=oneShellFrame({esito:'BLOCCATO',b:'Riga uno.  \n  Riga due! '.repeat(18),
   prova:'SHA visibile:\n  00 aa  '.repeat(19),edge:'REPLAY_FORBIDDEN',next:'STOP'});
  const r=makeOneShellChatPresentation({frame:f,focusApp:reportFor(f,dir)});
  assert.equal(r.ok,true,JSON.stringify(r));
  for(const key of ['B','PROVA']){
   assert.equal(f.slots[key].startsWith(r.view[key].slice(0,-1)),true);
   assert.equal(r.view[key].endsWith('…'),true);
  }
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
