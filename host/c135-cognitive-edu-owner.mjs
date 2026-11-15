/** C135 experimental composition. C127 is the byte owner, C107/C87 the only writer,
 * C125 the only controlled send. Composite epoch is NOT a Git commit or native hook.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {isProxy} from 'node:util/types';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {stageC107Carrier,inspectC107Carrier} from './c107-carrier-consumer.mjs';
import {stageC124Overlay,verifyC124OverlayBytes} from './c124-source-overlay.mjs';
import {qualifyC134Source,stageC134Source} from '../scripts/c134-source-epoch.mjs';
import {qualifyC126Channels} from './edu-c126-channel-qualifier.mjs';
import {compileC117SemanticGuide} from './c117-semantic-guidance.mjs';
import {createC133ShadowLanguagePort} from './c133-shadow-language-port.mjs';
import {createC125HostOutputPort} from './c125-output-port.mjs';
const H=x=>crypto.createHash('sha256').update(x).digest('hex');
const G=x=>crypto.createHash('sha1').update(Buffer.from('blob '+x.length+'\0')).update(x).digest('hex');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const nonceOk=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{12,96}$/.test(x);
const deny=first_edge=>Object.freeze({ok:false,first_edge,authority:0,active:false,native_ui_exclusive:false});
const own=x=>{
 if(!x||typeof x!=='object'||Array.isArray(x)||isProxy(x))return false;
 const proto=Object.getPrototypeOf(x);if(proto!==Object.prototype&&proto!==null)return false;
 const d=Object.getOwnPropertyDescriptors(x);
 return Reflect.ownKeys(d).every(k=>typeof k==='string'&&Object.hasOwn(d[k],'value'));
};
function safeDeep(v,depth=0){
 if(depth>10)return false;
 if(v===null||typeof v==='string'||typeof v==='boolean')return true;
 if(typeof v==='number')return Number.isFinite(v);
 if(typeof v!=='object'||isProxy(v))return false;
 try{
  if(Array.isArray(v)){
   const ds=Object.getOwnPropertyDescriptors(v);
   if(v.length>16||Reflect.ownKeys(ds).length!==v.length+1)return false;
   for(let i=0;i<v.length;i++)
    if(!ds[i]||!Object.hasOwn(ds[i],'value')||!safeDeep(ds[i].value,depth+1))return false;
   return true;
  }
  if(!own(v))return false;
  const ds=Object.getOwnPropertyDescriptors(v);
  return Reflect.ownKeys(ds).length<=36&&
    Reflect.ownKeys(ds).every(k=>safeDeep(ds[k].value,depth+1));
 }catch{return false}
}
function independent(root,ledger){
 const p=spawnSync(process.execPath,['scripts/c107-turn-cli.mjs',ledger],{
  cwd:root,encoding:'utf8',input:JSON.stringify({action:'INSPECT'}),
  timeout:15000,maxBuffer:1000000});
 if(p.error||p.status!==0||p.signal)return null;
 try{return JSON.parse(p.stdout)}catch{return null}
}
/** Internal C129 path. Revalidate captured source; never accept caller flags as native provenance. */
export async function createC135CognitiveSession({sourceCapture,privateParent,languagePort,send,afterAcceptWitness}={}){
 if(!own(sourceCapture)||!Buffer.isBuffer(sourceCapture.carrierBytes)||
    !own(sourceCapture.c124OverlayBytes)||sourceCapture.single_inode_readback_verified!==true||
    !inspectC107Carrier(sourceCapture.carrierBytes).ok||
    !verifyC124OverlayBytes(sourceCapture.c124OverlayBytes).ok)return deny('C135_C127_CAPTURE_UNVERIFIED');
 if(!own(afterAcceptWitness)||afterAcceptWitness.accepted!==true||
    afterAcceptWitness.scope!=='HOST_WITNESSED_ONLY'||typeof languagePort!=='function'||
    typeof send!=='function'||typeof privateParent!=='string'||!path.isAbsolute(privateParent))
    return deny('C135_ORIGINAL_POST_ACCEPT_REQUIRED');
 const version=qualifyC134Source();if(!version.ok)return deny(version.edge);
 const output=createC125HostOutputPort({send,afterAcceptWitness});
 if(!output.ok)return deny(output.reason);
 let staging=null,closed=false,busy=false;const seen=new Set();
 try{
  const original=stageC107Carrier(sourceCapture.carrierBytes,{parent:privateParent});
  if(!original.ok)throw Error('C135_C107_SOURCE_STAGING');
  staging=original.install_root;
  const c124=stageC124Overlay(staging,sourceCapture.c124OverlayBytes);
  if(!c124.ok||c124.stage_reopened!==true)throw Error(c124.first_edge||'C135_C124_STAGE_FAILED');
  // C134's fourth region is HOST-side code, not a C107 carrier member.
  // Make its historic bytes explicit before the original C134 four-blob check.
  const fourth='host/edu-c70-method-v7.mjs';
  const b=fs.readFileSync(path.join(root,fourth)),expected=version.members.find(m=>m.path===fourth);
  if(!expected||G(b)!==expected.original_git_blob_sha1)throw Error('C135_HISTORIC_HOST_DRIVER_DRIFT');
  fs.writeFileSync(path.join(staging,fourth),b,{flag:'wx',mode:0o600});
  fs.writeFileSync(path.join(staging,'.c134-isolated-fixture'),'C135_ISOLATED_STAGE_ONLY\n',{flag:'wx',mode:0o600});
  const adopted=stageC134Source({isolatedRoot:staging});
  if(!adopted.ok||adopted.source_epoch!==version.composite_epoch_id)
   throw Error(adopted.edge||'C135_COMPOSITE_STAGE_DENIED');
  const load=async p=>import(pathToFileURL(path.join(staging,p)).href);
  const [owner,c72,c114]=await Promise.all([load('host/c107-experimental-turn.mjs'),
     load('host/c72-unified-mode-admission.mjs'),load('host/c114-ontology-language-policy.mjs')]);
  const ledgerDir=path.join(staging,'.ikant-host');fs.mkdirSync(ledgerDir,{mode:0o700});
  const ledger=path.join(ledgerDir,'c107-observations.jsonl');
  const language=createC133ShadowLanguagePort(languagePort);
  const stop=async(id,edge,notes)=>output.publish({eventId:id,frame:{kind:'BLOCKED',
    mode:'EXPERIMENTAL',trace:'NOT_SAVED',continuity:'HOST_LOCAL_ONLY',
    edge,next:'RECONCILE_OWNER',hostNotes:notes}});
  async function publishTurn({frame,hostNotes=null}={}){
   if(closed||busy)return deny(closed?'C135_SESSION_CLOSED':'C135_CONCURRENT_DENIED');
   if(!safeDeep(frame)||!nonceOk(frame.nonce)||seen.has(frame.nonce))return deny('C135_NONCE_OR_FRAME_INVALID');
   const id=frame.nonce;seen.add(id);busy=true;
   try{
    if(Object.keys(frame).some(k=>!['humanInput','nonce','selection','priorMessages','resetContext','authorization'].includes(k))||
      typeof frame.humanInput!=='string'||!frame.humanInput.trim()||Buffer.byteLength(frame.humanInput,'utf8')>600||
      !own(frame.authorization)||frame.authorization.human_mode_selected!==true||
      frame.authorization.opt_in_confirmed!==true||frame.authorization.separate_cohost_draft_authorized!==true||
      !['HOST_TEXT_WITNESSED','LOCAL_TEST_FIXTURE'].includes(frame.authorization.provenance)||
      !Array.isArray(frame.priorMessages)||frame.priorMessages.length>4||
      frame.priorMessages.some(s=>typeof s!=='string'||!s.trim()||Buffer.byteLength(s,'utf8')>600)||
      typeof frame.resetContext!=='boolean'||(frame.resetContext&&frame.priorMessages.length!==0)||
      !c72.validateC72ModeSelection(frame.selection,{mode:'EXPERIMENTAL',sourceHead:version.composite_epoch_id}))
      return await stop(id,'C135_FRAME_OR_C72_DENIED',hostNotes);
    const req={sourceHead:version.composite_epoch_id,selection:frame.selection,humanInput:frame.humanInput,optIn:true};
    const preview=owner.previewC107CognitivePlan({request:req,priorMessages:frame.priorMessages,resetContext:frame.resetContext});
    if(preview.status!=='C107_C70_PLAN_COMPUTED_NOT_LEDGERED'||preview.c70_original_executed!==true||
       preview.input_sha256!==H(Buffer.from(frame.humanInput,'utf8')))
      return await stop(id,'C135_C70_PREVIEW_DENIED',hostNotes);
    const c126=qualifyC126Channels(preview.c124_language_channels,
       {inputSha256:preview.input_sha256,channelSha256:preview.c124_language_channel_sha256});
    if(!c126.ok||c126.channels!==12)return await stop(id,c126.first_edge||'C135_C126_DENIED',hostNotes);
    const plan=Object.freeze({schema:'ikant-le-c107-c70-before-language/v1',
      input_sha256:preview.input_sha256,c70_output_sha256:preview.c70_output_sha256,
      central_mode:preview.central_mode,method:preview.method,response_family:preview.response_family,
      resource_gap:preview.resource_gap,cognitive_window_length:preview.cognitive_window_length});
    const guidance=compileC117SemanticGuide(plan);
    let draft;
    try{draft=await language(Object.freeze({schema:'ikant-edu-c70-language-task/v7',
      source_head:version.composite_epoch_id,current_input_utf8:frame.humanInput,
      prior_messages_utf8:Object.freeze([...frame.priorMessages]),plan,guidance,
      c124_channels:preview.c124_language_channels,c124_channel_sha256:preview.c124_language_channel_sha256,
      statement:'Structural language obligations, not proof of LLM efficacy.'}));}
    catch{return await stop(id,'C135_HOST_LANGUAGE_FAILURE',hostNotes)}
    if(closed)return deny('C135_DISPOSED_NO_EMIT');
    if(!own(draft)||Object.keys(draft).sort().join(',')!=='ack_c124_channel_sha256,ack_plan_sha256,input_sha256,text'||
      typeof draft.text!=='string'||!draft.text.trim()||Buffer.byteLength(draft.text,'utf8')>16000||
      draft.input_sha256!==preview.input_sha256||draft.ack_plan_sha256!==guidance.plan_sha256||
      draft.ack_c124_channel_sha256!==preview.c124_language_channel_sha256)
      return await stop(id,'C135_C124_PLAN_ACK_DENIED',hostNotes);
    const policy=c114.scopeC134Referent(frame.humanInput)==='SOFTWARE_SELF'?
      c114.qualifyC114OntologyCandidate({episode:plan,text:draft.text}):
      c114.qualifyC134NonSelfCandidate({text:draft.text});
    if(policy.allowed!==true)return await stop(id,policy.reason||'C135_GUARD_DENIED',hostNotes);
    const before=independent(staging,ledger);
    if(before?.status!=='C107_LEDGER_REOPENED')return await stop(id,'C135_PREWRITE_REOPEN_DENIED',hostNotes);
    const turn=owner.executeC107Turn({ledgerFile:ledger,nonce:id,
      request:{...req,modelCandidate:{text:draft.text,input_sha256:preview.input_sha256}},
      priorMessages:frame.priorMessages,resetContext:frame.resetContext,requireHostLanguage:true,
      expectedC70OutputSha256:preview.c70_output_sha256,
      expectedC124ChannelSha256:preview.c124_language_channel_sha256});
    if(turn.status!=='C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK'||turn.voice_utf8!==draft.text||
       turn.output_sha256!==H(Buffer.from(draft.text,'utf8'))||!turn.original_c87_writer_executed||
       !turn.original_c70_executed||turn.c124_language_channel_sha256!==preview.c124_language_channel_sha256)
      return await stop(id,turn.first_unclosed_edge||'C135_C107_WRITER_DENIED',hostNotes);
    const after=independent(staging,ledger);
    if(after?.status!=='C107_LEDGER_REOPENED'||after.count!==before.count+1||
       after.last_hash!==turn.ledger_event_sha256||after.latest_state?.nonce!==id||
       after.latest_state?.source_head!==version.composite_epoch_id||
       after.latest_state?.source_c70_sha256!==preview.c70_output_sha256||
       after.latest_state?.c124_language_channel_sha256!==preview.c124_language_channel_sha256||
       after.latest_state?.visible_voice_sha256!==turn.output_sha256||
       after.latest_state?.host_language_used!==true)
      return await stop(id,'C135_INDEPENDENT_READBACK_MISMATCH',hostNotes);
    // The receipt is authentic C135, not a forged PR119 wrapper.
    const receipt=Object.freeze({schema:'ikant-c135-owner-evidence/v1',
      status:'C135_ORIGINAL_C107_C87_BOUND',source_epoch:version.composite_epoch_id,
      source_kind:'EXPERIMENTAL_COMPOSITE_NOT_GIT_COMMIT',active:false,
      input_sha256:preview.input_sha256,original_turn:turn,
      surface_a:{origin:'HOST_BOUND',voice_utf8:turn.voice_utf8},
      c126_status:c126.status,c126_channels:c126.channels,c134_source_verified:true,
      single_c87_writer:true,native_chatgpt_origin_attested:false});
    return await output.publish({eventId:id,frame:{kind:'OWNER_VOICE',mode:'EXPERIMENTAL',
      trace:after.last_hash,continuity:'C87_INDEPENDENT_REOPEN',
      edge:'NATIVE_CHATGPT_PER_TURN_DISPATCH',next:'QUALIFY_NATIVE_HOOK',
      nonce:id,input_sha256:preview.input_sha256,ownerReceipt:receipt,
      independentReadback:after,hostNotes}});
   }finally{busy=false}
  }
  function close(){if(!closed){closed=true;output.close();fs.rmSync(staging,{recursive:true,force:true})}}
  return Object.freeze({ok:true,runtime_ready:true,source_head:version.composite_epoch_id,
    source_kind:'EXPERIMENTAL_COMPOSITE_NOT_GIT_COMMIT',legacy_cache_unchanged:true,
    native_ui_exclusive:false,active:false,manual_only:true,
    publishTurn,close,status:()=>Object.freeze({closed,busy,attempted_events:seen.size,port:output.status()})});
 }catch(e){if(staging)fs.rmSync(staging,{recursive:true,force:true});output.close();
  return deny(e?.message?.slice(0,100)||'C135_INIT_DENIED')}
}
