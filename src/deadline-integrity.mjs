export const DEADLINE_RESULT=Object.freeze({
  PASS:'DEADLINE_PASS',
  ORIGIN_UNAVAILABLE:'DEADLINE_ORIGIN_UNAVAILABLE',
  ORIGIN_INVALID:'DEADLINE_ORIGIN_INVALID',
  ELAPSED_UNAVAILABLE:'DEADLINE_ELAPSED_UNAVAILABLE',
  EXCEEDED:'DEADLINE_EXCEEDED'
});
const TERMINAL=new Set([DEADLINE_RESULT.ORIGIN_UNAVAILABLE,DEADLINE_RESULT.ORIGIN_INVALID,DEADLINE_RESULT.ELAPSED_UNAVAILABLE,DEADLINE_RESULT.EXCEEDED]);
const HEX40=/^[a-f0-9]{40}$/;
const HEX64=/^[a-f0-9]{64}$/;
export function isDeadlineTerminal(result){return TERMINAL.has(result);}
export function classifyDeadlineEvidence(origin,{sourceHead=null,termsDigest=null,deadlineMs=120000}={}){
  if(origin==null)return{result:DEADLINE_RESULT.ORIGIN_UNAVAILABLE,terminal:true,reason:'origin_absent'};
  const schema=origin?.schema;if(!['ikant-le-acceptance-origin/v1','ikant-le-acceptance-origin/v2'].includes(schema)||origin.authority!==0||origin.deadline_origin!=='I_ACCEPT'||origin.clock!=='MONOTONIC'||origin.observed_at_accept!==true)return{result:DEADLINE_RESULT.ORIGIN_INVALID,terminal:true,reason:'origin_shape'};
  if(typeof origin.event_id!=='string'||origin.event_id.length<16||origin.event_id.length>128)return{result:DEADLINE_RESULT.ORIGIN_INVALID,terminal:true,reason:'event_id'};
  if(sourceHead!==null&&(origin.source_head!==sourceHead||!HEX40.test(String(sourceHead))))return{result:DEADLINE_RESULT.ORIGIN_INVALID,terminal:true,reason:'source_binding'};
  if(termsDigest!==null&&(origin.terms_digest!==termsDigest||!HEX64.test(String(termsDigest))))return{result:DEADLINE_RESULT.ORIGIN_INVALID,terminal:true,reason:'terms_binding'};
  const elapsed=origin.elapsed_to_runtime_entry_ms;
  if(!Number.isFinite(elapsed)||elapsed<0)return{result:DEADLINE_RESULT.ELAPSED_UNAVAILABLE,terminal:true,reason:'elapsed_unavailable'};
  if(schema==='ikant-le-acceptance-origin/v2'){
    const o=origin.origin_monotonic_ms,r=origin.runtime_entry_monotonic_ms,t=origin.origin_ticket;
    if(!Number.isFinite(o)||o<0||!Number.isFinite(r)||r<o||!t||t.schema!=='ikant-le-acceptance-origin-ticket/v1'||t.event_id!==origin.event_id||t.source_head!==origin.source_head||t.terms_digest!==origin.terms_digest||t.deadline_origin!=='I_ACCEPT'||t.clock!=='MONOTONIC'||t.observed_at_accept!==true||t.origin_monotonic_ms!==o||t.authority!==0)return{result:DEADLINE_RESULT.ORIGIN_INVALID,terminal:true,reason:'origin_ticket_binding'};
    if(Math.abs((r-o)-elapsed)>.001)return{result:DEADLINE_RESULT.ORIGIN_INVALID,terminal:true,reason:'elapsed_binding'};
  }
  if(elapsed>deadlineMs)return{result:DEADLINE_RESULT.EXCEEDED,terminal:true,reason:'elapsed_exceeded',elapsed_ms:elapsed};
  return{result:DEADLINE_RESULT.PASS,terminal:false,reason:'pass',elapsed_ms:elapsed};
}
export function admissionEpochRecoverable(state){
  if(!state)return false;
  if(state.admission?.new_chat_required===true)return false;
  if(state.bootstrap?.integrity_time_gate_required===false)return true;
  if(isDeadlineTerminal(state.bootstrap?.deadline_terminal))return false;
  return true;
}
export function canUseManualRecovery(state){
  if(state?.bootstrap?.integrity_time_gate_required===false)return Boolean(state?.accepted)&&state?.bootstrap?.evidence_verified===true&&state?.admission?.new_chat_required!==true&&typeof state?.admission?.acceptance_event_id==='string'&&state?.bootstrap?.acceptance_event_id===state?.admission?.acceptance_event_id;
  return Boolean(state?.accepted)&&state?.bootstrap?.evidence_verified===true&&state?.bootstrap?.deadline_result===DEADLINE_RESULT.PASS&&!isDeadlineTerminal(state?.bootstrap?.deadline_terminal)&&state?.admission?.new_chat_required!==true&&typeof state?.admission?.acceptance_event_id==='string'&&state?.bootstrap?.acceptance_event_id===state?.admission?.acceptance_event_id;
}

export function canResumeActivation(state){if(state?.bootstrap?.integrity_time_gate_required===false)return Boolean(state?.accepted)&&state?.admission?.acceptance_consumed===true&&typeof state?.epoch==='string'&&state.epoch.length>0&&state?.status==='DEGRADED'&&state?.admission?.breached!==true&&state?.admission?.new_chat_required!==true&&typeof state?.admission?.acceptance_event_id==='string'&&state?.bootstrap?.acceptance_event_id===state.admission.acceptance_event_id&&HEX40.test(String(state?.bootstrap?.source_head||state?.admission?.source_head||''));return Boolean(state?.accepted)&&state?.admission?.acceptance_consumed===true&&typeof state?.epoch==='string'&&state.epoch.length>0&&state?.status==='DEGRADED'&&state?.admission?.breached!==true&&state?.admission?.new_chat_required!==true&&!isDeadlineTerminal(state?.bootstrap?.deadline_terminal)&&typeof state?.admission?.acceptance_event_id==='string'&&state?.bootstrap?.acceptance_event_id===state.admission.acceptance_event_id&&HEX64.test(String(state?.bootstrap?.deadline_origin_receipt_sha256||''))&&HEX64.test(String(state?.bootstrap?.remote_history_sha256||''))&&Number.isFinite(state?.bootstrap?.deadline_elapsed_ms)&&state.bootstrap.deadline_elapsed_ms>=0;}
