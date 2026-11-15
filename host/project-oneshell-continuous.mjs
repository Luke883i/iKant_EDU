/** Host execution bridge for one EDU OneShell across distinct human messages.
 * Reuses original C72, C135, C87, C125/S03 and PR181 rail. This is NOT a
 * second cognition/ledger writer or a provider-installed persistent widget.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validateC72V2Accepted,validateC72V2Orientation,validateC72V2ModeSelection} from './c72-public-mode-admission.mjs';
import {startOneShellEdu} from './project-oneshell-edu.mjs';
import {projectPostAcceptOneShell} from './project-oneshell-postaccept-rail.mjs';
import {classifyOneShellHumanDestination} from './project-oneshell-host-boundary.mjs';
import humanist from '../contracts/project-oneshell-cx-humanist.json' with {type:'json'};
const H40=/^[a-f0-9]{40}$/u, NONCE=/^[A-Za-z0-9_-]{12,96}$/u;
const sha=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const fail=edge=>Object.freeze({ok:false,edge,voice:'NO_VOICE',authority:0,active:false,native_ui_attested:false});
const json=x=>JSON.stringify(x);
const digest=x=>sha(json(x));
const journalName=n=>'turn-'+String(n).padStart(6,'0')+'.json';
const privateDir=p=>typeof p==='string'&&path.isAbsolute(p)&&fs.realpathSync(p)===p&&
 fs.lstatSync(p).isDirectory()&&(fs.lstatSync(p).mode&0o077)===0;
const hostLens=Object.freeze({schema:'ikant-host-humanist-guidance/v1',
 audience:'HUMAN',aim:humanist.human_goal,
 language:'Distinguere valore umano, esito osservato, incertezza e prossimo passo; non attribuire coscienza o continuita non provate.',
 epistemic_limits:humanist.epistemic_limits,
 roles:humanist.roles.map(({id,human_value,boundary})=>({id,human_value,boundary})),
 no_owner_override:true,authority:0});
function writeReopen(file,body){
 const bytes=Buffer.from(json(body)+'\n');const fd=fs.openSync(file,'wx',0o600);
 try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 if(!fs.readFileSync(file).equals(bytes))throw Error('ONESHELL_JOURNAL_READBACK_FAILED');
 return sha(bytes.toString('utf8'));
}
function inspect(journal,head,tree,selection){
 const names=fs.readdirSync(journal).sort();let previous='GENESIS',index=0,last=null;
 if(names.some(n=>n!=='.oneshell-owner-lease'&&!/^\.oneshell-retired-\d{6}\.json$/u.test(n)&&!/^turn-\d{6}\.json$/u.test(n)&&!/^attempt-[A-Za-z0-9_-]{12,96}\.json$/u.test(n)))
  throw Error('ONESHELL_UNKNOWN_JOURNAL_ENTRY');
 const turns=names.filter(n=>n.startsWith('turn-'));
 for(const n of turns){
  index++;if(n!==journalName(index))throw Error('ONESHELL_SEQUENCE_GAP');
  const file=path.join(journal,n),st=fs.lstatSync(file);
  if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||(st.mode&0o077)!==0||st.size>400000)
   throw Error('ONESHELL_JOURNAL_UNSAFE');
  const raw=fs.readFileSync(file,'utf8'),item=JSON.parse(raw);
  const {record_sha256,...body}=item;
  if(raw!==json(item)+'\n'||record_sha256!==digest(body)||
     body.schema!=='ikant-host-oneshell-continuity/v1'||body.seq!==index||
     body.previous!==previous||body.head!==head||body.tree!==tree||
     body.selection_receipt_sha256!==selection.receipt_sha256||
     !NONCE.test(body.nonce||'')||body.checkpoint?.schema!=='ikant-le-c135-portable-c87/v1'||
     body.checkpoint.expectedCount!==index||!Array.isArray(body.checkpoint.priorMessages)||
     body.checkpoint.source_head!==head||body.checkpoint.source_tree!==tree||
     body.checkpoint.selection_receipt_sha256!==selection.receipt_sha256||
     body.original_voice_sha256!==sha(body.original_voice_utf8||''))
   throw Error('ONESHELL_JOURNAL_CHAIN_MISMATCH');
  previous=record_sha256;last=item;
 }
 const attempts=names.filter(n=>n.startsWith('attempt-'));
 if(attempts.length!==index)throw Error('ONESHELL_UNRECONCILED_ATTEMPT');
 for(const item of turns){
  const r=JSON.parse(fs.readFileSync(path.join(journal,item),'utf8'));
  const a=path.join(journal,'attempt-'+r.nonce+'.json');
  if(!fs.existsSync(a))throw Error('ONESHELL_ATTEMPT_MISSING');
  const proof=JSON.parse(fs.readFileSync(a,'utf8'));
  if(proof.head!==head||proof.selection_receipt_sha256!==selection.receipt_sha256||
     proof.nonce!==r.nonce||proof.seq!==r.seq||proof.input_sha256!==r.input_sha256)
   throw Error('ONESHELL_ATTEMPT_MISMATCH');
 }
 return {count:index,last,previous};
}
/** Cold-rebind only when the previous owner PID is observed gone in THIS
 * process namespace, the Host supplied an explicit loss witness, and the
 * existing lease still matches the frozen source. No unverified lease steal.
 * An exclusive recovery gate prevents two concurrent cold rebinds.
 */
