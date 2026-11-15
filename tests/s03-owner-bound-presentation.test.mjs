import test from 'node:test';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {projectS03CompletedEduTurn} from '../host/s03-owner-bound-presentation.mjs';
const H=s=>createHash('sha256').update(s,'utf8').digest('hex');
const voice='Voce EDU originale: è presente un solo writer.';
const original='+------ iKant / ONE SHELL 90 ------+\nVOCE | HOST_BOUND\n<<<VOICE_UTF8_START>>>\n'+voice+'\n<<<VOICE_UTF8_END>>>\nMODE  | EDU\n';
const positive=()=>({ok:true,status:'S02_EDU_V2_HOST_BOUND_LOCAL_READBACK',active:false,native_event_attested:false,c87_before:3,c87_after:4,original_turn:{public_mode:'EDU',original_c87_writer_executed:true,original_c70_executed:true,voice_utf8:voice},c125:{ok:true,origin:'HOST_BOUND',send_callback_resolved:true,native_exclusive_attested:false,platform_delivery_attested:false,frame_sha256:H(original),voice_sha256:H(voice)}});
test('S03 original C125 and genuine local C87 turn populate A HOST_BOUND without rewriting',()=>{
 const v=projectS03CompletedEduTurn({ownerTurn:positive(),originalC125Text:original});
 assert.equal(v.ok,true);assert.equal(v.slots.A,'HOST_BOUND');assert.equal(v.original_voice_utf8,voice);
 assert.equal(v.c125_original_bytes,original);assert.equal(v.c125_readback_attested,true);
 assert.equal(v.native_delivery_attested,false);assert.equal(v.c125_provenance_attested_by_host,false);
});
test('S03 512 mismatched owner and C125 pairs fail closed',()=>{
 for(let i=0;i<512;i++){
  const t=positive();const v=JSON.parse(JSON.stringify(t));let frame=original;
  switch(i%8){case 0:v.c87_after=3;break;case 1:v.c125.frame_sha256='0'.repeat(64);break;
   case 2:v.c125.voice_sha256='0'.repeat(64);break;case 3:v.original_turn.voice_utf8+='X';break;
   case 4:v.native_event_attested=true;break;case 5:v.c125.send_callback_resolved=false;break;
   case 6:frame=frame.replace('Voce EDU','Voce non EDU');break;case 7:v.original_turn.original_c87_writer_executed=false;break;}
  const r=projectS03CompletedEduTurn({ownerTurn:v,originalC125Text:frame});assert.equal(r.ok,false,`case ${i}`);
 }
});
test('S03 standalone caller claims and proxy fail without activating',()=>{
 assert.equal(projectS03CompletedEduTurn({ownerTurn:{ok:true},originalC125Text:original}).ok,false);
 const p=new Proxy({}, {get(){throw Error('must never invoke getter')}});
 assert.equal(projectS03CompletedEduTurn({ownerTurn:p,originalC125Text:original}).ok,false);
});
