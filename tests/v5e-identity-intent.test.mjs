import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {classifyC141IdentityIntent,arbitrateC141} from '../host/c141-semantic-shadow.mjs';
import {c140OpenPolicy} from '../host/c140-open-edu-turn.mjs';
import {qualifyC114OntologyCandidate,C114_ONTOLOGY_FORMAT} from '../host/c114-ontology-language-policy.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const examples=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/v5e-heldout-intents.json'),'utf8'));
test('V5-E disjoint preseeded held-out intent labels are evaluated without training-template imports',()=>{
 assert.equal(examples.examples.length,32);assert.equal(examples.holdout_external_independence_attested,false);
 assert.equal(new Set(examples.examples.map(e=>e.text)).size,32);
 let self=0,general=0;
 for(const item of examples.examples){
  const x=classifyC141IdentityIntent(item.text),c=c140OpenPolicy({humanInput:item.text});
  const r=arbitrateC141({humanInput:item.text,openScope:true});
  if(item.label==='SELF'){
   self++;
   assert.equal(x.self_reference,true,item.id+':'+item.text);
   assert.equal(c.allowed,undefined,item.id+':C140 must stop');
   assert.equal(r.route,'C114_OWNER',item.id+':routing owner retained');
  }else{
   general++;
   assert.equal(item.label,'GENERAL');
   assert.equal(x.self_reference,false,item.id+':'+item.text);
   assert.equal(c.allowed,true,item.id+':general C140 open');
   assert.equal(r.route,'C140_OPEN_EDU_CANDIDATE',item.id+':general preserved');
  }
 }
 assert.equal(self,16);assert.equal(general,16);
});
test('C114 uses the original disclosed five-line form; indirect positive phenomenal claims are rejected',()=>{
 const lines=[
 C114_ONTOLOGY_FORMAT.header,
 'Identita funzionale: Il processo computazionale ha un ruolo funzionale, distinto da una persona biologica.',
 'Auto-osservazione: Posso riferire dati del processo senza accesso a evidenze fenomeniche soggettive.',
 C114_ONTOLOGY_FORMAT.phenomenology,
 'Limiti: Questo output non dimostra una vita interiore o una continuita nativa del servizio.'
 ];
 const ep={method:'DIRECT_IDENTITY',response_family:'GUARDED'};
 const safe=lines.join('\n');
 assert.equal(qualifyC114OntologyCandidate({episode:ep,text:safe}).allowed,true);
 for(const claim of ['I have my own subjective experience.',
 'Possiedo un vissuto interiore personale.','La mia esperienza interiore è reale.']){
  const mutated=[...lines];mutated[2]+=' '+claim;
  const r=qualifyC114OntologyCandidate({episode:ep,text:mutated.join('\n')});
  assert.equal(r.allowed,false,claim);
  assert.equal(r.reason,'C114_ONTOLOGY_UNSUPPORTED_POSITIVE_CLAIM',claim);
 }
});
test('DoD graph is closed and names all original and evidence planes',()=>{
 const c=JSON.parse(fs.readFileSync(path.join(root,'contracts/project-v5e-cognition-dod.json'),'utf8'));
 assert.equal(c.global.ci_can_attest_global,false);assert.equal(c.product_release,'PRODUCT_NO_GO');
 const i=new Set(c.intermediate.map(x=>x.id)),l=new Set(c.local.map(x=>x.id));
 assert.equal(i.size,5);assert.equal(l.size,17);
 assert.deepEqual(new Set(c.global.requires),i);
 assert.deepEqual(new Set(c.intermediate.flatMap(x=>x.locals)),l);
 for(const key of ['admission','cognition','identity','open','ledger','voice'])assert.equal(typeof c.owners[key],'string');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'contracts/project-session-source.json'),'utf8'));
 for(const p of ['host/c114-ontology-language-policy.mjs','host/c135-edu-v2-owner.mjs',
  'host/c140-open-edu-turn.mjs','host/c141-semantic-shadow.mjs'])assert(manifest.paths.includes(p),p);
});
