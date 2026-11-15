import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {declareEduExperimentalBoundary,checkEduExperimentalOriginalTurn,EXPERIMENTAL_NONCLAIMS} from '../host/edu-experimental-product-boundary.mjs';
const h=x=>createHash('sha256').update(x).digest('hex');
function fixture(open=false){
 const text='EDU local response',shell='<<<VOICE_UTF8_START>>>\n'+text+'\n<<<VOICE_UTF8_END>>>',input='Question',nonce='nonce_123456789012',event='b'.repeat(64),head='a'.repeat(40);
 return {frame:{humanInput:input,nonce},c125Bytes:shell,turn:{ok:true,active:false,native_event_attested:false,
 source_head:head,c87_before:0,c87_after:1,original_turn:{status:open?'C140_ORIGINAL_C100_C87_LOCAL_READBACK':'C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK',
 input_sha256:h(input),output_sha256:h(text),ledger_event_sha256:event,original_c70_executed:!open,...(open?{c140_open_route:true}:{})},
 s03_host_projection:{ok:true,same_turn_local_owner_evidence_checked:true,original_voice_utf8:text,original_voice_sha256:h(text),c125_original_bytes:shell,c125_original_sha256:h(shell)}},
 readback:{original_c87_readback:{count:1,last_hash:event,latest_state:{nonce,source_head:head,visible_voice_sha256:h(text),...(open?{c140_open_route:true,c140_original_c70_executed:false}:{})}}}};
}
test('waiver descriptions are negative scope only, never original permissions',()=>{
 const x=declareEduExperimentalBoundary({waivers:Object.keys(EXPERIMENTAL_NONCLAIMS)});
 assert.equal(x.ok,true);assert.equal(x.declarations.length,10);assert.equal(x.grants_original_effect,false);
 assert.equal(declareEduExperimentalBoundary({waivers:['NATIVE_EVENT','NATIVE_EVENT']}).ok,false);
 assert.equal(declareEduExperimentalBoundary({waivers:['OVERRIDE_C72']}).ok,false);
});
test('original C107 and C140 have distinct C70 evidence, both require C87 and S03',()=>{
 assert.equal(checkEduExperimentalOriginalTurn(fixture()).original_c70_executed,true);
 assert.equal(checkEduExperimentalOriginalTurn(fixture(true)).original_c70_executed,false);
});
test('tamper, replay, forged native, false C140 C70, duplicate write all stop',()=>{
 const cases=[
 x=>x.turn.active=true,x=>x.turn.native_event_attested=true,x=>x.turn.c87_after=2,
 x=>x.turn.original_turn.input_sha256='f'.repeat(64),
 x=>x.turn.original_turn.original_c70_executed=true,
 x=>x.readback.original_c87_readback.latest_state.c140_original_c70_executed=true,
 x=>x.readback.original_c87_readback.last_hash='bad',
 x=>x.turn.s03_host_projection.c125_original_bytes='fake',
 x=>x.readback.original_c87_readback.latest_state.nonce='replay_nonce_123',
 x=>x.c125Bytes='tampered'
 ];
 for(const mutate of cases){const x=fixture(true);mutate(x);assert.equal(checkEduExperimentalOriginalTurn(x).ok,false);}
});
test('hostile getters and proxies do not become owner evidence',()=>{
 let reads=0;const x=fixture(true);
 Object.defineProperty(x.turn,'ok',{enumerable:true,get(){reads++;throw Error('getter');}});
 assert.equal(checkEduExperimentalOriginalTurn(x).ok,false);assert.equal(reads,0);
 assert.equal(declareEduExperimentalBoundary({waivers:new Proxy(['NATIVE_EVENT'],{})}).ok,false);
});

test('hostile accessor waiver or post-turn input must not execute',()=>{
 let reads=0;const arr=['NATIVE_EVENT'];Object.defineProperty(arr,'0',{enumerable:true,get(){reads++;throw Error('bad getter');}});
 assert.equal(declareEduExperimentalBoundary({waivers:arr}).ok,false);
 const top={};Object.defineProperty(top,'turn',{enumerable:true,get(){reads++;throw Error('bad getter');}});
 assert.equal(checkEduExperimentalOriginalTurn(top).ok,false);
 assert.equal(reads,0);
});
