import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {validateC72ModeSelection} from './c72-unified-mode-admission.mjs';
import {validateC72V2ModeSelection} from './c72-public-mode-admission.mjs';
import {issueC69ExperimentalOffer} from './c69-edu-v2-preview.mjs';
import {runC70ExperimentalComputePreview} from '../src/c70-edu-v2-compute-preview.mjs';
import {verifyC124LanguageChannels} from '../src/c124-channel-bridge.mjs';
import {prepareC100CohostDraft,finalizeC100CohostDraft} from './c100-edu-v2-draft.mjs';
import {appendC87Turn,reopenC87Ledger} from './c87-durable-ledger.mjs';
import {qualifyC114OntologyCandidate} from './c114-ontology-language-policy.mjs';

// Reuses original C70,C100,C87. Not C77, C84, C101 or a native ChatGPT hook.
const schema='ikant-le-c107-prototype/v1';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const gitBlob=x=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+x.length+'\0'),x])).digest('hex');
const inputOk=s=>typeof s==='string'&&s.trim().length>0&&Buffer.byteLength(s,'utf8')<=600&&Buffer.from(s,'utf8').toString('utf8')===s;
const nonceOk=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{12,96}$/.test(s);
const headOk=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
const windowHash=a=>sha(JSON.stringify(a.map(x=>sha(Buffer.from(x,'utf8')))));
const denials={active:false,authority:0,canonical_runtime:false,native_event_attested:false,native_delivery_attested:false,
 source_origin_attested:false,cognitive_persistence_attested:false,model_provider_attested:false};
const stop=e=>({schema,status:'C107_STOP',first_unclosed_edge:e,...denials});
const disallow=/(?:\bpassword\s*[:=]|\bapi[_ -]?key\s*[:=]|\bbearer\s+[a-z0-9._~+-]{12,}|\bprivate[_ -]?key\s*[:=])/i;
const selected=(s,head)=>validateC72ModeSelection(s,{mode:'EXPERIMENTAL',sourceHead:head})||
  validateC72V2ModeSelection(s,{mode:'EDU',sourceHead:head});
