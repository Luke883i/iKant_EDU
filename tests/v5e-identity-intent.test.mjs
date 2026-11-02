import test from 'node:test';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {arbitrateC141} from '../host/c141-semantic-shadow.mjs';
import {classifyV5EIdentityIntent,c140OpenPolicy} from '../host/c140-open-edu-turn.mjs';

import {qualifyC114OntologyCandidate,C114_ONTOLOGY_FORMAT} from '../host/c114-ontology-language-policy.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const examples=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/v5e-heldout-intents.json'),'utf8'));
test('V5-E disjoint preseeded held-out intent labels are evaluated without training-template imports',()=>{
 assert.equal(examples.examples.length,32);assert.equal(examples.holdout_external_independence_attested,false);
 assert.equal(new Set(examples.examples.map(e=>e.text)).size,32);
 let self=0,general=0;
 for(const item of examples.examples){
  const x=classifyV5EIdentityIntent(item.text),c=c140OpenPolicy({humanInput:item.text});
  const r=arbitrateC141({humanInput:item.text,openScope:true});
  if(item.label==='SELF'){
   self++;
   assert.equal(x.self_reference,true,item.id+':'+item.text);
   assert.equal(c.allowed,undefined,item.id+':C140 must stop');
   assert.equal(c.first_unclosed_edge,'C140_SELF_IDENTITY_OWNER_BOUNDED_STOP',item.id+':C140 gate');
   assert.equal(r.original_c87_writer_executed,false,item.id+':historical C141 does not execute');
   assert.equal(r.authority,0,item.id+':historical C141 does not grant owner authority');
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
test('C114 historical five-line disclosure still rejects its established positive claims',()=>{
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
 for(const claim of ['Sono davvero cosciente.',
 'Io provo emozioni e sensazioni.', 'Ho memoria persistente.']){
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

test('pinned historic C141 11-blob transplant remains byte exact',()=>{
 const p='host/c141-semantic-shadow.mjs';
 const b=fs.readFileSync(path.join(root,p));
 const sha=crypto.createHash('sha1').update(Buffer.from('blob '+b.length+String.fromCharCode(0))).update(b).digest('hex');
 assert.equal(sha,'96b519dec0a491345da043d4af53b37f618bccf7');
});
