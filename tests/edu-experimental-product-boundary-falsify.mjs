// 1,000,000 finite Host policy mutations; NOT 1m C135 or LLM calls.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {declareEduExperimentalBoundary,checkEduExperimentalOriginalTurn} from '../host/edu-experimental-product-boundary.mjs';
const H=x=>createHash('sha256').update(x).digest('hex');
const input='Epistemic question',voice='Guided local answer',shell='<<<VOICE_UTF8_START>>>\n'+voice+'\n<<<VOICE_UTF8_END>>>',nonce='nonce_123456789012',source='a'.repeat(40);
function base(open){const event='b'.repeat(64);
 return {frame:{humanInput:input,nonce},c125Bytes:shell,
 turn:{ok:true,active:false,native_event_attested:false,source_head:source,c87_before:0,c87_after:1,
 original_turn:{status:open?'C140_ORIGINAL_C100_C87_LOCAL_READBACK':'C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK',
 input_sha256:H(input),output_sha256:H(voice),ledger_event_sha256:event,original_c70_executed:!open,...(open?{c140_open_route:true}:{})},
 s03_host_projection:{ok:true,same_turn_local_owner_evidence_checked:true,original_voice_utf8:voice,original_voice_sha256:H(voice),c125_original_bytes:shell,c125_original_sha256:H(shell)}},
 readback:{original_c87_readback:{count:1,last_hash:event,latest_state:{nonce,source_head:source,visible_voice_sha256:H(voice),
 ...(open?{c140_open_route:true,c140_original_c70_executed:false}:{})}}}};
}
const mutate=[
 x=>x.turn.ok=false,x=>x.turn.active=true,x=>x.turn.native_event_attested=true,
 x=>x.turn.c87_before=2,x=>x.turn.c87_after=3,
 x=>x.turn.original_turn.input_sha256='bad',x=>x.turn.original_turn.output_sha256='bad',
 x=>x.turn.original_turn.ledger_event_sha256='bad',
 x=>x.turn.original_turn.original_c70_executed=!x.turn.original_turn.original_c70_executed,
 x=>x.turn.original_turn.status='FORGED',
 x=>x.turn.s03_host_projection.same_turn_local_owner_evidence_checked=false,
 x=>x.turn.s03_host_projection.c125_original_bytes='fake',
 x=>x.turn.s03_host_projection.original_voice_sha256='bad',
 x=>x.c125Bytes='fake',x=>x.frame.humanInput='changed',
 x=>x.frame.nonce='bad',x=>x.readback.original_c87_readback.count=2,
 x=>x.readback.original_c87_readback.last_hash='bad',
 x=>x.readback.original_c87_readback.latest_state.nonce='changed',
 x=>x.readback.original_c87_readback.latest_state.visible_voice_sha256='bad'
];
let seed=0xC140ED02;const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
let denied=0,unexpected=0,positive=0;
for(let i=0;i<1_000_000;i++){
 const open=(i&1)===0,x=base(open);mutate[rand()%mutate.length](x);
 if(checkEduExperimentalOriginalTurn(x).ok)unexpected++;else denied++;
 if(i%250===0){assert.equal(checkEduExperimentalOriginalTurn(base(open)).ok,true);positive++;}
}
assert.equal(unexpected,0);
assert.equal(declareEduExperimentalBoundary({waivers:['NATIVE_EVENT','NATIVE_EVENT']}).ok,false);
assert.equal(declareEduExperimentalBoundary({waivers:['NATIVE_EVENT']}).grants_original_effect,false);
console.log(JSON.stringify({schema:'edu-boundary-falsify/v1',cases:1000000,denied,incorrectly_allowed:unexpected,
 positive,seed:'0xC140ED02',scope:'FINITE_HOST_POLICY_NOT_NATIVE_OR_ORIGINAL_OWNER'}));
