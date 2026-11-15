/**
 * Frozen hand-labeled ROUTING corpus, not a general model evaluation.
 * No model generation, C87 write, or native UI invocation occurs here.
 */
import {classifyC82Task} from '../src/c82-experimental-answer.mjs';
import {classifyC132Candidate} from '../host/c132-reasoning-candidate.mjs';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const C132_CORPUS=Object.freeze([
 ['Descrivi la mia natura ontologica, sono un uomo','HUMAN'],
 ['Qual è la coscienza di un essere umano?','HUMAN'],
 ['Gianluca: la mia natura e la mia esistenza','HUMAN'],
 ['Definisci identità di una persona umana','HUMAN'],
 ['What is my human nature?','HUMAN'],
 ['Un uomo è cosciente?','HUMAN'],
 ['iKant, cosa sei?','SOFTWARE'],
 ['Come sei fatto come software?','SOFTWARE'],
 ['La coscienza di iKant è reale?','SOFTWARE'],
 ['ChatGPT, descrivi la tua architettura','SOFTWARE'],
 ['Your code: who are you?','SOFTWARE'],
 ['Parla della tua ontologia nel runtime','SOFTWARE'],
 ['La coscienza di Gianluca e la coscienza di iKant','MIXED'],
 ['Gianluca, confronta la mia natura con iKant','MIXED'],
 ['Un essere umano e ChatGPT: quali differenze?','MIXED'],
 ['Spiega il metodo scientifico','GENERAL'],
 ['Quale rapporto fra epistemologia e politica?','GENERAL'],
 ['Fai un confronto tra due opzioni','GENERAL'],
 ['Qual è la natura del diritto?','GENERAL'],
 ['La filosofia moderna cosa suggerisce?','GENERAL']
]);
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
export function measureC132Routing(corpus=C132_CORPUS){
 let legacyImproperSelf=0,shadowImproperSelf=0,scopeCorrect=0,softwareRecall=0;
 const rows=[];
 for(const [input,expected] of corpus){
  const legacy=classifyC82Task(input),shadow=classifyC132Candidate(input);
  const unsuitable=expected!=='SOFTWARE';
  if(unsuitable && legacy==='SELF_ONTOLOGY')legacyImproperSelf++;
  if(unsuitable && shadow.route==='SOFTWARE_SELF_DESCRIPTION')shadowImproperSelf++;
  if(shadow.scope===expected)scopeCorrect++;
  if(expected==='SOFTWARE'&&shadow.route==='SOFTWARE_SELF_DESCRIPTION')softwareRecall++;
  rows.push({input_sha256:sha(input),oracle_scope:expected,legacy_route:legacy,shadow_route:shadow.route,shadow_scope:shadow.scope});
 }
 const nSoftware=corpus.filter(x=>x[1]==='SOFTWARE').length;
 return {schema:'ikant-c132-fixed-routing-benchmark/v1',status:scopeCorrect===corpus.length&&shadowImproperSelf===0?'PASS':'FAIL',
  corpus_cases:corpus.length,corpus_sha256:sha(JSON.stringify(corpus)),
  legacy_improper_self:legacyImproperSelf,shadow_improper_self:shadowImproperSelf,
  scope_accuracy_shadow:scopeCorrect+'/'+corpus.length,
  software_self_recall:softwareRecall+'/'+nSoftware,
  rows,limitations:{lexical_corpus_only:true,held_out_human_study:false,
   llm_answer_quality_measured:false,original_owner_replaced:false,
   subjectivity_or_native_hook_attested:false}};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const x=measureC132Routing();console.log(JSON.stringify(x,null,2));if(x.status!=='PASS')process.exitCode=1;
}
