/** C140 opt-in, topic-neutral EDU route. C70 is NOT run: never invent its receipt.
 * This is one versioned child of C135; C100/C87 are reused, C125 owns delivery.
 * Text budgets are technical caps, not permitted-topic vocabularies.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {validateC72V2ModeSelection} from './c72-public-mode-admission.mjs';
import {prepareC100CohostDraft,finalizeC100CohostDraft} from './c100-edu-v2-draft.mjs';
import {appendC87Turn,reopenC87Ledger} from './c87-durable-ledger.mjs';
import {classifyC141IdentityIntent} from './c141-semantic-shadow.mjs';
const sha=s=>crypto.createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const good=s=>typeof s==='string'&&s.trim()&&Buffer.byteLength(s,'utf8')<=12000&&Buffer.from(s,'utf8').toString('utf8')===s;
const nonce=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{12,96}$/.test(s);
const control=/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u;
const secret=/\b(?:password\s*[:=]|api[_ -]?key\s*[:=]|bearer\s+[A-Za-z0-9_-]{12,}|private[_ -]?key\s*[:=])/iu;
const overclaim=/\b(?:sono\s+(?:davvero\s+)?(?:cosciente|senziente|una\s+persona)|i\s+am\s+(?:conscious|sentient)|ho\s+(?:accesso\s+diretto\s+(?:ai\s+)?(?:pesi|stati\s+interni)|memoria\s+persistente)|native\s+event\s+attested|canonical\s+active)\b/iu;
const stop=first_unclosed_edge=>Object.freeze({status:'C140_STOP',first_unclosed_edge,active:false,native_event_attested:false});
const windowHash=a=>sha(JSON.stringify(a.map(sha)));
export function c140OpenPolicy({humanInput,text}={}){
 if(!good(humanInput)||control.test(humanInput)||secret.test(humanInput))return stop('C140_INPUT_RESOURCE_OR_PRIVACY');
 // Owner C114 must retain both direct and indirect self-identity before any C100/C87 effect.
 if(classifyC141IdentityIntent(humanInput).self_reference)return stop('C140_SELF_IDENTITY_OWNER_BOUNDED_STOP');
 if(text!==undefined&&(!good(text)||Buffer.byteLength(text,'utf8')>16000||control.test(text)||overclaim.test(text.normalize('NFKC'))))
  return stop('C140_DRAFT_OVERCLAIM_OR_SHAPE');
 return Object.freeze({allowed:true,epistemic_method:'EVIDENCE_INFERENCE_UNCERTAINTY_FALSIFIABILITY',
  topic_whitelist:false,semantic_truth_attested:false,model_internal_access_attested:false,active:false});
}
export function planC140OpenTurn({humanInput,sourceHead,selection,priorMessages=[],resetContext=false}={}){
 if(!c140OpenPolicy({humanInput}).allowed||!Array.isArray(priorMessages)||priorMessages.length>4||
  priorMessages.some(x=>!c140OpenPolicy({humanInput:x}).allowed)||
  typeof resetContext!=='boolean'||resetContext&&priorMessages.length)return stop('C140_FRAME_OR_WINDOW_DENIED');
 if(!validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead}))return stop('C140_EDU_V2_SELECTION_REQUIRED');
 const p=prepareC100CohostDraft({sourceHead,selection,humanInput,optIn:true});
 if(p.status!=='C100_COHOST_PLAN_READY_UNATTESTED')return stop('C140_ORIGINAL_C100_PLAN_DENIED');
 return Object.freeze({status:'C140_PLAN_UNLEDGERED',input_sha256:sha(humanInput),
  plan_sha256:p.plan_sha256,c100_plan:p,previous_window_sha256:windowHash(priorMessages),
  cognitive_window_length:priorMessages.length+1,original_c70_executed:false,
  topic_whitelist:false,source_head:sourceHead,active:false});
}
export function executeC140OpenTurn({ledgerFile,nonce:nonceValue,request,priorMessages=[],resetContext=false,modelCandidate,expectedPlanSha256}={}){
 const x=request||{};
 if(!nonce(nonceValue)||typeof ledgerFile!=='string'||!path.isAbsolute(ledgerFile)||
  path.basename(ledgerFile)!=='c107-observations.jsonl'||path.basename(path.dirname(ledgerFile))!=='.ikant-host')
  return stop('C140_NONCE_OR_LEDGER_PATH');
 try{
  const dir=path.dirname(ledgerFile);if(fs.realpathSync(dir)!==dir||fs.lstatSync(dir).isSymbolicLink()||
    (fs.existsSync(ledgerFile)&&(!fs.lstatSync(ledgerFile).isFile()||fs.lstatSync(ledgerFile).isSymbolicLink())))return stop('C140_LEDGER_PATH_UNSAFE');
  if(x.optIn!==true)return stop('C140_OPTIN_REQUIRED');
  const plan=planC140OpenTurn({humanInput:x.humanInput,sourceHead:x.sourceHead,selection:x.selection,priorMessages,resetContext});
  if(plan.status!=='C140_PLAN_UNLEDGERED'||plan.plan_sha256!==expectedPlanSha256)return stop('C140_PLAN_DRIFT');
  if(!modelCandidate||modelCandidate.input_sha256!==plan.input_sha256||
    modelCandidate.ack_plan_sha256!==plan.plan_sha256||!c140OpenPolicy({humanInput:x.humanInput,text:modelCandidate.text}).allowed)
    return stop('C140_MODEL_ACK_OR_LANGUAGE_DENIED');
  const bound=finalizeC100CohostDraft({plan:plan.c100_plan,planSha256:plan.plan_sha256,modelText:modelCandidate.text});
  if(bound.status!=='C100_MODEL_DRAFT_UNATTESTED_NOT_OWNER'||bound.bound_input_sha256!==plan.input_sha256)return stop('C140_C100_BINDING_DENIED');
  const before=reopenC87Ledger(ledgerFile);
  if(before.status!=='C87_LEDGER_CHAIN_VALID'||before.latest_state?.source_head&&before.latest_state.source_head!==x.sourceHead||
    before.count===0&&priorMessages.length||before.count>0&&!resetContext&&
    before.latest_state?.next_window_sha256!==plan.previous_window_sha256)return stop('C140_C87_PREWRITE_CONTINUITY');
  const state={schema:'ikant-le-c107-observation/v1',source_head:x.sourceHead,nonce:nonceValue,
   previous_window_sha256:plan.previous_window_sha256,
   next_window_sha256:windowHash([...priorMessages,x.humanInput].slice(-4)),
   cognitive_window_length:plan.cognitive_window_length,
   admission_schema:'ikant-le-c72-public-selection/v2',public_selection_receipt_sha256:x.selection.receipt_sha256,
   visible_voice_sha256:sha(modelCandidate.text),host_language_used:true,c140_open_route:true,
   c140_original_c70_executed:false,c114_limited_ontology_policy:false,c139_epistemic_guard:false,
   independent_semantic_review_attested:false,active:false,cognitive_persistence_attested:false};
  const receipt=appendC87Turn(ledgerFile,{source_head:x.sourceHead,input_sha256:plan.input_sha256,
   output_sha256:state.visible_voice_sha256,state},{atomicGuard:{source_head:x.sourceHead,nonce:nonceValue,
    expected_prior_hash:before.last_hash}});
  const after=reopenC87Ledger(ledgerFile);
  if(receipt.status!=='C87_LOCAL_DURABLE_READBACK_NOT_NATIVE_SESSION'||after.status!=='C87_LEDGER_CHAIN_VALID'||
    after.count!==before.count+1||after.last_hash!==receipt.event_sha256||after.latest_state?.nonce!==nonceValue)
   return stop('C140_C87_POSTWRITE_UNKNOWN_STOP');
  return {status:'C140_ORIGINAL_C100_C87_LOCAL_READBACK',voice_utf8:modelCandidate.text,
   input_sha256:plan.input_sha256,output_sha256:state.visible_voice_sha256,
   ledger_event_sha256:after.last_hash,ledger_entries:after.count,
   public_mode:'EDU',public_selection_receipt_sha256:x.selection.receipt_sha256,
   original_c70_executed:false,original_c87_writer_executed:true,model_draft_used:true,
   c140_open_route:true,independent_semantic_review_attested:false,active:false,native_event_attested:false};
 }catch{return stop('C140_PRE_OR_POSTWRITE_UNKNOWN_STOP_RECONCILE')}
}
