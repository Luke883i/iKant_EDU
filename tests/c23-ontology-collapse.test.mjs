import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from '../src/contract.mjs';
import {initialState} from '../src/state.mjs';
import {runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';
import {buildFastbootChannelLedger,issueFastbootCapabilityReceipt,FASTBOOT_CAPABILITY_FIELDS} from '../src/fastboot-convergence.mjs';
import {LEGACY_C20_COMPATIBILITY_ONLY} from '../src/session-chat-deployment.mjs';

const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const json=rel=>JSON.parse(read(rel));
const canonical=[
  'BOOTSTRAP.json','ADMISSION.json','contracts/host-shell.json','contracts/session-chat-activation.json',
  'contracts/local-session-fastboot.json','contracts/ikant-le.json','contracts/chat-bootstrap-semantic.json',
  'src/fastboot-convergence.mjs','src/state.mjs'
];
const forbidden=[
  'mechanical_channel_ledger_required','changed_mechanical_evidence',
  'mechanical_channel_receipts_own_capability_truth','deployed_origin_ticket',
  'deployment_session_receipt_sha256','deployment_attestation_receipt_sha256'
];

test('C23 canonical surfaces contain no stale host/deployment aliases',()=>{
  for(const rel of canonical){const txt=read(rel);for(const token of forbidden)assert.equal(txt.includes(token),false,`${rel} contains ${token}`);}
});

test('C23 host-attested terminology and legacy quarantine survive later canonical slices',()=>{
  const c=json('contracts/local-session-fastboot.json'),h=json('contracts/host-shell.json'),a=json('contracts/session-chat-activation.json');
  assert.equal(c.terminology_policy.canonical_pre_runtime_evidence,'HOST_ATTESTED');
  assert.equal(c.terminology_policy.mechanical_terms_reserved_for,'LOCAL_RUNTIME_WRITE_REOPEN_HASH_PROBE_PERSISTED_READBACK');
  assert.equal(h.session_chat_activation.host_attested_channel_ledger_required,true);
  assert.equal(h.post_accept_convergence.unavailable_persists_until_changed_channel_evidence,true);
  assert.ok(a.legacy_v1_required.includes('TYPED_HOST_ATTESTED_CHANNEL_LEDGER'));
  assert.equal(a.claim_boundary.host_attested_evidence_is_mechanical_runtime_proof,false);
  assert.equal(c.legacy_compatibility.canonical,false);
});

test('C23 fastboot ledger exposes channel-evidence terminology and no old alias',()=>{
  const caps=Object.fromEntries(FASTBOOT_CAPABILITY_FIELDS.map(k=>[k,true]));
  const r=issueFastbootCapabilityReceipt({carrier:'GITHUB_API_BASE64',status:'AVAILABLE',capabilities:caps,evidence:'observed',probeOwner:'C23_TEST',operationId:'1',sourceHead:'a'.repeat(40)});
  const l=buildFastbootChannelLedger({receipts:[r],sourceHead:'a'.repeat(40)});
  assert.equal(l.unavailable_persists_until_changed_channel_evidence,true);
  assert.equal('unavailable_persists_until_changed_mechanical_evidence' in l,false);
  assert.equal(l.capability_truth_owner,'HOST_ATTESTED_RECEIPTS');
  assert.equal(l.physical_origin_proven,false);
});

test('C23 canonical state no longer carries dead C20 profile/deployment fields',()=>{
  const b=initialState().bootstrap;
  for(const k of ['activation_profile','deployment_session_receipt_sha256','deployment_attestation_receipt_sha256'])assert.equal(k in b,false);
  assert.equal(b.activation_modality,'SESSION_CHAT_LOCAL');
});

test('C23 acceptance-origin ticket naming is activation-modality-neutral',()=>{
  const a=json('ADMISSION.json').acceptance_origin;
  assert.equal(a.acceptance_origin_ticket_schema,'ikant-le-acceptance-origin-ticket/v1');
  assert.equal('deployed_origin_ticket' in a,false);
});

test('C23 legacy C20 deployment machinery is explicitly quarantined',()=>{
  const root=runtimeRootDescriptor(),boot=json('BOOTSTRAP.json'),pkg=json('package.json'),runtime=read('src/runtime.mjs');
  assert.equal(LEGACY_C20_COMPATIBILITY_ONLY.canonical,false);
  assert.equal(LEGACY_C20_COMPATIBILITY_ONLY.product_mode_authority,false);
  assert.equal(LEGACY_C20_COMPATIBILITY_ONLY.runtime_root_member,false);
  assert.equal(LEGACY_C20_COMPATIBILITY_ONLY.runtime_export,false);
  assert.equal(root.members.some(x=>x.path==='src/session-chat-deployment.mjs'),false);
  assert.equal(boot.post_accept_fastboot.remote_paths.includes('src/session-chat-deployment.mjs'),false);
  assert.equal(runtime.includes('session-chat-deployment'),false);
  assert.equal(Object.values(pkg.exports||{}).some(x=>String(x).includes('session-chat-deployment')),false);
});
