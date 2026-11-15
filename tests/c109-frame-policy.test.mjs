import test from 'node:test';import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {checkC109TurnFrame} from '../host/c109-frame-policy.mjs';
const good={text:'Descrivi un esperimento scientifico.',nonce:'c109-local-nonce-01'};
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
test('shared C109 preflight accepts clean bounded questions',()=>{
 assert.equal(checkC109TurnFrame(good),null);
 assert.equal(checkC109TurnFrame({...good,candidate:{input_sha256:sha(good.text),text:'Una risposta.'}}),null);
});
test('shared C109 preflight blocks control commands, credentials and forged candidate shapes',()=>{
 for(const text of ['I ACCEPT','EXPERIMENTAL','attiva iKant','password: ABC','api_key=secret',
   'AUTORIZZO BOZZE COHOST SPERIMENTALI NON VERIFICATE'])
  assert.notEqual(checkC109TurnFrame({...good,text}),null);
 assert.notEqual(checkC109TurnFrame({...good,candidate:{text:'false'}}),null);
 assert.notEqual(checkC109TurnFrame({...good,nonce:'short'}),null);
});
