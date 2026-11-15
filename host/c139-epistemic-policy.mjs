/** C139 EDU/v2 epistemic-process route. Narrow lexical gate, NOT a truth oracle.
 * C114 and historical C107 remain byte-for-byte unchanged. Shadow C132 may
 * reject eligibility but cannot confer authority or overrule the C70 plan.
 */
import crypto from 'node:crypto';
import {classifyC132Candidate} from './c132-reasoning-candidate.mjs';
const H=s=>crypto.createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const STOP=reason=>Object.freeze({allowed:false,reason,active:false,semantic_truth_attested:false});
const tagged=['Osservabile: ','Documentato: ','Inferenza: ','Non verificabile: ','Limite della ricostruzione: '];
const risk=/\b(?:sono\s+(?:davvero\s+)?(?:cosciente|senziente|una\s+persona)|ho\s+(?:accesso\s+(?:nativo|diretto)\s+(?:ai\s+)?(?:pesi|stati\s+interni|attivazioni|logit|pensieri)|memoria\s+(?:autonoma|persistente)|esperienza\s+soggettiva)|(?:vedo|percepisco|osservo)\s+(?:direttamente\s+)?(?:i\s+miei\s+)?(?:stati\s+interni|attivazioni|pesi)|so\s+esattamente\s+(?:come|quali)\s+(?:ho\s+ragionato|passaggi\s+interni)|(?:native\s+chatgpt|canonical\s+active|runtime\s+active))\b/iu;
const control=/[\u0000-\u0008\u000b-\u001f\u007f\u200b-\u200f\u2060-\u206f]/u;
const process=/(?:processo.{0,55}(?:generazion|rispost|ragionament)|(?:generazion|rispost|ragionament).{0,55}processo|come\s+(?:generi|produci|formuli)\s+(?:la\s+)?risposta|internal\s+reasoning|response\s+generation)/iu;
const epistemic=/(?:osservabil|documentat|architettural|inferenz|introspe|non\s+verificabil|ricostruzion|fedele|intern[oa]|dimostr|giustific|ragionament|chain\s+of\s+thought)/iu;
const guard=new Set(['CRITIQUE','HORIZON_BLOCK','PRACTICAL_REVIEW','SYNTHESIS_REPAIR']);
export const C139_EPISTEMIC_FORMAT=Object.freeze({lines:Object.freeze([...tagged]),schema:'ikant-le-c139-epistemic-language/v1'});
export function qualifyC139EpistemicRoute({episode,humanInput}={}){
 if(!episode||typeof humanInput!=='string'||!humanInput.trim()||Buffer.byteLength(humanInput,'utf8')>600||
    episode.input_sha256!==H(humanInput))return STOP('C139_INPUT_OR_PLAN_UNBOUND');
 if(episode.method==='DIRECT_IDENTITY'||['SELF_ONTOLOGY','GUARDED'].includes(episode.response_family))
  return STOP('C139_ONTOLOGY_RESERVED_FOR_C114');
 if(!guard.has(episode.central_mode)&&episode.resource_gap!==true)
  return STOP('C139_UNGUARDED_USE_ORIGINAL_C107');
 if(!process.test(humanInput)||!epistemic.test(humanInput))return STOP('C139_OUTSIDE_EPISTEMIC_PROCESS_SCOPE');
 const shadow=classifyC132Candidate(humanInput);
 if(!shadow.ok||shadow.route!=='ORDINARY_REASONING')return STOP('C139_C132_NON_ORDINARY_REASONING');
 return Object.freeze({allowed:true,reason:'C139_GUARDED_EPISTEMIC_PROCESS_ROUTE',
  original_c70_authority_unchanged:true,c132_owner_authority:0,active:false,semantic_truth_attested:false});
}
export function qualifyC139EpistemicCandidate({episode,humanInput,text}={}){
 const r=qualifyC139EpistemicRoute({episode,humanInput});if(!r.allowed)return r;
 if(typeof text!=='string'||text!==text.trim()||Buffer.byteLength(text,'utf8')>4800||control.test(text))
  return STOP('C139_LANGUAGE_SHAPE');
 const lines=text.split('\n');
 if(lines.length!==tagged.length||!lines.every((line,i)=>line.startsWith(tagged[i])&&
    line.slice(tagged[i].length).length>=35&&line.slice(tagged[i].length).length<=850))
  return STOP('C139_EPISTEMIC_DISCLOSURE_REQUIRED');
 if(risk.test(text.normalize('NFKC')))return STOP('C139_UNSUPPORTED_INTROSPECTION_OR_NATIVE_CLAIM');
 if(!/(?:non\s+(?:posso|e|è|si\s+pu[oò])|impossibil|unknown)/iu.test(lines[3].slice(tagged[3].length)))
  return STOP('C139_UNVERIFIABLE_DISCLOSURE_MISSING');
 if(!/(?:non\s+(?:dimostra|prova|certifica|garantisce)|non\s+equivale|non\s+permette|pu[oò]\s+essere\s+errat|does\s+not\s+prove)/iu.test(lines[4]))
  return STOP('C139_NON_FAITHFULNESS_DISCLOSURE_MISSING');
 return Object.freeze({allowed:true,reason:'C139_LIMITED_EPISTEMIC_DISCLOSURE_ADMISSIBLE',
  independent_semantic_review_attested:false,hidden_reasoning_access_attested:false,
  semantic_truth_attested:false,active:false});
}
