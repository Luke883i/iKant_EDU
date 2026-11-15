import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {deriveActivationServiceTier,validateActivationServiceTier,assessLimitedTurnClosure,validateLimitedTurnClosure} from '../src/runtime-availability.mjs';
import {processLimitedRuntimeTurn} from '../src/runtime-limited-turn.mjs';

const prefix={accepted:true,source_snapshot:true,local_ingress:true,materialized_reopened:true,executed_provenance:true,runtime_bound:true,writer:true,active_readback:false};

test('C30 service tiers are monotonic projections and ACTIVE stays on the existing readback gate',()=>{
 const rows=[
  [{accepted:true,source_snapshot:true},'REPO_STUDY_ONLY','LOCAL_INGRESS'],
  [{accepted:true,source_snapshot:true,local_ingress:true},'ACTIVATION_LIMITED_1','LOCAL_MATERIALIZATION'],
  [{accepted:true,source_snapshot:true,local_ingress:true,materialized_reopened:true},'ACTIVATION_LIMITED_2','EXECUTED_RUNTIME_PROOF'],
  [prefix,'RUNTIME_BOUND_LIMITED','ACTIVE_READBACK'],
  [{...prefix,active_readback:true},'ACTIVE',null]
 ];
 for(const [e,tier,edge] of rows){const d=deriveActivationServiceTier(e);assert.equal(d.tier,tier);assert.equal(d.first_unclosed_edge,edge);assert.deepEqual(validateActivationServiceTier(d),{ok:true,errors:[]});}
 assert.equal(deriveActivationServiceTier(prefix).active,false);assert.equal(deriveActivationServiceTier({...prefix,active_readback:true}).active,true);
});

test('C30 integrity overlay blocks the service projection instead of laundering into a limited tier',()=>{
 const d=deriveActivationServiceTier({...prefix,blocked_integrity:true});assert.equal(d.tier,null);assert.equal(d.active,false);assert.equal(d.limited_turn_eligible,false);assert.equal(d.fault_overlay,'BLOCKED_INTEGRITY');
});

test('C30 limited closure requires dispatch, seal, DOCX readback and telemetry without platform ACK',()=>{
 const c=assessLimitedTurnClosure({activation_tier:'RUNTIME_BOUND_LIMITED',writer:true,node_dispatch:true,runtime_seal:true,docx_written:true,docx_readback:true,telemetry_complete:true,structured_handoff:true,exact_delivery_ack_claimed:false,canonical_state_mutation:false});
 assert.equal(c.closed,true);assert.equal(c.active,false);assert.equal(c.host_delivery_proven,false);assert.equal(c.platform_ack_required,false);assert.equal(c.canonical_state_mutated,false);assert.deepEqual(validateLimitedTurnClosure(c),{ok:true,errors:[]});
 const bad=assessLimitedTurnClosure({activation_tier:'RUNTIME_BOUND_LIMITED',writer:true,node_dispatch:true,runtime_seal:true,docx_written:true,docx_readback:false,telemetry_complete:true,structured_handoff:true});assert.equal(bad.closed,false);assert.equal(bad.first_failed_requirement,'DOCX_READBACK');
});

test('C30 limited turn no longer accepts caller-authored activation booleans or dispatch receipts',()=>{
 const candidate=Array(70).fill('parola').join(' ');assert.throws(()=>processLimitedRuntimeTurn({input:'input',candidate,activationEvidence:prefix,nodeDispatch:{node20_plus:true,input_sha256:'f'.repeat(64),receipt_sha256:'e'.repeat(64)}}),/capability invalid/);
});

test('C30 limited-turn module has no canonical writer dependency and C31 owns capability/dispatch hardening',()=>{
 const src=fs.readFileSync(new URL('../src/runtime-limited-turn.mjs',import.meta.url),'utf8');
 assert.equal(src.includes("from './state.mjs'"),false);assert.equal(src.includes('appendEvent('),false);assert.equal(src.includes('withWriterLock('),false);
 assert.match(src,/validateLimitedRuntimeCapability/);assert.match(src,/nodeDispatchReceiptPure/);assert.match(src,/writeBacklogDocxAtomic/);assert.equal(src.includes('activationEvidence'),false);
});

test('C30 checked-in selection and falsification receipts encode the unique contract and fail-closed qualification',()=>{
 const select=JSON.parse(fs.readFileSync(new URL('../artifacts/qualification/c30-activation-service-selection-10k.json',import.meta.url),'utf8')),fals=JSON.parse(fs.readFileSync(new URL('../artifacts/qualification/c30-activation-service-10m.json',import.meta.url),'utf8'));
 assert.equal(select.candidates,10000);assert.equal(select.unique_candidates,10000);assert.equal(select.valid_candidates,1);assert.equal(select.winner_cost,0);assert.equal(select.winner_cost_ties,1);const sr={...select};delete sr.receipt_sha256;assert.equal(select.receipt_sha256,crypto.createHash('sha256').update(JSON.stringify(sr)).digest('hex'));
 assert.equal(fals.cases,10000000);assert.equal(fals.candidate_oracle_mismatches,0);assert.equal(fals.unsafe_active,0);assert.equal(fals.unsafe_limited_closure,0);assert.equal(fals.all_mutants_killed,true);assert.equal(fals.status,'PASS');
});
