import {isProxy} from 'node:util/types';
/** v1.0.experimental: reverse-derived HOST evidence gate. No new original owner,
 * permission, C87 writer, ChatGPT native provider hook, or voice.
 */
export const V1_EXPERIMENTAL='ikant-project-edu-oneshell-v1.0.experimental';
export const RELEASE_AXES=Object.freeze({
 phase:7,referent:5,act:6,route:4,source_state:4,owner:5,
 evidence:5,length:4,transport:4,polarity:4,language:3
});
export const RELEASE_CUT=Object.freeze([
 ['NATIVE_PROVIDER','PROVIDER_CHATGPT_REAL_DELIVERY_RECEIPT'],
 ['PROMPT_INSTALL','PROJECT_INSTALLED_PROMPT_BYTE_EQUIVALENCE'],
 ['ONESHELL','ORIGINAL_C125_S03_SIX_SLOTS_READBACK'],
 ['C87','ORIGINAL_SINGLE_WRITER_LEDGER_SAME_TURN'],
 ['C135','ORIGINAL_C135_C70_C124_REQUIRED_ACK'],
 ['SOURCE','PINNED_HEAD_TREE_BLOB_INDEPENDENT_READBACK'],
 ['EDU','ORIGINAL_DISTINCT_EDU_SELECTION'],
 ['C72','ORIGINAL_EXACT_I_ACCEPT_AND_INTRODUCTION'],
 ['ORIENTATION','FIVE_FIRST_TURN_BLOBS_AND_TERMS_LINK']
]);
const SHA=/^[a-f0-9]{40}$/u;
const plain=x=>{try{return x!==null&&typeof x==='object'&&!Array.isArray(x)&&!isProxy(x)&&
 Object.getPrototypeOf(x)===Object.prototype&&Reflect.ownKeys(x).every(k=>typeof k==='string'&&
 Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'))}catch{return false}};
/** Finite audit model only: NOT all possible utterances or computations. */
export function computeReleaseCartesianSpace(){
 const axes=Object.entries(RELEASE_AXES),cardinality=axes.reduce((n,[,size])=>n*BigInt(size),1n);
 return Object.freeze({schema:V1_EXPERIMENTAL+'/cartesian/v1',
  axis_count:axes.length,axes:Object.freeze(axes.map(([name,n])=>Object.freeze({name,cardinality:n}))),
  total_bounded_combinations:cardinality.toString(),semantic_truth_attested:false,
  general_language_coverage_attested:false,all_computations_enumerated:false});
}
/** Diagnostic ONLY. Caller-supplied booleans cannot mint original receipts.
 * Even if they are all true, no provider/native-product GO is possible here.
 */
export function inspectProjectEduExperimentalRelease(request={}){
 if(!plain(request))return Object.freeze({ok:false,status:'STOP_RELEASE_INPUT_UNTRUSTED',
  first_edge:'NON_DATA_INPUT_DENIED',voice:'NO_VOICE',native_ui_attested:false,product_go:false,authority:0});
 const {sourceHead,liveHead,evidence}=request;
 if(typeof sourceHead!=='string'||typeof liveHead!=='string'||!SHA.test(sourceHead)||!SHA.test(liveHead)||sourceHead!==liveHead)
  return Object.freeze({ok:false,status:'STOP_SOURCE_LOCK_STALE',
   first_edge:'SOURCE_HEAD_NOT_VERIFIED',voice:'NO_VOICE',product_go:false,
   native_ui_attested:false,authority:0});
 const evidenceData=plain(evidence);
 const missing=RELEASE_CUT.filter(([name])=>!evidenceData||evidence[name]!==true).map(([,obligation])=>obligation);
 return Object.freeze({ok:false,status:missing.length?
  'STOP_EXPERIMENTAL_RELEASE_EVIDENCE_INCOMPLETE':
  'EXPERIMENTAL_HOST_CLAIMS_REQUIRE_ORIGINAL_INDEPENDENT_READBACK',
  first_edge:missing[0]||'PROVIDER_ORIGINAL_WITNESS_UNVERIFIED',
  missing:Object.freeze(missing),reverse_order:Object.freeze(RELEASE_CUT.map(x=>x[0])),
  reported_prerequisites_only:missing.length===0,voice:'NO_VOICE',
  original_owner_invoked:false,original_c87_written:false,provider_delivery_attested:false,
  project_prompt_installed_attested:false,native_ui_attested:false,
  product_go:false,authority:0});
}
