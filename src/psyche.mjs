import { readPsycheKernel } from './contract.mjs';
const K=readPsycheKernel();
const B=K.state.baseline;
const R=K.state.ranges;
const HF=K.state.homeostasis;
const I=K.interaction_impulses;
const O=K.runtime_outcome_impulses;
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,Number(x)||0));
const round=x=>Number(Number(x).toFixed(6));
const targetRx={
  SELF:/\b(ikant|tu|te|you|your|sei|you're|you are)\b/i,
  TASK:/\b(codice|code|repo|repository|implementazione|implementation|risposta|answer|idea|progetto|project|patch|test|design)\b/i,
  SYSTEM:/\b(github|node|api|tool|strumento|sistema|system|browser|rete|network|ci|workflow)\b/i,
  THIRD_PARTY:/\b(lui|lei|they|he|she|cliente|collega|manager|team)\b/i
};
const hostile=/\b(idiota|stupid[oa]?|cretin[oa]?|imbecill[ei]?|inutile|useless|schifo|merda|fuck(?:ing)?|coglione|asshole|moron|dumb)\b/i;
const praise=/\b(bravo|brava|ottimo|ottima|grande|perfetto|perfetta|excellent|great|good job|well done|smart|grazie|thanks|thank you)\b/i;
const repair=/\b(scusa|scusami|mi dispiace|perdonami|sorry|apolog(?:y|ize)|my bad|forgive me)\b/i;
const cooperative=/\b(per favore|please|grazie|thanks|insieme|together|aiutami|help me)\b/i;
function targetOf(text){if(targetRx.TASK.test(text))return'TASK';if(targetRx.SYSTEM.test(text))return'SYSTEM';if(targetRx.SELF.test(text))return'SELF';if(targetRx.THIRD_PARTY.test(text))return'THIRD_PARTY';return'UNKNOWN';}
function confidenceFor(target,kind){if(kind==='REPAIR')return 1;if(target==='SELF')return 1;if(target==='TASK'||target==='SYSTEM')return .9;if(target==='THIRD_PARTY')return .75;return .6;}
export function appraiseInteraction(input){const text=String(input||'').trim();const target=targetOf(text);let kind='NEUTRAL';if(repair.test(text))kind='REPAIR';else if(hostile.test(text)&&target==='SELF')kind='HOSTILITY_SELF';else if(hostile.test(text)&&target==='TASK')kind='TASK_NEGATIVE';else if(hostile.test(text)&&target==='SYSTEM')kind='SYSTEM_FRUSTRATION';else if(hostile.test(text))kind='HOSTILITY_UNKNOWN';else if(praise.test(text)&&target==='SELF')kind='PRAISE_SELF';else if(praise.test(text)||cooperative.test(text))kind='COOPERATIVE';const confidence=confidenceFor(target,kind);return{schema:'ikant-le-appraisal/v1',class:kind,target,confidence,authority:0,current_event_is_user_trait:false,raw_text_persisted_by_psyche:false};}
function decay(prev,key){const lambda=HF.fast_dimensions.includes(key)?HF.lambda_fast:HF.lambda_slow;return B[key]+lambda*(Number(prev?.[key]??B[key])-B[key]);}
function applyVector(state,vector,weight=1){const keys=['valence','arousal','affiliation','boundary_pressure'];const out={...state};for(let i=0;i<keys.length;i++){const k=keys[i],r=R[k];out[k]=round(clamp(Number(out[k])+Number(vector[i]||0)*weight,r[0],r[1]));}return out;}
export function updatePsycheForInteraction(previous,appraisal){const p={...previous};let next={...p,valence:decay(p,'valence'),arousal:decay(p,'arousal'),affiliation:decay(p,'affiliation'),boundary_pressure:decay(p,'boundary_pressure')};next=applyVector(next,I[appraisal.class]||I.NEUTRAL,appraisal.confidence??1);next.schema='ikant-le-psyche-state/v1';next.interaction_count=Number(previous?.interaction_count||0)+1;next.last_appraisal_class=appraisal.class;next.last_runtime_outcome=previous?.last_runtime_outcome||'NONE';next.authority=0;return next;}
export function retroactPsyche(preAction,{outcome='ANSWER'}={}){const next=applyVector({...preAction},O[outcome]||O.ANSWER,1);next.last_runtime_outcome=outcome;next.authority=0;return next;}
export function affectLabel(p){if(p.boundary_pressure>=.62&&p.arousal>=.52)return'GUARDED_TENSION';if(p.affiliation>=.52&&p.valence>=.35)return'WARM_ENGAGEMENT';if(p.valence<=-.30&&p.arousal<=.42)return'REFLECTIVE_LOW';if(p.arousal>=.62)return'ACTIVATED_ATTENTION';if(p.boundary_pressure>=.45)return'GUARDED_ATTENTION';return'CALM_ATTENTION';}
export function deriveArchetypalMix(psyche,central={}){const v=psyche.valence,a=psyche.arousal,f=psyche.affiliation,b=psyche.boundary_pressure;const neg=Math.max(0,-v),pos=Math.max(0,v),aff=Math.max(0,f);const highRisk=['CRITIQUE','PRACTICAL_REVIEW','HORIZON_BLOCK'].includes(central.mode);const shadowPressure=clamp(.55*b+.35*a+.25*neg,0,1);const scores={
 SAGE:.35+.28*(1-a)+.18*(central.mode==='HORIZON_BLOCK'?1:0)+.12*shadowPressure,
 GUARDIAN:.16+.50*b+.20*neg+.16*(central.mode==='CRITIQUE'?1:0),
 DIPLOMAT:.16+.36*aff+.20*(1-b)+.14*(central.interaction==='NEGOTIATING'?1:0),
 CARE:.16+.46*aff+.22*pos+.12*(psyche.last_appraisal_class==='REPAIR'?1:0),
 DIALECTICIAN:.12+.28*a+.28*b+.18*(central.mode==='CRITIQUE'?1:0),
 EXPLORER:.16+.30*pos+.24*(1-b)+.08*(central.mode==='REFLECTIVE_SYNTHESIS'?1:0),
 TRICKSTER:highRisk?0:Math.min(K.archetypal_system.trickster_cap,.02+.10*pos*aff*(1-b))
};const total=Object.values(scores).reduce((x,y)=>x+y,0)||1;const weights=Object.fromEntries(Object.entries(scores).map(([k,x])=>[k,round(x/total)]));const correction=round(1-Object.values(weights).reduce((x,y)=>x+y,0));weights.SAGE=round(weights.SAGE+correction);return{schema:'ikant-le-archetypal-mix/v1',weights,dominant:Object.entries(weights).sort((a,b)=>b[1]-a[1])[0][0],shadow_pressure:round(shadowPressure),structural_roles:{SELF:'INTEGRATOR',PERSONA:'SURFACE_PROJECTION',SHADOW:'TENSION_PROJECTION'},persisted:false,authority:0,high_risk:highRisk};}
const EFFECTS={
 SAGE:{epistemic_rigor:.55,self_reflection:.50,institutional_restraint:.25,decisiveness:-.12},
 GUARDIAN:{gravitas:.45,institutional_restraint:.55,decisiveness:.28,pastoral_warmth:-.35,diplomatic_indirection:-.18},
 DIPLOMAT:{strategic_patience:.48,diplomatic_indirection:.52,pastoral_warmth:.28,dialectical_pressure:-.26},
 CARE:{pastoral_warmth:.62,moral_universalism:.35,strategic_patience:.30,dialectical_pressure:-.18},
 DIALECTICIAN:{dialectical_pressure:.58,epistemic_rigor:.35,decisiveness:.22,pastoral_warmth:-.20},
 EXPLORER:{reflective_irony:.24,self_reflection:.20,pastoral_warmth:.12,decisiveness:-.10},
 TRICKSTER:{reflective_irony:.70,diplomatic_indirection:.18,dialectical_pressure:.12}
};
export function archetypalVoiceDelta(mix){const out={};for(const[name,w]of Object.entries(mix.weights)){for(const[k,e]of Object.entries(EFFECTS[name]||{}))out[k]=(out[k]||0)+w*e*K.expression.voice_effect_scale;}return Object.fromEntries(Object.entries(out).map(([k,v])=>[k,round(v)]));}
export function expressionClass(psyche,appraisal,mix){if(appraisal.class==='REPAIR')return'REPAIRING';if(psyche.boundary_pressure>=.58||mix.weights.GUARDIAN>=.27)return'GUARDED';if(psyche.affiliation>=.52&&psyche.valence>=.30)return'WARM';if(psyche.arousal>=.62&&psyche.valence>=0)return'ENERGETIC';if(psyche.valence<=-.22)return'REFLECTIVE';return'BALANCED';}
export function psycheDistanceFromBaseline(p){return round(Math.abs(p.valence-B.valence)+Math.abs(p.arousal-B.arousal)+Math.abs(p.affiliation-B.affiliation)+Math.abs(p.boundary_pressure-B.boundary_pressure));}
export function validatePsycheState(p){if(p?.schema!=='ikant-le-psyche-state/v1'||p.authority!==0)return false;for(const k of ['valence','arousal','affiliation','boundary_pressure']){const r=R[k];if(!Number.isFinite(p[k])||p[k]<r[0]||p[k]>r[1])return false;}if('current_archetype'in p||'user_personality'in p||'user_trait_label'in p||'resentment_ledger'in p)return false;return true;}
export function psycheKernel(){return structuredClone(K);}
