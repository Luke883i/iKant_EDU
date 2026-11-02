/** HOST documentation indexer; authority zero. Does not mutate runtime. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const IGNORE=new Set(['.git','node_modules','.ikant','dist','artifacts','coverage']);
export const ATLAS='docs/IKANT_DOCUMENT_ATLAS.md';
function files(dir=''){
 const full=path.join(ROOT,dir);
 return fs.readdirSync(full,{withFileTypes:true}).flatMap(e=>{
  if(e.isSymbolicLink()||IGNORE.has(e.name))return [];
  const p=path.posix.join(dir,e.name);
  if(e.isDirectory())return files(p);
  return e.isFile()&&e.name.endsWith('.md')?[p]:[];
 });
}
export function family(p){
 if(p==='README.md')return ['L0','Orientamento'];
 if(p==='docs/START_HERE.md'||p==='docs/IKANT_DOCUMENT_ATLAS.md'||p==='docs/PRODUCT_POSITIONING.md'||p==='docs/IKANT_LOCAL_SETUP.md')return ['L1','Lettura guidata'];
 if(/^docs\/(?:ARCHITECTURE|GOVERNANCE|IKANT_(?:RUNTIME|RESEARCH|DOCUMENT_ONTOLOGY|DOCUMENT_ATLAS|CX|EDITORIAL|COGNITIVE|DEVELOPMENT|SEMANTIC|NEUROCOGNITIVE))/.test(p))return ['L2','Modelli e prove'];
 if(p.startsWith('docs/archive/prepr/'))return ['L4','Storico'];
 if(/^docs\/C\d+/.test(p))return ['L3','Contratti Cx e ricerca tecnica'];
 if(p.startsWith('docs/'))return ['L3','Documentazione specialistica'];
 if(p.startsWith('project/')||p.startsWith('project-baseline/'))return ['L4','Materiale Project e compatibilità'];
 if(/PREPR|BOOTSTRAP\.md/.test(p))return ['L4','Storico'];
 if(p.startsWith('plugins/'))return ['L4','Integrazione e plugin'];
 return ['L2','Regole e descrizioni di radice'];
}
function links(text){return [...text.matchAll(/(?<!!)\[[^\]]+\]\(([^)#]+)(?:#[^)]*)?\)/g)].map(m=>m[1]);}
export function audit(){
 const ps=files().sort(),set=new Set(ps),edges=[];
 const rows=ps.map(p=>{
  const s=fs.readFileSync(path.join(ROOT,p),'utf8'),[level,role]=family(p);
  const relative=links(s).filter(l=>!/^https?:|^mailto:|^#/i.test(l));
  const next=[],broken=[];
  for(const l of relative){const q=path.posix.normalize(path.posix.join(path.posix.dirname(p),decodeURIComponent(l)));
   if(!fs.existsSync(path.join(ROOT,q)))broken.push(l);
   else if(set.has(q)){edges.push([p,q]);next.push(q);}
  }
  const heading=/^#{1,2} +\S/m.test(s),hasLimits=/non (?:e|è|prova|dimostra)|limiti|unknown|not attest|evidence|confut|falsif/i.test(s);
  const ontology=/coscien|conscious|fenomenolog|ontolog|neur|simil|LLM|subjectiv|cogniti|umano|human|self-world|psych/i.test(s);
  return {path:p,level,role,heading,hasLimits,ontology,links:next,broken,bytes:Buffer.byteLength(s),review:'REVIEW_REQUIRED'};
 });
 const seen=new Set(['README.md']);let change=true;
 while(change){change=false;for(const [a,b] of edges)if(seen.has(a)&&!seen.has(b)){seen.add(b);change=true;}}
 const debt={no_heading:rows.filter(x=>!x.heading).map(x=>x.path),missing_limitation_hint:rows.filter(x=>!x.hasLimits).map(x=>x.path),ontology_signalled:rows.filter(x=>x.ontology).length,broken_links:rows.flatMap(x=>x.broken.map(l=>x.path+':'+l)),unreachable_before_atlas:rows.filter(x=>!seen.has(x.path)).map(x=>x.path)};
 return {schema:'ikant-host-document-ontology-audit/v1',authority:0,unit:'repo Markdown files',total:rows.length,levels:Object.fromEntries(['L0','L1','L2','L3','L4'].map(k=>[k,rows.filter(r=>r.level===k).length])),edges:edges.length,debt,rows};
}
export function renderAtlas(a){
 const head=`# Atlante completo dei documenti iKant\n\n> Indice generato dal checkout corrente, non contratto runtime. Ogni voce copre un Markdown, anche storico. [Spiegazione dei livelli e DoD](IKANT_DOCUMENT_ONTOLOGY_DOD.md). Nessun link implica che il documento sia stato validato semanticamente.\n\n**Per il pubblico:** [parti da qui](START_HERE.md). **Per gli ingegneri:** [sigle Cx](IKANT_CX_LEXICON.md), [architettura](ARCHITECTURE.md). **Per i ricercatori:** [RQ falsificabili](IKANT_RESEARCH_QUESTIONS.md).\n\n`;
 let out=head;
 for(const [level,label] of [['L0','Ingresso'],['L1','Guide'],['L2','Modelli e regole'],['L3','Approfondimenti e prove'],['L4','Storico e integrazioni']]){
  out+=`## ${level} — ${label}\n\n`;
  for(const r of a.rows.filter(r=>r.level===level)){
    const target=path.posix.relative('docs',r.path)||path.posix.basename(r.path);
    out+=`- [${r.path}](${target}): ${r.role}. Stato di review: **da verificare**.\n`;
  }
  out+='\n';
 }
 return out;
}
export function verify(){
 const a=audit(),want=renderAtlas(a),actual=fs.readFileSync(path.join(ROOT,ATLAS),'utf8');
 return {ok:want===actual&&a.rows.some(x=>x.path==='README.md')&&a.rows.every(x=>x.level&&x.role),atlas_exact:want===actual,total:a.total,levels:a.levels,edges:a.edges,debt_counts:Object.fromEntries(Object.entries(a.debt).map(([k,v])=>[k,typeof v==='number'?v:v.length]))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const a=audit();
 if(process.argv.includes('--write'))fs.writeFileSync(path.join(ROOT,ATLAS),renderAtlas(a));
 const v=verify();process.stdout.write(JSON.stringify(v,null,2)+'\n');if(!v.ok)process.exitCode=1;
}
