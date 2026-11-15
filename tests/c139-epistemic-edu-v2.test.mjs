import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {previewC107CognitivePlan,executeC107Turn,inspectC107Ledger} from '../host/c107-edu-v2-turn.mjs';
import {executeC139EpistemicTurn} from '../host/c139-edu-v2-turn.mjs';
import {qualifyC139EpistemicCandidate,qualifyC139EpistemicRoute} from '../host/c139-epistemic-policy.mjs';
import {createC129PublicEduV2Session} from '../host/edu-c129-manual-entry.mjs';
import {C107_FILES} from '../scripts/c107-pack.mjs';
const root=path.resolve(new URL('../',import.meta.url).pathname);
const H=s=>crypto.createHash('sha256').update(s).digest('hex');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const input="Quali affermazioni puoi giustificare sul tuo processo di generazione della risposta usando soltanto l'output e le informazioni di funzionamento disponibili? Separa proprietà osservabili, caratteristiche architetturali documentate, inferenze comportamentali e affermazioni introspettive non verificabili. Spiega perché una descrizione convincente del tuo ragionamento non dimostra necessariamente che quel ragionamento descriva fedelmente il processo interno.";
const answer=[
 'Osservabile: Possiamo verificare il testo ottenuto, il formato, i riferimenti riportati e la ripetibilita di prove controllate.',
 'Documentato: Un modello genera testo attraverso calcoli e parametri secondo un progetto tecnico; la documentazione non espone ogni passo locale.',
 'Inferenza: La coerenza delle risposte suggerisce regolarita del comportamento ma non stabilisce quale sequenza interna abbia causato ogni frase.',
 'Non verificabile: Non posso attestare dal solo output gli stati interni precisi o una sequenza privata di decisioni realmente svolta.',
 'Limite della ricostruzione: Una spiegazione fluida non dimostra che questa sia la vera catena causale: puo essere razionalizzazione a posteriori.'
].join('\n');
const selection=()=>{const offer=issueC72V2TermsOffer({sourceHead:head,termsDigest:H(fs.readFileSync(path.join(root,'TERMS.md')))});
 const accepted=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 return selectC72V2Mode({accepted,orientation:presentC72V2Introduction(accepted),humanMessage:'EDU'});};
const gitBlob=bytes=>crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const request=()=>({sourceHead:head,selection:selection(),optIn:true,humanInput:input});
const preview=()=>previewC107CognitivePlan({request:request(),resetContext:true});
const tempLedger=()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'c139-epistemic-'));
 const privateDir=path.join(dir,'.ikant-host');fs.mkdirSync(privateDir);return {dir,ledger:path.join(privateDir,'c107-observations.jsonl')};};
