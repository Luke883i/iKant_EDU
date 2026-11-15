import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {runOneZipOriginalAdmission} from '../scripts/project-edu-onezip-admission.mjs';

const sha=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const first=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
const humanText='Valuta una fonte e rendi espliciti i limiti.';
const secondText='Prosegui sullo stesso contesto con una verifica.';
const answerText='Risposta originale EDU verificabile.';
const script=fileURLToPath(new URL('../scripts/project-edu-onezip-session.mjs',import.meta.url));

async function physicalTurn(request,requestPath){
 fs.writeFileSync(requestPath,JSON.stringify(request)+'\n',{flag:'wx',mode:0o600});
 const child=spawn(process.execPath,[script,requestPath],{stdio:['pipe','pipe','pipe']});
 let stream='',err='',receipt=null,taskCount=0;
 const terminated=new Promise((resolve,reject)=>{
  const kill=setTimeout(()=>{child.kill('SIGKILL');reject(Error('ONEZIP_PHYSICAL_TURN_TIMEOUT'));},30000);
  child.on('error',e=>{clearTimeout(kill);reject(e)});
  child.stderr.on('data',x=>{err+=String(x)});
  child.stdout.on('data',bytes=>{
   stream+=String(bytes);
   for(let k;(k=stream.indexOf('\n'))>=0;){
    const line=stream.slice(0,k);stream=stream.slice(k+1);
    if(!line.trim())continue;
    let q;try{q=JSON.parse(line)}catch(e){child.kill();reject(Error('INVALID_OWNER_FRAME:'+line.slice(0,120)));return}
    if(q.schema==='ikant-edu-host-language-task/v1'){
     taskCount++;
     const task=q.task;
     const ack=task.required_ack||{input_sha256:task.plan.input_sha256,ack_plan_sha256:task.plan.plan_sha256};
     child.stdin.write(JSON.stringify({schema:'ikant-edu-host-language-reply/v1',
       task_id:q.task_id,text:answerText,...ack})+'\n');
     child.stdin.end();
    }else receipt=q;
   }
  });
  child.on('close',code=>{
   clearTimeout(kill);
   if(code!==0)reject(Error('ORIGINAL_ONEZIP_TURN_FAILED:'+code+':'+JSON.stringify(receipt)+':'+err.slice(0,400)));
   else resolve();
  });
 });
 await terminated;
 assert.equal(taskCount,1,'one actual original owner task per human input');
 assert(receipt?.ok,JSON.stringify(receipt));
 assert.equal(receipt.frame?.voice_origin,'HOST_BOUND_LOCAL');
 assert.equal(receipt.frame.slots.A,answerText);
 assert.equal(receipt.original_voice_sha256,sha(answerText));
 assert.notEqual(receipt.original_c125_sha256,sha(answerText));
 assert.equal(receipt.native_delivery_attested,false);
 return receipt;
}

test('verified full source -> OneZIP C72 original -> real stdio child turn -> cold C87 second child',async t=>{
 const sourceRoot=process.env.EDU_TEST_SOURCE_ROOT;
 const head=process.env.EDU_TEST_HEAD,tree=process.env.EDU_TEST_TREE;
 if(!sourceRoot||!head||!tree){t.skip('requires full verified PR HEAD source from ZIP');return;}
 const privateRoot=fs.mkdtempSync(path.join(os.tmpdir(),'edu-pr180-real-wrapper-'));
 fs.chmodSync(privateRoot,0o700);
 try{
  const source=JSON.parse(fs.readFileSync(path.join(sourceRoot,'.project-source-readback.json'),'utf8'));
  assert.equal(source.source_head,head);assert.equal(source.source_tree,tree);
  const blobs=Object.fromEntries(source.files.map(e=>[e.path,e.git_blob_sha1]));
  const prior={source_head:head,host_link_displayed:true,distinct_human_message_observed:true,
   terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+head+'/TERMS.md',
   pinned_blob_shas:Object.fromEntries(first.map(p=>[p,blobs[p]]))};
  const common={schema:'ikant-edu-onezip-admission/v1',head,sourceRoot,privateRoot,
   humanTurnWitnessed:true,ownerOutcome:'NOT_INVOKED'};
  const accepted=await runOneZipOriginalAdmission({...common,action:'ACCEPT',
   humanMessage:'I ACCEPT',liveHead:head,distinctConsentTurnWitnessed:true,firstTurnEvidence:prior});
  assert.equal(accepted.ok,true,JSON.stringify(accepted));
  assert.equal(accepted.original_owner_invoked,true);
  assert(fs.existsSync(path.join(privateRoot,'c72-accepted.json')));
  const mode=await runOneZipOriginalAdmission({...common,action:'EDU',
   humanMessage:'EDU',distinctModeTurnWitnessed:true});
  assert.equal(mode.ok,true,JSON.stringify(mode));
  assert.equal(mode.selection?.selected_mode,'EDU');
  assert(fs.existsSync(path.join(privateRoot,'c72-selection.json')));
  const base={schema:'ikant-edu-onezip-turn/v1',humanTurnWitnessed:true,head,sourceRoot,privateRoot};
  const one=await physicalTurn({...base,humanInput:humanText,
   nonce:'onezip-real-test-nonce-0001',priorMessages:[],resetContext:true},
   path.join(privateRoot,'first-request.json'));
  assert.equal(one.checkpoint.expectedCount,1);
  assert.equal(one.checkpoint.schema,'ikant-le-c135-portable-c87/v1');
  const two=await physicalTurn({...base,humanInput:secondText,
   nonce:'onezip-real-test-nonce-0002',priorMessages:[humanText],resetContext:false,
   resumeFrom:{...one.checkpoint,previousWorkerGone:true}},
   path.join(privateRoot,'second-request.json'));
  assert.equal(two.checkpoint.expectedCount,2);
  assert.notEqual(two.checkpoint.expectedLastHash,one.checkpoint.expectedLastHash);
  assert.equal(two.frame.slots.A,answerText);
 }finally{fs.rmSync(privateRoot,{recursive:true,force:true});}
});
