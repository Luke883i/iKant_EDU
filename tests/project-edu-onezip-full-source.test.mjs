/** Full real PR HEAD ZIP/loader -> original C72 -> original C135/C87/C125.
 * Fixture human/LLM callbacks: SOFTWARE proof only, NEVER field ChatGPT proof.
 * SOURCE_ROOT/HEAD/TREE are produced by an actual git-archive CI job. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

test('actual commit source closure executes original C72 and two original EDU owner turns',async t=>{
 const root=process.env.EDU_TEST_SOURCE_ROOT,head=process.env.EDU_TEST_HEAD,tree=process.env.EDU_TEST_TREE;
 if(!root||!head||!tree){t.skip('only in full-source ZIP qualification job');return;}
 const from=p=>pathToFileURL(path.join(root,p)).href;
 const loader=await import(from('scripts/project-repo-loader.mjs'));
 const receipt=loader.verifyLocalProjectSource(root,{head,tree});
 assert.equal(receipt.source_head,head);assert.equal(receipt.source_tree,tree);
 const c72=await import(from('host/c72-public-mode-admission.mjs'));
 const terms=fs.readFileSync(path.join(root,'TERMS.md'));
 const termsDigest=createHash('sha256').update(terms).digest('hex');
 const offer=c72.issueC72V2LinkedTermsOffer({sourceHead:head,termsDigest});
 const accepted=c72.acceptC72V2LinkedTerms({offer,humanMessage:'I ACCEPT',termsLinkPresented:true});
 assert(c72.validateC72V2Accepted(accepted));
 const intro=c72.presentC72V2Introduction(accepted);
 assert(c72.validateC72V2Orientation(intro,accepted));
 const selection=c72.selectC72V2Mode({accepted,orientation:intro,humanMessage:'EDU'});
 assert(c72.validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead:head}));
 if(process.env.EDU_TEST_PHASE==='C72_ONLY')return;
 const one=await import(from('host/project-oneshell-edu.mjs'));
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-edu-pr180-full-'));
 fs.chmodSync(parent,0o700);
 const firstInput='Valuta una fonte e rendi espliciti i limiti.';
 const secondInput='Prosegui sullo stesso contesto con una verifica.';
 const languagePort=async task=>task.required_ack?
  {text:'Risposta originale EDU verificabile.',...task.required_ack}:
  {text:'Risposta originale EDU verificabile.',input_sha256:task.plan.input_sha256,ack_plan_sha256:task.plan.plan_sha256};
 let a=null,b=null;
 try{
  const common={selection,sourceRoot:root,sourceBinding:{head,tree},privateParent:parent,
   languagePort,afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'}};
  a=await one.startOneShellEdu(common);
  assert.equal(a.ok,true,JSON.stringify(a.frame));
  if(process.env.EDU_TEST_PHASE==='C135_BOOT')return;
  const f1=await a.publishTurn({humanInput:firstInput,nonce:'pr180-full-first-0001',priorMessages:[],resetContext:true});
  assert.equal(f1.voice_origin,'HOST_BOUND_LOCAL',JSON.stringify(f1));
  assert.equal(f1.slots.A,'Risposta originale EDU verificabile.');
  const e1=a.getLastEvidence();
  assert.equal(e1.original_c125_sha256,createHash('sha256').update(e1.original_c125_utf8,'utf8').digest('hex'));
  assert.equal(f1.original_voice_sha256,createHash('sha256').update(f1.slots.A,'utf8').digest('hex'));
  assert(e1.original_c125_utf8.includes('<<<VOICE_UTF8_START>>>\n'+f1.slots.A+'\n<<<VOICE_UTF8_END>>>'));
  assert.equal(e1.original_c87_readback.count,1);
  if(process.env.EDU_TEST_PHASE==='C135_VOICE')return;
  const cp=a.exportPortableC87({priorMessages:[firstInput]});
  assert.equal(cp.schema,'ikant-le-c135-portable-c87/v1',JSON.stringify(cp));
  if(process.env.EDU_TEST_PHASE==='C135_FIRST')return;
  a.close();a=null;
  b=await one.startOneShellEdu({...common,resumeFrom:{...cp,previousWorkerGone:true}});
  assert.equal(b.ok,true,JSON.stringify(b.frame));
  const f2=await b.publishTurn({humanInput:secondInput,nonce:'pr180-full-second-0002',priorMessages:[firstInput],resetContext:false});
  assert.equal(f2.voice_origin,'HOST_BOUND_LOCAL',JSON.stringify(f2));
  assert.equal(f2.slots.A,'Risposta originale EDU verificabile.');
  const state=b.readSessionState();assert.equal(state.original_c87_readback.count,2);
  const cp2=b.exportPortableC87({priorMessages:[firstInput,secondInput]});
  assert.equal(cp2.expectedCount,2);
 }finally{a?.close();b?.close();fs.rmSync(parent,{recursive:true,force:true});}
});
