import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSessionShell} from '../src/session-shell.mjs';
import {buildHostConsumptionFrame} from '../src/host-consumption-frame.mjs';
import {projectP1AppExclusiveShell,permittedVoiceMask,P1_APP_SLOTS} from '../host/p1-app-exclusive-shell.mjs';
const H='a'.repeat(40),R='b'.repeat(64);
function fixture(text='Ciao! Io sono software, non una persona.'){
 const state={status:'ACTIVE',accepted:true,probed:true,admission:{terms_presented:true,source_head:H,source_head_locked:true,orientation_objects:Array(5).fill({})},bootstrap:{terminal:'ACTIVE',probe:{ok:true,executed_provenance_receipt_sha256:R}},experience:{turns:1}};
 const session_shell=buildSessionShell({surfaceText:text,state,release:{surface_b_required:false}});
 const result={state:'ACTIVE',claim_class:'IKANT_ACTIVE',session_shell,runtime_turn_event_hash:'c'.repeat(64),node_dispatch_receipt_sha256:'d'.repeat(64)};
 const frame=buildHostConsumptionFrame({result,sourceHead:H,runtimeRootSha256:R,sessionRef:'one-owner-test'});
 return {result,frame};
}
test('fixed six slots; exact original A; all ancillary HOST output technical only',()=>{
 const {result,frame}=fixture('Sono software.\nIo non posso attestare coscienza.');
 const x=projectP1AppExclusiveShell({result,frame});
 assert.equal(x.ok,true,JSON.stringify(x));
 assert.deepEqual(x.slot_order,P1_APP_SLOTS);
 assert.equal(x.slots.A,'Sono software.\nIo non posso attestare coscienza.');
 assert.equal(x.voice_attested,true);assert.equal(x.slots.NEXT,'STOP');
 assert.ok(x.slots.B.startsWith('HOST: '));
 assert.equal(x.inter_turn_ui_persistence_attested,false);
 assert.equal(x.native_delivery_attested,false);
 assert.equal(x.full_semantic_losslessness_attested,false);
 assert.equal(x.retention.voice_exact_bytes,true);
});
test('speaker may never be forged from unsealed, old, fake, or missing owner evidence',()=>{
 const {result,frame}=fixture();
 const cases=[
  [{...result,state:'BLOCKED'},frame],
  [{...result,runtime_turn_event_hash:'e'.repeat(64)},frame],
  [{...result,session_shell:undefined},frame],
  [result,{...frame,state:'ACTIVE',claim_class:'IKANT_ACTIVE',receipt_sha256:'0'.repeat(64)}],
  [result,{...frame,shell:{...frame.shell,sha256:'0'.repeat(64)}}],
  [result,{...frame,runtime_evidence:{...frame.runtime_evidence,runtime_turn_event_hash:null}}]
 ];
 for(const [r,f] of cases){const x=projectP1AppExclusiveShell({result:r,frame:f});assert.equal(x.slots?.A??'NO_VOICE','NO_VOICE',JSON.stringify(x));}
});
test('mask does not allow missing writer evidence',()=>{
 for(let v=0;v<64;v++)assert.equal(permittedVoiceMask(v),v===63);
});
