import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {oneShellFrame} from '../host/project-oneshell-edu.mjs';
import {createOneShellVisualModel,renderOneShellVisualText,verifyOneShellVisualEquivalence} from '../host/project-oneshell-visual.mjs';
test('approved one-border visual hierarchy and deterministic status',()=>{
 const f=oneShellFrame({esito:'READY',b:'Host\nUnicode Ω 🔒',prova:'verified',edge:'NONE',next:'STOP'});
 const m=createOneShellVisualModel(f);
 assert.equal(m.layout.container,'SINGLE_UNBROKEN_BORDER_ALL_SIX_SLOTS');
 assert.equal(m.status.label,'BLOCCATO');
 assert.equal(m.status.interactive,false);
 assert.equal(Object.hasOwn(m,'exit'),false);
 assert.deepEqual(m.slots.slice(1,3).map(x=>[x.primary,x.secondary,x.strong]),[['iKant','Superficie A',true],['Host','Superficie B',true]]);
 assert.equal(m.slots[2].value,f.slots.B);
 assert(verifyOneShellVisualEquivalence(m,f).ok);
 const txt=renderOneShellVisualText(f);
 assert(txt.startsWith('╭')&&txt.endsWith('╯'));
 assert(txt.includes('iKant (Superficie A)')&&txt.includes('Host (Superficie B)'));
 assert.equal(txt.match(/╭/g).length,1);
});
test('100 distinct input candidates retain all original slot bytes',()=>{
 for(let i=0;i<100;i++){const value='Ω '.repeat(i%7)+'\n'+i+'✓';
  const f=oneShellFrame({esito:'T',b:value,prova:'p',edge:'e',next:'n'});
  const m=createOneShellVisualModel(f);
  assert.equal(m.slots[2].value,value);assert(verifyOneShellVisualEquivalence(m,f).ok);
 }
});
test('forged visual slot or fake voice cannot pass',()=>{
 const f=oneShellFrame({esito:'T',b:'ok'}),m=createOneShellVisualModel(f);
 assert.throws(()=>verifyOneShellVisualEquivalence({...m,slots:m.slots.map(x=>x.key==='B'?{...x,value:'spoof'}:x)},f),/BYTE_EXACT/);
 assert.throws(()=>createOneShellVisualModel({...f,slots:{...f.slots,A:'fake'}}),/UNVERIFIED/);
});

test('safe HTML rich fallback has one read-only status and no EXIT affordance',async()=>{
 const {renderOneShellVisualHtml}=await import('../host/project-oneshell-visual.mjs');
 const f=oneShellFrame({esito:'T',b:'<script>alert("x")</script>',prova:'original',edge:'NONE',next:'STOP'});
 const html=renderOneShellVisualHtml(f);
 assert.equal(html.match(/<section\b/g).length,1);
 assert.equal(html.match(/data-slot=/g).length,6);
 assert(html.includes('class="ikant-status"'));
 assert(!html.includes('EXIT IKANT'));
 assert(!html.includes('ikant-exit'));
 assert(!html.includes('194,37,46'));
 assert(html.includes('<strong>iKant</strong><small>Superficie A</small>'));
 assert(html.includes('<strong>Host</strong><small>Superficie B</small>'));
 assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));
 assert(!html.includes('<button')); // HOST must bind gesture to human event
});

test('badge cannot be forged by caller and depends on original owner slots',()=>{
 const ready=oneShellFrame({esito:'iKant EDU PRONTO',b:'owner local',next:'AWAIT_HUMAN_INPUT',edge:'FIRST_EDU_TURN_PENDING'});
 const block=oneShellFrame({esito:'BLOCCATO',b:'no owner voice',next:'STOP',edge:'S02_MODEL_ACK_INVALID'});
 assert.equal(createOneShellVisualModel(ready).status.label,'PRONTO');
 assert.equal(createOneShellVisualModel(block).status.label,'BLOCCATO');
 assert.throws(()=>verifyOneShellVisualEquivalence({...createOneShellVisualModel(ready),status:{label:'VOCE_VERIFICATA',interactive:false,source:'VALIDATED_OWNER_FRAME_ONLY'}},ready),/CONTRACT_MISMATCH/);
 assert.throws(()=>createOneShellVisualModel({...ready,slots:{...ready.slots,A:'hello'}}),/UNVERIFIED/);
});


