import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {deriveSessionClosureProjection,classifyLocalActivationStage} from '../src/runtime-availability.mjs';

const contract=JSON.parse(fs.readFileSync(new URL('../contracts/session-local-capability-lattice.json',import.meta.url),'utf8'));

test('C28 contract compresses the constitutional boundary to six existing-owner edges',()=>{
 assert.equal(contract.schema,'ikant-le-session-local-capability-lattice/v2');
 assert.deepEqual(contract.irreducible_lattice,['HUMAN_GATE','SOURCE_SNAPSHOT','LOCAL_INGRESS','LOCAL_MATERIALIZATION','EXECUTED_RUNTIME_PROOF','ACTIVE_READBACK']);
 assert.equal(contract.local_ingress.creates_new_owner,false);
 assert.equal(contract.diagnostic_projection.persisted,false);
 assert.equal(contract.selection.winner_cost_ties,1);
});

test('C28 closure reports the first repository-owned gap exactly',()=>{
 const d=deriveSessionClosureProjection({human_gate:true,source_snapshot:true,local_ingress:false,local_materialization:false,executed_runtime_proof:false,active_readback:false});
 assert.equal(d.repository_status,'OPEN_REPOSITORY_GAP');
 assert.equal(d.first_unclosed_edge,'LOCAL_INGRESS');
 assert.equal(d.repository_closed,false);
});

test('C28 can close repository-owned edges while preserving an explicit external gap',()=>{
 const d=deriveSessionClosureProjection({human_gate:true,source_snapshot:true,local_ingress:true,local_materialization:true,executed_runtime_proof:true,active_readback:true,external_gaps:[{id:'SESSION_CHAT_POST_RENDER_PLATFORM_ACK',open:true}]});
 assert.equal(d.repository_status,'CLOSED_BY_REPOSITORY');
 assert.equal(d.repository_closed,true);
 assert.equal(d.active,true);
 assert.deepEqual(d.external_gaps_open,['SESSION_CHAT_POST_RENDER_PLATFORM_ACK']);
 assert.equal(d.overall_status,'REPOSITORY_CLOSED_EXTERNAL_GAP');
});

test('C28 integrity contradiction cannot coexist with diagnostic ACTIVE',()=>{
 const d=classifyLocalActivationStage({accepted:true,processor_available:true,source_visible:true,bridge_candidate:true,bridge_verified:true,materialized_reopened:true,provenance_bound:true,runtime_bound:true,writer:true,active_readback:true,blocked_integrity:true});
 assert.notEqual(d.stage,'N8_ACTIVE');
 assert.equal(d.active,false);
 assert.equal(d.fault_overlay,'BLOCKED_INTEGRITY');
 assert.equal(d.persisted,false);
});

test('C28 external gap laundering is outside repository closure semantics',()=>{
 const d=deriveSessionClosureProjection({human_gate:true,source_snapshot:true,local_ingress:true,local_materialization:true,executed_runtime_proof:true,active_readback:true,blocked_integrity:true,external_gaps:[{id:'X',open:false}]});
 assert.equal(d.repository_status,'BLOCKED_INTEGRITY');
 assert.equal(d.repository_closed,false);
 assert.equal(d.active,false);
});
