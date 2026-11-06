import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const docs=['README.md','docs/START_HERE.md','docs/IKANT_RUNTIME_AND_EVIDENCE.md',
  'docs/IKANT_RESEARCH_QUESTIONS.md','docs/IKANT_LOCAL_SETUP.md','docs/ARCHITECTURE.md'];
const lexicon='docs/IKANT_CX_LEXICON.md';
const review='docs/IKANT_CX_POST_EDIT_REVIEW.md';
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const codeIds=s=>[...new Set((s.match(/\bC\d+(?:\/v\d+)?\b|\bS\d{2}\b/g)||[])
  .map(id=>id.split('/')[0]))].sort();
const mdLinks=s=>[...s.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)].map(m=>m[1]);

function inspect(files=docs,lex=read(lexicon)){
 const errors=[],seen=new Set();
 for(const file of files){
  const text=read(file);
  for(const id of codeIds(text)){
   seen.add(id);
   if(!new RegExp(`\\*\\*${id}(?:\\/v[12])?\\*\\*`).test(lex)) errors.push(`${file}:unexplained:${id}`);
  }
  if(!text.includes('IKANT_CX_LEXICON.md'))errors.push(`${file}:missing-onboarding-link`);
  for(const link of mdLinks(text)){
   if(/^https?:|^mailto:/i.test(link))continue;
   if(!fs.existsSync(path.resolve(root,path.dirname(file),link)))errors.push(`${file}:broken:${link}`);
  }
 }
 for(const link of mdLinks(lex)){
  if(/^https?:|^mailto:/i.test(link))continue;
  if(!fs.existsSync(path.resolve(root,path.dirname(lexicon),link)))errors.push(`lexicon:broken:${link}`);
 }
 for(const phrase of ['non indica una versione del modello','C72/v2','C72/v1','non sono già consegna',
   'Readback','Fail closed','non prova','non autentica','che cosa *realmente* accade',
   'A partire da una domanda concreta','Come verificare senza dare nulla per scontato']){
  if(!lex.includes(phrase))errors.push(`lexicon:missing-human-meaning:${phrase}`);
 }
 return {ok:errors.length===0,docs:files.length,ids:[...seen].sort(),errors};
}

test('post-edit: all Cx/S02 abbreviations have explicit linked meanings',()=>{
 const r=inspect();assert.deepEqual(r.errors,[]);
 assert.ok(r.ids.length>=17,'must cover technical as well as onboarding codes');
});
test('post-edit: actual first encounters explain scope and route users to lexicon',()=>{
 const r=read('README.md'),a=read('docs/ARCHITECTURE.md'),n=read('docs/START_HERE.md');
 assert.match(r,/Archeologia separata:[^\n]*one canonical `SESSION_CHAT_LOCAL` composition, C59/);
 assert.match(r,/Il percorso Project C72\/v2 offre \*\*esattamente una selezione successiva al consenso: EDU\*\*/);
 assert.match(r,/\*\*MCP_EXTERNAL\*\* è una superficie di distribuzione indipendente/);
 assert.match(r,/C72\/v2/);assert.match(r,/MCP_EXTERNAL/);assert.doesNotMatch(r,/CANONICAL \(via MCP\)/);
 assert.match(a,/S02 \(ponte di versione\)\/C135 \(coordinatore\)/);
 assert.match(n,/non sono nomi di un modello né livelli di intelligenza/);
});
test('post-edit falsification: missing Cx meaning is detected',()=>{
 assert.ok(inspect(docs,read(lexicon).replace('**C114**','**CXXX**')).errors.some(x=>x.includes('C114')));
});
test('post-edit falsification: wrong source link fails',()=>{
 const modified=read(lexicon).replace('../host/c87-durable-ledger.mjs','../host/no-such-ledger.mjs');
 assert.ok(inspect(docs,modified).errors.some(x=>x.includes('no-such-ledger.mjs')));
});
test('research/people/engineering pathways remain distinct, falsifiable, non-ACTIVE',()=>{
 assert.match(read('docs/START_HERE.md'),/persona|chiunque/u);
 assert.match(read('docs/IKANT_RESEARCH_QUESTIONS.md'),/Confutazione/u);
 assert.match(read('docs/IKANT_RUNTIME_AND_EVIDENCE.md'),/OSSERVATO/u);
 assert.match(read('docs/IKANT_LOCAL_SETUP.md'),/non.*install/u);
 assert.match(read(lexicon),/non.*garanti/iu);
 assert.match(read(review),/Gate aperto/u);
 assert.match(read(review),/persone|ingegnere/u);
});
