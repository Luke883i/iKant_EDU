/** S02 genuine local EDU/v2 owner. Never casts C72/v2 to C72/v1.
 * Uses original C107->C70/C100/C87 and independent C126/C125.
 * Source HEAD is a locally VERIFIED Git commit; NOT native/provider provenance.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {isProxy} from 'node:util/types';
import {validateC72V2ModeSelection} from './c72-public-mode-admission.mjs';
import {buildC107Package,stageC107Package} from '../scripts/c107-pack.mjs';
import {qualifyC126Channels} from './edu-c126-channel-qualifier.mjs';
import {compileC117SemanticGuide} from './c117-semantic-guidance.mjs';
import {createC125HostOutputPort} from './c125-output-port.mjs';
import {projectS03CompletedEduTurn} from './s03-owner-bound-presentation.mjs';
import {qualifyHumanFacingIdentity} from './p1-public-language-guard.mjs';
import {verifyLocalProjectSource} from '../scripts/project-repo-loader.mjs';
import {reopenC87Ledger} from './c87-durable-ledger.mjs';
const sha=x=>crypto.createHash('sha256').update(Buffer.from(x,'utf8')).digest('hex');
const HEX=/^[a-f0-9]{40}$/;
const NONCE=/^[a-zA-Z0-9_-]{12,96}$/;
const no=first_edge=>Object.freeze({ok:false,first_edge,mode:'EDU',active:false,authority:0,native_event_attested:false});
const clean=x=>x&&typeof x==='object'&&!Array.isArray(x)&&!isProxy(x)&&
  Object.getPrototypeOf(x)===Object.prototype&&Reflect.ownKeys(x).every(k=>
  typeof k==='string'&&Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));
function safeDeep(v,depth=0){
 if(depth>10)return false;
 if(v===null||typeof v==='string'||typeof v==='boolean')return true;
 if(typeof v==='number')return Number.isFinite(v);
 if(typeof v!=='object'||isProxy(v))return false;
 try{
  if(Array.isArray(v)){
   const d=Object.getOwnPropertyDescriptors(v);
   if(v.length>16||Reflect.ownKeys(d).length!==v.length+1)return false;
   for(let i=0;i<v.length;i++)if(!d[i]||!Object.hasOwn(d[i],'value')||!safeDeep(d[i].value,depth+1))return false;
   return true;
  }
  if(!clean(v))return false;
  const d=Object.getOwnPropertyDescriptors(v);
  return Reflect.ownKeys(d).length<=36&&Reflect.ownKeys(d).every(k=>safeDeep(d[k].value,depth+1));
 }catch{return false}
}

function sourceVerified(sourceRoot,selection,sourceBinding=null){
 try{
  if(typeof sourceRoot!=='string'||!path.isAbsolute(sourceRoot)||
     path.resolve(sourceRoot)!==fs.realpathSync(sourceRoot))return null;
  if(sourceBinding!==null){
   if(!safeDeep(sourceBinding))return null;
   const verified=verifyLocalProjectSource(sourceRoot,{head:sourceBinding.head,tree:sourceBinding.tree});
   if(!safeDeep(selection)||!validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead:verified.source_head})||
    selection.terms_digest!==sha(fs.readFileSync(path.join(sourceRoot,'TERMS.md'),'utf8')))return null;
   return{head:verified.source_head,tree:verified.source_tree,kind:'API_GIT_TREE_BOUND_SOURCE_NOT_PROVIDER_ORIGIN',
    api_source_binding:{schema:'ikant-le-api-source-owner-binding/v1',source_head:verified.source_head,
     source_tree:verified.source_tree,readback_receipt_sha256:sha(fs.readFileSync(path.join(sourceRoot,'.project-source-readback.json'),'utf8')),
     gate:'API_GIT_TREE_AND_BLOB_REOPEN',authority:0,provider_attested:false}};
  }
  const g=args=>execFileSync('git',args,{cwd:sourceRoot,encoding:'utf8',timeout:4000}).trim();
  const head=g(['rev-parse','HEAD']),tree=g(['rev-parse','HEAD^{tree}']);
  if(!HEX.test(head)||!HEX.test(tree)||!safeDeep(selection)||
     !validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead:head})||
     selection.terms_digest!==sha(fs.readFileSync(path.join(sourceRoot,'TERMS.md'),'utf8')))return null;
  // The C107 packer independently verifies every transported runtime member
  // against its HEAD Git blob. Generated qualification receipts are not runtime
  // sources and may change in CI between select/falsify steps and npm test.
  // Other tracked modifications still fail closed before package materialization.
  const changed=g(['diff','--name-only','-z','HEAD']).split('\0').filter(Boolean);
  if(changed.some(p=>!/^artifacts\/qualification\/[A-Za-z0-9_.-]+\.json$/.test(p)))return null;
  return {head,tree};
 }catch{return null}
}
/** Original-ledger cold rebind, HOST-witnessed only: never claims native
 * persistence, resurrects a model, or replays previously published turns. */
