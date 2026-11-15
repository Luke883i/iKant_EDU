import test from 'node:test';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {projectV10Terminal,formatV10Terminal,V10_TITLES} from '../host/edu-v10-terminal-shell.mjs';
const sha=s=>createHash('sha256').update(s,'utf8').digest('hex');
const voice='Sono host in C70. Accenti: è Ω. Non attesto coscienza.';
const okay=()=>({schema:'ikant-edu-c70-guided/v7',status:'PR119_OWNER_C70_GUIDED_LOCAL_READBACK',active:false,
 surface_a:{origin:'HOST_BOUND',voice_utf8:voice},
 surface_b:{MODE:'EXPERIMENTAL',STATUS:'HOST_BOUND_LOCAL_NOT_ACTIVE',ACTIVE:false,TRACE_REF:'a'.repeat(64),CONTINUITY:'C87_INDEPENDENT_PROCESS_REOPEN',FIRST_EDGE:'NATIVE_CHATGPT_PER_TURN_DISPATCH',NEXT:'INDEPENDENT_HOST_FIELD_WITNESS'},
 pr119_surface_b:{TRACE_REF:'a'.repeat(64),canonical_active:false,native_chatgpt_origin_attested:false,provider_origin_attested:false,C87_PROOF:'ORIGINAL_APPEND_REOPEN',C100_PROOF:'ORIGINAL_INPUT_OUTPUT_BOUND',original_c70_executed:true,original_c87_writer_executed:true,visible_voice_sha256:sha(voice)}});
test('exact voice separate from terminal; no made-up DOCX',()=>{
 const r=projectV10Terminal(okay());assert.equal(r.surface_a.voice_utf8,voice);assert.equal(formatV10Terminal(r).includes(voice),false);
 assert.equal(r.terminal.DOCX,'—');assert.deepEqual(r.docx_links,[]);assert.equal(r.active,false);assert.equal(V10_TITLES.length,12);
});
test('typed HOST slide does not modify A and cannot truncate silently',()=>{
 const x=projectV10Terminal(okay(),{hostNotes:{fact:'Fatto verificato',interpretation:'Analisi host',limit:'Hook non attestato'}});
 assert.equal(x.host_slide.FATTO,'Fatto verificato');assert.equal(x.host_slide.source,'HOST_NOT_IKANT');
 const bad=projectV10Terminal(okay(),{hostNotes:{fact:'A'.repeat(181),interpretation:'I',limit:'L'}});
 assert.equal(bad.host_slide.note_status,'INVALID_HOST_NOTE_NOT_RENDERED');assert.equal(bad.surface_a.voice_utf8,voice);
});
test('4096 seeded negative mutations fail closed, including proxy/getter',()=>{
 let seed=0x2026c123;
 for(let i=0;i<4096;i++){
  seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
  const x=okay();switch((seed>>>0)%8){
   case 0:x.surface_a.voice_utf8+='!';break;case 1:x.surface_b.TRACE_REF='0'.repeat(64);break;
   case 2:x.pr119_surface_b.visible_voice_sha256='0'.repeat(64);break;
   case 3:x.pr119_surface_b.canonical_active=true;break;
   case 4:x.pr119_surface_b.native_chatgpt_origin_attested=true;break;
   case 5:x.pr119_surface_b.provider_origin_attested=true;break;
   case 6:x.pr119_surface_b.C87_PROOF='PENDING';break;case 7:x.active=true;break;
  }assert.equal(projectV10Terminal(x).surface_a.origin,'NO_VOICE',String(i));
 }
 let invoked=0;const p=new Proxy(okay(),{get(){invoked++;throw Error('get')}});assert.equal(projectV10Terminal(p).surface_a.origin,'NO_VOICE');assert.equal(invoked,0);
 const y=okay();Object.defineProperty(y.surface_b,'MODE',{enumerable:true,get(){invoked++;return 'EXPERIMENTAL'}});
 assert.equal(projectV10Terminal(y).surface_a.origin,'NO_VOICE');assert.equal(invoked,0);
});