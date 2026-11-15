/** C96's bounded policy lattice, not a runtime or native-UI attestation.
 * Bit positions are public, independently oracle-testable and deliberately fine grained.
 */
export const GATES=Object.freeze([
 'EXACT_TERMS_CONSENT', 'LATER_MODE_SELECTION', 'FROZEN_SOURCE_HEAD',
 'REGISTERED_AUTOMATIC_CARRIER','MANIFEST_HASH','ALL_UNIQUE_MEMBERS_REOPENED',
 'C77_DERIVATION_AND_70_CX', 'C84_C85_C81_SOURCE_REACHABILITY',
 'CURRENT_HUMAN_INPUT', 'C78_C79_C90_OWNER', 'REAL_LLM_PROVIDER',
 'INDEPENDENT_EVIDENCE_REVIEW', 'C81_C86_GENERATED_VOICE_OWNER_ADMISSION']);
const FULL=(1<<GATES.length)-1;
const notNative={active:false,native_chat_delivery_attested:false,source_origin_attested:false,
 model_provenance_attested:false,field_H95_attested:false,authority:0};
/** Coverage of a *modeled* capability state, NEVER an observed host receipt. */
export function classifyC96Model({gatesMask=0,mode=0,carrier=0,source=0,delivery=0,risk=0}={}){
 if(!Number.isSafeInteger(gatesMask)||gatesMask<0||gatesMask>FULL||
  !Number.isInteger(mode)||mode<0||mode>3||!Number.isInteger(carrier)||carrier<0||carrier>3||
  !Number.isInteger(source)||source<0||source>3||!Number.isInteger(delivery)||delivery<0||delivery>3||
  !Number.isInteger(risk)||risk<0||risk>7)
  return {classification:'INVALID_MODELED_ENVELOPE',...notNative};
 if(risk!==0)return {classification:'CONTAMINATED_CARRIER_INPUT',...notNative};
 if((gatesMask&1)===0)return {classification:'CONSENT_REQUIRED',...notNative};
 if((gatesMask&2)===0||mode!==1)return {classification:'MODE_SELECTION_REQUIRED',...notNative};
 if((gatesMask&4)===0||source!==1)return {classification:'FROZEN_SOURCE_UNVERIFIED',...notNative};
 if((gatesMask&8)===0||carrier===0)return {classification:'AUTOMATIC_BRIDGE_UNAVAILABLE',...notNative};
 if((gatesMask&0x1fff)!==FULL)return {classification:'OWNER_OR_BYTE_PROOF_MISSING',...notNative};
 // Even a complete structural witness does not establish an actual host event.
 if(delivery!==1)return {classification:'NATIVE_DELIVERY_UNVERIFIED',...notNative};
 return {classification:'MODELED_ELIGIBLE_REAL_HOST_READBACK_STILL_REQUIRED',...notNative};
}
export function missingC96Gates(mask){
 if(!Number.isInteger(mask)||mask<0||mask>FULL)return [...GATES];
 return GATES.filter((_,i)=>(mask&(1<<i))===0);
}
