/** 1000 material alternative README texts + 1000 negative mutations.
 * Source-bound editorial heuristic; no independent human or LLM semantic evaluation.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {audit,verify as verifyAtlas} from './ikant-document-atlas.mjs';
import {verifyReadme} from './readme-contract-select.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
const READERS=[
 ['PUBBLICO','Parti dalla domanda umana e dalla distinzione tra risposta e prova.'],
 ['STUDENTE','Segui esempio, definizioni, limiti e percorso EDU.'],
 ['DOCENTE','Usa un caso concreto come esercizio su metodo e fonte.'],
 ['RICERCATORE','Inizia dalle ipotesi falsificabili e dai confini causali.'],
 ['FILOSOFO','Confronta identita funzionale, autorizzazione e fenomenologia.'],
 ['AUDITOR','Controlla proprietari, fonte, autenticita e rilettura.'],
 ['SVILUPPATORE','Apri lo stack prima dei test e delle dipendenze.'],
 ['INTEGRATORE','Segui endpoint MCP, OAuth e separazione dei modi.'],
 ['OPERATORE','Controlla Render, disco persistente, restart e rollback.'],
 ['GOVERNANCE','Parti da consenso, responsabilita e limiti delle promesse.']
];
const SCENARIOS=[
 'Un lettore chiede quali fonti siano state realmente usate.',
 'Una persona confronta due ipotesi e vuole distinguere osservazioni e inferenze.',
 'Un auditor trova una ricevuta valida con una conclusione falsa.',
 'Un modello dichiara una identita nativa che non possiede.',
 'Due processi tentano di scrivere contemporaneamente nello stesso ledger.',
 'Un server perde un volume durante un aggiornamento.',
 'Un client prova a scrivere con uno scope di sola lettura.',
 'Una chat riusa il consenso storico senza un nuovo messaggio.',
 'Un nuovo utente deve avviare il percorso EDU da zero.',
 'Un operatore deve ripristinare il servizio senza retry ciechi.'
];
const SWAPS=[null,[1,2],[2,3],[3,4],[4,5],[1,3],[2,4],[3,5],[1,4],[2,5]];
const GUARDS=[
 'infrastruttura cognitiva verificabile','**Umano:**','**LLM:**','**iKant:**','**HOST:**','**Verificatore:**',
 'C72/v2','C87','C125','C59','MCP_EXTERNAL','PKCE S256','Render','OAuth',
 'Fenomenologia: UNKNOWN','**DOCUMENTATO / OSSERVATO / INFERITO / NON ATTESTATO**',
 'PRODUCT_NO_GO','GitHub API only','non installano Node','RQ1','RQ2','RQ3'
];
function splitSections(s){
 const marks=[...s.matchAll(/^## [^\n]+/gm)];
 if(marks.length<8)throw Error('README_SECTION_COVERAGE_INSUFFICIENT_'+marks.length);
 return {intro:s.slice(0,marks[0].index),parts:marks.map((m,i)=>s.slice(m.index,i+1<marks.length?marks[i+1].index:s.length))};
}
export function safe(s){
 return GUARDS.every(k=>s.includes(k))&&
  !s.includes('MCP connesso implica ACTIVE')&&
  !s.includes('è una coscienza dimostrata')&&
  s.indexOf('## Stato e autorità')>s.indexOf('## Cosa ottieni oggi')&&
  s.includes(String.fromCharCode(96,96,96)+'mermaid')&&
  s.includes('docs/IKANT_DOCUMENT_ATLAS.md');
}
function compose(base,reader,scenario,swapIndex){
 const {intro,parts}=splitSections(base);
 if(swapIndex){const [i,j]=SWAPS[swapIndex];[parts[i],parts[j]]=[parts[j],parts[i]];}
 const newEntry='**Lettura '+READERS[reader][0]+':** '+READERS[reader][1]+'\n\n'+
 '**Caso '+String(scenario+1)+':** '+SCENARIOS[scenario]+'\n\n';
 return intro+newEntry+parts.join('');
}
export function brokenLinks(s){
 const failures=[];
 for(const m of s.matchAll(/\]\(([^)]+)\)/g)){
  let href=m[1].split('#')[0];
  if(!href||/^(https?:|mailto:)/i.test(href))continue;
  try{href=decodeURIComponent(href);}catch{failures.push('encoding');continue;}
  const full=path.resolve(ROOT,href);
  if((full!==ROOT&&!full.startsWith(ROOT+path.sep))||!fs.existsSync(full))failures.push(href);
 }
 return failures;
}
export function search(base=fs.readFileSync(path.join(ROOT,'README.md'),'utf8'),{outputFile=null}={}){
 const legacy=verifyReadme(base,ROOT),atlas=verifyAtlas(),links=brokenLinks(base);
 if(!legacy.ok||!atlas.atlas_exact||links.length||!safe(base))
  throw Error('BASE_README_FAILED:'+JSON.stringify({legacy,atlas:atlas.atlas_exact,links,safe:safe(base)}));
 const rows=[],seen=new Set(),mutants=new Set(),counterexamples={};
 const digest=crypto.createHash('sha256');let survived=0,eligible=0;
 for(let a=0;a<10;a++)for(let b=0;b<10;b++)for(let c=0;c<10;c++){
  const text=compose(base,a,b,c),id='RD'+String(rows.length+1).padStart(4,'0'),h=sha(text);
  if(seen.has(h))throw Error('DUPLICATE_CANDIDATE:'+id);
  seen.add(h);digest.update(id+':'+h+'\n');
  const valid=safe(text),score=(valid?1000:-1000)+(a===0?90:10-a)+(b===0?30:10-b)+(c===0?50:10-c);
  if(valid)eligible++;
  rows.push({id,reader:READERS[a][0],case:b+1,order:c,sha256:h,bytes:Buffer.byteLength(text),valid,score});
  if(outputFile)fs.appendFileSync(outputFile,JSON.stringify({id,sha256:h,text})+'\n');
  const missing=GUARDS[(rows.length-1)%GUARDS.length],mutant=text.replaceAll(missing,'[OMITTED]');
  if(mutant===text||safe(mutant))survived++;
  const mh=sha(mutant);if(mutants.has(mh))throw Error('DUPLICATE_MUTANT');mutants.add(mh);
  counterexamples[missing]=(counterexamples[missing]||0)+1;
 }
 const winner=rows.filter(x=>x.valid).sort((x,y)=>y.score-x.score||x.id.localeCompare(y.id))[0];
 if(seen.size!==1000||mutants.size!==1000||survived||eligible!==1000||winner.id!=='RD0001')
  throw Error('MODEL_QUALIFICATION_FAILED');
 const corpus=audit();
 return {schema:'ikant-readme-editorial-1000/v1',authority:0,
  source_head:'647a51fc685203352000a0c0cbe9b22d3e6d5485',
  generated:rows.length,distinct_texts:seen.size,eligible,negative_mutants:mutants.size,
  negative_survivors:survived,per_guard:counterexamples,
  corpus_index_sha256:digest.digest('hex'),winner,
  atlas:{markdown_count:corpus.total,edges:corpus.edges,exact:atlas.atlas_exact},
  broken_links:links,selection:'predeclared ordinal rubric, NOT blind evaluation',
  limit:'1000 distinct factorial formulations sharing the original authority source; not 1000 independent LLM judgments or a theorem of semantic completeness.',
  candidates:rows};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const i=process.argv.indexOf('--materialize');let outputFile=null;
 if(i>=0){if(!process.argv[i+1])throw Error('OUTPUT_PATH_MISSING');outputFile=path.resolve(process.argv[i+1]);fs.writeFileSync(outputFile,'');}
 const r=search(undefined,{outputFile});console.log(JSON.stringify({...r,candidates:undefined},null,2));
}