function bindC135Recovery(resume,parent,src,selection){
 if(resume===null)return {ok:true,ledger:null,nonces:[],window:null,receipt:null};
 if(!clean(resume)||Object.keys(resume).sort().join(',')!==
    'expectedCount,expectedLastHash,ledgerFile,previousWorkerGone'||
    resume.previousWorkerGone!==true||!Number.isSafeInteger(resume.expectedCount)||
    resume.expectedCount<1||!/^[a-f0-9]{64}$/.test(resume.expectedLastHash)||
    typeof resume.ledgerFile!=='string')
   return no('S02_RECOVERY_WITNESS_INVALID');
 try{
  const file=resume.ledgerFile,dir=path.dirname(file),root=fs.realpathSync(parent);
  if(!path.isAbsolute(file)||path.basename(file)!=='c107-observations.jsonl'||
     path.basename(dir)!=='.ikant-host'||fs.realpathSync(file)!==file||
     fs.realpathSync(dir)!==dir||!fs.lstatSync(file).isFile()||
     fs.lstatSync(file).isSymbolicLink()||fs.lstatSync(file).nlink!==1||
     fs.lstatSync(dir).isSymbolicLink())return no('S02_RECOVERY_LEDGER_PATH_UNSAFE');
  const rel=path.relative(root,file);
  if(!rel||rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))
    return no('S02_RECOVERY_LEDGER_OUTSIDE_PRIVATE_ROOT');
  let ancestor=dir;
  while(ancestor!==root){
    if(fs.lstatSync(ancestor).isSymbolicLink())
      return no('S02_RECOVERY_LEDGER_PATH_UNSAFE');
    const up=path.dirname(ancestor);
    if(up===ancestor)return no('S02_RECOVERY_LEDGER_OUTSIDE_PRIVATE_ROOT');
    ancestor=up;
  }
  const r=reopenC87Ledger(file);
  if(r.status!=='C87_LEDGER_CHAIN_VALID'||r.count!==resume.expectedCount||
     r.last_hash!==resume.expectedLastHash||
     !/^[a-f0-9]{64}$/.test(r.latest_state?.next_window_sha256||''))
    return no('S02_RECOVERY_C87_READBACK_MISMATCH');
  const bytes=fs.readFileSync(file,'utf8');
  if(bytes.length>5000000||!bytes.endsWith('\n'))return no('S02_RECOVERY_LEDGER_INVALID');
  const events=bytes.trimEnd().split('\n').map(JSON.parse);
  const seen=new Set();
  for(const e of events){
    const st=e.state;
    if(e.source_head!==src.head||st?.source_head!==src.head||
       st?.admission_schema!=='ikant-le-c72-public-selection/v2'||
       st?.public_selection_receipt_sha256!==selection.receipt_sha256||
       !NONCE.test(st?.nonce||'')||seen.has(st.nonce)||
       e.output_sha256!==st.visible_voice_sha256)
      return no('S02_RECOVERY_EPOCH_OR_NONCE_MISMATCH');
    seen.add(st.nonce);
  }
  const again=reopenC87Ledger(file);
  if(again.status!=='C87_LEDGER_CHAIN_VALID'||again.last_hash!==r.last_hash||
     again.count!==r.count||fs.realpathSync(file)!==file)
    return no('S02_RECOVERY_CONCURRENT_LEDGER_CHANGE');
  return {ok:true,ledger:file,nonces:[...seen],window:r.latest_state.next_window_sha256,
    receipt:Object.freeze({kind:'C87_LOCAL_COLD_REBIND_NOT_NATIVE',count:r.count,
      last_hash:r.last_hash,source_head:src.head,source_tree:src.tree,active:false})};
 }catch{return no('S02_RECOVERY_READ_OUTCOME_UNKNOWN')}
}
const windowDigest=a=>sha(JSON.stringify(a.map(x=>sha(Buffer.from(x,'utf8')))));

const MAX_PORTABLE_C87_BYTES=256*1024;
const validPriorWindow=a=>Array.isArray(a)&&a.length<=4&&
 a.every(x=>typeof x==='string'&&x.trim()&&Buffer.byteLength(x,'utf8')<=12000);
