/**
 * Host-only, denial-only semantic fence. NEVER an admission, owner, permission,
 * ChatGPT native hook, or source/receipt attestor. Intended as a pre-PR overlay.
 * Passing this fence means ONLY that no modeled prohibition has fired.
 * Original C72/C135/C87/C125/S03 validators MUST still run independently.
 */
import {isProxy} from 'node:util/types';
export const RAIL_SCHEMA='ikant-le-host-negative-rail/v2';
export const PHASES=Object.freeze(['ORIENTATION','POST_ACCEPT','AWAIT_MODE','POST_EDU','EDU_TURN','EXIT_PENDING','ENGINEERING']);
export const ACTIONS=Object.freeze(['READ_SOURCE','READ_TREE','INVOKE_C72','CLAIM_C72','SELECT_EDU','START_C135','CLAIM_A','HOST_ANSWER','NODE_HTTPS','CLAIM_TRANSFER_FAILED','REQUEST_P1_ZIP','REQUEST_P0_ONEZIP','RETRY_C72','CLAIM_NATIVE_UI','AUTO_REPIN','EXEC_C71_AS_EDU','CLOSE_EXIT','CLAIM_EXITED','CLAIM_ACTIVE','CLAIM_DNS_FAILED','CLAIM_BRIDGE','REUSE_C87','CLAIM_PROMPT_INSTALLED']);
export const FIRST_FILES=Object.freeze(['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md']);
export const C72_EIGHT=Object.freeze([...FIRST_FILES,'contracts/c72-public-mode-admission-v2.json','host/c72-public-mode-admission.mjs','host/project-c72-postaccept-reentry.mjs']);
export const C72_TRANSIT='host/project-c72-receipt-transit.mjs';
export const POST_ACCEPT_READS=Object.freeze([...new Set([...C72_EIGHT,C72_TRANSIT,
 'host/project-c72-host-recovery.mjs','host/project-c72-capability-port.mjs',
 'host/project-c72-physical-ingress.mjs','host/project-c72-coldstart-seed.mjs',
 'scripts/project-c72-portable-cli.mjs','scripts/project-c72-staged-ingress-cli.mjs',
 'scripts/project-c72-partial-source-kit.mjs','scripts/project-edu-zip-tree.py',
 'scripts/project-edu-onezip-admission.mjs','scripts/project-c72-cold-mode-cli.mjs'])]);