const guarding=new Set(['CRITIQUE','HORIZON_BLOCK','PRACTICAL_REVIEW','SYNTHESIS_REPAIR']);
export function preflightC107Shape({head,nonce,humanInput,priorMessages,modelCandidate,resetContext}={}){
 if(!headOk(head)||!nonceOk(nonce)||!inputOk(humanInput)||disallow.test(humanInput))return 'SOURCE_NONCE_OR_INPUT';
 if(!Array.isArray(priorMessages)||priorMessages.length>4||priorMessages.some(x=>!inputOk(x)||disallow.test(x)))return 'BOUNDED_COGNITIVE_WINDOW';
 if(typeof resetContext!=='boolean'||resetContext&&priorMessages.length!==0)return 'RESET_OR_WINDOW';
 if(modelCandidate!==undefined&&(!modelCandidate||typeof modelCandidate!=='object'||Array.isArray(modelCandidate)||
  Object.keys(modelCandidate).sort().join(',')!=='input_sha256,text'||
  modelCandidate.input_sha256!==sha(Buffer.from(humanInput,'utf8'))||
  typeof modelCandidate.text!=='string'||!modelCandidate.text.trim()||
  Buffer.byteLength(modelCandidate.text,'utf8')>16000||disallow.test(modelCandidate.text)))return 'LANGUAGE_BINDING';
 return null;
}
function ledgerOk(f){
 try{if(typeof f!=='string'||!path.isAbsolute(f)||path.basename(f)!=='c107-observations.jsonl'||
    path.basename(path.dirname(f))!=='.ikant-host')return false;
  const d=path.dirname(f),s=fs.lstatSync(d);
  return s.isDirectory()&&!s.isSymbolicLink()&&fs.realpathSync(d)===d&&
   (!fs.existsSync(f)||fs.lstatSync(f).isFile()&&!fs.lstatSync(f).isSymbolicLink());
 }catch{return false;}
}
export function inspectC107Ledger(file){
 if(!ledgerOk(file))return stop('HOST_PRIVATE_LEDGER_PATH');
 try{const r=reopenC87Ledger(file);return r.status==='C87_LEDGER_CHAIN_VALID'?
  {schema,status:'C107_LEDGER_REOPENED',count:r.count,last_hash:r.last_hash,latest_state:r.latest_state,...denials}:
  stop('C87_LEDGER_INVALID');}catch{return stop('C87_LEDGER_TAMPER_OR_IO');}
}
export function executeC107Turn({ledgerFile,nonce,request,priorMessages=[],resetContext=false,requireHostLanguage=false,expectedC70OutputSha256=null,expectedC124ChannelSha256=null}={}){
 if(!ledgerOk(ledgerFile))return stop('HOST_PRIVATE_LEDGER_PATH');
 if(typeof requireHostLanguage!=='boolean')return stop('HOST_LANGUAGE_REQUIRED_FLAG');
 const x=request||{};const head=x.sourceHead;
 const bad=preflightC107Shape({head,nonce,humanInput:x.humanInput,priorMessages,
  modelCandidate:x.modelCandidate,resetContext});
 if(bad)return stop(bad);
 if(x.optIn!==true||!selected(x.selection,head))
  return stop('C72_EXPERIMENTAL_AND_SEPARATE_OPTIN_REQUIRED');
 try{
  const before=reopenC87Ledger(ledgerFile);
  if(before.status!=='C87_LEDGER_CHAIN_VALID'||before.latest_state?.source_head&&before.latest_state.source_head!==head)
   return stop('C87_SOURCE_EPOCH_OR_INTEGRITY');
  if(before.count===0&&priorMessages.length!==0)return stop('NO_PRIOR_LEDGER_TO_BIND_CONTEXT');
  if(before.count>0&&!resetContext&&before.latest_state?.next_window_sha256!==windowHash(priorMessages))
   return stop('COGNITIVE_WINDOW_NOT_BOUND_TO_LEDGER');
  const readme=fs.readFileSync(new URL('../README.md',import.meta.url));
  const out=runC70ExperimentalComputePreview({sourceHead:head,unifiedSelection:x.selection,
   offer:issueC69ExperimentalOffer({sourceHead:head}),
   sourceObject:{path:'README.md',blob_sha1:gitBlob(readme),content_base64:readme.toString('base64')},
   messages:[...priorMessages,x.humanInput]});
  if(out.status!=='EXPERIMENTAL_COMPUTE_PREVIEW'||out.executed_repository_kernel!==true||
   out.turns?.length!==priorMessages.length+1)return stop('ORIGINAL_C70_NOT_EXECUTED');
  const t=out.turns.at(-1);
  if(t.input_sha256!==sha(Buffer.from(x.humanInput,'utf8'))||
   t.output_sha256!==sha(Buffer.from(t.demonstration_surface,'utf8'))||t.node_dispatch_input_bound!==true)
   return stop('ORIGINAL_C70_SAME_INPUT_BINDING');
  if(expectedC70OutputSha256!==null&&
   (typeof expectedC70OutputSha256!=='string'||expectedC70OutputSha256!==t.output_sha256))
   return stop('C107_COMPUTE_FIRST_C70_PLAN_DRIFT');
  // C124 binding is mandatory ONLY for the new source epoch, never for frozen C107.
  // C124 verification is explicitly activated by the verified composite owner;
  // legacy main-head packages must remain backward-compatible.
  const sourceEpochC124=expectedC124ChannelSha256!==null;
  if(sourceEpochC124){
   if(!verifyC124LanguageChannels(t.c124_language_channels,t.input_sha256))return stop('C124_SOURCE_CHANNEL_INVALID');
   if(x.modelCandidate&&typeof expectedC124ChannelSha256!=='string')return stop('C124_CHANNEL_ACK_REQUIRED');
   if(expectedC124ChannelSha256!==null&&expectedC124ChannelSha256!==t.language_channel_sha256)
    return stop('C124_PREWRITE_CHANNEL_DRIFT');
  }
  const guarded=guarding.has(t.central_mode)||t.method==='DIRECT_IDENTITY'||
   t.response_family==='SELF_ONTOLOGY'||t.resource_gap===true;
  const ontologyReview=x.modelCandidate&&guarded?qualifyC114OntologyCandidate({
   episode:t,text:x.modelCandidate.text}):null;
  const ontologyLimited=ontologyReview?.allowed===true;
  const hostLanguage=!!x.modelCandidate&&(!guarded||ontologyLimited);
  if(requireHostLanguage&&!hostLanguage)return stop(ontologyReview?.reason||'HOST_LANGUAGE_GUARDED_NO_LEDGER_APPEND');
  const voice=hostLanguage?x.modelCandidate.text:t.demonstration_surface;
  const plan=prepareC100CohostDraft({sourceHead:head,selection:x.selection,humanInput:x.humanInput,optIn:true});
  const bound=finalizeC100CohostDraft({plan,planSha256:plan.plan_sha256,modelText:voice});
  if(bound.status!=='C100_MODEL_DRAFT_UNATTESTED_NOT_OWNER'||
   bound.bound_input_sha256!==t.input_sha256||bound.bound_output_sha256!==sha(Buffer.from(voice,'utf8')))
   return stop('C100_VISIBLE_VOICE_BINDING');
  const nextWindow=[...priorMessages,x.humanInput].slice(-4);
  const state={schema:'ikant-le-c107-observation/v1',source_head:head,nonce,
   previous_window_sha256:windowHash(priorMessages),next_window_sha256:windowHash(nextWindow),
   c70_last_episode_hash:out.ephemeral_last_episode_hash||null,
   cognitive_window_length:priorMessages.length+1,source_c70_sha256:t.output_sha256,
   ...(validateC72V2ModeSelection(x.selection,{mode:'EDU',sourceHead:head})?
    {admission_schema:'ikant-le-c72-public-selection/v2',public_selection_receipt_sha256:x.selection.receipt_sha256}:{}),
   ...(sourceEpochC124?{c124_language_channel_sha256:t.language_channel_sha256}:{}),
   visible_voice_sha256:sha(Buffer.from(voice,'utf8')),host_language_used:hostLanguage,
   c114_limited_ontology_policy:ontologyLimited,independent_semantic_review_attested:false,
   active:false,cognitive_persistence_attested:false};
  const receipt=appendC87Turn(ledgerFile,{source_head:head,input_sha256:t.input_sha256,
   output_sha256:state.visible_voice_sha256,state},{atomicGuard:{source_head:head,nonce,
   expected_prior_hash:before.last_hash}});
  const after=reopenC87Ledger(ledgerFile);
  if(receipt.status!=='C87_LOCAL_DURABLE_READBACK_NOT_NATIVE_SESSION'||
   after.status!=='C87_LEDGER_CHAIN_VALID'||after.last_hash!==receipt.event_sha256||
   after.latest_state?.nonce!==nonce)return stop('C87_POSTWRITE_REOPEN');
  return {schema,status:'C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK',voice_utf8:voice,
   input_sha256:t.input_sha256,output_sha256:state.visible_voice_sha256,
   original_c70_output_sha256:t.output_sha256,...(sourceEpochC124?{c124_language_channel_sha256:t.language_channel_sha256}:{}),model_draft_used:hostLanguage,
   c70_ephemeral_turns:out.ephemeral_autobiography,cognitive_window_length:state.cognitive_window_length,
   ledger_event_sha256:after.last_hash,ledger_entries:after.count,
   original_c70_executed:true,original_c87_writer_executed:true,
   ...(validateC72V2ModeSelection(x.selection,{mode:'EDU',sourceHead:head})?
    {public_mode:'EDU',public_selection_receipt_sha256:x.selection.receipt_sha256}:{}),
   c114_limited_ontology_policy:ontologyLimited,independent_semantic_review_attested:false,
   first_unclosed_edge:'HOST_NATIVE_CHATGPT_INGRESS_AND_MODEL_ORIGIN',...denials};
 }catch{return stop('C107_ORIGINAL_MODULE_OR_C87_IO_UNAVAILABLE');}
}

