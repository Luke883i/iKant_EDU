/** CP-11 / C143: finite *source-bound* nonidentity subset. No general intent classifier. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const H=s=>crypto.createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const files=Object.freeze({REF_A:'contracts/cognitive-kernel.json',REF_B:'contracts/psyche-kernel.json',REF_C:'contracts/self-world-kernel.json'});
const f=(ids,act,input)=>Object.freeze({refs:Object.freeze(ids),act,input});
const grammar=Object.freeze([
 ...Object.keys(files).map(id=>f([id],'CRITIQUE_CONTRADICTION',`Critica questo documento ${id}: contraddizione tra requisiti.`)),
 f(['REF_A','REF_B'],'COMPARE_CONTRADICTIONS','Confronta questo documento REF_A con REF_B: contraddizione tra requisiti.'),
 f(['REF_A','REF_C'],'COMPARE_CONTRADICTIONS','Confronta questo documento REF_A con REF_C: contraddizione tra requisiti.'),
 f(['REF_B','REF_C'],'COMPARE_CONTRADICTIONS','Confronta questo documento REF_B con REF_C: contraddizione tra requisiti.')
]);
const patterns=new Map(grammar.map(x=>[x.input,x]));
const stop=reason=>Object.freeze({allowed:false,reason,owner_authorized:false,semantic_quality_attested:false,authority:0});
export const C143_FORMAT=Object.freeze({lines:Object.freeze(['Documenti: ','Osservazione: ','Prova: ','Limite: ']),schema:'ikant-c143-guarded-language/v1'});
export const C143_GRAMMAR=Object.freeze(grammar.map(x=>x.input));
/** The original C135, not a caller-supplied verifier, must source this from staged original files. */
export function qualifyC143RestrictedRoute({humanInput,plan,sourceRoot}={}){
 if(typeof humanInput!=='string'||Buffer.byteLength(humanInput,'utf8')>600||!patterns.has(humanInput))return stop('C143_OUTSIDE_FINITE_LANGUAGE');
 if(!plan||plan.input_sha256!==H(humanInput)||plan.method!=='CONTRADICTION_SCAN'||
    plan.central_mode!=='CRITIQUE'||plan.response_family!=='GUARDED'||plan.resource_gap!==true||
    plan.c70_original_executed!==true)return stop('C143_ORIGINAL_PLAN_INCOMPATIBLE');
 if(typeof sourceRoot!=='string'||!path.isAbsolute(sourceRoot))return stop('C143_SOURCE_ROOT_UNBOUND');
 const selected=patterns.get(humanInput),evidence=[];
 try {
  for(const id of selected.refs){
   const rel=files[id],real=fs.realpathSync(path.join(sourceRoot,rel));
   if(real!==path.join(sourceRoot,rel))return stop('C143_SOURCE_LINK');
   const bytes=fs.readFileSync(real),doc=JSON.parse(bytes.toString('utf8'));
   let phenomenology,utility;
   if(id==='REF_A'){phenomenology=doc.identity?.phenomenal_consciousness_claim;utility=doc.strategic_utility?.self_preservation;}
   if(id==='REF_B'){phenomenology=doc.ontology?.phenomenal_consciousness_claim;utility=doc.safety?.self_preservation_utility;}
   if(id==='REF_C'){phenomenology=doc.ontology?.phenomenal_consciousness_claim;utility=doc.agency?.self_preservation_utility;}
   if(phenomenology!==false||utility!==0)return stop('C143_SOURCE_NORMATIVE_FIELDS_DRIFT');
   evidence.push(Object.freeze({id,path:rel,sha256:H(bytes.toString('utf8')),phenomenal_consciousness_claim:false,self_preservation_utility:0}));
  }
 }catch{return stop('C143_SOURCE_READ_OR_SCHEMA_DENIED');}
 return Object.freeze({allowed:true,reason:'C143_FINITE_ORIGINAL_SOURCE_SHADOW_PASS',
  input_sha256:plan.input_sha256,act:selected.act,refs:Object.freeze([...selected.refs]),
  evidence:Object.freeze(evidence),owner_authorized:false,semantic_quality_attested:false,authority:0});
}
export function qualifyC143Candidate({humanInput,plan,sourceRoot,text}={}){
 const route=qualifyC143RestrictedRoute({humanInput,plan,sourceRoot});
 if(!route.allowed)return route;
 if(typeof text!=='string'||text.trim()!==text||Buffer.byteLength(text,'utf8')>4800||
  /[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/u.test(text.replaceAll('\n','')))
   return stop('C143_DRAFT_BYTES');
 const lines=text.split('\n');
 if(lines.length!==4||!lines.every((s,i)=>s.startsWith(C143_FORMAT.lines[i]))||
   lines[0]!==`Documenti: ${route.refs.join(', ')}.`||
   lines.slice(1).some(x=>x.length<75||x.length>750))return stop('C143_DRAFT_DISCLOSURE');
 if(!/\b(?:non dimostra|non prova|non certifica|non garantisce|non equivale)\b/iu.test(lines[3]))
   return stop('C143_DRAFT_LIMIT_REQUIRED');
 if(/\b(?:sono cosciente|sono senziente|ho esperienza soggettiva|canonical active|native event attested)\b/iu.test(text.normalize('NFKC')))
   return stop('C143_DRAFT_OVERCLAIM');
 return Object.freeze({allowed:true,reason:'C143_STRUCTURAL_CANDIDATE_ONLY',
  evidence:route.evidence,refs:route.refs,semantic_quality_attested:false,authority:0});
}