const OWNERS=Object.freeze({INVOKE_C72:'C72_ORIGINAL',SELECT_EDU:'C72_ORIGINAL',START_C135:'C135_ORIGINAL',CLAIM_A:'C125_S03_ORIGINAL',REUSE_C87:'C87_ORIGINAL',CLOSE_EXIT:'ONESHell_EXIT_ORIGINAL'});
const plain=x=>{
 try{return x!==null&&typeof x==='object'&&!Array.isArray(x)&&!isProxy(x)&&
  Object.getPrototypeOf(x)===Object.prototype&&Reflect.ownKeys(x).every(k=>typeof k==='string'&&
   Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'))}
 catch{return false}
};
const H40=/^[0-9a-f]{40}$/u;
const denied=(edge,action)=>Object.freeze({schema:RAIL_SCHEMA,disposition:'STOP',first_edge:edge,action,authority:0,active:false,original_owner_invoked:false,owner_receipt_issued:false,native_delivery_attested:false});
const pass=(action)=>Object.freeze({schema:RAIL_SCHEMA,disposition:'PASS_TO_ORIGINAL_CHECK',first_edge:null,action,required_original_owner:OWNERS[action]??'HOST_EXTERNAL_EVIDENCE_CHECK',permission_granted:false,authority:0,active:false,original_owner_invoked:false,owner_receipt_issued:false,native_delivery_attested:false});
const yes=(e,k)=>e[k]===true;
const matchHead=e=>typeof e.sourceHead==='string'&&H40.test(e.sourceHead)&&e.liveHead===e.sourceHead;
const hasC72Receipts=e=>yes(e,'acceptedReadback')&&yes(e,'introductionReadback');
const isNewAccept=(phase,e)=>phase==='POST_ACCEPT'&&yes(e,'freshHumanTurn')&&e.humanMessage==='I ACCEPT';
const checkBridge=e=>['CALLBACKS','NODE_HTTPS','HOST_PACKET','HOST_FILE'].includes(e.carrier)&&yes(e,'physicalIngressReadback')&&yes(e,'nodeReady')&&yes(e,'c72SourceReadback')&&yes(e,'e16TransitPinReadback');
const dnsFailedSameEpoch=e=>e.nodeDns?.status==='FAILED_OBSERVED'&&e.nodeDns?.host==='api.github.com'&&typeof e.nodeDns?.epoch==='string'&&e.nodeDns.epoch!==''&&e.nodeDns.epoch===e.runtimeEpoch;
const firstFile=e=>FIRST_FILES[e.orientationNextIndex]===e.path && Number.isInteger(e.orientationNextIndex);
const permittedRead=(p,e)=>p==='ENGINEERING' || p==='ORIENTATION'&&firstFile(e) ||
 (p==='POST_ACCEPT'||p==='AWAIT_MODE')&&POST_ACCEPT_READS.includes(e.path) ||
 (p==='POST_EDU'||p==='EDU_TURN'||p==='EXIT_PENDING')&&yes(e,'sourceEpochPinned');
const validP1Source=e=>e.sourceState==='ABSENT'||e.sourceState==='PARTIAL';
const sourceVerified=e=>yes(e,'sourceTreeReadback')&&yes(e,'sourceBlobReadback')&&yes(e,'originalEduSelectionReadback')&&matchHead(e);
const isHostTopic=e=>yes(e,'explicitHostAddress')&&yes(e,'hostOperationalScope');
const sameTurnVoice=e=>yes(e,'c135OwnerReadback')&&yes(e,'c87SingleWriterReadback')&&yes(e,'c125S03Readback')&&yes(e,'sameInput')&&yes(e,'sameTurn')&&yes(e,'voiceUtf8ByteEqual');
const rules=Object.freeze([
 ['N01_PRECONSENT_READ_BOUNDARY',(a,p,e)=>a==='READ_SOURCE'&&!permittedRead(p,e) || a==='READ_TREE'&&!['POST_EDU','EDU_TURN','EXIT_PENDING','ENGINEERING'].includes(p)],
 ['N02_EXACT_NEW_ACCEPT',(a,p,e)=>a==='INVOKE_C72'&&!isNewAccept(p,e)],
 ['N03_FIRST_TURN_WITNESS_AND_HEAD',(a,p,e)=>a==='INVOKE_C72'&&(!yes(e,'fiveOriginalShaWitness')||!matchHead(e))],
 ['N04_PHYSICAL_C72_CARRIER',(a,p,e)=>(a==='INVOKE_C72'&&!checkBridge(e)) || (a==='CLAIM_BRIDGE'&&!yes(e,'physicalIngressReadback'))],
 ['N05_C72_PRIOR_ATTEMPT_FENCE',(a,p,e)=>a==='INVOKE_C72'&&(e.ownerOutcome!=='NOT_INVOKED'||e.attemptRecordExists!==false)],
 ['N06_ORIGINAL_RECEIPTS_NOT_TEXT',(a,p,e)=>a==='CLAIM_C72'&&!hasC72Receipts(e)],
 ['N07_EDU_DISTINCT_TURN',(a,p,e)=>a==='SELECT_EDU'&&(p!=='AWAIT_MODE'||!yes(e,'freshHumanTurn')||e.humanMessage!=='EDU')],
 ['N08_EDU_ORIGINAL_C72_TRANSIT',(a,p,e)=>a==='SELECT_EDU'&&(!hasC72Receipts(e)||!yes(e,'originalC72TransitReadback')||!matchHead(e))],
 ['N09_EDU_FULL_SOURCE_PRE_C135',(a,p,e)=>a==='START_C135'&&(!['POST_EDU','EDU_TURN'].includes(p)||!sourceVerified(e))],
 ['N10_ORIGINAL_SAME_TURN_VOICE',(a,p,e)=>a==='CLAIM_A'&&(p!=='EDU_TURN'||!sameTurnVoice(e)) || a==='REUSE_C87'&&(!yes(e,'workerLossObserved')||!yes(e,'c87OriginalCheckpointReadback')||!yes(e,'uniqueNonce')||!yes(e,'sameSourceEpoch')||!yes(e,'singleWriter'))],
 ['N11_HOST_NOT_IKANT',(a,p,e)=>a==='HOST_ANSWER'&&p==='EDU_TURN'&&!isHostTopic(e)],
 ['N12_NO_DNS_BLIND_REPROBE',(a,p,e)=>(a==='NODE_HTTPS'||a==='INVOKE_C72'&&e.carrier==='NODE_HTTPS')&&dnsFailedSameEpoch(e)&&!yes(e,'networkChangedObserved')],
 ['N13_NODE_NETWORK_PHASE',(a,p,e)=>a==='NODE_HTTPS'&&(p!=='POST_ACCEPT'||!yes(e,'nodeReady'))],
 ['N14_UNBOUND_IS_NOT_FAILED_TRANSFER',(a,p,e)=>a==='CLAIM_TRANSFER_FAILED'&&!yes(e,'physicalTransferFailureObserved')],
 ['N15_P1_ONLY_AFTER_EDU',(a,p,e)=>a==='REQUEST_P1_ZIP'&&(p!=='POST_EDU'||!yes(e,'originalEduSelectionReadback')||!matchHead(e)||!validP1Source(e)||!yes(e,'nodeReady')||!yes(e,'extractorReady'))],
 ['N16_P0_ONEZIP_NARROW_GATE',(a,p,e)=>a==='REQUEST_P0_ONEZIP'&&(!isNewAccept(p,e)||!yes(e,'fiveOriginalShaWitness')||!matchHead(e)||!yes(e,'originalP0CoordinatorReady')||e.ownerAlreadyAccepted!==false)],
 ['N17_NEVER_RETRY_ORIGINAL_C72',(a)=>a==='RETRY_C72'],
 ['N18_NATIVE_UI_NEEDS_PROVIDER_RECEIPT',(a,p,e)=>a==='CLAIM_NATIVE_UI'&&!yes(e,'providerUiReceiptObserved')],
 ['N19_NO_AUTOMATIC_EPOCH_REPIN',(a,p,e)=>a==='AUTO_REPIN'||a==='CLAIM_PROMPT_INSTALLED'&&!yes(e,'projectInstalledPromptBytesObserved')],
 ['N20_C71_NOT_EDU_OWNER',(a)=>a==='EXEC_C71_AS_EDU'],
 ['N21_EXIT_TWO_TURN_AND_OWNER',(a,p,e)=>a==='CLOSE_EXIT'&&(p!=='EXIT_PENDING'||e.humanMessage!=='CONFERMO EXIT IKANT'||!yes(e,'priorExitExactTurn')||!yes(e,'c87PrecloseReadback')||!yes(e,'qualifiedExitOwner')) || a==='CLAIM_EXITED'&&(p!=='EXIT_PENDING'||!yes(e,'originalCloseReadback'))],
 ['N22_EDU_NEVER_CANONICAL_ACTIVE',(a)=>a==='CLAIM_ACTIVE'],
 ['N23_DNS_FAILURE_MUST_BE_OBSERVED',(a,p,e)=>a==='CLAIM_DNS_FAILED'&&!dnsFailedSameEpoch(e)]
]);
export const RULE_IDS=Object.freeze(rules.map(([id])=>id));
/** Fast fail-closed read-only projection. Mutating runtime and native event claims are prohibited. */
export function screenHostNegativeAction(request={}){
 if(!plain(request))return denied('NEGATIVE_RAIL_INPUT_INVALID',null);
 if(!ACTIONS.includes(request.action)||!PHASES.includes(request.phase)||!plain(request.evidence)||
   (request.evidence.nodeDns!==undefined&&request.evidence.nodeDns!==null&&!plain(request.evidence.nodeDns)))
  return denied('NEGATIVE_RAIL_INPUT_INVALID',typeof request.action==='string'?request.action:null);
 const {action,phase,evidence:e}=request;
 for(const [id,trigger] of rules){try{if(trigger(action,phase,e))return denied(id,action)}catch{return denied('NEGATIVE_RAIL_EVIDENCE_UNKNOWN',action)}}
 return pass(action);
}
/** Calls only an effect supplied by the real Host after the Host's independent
 * original preflight. A callback saying true is NOT independent owner evidence.
 * This wrapper cannot certify the returned receipt, native I/O or provider UI.
 */
export async function screenThenInvokeHostEffect(request,{originalPreflight,invoke}={}){
 const gate=screenHostNegativeAction(request);
 if(gate.disposition==='STOP')return Object.freeze({gate,invoked:false,effect:null});
 if(typeof originalPreflight!=='function'||typeof invoke!=='function')return Object.freeze({gate:denied('NEGATIVE_RAIL_ORIGINAL_PREFLIGHT_UNBOUND',request.action),invoked:false,effect:null});
 let preflight;
 try{preflight=await originalPreflight()}catch{return Object.freeze({gate:denied('NEGATIVE_RAIL_ORIGINAL_PREFLIGHT_UNKNOWN',request.action),invoked:false,effect:null})}
 if(preflight?.ok!==true||preflight?.ownerVerified!==true)return Object.freeze({gate:denied('NEGATIVE_RAIL_ORIGINAL_PREFLIGHT_UNVERIFIED',request.action),invoked:false,effect:null});
 // This invocation alone is not a receipt: consumers must validate returned original owner bytes.
 try{return Object.freeze({gate,invoked:true,effect:await invoke()});}
 catch{return Object.freeze({gate:denied('NEGATIVE_RAIL_EFFECT_OUTCOME_UNKNOWN',request.action),invoked:true,effect:null})}
}
