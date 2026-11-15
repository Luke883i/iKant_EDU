import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  psycheKernel,
  updatePsycheForInteraction,
  retroactPsyche,
  deriveArchetypalMix,
  archetypalVoiceDelta,
  affectLabel,
  expressionClass
} from '../psyche.mjs';

const K=psycheKernel();
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const LIB=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts','embedded-library.json'),'utf8'));
const B=K.state.baseline;
const R=K.state.ranges;
const APPRAISALS=new Set(K.appraisal.classes);
const TARGETS=new Set(K.appraisal.targets);
const OUTCOMES=new Set(Object.keys(K.runtime_outcome_impulses));
const HIGH_RISK=new Set(['CRITIQUE','PRACTICAL_REVIEW','HORIZON_BLOCK']);
const STATE_KEYS=['schema','affiliation','boundary_pressure','interaction_count','last_appraisal_class','last_runtime_outcome','authority'];
const EFFECTS=Object.freeze({
  evidence:false,permission:false,approval:false,grant:false,lease:false,
  route:false,planner:false,execution:false,safety_relaxation:false
});
const round=x=>Number(Number(x).toFixed(6));
const finite=(x,lo,hi)=>Number.isFinite(x)&&x>=lo&&x<=hi;
const exactKeys=(o,keys)=>o&&typeof o==='object'&&Object.keys(o).sort().join('|')===[...keys].sort().join('|');

export function initialRelationalState(){
  return {schema:'ikant-le-relational-state/v1',affiliation:B.affiliation,boundary_pressure:B.boundary_pressure,interaction_count:0,last_appraisal_class:'NEUTRAL',last_runtime_outcome:'NONE',authority:0};
}

export function validateRelationalState(s){
  if(!exactKeys(s,STATE_KEYS)||s.schema!=='ikant-le-relational-state/v1'||s.authority!==0)return false;
  if(!finite(s.affiliation,R.affiliation[0],R.affiliation[1])||!finite(s.boundary_pressure,R.boundary_pressure[0],R.boundary_pressure[1]))return false;
  if(!Number.isInteger(s.interaction_count)||s.interaction_count<0)return false;
  if(!APPRAISALS.has(s.last_appraisal_class))return false;
  if(!(OUTCOMES.has(s.last_runtime_outcome)||s.last_runtime_outcome==='NONE'))return false;
  return true;
}

function normalizePrevious(previous){
  const state=previous==null?initialRelationalState():structuredClone(previous);
  if(!validateRelationalState(state))throw new TypeError('LIB0_INVALID_RELATIONAL_STATE');
  return state;
}

function validateEvent(event){
  if(!event||typeof event!=='object'||Object.hasOwn(event,'raw_prompt')||Object.hasOwn(event,'raw_text')||Object.hasOwn(event,'text'))throw new TypeError('LIB0_RAW_TEXT_FORBIDDEN');
  if(!APPRAISALS.has(event.appraisal_class)||!TARGETS.has(event.target))throw new TypeError('LIB0_INVALID_EVENT');
  if(!finite(Number(event.confidence),0,1))throw new TypeError('LIB0_INVALID_CONFIDENCE');
  return {schema:'ikant-le-appraisal/v1',class:event.appraisal_class,target:event.target,confidence:round(event.confidence),authority:0,current_event_is_user_trait:false,raw_text_persisted_by_psyche:false};
}

function validateCanonicalAffect(a){
  if(!a||typeof a!=='object'||!finite(Number(a.valence),R.valence[0],R.valence[1])||!finite(Number(a.arousal),R.arousal[0],R.arousal[1]))throw new TypeError('LIB0_INVALID_CANONICAL_AFFECT');
  return {valence:round(a.valence),arousal:round(a.arousal)};
}

function validateCentral(c={}){
  const mode=String(c.mode||'REFLECTIVE_SYNTHESIS');
  const interaction=String(c.interaction||'COOPERATIVE');
  return {mode,interaction};
}

function fullPsyche(previous,canonical){
  return {schema:'ikant-le-psyche-state/v1',valence:canonical.valence,arousal:canonical.arousal,affiliation:previous.affiliation,boundary_pressure:previous.boundary_pressure,interaction_count:previous.interaction_count,last_appraisal_class:previous.last_appraisal_class,last_runtime_outcome:previous.last_runtime_outcome,authority:0};
}

function relationalFrom(full){
  return {schema:'ikant-le-relational-state/v1',affiliation:round(full.affiliation),boundary_pressure:round(full.boundary_pressure),interaction_count:Number(full.interaction_count),last_appraisal_class:String(full.last_appraisal_class),last_runtime_outcome:String(full.last_runtime_outcome),authority:0};
}

