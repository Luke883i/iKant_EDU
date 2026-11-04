import test from 'node:test';
import assert from 'node:assert/strict';
import originalMap from '../contracts/project-host-tool-grounding-abi.json' with {type:'json'};
import {validateGroundingMap,planHostToolGrounding} from '../host/project-host-tool-grounding.mjs';
import {H1_FILES,H1_TRANSIT,H1_SEED} from '../host/project-edu-h1-bound-port.mjs';
const H='a'.repeat(40),B='b'.repeat(40);
const FIRST=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const witness=()=>({source_head:H,host_link_displayed:true,distinct_human_message_observed:true,
 terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+H+'/TERMS.md',
 pinned_blob_shas:Object.fromEntries(FIRST.map(x=>[x,B]))});
const valid=()=>({phase:'POST_ACCEPT',humanMessage:'I ACCEPT',freshHumanTurn:true,
 ownerOutcome:'NOT_INVOKED',sourceHead:H,liveHead:H,priorTurnEvidence:witness()});
test('machine contract binds exact original Gold and does not install a gateway',()=>{
 const a=validateGroundingMap();
 assert.equal(a.ok,true);assert.equal(a.original_8,8);
 assert.deepEqual(a.original_transit,H1_TRANSIT);assert.equal(a.original_seed,H1_SEED);
 assert.equal(originalMap.read_scope,'POST_ACCEPT_ONLY');
 assert.deepEqual(originalMap.capabilities.map(x=>x.id),
  ['GITHUB_SOURCE','NODE_EXEC','HOST_TOOL_ARGUMENT_COURIER']);
 assert.equal(originalMap.carrier_priority[0].receiver,'scripts/project-c72-verified-staging.mjs');
 assert.deepEqual(originalMap.carrier_priority[0].receive_ops,['init','put','put-local','verify']);
 assert.deepEqual(H1_FILES,FIRST.concat([
  'contracts/c72-public-mode-admission-v2.json','host/c72-public-mode-admission.mjs',
  'host/project-c72-postaccept-reentry.mjs']));
 assert.equal(originalMap.no_native_provider_installation_claim,true);
});
test('valid I ACCEPT yields a non-executing Host-tool-argument PROBE, never C72',()=>{
 const r=planHostToolGrounding(valid());
 assert.equal(r.kind,'PROBE_REQUIRED',JSON.stringify(r));
 assert.equal(r.carrier,'HOST_TOOL_ARG_RELAY');assert.equal(r.steps.length,6);
 for(const k of ['original_owner_invoked','source_origin_attested','provider_attested',
  'bridge_attested','runtime_started','active'])assert.equal(r[k],false,k);
 assert.equal(r.first_edge,'HOST_TOOL_ARG_RELAY_PHYSICAL_TRANSFER_NOT_YET_OBSERVED');
});
test('consent, phase, witness and HEAD negative mutations fail closed',()=>{
 const samples=[
  {...valid(),phase:'ORIENTATION'},
  {...valid(),humanMessage:'I accept'},
  {...valid(),freshHumanTurn:false},
  {...valid(),ownerOutcome:'UNKNOWN'},
  {...valid(),sourceHead:'0'.repeat(40)},
  {...valid(),liveHead:'0'.repeat(40)},
  {...valid(),priorTurnEvidence:null},
  {...valid(),priorTurnEvidence:{...witness(),terms_link:'https://example.org'}},
  {...valid(),priorTurnEvidence:{...witness(),distinct_human_message_observed:false}},
  {...valid(),priorTurnEvidence:{...witness(),pinned_blob_shas:{...witness().pinned_blob_shas,'TERMS.md':'bad'}}}
 ];
 for(const q of samples)assert.equal(planHostToolGrounding(q).kind,'STOP',JSON.stringify(q));
});
test('invented provider capability and hash/receipt flags cannot authorize effects',()=>{
 for(const claimed of [
  {nodeAvailable:true,githubAvailable:true,bridgeInstalled:true},
  {observed:true,providerToolId:'invented',ownerReceipt:'forged',native_event_attested:true},
  {nodeDns:'ENOTFOUND',sourceTransferFailed:true,backup:'LZ77'},
  {sourcePacketVerified:8,verifiedSHA:true,source_origin_attested:true}
 ]){
  const r=planHostToolGrounding({...valid(),claimed});
  assert.equal(r.kind,'PROBE_REQUIRED');
  assert.equal(r.bridge_attested,false);assert.equal(r.original_owner_invoked,false);
  assert.equal(r.provider_attested,false);
 }
});
test('20+ structural faults in machine contract cannot mint a usable route',()=>{
 const mutations=[
  c=>{c.authority=1},c=>{c.active=true},c=>{c.read_scope='ORIENTATION'},
  c=>{c.execution='AUTO_OWNER'},c=>{c.capabilities=[]},
  c=>{c.capabilities[0].witness=''},c=>{c.carrier_priority.reverse()},
  c=>{c.carrier_priority[0].receiver='host/fake-owner.mjs'},
  c=>{c.carrier_priority[0].receive_ops=['assume-pass']},
  c=>{c.stage_protocol.splice(0,1)},
  c=>{c.stage_protocol[2].proof=''},
  c=>{c.stage_protocol[0].deny=[]},
  c=>{c.gold_first=[]},c=>{c.gold_first[0].source='host/fake.mjs'},
  c=>{c.immutable_boundaries.no_new_owner=false},
  c=>{c.immutable_boundaries.no_auto_retry=false},
  c=>{c.immutable_boundaries.first_turn='READ_TREE'},
  c=>{c.invalid_promotions=[]},c=>{c.forbidden=[]},
  c=>{c.truth.product='PRODUCT_GO'},
  c=>{c.no_native_provider_installation_claim=false},
  c=>{c.no_attested_host_tool_binding_from_json=false},
  c=>{c.no_synthetic_consent=false},
  c=>{delete c.receiver_abi},
  c=>{c.receiver_abi.operations.put.schema='not-original'},
  c=>{c.receiver_abi.command='invented executable'},
  c=>{c.receiver_abi.no_new_receiver=false}
 ];
 for(const mutation of mutations){
  const copy=structuredClone(originalMap);mutation(copy);
  assert.throws(()=>validateGroundingMap(copy));
 }
});
