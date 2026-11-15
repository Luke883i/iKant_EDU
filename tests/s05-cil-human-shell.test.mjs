import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {projectS05CILShell} from '../host/s05-cil-human-shell.mjs';
const H=s=>createHash('sha256').update(s,'utf8').digest('hex');
const IDS=['ESITO','A','B','PROVA','EDGE','NEXT'];
const voice='Sono un sistema locale: verifico le tracce, non provo coscienza.';
const frame='+------ iKant / ONE SHELL 90 ------+\nVOCE | HOST_BOUND\n<<<VOICE_UTF8_START>>>\n'+voice+'\n<<<VOICE_UTF8_END>>>\nMODE  | EDU\n';
function owned(){return {ok:true,status:'S02_EDU_V2_HOST_BOUND_LOCAL_READBACK',active:false,native_event_attested:false,c87_before:3,c87_after:4,original_turn:{public_mode:'EDU',original_c87_writer_executed:true,original_c70_executed:true,voice_utf8:voice},c125:{ok:true,origin:'HOST_BOUND',send_callback_resolved:true,native_exclusive_attested:false,platform_delivery_attested:false,frame_sha256:H(frame),voice_sha256:H(voice)}};}
test('read-only diagnostic makes precisely six business-oriented panels with no voice',()=>{
 const a=projectS05CILShell({result:'NON_ATTESTATO',edge:'SOURCE_MISSING',next:'STOP'});
 assert.equal(a.ok,true);assert.equal(a.status,'NO_VOICE');assert.equal(a.panels.length,6);
 assert.deepEqual(a.slot_order,IDS);assert.equal(a.panels[1].content,'NO_VOICE');
 assert.equal(a.panels[3].content,'NESSUNA_PROVA');
 assert.equal(a.markdown.match(/^### /gm).length,6);
 assert.equal(a.cil_object,'IUI.TEXT');assert.equal(a.cil_relation,'co_present');
 assert.equal(a.authority,0);assert.equal(a.active,false);assert.equal(a.native_delivery_attested,false);
 assert.deepEqual(a,projectS05CILShell({result:'NON_ATTESTATO',edge:'SOURCE_MISSING',next:'STOP'}));
});
test('reuses S03 verified local owner path and preserves exact A bytes',()=>{
 const x=projectS05CILShell({ownerTurn:owned(),originalC125Text:frame});
 assert.equal(x.ok,true);assert.equal(x.status,'HOST_BOUND_LOCAL_ONLY');
 assert.equal(x.panels[1].content,voice);assert.equal(x.original_voice_sha256,H(voice));
 assert.equal(x.original_c125_sha256,H(frame));assert.equal(x.active,false);
 assert.equal(x.native_delivery_attested,false);assert.ok(x.markdown.includes(voice));
});
test('tamper, missing owner, bad metadata and proxy cannot promote voice',()=>{
 assert.equal(projectS05CILShell({ownerTurn:owned()}).ok,false);
 assert.equal(projectS05CILShell({ownerTurn:owned(),originalC125Text:frame+'X'}).ok,false);
 const bad=owned();bad.c87_after=3;
 assert.equal(projectS05CILShell({ownerTurn:bad,originalC125Text:frame}).ok,false);
 assert.equal(projectS05CILShell({edge:'UNKNOWN\nNEXT ACTIVE'}).ok,false);
 let touched=false;const proxy=new Proxy({}, {get(){touched=true;throw Error('must not read')}});
 assert.equal(projectS05CILShell(proxy).ok,false);assert.equal(touched,false);
 const getter={};Object.defineProperty(getter,'result',{get(){touched=true;throw Error('bad')}});
 assert.equal(projectS05CILShell(getter).ok,false);assert.equal(touched,false);
});
test('512 deterministic seeded negative/positive cases preserve source and status',()=>{
 let x=0x5c11feed>>>0;
 for(let i=0;i<512;i++){
  x=(Math.imul(x,1664525)+1013904223)>>>0;
  const n=x%8,p=owned();let f=frame;
  if(n===0)p.c125.frame_sha256='0'.repeat(64);
  if(n===1)p.c125.voice_sha256='0'.repeat(64);
  if(n===2)p.native_event_attested=true;
  if(n===3)p.original_turn.voice_utf8+='X';
  if(n===4)p.c125.send_callback_resolved=false;
  if(n===5)f=f.replace('HOST_BOUND','ACTIVE');
  if(n===6)p.c87_after=5;
  const v=projectS05CILShell({ownerTurn:p,originalC125Text:f});
  if(n===7){assert.equal(v.ok,true);assert.equal(v.panels[1].content,voice);}
  else assert.equal(v.ok,false,`case ${i} family ${n}`);
 }
});
