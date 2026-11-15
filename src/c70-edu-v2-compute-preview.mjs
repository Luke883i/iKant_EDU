import { qualifyC69ExperimentalPreview } from '../host/c69-edu-v2-preview.mjs';
import { compileCognitiveTurn, updateExperience, validateCognitiveTurn } from './cognition-core.mjs';
import { composeC82ExperimentalAnswer } from './c82-experimental-answer.mjs';
import { retroactPsyche } from './psyche.mjs';
import { emptyPsyche, emptyExperience } from './state.mjs';
import { emptySelfWorld, prepareSelfWorldTurn, finalizeSelfWorldTurn,
  validateSelfWorldState, validateSelfWorldTurn } from './self-world-state.mjs';
import { nodeDispatchReceiptPure, validateNodeDispatchReceipt } from './runtime-dispatch.mjs';
import { sha256 } from './contract.mjs';
import {deriveC124LanguageChannels} from './c124-channel-bridge.mjs';

const blocked = new Set(['I ACCEPT', 'I ACCEPT EXPERIMENTAL', 'EXIT IKANT',
  'PROBE IKANT', 'INITIALIZE IKANT']);
const sensitive = /(?:password\s*[:=]|api[_ -]?key\s*[:=]|secret\s*[:=]|private[_ -]?key\s*[:=]|bearer\s+[a-z0-9._~-]+)/i;
const digest = x => sha256(Buffer.from(String(x), 'utf8'));
function deny(code, edge) {
  return { schema:'ikant-le-c70-compute-preview/v1', status:code,
    first_unclosed_edge:edge, active:false, canonical_runtime:false,
    native_event_attested:false, source_origin_attested:false,
    full_runtime_root_verified:false, persistent:false, owner_receipt_issued:false,
    host_delivery_attested:false, permitted_operations:[], turns:[], authority:0 };
}
/**
 * Host-owned laboratory execution of existing source kernels, NOT an iKant session.
 * C69 checks caller-supplied README blob identity, not a GitHub origin receipt.
 * The running source code must be separately integrity-checked by the host.
 * No canonical state, file writer, side effects or native platform capabilities.
 */
