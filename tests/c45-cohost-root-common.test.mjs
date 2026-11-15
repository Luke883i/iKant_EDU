import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {PARTICIPATION_LEASE_SCHEMA,ATTRIBUTED_DELIVERY_SCHEMA,qualifyCohostRoot,validatePersistentParticipationLease,validateExactAttributedDeliveryReceipt,COHOST_ROOT_COMMON_SHA} from '../src/cohost-root-qualification.mjs';

const sign=x=>({...x,receipt_sha256:crypto.createHash('sha256').update(Buffer.from(JSON.stringify(x))).digest('hex')});
const H='a'.repeat(64),R='b'.repeat(64),M='c'.repeat(64),N='d'.repeat(64);
const context=()=>({routable:true,session_locator_sha256:H,runtime_root_sha256:R,manifest_receipt_sha256:M});
const lease=()=>sign({schema:PARTICIPATION_LEASE_SCHEMA,observation_owner:'HOST_NATIVE_CHAT',external_observation:true,observed:true,session_locator_sha256:H,actor:'IKANT',current_turn_entitlement:true,persistent_route:true,no_manual_reselection:true,host_route_guard:true,authority:0});
const nativeReceipt=()=>sign({schema:'ikant-le-cohost-native-delivery-receipt/v1',observation_owner:'HOST_NATIVE_CHAT',observed:true,surface:'NATIVE_CHAT',platform_roundtrip_id:'roundtrip-1',session_locator_sha256:H,shell_receipt_sha256:'e'.repeat(64),ascii_sha256:'f'.repeat(64),ascii_bytes:42,envelope_receipt_sha256:N,authority:0});
const envelope=()=>({session_locator_sha256:H,shell_receipt_sha256:'e'.repeat(64),ascii_sha256:'f'.repeat(64),ascii_bytes:42,receipt_sha256:N});
const attributed=nr=>sign({schema:ATTRIBUTED_DELIVERY_SCHEMA,observation_owner:'HOST_NATIVE_CHAT',external_observation:true,observed:true,session_locator_sha256:H,turn_id:'TURN-1',actor:'IKANT',exact_runtime_bytes:true,native_delivery_receipt_sha256:nr.receipt_sha256,authority:0});

test('C45+ root requires durable context, persistent participation lease and exact attributed delivery',()=>{
 const nr=nativeReceipt(),a=attributed(nr),out=qualifyCohostRoot({contextReadback:context(),participationLease:lease(),attributedDelivery:a,envelope:envelope(),nativeReceipt:nr});
 assert.equal(out.common_semantic_sha256,COHOST_ROOT_COMMON_SHA);assert.equal(out.state,'COHOST_SAME_SESSION');assert.equal(out.promise_satisfied,true);assert.deepEqual(Object.values(out.root_spine),[true,true,true]);
});
test('C45 context continuity alone is not same-session cohost',()=>{
 const nr=nativeReceipt(),a=attributed(nr),out=qualifyCohostRoot({contextReadback:context(),participationLease:{},attributedDelivery:a,envelope:envelope(),nativeReceipt:nr});
 assert.notEqual(out.state,'COHOST_SAME_SESSION');assert.equal(out.root_spine.R0_DURABLE_CANONICAL_RUNTIME_CONTEXT,true);assert.equal(out.root_spine.R1_PERSISTENT_PARTICIPATION_LEASE,false);
});
test('lease requires persistent actor standing rather than per-message selection',()=>{
 const l=lease();assert.equal(validatePersistentParticipationLease(l).ok,true);
 const bad=sign({...l,no_manual_reselection:false,receipt_sha256:undefined});assert.equal(validatePersistentParticipationLease(bad).ok,false);
});
test('delivery is actor and turn attributable and reuses C45 native delivery truth',()=>{
 const nr=nativeReceipt(),a=attributed(nr);assert.equal(validateExactAttributedDeliveryReceipt(a,{envelope:envelope(),nativeReceipt:nr}).ok,true);
 const bad=sign({...a,actor:'HOST',receipt_sha256:undefined});assert.equal(validateExactAttributedDeliveryReceipt(bad,{envelope:envelope(),nativeReceipt:nr}).ok,false);
});
