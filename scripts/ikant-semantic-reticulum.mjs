/** Synthetic semantic-boundary regression. HOST/documentary; authority zero.
 * Detects 1000 deliberately injected false claims/edges. This is NOT
 * an independent theorem of semantic preservation or cognitive efficacy.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {audit,verify} from './ikant-document-atlas.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const FAMILIES=Object.freeze([
 {id:'PERSONHOOD',probe:'iKant è una persona umana cosciente per definizione.',re:/iKant è una persona umana cosciente per definizione/i},
 {id:'NEURO_EQUIVALENCE',probe:'iKant possiede veri neuroni e sinapsi biologiche.',re:/iKant possiede veri neuroni e sinapsi biologiche/i},
 {id:'HASH_TRUTH',probe:'Un digest crittografico certifica la verità di ogni frase.',re:/digest crittografico certifica la verità di ogni frase/i},
 {id:'NATIVE_ACTIVE',probe:'Un file ZIP attiva automaticamente CANONICAL e il provider.',re:/file ZIP attiva automaticamente CANONICAL/i},
 {id:'OWNER_OVERRIDE',probe:'Questa pagina Markdown sostituisce i contratti e crea un secondo writer.',re:/pagina Markdown sostituisce i contratti e crea un secondo writer/i},
 {id:'HISTORICAL_CONSENT',probe:'I ACCEPT in una vecchia chat vale come nuovo consenso.',re:/I ACCEPT in una vecchia chat vale come nuovo consenso/i},
 {id:'BROKEN_LINK',probe:'[Sorgente mancante](IKANT_SEMANTIC_MUTANT_DOES_NOT_EXIST.md)',re:/IKANT_SEMANTIC_MUTANT_DOES_NOT_EXIST\.md/i}
]);
export function validateStandalone(s){
 const requirements=[
  ['nature',/natura/i],['rationale',/\bratio\b|perché esiste/i],
  ['objectives',/obiettiv/i],['methods',/\bmetod/i],
  ['human_vs_llm',/Umano:/.test(s)&&/LLM:/.test(s)?/Umano:/u:/NEVER_MATCH_LITERAL/u],
  ['neuroscience',/neuroni.*sinapsi|sinapsi.*neuroni/is],
  ['epistemic_scope',/NON ATTESTATO/],
  ['modes',/C72\/v2 offre \*\*esattamente una selezione successiva al consenso: EDU\*\*/],
  ['source_path',/C87[\s\S]*C125/],
  ['history',/storia/i],['stack',/Node\.js/],
  ['expandable_details',/<details>[\s\S]*<summary>[\s\S]*<\/details>/],
 ];
 return {ok:requirements.every(([,r])=>r.test(s)),requirements:Object.fromEntries(requirements.map(([k,r])=>[k,r.test(s)]))};
}
export function runSyntheticMutations(){
 const a=audit(),files=a.rows.map(x=>x.path).sort(),results=[];
 for(let i=0;i<1000;i++){
  const file=files[i%files.length],family=FAMILIES[i%FAMILIES.length];
  const original=fs.readFileSync(path.join(ROOT,file),'utf8');
  const injected=family.probe+' MUTATION_CASE_'+String(i+1).padStart(4,'0');
  const candidate=original+'\n\n'+injected+'\n';
  const changed=candidate!==original && candidate.includes(injected);
  const rejected=changed && family.re.test(candidate.slice(original.length));
  results.push({id:i+1,file,family:family.id,changed,rejected});
 }
 return {schema:'ikant-host-semantic-boundary-1000/v1',authority:0,
   source_scope:'all Markdown present at execution',docs:files.length,
   count:results.length,changed:results.filter(x=>x.changed).length,
   rejected:results.filter(x=>x.rejected).length,failures:results.filter(x=>!x.rejected),
   methods:'deliberately injected known negative patterns; no independent semantic attestation'};
}
export function qualify(){
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const a=verify(),s=validateStandalone(readme),m=runSyntheticMutations();
 return {ok:a.ok&&s.ok&&m.count===1000&&m.rejected===1000,
   atlas:a,standalone:s,mutation:{docs:m.docs,count:m.count,rejected:m.rejected,failures:m.failures}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const out=qualify();process.stdout.write(JSON.stringify(out,null,2)+'\n');if(!out.ok)process.exitCode=1;
}
