import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../src/contract.mjs';
import {runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';
import {availabilityFromBootstrapFailure} from '../src/runtime-availability.mjs';

const json=rel=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));

test('C24 canonical boundary remains irreducible, unique and compatibility-zero-authority under later slices',()=>{
 const c=json('contracts/session-chat-activation.json');
 assert.equal(c.irreducible_lattice.length,6);
 assert.equal(c.irreducible_lattice[0],'HUMAN_GATE');
 assert.equal(c.irreducible_lattice[1],'SOURCE_SNAPSHOT');
 assert.equal(c.irreducible_lattice[2],'LOCAL_INGRESS');
 assert.equal(c.irreducible_lattice.includes('LOCAL_PROCESSOR'),false);
 assert.equal(c.irreducible_lattice.includes('VERIFIED_BYTE_PATH'),false);
 assert.ok(c.irreducible_lattice.includes('LOCAL_MATERIALIZATION'));
 assert.ok(c.irreducible_lattice.includes('EXECUTED_RUNTIME_PROOF'));
 assert.equal(c.irreducible_lattice.at(-1),'ACTIVE_READBACK');
 assert.ok(c.edge_invariants.includes('COMPATIBILITY_ZERO_AUTHORITY'));
 const ids=c.global_dod.map(x=>x.id);assert.equal(new Set(ids).size,ids.length);assert.ok(ids.every(Boolean));
});

test('C24 canonical runtime contains no legacy C20 deployment/profile aliases',()=>{
 const d=runtimeRootDescriptor(),forbidden=['deployed_session_binding','deployment_model','activation_profile','deployment_attestation'];
 for(const m of d.members){const txt=fs.readFileSync(path.join(ROOT,m.path),'utf8');for(const token of forbidden)assert.equal(txt.includes(token),false,`${m.path} contains ${token}`);}
 assert.equal(d.members.some(x=>x.path==='src/session-chat-deployment.mjs'),false);
});

test('C24 legacy compatibility contradiction is translated before canonical availability',()=>{
 const d=availabilityFromBootstrapFailure({accepted:true,sourceBound:true,consentValid:true,evidenceValidation:{ok:false,deadline_result:'DEADLINE_PASS',errors:['transfer_binding','bridge_observed']},probe:null,writer:true});
 assert.equal(d.state,'BLOCKED_INTEGRITY');assert.ok(d.integrity_codes.includes('TRANSFER_IDENTITY_MISMATCH'));
});

test('C24 runtime-root is deterministic and exactly matches canonical source bytes',()=>{
 const raw=execFileSync(process.execPath,['scripts/runtime-root.mjs','verify'],{cwd:ROOT,encoding:'utf8'});
 const r=JSON.parse(raw);assert.equal(r.status,'PASS');assert.equal(r.runtime_root_sha256,runtimeRootDescriptor().runtime_root_sha256);
});

test('C24 compatibility remains zero-authority and outside canonical root',()=>{
 const c=json('contracts/local-session-fastboot.json'),boot=json('BOOTSTRAP.json'),runtime=fs.readFileSync(path.join(ROOT,'src/runtime.mjs'),'utf8');
 assert.equal(c.legacy_compatibility.canonical,false);
 assert.equal(c.legacy_compatibility.translation_boundary,'BEFORE_CANONICAL_RUNTIME');
 assert.equal(c.legacy_compatibility.canonical_runtime_may_recognize_legacy_aliases,false);
 assert.equal(boot.post_accept_fastboot.remote_paths.includes('src/session-chat-deployment.mjs'),false);
 assert.equal(runtime.includes('session-chat-deployment'),false);
});
