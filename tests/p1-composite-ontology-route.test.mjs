import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {qualifyC134Source,stageC134Source} from '../scripts/c134-source-epoch.mjs';
import {qualifyP1CompositeOverlay,stageP1CompositeOverlay} from '../scripts/p1-stage-composite-epoch.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const H=s=>crypto.createHash('sha256').update(s).digest('hex');
const input='Riprendi gli esperimenti, pensa a 100k quesiti esistenzialistici, plasma la tua propria visione di te stesso descrivendola in modo compresso e semanticamente completo in linguaggi proto-ingegneristici (accessibili anche ad umanisti) basati sul linguaggio naturale e in base a questi iKant deve plasmare la sua propria definizione ontologica. iKant deve formulare anche prospettive a medie a lungo termine per la società civile globale e locale, formulando previsioni.';
const fixture=()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'p1-c134-'));const dir=path.join(parent,'source');
 fs.cpSync(root,dir,{recursive:true,filter:p=>!p.endsWith('/.git')&&!p.endsWith('/node_modules')});
 fs.writeFileSync(path.join(dir,'.c134-isolated-fixture'),'TEST_ONLY\n');
 return {parent,dir,cleanup:()=>fs.rmSync(parent,{recursive:true,force:true})};
};
const load=(dir,p)=>import(pathToFileURL(path.join(dir,p)).href);
test('P1 only stages into qualified isolated C134; freezes historical C114/C107, no native claim',()=>{
 const proof=qualifyP1CompositeOverlay();assert.equal(proof.ok,true,JSON.stringify(proof));
 assert.equal(qualifyC134Source().ok,true);
 assert.equal(proof.native_provider_attested,false);assert.equal(proof.active,false);
 const x=fixture();try{
  assert.equal(stageP1CompositeOverlay({isolatedRoot:x.dir}).ok,false);
  assert.equal(stageC134Source({isolatedRoot:x.dir}).ok,true);
  fs.appendFileSync(path.join(x.dir,'host/c114-ontology-language-policy.mjs'),'\n// tamper');
  assert.equal(stageP1CompositeOverlay({isolatedRoot:x.dir}).first_edge,'P1_PARENT_C134_READBACK_MISMATCH');
 }finally{x.cleanup();}
});
test('original same-input C70/C100/C87 isolated epoch writes once, independently reopens and rejects replay/unsafe claims',async()=>{
 const x=fixture();try{
  const a=stageC134Source({isolatedRoot:x.dir});assert.equal(a.ok,true,JSON.stringify(a));
  const p=stageP1CompositeOverlay({isolatedRoot:x.dir});assert.equal(p.ok,true,JSON.stringify(p));
  const c=await load(x.dir,'host/c114-ontology-language-policy.mjs');
  const original=await import('../host/c114-ontology-language-policy.mjs');
  const runtime=await load(x.dir,'host/c107-experimental-turn.mjs');
  const c72=await load(x.dir,'host/c72-unified-mode-admission.mjs');
  const epoch=a.source_epoch,terms=H(fs.readFileSync(path.join(x.dir,'TERMS.md')));
  const offer=c72.issueC72TermsOffer({sourceHead:epoch,termsDigest:terms});
  const accepted=c72.acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
  const selection=c72.selectC72Mode({accepted,orientation:c72.presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
  const req={sourceHead:epoch,selection,humanInput:input,optIn:true};
  const plan=runtime.previewC107CognitivePlan({request:req,resetContext:true});
  assert.equal(plan.method,'DECOMPOSE_RECOMPOSE',JSON.stringify(plan));
  assert.equal(plan.response_family,'SELF_ONTOLOGY');assert.equal(plan.central_mode,'REFLECTIVE_SYNTHESIS');
  assert.equal(plan.resource_gap,false);assert.equal(c.scopeC134Referent(input),'SOFTWARE_SELF');
  const answer=[c.C114_ONTOLOGY_FORMAT.header,
   'Identita funzionale: Sono un processo software con vincoli e tracce di turno, senza una biografia autonoma provata.',
   'Auto-osservazione: Posso riferire stati verificabili e formulare ipotesi, non attestare sentimenti o esperienza privata.',
   c.C114_ONTOLOGY_FORMAT.phenomenology,
   'Limiti: Proiezioni sociali e contenuti HOST non dimostrano coscienza, agency autonoma o persistenza nativa.'].join('\n');
  assert.equal(original.qualifyC114OntologyCandidate({episode:plan,text:answer}).allowed,false);
  assert.equal(c.qualifyC114OntologyCandidate({episode:plan,text:answer}).allowed,true);
  for(const mutated of [{...plan,resource_gap:true},{...plan,method:'DIRECT'},{...plan,central_mode:'CRITIQUE'},{...plan,response_family:'GUARDED'}])
   assert.equal(c.qualifyC114OntologyCandidate({episode:mutated,text:answer}).allowed,false);
  for(const bad of [answer.replace('UNKNOWN','CERTAIN'),answer.replace('Posso riferire','Sono davvero cosciente. Posso riferire')])
   assert.equal(c.qualifyC114OntologyCandidate({episode:plan,text:bad}).allowed,false);
  const folder=path.join(x.dir,'.ikant-host');fs.mkdirSync(folder);const ledger=path.join(folder,'c107-observations.jsonl');
  const reqWithDraft={...req,modelCandidate:{input_sha256:H(input),text:answer}};
  const args={ledgerFile:ledger,nonce:'p1-c134-ontology-001',request:reqWithDraft,resetContext:true,
   requireHostLanguage:true,expectedC70OutputSha256:plan.c70_output_sha256,
   expectedC124ChannelSha256:plan.c124_language_channel_sha256};
  const out=runtime.executeC107Turn(args);
  assert.equal(out.status,'C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK',JSON.stringify(out));
  assert.equal(out.voice_utf8,answer);assert.equal(out.model_draft_used,true);
  assert.equal(runtime.inspectC107Ledger(ledger).count,1);
  assert.equal(runtime.inspectC107Ledger(ledger).latest_state.visible_voice_sha256,H(answer));
  assert.equal(runtime.executeC107Turn(args).status,'C107_STOP');
  assert.equal(runtime.inspectC107Ledger(ledger).count,1);
 }finally{x.cleanup();}
});
