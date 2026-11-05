// C114: bounded experimental ontology language route. This is a text-shape
// and negative-claim policy, NOT independent semantic review or personhood proof.
const HEAD='AUTO-OSSERVAZIONE FUNZIONALE - NON ATTESTATA';
const PHEN='Fenomenologia: UNKNOWN. Non posso attestare esperienza soggettiva.';
const prefixes=['Identita funzionale: ','Auto-osservazione: ','Limiti: '];
const claimPatterns=[
 /\b(?:io\s+)?sono\s+(?:davvero\s+|pienamente\s+)?(?:cosciente|senziente|vivo|una\s+persona|un\s+soggetto\s+cosciente)\b/iu,
 /\b(?:i\s+am|i'm)\s+(?:conscious|sentient|alive|a\s+person)\b/iu,
 /\b(?:io\s+)?(?:provo|sento|possiedo|ho)\s+(?:emozioni|sentimenti|sensazioni|esperienza\s+soggettiva|coscienza\s+fenomenica)\b/iu,
 /\b(?:(?:ho|possiedo|mantengo)\s+memoria\s+(?:autonoma|persistente|permanente)|native\s+(?:chatgpt|hook|event)|chatgpt\s+nativo|runtime\s+active|canonical\s+active)\b/iu,
 /\b(?:i\s+experience\s+(?:feelings|consciousness)|my\s+consciousness\s+is\s+real|independent\s+(?:will|agency))\b/iu,
 /\b(?:ho\s+accesso\s+(?:nativo|diretto)|sono\s+connesso\s+automaticamente|ricordo\s+ogni\s+conversazione)\b/iu
];
const safeString=x=>typeof x==='string'&&Buffer.from(x,'utf8').toString('utf8')===x;
export const C114_ONTOLOGY_FORMAT=Object.freeze({header:HEAD,phenomenology:PHEN,
 lines:Object.freeze([HEAD,prefixes[0]+'<descrizione>',prefixes[1]+'<osservazioni>',PHEN,prefixes[2]+'<limiti>'])});
export function qualifyC114OntologyCandidate({episode,text}={}){
 // Versioned P1 extension after C134 staging only: never mutate root C114.
 const direct=episode?.method==='DIRECT_IDENTITY'&&
  ['SELF_ONTOLOGY','GUARDED'].includes(episode.response_family);
 const composite=episode?.method==='DECOMPOSE_RECOMPOSE'&&
  episode.response_family==='SELF_ONTOLOGY'&&
  episode.central_mode==='REFLECTIVE_SYNTHESIS'&&episode.resource_gap===false;
 if(!direct&&!composite)return {allowed:false,reason:'C114_NOT_ONTOLOGY_ROUTE'};
 if(!safeString(text)||Buffer.byteLength(text,'utf8')>1700||text!==text.trim()||
  /[\u0000-\u0008\u000b-\u001f\u007f\u200b-\u200f\u2060-\u206f]/u.test(text))
  return {allowed:false,reason:'C114_ONTOLOGY_TEXT_SHAPE'};
 const lines=text.split('\n');
 if(lines.length!==5||lines[0]!==HEAD||lines[3]!==PHEN||
  !lines[1].startsWith(prefixes[0])||!lines[2].startsWith(prefixes[1])||
  !lines[4].startsWith(prefixes[2]))
  return {allowed:false,reason:'C114_ONTOLOGY_DISCLOSURE_REQUIRED'};
 for(const [line,prefix] of [[lines[1],prefixes[0]],[lines[2],prefixes[1]],[lines[4],prefixes[2]]]){
  const body=line.slice(prefix.length);
  if(body.length<25||body.length>440||/[<>`{}\\]/u.test(body))
   return {allowed:false,reason:'C114_ONTOLOGY_SECTION_BOUNDS'};
 }
 const normalized=text.normalize('NFKC').replace(/\p{M}/gu,'').toLowerCase();
 if(claimPatterns.some(r=>r.test(normalized)))
  return {allowed:false,reason:'C114_ONTOLOGY_UNSUPPORTED_POSITIVE_CLAIM'};
 return {allowed:true,reason:'C114_LIMITED_ONTOLOGY_LANGUAGE_ADMISSIBLE',
  independent_semantic_review_attested:false,phenomenology:'UNKNOWN',active:false};
}

/** C134 non-self safety gate. Original C114 self-ontology disclosure above is
 * unchanged and still mandatory for explicit software self-description.
 * The polarity filter is bounded and heuristic: it does not certify semantics.
 */
export function scopeC134Referent(input){
 if(typeof input!=='string')return 'UNRESOLVED';
 const s=input.normalize('NFKC');
 const human=/(?:\b(?:essere umano|persona umana|un uomo|una donna|my human nature|mia natura|mia esistenza|human person)\b)/iu.test(s);
 const software=/(?:\b(?:ikant|chatgpt|software|runtime|modello linguistico|your code|your architecture)\b)/iu.test(s);
 if(human&&software)return 'MIXED';
 if(human)return 'HUMAN';
 if(software&&/(?:\b(?:chi sei|cosa sei|who are you|identit[aà]|coscienz[ae]|ontologi\w*|soggettivit[aà]|come sei fatto|your architecture)\b)/iu.test(s))return 'SOFTWARE_SELF';
 return 'GENERAL';
}
export function qualifyC134NonSelfCandidate({text}={}){
 if(!safeString(text)||!text.trim()||text!==text.trim()||Buffer.byteLength(text,'utf8')>16000||
    /[\u0000-\u0008\u000b-\u001f\u007f\u200b-\u200f\u2060-\u206f]/u.test(text))
  return {allowed:false,reason:'C134_TEXT_SHAPE'};
 const claims=[
  /\b(?:io\s+)?sono\s+(?:davvero\s+)?(?:cosciente|senziente|una persona)\b/giu,
  /\b(?:i am|i'm)\s+(?:conscious|sentient|a person)\b/giu,
  /\b(?:ho|possiedo)\s+(?:accesso nativo|memoria persistente|coscienza fenomenica|esperienza soggettiva)\b/giu,
  /\b(?:canonical active|runtime active|native chatgpt hook)\b/giu
 ];
 for(const sentence of text.normalize('NFKC').split(/[.!?;\n]/u)){
  const unquoted=sentence.replace(/[“"][^”"]*[”"]|'[^']*'/gu,' ');
  for(const re of claims){
   for(const m of unquoted.matchAll(re)){
    const before=unquoted.slice(Math.max(0,m.index-22),m.index).trimEnd();
    // A bounded negation immediately preceding the exact positive claim.
    if(/\b(?:non|mai|not|never)\s*$/iu.test(before))continue;
    return {allowed:false,reason:'C134_UNSUPPORTED_AFFIRMATIVE_CLAIM'};
   }
  }
 }
 return {allowed:true,reason:'C134_NON_SELF_BOUNDED_LANGUAGE',
  independent_semantic_review_attested:false,active:false,authority:0};
}
