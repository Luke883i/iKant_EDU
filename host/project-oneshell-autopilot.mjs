/** HOST-only continuation over original OneShell frames. No admission, source,
 * runtime, language or ledger authority is created by this module. */
import {validateC72V2ModeSelection} from './c72-public-mode-admission.mjs';
import {renderOneShell} from './project-oneshell-edu.mjs';

const AUTO = new Set(['VERIFY_SOURCE','VERIFY_MACHINE_BRIDGE',
 'API_TREE_SOURCE_MATERIALIZATION','START_C135_EDU']);
const HUMAN = new Set(['AWAIT_I_ACCEPT','AWAIT_EDU',
 'AWAIT_HUMAN_INPUT','WAIT_NEXT_HUMAN_INPUT']);
const MANUAL = new Set(['UPLOAD_PINNED_SOURCE_ZIP']);
const SHA = /^[0-9a-f]{40}$/;
const stop = edge => Object.freeze({kind:'STOP',action:'STOP',edge});

/** NEXT is advisory, never permission to claim execution. A real HOST must
 * reopen the original owner receipt and check main before each operation. */
export function deriveOneShellHostAction({frame,selection,sourceHead,liveHead}={}) {
 if(!SHA.test(sourceHead||'')||!SHA.test(liveHead||''))return stop('SOURCE_LOCK_NOT_OBSERVED');
 if(sourceHead!==liveHead)return stop('STOP_SOURCE_LOCK_STALE');
 try{renderOneShell(frame);}catch{return stop('ORIGINAL_ONESHELL_FRAME_NOT_VALID');}
 const next=frame.slots.NEXT;
 if(HUMAN.has(next))return Object.freeze({kind:'HUMAN_GATE',action:'STOP',edge:next});
 if(next==='STOP')return stop(frame.slots.EDGE);
 if(!validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead}))
  return stop('C72_EDU_SELECTION_REQUIRED');
 if(MANUAL.has(next))return Object.freeze({kind:'MANUAL_HANDOFF',action:'STOP',edge:next});
 if(AUTO.has(next))return Object.freeze({kind:'AUTO',action:next,edge:frame.slots.EDGE});
 return stop('UNRECOGNIZED_OWNER_NEXT');
}

/** HOST adapter supplies real read/perform callbacks. The runner never repeats
 * the same observation or replays writes after an UNKNOWN outcome. */
export async function driveOneShellHost({read,verify,perform,maxSteps=12}={}) {
 if(typeof read!=='function'||typeof verify!=='function'||typeof perform!=='function'||
    !Number.isSafeInteger(maxSteps)||maxSteps<1||maxSteps>32)
  return Object.freeze({ok:false,edge:'HOST_CALLBACKS_OR_BUDGET_INVALID',actions:[]});
 const actions=[],seen=new Set();
 for(let i=0;i<maxSteps;i++) {
  let observed;
  try{observed=await read();}catch{return Object.freeze({ok:false,edge:'HOST_READ_UNKNOWN',actions});}
  const step=deriveOneShellHostAction(observed);
  if(step.kind!=='AUTO')return Object.freeze({ok:step.kind!=='STOP',...step,actions});
  // A repeated NEXT without a changed owner observation is not fresh evidence.
  const witness=observed?.ownerReceiptSha256;
  if(typeof witness!=='string'||!/^[a-f0-9]{64}$/.test(witness))
   return Object.freeze({ok:false,edge:'ORIGINAL_OWNER_READBACK_REQUIRED',actions});
  // A caller digest is not independent readback. Reopen with the original owner.
  let proof;try{proof=await verify(observed);}catch{}
  if(proof?.ok!==true||proof.receipt_sha256!==witness||
     proof.source_head!==observed.sourceHead)
   return Object.freeze({ok:false,edge:'ORIGINAL_OWNER_READBACK_NOT_VERIFIED',actions});
  const identity=[observed.sourceHead,step.action,witness].join(':');
  if(seen.has(identity))return Object.freeze({ok:false,edge:'UNCHANGED_EVIDENCE_RETRY_FORBIDDEN',actions});
  seen.add(identity);
  actions.push(Object.freeze({action:step.action,source_head:observed.sourceHead,
    owner_receipt_sha256:witness}));
  try{
   const result=await perform(step.action,observed);
   if(result?.ok!==true)return Object.freeze({ok:false,
     edge:result?.edge||'HOST_ACTION_OUTCOME_UNKNOWN_RECONCILE_READ_ONLY',actions});
  }catch{return Object.freeze({ok:false,edge:'HOST_ACTION_OUTCOME_UNKNOWN_RECONCILE_READ_ONLY',actions});}
 }
 return Object.freeze({ok:false,edge:'HOST_AUTOSTEP_BUDGET_EXHAUSTED',actions});
}