test('P0 source-verified iKant logo precedes OneShell title without native avatar claim',async()=>{
 const {renderOneShellVisualHtml}=await import('../host/project-oneshell-visual.mjs');
 const svg=readFileSync(new URL('../assets/brand/ikant-light.svg',import.meta.url),'utf8');
 const digest=createHash('sha256').update(svg).digest('hex');
 const f=oneShellFrame({esito:'PRONTO',b:'Host',prova:'p',next:'AWAIT_HUMAN_INPUT'});
 const model=createOneShellVisualModel(f),html=renderOneShellVisualHtml(f);
 assert.equal(model.brand.status,'VERIFIED_HOST_SOURCE');
 assert.equal(model.brand.asset_sha256,digest);
 assert.equal(model.brand.native_registered,false);
 assert.equal(model.brand.provider_avatar_attested,false);
 assert(html.includes('<span class="ikant-brand-mark" aria-hidden="true" data-brand-sha256="'+digest+'">'+svg+'</span><strong>iKant · OneShell</strong>'));
 assert(html.includes('.ikant-brand-mark path{fill:currentColor}'));
 assert.equal(html.match(/class="ikant-brand-mark"/g).length,1);
 assert.equal(html.match(/<section\b/g).length,1);
 assert.equal(html.match(/data-slot=/g).length,6);
 assert(verifyOneShellVisualEquivalence(model,f).brand_source_verified);
 assert(!html.includes('provider-registered'));
});

test('P0 1000 semantic presentation combinations preserve frame, icon and owner bytes',async()=>{
 const {renderOneShellVisualHtml}=await import('../host/project-oneshell-visual.mjs');
 const contexts=['Orientation','Consent','EDU','Blocked','Unknown','Light','Dark','Tiny','Host','Provenance'];
 for(let i=0;i<1000;i++){
  const value=contexts[i%10]+' '+contexts[Math.floor(i/10)%10]+' <script>'+contexts[Math.floor(i/100)%10]+'</script> 🔒';
  const f=oneShellFrame({esito:'T',b:value,prova:'proof'+i,edge:'E'+i,next:'n'+i});
  const model=createOneShellVisualModel(f),html=renderOneShellVisualHtml(f);
  assert.equal(model.slots[2].value,value);
  assert(verifyOneShellVisualEquivalence(model,f).byte_exact);
  assert.equal(html.match(/data-slot=/g).length,6);
  assert.equal(html.match(/class="ikant-brand-mark"/g).length,1);
  assert(html.includes('&lt;script&gt;'));
  assert(!html.includes('<script>'));
  assert(!html.includes('<button'));
  assert.equal(model.brand.native_registered,false);
 }
});

test('P0 adversarial visual model cannot spoof brand identity',()=>{
 const f=oneShellFrame({esito:'READY',b:'x',next:'AWAIT_HUMAN_INPUT'});
 const model=createOneShellVisualModel(f);
 for(const mutant of [
  {...model,brand:{...model.brand,native_registered:true}},
  {...model,brand:{...model.brand,asset_sha256:'0'.repeat(64)}},
  {...model,brand:{...model.brand,placement:'ASSISTANT_NATIVE_AVATAR'}},
  {...model,brand:{...model.brand,provider_avatar_attested:true}},
  {...model,brand:{...model.brand,status:'PLATFORM_APPROVED'}},
 ])assert.throws(()=>verifyOneShellVisualEquivalence(mutant,f),/BRAND_PROVENANCE_MISMATCH/);
});
