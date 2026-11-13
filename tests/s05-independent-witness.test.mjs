import test from 'node:test';import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {inspectS05SignedStudy} from './pilot/s05-independent-witness.mjs';
const {publicKey,privateKey}=generateKeyPairSync('ed25519');
const key=publicKey.export({type:'spki',format:'pem'});
const envelope={version:'ikant-s05-study-envelope/v1',source_head:'a'.repeat(40),auditor_event:'study_event_00001',trials:Array.from({length:30},(_,i)=>({participant_pseudonym:'participant_'+String(i).padStart(12,'0'),trial_id:'test_trial_'+String(i).padStart(12,'0'),completed:true,elapsed_ms:10000+i,manual_steps:2,errors:0}))};
const attest=x=>sign(null,Buffer.from(JSON.stringify(x)),privateKey).toString('base64');
const fn=(x,s=attest(x))=>inspectS05SignedStudy({envelope:x,signatureBase64:s,trustedAuditorPublicKey:key,expectedSourceHead:'a'.repeat(40)});
test('S05 30 synthetic signed rows show integrity without claiming 30 humans',()=>{
 const r=fn(envelope);assert.equal(r.ok,true);assert.equal(r.trial_count,30);
 assert.equal(r.external_human_qualification,false);assert.equal(r.externally_real_humans_verified,false);
});
test('S05 256 mutated receipts and duplicate pseudonyms are rejected',()=>{
 const signature=attest(envelope);
 for(let i=0;i<256;i++){
  const j=structuredClone(envelope);j.trials[i%30].elapsed_ms+=i+1;
  const r=fn(j,signature);assert.equal(r.ok,false,`case ${i}`);
 }
 const duplicate=structuredClone(envelope);
 duplicate.trials[1].participant_pseudonym=duplicate.trials[0].participant_pseudonym;
 assert.equal(fn(duplicate).ok,false);
});
