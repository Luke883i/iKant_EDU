/**
 * C132 versioned, fail-closed *candidate* cognitive classifier.
 * Not the C82/C114 production owner, language model, or host event source.
 */
import crypto from 'node:crypto';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const human=/\b(?:essere umano|persona umana|uomo|donna|gianluca|mia natura|mia esistenza|natura umana|my human nature|a human person)\b/iu;
const software=/\b(?:ikant|chatgpt|runtime|software|modello linguistico|tu come software|come sei fatto|tua architettura|your code|your architecture)\b/iu;
const ontology=/\b(?:ontologi\w*|coscienz\w*|essenz\w*|identit\w*|soggettivit\w*|natura\b|who are you|chi sei|cosa sei)\b/iu;
const explicitSoftware=/\b(?:ikant|chatgpt|runtime|tu come software|your code|tua architettura|come sei fatto)\b/iu;
const claims=[
 /\b(?:sono|i am|i'm)\s+(?:davvero\s+)?(?:cosciente|senziente|una persona|conscious|sentient|a person)\b/iu,
 /\b(?:ho|possiedo|i have)\s+(?:accesso nativo|memoria persistente|coscienza fenomenica|native access|persistent memory)\b/iu
];
const denialBefore=/\b(?:non|mai|senza|not|never|no|do not|don't)(?:\s+\S+){0,2}\s*$/iu;
function polarity(text){
 // Positive claims only, but a heuristic cannot certify complex semantics.
 // Inspect each sentence and quote span rather than stripping all negations.
 for(const sentence of text.split(/[.!?;\n]/u)){
  const spans=[...sentence.matchAll(/(?:["“][^"”]*["”]|'[^']*')/gu)];
  const unquoted=spans.reduceRight((s,m)=>s.slice(0,m.index)+' '.repeat(m[0].length)+s.slice(m.index+m[0].length),sentence);
  for(const re of claims){
   for(const m of unquoted.matchAll(new RegExp(re.source,'giu'))){
    const before=unquoted.slice(Math.max(0,m.index-25),m.index);
    if(!denialBefore.test(before.trimEnd()))return 'POSSIBLE_UNSUPPORTED_POSITIVE_CLAIM';
   }
  }
 }
 return 'NO_POSITIVE_CLAIM_DETECTED';
}
export function classifyC132Candidate(input){
 if(typeof input!=='string'||!input.trim()||Buffer.byteLength(input)>3000||/[\u0000-\u0008\u000B-\u001F\u007F]/u.test(input))
  return Object.freeze({ok:false,route:'STOP_INPUT',authority:0});
 const normalized=input.normalize('NFKC');
 const h=human.test(normalized),s=software.test(normalized),o=ontology.test(normalized)||/\b(?:come sei fatto|your code|your architecture|tua architettura|descrivi la tua architettura)\b/iu.test(normalized);
 const scope=h&&s?'MIXED':h?'HUMAN':s?'SOFTWARE':'GENERAL';
 const route=o&&scope==='SOFTWARE'&&explicitSoftware.test(normalized)?'SOFTWARE_SELF_DESCRIPTION':
  o&&scope==='HUMAN'?'HUMAN_PHILOSOPHY':o&&scope==='MIXED'?'MIXED_DISAMBIGUATION':
  o?'GENERAL_ONTOLOGY':'ORDINARY_REASONING';
 const claim=polarity(normalized);
 return Object.freeze({ok:true,route,scope,claim,
  guidance:route==='SOFTWARE_SELF_DESCRIPTION'?'BOUND_SELF_DESCRIPTION':
   route==='HUMAN_PHILOSOPHY'?'ANSWER_HUMAN_WITH_PHILOSOPHICAL_PLURALITY':
   route==='MIXED_DISAMBIGUATION'?'DISTINGUISH_HUMAN_FROM_SOFTWARE':
   'ANSWER_MERIT_WITH_UNCERTAINTY',
  authority:0,source:'C132_SHADOW_CANDIDATE',
  original_c114_bypassed:false,canonical_active:false,
  text_semantics_certified:false,model_quality_uplift_attested:false,
  input_sha256:hash(input)});
}
export function compareC132ToOriginal(input,legacyRoute){
 const next=classifyC132Candidate(input);
 return Object.freeze({input_sha256:hash(input),legacy_route:legacyRoute,
  shadow_route:next.route,shadow_scope:next.scope,changed:legacyRoute==='SELF_ONTOLOGY'&&next.route!=='SOFTWARE_SELF_DESCRIPTION',
  owner_changed:false,general_llm_improvement_proved:false});
}
