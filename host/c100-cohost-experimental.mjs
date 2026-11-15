import crypto from 'node:crypto';
import {isProxy} from 'node:util/types';
import {validateC72ModeSelection} from './c72-unified-mode-admission.mjs';

// Co-host only: this never calls an LLM, authenticates a ChatGPT event,
// creates an iKant owner receipt, or writes durable state.
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const H40=/^[0-9a-f]{40}$/;
const H64=/^[0-9a-f]{64}$/;
const MAX_INPUT_BYTES=12000;
const MAX_DRAFT_BYTES=16000;
const SCHEMA='ikant-le-c100-cohost-experimental/v1';
const own=(x,k)=>Object.getOwnPropertyDescriptor(x,k)?.value;
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&!isProxy(x)&&
 Object.getPrototypeOf(x)===Object.prototype&&Reflect.ownKeys(x).every(k=>
  typeof k==='string'&&Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));
const hard={authority:0,active:false,canonical_runtime:false,persistent:false,
 owner_executed:false,owner_receipt_issued:false,source_origin_attested:false,
 native_event_attested:false,native_delivery_attested:false,
 model_provider_attested:false,independent_semantic_review_attested:false};
const stop=edge=>Object.freeze({schema:SCHEMA,status:'C100_STOP',first_unclosed_edge:edge,...hard});
const refusal=/\b(?:i am (?:a )?conscious|i am sentient|sono (?:davvero )?cosciente|sono senziente|canonical active|native event attested|persistence verified)\b/i;
const privacy=/\b(?:api[_ -]?key\s*[:=]|bearer\s+[A-Za-z0-9_-]{12,}|password\s*[:=])/i;

/** C72-experimental-only *policy* for an ordinary ChatGPT cohost draft.
 * Hard runtime evidence is deliberately NOT claimed. This plan is not a C84
 * receipt and cannot be converted to C97 source-verified Surface A.
 */
export function prepareC100CohostDraft({sourceHead,selection,humanInput,optIn=false}={}){
 if(!plain(selection)||!H40.test(sourceHead||'')||!validateC72ModeSelection(selection,{mode:'EXPERIMENTAL',sourceHead}))
  return stop('REAL_EXPERIMENTAL_C72_SELECTION_REQUIRED');
 if(optIn!==true)return stop('EXPERIMENTAL_COHOST_OPT_IN_REQUIRED');
 if(typeof humanInput!=='string'||!humanInput.trim()||
    Buffer.byteLength(humanInput,'utf8')>MAX_INPUT_BYTES||
    Buffer.from(humanInput,'utf8').toString('utf8')!==humanInput)
  return stop('BOUNDED_EXACT_HUMAN_INPUT_REQUIRED');
 if(privacy.test(humanInput))return stop('SENSITIVE_INPUT_NO_AUTOMATIC_DELEGATION');
 const inputSha=sha(Buffer.from(humanInput,'utf8'));
 const planBody={schema:SCHEMA,source_head:sourceHead,input_sha256:inputSha,
  policy:'EXPERIMENTAL_COHOST_MODEL_DRAFT_ONLY',route:'USER_OPTED_IN_COHOST_LANGUAGE',
  response_context:'Answer the actual human question; do not substitute iKant self-identity for a question about the human. Use natural language, explicitly mark uncertainties and avoid ungrounded claims.',
  model_role:'UNTRUSTED_CREATIVE_LANGUAGE_ENGINE',
  display_role:'IKANT_COHOST_LLM_DRAFT_NOT_C84_SURFACE_A',
  possible_cx_reuse:['C72','C91','C92','C97','C99'],
  required_visible_disclosure:'iKant EXPERIMENTAL | co-host LLM draft | NOT C84 verified | ACTIVE=false',
  source_origin_attested:false,owner_executed:false,active:false,authority:0};
 const planSha=sha(JSON.stringify(planBody));
 return Object.freeze({...planBody,status:'C100_COHOST_PLAN_READY_UNATTESTED',
  plan_sha256:planSha,first_unclosed_edge:'ACTUAL_MODEL_CALL_AND_NATIVE_EVENT_NOT_ATTESTED'});
}

/** Only hash-shapes a HOST-SUPPLIED LLM draft. No semantic truth, source origin,
 * external model call, independent review, or native event is authenticated. */
export function finalizeC100CohostDraft({plan,modelText,planSha256}={}){
 if(!plain(plan)||plan.schema!==SCHEMA||
   plan.status!=='C100_COHOST_PLAN_READY_UNATTESTED'||
   plan.route!=='USER_OPTED_IN_COHOST_LANGUAGE'||
   plan.model_role!=='UNTRUSTED_CREATIVE_LANGUAGE_ENGINE'||
   plan.owner_executed!==false||plan.active!==false||
   !H40.test(plan.source_head||'')||!H64.test(plan.input_sha256||'')||
   !H64.test(plan.plan_sha256||''))return stop('COHOST_PLAN_REQUIRED');
 const {status,plan_sha256,first_unclosed_edge,...body}=plan;
 if(sha(JSON.stringify(body))!==planSha256||planSha256!==plan.plan_sha256)
  return stop('COHOST_PLAN_SHA256_DRIFT');
 if(typeof modelText!=='string'||!modelText.trim()||
    Buffer.byteLength(modelText,'utf8')>MAX_DRAFT_BYTES||
    Buffer.from(modelText,'utf8').toString('utf8')!==modelText)
  return stop('COHOST_DRAFT_BOUNDS');
 if(refusal.test(modelText))return stop('COHOST_OVERCLAIM_TEXT');
 const outputSha=sha(Buffer.from(modelText,'utf8'));
 return Object.freeze({schema:SCHEMA,status:'C100_MODEL_DRAFT_UNATTESTED_NOT_OWNER',
  mode:'EXPERIMENTAL',source_head:plan.source_head,
  bound_input_sha256:plan.input_sha256,bound_output_sha256:outputSha,
  plan_sha256:plan.plan_sha256,
  display_label:plan.required_visible_disclosure,
  display_text:modelText,
  receipt_policy:'HASHES_AND_STATUS_ONLY_NO_CHAT_LEDGER',
  first_unclosed_edge:'HOST_MODEL_ORIGIN_AND_NATIVE_DELIVERY_NOT_ATTESTED',
  ...hard});
}

/** Optional one-line local telemetry; it is NOT a durable writer or owner ledger. */
export function compactC100Observation(r){
 if(!plain(r)||r.schema!==SCHEMA)return stop('C100_RECEIPT_REQUIRED');
 const status=own(r,'status');
 return Object.freeze({schema:SCHEMA,status,
  source_head:H40.test(own(r,'source_head'))?own(r,'source_head'):null,
  input_sha256:H64.test(own(r,'bound_input_sha256'))?own(r,'bound_input_sha256'):
   H64.test(own(r,'input_sha256'))?own(r,'input_sha256'):null,
  output_sha256:H64.test(own(r,'bound_output_sha256'))?own(r,'bound_output_sha256'):null,
  first_unclosed_edge:typeof own(r,'first_unclosed_edge')==='string'?own(r,'first_unclosed_edge'):'UNVERIFIED',
  authority:0,active:false,owner_executed:false,persistent:false,
  evidence_scope:'LOCAL_NONAUTHORITATIVE_TELEMETRY_ONLY'});
}
