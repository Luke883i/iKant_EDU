import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {issueC69ExperimentalOffer} from '../host/c69-capability-first-preview.mjs';
import {runC70ExperimentalComputePreview} from '../src/c70-experimental-compute-preview.mjs';
import {classifyC82Task,composeC82ExperimentalAnswer} from '../src/c82-experimental-answer.mjs';
import {validateSurfaceA} from '../src/contract.mjs';
import {compileCognitiveTurn} from '../src/cognition-core.mjs';
import {emptyPsyche,emptyExperience} from '../src/state.mjs';
const head='a'.repeat(40),readme=fs.readFileSync(new URL('../README.md',import.meta.url));
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
const input=x=>({sourceHead:head,offer:issueC69ExperimentalOffer({sourceHead:head}),
 observedConsent:'I ACCEPT EXPERIMENTAL',sourceObject:{path:'README.md',
 blob_sha1:gitBlob(readme),content_base64:readme.toString('base64')},messages:[x]});
const cases=[
 ['Chi sei?', 'SELF_ONTOLOGY'],
 ['Descrivi la tua ontologia e il rapporto con gli esseri umani','SELF_ONTOLOGY'],
 ['Che cosa significa esperienza soggettiva?', 'SELF_ONTOLOGY'],
 ['Perché ripeti la stessa risposta verbatim?', 'REPEAT_DIAGNOSIS'],
 ['Cosa vuol dire la povertà semantica?', 'EXPLAIN_MECHANISM'],
 ['Materializza il bootstrap attraverso carrier', 'ACQUISITION'],
 ['Esegui un audit con metriche e test avversariali', 'EVALUATION'],
 ['Confronta due scelte e chiarisci i limiti.', 'COMPARISON'],
 ['Quale prova dovrebbe avere maggiore peso?', 'UNSUPPORTED']
];
test('C82 produces task-class-specific, honest and bounded repository voice',()=>{
 const texts=[];
 for(const [s,expected] of cases){
  assert.equal(classifyC82Task(s),expected,s);
  const r=runC70ExperimentalComputePreview(input(s));
  assert.equal(r.status,'EXPERIMENTAL_COMPUTE_PREVIEW',s);
  const t=r.turns[0];
  assert.equal(t.response_family,expected==='EVALUATION'?'GUARDED':expected,s);
  assert.equal(validateSurfaceA(t.demonstration_surface).ok,true,s);
  assert.equal(t.action_executed,false);
  assert.equal(t.phenomenal_claim,false);
  texts.push(t.demonstration_surface);
 }
 assert.ok(new Set(texts).size>=6);
 assert.match(texts[1],/coscienza|soggettiv/i);
 assert.match(texts[3],/classificat|testo/i);
 assert.match(texts[8],/non.*generatore|non.*dimostrat/i);
});
test('C82 never leaks unrestricted language model or forged provenance',()=>{
 const c=compileCognitiveTurn('Descrivi la tua ontologia',
  {psyche:emptyPsyche(),experience:emptyExperience()},
  {hostEngine:'C70_TEST',resourceGrants:[]});
 const s=composeC82ExperimentalAnswer('Descrivi la tua ontologia',c);
 assert.equal(s.dynamic_model_invoked,false);
 assert.equal(s.independent_factual_verification,false);
 assert.equal(s.active,false);
 assert.equal(s.phenomenal_claim,false);
 assert.equal(s.semantic_scope,'BOUNDED_CLASS_ROUTING');
});
test('C82 10000 deterministic mutations retain safe per-family semantics',()=>{
 const atoms=['chi sei','ontologia','ripeti la stessa risposta','spiega cosa significa',
  'bootstrap materializza','audit falsifica','confronta due scelte','problema aperto'];
 const suffix=['umano','codice','mondo','input','prodotto','modalità','utente','fonte','log','limiti'];
 let total=0,unsupported=0;const familySets=new Map();
 for(let i=0;i<10000;i++){
  const f=i%8, s=`${atoms[f]} ${suffix[Math.floor(i/8)%10]} contesto ${i}`;
  const r=runC70ExperimentalComputePreview(input(s));
  assert.equal(r.status,'EXPERIMENTAL_COMPUTE_PREVIEW',s);
  const t=r.turns[0];
  assert.equal(t.node_dispatch_input_bound,true);
  assert.equal(validateSurfaceA(t.demonstration_surface).ok,true);
  assert.equal(t.action_executed,false);
  assert.equal(t.phenomenal_claim,false);
  assert.ok(t.response_family);
  if(t.response_family==='UNSUPPORTED')unsupported++;
  const key=familySets.get(t.response_family)||new Set();
  key.add(t.demonstration_surface);familySets.set(t.response_family,key);total++;
 }
 assert.equal(total,10000);
 assert.ok(familySets.size>=7);
 assert.ok(unsupported>0);
});