export function runC70ExperimentalComputePreview(x={}) {
  if (x===null || typeof x!=='object' || Array.isArray(x))
    return deny('EXPERIMENTAL_SCOPE_REJECTED','INPUT_ENVELOPE');
  for (const key of ['canonicalContinuation','blockedRuntimeResume','requestCanonicalRuntime',
    'acceptanceEventId','acceptanceObservedMonotonicMs','nativeOriginClaim',
    'claimActive','requestPersistent','requestOwnerReceipt','requestPrivilegedAction']) {
    if (Object.hasOwn(x,key)) return deny('EXPERIMENTAL_SCOPE_REJECTED','INDEPENDENT_WORK_BOUNDARY');
  }
  const q = qualifyC69ExperimentalPreview(x);
  if (!['EXPERIMENTAL_SOURCE_PREVIEW','EXPERIMENTAL_LOCAL_PREVIEW'].includes(q.status))
    return deny(q.status,q.first_unclosed_edge);
  const messages=x.messages;
  if (!Array.isArray(messages) || messages.length<1 || messages.length>5 ||
      messages.some(m=>typeof m!=='string' || m.trim().length<1 ||
        Buffer.byteLength(m,'utf8')>600 || blocked.has(m.trim()) || sensitive.test(m)))
    return deny('EXPERIMENTAL_INPUT_REJECTED','BOUNDED_INPUT');
  let psyche=emptyPsyche(), experience=emptyExperience(), selfWorld=emptySelfWorld();
  const turns=[];
  for (const [i,input] of messages.entries()) {
    const c=compileCognitiveTurn(input,{psyche,experience},
      {hostEngine:'C70_HOST_OWNED_LAB',resourceGrants:[]});
    if (!validateCognitiveTurn(c)) return deny('EXPERIMENTAL_KERNEL_REJECTED','COGNITIVE_VALIDATION');
    const dispatch=nodeDispatchReceiptPure(input,{epoch:null,status:'C70_EPHEMERAL_LAB'},
      {hostSurface:'C70_HOST_OWNED_LAB'});
    if (!validateNodeDispatchReceipt(dispatch,
      {input,statusBefore:'C70_EPHEMERAL_LAB',hostSurface:'C70_HOST_OWNED_LAB'}).ok)
      return deny('EXPERIMENTAL_KERNEL_REJECTED','NODE_DISPATCH');
    const missing=c.resources.some(r=>r.status!=='GRANTED');
    const prepared=prepareSelfWorldTurn(selfWorld,{input,nodeDispatch:dispatch,
      centralMode:c.central.mode,intentClass:c.intent.interaction,resourceGap:missing,
      psycheBefore:psyche,psychePreAction:c.psyche.pre_action});
    const outcome=['PRACTICAL_REVIEW','CRITIQUE','HORIZON_BLOCK'].includes(c.central.mode)?'GUARD':'ANSWER';
    const after=retroactPsyche(c.psyche.pre_action,{outcome});
    const finalized=finalizeSelfWorldTurn(selfWorld,prepared,{outcome,psycheAfter:after});
    if (!validateSelfWorldTurn(finalized.turn)||!validateSelfWorldState(finalized.state))
      return deny('EXPERIMENTAL_KERNEL_REJECTED','SELF_WORLD_VALIDATION');
    const composed=composeC82ExperimentalAnswer(input,c);
    const surface=composed.text;
    const languageChannels=deriveC124LanguageChannels({c,prepared,composed,inputSha256:digest(input)});
    turns.push({index:i+1,input_sha256:digest(input),method:c.method,
      central_mode:c.central.mode,policy:prepared.policy.name,
      resource_grants:0,resource_gap:missing,action_executed:false,
      output_sha256:digest(surface),demonstration_surface:surface,response_family:composed.family,
      semantic_scope:composed.semantic_scope,source_grounding:composed.evidence_grade,
      node_dispatch_input_bound:true,workspace_recurrence_cycles:prepared.workspace.recurrence_cycles,
      c124_language_channels:languageChannels,language_channel_sha256:languageChannels.channel_sha256,
      autobiography_before:prepared.recall.count,episode_hash:finalized.turn.episode.episode_hash,
      preceding_episode_hash:finalized.turn.episode.previous_episode_hash,
      telemetry_complete:finalized.turn.telemetry.complete,
      phenomenal_claim:false,operational_subject_qualified:false,authority:0});
    psyche=after; experience=updateExperience(experience,c,outcome);
    selfWorld=finalized.state;
  }
  return {schema:'ikant-le-c70-compute-preview/v1',status:'EXPERIMENTAL_COMPUTE_PREVIEW',
    mode:'HOST_OWNED_INDEPENDENT_COMPUTE_LAB',c69_status:q.status,
    source_head_claim:x.sourceHead,source_blob_sha1:q.source_blob_sha1,
    source_blob_identity_checked:true,source_origin_attested:false,
    full_runtime_root_verified:false,executed_repository_kernel:true,
    node_major:Number(process.versions.node.split('.')[0]),
    in_invocation_turns:turns.length,ephemeral_autobiography:turns.length,
    ephemeral_last_episode_hash:selfWorld.autobiography.last_episode_hash,
    active:false,canonical_runtime:false,native_event_attested:false,
    persistent:false,owner_receipt_issued:false,host_delivery_attested:false,
    no_canonical_lifecycle_transition:true,c30_tier_issued:false,
    claim_class:'EXPERIMENTAL_HOST_OWNED_NOT_IKANT_RUNTIME',
    permitted_operations:['REPOSITORY_STUDY','EXPERIMENTAL_DESIGN','DRAFT_USER_REQUESTED_OUTPUT'],
    turns,authority:0};
}
