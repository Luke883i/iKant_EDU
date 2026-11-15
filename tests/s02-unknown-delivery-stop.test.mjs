import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createC129PublicEduV2Session} from '../host/edu-c129-manual-entry.mjs';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
const root=path.resolve(new URL('../',import.meta.url).pathname);
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function selection(){
 const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const termsDigest=sha(fs.readFileSync(path.join(root,'TERMS.md')));
 const offer=issueC72V2TermsOffer({sourceHead:head,termsDigest});
 const accepted=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 return selectC72V2Mode({accepted,orientation:presentC72V2Introduction(accepted),humanMessage:'EDU'});
}
const frame=nonce=>({humanInput:'Descrivi le prove prima di rispondere.',nonce,priorMessages:[],resetContext:true});
const languagePort=async task=>({text:'Bozza HOST, non consegna nativa.',input_sha256:task.plan.input_sha256,ack_plan_sha256:task.guidance.plan_sha256,ack_c124_channel_sha256:task.channels.channel_sha256});
test('S02 C87 written but C125 delivery unknown latches STOP; no blind retry with a fresh nonce',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'s02-uncertain-'));let s,calls=0;
 try{
  s=await createC129PublicEduV2Session({selection:selection(),sourceRoot:root,privateParent:dir,languagePort,
   send:async()=>{calls++;throw Error('UNKNOWN_PLATFORM_DELIVERY')},
   afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'}});
  assert.equal(s.ok,true,JSON.stringify(s));
  const first=await s.publishTurn(frame('s02-unknown-nonce-01'));
  assert.equal(first.ok,false);assert.equal(first.status,'S02_C125_OUTPUT_BLOCKED');
  assert.equal(first.c87_before,0);assert.equal(first.c87_after,1);
  assert.equal(first.c125.reason,'DELIVERY_UNKNOWN_DO_NOT_RETRY');
  assert.equal(s.status().uncertain,true);
  const second=await s.publishTurn(frame('s02-unknown-nonce-02'));
  assert.equal(second.ok,false);assert.equal(second.first_edge,'S02_UNCERTAIN_WRITE_OR_DELIVERY_RECONCILE');
  assert.equal(calls,1);assert.equal(s.status().attempted,1);
 }finally{s?.close();fs.rmSync(dir,{recursive:true,force:true})}
});
