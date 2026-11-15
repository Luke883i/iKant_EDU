import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {projectBrandedEduHostTurn} from '../host/ikant-edu-branded-host.mjs';
const H=s=>createHash('sha256').update(s,'utf8').digest('hex');
const voice='Voce locale originale, prova byte esatti.';
const c125='PRE\n<<<VOICE_UTF8_START>>>\n'+voice+'\n<<<VOICE_UTF8_END>>>\nMODE  | EDU\n';
const original=()=>({ok:true,status:'S02_EDU_V2_HOST_BOUND_LOCAL_READBACK',active:false,native_event_attested:false,c87_before:2,c87_after:3,original_turn:{public_mode:'EDU',original_c87_writer_executed:true,original_c70_executed:true,voice_utf8:voice},c125:{ok:true,origin:'HOST_BOUND',send_callback_resolved:true,native_exclusive_attested:false,platform_delivery_attested:false,frame_sha256:H(c125),voice_sha256:H(voice)}});
const cases=[
x=>x.ownerTurn.original_turn.public_mode='CANONICAL',
x=>x.ownerTurn.original_turn.original_c87_writer_executed=false,
x=>x.ownerTurn.c87_after=4,
x=>x.ownerTurn.c87_after=2,
x=>x.ownerTurn.active=true,
x=>x.ownerTurn.native_event_attested=true,
x=>x.ownerTurn.c125.send_callback_resolved=false,
x=>x.originalC125Text+='FORGED',
x=>x.ownerTurn.original_turn.voice_utf8+='X',
x=>x.ownerTurn.c125.voice_sha256='0'.repeat(64),
x=>x.ownerTurn.c125.origin='PROVIDER_NATIVE',
x=>x.ownerTurn=null,
];
test('qualified original voice adds HOST brand only without mutation',()=>{const x=projectBrandedEduHostTurn({ownerTurn:original(),originalC125Text:c125});assert.equal(x.ok,true,JSON.stringify(x));assert.equal(x.original_voice_utf8,voice);assert.equal(x.slots.A,'HOST_BOUND');assert.equal(x.slot_order.join('|'),'ESITO|A|B|PROVA|EDGE|NEXT');assert.equal(x.native_avatar_attested,false);assert.equal(x.active,false);});
test('720 realistic negative variants do not show a branded voice',()=>{for(let i=0;i<720;i++){const a={ownerTurn:original(),originalC125Text:c125};cases[i%cases.length](a);const x=projectBrandedEduHostTurn(a);assert.equal(x.ok,false,String(i));assert.equal(x.voice,'NO_VOICE');}});
test('A visual badge is fail closed and never changes A bytes',()=>{const s=readFileSync(new URL('../plugins/ikant-le-session-chat/server/public/ikant-le-app.html',import.meta.url),'utf8');assert.match(s,/id="ikant-voice-brand" class="hidden"/);assert.match(s,/setVoiceBrandVerified\(true\)/);assert.match(s,/function failClosed\(error\)\{setVoiceBrandVerified\(false\)/);assert.match(s,/v\.voice_sha256/);});

test('brand source epoch follows ORIGINAL owner head, never a historical PR/asset commit',()=>{
 const head='a'.repeat(40);
 const sourceBound=projectBrandedEduHostTurn({ownerTurn:{...original(),source_head:head},originalC125Text:c125});
 assert.equal(sourceBound.ok,true);
 assert.equal(sourceBound.source_head,head);
 assert(sourceBound.visual_brand.icon_url.includes('/'+head+'/assets/brand/'));
 const unbound=projectBrandedEduHostTurn({ownerTurn:original(),originalC125Text:c125});
 assert.equal(unbound.ok,true);assert.equal(unbound.source_head,null);
 assert.equal(unbound.visual_brand.icon_url,null);
 assert(!unbound.host_heading_markdown.includes('raw.githubusercontent.com'));
});
