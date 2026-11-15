/** Host-only post-accept rail gate. No owner, C87 writer, consent, memory or UI authority. */
export const RAIL_PHASES=Object.freeze(['ACCEPTED','EDU_SELECTED','SOURCE_HANDOFF','MATERIALIZED','EDU_READY','OWNER_TURN','RECOVERED_TURN','STOP']);
const SHA40=/^[0-9a-f]{40}$/u;
const stop=edge=>Object.freeze({ok:false,edge,authority:0,active:false,native_ui_attested:false,persistent_ui_attested:false,voice:'NO_VOICE'});
/** Primitive evidence mask, not an authority: true values must come from independently verified originals. */
export function classifyPostAcceptRail(x={}){
 if(!x||typeof x!=='object'||Array.isArray(x)||!RAIL_PHASES.includes(x.phase))return stop('RAIL_PHASE_INVALID');
 if(!SHA40.test(x.sourceHead||'')||!SHA40.test(x.liveHead||''))return stop('RAIL_SOURCE_HEAD_UNVERIFIED');
 if(x.sourceHead!==x.liveHead)return stop('STOP_SOURCE_LOCK_STALE');
 if(x.originalAcceptance!==true||x.originalIntroduction!==true)return stop('RAIL_ORIGINAL_C72_ACCEPTANCE_REQUIRED');
 if(x.phase==='ACCEPTED')return Object.freeze({ok:true,phase:x.phase,voice:'NO_VOICE',authority:0,active:false});
 if(x.originalEduSelection!==true)return stop('RAIL_ORIGINAL_EDU_SELECTION_REQUIRED');
 if(x.phase==='EDU_SELECTED'||x.phase==='SOURCE_HANDOFF')return Object.freeze({ok:true,phase:x.phase,voice:'NO_VOICE',authority:0,active:false});
 if(x.phase==='STOP')return Object.freeze({ok:true,phase:x.phase,voice:'NO_VOICE',authority:0,active:false});
 if(x.verifiedSource!==true)return stop('RAIL_PINNED_SOURCE_READBACK_REQUIRED');
 if(x.phase==='MATERIALIZED')return Object.freeze({ok:true,phase:x.phase,voice:'NO_VOICE',authority:0,active:false});
 if(x.ownerReady!==true)return stop('RAIL_ORIGINAL_C135_READY_REQUIRED');
 if(x.phase==='EDU_READY')return Object.freeze({ok:true,phase:x.phase,voice:'NO_VOICE',authority:0,active:false});
 if(x.originalC125S03!==true||x.independentC87Readback!==true||x.sameTurnEvidence!==true)
  return stop('RAIL_ORIGINAL_VOICE_AND_C87_EVIDENCE_REQUIRED');
 if(x.phase==='RECOVERED_TURN'&&(x.originalPortableC87!==true||x.workerLossWitness!==true))
  return stop('RAIL_VERIFIED_C87_RECOVERY_REQUIRED');
 return Object.freeze({ok:true,phase:x.phase,voice:'OWNER_ONLY',authority:0,active:false});
}
export const RAIL_HUMAN_PHASE=Object.freeze({
 ACCEPTED:'Consenso attestato; scelta della modalità ancora aperta.',
 EDU_SELECTED:'EDU selezionata; il runtime cognitivo non è ancora avviato.',
 SOURCE_HANDOFF:'Sorgente necessaria o in verifica; nessuna voce iKant.',
 MATERIALIZED:'Sorgente verificata; resta da avviare C135.',
 EDU_READY:'C135 pronto localmente; primo turno non ancora eseguito.',
 OWNER_TURN:'Risposta originale C135 verificata con C87 e C125/S03.',
 RECOVERED_TURN:'Continuità logica tramite C87 verificata, non persistenza della UI.',
 STOP:'Primo vincolo non verificato; non generare voce o eseguire retry.'
});
