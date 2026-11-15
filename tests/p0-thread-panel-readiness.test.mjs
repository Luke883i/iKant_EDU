import test from 'node:test';import assert from 'node:assert/strict';
import {assessP0ThreadPanelReadiness} from '../host/p0-thread-panel-readiness.mjs';
test('no flag, no session and no snapshot always expose the earliest blocker',()=>{
 assert.equal(assessP0ThreadPanelReadiness().first_edge,'THREAD_PANEL_FLAG_OFF');
 assert.equal(assessP0ThreadPanelReadiness({panelRequested:true}).first_edge,'GATEWAY_SESSION_BINDING_UNVERIFIED');
 assert.equal(assessP0ThreadPanelReadiness({panelRequested:true,sessionBound:true}).first_edge,'THREAD_SNAPSHOT_NOT_VERIFIED');
});
test('even fully configured local candidate cannot claim installed native UI or provider identity',()=>{
 for(const b of [false,true])for(const c of [false,true])for(const d of [false,true]){
  const s=assessP0ThreadPanelReadiness({panelRequested:b,sessionBound:c,snapshotOk:d});
  assert.equal(s.native_panel_attested,false);assert.equal(s.provider_event_attested,false);
  assert.equal(s.authority,0);assert.equal(typeof s.first_edge,'string');
 }
 const best=assessP0ThreadPanelReadiness({panelRequested:true,sessionBound:true,snapshotOk:true});
 assert.equal(best.candidate_ready,true);assert.equal(best.first_edge,'PROVIDER_REGISTERED_THREAD_PANEL_NOT_ATTESTED');
});
