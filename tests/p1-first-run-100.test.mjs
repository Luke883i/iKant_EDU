/** Exactly 100 original API cold-start simulations: 20 real C87/C125, 80 denials.
 * All inputs are test fixtures, not real people or authenticated provider events.
 */
import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {createC129PublicEduV2Session} from '../host/edu-c129-manual-entry.mjs';
const root=path.resolve(new URL('../',import.meta.url).pathname);
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const terms=sha(fs.readFileSync(path.join(root,'TERMS.md')));
function select(mode='EDU',digest=terms){
 const offer=issueC72V2TermsOffer({sourceHead:head,termsDigest:digest});
 const accepted=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 return selectC72V2Mode({accepted,orientation:presentC72V2Introduction(accepted),humanMessage:mode});
}
const witness={accepted:true,scope:'HOST_WITNESSED_ONLY'};
const language=async t=>({text:'Questa prova usa regole verificabili; non certifica una connessione nativa.',
 input_sha256:t.plan.input_sha256,ack_plan_sha256:t.guidance.plan_sha256,
 ack_c124_channel_sha256:t.channels.channel_sha256});
test('100 simulated initializations with original gates and owner',async()=>{
 let positive=0,denied=0,writes=0;
 for(let i=0;i<100;i++){
  const d=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-100-'));let s=null,sent=0;
  const variant=i%10;
  try{
   let opts={selection:select(),sourceRoot:root,privateParent:d,languagePort:language,
    send:async()=>{sent++},afterAcceptWitness:witness};
   if(variant===2)opts.selection=select('CANONICAL');
   if(variant===3)opts.selection=select('EDU','f'.repeat(64));
   if(variant===4)opts.selection={...select(),source_head:'0'.repeat(40)};
   if(variant===5)opts.afterAcceptWitness={accepted:false,scope:'HOST_WITNESSED_ONLY'};
   if(variant===6)opts.languagePort=null;
   if(variant===7)opts.send=null;
   if(variant===8)opts.sourceRoot=d;
   if(variant===9)opts.unexpected=true;
   s=await createC129PublicEduV2Session(opts);
   if(variant<2){
    assert.equal(s.ok,true,JSON.stringify(s));
    const r=await s.publishTurn({humanInput:'Spiega il controllo locale numero '+i+'.',
     nonce:'cold-restart-'+String(i).padStart(4,'0'),priorMessages:[],resetContext:true});
    assert.equal(r.ok,true,JSON.stringify(r));
    assert.equal(r.c87_after-r.c87_before,1);
    assert.equal(r.c125.send_callback_resolved,true);
    assert.equal(r.native_event_attested,false);assert.equal(r.active,false);
    assert.equal(sent,1);positive++;writes++;
   }else{assert.equal(s.ok,false,JSON.stringify(s));assert.equal(sent,0);denied++;}
  }finally{s?.close?.();fs.rmSync(d,{recursive:true,force:true})}
 }
 assert.deepEqual({positive,denied,writes},{positive:20,denied:80,writes:20});
});
