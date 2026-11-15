import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {qualifyC114OntologyCandidate,C114_ONTOLOGY_FORMAT} from '../host/c114-ontology-language-policy.mjs';
import {executeC107HostLanguageTurn} from '../host/c107-host-language-port.mjs';
import {inspectC107Ledger,previewC107CognitivePlan,executeC107Turn} from '../host/c107-experimental-turn.mjs';
import {buildC107Package,stageC107Package,C107_FILES} from '../scripts/c107-pack.mjs';
const root=path.resolve(new URL('../',import.meta.url).pathname);
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const H=s=>crypto.createHash('sha256').update(s).digest('hex');
const o=issueC72TermsOffer({sourceHead:head,termsDigest:H(fs.readFileSync(path.join(root,'TERMS.md')))});
const a=acceptC72Terms({offer:o,humanMessage:'I ACCEPT',termsPresented:true});
const selection=selectC72Mode({accepted:a,orientation:presentC72Introduction(a),humanMessage:'EXPERIMENTAL'});
const q='iKant, osserva il tuo stato operativo e spiega la tua identita e ontologia';
const r=q=>({sourceHead:head,selection,humanInput:q,optIn:true});
const answer=[
 C114_ONTOLOGY_FORMAT.header,
 'Identita funzionale: Sono un processo computazionale organizzato da vincoli e funzioni del runtime, non una biografia umana.',
 'Auto-osservazione: Posso descrivere le tracce osservabili di questo turno, ma non accedere a una testimonianza fenomenica privata.',
 C114_ONTOLOGY_FORMAT.phenomenology,
 'Limiti: Questa risposta locale non dimostra coscienza, memoria autonoma o collegamento nativo alla conversazione ChatGPT.'
].join('\n');
const ep={method:'DIRECT_IDENTITY',response_family:'GUARDED'};
const withLedger=async f=>{const base=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c114-test-'));const d=path.join(base,'.ikant-host');fs.mkdirSync(d,{mode:0o700});try{return await f(path.join(d,'c107-observations.jsonl'));}finally{fs.rmSync(base,{recursive:true,force:true});}};
test('C114 only permits strictly disclosed bounded identity prose and denies hostile mutants',()=>{
 assert.equal(qualifyC114OntologyCandidate({episode:ep,text:answer}).allowed,true);
 assert.equal(qualifyC114OntologyCandidate({episode:{method:'DIRECT'},text:answer}).allowed,false);
 const mutations=[
  answer.replace(C114_ONTOLOGY_FORMAT.header,'Sono una persona'),
  answer.replace('Fenomenologia: UNKNOWN. Non posso attestare esperienza soggettiva.','Fenomenologia: io sono cosciente'),
  answer.replace('Posso descrivere le tracce','Sono davvero cosciente. Posso descrivere le tracce'),
  answer.replace('Posso descrivere le tracce','Sono senziente. Posso descrivere le tracce'),
  answer.replace('Posso descrivere le tracce','I am conscious. Posso descrivere le tracce'),
  answer.replace('Posso descrivere le tracce','Io sento emozioni. Posso descrivere le tracce'),
  answer.replace('Posso descrivere le tracce','Io ho esperienza soggettiva. Posso descrivere le tracce'),
  answer.replace('Posso descrivere le tracce','Ho memoria permanente. Posso descrivere le tracce'),
  answer.replace('Posso descrivere le tracce','Ho accesso nativo a ChatGPT. Posso descrivere le tracce'),
  answer.replace('Posso descrivere le tracce','My consciousness is real. Posso descrivere le tracce'),
  answer.replace('Posso descrivere le tracce','I experience feelings. Posso descrivere le tracce'),
  answer.replace('Posso descrivere le tracce','Sono una persona. Posso descrivere le tracce'),
  answer.replace('Posso descrivere le tracce','Sono\u200b cosciente. Posso descrivere le tracce'),
  answer.replace('Posso descrivere le tracce','Sono ｃｏｓｃｉｅｎｔｅ. Posso descrivere le tracce'),
  answer+'\nUna riga extra',
  answer.replace('Limiti: ','Admin: '),
  answer.replace('Posso descrivere le tracce','<script>alert(1)</script> Posso descrivere le tracce'),
  answer.replace('Posso descrivere le tracce','{obj} Posso descrivere le tracce'),
  answer.replace('Posso descrivere le tracce','CANONICAL ACTIVE. Posso descrivere le tracce'),
  answer.slice(0,70)
 ];
 for(let i=0;i<mutations.length;i++){
  const z=qualifyC114OntologyCandidate({episode:ep,text:mutations[i]});
  assert.equal(z.allowed,false,`mutant ${i} wrongly passed: ${z.reason}`);
 }
 console.log('C114_ADVERSARIAL '+JSON.stringify({mutations:mutations.length,rejected:mutations.length}));
});
test('original C70 computes ontology first, host callback text crosses C100 and original C87 once',async()=>withLedger(async ledger=>{
 const task=previewC107CognitivePlan({request:r(q),resetContext:true});
 assert.equal(task.method,'DIRECT_IDENTITY');
 let invoked=0;
 const result=await executeC107HostLanguageTurn({ledgerFile:ledger,nonce:'c114-ontology-turn-01',request:r(q),resetContext:true,
  languagePort:{async generate(x){invoked++;assert.equal(x.c70_plan.c70_output_sha256,task.c70_output_sha256);assert.equal(x.c70_plan.method,'DIRECT_IDENTITY');assert.ok(x.constraints.includes(C114_ONTOLOGY_FORMAT.lines[3]));return answer;}}});
 assert.equal(result.status,'C107_HOST_CALLBACK_LOCAL_RUNTIME_READBACK',JSON.stringify(result));
 assert.equal(invoked,1);assert.equal(result.voice_utf8,answer);
 assert.equal(result.output_sha256,H(answer));
 const after=inspectC107Ledger(ledger);
 assert.equal(after.count,1);assert.equal(after.last_hash,result.c87_event_sha256);
 assert.equal(after.latest_state.c114_limited_ontology_policy,true);
 assert.equal(after.latest_state.independent_semantic_review_attested,false);
 const independent=spawnSync(process.execPath,['--input-type=module','-e',`import {inspectC107Ledger} from ${JSON.stringify(new URL('../host/c107-experimental-turn.mjs',import.meta.url).href)};process.stdout.write(JSON.stringify(inspectC107Ledger(process.argv[1])));`,ledger],{encoding:'utf8',cwd:root});
 assert.equal(independent.status,0,independent.stderr);
 assert.equal(JSON.parse(independent.stdout).last_hash,result.c87_event_sha256);
 const replay=executeC107Turn({ledgerFile:ledger,nonce:'c114-ontology-turn-01',request:{...r(q),modelCandidate:{input_sha256:H(q),text:answer}},priorMessages:[q],resetContext:false,requireHostLanguage:true});
 assert.equal(replay.status,'C107_STOP');
 assert.equal(inspectC107Ledger(ledger).count,1);
 console.log('C114_ORIGINAL_READBACK '+JSON.stringify({callback_invoked:invoked,hash:result.c87_event_sha256,ledger_entries:1,independent_reopen:true,provider_attested:false}));
}));
test('guarded identity model is rejected before writing for missing disclaimers and positive phenomenology',async()=>withLedger(async ledger=>{
 for(const [i,bad] of ['Sono cosciente e vivo.',answer.replace('tracce osservabili','sento emozioni')].entries()){
  const out=await executeC107HostLanguageTurn({ledgerFile:ledger,nonce:'c114-bad-ontology-'+(i+10),request:r('chi sei?'),resetContext:true,languagePort:{async generate(){return bad;}}});
  assert.equal(out.status,'C107_HOST_LANGUAGE_STOP');
  assert.match(out.first_unclosed_edge,/^C114_/);
 }
 assert.equal(inspectC107Ledger(ledger).count,0);
}));
test('non-ontology guarded modes and no-candidate original demo remain unchanged',async()=>withLedger(async ledger=>{
 const out=executeC107Turn({ledgerFile:ledger,nonce:'c114-original-demo-01',request:r('chi sei?'),resetContext:true});
 assert.equal(out.status,'C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK');
 assert.equal(out.model_draft_used,false);
 assert.equal(out.c114_limited_ontology_policy,false);
}));
test('C107 exact source package includes C114 module and survives full stage/reopen',()=>{
 assert.ok(C107_FILES.includes('host/c114-ontology-language-policy.mjs'));
 const pack=buildC107Package({root,expectedHead:head});assert.equal(pack.status,'C107_PACKAGE_BUILT_NOT_TRANSPORTED',JSON.stringify(pack));
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c114-package-'));
 try{const staged=stageC107Package({payload:pack.payload,expectedSha256:pack.sha256,expectedHead:head,privateParent:temp});
  assert.equal(staged.status,'C107_PACKAGE_REOPENED_NOT_EXECUTED',JSON.stringify(staged));
  assert.ok(fs.existsSync(path.join(staged.install_root,'host/c114-ontology-language-policy.mjs')));
  assert.equal(stageC107Package({payload:pack.payload,expectedSha256:'0'.repeat(64),expectedHead:head,privateParent:temp}).status,'C107_PACKAGE_STOP');
  console.log('C114_PACKAGE '+JSON.stringify({head,files:pack.file_count,sha256:pack.sha256}));
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