/** Host-carried bytes are not admission, a new writer or a native persistence proof. */
function bindC135PortableResume(resume,parent,src,selection){
 const fields='expectedCount,expectedLastHash,ledger_sha256,ledger_utf8,previousWorkerGone,priorMessages,schema,selection_receipt_sha256,source_head,source_tree';
 if(!clean(resume)||!safeDeep(resume)||Object.keys(resume).sort().join(',')!==fields||
    resume.schema!=='ikant-le-c135-portable-c87/v1'||resume.previousWorkerGone!==true||
    resume.source_head!==src.head||resume.source_tree!==src.tree||
    resume.selection_receipt_sha256!==selection.receipt_sha256||
    !Number.isSafeInteger(resume.expectedCount)||resume.expectedCount<1||
    !/^[a-f0-9]{64}$/.test(resume.expectedLastHash||'')||
    !/^[a-f0-9]{64}$/.test(resume.ledger_sha256||'')||
    typeof resume.ledger_utf8!=='string'||!resume.ledger_utf8.endsWith('\n')||
    Buffer.byteLength(resume.ledger_utf8,'utf8')>MAX_PORTABLE_C87_BYTES||
    !validPriorWindow(resume.priorMessages)||sha(resume.ledger_utf8)!==resume.ledger_sha256)
  return no('S02_PORTABLE_C87_CHECKPOINT_INVALID');
 let transient=null;
 try{
  transient=fs.mkdtempSync(path.join(parent,'.ikant-portable-c87-'));
  if((fs.lstatSync(transient).mode&0o077)!==0)throw Error('PORTABLE_ROOT_NOT_PRIVATE');
  const dir=path.join(transient,'.ikant-host');fs.mkdirSync(dir,{mode:0o700});
  const file=path.join(dir,'c107-observations.jsonl');
  const fd=fs.openSync(file,'wx',0o600);
  try{fs.writeFileSync(fd,resume.ledger_utf8,'utf8');fs.fsyncSync(fd);}
  finally{fs.closeSync(fd);}
  if(fs.readFileSync(file,'utf8')!==resume.ledger_utf8)throw Error('PORTABLE_READBACK_CHANGED');
  const recovered=bindC135Recovery({ledgerFile:file,previousWorkerGone:true,
    expectedCount:resume.expectedCount,expectedLastHash:resume.expectedLastHash},parent,src,selection);
  if(recovered.ok!==true){fs.rmSync(transient,{recursive:true,force:true});return recovered;}
  if(recovered.window!==windowDigest(resume.priorMessages)){
   fs.rmSync(transient,{recursive:true,force:true});
   return no('S02_PORTABLE_C87_WINDOW_MISMATCH');
  }
  return {...recovered,portable_recovered:true};
 }catch{
  if(transient)fs.rmSync(transient,{recursive:true,force:true});
  return no('S02_PORTABLE_C87_IMPORT_UNKNOWN');
 }
}
const inspect=(dir,ledger)=>{
 const p=spawnSync(process.execPath,['scripts/c107-turn-cli.mjs',ledger],{cwd:dir,
  input:JSON.stringify({action:'INSPECT'}),encoding:'utf8',timeout:15000,maxBuffer:1000000});
 if(p.status!==0||p.signal||p.error)return null;
 try{return JSON.parse(p.stdout)}catch{return null}
};
export async function createC135EduV2Session({selection,sourceRoot,privateParent,languagePort,send,afterAcceptWitness,sourceBinding=null,resumeFrom=null}={}){
 if(!clean(afterAcceptWitness)||afterAcceptWitness.accepted!==true||
   afterAcceptWitness.scope!=='HOST_WITNESSED_ONLY'||typeof languagePort!=='function'||
   typeof send!=='function'||typeof privateParent!=='string'||!path.isAbsolute(privateParent)||
   !fs.existsSync(privateParent)||fs.realpathSync(privateParent)!==privateParent||
   !fs.statSync(privateParent).isDirectory())
   return no('S02_WITNESS_OR_CALLBACK_MISSING');
 const src=sourceVerified(sourceRoot,selection,sourceBinding);
 if(!src)return no('S02_GIT_SOURCE_OR_V2_SELECTION_UNVERIFIED');
 const portable=resumeFrom!==null&&clean(resumeFrom)&&safeDeep(resumeFrom)&&
   resumeFrom.schema==='ikant-le-c135-portable-c87/v1';
 const recovered=portable
   ?bindC135PortableResume(resumeFrom,privateParent,src,selection)
   :bindC135Recovery(resumeFrom,privateParent,src,selection);
 if(recovered.ok!==true)return recovered;
 let lastOriginalC125=null;
 const out=createC125HostOutputPort({send:async utf8=>{await send(utf8);lastOriginalC125=utf8},afterAcceptWitness});
 if(!out.ok)return no('S02_ORIGINAL_C125_UNAVAILABLE');
 let stage=null;
 try{
  const pkg=buildC107Package({root:sourceRoot,expectedHead:src.head,sourceTree:sourceBinding===null?null:src.tree});
  if(pkg.status!=='C107_PACKAGE_BUILT_NOT_TRANSPORTED')throw Error(pkg.first_unclosed_edge||'S02_PACKAGE_STOP');
  const staged=stageC107Package({payload:pkg.payload,expectedSha256:pkg.sha256,
   expectedHead:src.head,privateParent});
  if(staged.status!=='C107_PACKAGE_REOPENED_NOT_EXECUTED')throw Error('S02_PACKAGE_NOT_REOPENED');
  stage=staged.install_root;
  const original=await import(pathToFileURL(path.join(stage,'host/c107-edu-v2-turn.mjs')).href);
  const epistemic=await import(pathToFileURL(path.join(stage,'host/c139-edu-v2-turn.mjs')).href);
  const c139=await import(pathToFileURL(path.join(stage,'host/c139-epistemic-policy.mjs')).href);
  const c140=await import(pathToFileURL(path.join(stage,'host/c140-open-edu-turn.mjs')).href);
  const c141=await import(pathToFileURL(path.join(stage,'host/c141-semantic-shadow.mjs')).href);
  const c142=await import(pathToFileURL(path.join(stage,'host/c142-semantic-owner-guard.mjs')).href);
  const c143=await import(pathToFileURL(path.join(stage,'host/c143-guarded-nonidentity-policy.mjs')).href);
  const guarded143=await import(pathToFileURL(path.join(stage,'host/c143-edu-v2-turn.mjs')).href);
  const d=path.join(stage,'.ikant-host');fs.mkdirSync(d,{mode:0o700});
  // Keep the ORIGINAL single C87 ledger outside the disposable staged package
  // from the FIRST turn. Unexpected worker death leaves reopenable local
  // evidence; no provider- or cross-container persistence is inferred.
  const localLedgerRoot=recovered.ledger===null
    ?fs.mkdtempSync(path.join(privateParent,'.ikant-edu-ledger-')):null;
  if(localLedgerRoot!==null){
    if(fs.realpathSync(localLedgerRoot)!==localLedgerRoot||
       (fs.lstatSync(localLedgerRoot).mode&0o077)!==0)
      throw Error('S02_PRIVATE_LEDGER_ROOT_NOT_PRIVATE');
    fs.mkdirSync(path.join(localLedgerRoot,'.ikant-host'),{mode:0o700});
  }
  const ledger=recovered.ledger||path.join(localLedgerRoot,'.ikant-host','c107-observations.jsonl');
  let busy=false,closed=false,uncertain=false;const seen=new Set(recovered.nonces);
  let recoveryWindowPending=recovered.ledger!==null;
  async function publishTurn(frame){
   if(uncertain)return no('S02_UNCERTAIN_WRITE_OR_DELIVERY_RECONCILE');
   if(closed||busy)return no('S02_CLOSED_OR_BUSY');
   // S02 cannot silently truncate a caller's input or grant infinite compute.
   // Expose a typed, pre-callback budget edge without producing any C87 event.
   if(clean(frame)&&typeof frame.humanInput==='string'&&
      Buffer.byteLength(frame.humanInput,'utf8')>12000)
    return no('C141_EXACT_INPUT_REQUIRES_BUDGET_NEGOTIATION');
   if(!safeDeep(frame)||!clean(frame)||Object.keys(frame).some(k=>!['humanInput','nonce','priorMessages','resetContext','openScope'].includes(k))||
      typeof frame.humanInput!=='string'||!frame.humanInput.trim()||
      Buffer.byteLength(frame.humanInput,'utf8')>12000||!NONCE.test(frame.nonce)||seen.has(frame.nonce)||
      !Array.isArray(frame.priorMessages)||frame.priorMessages.length>4||
      frame.priorMessages.some(x=>typeof x!=='string'||!x.trim()||Buffer.byteLength(x,'utf8')>12000)||
      typeof frame.resetContext!=='boolean'||(frame.resetContext&&frame.priorMessages.length)||
      (frame.openScope!==undefined&&typeof frame.openScope!=='boolean'))
    return no('S02_FRAME_OR_NONCE_DENIED');
   // A recovered owner must bind the prior *actual* cognitive window before
   // invoking language; reset or invented history is not a continuation.
   if(recoveryWindowPending&&(frame.resetContext!==false||
       windowDigest(frame.priorMessages)!==recovered.window))
     return no('S02_RECOVERY_CONTEXT_NOT_BOUND');
   // Consume event ID before all side effects, including the model callback.
   seen.add(frame.nonce);busy=true;
   try{
    const req={sourceHead:src.head,selection,humanInput:frame.humanInput,optIn:true};
    // C140 is an isolated child route; C70's 600-byte input never receives a truncation.
    // No self-identity policy is bypassed: explicit self-descriptions stay with C114.
    const tooLong=Buffer.byteLength(frame.humanInput,'utf8')>600;
    const planShort=!tooLong?original.previewC107CognitivePlan({request:req,
      priorMessages:frame.priorMessages,resetContext:frame.resetContext}):null;
    const shadow=!tooLong?await import(pathToFileURL(path.join(stage,'host/c132-reasoning-candidate.mjs')).href):null;
    // C141 arbiter is a child of C135: it is not an independent authority.
    // Explicit self-identity retains frozen C114; C139 owns qualified process
    // questions. C132 alone never grants permission to use C140.
    const c139Eligible=!!planShort&&c139.qualifyC139EpistemicRoute({episode:planShort,humanInput:frame.humanInput}).allowed===true;
    const c132Route=shadow?shadow.classifyC132Candidate(frame.humanInput).route:'UNCLASSIFIED';
    const ownerGeneralConflict=!!planShort&&planShort.response_family==='SELF_ONTOLOGY'&&c132Route==='GENERAL_ONTOLOGY';
    const decision=c141.arbitrateC141({humanInput:frame.humanInput,
      c107Family:planShort?.response_family??'UNCLASSIFIED',c132Route,
      c139Qualified:c139Eligible,openScope:frame.openScope===true||ownerGeneralConflict,
      physicalLimitBytes:12000});
    // Preserve the existing public stop edge for bounded original C114.
    if(decision.code==='C141_LONG_IDENTITY_OWNER_GAP')return no('C140_SELF_IDENTITY_OWNER_BOUNDED_STOP');
    if(decision.status==='STOP')return no(decision.code);
    const guarded=c142.qualifyC142OwnerGuard({humanInput:frame.humanInput,c141Decision:decision});
    if(guarded.code==='C141_LONG_IDENTITY_OWNER_GAP')return no('C140_SELF_IDENTITY_OWNER_BOUNDED_STOP');
    if(guarded.status==='STOP')return no(guarded.code);
    // An indirect self-identity hit may be missed by older C107 planning.
    // Only the original C114 direct-identity plan can proceed; otherwise stop
    // BEFORE language callback and C87, never borrow C140 or an unrelated owner.
    if(guarded.route==='C114_OWNER'&&
       !(planShort?.method==='DIRECT_IDENTITY'&&
         ['SELF_ONTOLOGY','GUARDED'].includes(planShort.response_family)))
      return no('C114_INDIRECT_IDENTITY_UNQUALIFIED_PRE_EFFECT_STOP');
    const openScope=guarded.route==='C140_OPEN_EDU_CANDIDATE';
    if(openScope){
      const plan=c140.planC140OpenTurn({humanInput:frame.humanInput,sourceHead:src.head,
        selection,priorMessages:frame.priorMessages,resetContext:frame.resetContext});
      if(plan.status!=='C140_PLAN_UNLEDGERED')return no(plan.first_unclosed_edge||'C140_PREVIEW_DENIED');
      const guidance=Object.freeze({schema:'ikant-le-c140-open-guidance/v1',
        method:'Separate observed evidence from inference; expose uncertainty and possible falsifiers. Do not claim internal consciousness or native provider execution.',
        plan_sha256:plan.plan_sha256});
      let draft;
      try{draft=await languagePort(Object.freeze({schema:'ikant-edu-v2-open-language-task/v1',
        source_head:src.head,current_input_utf8:frame.humanInput,plan:Object.freeze({
          input_sha256:plan.input_sha256,plan_sha256:plan.plan_sha256,original_c70_executed:false}),
        guidance,channels:null,topic_whitelist:false}));}
      catch{return no('C140_HOST_LANGUAGE_FAILED')}
      if(closed)return no('S02_CLOSED_AFTER_LANGUAGE');
      if(!clean(draft)||Object.keys(draft).sort().join(',')!=='ack_plan_sha256,input_sha256,text'||
         draft.input_sha256!==plan.input_sha256||draft.ack_plan_sha256!==plan.plan_sha256||
         !c140.c140OpenPolicy({humanInput:frame.humanInput,text:draft.text}).allowed||
         !qualifyHumanFacingIdentity({method:'RETRIEVE',text:draft.text}).ok)
        return no('C140_MODEL_ACK_OR_EPISTEMIC_DENIED');
      const before=inspect(stage,ledger);
      if(before?.status!=='C107_LEDGER_REOPENED')return no('C140_PREWRITE_READBACK_DENIED');
      const turn=c140.executeC140OpenTurn({ledgerFile:ledger,nonce:frame.nonce,request:req,
        priorMessages:frame.priorMessages,resetContext:frame.resetContext,
        modelCandidate:{text:draft.text,input_sha256:draft.input_sha256,ack_plan_sha256:draft.ack_plan_sha256},
        expectedPlanSha256:plan.plan_sha256});
      if(turn.status!=='C140_ORIGINAL_C100_C87_LOCAL_READBACK'||turn.voice_utf8!==draft.text||
         turn.original_c70_executed!==false||turn.original_c87_writer_executed!==true){
        uncertain=true;return no(turn.first_unclosed_edge||'C140_ORIGINAL_WRITER_STOP');}
      const after=inspect(stage,ledger);
      if(after?.status!=='C107_LEDGER_REOPENED'||after.count!==before.count+1||
         after.last_hash!==turn.ledger_event_sha256||after.latest_state?.nonce!==frame.nonce||
         after.latest_state?.source_head!==src.head||after.latest_state?.c140_open_route!==true||
         after.latest_state?.c140_original_c70_executed!==false||
         after.latest_state?.public_selection_receipt_sha256!==selection.receipt_sha256||
         after.latest_state?.visible_voice_sha256!==turn.output_sha256){
        uncertain=true;return no('C140_INDEPENDENT_C87_REOPEN_MISMATCH');}
      const evidence={schema:'ikant-c140-edu-v2-owner-evidence/v1',
        status:'C140_EDU_V2_C100_C87_READBACK',public_mode:'EDU',
        source_kind:src.kind||'LOCAL_GIT_COMMIT_SOURCE_NOT_PROVIDER_ORIGIN',...(src.api_source_binding?{api_source_binding:src.api_source_binding}:{}),source_head:src.head,
        source_tree:src.tree,public_selection_receipt_sha256:selection.receipt_sha256,
        input_sha256:plan.input_sha256,original_turn:turn,
        surface_a:{origin:'HOST_BOUND',voice_utf8:turn.voice_utf8},
        original_c70_executed:false,original_c87_writer_executed:true,single_c87_writer:true,
        native_chatgpt_origin_attested:false,active:false};
      lastOriginalC125=null;
      const result=await out.publish({eventId:frame.nonce,frame:{kind:'OWNER_VOICE',mode:'EDU',
        trace:after.last_hash,continuity:'C87_INDEPENDENT_REOPEN',edge:'NATIVE_CHATGPT_PER_TURN_DISPATCH',
        next:'QUALIFY_NATIVE_HOOK',nonce:frame.nonce,input_sha256:plan.input_sha256,
        ownerReceipt:evidence,independentReadback:after}});
      if(result.ok!==true)uncertain=true;
      const delivered=Object.freeze({ok:result.ok===true,source_head:src.head,source_tree:src.tree,
       status:result.ok?'S02_EDU_V2_HOST_BOUND_LOCAL_READBACK':'S02_C125_OUTPUT_BLOCKED',
       first_edge:result.ok?'NATIVE_CHATGPT_PER_TURN_DISPATCH':result.reason,
       c141_disclosure:c141.c141EpistemicDisclosure({answer:turn.voice_utf8}),
       original_turn:turn,c87_before:before.count,c87_after:after.count,c125:result,
       active:false,native_event_attested:false});
      const s03=delivered.ok&&lastOriginalC125!==null
       ?projectS03CompletedEduTurn({ownerTurn:delivered,originalC125Text:lastOriginalC125})
       :Object.freeze({ok:false,first_edge:'S03_C125_SEND_NOT_RESOLVED',active:false});
      lastOriginalC125=null;
      if(delivered.ok)recoveryWindowPending=false;
    return Object.freeze({...delivered,s03_host_projection:s03});
    }

    const plan=original.previewC107CognitivePlan({request:req,priorMessages:frame.priorMessages,
      resetContext:frame.resetContext});
    if(plan.status!=='C107_C70_PLAN_COMPUTED_NOT_LEDGERED'||plan.c70_original_executed!==true||
       plan.input_sha256!==sha(frame.humanInput))return no('S02_C70_PREVIEW_DENIED');
    const channels=qualifyC126Channels(plan.c124_language_channels,{inputSha256:plan.input_sha256,
     channelSha256:plan.c124_language_channel_sha256});
    if(!channels.ok||channels.channels!==12)return no('S02_C126_CHANNELS_DENIED');
    const scope={schema:'ikant-le-c107-c70-before-language/v1',input_sha256:plan.input_sha256,
     c70_output_sha256:plan.c70_output_sha256,central_mode:plan.central_mode,method:plan.method,
     response_family:plan.response_family,resource_gap:plan.resource_gap,
     cognitive_window_length:plan.cognitive_window_length};
    const guidance=compileC117SemanticGuide(scope);
    const route=c139.qualifyC139EpistemicRoute({episode:{...scope,input_sha256:plan.input_sha256},humanInput:frame.humanInput});
    const useC139=route.allowed===true;
    const c143Route= !useC139&&c143.qualifyC143RestrictedRoute({humanInput:frame.humanInput,
      plan:{...plan,c70_original_executed:true},sourceRoot:stage});
    const useC143=c143Route.allowed===true&&guarded.route==='C107_OWNER'&&!openScope;
    let draft;try{draft=await languagePort(Object.freeze({schema:'ikant-edu-v2-language-task/v1',
      source_head:src.head,current_input_utf8:frame.humanInput,plan:scope,guidance,
      channels:plan.c124_language_channels,
      required_ack:Object.freeze({input_sha256:plan.input_sha256,
       ack_plan_sha256:guidance.plan_sha256,
       ack_c124_channel_sha256:plan.c124_language_channel_sha256}),
      ...(useC139?{c139_epistemic_format:c139.C139_EPISTEMIC_FORMAT}:{} ),
       ...(useC143?{c143_guarded_format:c143.C143_FORMAT,c143_source_evidence:c143Route.evidence}:{} )}));}catch{return no('S02_HOST_LANGUAGE_FAILED')}
    if(closed)return no('S02_CLOSED_AFTER_LANGUAGE');
    if(!clean(draft)||Object.keys(draft).sort().join(',')!==
      'ack_c124_channel_sha256,ack_plan_sha256,input_sha256,text'||
      typeof draft.text!=='string'||!draft.text.trim()||Buffer.byteLength(draft.text,'utf8')>16000||
      draft.input_sha256!==plan.input_sha256||draft.ack_plan_sha256!==guidance.plan_sha256||
      draft.ack_c124_channel_sha256!==plan.c124_language_channel_sha256)
      return no('S02_MODEL_ACK_INVALID');
    // Lexical human-language veto before the sole original C87 writer; no rewriting.
    if(!qualifyHumanFacingIdentity({method:plan.method,text:draft.text}).ok)
      return no('S02_PUBLIC_IDENTITY_LANGUAGE_DENIED');
    // C139 is a bounded, versioned alternate route; never relax original C114.
    if(useC139&&!c139.qualifyC139EpistemicCandidate({
      episode:{...scope,input_sha256:plan.input_sha256},humanInput:frame.humanInput,text:draft.text}).allowed)
      return no('S02_C139_EPISTEMIC_LANGUAGE_DENIED');
    if(useC143&&!c143.qualifyC143Candidate({humanInput:frame.humanInput,
      plan:{...plan,c70_original_executed:true},sourceRoot:stage,text:draft.text}).allowed)
      return no('S02_C143_GUARDED_LANGUAGE_DENIED');
    const before=inspect(stage,ledger);if(before?.status!=='C107_LEDGER_REOPENED')return no('S02_PREWRITE_READBACK_DENIED');
    const turn=(useC143?guarded143.executeC143GuardedTurn:useC139?epistemic.executeC139EpistemicTurn:original.executeC107Turn)({ledgerFile:ledger,nonce:frame.nonce,
      request:{...req,modelCandidate:{text:draft.text,input_sha256:plan.input_sha256}},
      priorMessages:frame.priorMessages,resetContext:frame.resetContext,requireHostLanguage:true,
      expectedC70OutputSha256:plan.c70_output_sha256,
      expectedC124ChannelSha256:plan.c124_language_channel_sha256});
    if(turn.status!==(useC143?'C143_ORIGINAL_C70_C100_C87_LOCAL_READBACK':useC139?'C139_ORIGINAL_C70_C100_C87_LOCAL_READBACK':'C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK')||
       (useC139&&turn.c139_epistemic_guard!==true)||(useC143&&turn.c143_guarded_nonidentity!==true)||turn.voice_utf8!==draft.text||
       !turn.original_c87_writer_executed||!turn.original_c70_executed||turn.public_mode!=='EDU'||
       turn.public_selection_receipt_sha256!==selection.receipt_sha256){
      uncertain=true;return no(turn.first_unclosed_edge||'S02_ORIGINAL_C107_STOP');}
    const after=inspect(stage,ledger);
    if(after?.status!=='C107_LEDGER_REOPENED'||after.count!==before.count+1||
       after.last_hash!==turn.ledger_event_sha256||after.latest_state?.nonce!==frame.nonce||
       after.latest_state?.source_head!==src.head||
       after.latest_state?.admission_schema!=='ikant-le-c72-public-selection/v2'||
       after.latest_state?.public_selection_receipt_sha256!==selection.receipt_sha256||
       after.latest_state?.visible_voice_sha256!==turn.output_sha256||
       after.latest_state?.c124_language_channel_sha256!==plan.c124_language_channel_sha256||
       after.latest_state?.host_language_used!==true||
       (useC139&&after.latest_state?.c139_epistemic_guard!==true)||(useC143&&after.latest_state?.c143_guarded_nonidentity!==true)){
      uncertain=true;return no('S02_INDEPENDENT_C87_REOPEN_MISMATCH');}
    const evidence={schema:'ikant-c135-edu-v2-owner-evidence/v1',
      status:'C135_EDU_V2_ORIGINAL_C107_C87_READBACK',public_mode:'EDU',
      source_kind:src.kind||'LOCAL_GIT_COMMIT_SOURCE_NOT_PROVIDER_ORIGIN',...(src.api_source_binding?{api_source_binding:src.api_source_binding}:{}),source_head:src.head,
      source_tree:src.tree,public_selection_receipt_sha256:selection.receipt_sha256,
      input_sha256:plan.input_sha256,original_turn:turn,
      surface_a:{origin:'HOST_BOUND',voice_utf8:turn.voice_utf8},
      original_c70_executed:true,original_c87_writer_executed:true,single_c87_writer:true,
      c126_status:channels.status,c126_channels:12,native_chatgpt_origin_attested:false,active:false};
    lastOriginalC125=null;
    const result=await out.publish({eventId:frame.nonce,frame:{kind:'OWNER_VOICE',mode:'EDU',
      trace:after.last_hash,continuity:'C87_INDEPENDENT_REOPEN',edge:'NATIVE_CHATGPT_PER_TURN_DISPATCH',
      next:'QUALIFY_NATIVE_HOOK',nonce:frame.nonce,input_sha256:plan.input_sha256,
      ownerReceipt:evidence,independentReadback:after}});
    if(result.ok!==true)uncertain=true; // Unknown delivery after a C87 write: no new turns or blind retries.
    const delivered=Object.freeze({ok:result.ok===true,source_head:src.head,source_tree:src.tree,
     status:result.ok?'S02_EDU_V2_HOST_BOUND_LOCAL_READBACK':'S02_C125_OUTPUT_BLOCKED',
     first_edge:result.ok?'NATIVE_CHATGPT_PER_TURN_DISPATCH':result.reason,
     original_turn:turn,c87_before:before.count,c87_after:after.count,
     c125:result,active:false,native_event_attested:false});
    const s03=delivered.ok&&lastOriginalC125!==null
      ?projectS03CompletedEduTurn({ownerTurn:delivered,originalC125Text:lastOriginalC125})
      :Object.freeze({ok:false,first_edge:'S03_C125_SEND_NOT_RESOLVED',active:false});
    lastOriginalC125=null;
    if(delivered.ok)recoveryWindowPending=false;
    return Object.freeze({...delivered,s03_host_projection:s03});
   }finally{busy=false}
  }
  function exportPortableC87({priorMessages}={}){
   if(closed||busy||uncertain||!validPriorWindow(priorMessages))
    return no('S02_PORTABLE_C87_EXPORT_NOT_STABLE');
   const r=reopenC87Ledger(ledger);
   if(r.status!=='C87_LEDGER_CHAIN_VALID'||r.count<1||
      r.latest_state?.source_head!==src.head||
      r.latest_state?.public_selection_receipt_sha256!==selection.receipt_sha256||
      r.latest_state?.next_window_sha256!==windowDigest(priorMessages))
    return no('S02_PORTABLE_C87_EXPORT_WINDOW_DENIED');
   const bytes=fs.readFileSync(ledger,'utf8');
   if(!bytes.endsWith('\n')||Buffer.byteLength(bytes,'utf8')>MAX_PORTABLE_C87_BYTES)
    return no('S02_PORTABLE_C87_EXPORT_SIZE_OR_TORN');
   const again=reopenC87Ledger(ledger);
   if(again.status!=='C87_LEDGER_CHAIN_VALID'||again.last_hash!==r.last_hash||
      again.count!==r.count)return no('S02_PORTABLE_C87_EXPORT_READBACK_CHANGED');
   // No previous-worker-death claim: Host must witness it before import.
   return Object.freeze({schema:'ikant-le-c135-portable-c87/v1',
    source_head:src.head,source_tree:src.tree,
    selection_receipt_sha256:selection.receipt_sha256,
    expectedCount:r.count,expectedLastHash:r.last_hash,
    ledger_sha256:sha(bytes),ledger_utf8:bytes,
    priorMessages:Object.freeze([...priorMessages])});
  }
  function close(){if(!closed){closed=true;out.close();fs.rmSync(stage,{recursive:true,force:true})}}
  return Object.freeze({ok:true,mode:'EDU',source_head:src.head,source_tree:src.tree,
    runtime_ready:true,active:false,native_event_attested:false,owner:'C135_EDU_V2',
    recovered_original_ledger:recovered.receipt,portable_c87_recovered:recovered.portable_recovered===true,
    publishTurn,close,exportPortableC87,
    readSessionState:()=>closed||busy||uncertain?no('S02_READBACK_NOT_STABLE'):Object.freeze({
     owner:'C135_EDU_V2',source_head:src.head,source_tree:src.tree,
     selection_receipt_sha256:selection.receipt_sha256,ledger_file:ledger,
     recovered_original_ledger:recovered.receipt,
     original_c87_readback:inspect(stage,ledger),
     local_ledger_survives_stage_close:true,
     provider_or_cross_container_persistence_attested:false,
     active:false,authority:0}),
    status:()=>Object.freeze({closed,busy,uncertain,attempted:seen.size,port:out.status()})});
 }catch(e){if(stage)fs.rmSync(stage,{recursive:true,force:true});out.close();return no(e?.message||'S02_STAGE_DENIED')}
}
