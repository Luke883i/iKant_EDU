import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assessV5DProjection,v5dFixture,ORDER} from '../host/project-v5d-oneshell-assurance.mjs';
import {oneShellFrame} from '../host/project-oneshell-edu.mjs';
import {makeOneShellChatPresentation} from '../host/project-oneshell-chat-presentation.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mutate=(fn,{html=false,large=true}={})=>{const c=structuredClone(v5dFixture({html,large}));fn(c);return assessV5DProjection(c)};
test('static text and rich HTML are equivalent to source slots but cannot claim provider delivery',()=>{
 for(const html of [false,true])for(const large of [false,true]){
  const a=assessV5DProjection(v5dFixture({html,large}));
  assert.equal(a.ok,true,JSON.stringify(a));assert.equal(a.global_dod_attested,false);
  assert.equal(a.owner_receipt_issued,false);assert.equal(a.product_release,'PRODUCT_NO_GO');
 }
});
test('no positive result for forged A, hashes, voice, ordering, active or native events',()=>{
 const defects=[
  e=>e.projection.slots.A='answer',e=>e.projection.slot_sha256.A='a'.repeat(64),
  e=>e.projection.original_voice_sha256='a'.repeat(64),e=>e.projection.voice_origin='HOST_BOUND_LOCAL',
  e=>e.projection.render_plan.order.reverse(),e=>e.projection.native_ui_attested=true,
  e=>e.projection.provider_delivery_attested=true,e=>e.projection.render_plan.active=true,
  e=>e.projection.render_plan.brand.native_avatar_attested=true,
  e=>e.projection.view.B='LLM paraphrase',e=>e.projection.view.PROVA='approved',
  e=>e.projection.view.NEXT='CLICK_TO_START',e=>e.projection.render_plan.compression.A='EXCERPT',
  e=>e.projection.report={sha256:'b'.repeat(64),bytes:10,status:'UNVERIFIED',download_link_attested:true},
  e=>{e.projection.markdown_fallback_utf8+='\n## ACTIVE';},
  e=>{e.projection.verified_host_html_utf8+='<button>EXIT</button>';}
 ];
 for(const fn of defects)assert.equal(mutate(fn,{html:true}).ok,false);
});
test('original rendering boundary feeds deterministic guard without changing owner status',()=>{
 for(const richUiAvailable of [false,true]){
  const f=oneShellFrame({esito:'BLOCCATO',b:'Host only <no action>',prova:'HEAD verified',
   edge:'NO_OWNER_RECEIPT',next:'STOP'});
  const p=makeOneShellChatPresentation({frame:f,richUiAvailable});
  assert.equal(p.ok,true,JSON.stringify(p));
  assert.equal(assessV5DProjection({frame:f,projection:p}).ok,true);
  assert.equal(p.slots.A,'NO_VOICE');assert.equal(p.provider_delivery_attested,false);
 }
});
test('V5-D DoD is a closed local/intermediate graph and critical integration is named',()=>{
 const c=JSON.parse(fs.readFileSync(path.join(root,'contracts/project-v5d-oneshell-dod.json'),'utf8'));
 assert.equal(c.schema,'ikant-v5d-retrograde-oneshell-dod/v1');
 assert.equal(c.global.ci_can_close_global,false);assert.equal(c.v5g_separate,true);
 assert.equal(c.promise_matrix.length,6);
 const ints=new Set(c.intermediate.map(x=>x.id)),locals=new Set(c.local.map(x=>x.id));
 assert.equal(ints.size,5);assert.equal(locals.size,17);
 assert.deepEqual(new Set(c.global.requires),ints);
 assert.deepEqual(new Set(c.intermediate.flatMap(x=>x.locals)),locals);
 assert.equal(c.new_gate,'host/project-v5d-oneshell-assurance.mjs#assessV5DProjection');
 assert.deepEqual(ORDER,['ESITO','A','B','PROVA','EDGE','NEXT']);
 for(const p of [...c.critical_existing_sources,'host/project-v5d-oneshell-assurance.mjs'])
  assert.equal(fs.existsSync(path.join(root,p)),true,p);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'contracts/project-session-source.json'),'utf8'));
 assert.equal(manifest.paths.includes('host/project-v5d-oneshell-assurance.mjs'),true);
 assert.equal(manifest.paths.includes('host/project-oneshell-chat-presentation.mjs'),true);
});
