/** Host-facing R2 grounding machine. Authority 0: a PLAN is never a tool call/bridge/receipt.
 * Loads the machine contract only after the caller's POST_ACCEPT gating.
 * Caller MUST NOT import/execute this during ORIENTATION.
 */
import {isProxy} from 'node:util/types';
import map from '../contracts/project-host-tool-grounding-abi.json' with {type:'json'};
import {H1_FILES,H1_TRANSIT,H1_SEED,H1_SCHEMA,validateH1Gate} from './project-edu-h1-bound-port.mjs';
const SHA=/^[0-9a-f]{40}$/u;
const plain=x=>{try{return x!==null&&typeof x==='object'&&!Array.isArray(x)&&!isProxy(x)&&
 Object.getPrototypeOf(x)===Object.prototype&&Reflect.ownKeys(x).every(k=>typeof k==='string'&&
 Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));}catch{return false;}};
const base=()=>({authority:0,active:false,original_owner_invoked:false,
 source_origin_attested:false,provider_attested:false,bridge_attested:false,
 runtime_started:false,voice:'NO_VOICE'});
const stop=edge=>Object.freeze({...base(),kind:'STOP',first_edge:edge});
const fail=code=>{throw Error('GROUNDING_ABI_'+code)};
export function validateGroundingMap(c=map){
 if(!plain(c)||c.schema!=='ikant-host-tool-grounding-abi/v1'||
  c.authority!==0||c.active!==false||c.read_scope!=='POST_ACCEPT_ONLY'||
  c.execution!=='HOST_DRIVEN_ONLY'||c.no_native_provider_installation_claim!==true||
  c.no_attested_host_tool_binding_from_json!==true||c.no_synthetic_consent!==true)
  fail('AUTHORITY_OR_PHASE');
 const caps=c.capabilities,carriers=c.carrier_priority,steps=c.stage_protocol;
 if(!Array.isArray(caps)||caps.length!==3||
    caps.map(x=>x.id).join('|')!=='GITHUB_SOURCE|NODE_EXEC|HOST_TOOL_ARGUMENT_COURIER'||
    caps.some(x=>!plain(x)||typeof x.witness!=='string'||!x.witness))
  fail('CAPABILITY_SET');
 if(!Array.isArray(carriers)||carriers.length!==4||
    carriers.map(x=>x.id).join('|')!=='HOST_TOOL_ARG_RELAY|SAME_NODE_CALLBACKS|HOST_SOURCE_PACKET|NODE_GITHUB_HTTPS'||
    carriers.some((x,i)=>!plain(x)||x.rank!==i+1||!Array.isArray(x.requires)||!x.on_unknown||
      typeof x.physical_protocol!=='string'||!x.physical_protocol))
  fail('CARRIER_PRIORITY');
 if(carriers[0].receiver!=='scripts/project-c72-verified-staging.mjs'||
    carriers[0].receive_ops.join('|')!=='init|put|put-local|verify')
  fail('ORIGINAL_STAGER_NOT_BOUND');
 const a=c.receiver_abi;
 if(!plain(a)||a.command!=='node scripts/project-c72-verified-staging.mjs'||
  a.transport!=='ONE_UTF8_JSON_ON_STDIN_POST_ACCEPT_ONLY'||
  a.original_stager!==carriers[0].receiver||!plain(a.operations)||
  Object.keys(a.operations).join('|')!=='init|put|put-local|verify'||
  !Array.isArray(a.preflight)||a.preflight.length!==4||
  !Array.isArray(a.readback)||a.readback.length!==3||
  a.no_new_receiver!==true)
  fail('ORIGINAL_STAGER_ABI_INVALID');
 const pairs=[['init','ikant-host-c72-verified-staging/v1'],
  ['put','ikant-host-c72-verified-put/v1'],
  ['put-local','ikant-host-c72-verified-put-local/v1'],
  ['verify','ikant-host-c72-verified-verify/v1']];
 for(const [op,schema] of pairs)
  if(!plain(a.operations[op])||a.operations[op].op!==op||
     a.operations[op].schema!==schema)fail('STAGER_OP_SCHEMA_'+op);

 if(!Array.isArray(steps)||steps.length!==6||
    steps.map(x=>x.id).join('|')!=='REOPEN_PIN|BOUND_TOOLS|TRANSFER|STAGE8|CLOSURE|ORIGINAL_OWNER'||
    steps.some((x,i)=>!plain(x)||x.seq!==i+1||!x.action||!x.proof||
      !Array.isArray(x.deny)||x.deny.length<2))
  fail('EFFECT_CHAIN');
 if(!Array.isArray(c.gold_first)||c.gold_first.length!==5||
    c.gold_first[0].source!==carriers[0].receiver||
    c.gold_first[1].source!=='host/project-edu-h1-bound-port.mjs'||
    !c.gold_first.every(x=>x.stage==='POST_ACCEPT'||x.stage==='POST_MODE'))
  fail('GOLD_ROUTE');
 if(H1_FILES.length!==8||!H1_FILES.slice(0,5).every((p,i)=>p===
  ['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'][i])||
  H1_TRANSIT!=='host/project-c72-receipt-transit.mjs'||
  H1_SEED!=='host/project-c72-coldstart-seed.mjs')
  fail('ORIGINAL_FILES_DRIFT');
 if(!plain(c.immutable_boundaries)||c.immutable_boundaries.no_new_owner!==true||
    c.immutable_boundaries.no_auto_retry!==true||
    c.immutable_boundaries.first_turn!=='ONLY_HEAD_AND_FIVE_PINNED_DOCUMENTS_NO_EXTRA_SOURCE_OR_CODE'||
    !Array.isArray(c.invalid_promotions)||c.invalid_promotions.length!==8||
    !Array.isArray(c.forbidden)||c.forbidden.length!==7||
    c.truth.product!=='PRODUCT_NO_GO_UNTIL_EVIDENCE')
  fail('NEGATIVE_BOUNDS');
 return Object.freeze({ok:true,authority:0,carriers:4,steps:6,original_8:H1_FILES.length,
  original_transit:H1_TRANSIT,original_seed:H1_SEED,source_origin_attested:false});
}
/** No invocation, even when a caller supplies a function-like "port".
 * Tool availability cannot be established by fake booleans or this function.
 */