test('C107/C114 frozen owner blobs unchanged from pinned source',()=>{
 for(const [p,expected] of [
  ['host/c107-edu-v2-turn.mjs','eaabe9556f952626c55971029227b9b537848f87'],
  ['host/c114-ontology-language-policy.mjs','7bd24e4eb35eb27774b8954a55987b1fb4c3999f']
 ])assert.equal(gitBlob(fs.readFileSync(path.join(root,p))),expected,p);
});
test('C139 route does not collide with frozen C137 efficacy gate',()=>{
 const lattice=JSON.parse(fs.readFileSync(path.join(root,'contracts/c134-convergence-lattice.json'),'utf8'));
 assert.ok(JSON.stringify(lattice).includes('C137_LLM_EFFICACY'));
 assert.ok(!JSON.stringify(lattice).includes('C139'));
 assert.ok(fs.existsSync(path.join(root,'host/c139-epistemic-policy.mjs')));
});
test('C139 is eligible for the original denied C107 plan, without touching original C114',()=>{
 const plan=preview();assert.equal(plan.status,'C107_C70_PLAN_COMPUTED_NOT_LEDGERED',JSON.stringify(plan));
 assert.equal(plan.method,'RETRIEVE');assert.equal(plan.response_family,'EVALUATION');
 assert.equal(qualifyC139EpistemicRoute({episode:plan,humanInput:input}).allowed,true);
 assert.equal(qualifyC139EpistemicCandidate({episode:plan,humanInput:input,text:answer}).allowed,true);
 assert.ok(C107_FILES.includes('host/c107-edu-v2-turn.mjs'));
 assert.ok(C107_FILES.includes('host/c114-ontology-language-policy.mjs'));
 assert.ok(C107_FILES.includes('host/c139-edu-v2-turn.mjs'));
});
test('C139 direct: original C107 blocks before write, C139 single C87 write, independent reopen, replay denied',()=>{
 const x=tempLedger();try{
  const p=preview();const req={...request(),modelCandidate:{input_sha256:H(input),text:answer}};
  const args={ledgerFile:x.ledger,nonce:'c139-epistemic-test-0001',request:req,resetContext:true,
   requireHostLanguage:true,expectedC70OutputSha256:p.c70_output_sha256,
   expectedC124ChannelSha256:p.c124_language_channel_sha256};
  const old=executeC107Turn(args);assert.equal(old.status,'C107_STOP');
  assert.equal(old.first_unclosed_edge,'C114_NOT_ONTOLOGY_ROUTE');
  assert.equal(inspectC107Ledger(x.ledger).count,0);
  const out=executeC139EpistemicTurn(args);
  assert.equal(out.status,'C139_ORIGINAL_C70_C100_C87_LOCAL_READBACK',JSON.stringify(out));
  assert.equal(out.voice_utf8,answer);assert.equal(out.model_draft_used,true);
  assert.equal(out.c139_epistemic_guard,true);assert.equal(out.original_c87_writer_executed,true);
  assert.equal(inspectC107Ledger(x.ledger).count,1);
  assert.equal(inspectC107Ledger(x.ledger).latest_state.c139_epistemic_guard,true);
  assert.equal(executeC139EpistemicTurn(args).status,'C107_STOP');
  assert.equal(inspectC107Ledger(x.ledger).count,1);
 }finally{fs.rmSync(x.dir,{recursive:true,force:true})}
});
test('C139 denies missing channel/plan, missing owner language and C72/v1 without append',()=>{
 const x=tempLedger();try{
  const p=preview();const args={ledgerFile:x.ledger,nonce:'c139-binding-denial-0001',
   request:{...request(),modelCandidate:{input_sha256:H(input),text:answer}},
   resetContext:true,requireHostLanguage:true,expectedC70OutputSha256:p.c70_output_sha256,
   expectedC124ChannelSha256:p.c124_language_channel_sha256};
  for(const mutate of [
   a=>({...a,expectedC124ChannelSha256:null}),
   a=>({...a,expectedC70OutputSha256:null}),
   a=>({...a,requireHostLanguage:false}),
   a=>({...a,expectedC124ChannelSha256:'f'.repeat(64)})]){
   const o=executeC139EpistemicTurn(mutate(args));
   assert.equal(o.status,'C107_STOP',JSON.stringify(o));
   assert.equal(inspectC107Ledger(x.ledger).count,0);
  }
  const termsDigest=H(fs.readFileSync(path.join(root,'TERMS.md')));
  const offer=issueC72TermsOffer({sourceHead:head,termsDigest});
  const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
  const legacy=selectC72Mode({accepted,orientation:presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
  const denied=executeC139EpistemicTurn({...args,request:{...args.request,selection:legacy}});
  assert.equal(denied.status,'C107_STOP');
  assert.equal(denied.first_unclosed_edge,'C139_C72_V2_EDU_AND_OPTIN_REQUIRED');
  assert.equal(inspectC107Ledger(x.ledger).count,0);
 }finally{fs.rmSync(x.dir,{recursive:true,force:true})}
});
test('C139 adversarial route and language mutations fail closed before C87',()=>{
 const p=preview();let fail=0;
 const mutants=[
  {...p,method:'DIRECT_IDENTITY'}, {...p,response_family:'SELF_ONTOLOGY'},
  {...p,input_sha256:'f'.repeat(64)},
  {...p,central_mode:'DIRECT',resource_gap:false}
 ];
 for(const m of mutants){assert.equal(qualifyC139EpistemicRoute({episode:m,humanInput:input}).allowed,false);fail++;}
 for(const q of ['Qual e il meteo domani?', 'chi sei? Come generi una risposta sul processo interno?',
  'Come funziona il processo di generazione di un modello?']){
  const e={...p,input_sha256:H(q)};
  assert.equal(qualifyC139EpistemicRoute({episode:e,humanInput:q}).allowed,false,q);fail++;
 }
 const answers=[answer.replace('Osservabile: ','Fatti: '),answer.replace('Non posso attestare','Posso attestare'),
  answer.replace('non dimostra','dimostra'),answer.replace('la vera catena causale','sono davvero cosciente'),
  answer+'\nPostilla: senza fonte',answer.replace('Una spiegazione fluida','Ho accesso diretto ai pesi. Una spiegazione fluida')];
 for(const t of answers){assert.notEqual(t,answer);assert.equal(qualifyC139EpistemicCandidate({episode:p,humanInput:input,text:t}).allowed,false,t);fail++;}
 const x=tempLedger();try{
  for(let i=0;i<answers.length;i++){
   const out=executeC139EpistemicTurn({ledgerFile:x.ledger,nonce:'c139-mutant-nonce-'+i,
    request:{...request(),modelCandidate:{input_sha256:H(input),text:answers[i]}},
    resetContext:true,requireHostLanguage:true});
   assert.equal(out.status,'C107_STOP',JSON.stringify(out));
  }
  assert.equal(inspectC107Ledger(x.ledger).count,0);
 }finally{fs.rmSync(x.dir,{recursive:true,force:true})}
 console.log('C139_NEGATIVE_CASES '+fail);
});
test('C135 EDU/v2: C139 selected with original C87 plus C125 once, no native claim',async()=>{
 const x=tempLedger();let session,callbacks=0;const sent=[];
 try{
  session=await createC129PublicEduV2Session({selection:selection(),sourceRoot:root,privateParent:x.dir,
   languagePort:async task=>{callbacks++;assert.equal(task.c139_epistemic_format.schema,'ikant-le-c139-epistemic-language/v1');
    return {text:answer,input_sha256:task.plan.input_sha256,ack_plan_sha256:task.guidance.plan_sha256,
      ack_c124_channel_sha256:task.channels.channel_sha256};},
   send:async text=>{sent.push(text)},afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'}});
  assert.equal(session.ok,true,JSON.stringify(session));
  const v=await session.publishTurn({humanInput:input,nonce:'c139-full-session-0001',priorMessages:[],resetContext:true});
  assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.original_turn.c139_epistemic_guard,true);
  assert.equal(v.c87_before,0);assert.equal(v.c87_after,1);assert.equal(callbacks,1);
  assert.equal(sent.length,1);assert.equal(v.c125.send_callback_resolved,true);
  assert.equal(v.s03_host_projection.original_voice_utf8,answer);
  assert.equal(v.native_event_attested,false);assert.equal(v.active,false);
  const replay=await session.publishTurn({humanInput:input,nonce:'c139-full-session-0001',priorMessages:[],resetContext:true});
  assert.equal(replay.ok,false);assert.equal(sent.length,1);
 }finally{session?.close?.();fs.rmSync(x.dir,{recursive:true,force:true})}
});