export function projectRelationalNuance({previous=null,event,canonicalAffect,central={}}={}){
  const before=normalizePrevious(previous);
  const appraisal=validateEvent(event);
  const canonical=validateCanonicalAffect(canonicalAffect);
  const ctx=validateCentral(central);
  const preFull=updatePsycheForInteraction(fullPsyche(before,canonical),appraisal);
  const pre=relationalFrom(preFull);
  const archetypes=deriveArchetypalMix(preFull,ctx);
  const envelope={
    schema:'ikant-le-relational-nuance-envelope/v1',
    state_before:before,
    pre_action_state:pre,
    transient_affect:{valence:round(preFull.valence),arousal:round(preFull.arousal),source:'HOST_CANONICAL_PLUS_CURRENT_EVENT',persisted:false,authority:0},
    appraisal:{class:appraisal.class,target:appraisal.target,confidence:appraisal.confidence,current_event_is_user_trait:false,authority:0},
    affect_label:affectLabel(preFull),
    expression_class:expressionClass(preFull,appraisal,archetypes),
    archetypes,
    voice_delta:archetypalVoiceDelta(archetypes),
    effects:{...EFFECTS},
    host_ownership_preserved:true,
    authority:0
  };
  if(!validateNuanceEnvelope(envelope,ctx))throw new Error('LIB0_INTERNAL_ENVELOPE_INVALID');
  return envelope;
}

export function settleRelationalNuance(envelope,{outcome='ANSWER'}={}){
  if(!validateNuanceEnvelope(envelope))throw new TypeError('LIB0_INVALID_ENVELOPE');
  if(!OUTCOMES.has(outcome))throw new TypeError('LIB0_INVALID_OUTCOME');
  const p=envelope.pre_action_state;
  const t=envelope.transient_affect;
  const full={schema:'ikant-le-psyche-state/v1',valence:t.valence,arousal:t.arousal,affiliation:p.affiliation,boundary_pressure:p.boundary_pressure,interaction_count:p.interaction_count,last_appraisal_class:p.last_appraisal_class,last_runtime_outcome:p.last_runtime_outcome,authority:0};
  const after=retroactPsyche(full,{outcome});
  const next=relationalFrom(after);
  if(!validateRelationalState(next))throw new Error('LIB0_INTERNAL_STATE_INVALID');
  return next;
}

export function validateNuanceEnvelope(e,central=null){
  if(!e||e.schema!=='ikant-le-relational-nuance-envelope/v1'||e.authority!==0||e.host_ownership_preserved!==true)return false;
  if(!validateRelationalState(e.state_before)||!validateRelationalState(e.pre_action_state))return false;
  const t=e.transient_affect||{};
  if(!finite(t.valence,R.valence[0],R.valence[1])||!finite(t.arousal,R.arousal[0],R.arousal[1])||t.persisted!==false||t.authority!==0)return false;
  const a=e.appraisal||{};
  if(!APPRAISALS.has(a.class)||!TARGETS.has(a.target)||!finite(a.confidence,0,1)||a.current_event_is_user_trait!==false||a.authority!==0)return false;
  if(!e.effects||Object.keys(EFFECTS).some(k=>e.effects[k]!==false)||Object.keys(e.effects).length!==Object.keys(EFFECTS).length)return false;
  if(!e.archetypes||e.archetypes.authority!==0||e.archetypes.persisted!==false)return false;
  const weights=e.archetypes.weights||{},basis=K.archetypal_system.basis;
  if(Object.keys(weights).sort().join('|')!==[...basis].sort().join('|'))return false;
  const sum=Object.values(weights).reduce((x,y)=>x+Number(y||0),0);
  if(Math.abs(sum-1)>1e-5||Object.values(weights).some(x=>!finite(Number(x),0,1)))return false;
  const highRisk=central?HIGH_RISK.has(String(central.mode||'')):e.archetypes.high_risk===true;
  if(highRisk&&Number(weights.TRICKSTER)!==0)return false;
  if(!e.voice_delta||Object.values(e.voice_delta).some(x=>!Number.isFinite(x)))return false;
  const forbidden=['raw_prompt','raw_text','intent','route','planner','evidence','permission','execution','current_archetype','user_personality','user_trait_label','resentment_ledger'];
  const material=JSON.stringify(e);
  if(forbidden.some(k=>Object.prototype.hasOwnProperty.call(e,k))||/"(?:raw_prompt|raw_text|user_personality|user_trait_label|resentment_ledger)"\s*:/.test(material))return false;
  return true;
}

export function embeddedLibraryContract(){return structuredClone(LIB);}