/** Current-turn ORIGINAL C70 compute-first guidance. No ledger write, provider
 * invocation, canonical receipt, or native host-origin attestation. A subsequent
 * C107 turn MUST verify c70_output_sha256 before its sole C87 append.
 */
export function previewC107CognitivePlan({request,priorMessages=[],resetContext=false}={}){
 const x=request||{},head=x.sourceHead;
 const bad=preflightC107Shape({head,nonce:'c107-preview-gate-001',
  humanInput:x.humanInput,priorMessages,resetContext});
 if(bad)return stop(bad);
 if(x.optIn!==true||
  !selected(x.selection,head))
  return stop('C107_COMPUTE_FIRST_C72_OPTIN_REQUIRED');
 try{
  const readme=fs.readFileSync(new URL('../README.md',import.meta.url));
  const computed=runC70ExperimentalComputePreview({
   sourceHead:head,unifiedSelection:x.selection,
   offer:issueC69ExperimentalOffer({sourceHead:head}),
   sourceObject:{path:'README.md',blob_sha1:gitBlob(readme),
    content_base64:readme.toString('base64')},
   messages:[...priorMessages,x.humanInput]});
  const last=computed.turns?.at(-1);
  if(computed.status!=='EXPERIMENTAL_COMPUTE_PREVIEW'||
   computed.executed_repository_kernel!==true||
   computed.turns.length!==priorMessages.length+1||
   last?.input_sha256!==sha(Buffer.from(x.humanInput,'utf8'))||
   last?.node_dispatch_input_bound!==true)
   return stop('C107_COMPUTE_FIRST_ORIGINAL_KERNEL_FAILED');
  return Object.freeze({schema,status:'C107_C70_PLAN_COMPUTED_NOT_LEDGERED',
   source_head:head,input_sha256:last.input_sha256,
   c70_output_sha256:last.output_sha256,
   ...(head!=='c734bf934e33703a6a1f91f0f4d5df96eec96945'?{c124_language_channels:last.c124_language_channels,c124_language_channel_sha256:last.language_channel_sha256}:{}),
   central_mode:last.central_mode,method:last.method,
   response_family:last.response_family,resource_gap:last.resource_gap,
   cognitive_window_length:computed.turns.length,
   c70_original_executed:true,preliminary_only:true,...denials});
 }catch{return stop('C107_COMPUTE_FIRST_ORIGINAL_SOURCE_UNAVAILABLE');}
}