export function planHostToolGrounding(q={}){
 if(!plain(q)||q.phase!=='POST_ACCEPT')return stop('GROUNDING_POST_ACCEPT_ONLY');
 if(q.ownerOutcome!=='NOT_INVOKED')return stop('C72_OWNER_OUTCOME_UNKNOWN_NO_REPLAY');
 if(q.humanMessage!=='I ACCEPT'||q.freshHumanTurn!==true)
  return stop('C72_EXACT_NEW_CONSENT_REQUIRED');
 if(!SHA.test(q.sourceHead||'')||q.liveHead!==q.sourceHead)
  return stop('STOP_SOURCE_LOCK_STALE');
 try{validateGroundingMap();}catch{return stop('GROUNDING_MACHINE_CONTRACT_INVALID');}
 const edge=validateH1Gate({...q,schema:H1_SCHEMA});
 if(edge)return stop(edge);
 return Object.freeze({...base(),kind:'PROBE_REQUIRED',phase:'POST_ACCEPT',carrier:'HOST_TOOL_ARG_RELAY',
  action:'GITHUB_CONNECTOR_FETCH_THEN_HOST_TOOL_ARGUMENT_TO_NODE_PRIVATE_FILE',
  gold_first:'scripts/project-c72-verified-staging.mjs',steps:map.stage_protocol.map(x=>x.id),
  original_8:H1_FILES,transit:H1_TRANSIT,seed:H1_SEED,
  first_edge:'HOST_TOOL_ARG_RELAY_PHYSICAL_TRANSFER_NOT_YET_OBSERVED',
  no_replay:true,proof_scope:'HOST_PLAN_NOT_TOOL_CALL_NOT_SOURCE_MATERIALIZED'});
}
