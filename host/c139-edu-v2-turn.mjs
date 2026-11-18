/** Versioned EDU turn implementation for C139 and C143 only.
 * Frozen C107/C114/C87/C70/C100 sources are not modified.
 * Selection is a closed two-route switch, not a caller-injected policy.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {preflightC107Shape} from './c107-edu-v2-turn.mjs';
export {preflightC107Shape};
import {validateC72V2ModeSelection} from './c72-public-mode-admission.mjs';
import {issueC69ExperimentalOffer} from './c69-edu-v2-preview.mjs';
import {runC70ExperimentalComputePreview} from '../src/c70-edu-v2-compute-preview.mjs';
import {verifyC124LanguageChannels} from '../src/c124-channel-bridge.mjs';
import {prepareC100CohostDraft,finalizeC100CohostDraft} from './c100-edu-v2-draft.mjs';
import {appendC87Turn,reopenC87Ledger} from './c87-durable-ledger.mjs';
import {qualifyC139EpistemicRoute,qualifyC139EpistemicCandidate} from './c139-epistemic-policy.mjs';
import {qualifyC143RestrictedRoute,qualifyC143Candidate} from './c143-guarded-nonidentity-policy.mjs';
const SCHEMAS=Object.freeze({C139:'ikant-le-c139-epistemic-edu-turn/v1',C143:'ikant-le-c143-guarded-edu-turn/v1'});

// Reuses original C70,C100,C87. Not C77, C84, C101 or a native ChatGPT hook.
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const gitBlob=x=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+x.length+'\0'),x])).digest('hex');
const windowHash=a=>sha(JSON.stringify(a.map(x=>sha(Buffer.from(x,'utf8')))));
const denials={active:false,authority:0,canonical_runtime:false,native_event_attested:false,native_delivery_attested:false,
 source_origin_attested:false,cognitive_persistence_attested:false,model_provider_attested:false};
const stop=(schema,e)=>({schema,status:'C107_STOP',first_unclosed_edge:e,...denials});
function ledgerOk(f){
 try{if(typeof f!=='string'||!path.isAbsolute(f)||path.basename(f)!=='c107-observations.jsonl'||
    path.basename(path.dirname(f))!=='.ikant-host')return false;
  const d=path.dirname(f),s=fs.lstatSync(d);
  return s.isDirectory()&&!s.isSymbolicLink()&&fs.realpathSync(d)===d&&
   (!fs.existsSync(f)||fs.lstatSync(f).isFile()&&!fs.lstatSync(f).isSymbolicLink());
 }catch{return false;}
}
export function inspectVersionedEduLedger(file,mode){
 const schema=SCHEMAS[mode];if(!schema)throw Error('UNSUPPORTED_EDU_ROUTE');
 if(!ledgerOk(file))return stop(schema,'HOST_PRIVATE_LEDGER_PATH');
 try{const r=reopenC87Ledger(file);return r.status==='C87_LEDGER_CHAIN_VALID'?
  {schema,status:'C107_LEDGER_REOPENED',count:r.count,last_hash:r.last_hash,latest_state:r.latest_state,...denials}:
  stop(schema,'C87_LEDGER_INVALID');}catch{return stop(schema,'C87_LEDGER_TAMPER_OR_IO');}
}

export function executeVersionedEduTurn(mode,{ledgerFile,nonce,request,priorMessages=[],resetContext=false,requireHostLanguage=false,expectedC70OutputSha256=null,expectedC124ChannelSha256=null}={}){
 const schema=SCHEMAS[mode];if(!schema)throw Error('UNSUPPORTED_EDU_ROUTE');
 const c143=mode==='C143';const prefix=mode;const deny=e=>stop(schema,e);
 if(!ledgerOk(ledgerFile))return deny('HOST_PRIVATE_LEDGER_PATH');
 if(requireHostLanguage!==true)return deny(prefix+'_HOST_LANGUAGE_REQUIRED');
 if(!/^[a-f0-9]{64}$/.test(expectedC70OutputSha256||'')||
    !/^[a-f0-9]{64}$/.test(expectedC124ChannelSha256||''))
   return deny(prefix+'_PLAN_AND_C124_ATTESTATION_REQUIRED');
 const x=request||{};const head=x.sourceHead;
 const bad=preflightC107Shape({head,nonce,humanInput:x.humanInput,priorMessages,
  modelCandidate:x.modelCandidate,resetContext});
 if(bad)return deny(bad);
 if(x.optIn!==true||!validateC72V2ModeSelection(x.selection,{mode:'EDU',sourceHead:head}))
  return deny(prefix+'_C72_V2_EDU_AND_OPTIN_REQUIRED');
 try{
  const before=reopenC87Ledger(ledgerFile);
  if(before.status!=='C87_LEDGER_CHAIN_VALID'||before.latest_state?.source_head&&before.latest_state.source_head!==head)
   return deny('C87_SOURCE_EPOCH_OR_INTEGRITY');
  if(before.count===0&&priorMessages.length!==0)return deny('NO_PRIOR_LEDGER_TO_BIND_CONTEXT');
  if(before.count>0&&!resetContext&&before.latest_state?.next_window_sha256!==windowHash(priorMessages))
   return deny('COGNITIVE_WINDOW_NOT_BOUND_TO_LEDGER');
  const readme=fs.readFileSync(new URL('../README.md',import.meta.url));
  const out=runC70ExperimentalComputePreview({sourceHead:head,unifiedSelection:x.selection,
   offer:issueC69ExperimentalOffer({sourceHead:head}),
   sourceObject:{path:'README.md',blob_sha1:gitBlob(readme),content_base64:readme.toString('base64')},
   messages:[...priorMessages,x.humanInput]});
  if(out.status!=='EXPERIMENTAL_COMPUTE_PREVIEW'||out.executed_repository_kernel!==true||
   out.turns?.length!==priorMessages.length+1)return deny('ORIGINAL_C70_NOT_EXECUTED');
  const t=out.turns.at(-1);
  if(t.input_sha256!==sha(Buffer.from(x.humanInput,'utf8'))||
   t.output_sha256!==sha(Buffer.from(t.demonstration_surface,'utf8'))||t.node_dispatch_input_bound!==true)
   return deny('ORIGINAL_C70_SAME_INPUT_BINDING');
  // Regex preflight accepts 64-hex representations but may coerce non-strings.
  // C139 and C143 always require C124; frozen C107 retains its legacy epoch.
  if(expectedC70OutputSha256!==t.output_sha256)
   return deny('C107_COMPUTE_FIRST_C70_PLAN_DRIFT');
  if(!verifyC124LanguageChannels(t.c124_language_channels,t.input_sha256))
   return deny('C124_SOURCE_CHANNEL_INVALID');
  // RegExp.test coerces objects: retain this original denial edge for forged digest objects.
  if(x.modelCandidate&&typeof expectedC124ChannelSha256!=='string')
   return deny('C124_CHANNEL_ACK_REQUIRED');
  if(expectedC124ChannelSha256!==t.language_channel_sha256)
   return deny('C124_PREWRITE_CHANNEL_DRIFT');
  const sourceRoot=fileURLToPath(new URL('..',import.meta.url));
  // Candidate policy includes its original route check; a missing draft still
  // receives the original route-specific denial before HOST_LANGUAGE_REQUIRED.
  const policy=c143?{plan:{...t,c70_original_executed:true},humanInput:x.humanInput,sourceRoot}:
   {episode:t,humanInput:x.humanInput};
  const hasDraft=!!x.modelCandidate;
  const review=c143?
   (hasDraft?qualifyC143Candidate({...policy,text:x.modelCandidate.text}):qualifyC143RestrictedRoute(policy)):
   (hasDraft?qualifyC139EpistemicCandidate({...policy,text:x.modelCandidate.text}):qualifyC139EpistemicRoute(policy));
  if(!review.allowed)return deny(review.reason);
  if(!hasDraft)return deny(prefix+'_HOST_LANGUAGE_REQUIRED');
  const voice=x.modelCandidate.text;
  const plan=prepareC100CohostDraft({sourceHead:head,selection:x.selection,humanInput:x.humanInput,optIn:true});
  const bound=finalizeC100CohostDraft({plan,planSha256:plan.plan_sha256,modelText:voice});
  if(bound.status!=='C100_MODEL_DRAFT_UNATTESTED_NOT_OWNER'||
   bound.bound_input_sha256!==t.input_sha256||bound.bound_output_sha256!==sha(Buffer.from(voice,'utf8')))
   return deny('C100_VISIBLE_VOICE_BINDING');
  const nextWindow=[...priorMessages,x.humanInput].slice(-4);
  const state={schema:'ikant-le-c107-observation/v1',source_head:head,nonce,
   previous_window_sha256:windowHash(priorMessages),next_window_sha256:windowHash(nextWindow),
   c70_last_episode_hash:out.ephemeral_last_episode_hash||null,
   cognitive_window_length:priorMessages.length+1,source_c70_sha256:t.output_sha256,
   ...(validateC72V2ModeSelection(x.selection,{mode:'EDU',sourceHead:head})?
    {admission_schema:'ikant-le-c72-public-selection/v2',public_selection_receipt_sha256:x.selection.receipt_sha256}:{}),
   c124_language_channel_sha256:t.language_channel_sha256,
   visible_voice_sha256:sha(Buffer.from(voice,'utf8')),host_language_used:true,
   c114_limited_ontology_policy:false,...(c143?{c139_epistemic_guard:false,c143_guarded_nonidentity:true}:{c139_epistemic_guard:true}),
   independent_semantic_review_attested:false,
   active:false,cognitive_persistence_attested:false};
  const receipt=appendC87Turn(ledgerFile,{source_head:head,input_sha256:t.input_sha256,
   output_sha256:state.visible_voice_sha256,state},{atomicGuard:{source_head:head,nonce,
   expected_prior_hash:before.last_hash}});
  const after=reopenC87Ledger(ledgerFile);
  if(receipt.status!=='C87_LOCAL_DURABLE_READBACK_NOT_NATIVE_SESSION'||
   after.status!=='C87_LEDGER_CHAIN_VALID'||after.last_hash!==receipt.event_sha256||
   after.latest_state?.nonce!==nonce)return deny('C87_POSTWRITE_REOPEN');
  return {schema,status:prefix+'_ORIGINAL_C70_C100_C87_LOCAL_READBACK',voice_utf8:voice,
   input_sha256:t.input_sha256,output_sha256:state.visible_voice_sha256,
   original_c70_output_sha256:t.output_sha256,c124_language_channel_sha256:t.language_channel_sha256,model_draft_used:true,
   c70_ephemeral_turns:out.ephemeral_autobiography,cognitive_window_length:state.cognitive_window_length,
   ledger_event_sha256:after.last_hash,ledger_entries:after.count,
   original_c70_executed:true,original_c87_writer_executed:true,
   ...(validateC72V2ModeSelection(x.selection,{mode:'EDU',sourceHead:head})?
    {public_mode:'EDU',public_selection_receipt_sha256:x.selection.receipt_sha256}:{}),
   c114_limited_ontology_policy:false,...(c143?{c139_epistemic_guard:false,c143_guarded_nonidentity:true}:{c139_epistemic_guard:true}),
   independent_semantic_review_attested:false,
   first_unclosed_edge:'HOST_NATIVE_CHATGPT_INGRESS_AND_MODEL_ORIGIN',...denials};
 }catch{return deny('C107_ORIGINAL_MODULE_OR_C87_IO_UNAVAILABLE');}
}

/** Stable C139 API; C143 separately owns its route policy. */
export function inspectC107Ledger(file){return inspectVersionedEduLedger(file,'C139');}
export function executeC139EpistemicTurn(args={}){return executeVersionedEduTurn('C139',args);}
