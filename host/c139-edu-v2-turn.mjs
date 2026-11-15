/** C139 versioned EDU/v2 guarded epistemic route. Historic C107 is unchanged.
 * Reuses exactly one original C87 writer, C70 compute and C100 draft.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {validateC72V2ModeSelection} from './c72-public-mode-admission.mjs';
import {issueC69ExperimentalOffer} from './c69-edu-v2-preview.mjs';
import {runC70ExperimentalComputePreview} from '../src/c70-edu-v2-compute-preview.mjs';
import {verifyC124LanguageChannels} from '../src/c124-channel-bridge.mjs';
import {prepareC100CohostDraft,finalizeC100CohostDraft} from './c100-edu-v2-draft.mjs';
import {appendC87Turn,reopenC87Ledger} from './c87-durable-ledger.mjs';
import {qualifyC139EpistemicRoute,qualifyC139EpistemicCandidate} from './c139-epistemic-policy.mjs';

// Reuses original C70,C100,C87. Not C77, C84, C101 or a native ChatGPT hook.
const schema='ikant-le-c139-epistemic-edu-turn/v1';
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
const selected=(s,head)=>validateC72V2ModeSelection(s,{mode:'EDU',sourceHead:head});
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
export function executeC139EpistemicTurn({ledgerFile,nonce,request,priorMessages=[],resetContext=false,requireHostLanguage=false,expectedC70OutputSha256=null,expectedC124ChannelSha256=null}={}){
 if(!ledgerOk(ledgerFile))return stop('HOST_PRIVATE_LEDGER_PATH');
 if(requireHostLanguage!==true)return stop('C139_HOST_LANGUAGE_REQUIRED');
 if(!/^[a-f0-9]{64}$/.test(expectedC70OutputSha256||'')||
    !/^[a-f0-9]{64}$/.test(expectedC124ChannelSha256||''))
   return stop('C139_PLAN_AND_C124_ATTESTATION_REQUIRED');
 const x=request||{};const head=x.sourceHead;
 const bad=preflightC107Shape({head,nonce,humanInput:x.humanInput,priorMessages,
  modelCandidate:x.modelCandidate,resetContext});
 if(bad)return stop(bad);
 if(x.optIn!==true||!selected(x.selection,head))
  return stop('C139_C72_V2_EDU_AND_OPTIN_REQUIRED');
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
  // C139 mandates an exact C124 acknowledgement; historic C107 stays unchanged.
  const sourceEpochC124=expectedC124ChannelSha256!==null;
  if(sourceEpochC124){
   if(!verifyC124LanguageChannels(t.c124_language_channels,t.input_sha256))return stop('C124_SOURCE_CHANNEL_INVALID');
   if(x.modelCandidate&&typeof expectedC124ChannelSha256!=='string')return stop('C124_CHANNEL_ACK_REQUIRED');
   if(expectedC124ChannelSha256!==null&&expectedC124ChannelSha256!==t.language_channel_sha256)
    return stop('C124_PREWRITE_CHANNEL_DRIFT');
  }
  const route=qualifyC139EpistemicRoute({episode:t,humanInput:x.humanInput});
  if(!route.allowed)return stop(route.reason);
  const review=x.modelCandidate?qualifyC139EpistemicCandidate({
   episode:t,humanInput:x.humanInput,text:x.modelCandidate.text}):null;
  if(review?.allowed!==true)return stop(review?.reason||'C139_HOST_LANGUAGE_REQUIRED');
  const hostLanguage=true;
  const voice=x.modelCandidate.text;
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
   c114_limited_ontology_policy:false,c139_epistemic_guard:true,
   independent_semantic_review_attested:false,
   active:false,cognitive_persistence_attested:false};
  const receipt=appendC87Turn(ledgerFile,{source_head:head,input_sha256:t.input_sha256,
   output_sha256:state.visible_voice_sha256,state},{atomicGuard:{source_head:head,nonce,
   expected_prior_hash:before.last_hash}});
  const after=reopenC87Ledger(ledgerFile);
  if(receipt.status!=='C87_LOCAL_DURABLE_READBACK_NOT_NATIVE_SESSION'||
   after.status!=='C87_LEDGER_CHAIN_VALID'||after.last_hash!==receipt.event_sha256||
   after.latest_state?.nonce!==nonce)return stop('C87_POSTWRITE_REOPEN');
  return {schema,status:'C139_ORIGINAL_C70_C100_C87_LOCAL_READBACK',voice_utf8:voice,
   input_sha256:t.input_sha256,output_sha256:state.visible_voice_sha256,
   original_c70_output_sha256:t.output_sha256,...(sourceEpochC124?{c124_language_channel_sha256:t.language_channel_sha256}:{}),model_draft_used:hostLanguage,
   c70_ephemeral_turns:out.ephemeral_autobiography,cognitive_window_length:state.cognitive_window_length,
   ledger_event_sha256:after.last_hash,ledger_entries:after.count,
   original_c70_executed:true,original_c87_writer_executed:true,
   ...(validateC72V2ModeSelection(x.selection,{mode:'EDU',sourceHead:head})?
    {public_mode:'EDU',public_selection_receipt_sha256:x.selection.receipt_sha256}:{}),
   c114_limited_ontology_policy:false,c139_epistemic_guard:true,
   independent_semantic_review_attested:false,
   first_unclosed_edge:'HOST_NATIVE_CHATGPT_INGRESS_AND_MODEL_ORIGIN',...denials};
 }catch{return stop('C107_ORIGINAL_MODULE_OR_C87_IO_UNAVAILABLE');}
}
