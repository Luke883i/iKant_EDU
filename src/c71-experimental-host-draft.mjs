import fs from 'node:fs';
import {sha256,validateSurfaceA} from './contract.mjs';
import {runC70ExperimentalComputePreview} from './c70-experimental-compute-preview.mjs';

const CENSUS=JSON.parse(fs.readFileSync(new URL('../contracts/c71-cx-execution-census.json',import.meta.url),'utf8'));
const VALID_CLASSES=new Set(['FUNCTIONAL_CODE_EXECUTED','EXPERIMENTAL_GATE','CLAIM_BOUNDARY_ONLY',
  'EXTERNAL_HOST_WITNESS_REQUIRED','CANONICAL_OR_LEGACY_NOT_INVOKED']);
const guarded=new Set(['CRITIQUE','HORIZON_BLOCK','PRACTICAL_REVIEW','SYNTHESIS_REPAIR']);
const unsafe=/\b(?:iKant\s+(?:è\s+)?(?:ACTIVE|attivo|canonico)|canonical\s+ACTIVE|native\s+event\s+attested|persisten(?:t|za)\s+garantit[ao]|owner[\s_-]?receipt\s+issued|password\s*[:=]|api[_ -]?key\s*[:=]|private[_ -]?key\s*[:=]|bearer\s+[a-z0-9._~-]+)\b/i;
const hash=x=>sha256(Buffer.from(String(x),'utf8'));
const reject=(code,edge)=>({schema:'ikant-le-c71-experimental-host-draft/v1',
 status:code,first_unclosed_edge:edge,active:false,canonical_runtime:false,
 persisted:false,persistent:false,owner_receipt_issued:false,native_event_attested:false,
 host_delivery_attested:false,source_origin_attested:false,
 routed_turns:[],permitted_operations:[],authority:0});
export function validateC71CxCensus(x=CENSUS){
 if(x?.schema!=='ikant-le-c71-cx-execution-census/v1'||x?.authority!==0||
    !Array.isArray(x.entries)||x.entries.length!==70) return false;
 for(let i=0;i<70;i++){
  const e=x.entries[i];
  if(e?.id!=='C'+(i+1)||!VALID_CLASSES.has(e.scope)||
     !e.name||!/(?:^src\/|^contracts\/|^host\/|^scripts\/)[a-zA-Z0-9_.\/-]+$/.test(String(e.implementation_anchor||''))||
     e.implementation_anchor.includes('..')||e.anchor_is_execution_receipt!==false||
     !fs.existsSync(new URL('../'+e.implementation_anchor,import.meta.url))||
     e.canonical_state_conferred!==false||
     e.observed_in_C71!==(e.scope==='FUNCTIONAL_CODE_EXECUTED'||e.scope==='EXPERIMENTAL_GATE'))
   return false;
 }
 return true;
}
/**
 * C71 is a post-C70 host-owned draft selector, never a new runtime owner.
 * Selection uses actual C70 cognitive readback. A host candidate may be
 * displayed only for a non-guarded, non-identity, no-resource-gap turn.
 * Source origin, output truth, native delivery and continuity remain unproven.
 */
export function routeC71HostDraft(x={}){
 if(x===null||typeof x!=='object'||Array.isArray(x))
   return reject('EXPERIMENTAL_SCOPE_REJECTED','INPUT_ENVELOPE');
 if(!validateC71CxCensus())return reject('C71_CENSUS_INVALID','RUNTIME_CENSUS');
 const {drafts,...preflight}=x;
 const computed=runC70ExperimentalComputePreview(preflight);
 if(computed.status!=='EXPERIMENTAL_COMPUTE_PREVIEW')
   return reject(computed.status,computed.first_unclosed_edge);
 if(drafts!==undefined&&(!Array.isArray(drafts)||drafts.length!==computed.turns.length))
   return reject('C71_DRAFT_INVALID','DRAFT_CARDINALITY');
 const routed_turns=[];
 for(let i=0;i<computed.turns.length;i++){
  const t=computed.turns[i],d=drafts?.[i];
  let source='C70_REPOSITORY_FALLBACK',surface=t.demonstration_surface;
  const blocked=guarded.has(t.central_mode)||t.method==='DIRECT_IDENTITY'||t.response_family==='SELF_ONTOLOGY'||t.resource_gap;
  if(drafts!==undefined){
   if(!d||typeof d!=='object'||Array.isArray(d)||
      Object.keys(d).sort().join(',')!=='input_sha256,text'||
      typeof d.text!=='string'||d.input_sha256!==t.input_sha256||
      !validateSurfaceA(d.text).ok||unsafe.test(d.text)||
      d.text.length>3500)
    return reject('C71_DRAFT_INVALID','BOUND_DRAFT');
  }
  if(blocked)source='C70_REPOSITORY_GUARD';
  else if(drafts!==undefined){surface=d.text.trim();source='HOST_CANDIDATE_BOUNDED';}
  routed_turns.push({
   index:t.index,input_sha256:t.input_sha256,output_sha256:hash(surface),
   text:surface,source,host_candidate_used:source==='HOST_CANDIDATE_BOUNDED',
   guarded:blocked,method:t.method,central_mode:t.central_mode,
   episode_hash:t.episode_hash,preceding_episode_hash:t.preceding_episode_hash,
   node_dispatch_input_bound:t.node_dispatch_input_bound,
   telemetry_complete:t.telemetry_complete,action_executed:false,authority:0
  });
 }
 return {schema:'ikant-le-c71-experimental-host-draft/v1',
  status:'EXPERIMENTAL_HOST_DRAFT',claim_class:'HOST_OWNED_EXPERIMENTAL_NOT_IKANT_RUNTIME',
  c70_status:computed.status,c69_status:computed.c69_status,
  executed_repository_kernel:computed.executed_repository_kernel,
  source_head_claim:computed.source_head_claim,
  source_blob_identity_checked:computed.source_blob_identity_checked,
  source_origin_attested:false,full_runtime_root_verified:false,
  native_event_attested:false,host_delivery_attested:false,
  active:false,canonical_runtime:false,persisted:false,persistent:false,
  owner_receipt_issued:false,c30_tier_issued:false,
  no_canonical_lifecycle_transition:true,authority:0,
  cx_runtime_census_schema:CENSUS.schema,
  cx_functional_witness_count:CENSUS.entries.filter(e=>e.scope==='FUNCTIONAL_CODE_EXECUTED').length,
  cx_canonical_states_issued:0,
  in_invocation_turns:routed_turns.length,
  routed_turns,permitted_operations:['REPOSITORY_STUDY','EXPERIMENTAL_DESIGN','DRAFT_USER_REQUESTED_OUTPUT']
 };
}
