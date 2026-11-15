import crypto from 'node:crypto';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const H40=/^[a-f0-9]{40}$/,H64=/^[a-f0-9]{64}$/;
const stop=e=>({schema:'ikant-le-c94-native-delivery/v1',status:'C94_NATIVE_STOP',first_unclosed_edge:e,
 native_chat_delivery_attested:false,host_signature_verified:false,active:false,authority:0});
const b64=x=>typeof x==='string'&&x.length%4===0&&/^[A-Za-z0-9+/]*={0,2}$/.test(x)&&Buffer.from(x,'base64').toString('base64')===x;
export function bindC94GeneratedSurface(owner={}){
 if(owner?.status!=='C93_HOST_SURFACE_READY_NOT_NATIVE_DELIVERED'||
   !H40.test(owner.source_head||'')||!H64.test(owner.input_sha256||'')||
   !H64.test(owner.surface_a_sha256||'')||
   typeof owner.surface_a_exact!=='string'||
   sha(Buffer.from(owner.surface_a_exact,'utf8'))!==owner.surface_a_sha256||
   owner.owner_receipt_status!=='C92_EXPERIMENTAL_OWNER_ACCEPTED_SURFACE_A_STAGED_NOT_NATIVE_DELIVERED'||
   owner.provider_http_calls_observed!==2||owner.active!==false||
   owner.native_delivery_attested!==false||owner.c81_c86_language_adoption_attested!==false)
   return stop('C93_C92_ACTUAL_OWNER_RECEIPT_REQUIRED');
 return {schema:'ikant-le-c94-generated-voice/v1',status:'C94_OWNER_BOUND_GENERATED_VOICE_NOT_C86_LEGACY',
  source_head:owner.source_head,input_sha256:owner.input_sha256,
  output_sha256:owner.surface_a_sha256,surface_a_exact:owner.surface_a_exact,
  owner_causal_receipt:owner.owner_receipt_status,
  source_c81_verification_required_by_c90:true,
  c81_c86_legacy_generated_voice_admission_attested:false,
  native_delivery_attested:false,active:false,authority:0};
}
/** Host plugin must supply a real callback and separate, host-signed readback.
 * A signature only verifies *the claimed signer*, never that ChatGPT rendered a native UI event.
 * Without an actual platform-reported event, status remains NOT_PLATFORM_ATTESTED. */
export async function attemptC94HostNativeDelivery(bound,{hostBridge,hostPublicKey}={}){
 if(bound?.status!=='C94_OWNER_BOUND_GENERATED_VOICE_NOT_C86_LEGACY'||
   bound.active!==false||bound.native_delivery_attested!==false)
  return stop('OWNER_BOUND_VOICE_REQUIRED');
 if(!hostBridge||typeof hostBridge.deliverAndReadback!=='function'||!hostPublicKey)
  return stop('HOST_NATIVE_DELIVERY_HOOK_UNAVAILABLE');
 let ack;try{
  ack=await hostBridge.deliverAndReadback(Object.freeze({
   schema:'ikant-le-c94-native-delivery-request/v1',source_head:bound.source_head,
   input_sha256:bound.input_sha256,output_sha256:bound.output_sha256,
   surface_a_utf8_base64:Buffer.from(bound.surface_a_exact,'utf8').toString('base64'),
   active:false,authority:0}));
 }catch{return stop('HOST_NATIVE_CALLBACK_FAILED');}
 if(!ack||typeof ack!=='object'||Array.isArray(ack)||
   Object.keys(ack).sort().join(',')!==[
   'schema','source_head','input_sha256','output_sha256','host_event_id',
   'displayed_utf8_base64','host_signature_base64','host_session_id','native_event_kind'
  ].sort().join(',')||
   ack.schema!=='ikant-le-c94-host-ack/v1'||
   ack.source_head!==bound.source_head||ack.input_sha256!==bound.input_sha256||
   ack.output_sha256!==bound.output_sha256||!b64(ack.displayed_utf8_base64)||
   !b64(ack.host_signature_base64)||
   !/^[A-Za-z0-9_-]{16,128}$/.test(ack.host_event_id||'')||
   !/^[A-Za-z0-9_-]{16,128}$/.test(ack.host_session_id||'')||
   ack.native_event_kind!=='CHATGPT_HOST_OBSERVED')return stop('HOST_NATIVE_ACK_SHAPE');
 if(!Buffer.from(ack.displayed_utf8_base64,'base64').equals(Buffer.from(bound.surface_a_exact,'utf8')))
   return stop('HOST_NATIVE_DISPLAYED_BYTES_DRIFT');
 const message=Buffer.from(JSON.stringify({schema:ack.schema,source_head:ack.source_head,
  input_sha256:ack.input_sha256,output_sha256:ack.output_sha256,
  host_session_id:ack.host_session_id,host_event_id:ack.host_event_id,
  native_event_kind:ack.native_event_kind,displayed_utf8_base64:ack.displayed_utf8_base64}));
 let valid=false;try{valid=crypto.verify(null,message,hostPublicKey,Buffer.from(ack.host_signature_base64,'base64'));}
 catch{return stop('HOST_NATIVE_ACK_PUBLIC_KEY_INVALID');}
 if(!valid)return stop('HOST_NATIVE_ACK_SIGNATURE_INVALID');
 return {schema:'ikant-le-c94-native-delivery/v1',
  status:'C94_HOST_SIGNED_ACK_BYTES_MATCH_NOT_INDEPENDENT_PLATFORM_ATTESTED',
  source_head:bound.source_head,input_sha256:bound.input_sha256,
  output_sha256:bound.output_sha256,host_session_id:ack.host_session_id,
  host_event_id:ack.host_event_id,host_signature_verified:true,
  host_signature_origin_independently_authenticated:false,
  native_chat_delivery_attested:false,
  first_unclosed_edge:'PLATFORM_NATIVE_EVENT_INDEPENDENT_READBACK',
  active:false,authority:0};
}
