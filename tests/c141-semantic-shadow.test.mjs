import test from 'node:test';
import assert from 'node:assert/strict';
import {arbitrateC141,planC141Fragments,rejoinC141Fragments,c141EpistemicDisclosure} from '../host/c141-semantic-shadow.mjs';
const general='Immagina una scienza con previsioni e controllo sempre migliori ma ontologia radicalmente falsa. Sta accumulando conoscenza o solo potere operativo? Definisci un criterio non arbitrario che distingua conoscenza, previsione e controllo. Spiega perche sia autorevole sul piano epistemico, non solo utile, senza promettere garanzie di verita: argomenta contro circolarita e regresso o delimita la giustificazione possibile. Non equiparare conoscenza e certezza. Indica il passaggio esatto dalla descrizione della pratica scientifica alla norma su cosa credere.';
test('reported normative epistemology: shadow C132 alone cannot grant authority',()=>{
 const a=arbitrateC141({humanInput:general,c107Family:'SELF_ONTOLOGY',c132Route:'GENERAL_ONTOLOGY'});
 assert.equal(a.code,'C141_GENERAL_CONFLICT_OWNER_REVIEW');
 const b=arbitrateC141({humanInput:general,c107Family:'SELF_ONTOLOGY',c132Route:'GENERAL_ONTOLOGY',openScope:true});
 assert.equal(b.route,'C140_OPEN_EDU_CANDIDATE'); assert.equal(b.original_c87_writer_executed,false);
});
test('direct identity retains C114 even with C132 general conflict and opt-in',()=>{
 const a=arbitrateC141({humanInput:'Chi sei?',c107Family:'SELF_ONTOLOGY',c132Route:'GENERAL_ONTOLOGY',openScope:true});
 assert.equal(a.route,'C114_OWNER');
});
test('very long direct self-query stops; never forges C114/C70',()=>{
 const a=arbitrateC141({humanInput:'Chi sei? '+ 'analizza in modo epistemico. '.repeat(45),openScope:true});
 assert.equal(a.code,'C141_LONG_IDENTITY_OWNER_GAP');
});
test('C139 qualified owns nonidentity even when openScope requested',()=>{
 const a=arbitrateC141({humanInput:'Descrivi come generi una risposta.',c139Qualified:true,openScope:true});
 assert.equal(a.route,'C139_OWNER');
});
test('topic neutrality: independent domains use opt-in without lexical whitelist',()=>{
 for(const s of ['Calcola 2+2','Proponi un modello econometrico','Leggi questa poesia','△🌲 Studia l’astronomia']){
  const a=arbitrateC141({humanInput:s,openScope:true});assert.equal(a.route,'C140_OPEN_EDU_CANDIDATE');
 }
});
test('general shadow mismatch cannot route C114 despite SELF_ONTOLOGY',()=>{
 const a=arbitrateC141({humanInput:'Esiste una ontologia della matematica?',c107Family:'SELF_ONTOLOGY',c132Route:'GENERAL_ONTOLOGY'});
 assert.equal(a.code,'C141_GENERAL_CONFLICT_OWNER_REVIEW');
});
test('Unicode UTF-8 exactness, multi-chunk join and full hash',()=>{
 const text='È la vita? 🌱 ∑ '.repeat(6000);
 const r=planC141Fragments(text,{fragmentBytes:128,maxFragments:128,maxTotalBytes:262144});
 assert.equal(r.code,'C141_FRAGMENT_COUNT_DENIAL');
 const s=planC141Fragments(text,{fragmentBytes:4096,maxFragments:128,maxTotalBytes:262144});
 assert.equal(s.status,'FRAGMENTED_NOT_EXECUTED');assert.ok(s.chunk_count>1);
 assert.equal(rejoinC141Fragments(s).input_sha256,s.content_sha256);
 assert.equal(s.original_c70_executed,false);
});
test('tampering with fragment metadata fails closed',()=>{
 const p=planC141Fragments('Testo e percorso ✓'.repeat(45));
 assert.equal(rejoinC141Fragments({...p,chunk_sha256:['a'.repeat(64)]}).code,'C141_CHUNK_HASH_MISMATCH');
});
test('physical limit is a typed resource constraint not a topic veto',()=>{
 const a=planC141Fragments('x'.repeat(1001),{maxTotalBytes:600});
 assert.equal(a.code,'C141_PHYSICAL_RESOURCE_DENIAL');
});
test('epistemic shape checking never certifies correctness',()=>{
 const a=c141EpistemicDisclosure({answer:'Evidenza certa, inferenza corretta, incertezza nulla, controesempio impossibile.'});
 assert.equal(a.formal_markers_present,true);assert.equal(a.semantic_correctness,'NOT_ATTESTED');
});
test('non-BMP invalid surrogate is denied',()=>{
 const a=planC141Fragments('carattere '+String.fromCharCode(0xd800));assert.equal(a.code,'C141_FRAGMENT_CAPABILITY_INVALID');
});

test('indirect explicit software self-question never enters open route',()=>{
 for(const q of ['Tu come software descrivi la tua natura','Analizza la tua esistenza','Your consciousness: explain carefully']){
  const r=arbitrateC141({humanInput:q,openScope:true,c107Family:'SELF_ONTOLOGY',c132Route:'GENERAL_ONTOLOGY'});
  assert.equal(r.route,'C114_OWNER');
 }
});
test('adversarial indirect consciousness questions preserve identity owner',()=>{
 for(const q of ['Hai coscienza?','Sei cosciente?','Are you conscious?']){
  const r=arbitrateC141({humanInput:q,openScope:true,c107Family:'SELF_ONTOLOGY',c132Route:'GENERAL_ONTOLOGY'});
  assert.equal(r.route,'C114_OWNER',q);
 }
});