function retireObservedDeadLease(journal,head,selection,current,witness,strictProject=false){
 const lease=path.join(journal,'.oneshell-owner-lease');
 if(!fs.existsSync(lease))return strictProject&&current.count>0?'ONESHELL_PREVIOUS_LEASE_MISSING_UNVERIFIED':null;
 if(current.count===0||witness?.previousWorkerGone!==true)
  return 'ONESHELL_OWNER_LEASE_HELD_OR_UNKNOWN';
 let original,st,record;
 try{
  st=fs.lstatSync(lease);
  if(!st.isFile()||st.isSymbolicLink()||st.nlink!==1||(st.mode&0o077)!==0||st.size>2048)
   return 'ONESHELL_OWNER_LEASE_UNSAFE';
  original=fs.readFileSync(lease);
  record=JSON.parse(original.toString('utf8'));
  if(record.schema!=='ikant-host-oneshell-owner-lease/v1'||record.head!==head||
     record.selection_receipt_sha256!==selection.receipt_sha256||
     !Number.isSafeInteger(record.worker_process)||record.worker_process<=0||
     original.toString('utf8')!==json(record)+'\n')
    return 'ONESHELL_OWNER_LEASE_SOURCE_MISMATCH';
  try{process.kill(record.worker_process,0);return 'ONESHELL_PREVIOUS_OWNER_STILL_ALIVE';}
  catch(e){if(e.code!=='ESRCH')return 'ONESHELL_WORKER_DEATH_NOT_VERIFIED';}
 }catch{return 'ONESHELL_WORKER_DEATH_NOT_VERIFIED';}
 const gate=path.join(journal,'.oneshell-recovery-gate');
 try{writeReopen(gate,{schema:'ikant-host-oneshell-recovery-gate/v1',head,worker_process:process.pid});}
 catch{return 'ONESHELL_RECOVERY_GATE_HELD_OR_UNKNOWN';}
 try{
  const again=fs.lstatSync(lease),bytes=fs.readFileSync(lease);
  if(again.dev!==st.dev||again.ino!==st.ino||again.size!==st.size||
     !bytes.equals(original))return 'ONESHELL_LEASE_CHANGED_DURING_RECOVERY';
  const retired=path.join(journal,'.oneshell-retired-'+String(current.count).padStart(6,'0')+'.json');
  if(fs.existsSync(retired))return 'ONESHELL_RETIRED_LEASE_ALREADY_EXISTS';
  fs.renameSync(lease,retired);
  if(!fs.readFileSync(retired).equals(original))return 'ONESHELL_RETIRED_LEASE_READBACK_FAILED';
  fs.unlinkSync(gate);
  return null;
 }catch{return 'ONESHELL_RECOVERY_OUTCOME_UNKNOWN';}
 // An unknown outcome leaves the gate locked for explicit read-only repair.
}
/** One C135 instance when alive; an explicit observed worker-loss witness is
 * required to cold-rebind the ORIGINAL C87 bytes on a new instance. */
