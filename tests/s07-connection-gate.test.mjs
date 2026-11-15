import test from 'node:test';import assert from 'node:assert/strict';import {evaluateS07Candidate} from './pilot/s07-connection-gate.mjs';
test('S07 no fabricated MCP installation from repo code, manifest or JSON',()=>{
 for(const projection of [{},{tool_name:'ikant-le-session-chat',callable:true},
  {installed:true,active:true},{tool_name:'ikant-le-session-chat',callable:true,ownerReceipt:'fake'}]){
  const r=evaluateS07Candidate(projection);assert.equal(r.native_plugin_connection_qualified,false);assert.equal(r.canonical_active,false);
 }
});
