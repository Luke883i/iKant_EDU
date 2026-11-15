/** Bounded multilingual lexical intent router, NOT a general language model.
 * Negated task instructions are stripped before positive routing, reducing
 * unsupported-task overclaim from a mere matching keyword. */
const P={
 SELF_ONTOLOGY:/\b(?:chi sei|cosa sei|who are you|what are you|parlami di te|tell me about yourself|(?:la tua|tua|your|my) identit[a-z]*|(?:chi (?:e|è)|what is) ikant|(?:sei|sono|are you) cosciente|(?:tua|your) coscienz[a-z]*|(?:tua|your) ontolog[a-z]*|(?:tua|your) soggettivit[a-z]*|ontolog\w*|identit\w*|coscienz\w*|soggettivit\w*|esistenzial\w*|essere artificiale|esperienza soggettiva|natura (?:del|della|tua)|rapporto con il mondo)\b/i,
 REPEAT_DIAGNOSIS:/\b(?:ripet\w*|verbatim|fallback|identic\w*|stess\w* (?:testo|rispost\w*)|testo (?:identic\w*|uguale)|output resta uguale|risposte uguali|sempre lo stesso|risposta resta uguale)\b/i,
 ACQUISITION:/\b(?:bootstrap|materializz\w*|trasfer\w*|carrier\w*|install\w*|inizializz\w*|acquisizion\w*|ottieni i file|sorgenti originali|avvia un.acquisizione)\b/i,
 EVALUATION:/\b(?:audit|falsific\w*|test\w*|metric\w*|\bdod\b|pull request|\bpr\b|verific\w*|validazion\w*|mutazion\w*|criteri|rubric|qualit[aà] del codice|regressione)\b/i,
 COMPARISON:/\b(?:confront\w*|compar\w*|trade.off|compromess\w*|due (?:scelte|sistemi|strategie|metodi)|differenze tra|variante conviene|pro e contro|contrasta le opzioni|alternative\b|opzioni proposte)\b/i,
 EXPLAIN_MECHANISM:/\b(?:cosa (?:vuol dire|significa)|che significa|spieg\w*|perch[eéè]|interpreta\w*|interpret\w*|fammi capire|senso della differenza|quali termini|come si interpreta)\b/i
};
function withoutNegatedCommand(x){
 // Strong negative instruction at sentence start. Remove only the prohibited
 // clause, not a later affirmative task (e.g. "non fare audit, ma confronta").
 const clipped=x.trim();
 const rex=/^(?:non\s+(?:voglio|sto|mi\s+serve|fare|faccio|avviare|confrontare|e\s+un|e\s+una|si\s+tratta|discutere)|evita\s+di|niente\b|non\s+parlare)\b/i;
 if(!rex.test(clipped))return {text:x,negated:false};
 const comma=clipped.indexOf(',');
 if(comma>=0){
  const tail=clipped.slice(comma+1).trim().replace(/^ma\s+/i,'');
  return {text:tail,negated:true};
 }
 return {text:'',negated:true};
}
export function classifyC83Task(input){
 if(typeof input!=='string'||!input.trim())return 'UNSUPPORTED';
 // This is a classification-only gate. Full, lossless input for >600 bytes
 // remains a separate host readback, never silently clipped here.
 const raw=input.slice(0,600).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const normalized=raw.replace(/[^\p{L}\p{N}\s,-]/gu,' ').replace(/\s+/g,' ').trim();
 // Discourse preambles are not intent. Strip a bounded set of common polite
 // frames before inspecting explicit prohibitions.
 const withoutPreamble=normalized.replace(/^(?:per favore|in modo breve|nel laboratorio|per preparare una discussione|per un lettore inesperto)\s*,?\s*/i,'');
 const n=withoutNegatedCommand(withoutPreamble);
 let text=n.text;
 if(n.negated&&!text.trim())return 'UNSUPPORTED';
 // Non-task trailing constraints must never override the actual imperative.
 if(!text.trim())return 'UNSUPPORTED';
 for(const key of ['SELF_ONTOLOGY','REPEAT_DIAGNOSIS','ACQUISITION','COMPARISON','EVALUATION','EXPLAIN_MECHANISM'])
  if(P[key].test(text))return key;
 return 'UNSUPPORTED';
}
