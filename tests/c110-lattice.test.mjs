import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {selectC110Route,sealC110Synthetic,C110_PROFILES} from '../host/c110-experimental-lattice.mjs';
const head='a'.repeat(40);
const valid={sourceHead:head,cohostOptIn:true,turnSafe:true,originalCallable:false,
 syntheticAuthorized:true,syntheticCallable:true};
test('three-tier selection is deterministic and never a runtime attestation',()=>{
 assert.deepEqual(C110_PROFILES,['ORIGINAL_C108_ELIGIBLE','SYNTHETIC_HOST_DRAFT_ELIGIBLE','DIAGNOSTIC_ONLY']);
 const a=selectC110Route(valid);assert.equal(a.route,'SYNTHETIC_HOST_DRAFT_ELIGIBLE');
 assert.equal(a.original_c70_executed,false);assert.equal(a.original_c87_reopened,false);
 const b=selectC110Route({...valid,originalCallable:true});assert.equal(b.route,'ORIGINAL_C108_ELIGIBLE');
 assert.equal(b.original_c70_executed,false);
 assert.equal(selectC110Route({...valid,cohostOptIn:false}).status,'C110_DIAGNOSTIC_ONLY');
 assert.equal(selectC110Route({...valid,syntheticAuthorized:false}).status,'C110_DIAGNOSTIC_ONLY');
 assert.equal(selectC110Route({...valid,sourceHead:'bad'}).status,'C110_DIAGNOSTIC_ONLY');
});
test('synthetic receipt binds bytes but NEVER asserts original kernel, ledger or native hook',()=>{
 const a=sealC110Synthetic({sourceHead:head,input:'Domanda',voice:'Risposta provvisoria',
  nonce:'valid-c110-nonce-1234',priorCount:2});
 assert.equal(a.status,'C110_SYNTHETIC_HOST_DRAFT_NOT_IKANT_RUNTIME');
 assert.match(a.surface_a,/^\[BOZZA HOST SPERIMENTALE/);
 assert.equal(a.evidence.visible_voice_sha256,crypto.createHash('sha256').update(a.surface_a).digest('hex'));
 assert.equal(a.evidence.host_draft_sha256,crypto.createHash('sha256').update('Risposta provvisoria').digest('hex'));
 assert.equal(a.evidence.c70_original_executed,false);assert.equal(a.evidence.c87_writer_executed,false);
 assert.equal(a.evidence.ledger_event_sha256,null);assert.equal(a.native_delivery_attested,false);
 assert.equal(sealC110Synthetic({sourceHead:head,input:'api_key=secret',voice:'Voice',nonce:'valid-c110-nonce-1234'}).status,'C110_SYNTHETIC_STOP');
 assert.equal(sealC110Synthetic({sourceHead:head,input:'Q',voice:'iKant è ACTIVE',nonce:'valid-c110-nonce-1234'}).status,'C110_SYNTHETIC_STOP');
 assert.equal(sealC110Synthetic({sourceHead:head,input:'Q',voice:'password: sensitive',nonce:'valid-c110-nonce-1234'}).status,'C110_SYNTHETIC_STOP');
});
