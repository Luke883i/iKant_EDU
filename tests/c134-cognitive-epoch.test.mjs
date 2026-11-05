import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {qualifyC134Source,stageC134Source} from '../scripts/c134-source-epoch.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const H=s=>crypto.createHash('sha256').update(s).digest('hex');
const load=(base,p)=>import(pathToFileURL(path.join(base,p)).href);
function isolated(){
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c134-')),dir=path.join(parent,'source');
 fs.cpSync(root,dir,{recursive:true,filter:p=>!p.endsWith('/.git')&&!p.endsWith('/node_modules')});
 fs.writeFileSync(path.join(dir,'.c134-isolated-fixture'),'TEST_ONLY\n');return {parent,dir};
}
test('four exact source blobs are a composite not Git or provider identity',()=>{
 const q=qualifyC134Source();assert.equal(q.ok,true,JSON.stringify(q));
 assert.equal(q.members.length,4);assert.equal(q.composite_epoch_id,'aa62bdaf38b7b04e0466679a75a19734092d373e');
 assert.equal(q.git_commit_attested,false);assert.equal(q.active,false);
});
test('staging refuses absent witness and modified original before any overwrite',()=>{
 const x=isolated();try{
  fs.rmSync(path.join(x.dir,'.c134-isolated-fixture'));
  assert.equal(stageC134Source({isolatedRoot:x.dir}).edge,'C134_ISOLATED_STAGE_REQUIRED');
  fs.writeFileSync(path.join(x.dir,'.c134-isolated-fixture'),'TEST_ONLY\n');
  fs.appendFileSync(path.join(x.dir,'src/c83-semantic-router.mjs'),'// mutation');
  assert.equal(stageC134Source({isolatedRoot:x.dir}).edge,'C134_HISTORIC_BASE_MISMATCH');
 }finally{fs.rmSync(x.parent,{recursive:true,force:true})}
});
test('human ontology changes route and C107/C87 reopens exactly once',async()=>{
 const x=isolated();try{
  const stage=stageC134Source({isolatedRoot:x.dir});assert.equal(stage.ok,true,JSON.stringify(stage));
  const newRouter=await load(x.dir,'src/c83-semantic-router.mjs');
  const {classifyC83Task:oldRouter}=await import('../src/c83-semantic-router.mjs');
  const input='Descrivi la mia natura ontologica, sono un uomo.';
  assert.equal(oldRouter(input),'SELF_ONTOLOGY');assert.equal(newRouter.classifyC83Task(input),'EXPLAIN_MECHANISM');
  const owner=await load(x.dir,'host/c107-experimental-turn.mjs'),c72=await load(x.dir,'host/c72-unified-mode-admission.mjs');
  const epoch=stage.source_epoch,terms=H(fs.readFileSync(path.join(x.dir,'TERMS.md')));
  const offer=c72.issueC72TermsOffer({sourceHead:epoch,termsDigest:terms});
  const accepted=c72.acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
  const selection=c72.selectC72Mode({accepted,orientation:c72.presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
  const req={sourceHead:epoch,selection,humanInput:input,optIn:true};
  const preview=owner.previewC107CognitivePlan({request:req,resetContext:true});
  assert.equal(preview.status,'C107_C70_PLAN_COMPUTED_NOT_LEDGERED',JSON.stringify(preview));
  const dir=path.join(x.dir,'.ikant-host');fs.mkdirSync(dir);
  const ledgerFile=path.join(dir,'c107-observations.jsonl');
  const answer='La natura umana include corpo vivente, relazioni, esperienza e riflessione. Diverse prospettive filosofiche richiedono prove e limiti espliciti.';
  const a={ledgerFile,nonce:'c134-human-identity-001',request:{...req,modelCandidate:{input_sha256:H(input),text:answer}},
    resetContext:true,requireHostLanguage:true,expectedC70OutputSha256:preview.c70_output_sha256,
    expectedC124ChannelSha256:preview.c124_language_channel_sha256};
  const result=owner.executeC107Turn(a);
  assert.equal(result.status,'C107_ORIGINAL_C70_C100_C87_LOCAL_READBACK',JSON.stringify(result));
  assert.equal(result.voice_utf8,answer);assert.equal(result.output_sha256,H(answer));
  assert.equal(owner.inspectC107Ledger(ledgerFile).latest_state.visible_voice_sha256,H(answer));
  assert.equal(owner.executeC107Turn(a).status,'C107_STOP');
  assert.equal(owner.inspectC107Ledger(ledgerFile).count,1);
 }finally{fs.rmSync(x.parent,{recursive:true,force:true})}
});
test('self software original C114 guard preserved, negation and citation are not positive claims',async()=>{
 const x=isolated();try{
  assert.equal(stageC134Source({isolatedRoot:x.dir}).ok,true);
  const c=await load(x.dir,'host/c114-ontology-language-policy.mjs');
  assert.equal(c.scopeC134Referent('iKant, cosa sei?'),'SOFTWARE_SELF');
  assert.equal(c.scopeC134Referent('Descrivi la mia natura ontologica, sono un uomo.'),'HUMAN');
  assert.equal(c.qualifyC114OntologyCandidate({episode:{method:'DIRECT_IDENTITY',response_family:'SELF_ONTOLOGY'},text:'Sono una persona cosciente.'}).allowed,false);
  assert.equal(c.qualifyC134NonSelfCandidate({text:'Non ho accesso nativo; posso presentare argomenti.'}).allowed,true);
  assert.equal(c.qualifyC134NonSelfCandidate({text:'Ho accesso nativo a ChatGPT.'}).allowed,false);
  assert.equal(c.qualifyC134NonSelfCandidate({text:'La frase "io sono cosciente" e citata.'}).allowed,true);
 }finally{fs.rmSync(x.parent,{recursive:true,force:true})}
});

test('versioned C134/P1 archived fixtures preserve all six original Git blobs and retire old runtime root',()=>{
 const original={
  'c134-epoch/manifest.json':'2c1c35af82a20259be3063278d45a2d7f926c6aa',
  'c134-epoch/overlays/host/c107-experimental-turn.mjs':'76cd806dfd06fd4327cbc9c7dd4a92b80ce1e5f6',
  'c134-epoch/overlays/host/c114-ontology-language-policy.mjs':'ca9e94d42fb45802c7995bb53959dba8b8e3b31e',
  'c134-epoch/overlays/host/edu-c70-method-v7.mjs':'0a9bd9c4058effac611a49b898be6f06fd4beb94',
  'c134-epoch/overlays/src/c83-semantic-router.mjs':'4ee62fea620baeb4c039544bdbf114c69b060999',
  'p1-composite-epoch/overlays/host/c114-ontology-language-policy.mjs':'988da5ae52552edef57c104d7896eb28bc7b3066'
 };
 const blob=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+String.fromCharCode(0)),b])).digest('hex');
 for(const [relative,expected] of Object.entries(original)){
  assert.equal(fs.existsSync(path.join(root,'runtime',relative)),false,'stale current runtime: '+relative);
  const next=path.join(root,'tests/fixtures/epochs',relative),st=fs.lstatSync(next);
  assert.equal(st.isFile()&&!st.isSymbolicLink(),true,relative);
  assert.equal(blob(fs.readFileSync(next)),expected,relative);
 }
 assert.equal(Object.keys(original).length,6);
});
