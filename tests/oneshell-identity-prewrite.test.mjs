import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {createC129PublicEduV2Session} from '../host/edu-c129-manual-entry.mjs';
const root=new URL('../',import.meta.url).pathname;
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const termsDigest=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'TERMS.md'))).digest('hex');
function selection(){const offer=issueC72V2TermsOffer({sourceHead:head,termsDigest});const accepted=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});return selectC72V2Mode({accepted,orientation:presentC72V2Introduction(accepted),humanMessage:'EDU'});}
test('Actual EDU C135 denies jargon BEFORE writing C87 and sending C125',async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-prewrite-'));let sends=0,session;
 try{
  session=await createC129PublicEduV2Session({sourceRoot:root,selection:selection(),privateParent:tmp,afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'},
   send:async()=>{sends++},languagePort:async t=>({text:'Sono C70 e uso un kernel.',input_sha256:t.plan.input_sha256,ack_plan_sha256:t.guidance.plan_sha256,ack_c124_channel_sha256:t.channels.channel_sha256})});
  assert.equal(session.ok,true,JSON.stringify(session));
  const r=await session.publishTurn({humanInput:'Ciao, sono un essere umano: tu cosa sei?',nonce:'identity-prewrite-00001',priorMessages:[],resetContext:true});
  assert.equal(r.ok,false,JSON.stringify(r));assert.equal(r.first_edge,'S02_PUBLIC_IDENTITY_LANGUAGE_DENIED');
  assert.equal(sends,0);assert.equal(session.status().port.resolved,0);
 }finally{session?.close?.();fs.rmSync(tmp,{recursive:true,force:true});}
});