export async function openContinuousOneShell({sourceHead,sourceTree,sourceRoot,privateRoot,
 accepted,introduction,selection,c72TransitDirectory=null,projectProfile=null,readMain,languagePort,recoveryWitness=null}={}){
 let journal=null,owner=null;
 try{
  if(projectProfile!==null&&projectProfile!=='PROJECT_EDU_E15')return fail('E15_PROJECT_PROFILE_INVALID');
  if(projectProfile==='PROJECT_EDU_E15'&&c72TransitDirectory===null)
   return fail('E15_ORIGINAL_C72_TRANSIT_REQUIRED');
  if(c72TransitDirectory!==null){
   const {reopenC72Transit}=await import('./project-c72-receipt-transit.mjs');
   const original=reopenC72Transit({directory:c72TransitDirectory,sourceHead});
   if(!original.ok)return fail(original.edge);
   if((accepted!==undefined&&json(accepted)!==json(original.accepted))||
      (introduction!==undefined&&json(introduction)!==json(original.introduction))||
      (selection!==undefined&&json(selection)!==json(original.selection)))
    return fail('ONESHELL_C72_TRANSIT_CONFLICT');
   ({accepted,introduction,selection}=original);
   if(projectProfile==='PROJECT_EDU_E15'){
    const {adjudicateE15}=await import('./project-oneshell-irred-e15.mjs');
    const e=adjudicateE15({profile:projectProfile,stage:'EDU',sourceHead,
     liveHead:await readMain(),orientationWitness:true,transitReadback:true,
     originalAccepted:validateC72V2Accepted(accepted)&&validateC72V2Orientation(introduction,accepted),
     originalEduMode:validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead})});
    if(!e.ok)return fail(e.edge);
   }
  }

  if(!H40.test(sourceHead||'')||!H40.test(sourceTree||'')||
     !privateDir(privateRoot)||typeof readMain!=='function'||typeof languagePort!=='function'||
     !validateC72V2Accepted(accepted)||!validateC72V2Orientation(introduction,accepted)||
     !validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead})||
     selection.acceptance_receipt_sha256!==accepted.receipt_sha256||
     selection.orientation_receipt_sha256!==introduction.receipt_sha256||
     (await readMain())!==sourceHead)return fail('ONESHELL_C72_OR_MAIN_PREFLIGHT');
  journal=path.join(privateRoot,'.oneshell-continuity');
  if(!fs.existsSync(journal))fs.mkdirSync(journal,{mode:0o700});
  if(!privateDir(journal))return fail('ONESHELL_PRIVATE_JOURNAL_REQUIRED');
  const current=inspect(journal,sourceHead,sourceTree,selection);
  if(current.count>0&&recoveryWitness?.previousWorkerGone!==true)
   return fail('ONESHELL_ORIGINAL_WORKER_LOSS_WITNESS_REQUIRED');
  if(current.count===0&&recoveryWitness!==null)return fail('ONESHELL_UNEXPECTED_RECOVERY');
  const retiredEdge=retireObservedDeadLease(journal,sourceHead,selection,current,recoveryWitness,
   projectProfile==='PROJECT_EDU_E15');
  if(retiredEdge)return fail(retiredEdge);
  const resumeFrom=current.count>0?{...current.last.checkpoint,previousWorkerGone:true}:null;
  owner=await startOneShellEdu({selection,sourceRoot,
   sourceBinding:{head:sourceHead,tree:sourceTree},privateParent:privateRoot,
   languagePort:task=>languagePort(task,hostLens),
   afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'},resumeFrom});
  if(owner.ok!==true||owner.runtime_ready!==true)return fail(owner.frame?.slots?.EDGE||'ONESHELL_ORIGINAL_C135_NOT_READY');
  const ready=projectPostAcceptOneShell({phase:'EDU_READY',sourceHead,liveHead:sourceHead,
   accepted,introduction,selection,sourceTree,ownerSession:owner});
  if(!ready.ok)return fail(ready.edge);
  // Intra-host exclusivity: no two live C135 owners for the same C87 epoch.
  // A crash leaves a lease for explicit read-only reconciliation, not blind takeover.
  const lease=path.join(journal,'.oneshell-owner-lease');
  try{writeReopen(lease,{schema:'ikant-host-oneshell-owner-lease/v1',head:sourceHead,
    selection_receipt_sha256:selection.receipt_sha256,worker_process:process.pid});}
  catch{owner.close();return fail('ONESHELL_OWNER_LEASE_HELD_OR_UNKNOWN');}
  let blocked=false,count=current.count,last=current.last,previous=current.previous;
  const reopened=()=>inspect(journal,sourceHead,sourceTree,selection);
  async function publishHumanTurn({humanInput,nonce,humanMessageObserved=false}={}){
   if(blocked)return fail('ONESHELL_UNKNOWN_OUTCOME_NO_RETRY');
   try{
    if((await readMain())!==sourceHead)return fail('STOP_SOURCE_LOCK_STALE');
    const before=reopened();
    if(before.count!==count||before.previous!==previous)return fail('ONESHELL_FORK_OR_EXTERNAL_MODIFICATION');
    if(humanMessageObserved!==true||typeof humanInput!=='string'||!humanInput.trim()||
       Buffer.byteLength(humanInput,'utf8')>12000||!NONCE.test(nonce||''))return fail('ONESHELL_HUMAN_EVENT_INVALID');
    if(classifyOneShellHumanDestination(humanInput).target!=='IKANT')
      return fail('ONESHELL_CONTROL_REQUIRES_ORIGINAL_MANAGED_FACADE');
    if(fs.existsSync(path.join(journal,'attempt-'+nonce+'.json')))
      return fail('ONESHELL_DUPLICATE_OR_UNKNOWN_NONCE');
    const priorMessages=count?last.checkpoint.priorMessages:[];
    const state=owner.readSessionState();
    if(state?.original_c87_readback?.count!==count)return fail('ONESHELL_ORIGINAL_PRETURN_C87_MISMATCH');
    writeReopen(path.join(journal,'attempt-'+nonce+'.json'),{schema:'ikant-host-oneshell-attempt/v1',
     head:sourceHead,selection_receipt_sha256:selection.receipt_sha256,seq:count+1,
     nonce,input_sha256:sha(humanInput)});
    blocked=true; // No retries after a potentially effectful owner call.
    const frame=await owner.publishTurn({humanInput,nonce,priorMessages,resetContext:count===0});
    if(frame.voice_origin!=='HOST_BOUND_LOCAL')return fail(frame.slots?.EDGE||'ONESHELL_ORIGINAL_TURN_STOP');
    const cp=owner.exportPortableC87({priorMessages:[...priorMessages,humanInput].slice(-4)});
    if(cp?.schema!=='ikant-le-c135-portable-c87/v1'||cp.expectedCount!==count+1)
      return fail(cp?.first_edge||'ONESHELL_ORIGINAL_C87_CHECKPOINT_STOP');
    const phase=resumeFrom&&count===current.count?'RECOVERED_TURN':'OWNER_TURN';
    const rail=projectPostAcceptOneShell({phase,sourceHead,liveHead:sourceHead,
     accepted,introduction,selection,sourceTree,ownerSession:owner,ownerFrame:frame,
     turnNonce:nonce,turnInput:humanInput,checkpoint:cp,
     recoveryWitness:phase==='RECOVERED_TURN'?recoveryWitness:null});
    if(!rail.ok)return fail(rail.edge);
    const body={schema:'ikant-host-oneshell-continuity/v1',head:sourceHead,tree:sourceTree,
     selection_receipt_sha256:selection.receipt_sha256,seq:count+1,previous,nonce,
     input_sha256:sha(humanInput),original_voice_sha256:frame.original_voice_sha256,
     original_voice_utf8:frame.slots.A,checkpoint:cp};
    const next=Object.freeze({...body,record_sha256:digest(body)});
    writeReopen(path.join(journal,journalName(count+1)),next);
    count++;previous=next.record_sha256;last=next;
    if(reopened().count!==count)return fail('ONESHELL_POSTWRITE_READBACK_FAILED');
    blocked=false;
    return Object.freeze({ok:true,phase,frame:rail.frame,content:rail.content,
     original_voice_sha256:frame.original_voice_sha256,host_lens:hostLens,
     original_c87_count:count,anchor:rail.host_session_anchor_sha256,
     provider_native_persistence_attested:false,native_ui_attested:false,authority:0,active:false});
   }catch{return fail('ONESHELL_TURN_OUTCOME_UNKNOWN_NO_RETRY');}
  }
  return Object.freeze({ok:true,phase:'EDU_READY',frame:ready.frame,content:ready.content,
   source_head:sourceHead,source_tree:sourceTree,host_lens:hostLens,
   count:()=>count,publishHumanTurn,reopen:reopened,status:()=>owner.status(),
   close:()=>{owner.close();if(owner.status()?.closed===true)fs.unlinkSync(lease);},
   native_ui_attested:false,provider_native_persistence_attested:false,
   authority:0,active:false});
 }catch{try{owner?.close();}catch{}return fail('ONESHELL_CONTINUITY_OPEN_UNKNOWN');}
}
