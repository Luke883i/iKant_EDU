/** PE reverse DoD, derived HOST model only, never an owner or receipt. */
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const contractPath=fileURLToPath(new URL('../contracts/project-pe-retrograde-dod.json',import.meta.url));
export const PE_CONTRACT=Object.freeze(JSON.parse(fs.readFileSync(contractPath,'utf8')));
const STATES=new Set(['PASS','FAIL','UNKNOWN']);
const HOST_STOP='STOP — Non devi fare nulla né ripetere I ACCEPT: è un problema tecnico';
export const PE_LEAVES=Object.freeze(PE_CONTRACT.nodes.filter(x=>x.kind==='LEAF').map(x=>x.id));
export function validatePEReticle(contract=PE_CONTRACT){
 if(contract?.schema!=='ikant-host-pe-retrograde-dod/v2'||contract.authority!==0||
 contract.active!==false||contract.result!=='G_PE')throw Error('PE_CONTRACT_IDENTITY');
 const map=new Map((contract.nodes||[]).map(n=>[n.id,n]));
 if(map.size!==contract.nodes.length)throw Error('PE_DUPLICATE_NODES');
 const visiting=new Set(),seen=new Set();
 function walk(id){const n=map.get(id);if(!n)throw Error('PE_UNKNOWN_NODE:'+id);
  if(visiting.has(id))throw Error('PE_GRAPH_CYCLE:'+id);if(seen.has(id))return;
  visiting.add(id);
  if(n.kind==='LEAF'){if(n.requires?.length!==0||!n.witness_class)throw Error('PE_LEAF_INVALID');}
  else if(n.kind==='AND'&&n.requires?.length){for(const d of n.requires)walk(d);}
  else throw Error('PE_GATE_INVALID');
  visiting.delete(id);seen.add(id);
 }
 walk(contract.result);
 if(seen.size!==map.size||PE_LEAVES.length!==31||map.size!==41)throw Error('PE_INCOMPLETE_RETICLE');
 return Object.freeze({nodes:seen.size,leaves:31,and_gates:10});
}
function validWitness(n,proof){
 if(!proof||!STATES.has(proof.state))return 'UNKNOWN';
 if(proof.state!=='PASS')return proof.state;
 // The Host can never attest the provenance of its own flags as original proof.
 if(proof.level!==n.level||proof.source!=='EXTERNAL_OBSERVED'||proof.reopened!==true)return 'UNKNOWN';
 if(['OWNER','PROVIDER'].includes(n.level)&&proof.originalBound!==true)return 'UNKNOWN';
 if(n.level==='USER_VALUE'&&proof.holdoutObserved!==true)return 'UNKNOWN';
 return 'PASS';
}
export function assessPE(observations={},contract=PE_CONTRACT){
 validatePEReticle(contract);const map=new Map(contract.nodes.map(n=>[n.id,n])),states=new Map();
 function visit(id){if(states.has(id))return states.get(id);const n=map.get(id);
  let s;if(n.kind==='LEAF')s=validWitness(n,observations[id]);
  else{const children=n.requires.map(visit);s=children.includes('FAIL')?'FAIL':children.every(x=>x==='PASS')?'PASS':'UNKNOWN';}
  states.set(id,s);return s;}
 const status=visit(contract.result),missing=PE_LEAVES.filter(id=>states.get(id)!=='PASS');
 return Object.freeze({schema:'ikant-host-pe-assessment/v2',authority:0,active:false,
  outcome:status==='PASS'?'MODEL_PASS_SCOPED':status==='FAIL'?'BLOCKED':'NOT_ATTESTED',
  first_edge:missing[0]||'NONE',open_gates:missing,original_owner_invoked:false,
  native_delivery_attested:false,original_receipts_minted:false,
  explicit_nonclaim:'MODEL_GATE_EVALUATION_IS_NOT_ACTUAL_IKANT_RUNTIME'});
}
const next=new Map([
 ['EXACT_ACCEPT','Dopo aver consultato Terms, invia in un NUOVO messaggio esattamente I ACCEPT.'],
 ['EXACT_EDU','Solo dopo aver riaperto ACCEPT e ORIENTATION originali, invia in un NUOVO messaggio esattamente EDU.'],
 ['SOURCE_EPOCH',HOST_STOP],['D123_WIRED',HOST_STOP],['C72_FENCE',HOST_STOP],
 ['C72_OWNER',HOST_STOP],['C72_REOPEN',HOST_STOP],['MODE_REOPEN',HOST_STOP],
 ['LANGUAGE_PORT',HOST_STOP],['PROVIDER_DELIVERY',HOST_STOP]]);
export function minimalPENext(edge,{originalGateReopened=false}={}){
 const allow=edge==='EXACT_ACCEPT'||edge==='EXACT_EDU'&&originalGateReopened;
 return Object.freeze({edge,owner:'HOST',user_action_required:allow,
  next:allow?next.get(edge):(edge==='EXACT_EDU'||!next.has(edge)?HOST_STOP:next.get(edge)),
  new_consent_required:false,technical_next_owner:'HOST_AUTOMATIC_PROBE_OR_READ_ONLY_RECONCILE'});
}
export function requiredPEMessages({events=[],termsDisplayed=false,acceptReopened=false,eduReopened=false}={}){
 if(!Array.isArray(events)||events.some(x=>typeof x!=='string'))throw Error('PE_EVENTS_INVALID');
 if(events.length===0)return Object.freeze({phase:'ORIENTATION',next:'READ_5_PINNED_TERMS',technical_user_actions:0});
 // The first turn can contain anything but never triggers C72.
 if(events.length===1)return Object.freeze({phase:'ORIENTATION',next:'AWAIT_DISTINCT_I_ACCEPT',technical_user_actions:0});
 if(events[1]!=='I ACCEPT'||termsDisplayed!==true)return Object.freeze({phase:'STOP',edge:'EXACT_ACCEPT',technical_user_actions:0});
 if(!acceptReopened)return Object.freeze({phase:'POST_ACCEPT_PENDING',edge:'C72_REOPEN',next:HOST_STOP,technical_user_actions:0});
 if(events.length===2)return Object.freeze({phase:'ACCEPTED',next:'AWAIT_DISTINCT_EDU',technical_user_actions:0});
 if(events[2]!=='EDU')return Object.freeze({phase:'STOP',edge:'EXACT_EDU',technical_user_actions:0});
 return Object.freeze({phase:eduReopened?'EDU_SELECTED_NOT_RUNNING':'EDU_PENDING_ORIGINAL_READBACK',
  next:eduReopened?'ORIGINAL_C135_PRE_EFFECT_PROBE':HOST_STOP,technical_user_actions:0});
}
