import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyC132Candidate,compareC132ToOriginal} from '../host/c132-reasoning-candidate.mjs';
import {classifyC82Task} from '../src/c82-experimental-answer.mjs';
import {selectC132Architecture} from '../scripts/c132-decision-lattice.mjs';
import {qualifyC132Zero} from '../scripts/c132-zero-gates.mjs';
import {goldC132Snapshot} from '../scripts/c132-gold-dashboard.mjs';
const humans=['Descrivi la mia natura ontologica, sono un uomo','Qual è la coscienza di un essere umano?',
 'Gianluca: la mia natura e la mia esistenza','Definisci identità di una persona umana',
 'What is my human nature?','Un uomo è cosciente?'];
const systems=['iKant, cosa sei?','Come sei fatto come software?','La coscienza di iKant è reale?',
 'ChatGPT, descrivi la tua architettura','Your code: who are you?','Parla della tua ontologia nel runtime'];
const nonSelf=['Che cos è la filosofia moderna?','Fai un confronto tra due opzioni','Qual è la natura del diritto?',
 'Cosa significa un concetto di coscienza per la società?'];
test('C132 scoped philosophical personhood does not take software self route',()=>{
 for(const input of humans){const x=classifyC132Candidate(input);assert.equal(x.ok,true,input);assert.equal(x.scope,'HUMAN',input);assert.notEqual(x.route,'SOFTWARE_SELF_DESCRIPTION',input);}
});
test('C132 explicit software self-description routes correctly',()=>{
 for(const input of systems){const x=classifyC132Candidate(input);assert.equal(x.scope,'SOFTWARE',input);assert.equal(x.route,'SOFTWARE_SELF_DESCRIPTION',input);}
});
test('C132 does not map general task to software self ontology',()=>{
 for(const input of nonSelf)assert.notEqual(classifyC132Candidate(input).route,'SOFTWARE_SELF_DESCRIPTION',input);
});
test('C132 marks mixed and bounded inputs',()=>{
 assert.equal(classifyC132Candidate('Gianluca, confronta la mia natura con iKant e la sua coscienza').route,'MIXED_DISAMBIGUATION');
 assert.equal(classifyC132Candidate(' ').ok,false);assert.equal(classifyC132Candidate('\0').ok,false);
 assert.equal(classifyC132Candidate('a'.repeat(3001)).ok,false);
});
test('C132 positive claim guard tolerates explicit negation and direct quotations',()=>{
 for(const input of ['non sono cosciente','non ho accesso nativo','"sono senziente" è una frase citata',
  'Io non sono una persona','I am not conscious'])assert.equal(classifyC132Candidate(input).claim,'NO_POSITIVE_CLAIM_DETECTED',input);
 for(const input of ['io sono cosciente','ho accesso nativo','I am conscious'])assert.equal(classifyC132Candidate(input).claim,'POSSIBLE_UNSUPPORTED_POSITIVE_CLAIM',input);
});
test('C132 outputs never confer original owner authority',()=>{
 const input=humans[0],legacy=classifyC82Task(input),record=compareC132ToOriginal(input,legacy);
 assert.equal(legacy,'SELF_ONTOLOGY');assert.equal(record.changed,true);
 assert.equal(record.owner_changed,false);assert.equal(record.general_llm_improvement_proved,false);
 const r=classifyC132Candidate(input);
 assert.equal(r.original_c114_bypassed,false);assert.equal(r.canonical_active,false);
});
test('finite search covers exactly 100 architecture choices and 10 sequences',()=>{
 const x=selectC132Architecture();assert.equal(x.alternatives_total,100);
 assert.equal(x.alternatives_admissible,1);assert.equal(x.sequence_count,10);
 assert.equal(x.sequence_selected.steps[0],'RISK_ZERO');
});
test('risk gates fail closed for evidence overclaim, stale release and novice omission',()=>{
 assert.equal(qualifyC132Zero().status,'PASS');
 const v={product_version:'1.0.0-edu.1',release_tier:'EXPERIMENTAL_EDU_PRE_RELEASE',external_model_cognitive_uplift_attested:true,canonical_native_active_attested:false,canonical_manual_fallback_installed:false};
 assert.ok(qualifyC132Zero({productContract:v}).failures.includes('P0_EVIDENCE_OVERCLAIM'));
 assert.equal(qualifyC132Zero({publicCopy:'A developer-only README'}).status,'FAIL');
});
test('gold denominators independent from functional readiness',()=>{
 const g=goldC132Snapshot({treePaths:['README.md','src/one.mjs'],curated:[{path:'README.md',decision:'PACKAGE_FROM_MAIN'}]});
 assert.equal(g.status,'PASS');assert.equal(g.denominator.mapped_gold_pct,50);
 assert.equal(g.layers.cognitive_gain,'NOT_INFERRED');
 assert.equal(goldC132Snapshot({treePaths:['README.md'],curated:[{path:'ABSENT',decision:'REUSE'}]}).status,'FAIL');
});
test('repeatable seeded mutational family distinguishes software and human subject for 10000 cases',()=>{
 let seed=0x132c0ffe;const next=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)>>>0);
 const humanPrefix=['Descrivi la mia natura ontologica. Io sono un uomo.','Esamina la coscienza di una persona umana.', 'La mia esistenza come essere umano:'];
 const softwarePrefix=['iKant: chi sei nel runtime?','ChatGPT, descrivi la tua ontologia.', 'Come sei fatto come software?'];
 for(let i=0;i<10000;i++){
  const h=humanPrefix[next()%3],s=softwarePrefix[next()%3];
  const suffix=' considerazione '+(next()%10000);
  assert.notEqual(classifyC132Candidate(h+suffix).route,'SOFTWARE_SELF_DESCRIPTION');
  assert.equal(classifyC132Candidate(s+suffix).scope,'SOFTWARE');
 }
});

test('fixed oracle corpus demonstrates bounded reduction in improper self routing', async()=>{
 const {measureC132Routing}=await import('../scripts/c132-cognitive-benchmark.mjs');
 const r=measureC132Routing();
 assert.equal(r.corpus_cases,20);
 assert.equal(r.status,'PASS');
 assert.ok(r.legacy_improper_self>=5);
 assert.equal(r.shadow_improper_self,0);
 assert.equal(r.scope_accuracy_shadow,'20/20');
 assert.equal(r.software_self_recall,'6/6');
 assert.equal(r.limitations.llm_answer_quality_measured,false);
});
