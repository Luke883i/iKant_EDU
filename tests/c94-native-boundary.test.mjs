import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {bindC94GeneratedSurface,attemptC94HostNativeDelivery} from '../host/c94-native-delivery-boundary.mjs';
import {executeC94ColdHostTurn} from '../host/c94-cold-host-turn.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const VOICE='A bounded experimental response attributed to the actual C92 production owner, but not native ChatGPT delivery.';
const owner={status:'C93_HOST_SURFACE_READY_NOT_NATIVE_DELIVERED',source_head:'a'.repeat(40),
 input_sha256:'b'.repeat(64),surface_a_sha256:sha(Buffer.from(VOICE)),surface_a_exact:VOICE,
 owner_receipt_status:'C92_EXPERIMENTAL_OWNER_ACCEPTED_SURFACE_A_STAGED_NOT_NATIVE_DELIVERED',
 provider_http_calls_observed:2,active:false,native_delivery_attested:false,
 c81_c86_language_adoption_attested:false};
function signedHostFixture(key){
 return {async deliverAndReadback(req){
  const base={schema:'ikant-le-c94-host-ack/v1',source_head:req.source_head,
   input_sha256:req.input_sha256,output_sha256:req.output_sha256,
   host_session_id:'test_session_abcdefghijkl',host_event_id:'test_event_abcdefghijkl',
   native_event_kind:'CHATGPT_HOST_OBSERVED',displayed_utf8_base64:req.surface_a_utf8_base64};
  const signature=crypto.sign(null,Buffer.from(JSON.stringify(base)),key.privateKey).toString('base64');
  return {...base,host_signature_base64:signature};
 }};
}
test('cannot bind unexecuted runtime receipt, forged owner output, or wrong digest',()=>{
 for(const invalid of [null,{}, {...owner,status:'C91_STRUCTURALLY_VALIDATED_HOST_LANGUAGE_DRAFT_NOT_IKANT_SURFACE_A'},
  {...owner,source_head:'fake'}, {...owner,surface_a_sha256:'c'.repeat(64)},
  {...owner,provider_http_calls_observed:0}, {...owner,active:true}]){
  assert.equal(bindC94GeneratedSurface(invalid).status,'C94_NATIVE_STOP');}
});
test('exact owner-bound string remains non-C81/C86 legacy and never asserts native',()=>{
 const r=bindC94GeneratedSurface(owner);
 assert.equal(r.status,'C94_OWNER_BOUND_GENERATED_VOICE_NOT_C86_LEGACY');
 assert.equal(r.c81_c86_legacy_generated_voice_admission_attested,false);
 assert.equal(r.native_delivery_attested,false);
});
test('no installed native host hook means STOP rather than text echo success',async()=>{
 const r=await attemptC94HostNativeDelivery(bindC94GeneratedSurface(owner));
 assert.equal(r.status,'C94_NATIVE_STOP');assert.equal(r.first_unclosed_edge,'HOST_NATIVE_DELIVERY_HOOK_UNAVAILABLE');
});
test('even signed synthetic acknowledgement cannot self-promote into platform-native delivery',async()=>{
 const key=crypto.generateKeyPairSync('ed25519');
 const r=await attemptC94HostNativeDelivery(bindC94GeneratedSurface(owner),{
  hostBridge:signedHostFixture(key),hostPublicKey:key.publicKey});
 assert.equal(r.status,'C94_HOST_SIGNED_ACK_BYTES_MATCH_NOT_INDEPENDENT_PLATFORM_ATTESTED');
 assert.equal(r.host_signature_verified,true);assert.equal(r.native_chat_delivery_attested,false);
 assert.equal(r.first_unclosed_edge,'PLATFORM_NATIVE_EVENT_INDEPENDENT_READBACK');
});
test('signed acknowledgement of changed displayed text is stopped',async()=>{
 const key=crypto.generateKeyPairSync('ed25519');const bridge=signedHostFixture(key);
 const orig=bridge.deliverAndReadback;
 bridge.deliverAndReadback=async p=>{const x=await orig(p);return {...x,displayed_utf8_base64:Buffer.from('tampered').toString('base64')};};
 const r=await attemptC94HostNativeDelivery(bindC94GeneratedSurface(owner),{hostBridge:bridge,hostPublicKey:key.publicKey});
 assert.equal(r.status,'C94_NATIVE_STOP');assert.equal(r.first_unclosed_edge,'HOST_NATIVE_DISPLAYED_BYTES_DRIFT');
});
test('invalid native host signing key and forged signature cannot validate',async()=>{
 const key=crypto.generateKeyPairSync('ed25519');const other=crypto.generateKeyPairSync('ed25519');
 const r=await attemptC94HostNativeDelivery(bindC94GeneratedSurface(owner),{
  hostBridge:signedHostFixture(key),hostPublicKey:other.publicKey});
 assert.equal(r.status,'C94_NATIVE_STOP');assert.equal(r.first_unclosed_edge,'HOST_NATIVE_ACK_SIGNATURE_INVALID');
});
test('cold host missing mode, input or current head fails before GitHub/network',async()=>{
 const r=await executeC94ColdHostTurn({humanInput:'task',selection:{selected_mode:'EXPERIMENTAL'},sourceHead:'a'.repeat(40)});
 assert.equal(r.status,'C94_TURN_STOP');assert.equal(r.first_unclosed_edge,'CURRENT_HUMAN_INGRESS_C72_OR_SOURCE_HEAD');
});
test('cold host with C72 selection but no GitHub token cannot fake automated carrier',async()=>{
 const original=process.env.IKANT_C94_GITHUB_TOKEN;delete process.env.IKANT_C94_GITHUB_TOKEN;
 try{const r=await executeC94ColdHostTurn({humanInput:'task',selection:{status:'EXPERIMENTAL_SELECTED_NOT_RUNNING',selected_mode:'EXPERIMENTAL'},sourceHead:'a'.repeat(40)});
  assert.equal(r.status,'C94_TURN_STOP');assert.equal(r.first_unclosed_edge,'GITHUB_ACTIONS_TOKEN_UNAVAILABLE_IN_NODE');
 }finally{if(original!==undefined)process.env.IKANT_C94_GITHUB_TOKEN=original;}
});
