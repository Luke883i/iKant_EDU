import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {materializeRepositoryPlan} from '../scripts/project-repo-loader.mjs';
import {issueC72V2LinkedTermsOffer,acceptC72V2LinkedTerms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {startOneShellEdu} from '../host/project-oneshell-edu.mjs';
import {projectPostAcceptOneShell} from '../host/project-oneshell-postaccept-rail.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const git=(type,b)=>createHash('sha1').update(Buffer.from(type+' '+b.length+'\0')).update(b).digest('hex');
function sourceFixture(){
 const paths=[...JSON.parse(fs.readFileSync(path.join(root,'contracts/project-session-source.json'))).paths,'contracts/project-session-source.json'];
 const entries=new Map(paths.map(p=>{const b=fs.readFileSync(path.join(root,p));return[p,{path:p,type:'blob',mode:'100644',sha:git('blob',b)}]})),dirs=new Set();
 for(const p of paths){let d=path.posix.dirname(p);while(d!=='.'){dirs.add(d);d=path.posix.dirname(d)}}
 function tree(dir){const rows=[...entries.values()].filter(e=>path.posix.dirname(e.path)===(dir||'.')).sort((a,b)=>Buffer.compare(Buffer.from(path.posix.basename(a.path)+(a.type==='tree'?'/':'')),Buffer.from(path.posix.basename(b.path)+(b.type==='tree'?'/':''))));return git('tree',Buffer.concat(rows.flatMap(e=>[Buffer.from((e.type==='tree'?'40000':e.mode)+' '+path.posix.basename(e.path)+'\0'),Buffer.from(e.sha,'hex')])))}
 for(const d of [...dirs].sort((a,b)=>b.split('/').length-a.split('/').length))entries.set(d,{path:d,type:'tree',mode:'040000',sha:tree(d)});
 const head='a'.repeat(40),t=tree('');return {expected:{head,tree:t},plan:{source_head:head,live_head:head,source_tree:t,truncated:false,tree:[...entries.values()],files:paths.map(p=>({path:p,encoding:'base64',content:fs.readFileSync(path.join(root,p)).toString('base64')}))}};
}
test('real C135 first turn and recovered worker project into the SAME six-slot rail with no extra writer',async()=>{
 const {expected,plan}=sourceFixture(),parent=fs.mkdtempSync(path.join(os.tmpdir(),'oneshell-e9-source-'));
 fs.chmodSync(parent,0o700);const sourceRoot=path.join(parent,'source');let a=null,b=null;
 try{
  materializeRepositoryPlan(plan,{...expected,destination:sourceRoot});
  const sha=x=>createHash('sha256').update(x).digest('hex');
  const offer=issueC72V2LinkedTermsOffer({sourceHead:expected.head,termsDigest:sha(fs.readFileSync(path.join(sourceRoot,'TERMS.md')))});
  const accepted=acceptC72V2LinkedTerms({offer,humanMessage:'I ACCEPT',termsLinkPresented:true});
  const introduction=presentC72V2Introduction(accepted);
  const selection=selectC72V2Mode({accepted,orientation:introduction,humanMessage:'EDU'});
  const base={sourceHead:expected.head,liveHead:expected.head,accepted,introduction,selection,sourceTree:expected.tree};
  const e=projectPostAcceptOneShell({...base,phase:'ACCEPTED'});
  assert.equal(e.ok,true);
  const m=projectPostAcceptOneShell({...base,phase:'EDU_SELECTED'});
  assert.equal(m.ok,true);assert.equal(e.host_session_anchor_sha256,m.host_session_anchor_sha256);
  const common={selection,sourceRoot,sourceBinding:expected,privateParent:parent,
   afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'},
   languagePort:async task=>task.schema==='ikant-edu-v2-open-language-task/v1'
    ?{text:'Questa verifica e locale: una prova indipendente potrebbe falsificare la conclusione.',
      input_sha256:task.plan.input_sha256,ack_plan_sha256:task.plan.plan_sha256}
    :{text:'Questa verifica e locale e richiede riscontri osservabili.',...task.required_ack}};
  a=await startOneShellEdu(common);assert.equal(a.ok,true,JSON.stringify(a.frame));
  const ready=projectPostAcceptOneShell({...base,phase:'EDU_READY',ownerSession:a});
  assert.equal(ready.ok,true,ready.edge);assert.equal(ready.frame.slots.A,'NO_VOICE');
  const first='Descrivi un esperimento ripetibile.',nonce1='e9-first-nonce-0001';
  const f1=await a.publishTurn({humanInput:first,nonce:nonce1,priorMessages:[],resetContext:true});
  assert.equal(f1.voice_origin,'HOST_BOUND_LOCAL',JSON.stringify(f1));
  const cp1=a.exportPortableC87({priorMessages:[first]});assert.equal(cp1.expectedCount,1);
  const v1=projectPostAcceptOneShell({...base,phase:'OWNER_TURN',ownerSession:a,ownerFrame:f1,
   turnNonce:nonce1,turnInput:first,checkpoint:cp1});
  assert.equal(v1.ok,true,JSON.stringify(v1));assert.equal(v1.frame.slots.A,f1.slots.A);
  a.close();a=null;
  b=await startOneShellEdu({...common,resumeFrom:{...cp1,previousWorkerGone:true}});
  assert.equal(b.ok,true,JSON.stringify(b.frame));
  const second='Fai una seconda verifica.',nonce2='e9-second-nonce-0002';
  const f2=await b.publishTurn({humanInput:second,nonce:nonce2,priorMessages:[first],resetContext:false});
  assert.equal(f2.voice_origin,'HOST_BOUND_LOCAL',JSON.stringify(f2));
  const cp2=b.exportPortableC87({priorMessages:[first,second]});assert.equal(cp2.expectedCount,2);
  const v2=projectPostAcceptOneShell({...base,phase:'RECOVERED_TURN',ownerSession:b,
   ownerFrame:f2,turnNonce:nonce2,turnInput:second,checkpoint:cp2,
   recoveryWitness:{previousWorkerGone:true}});
  assert.equal(v2.ok,true,JSON.stringify(v2));
  assert.equal(v2.original_c87_count,2);
  assert.equal(v2.host_session_anchor_sha256,v1.host_session_anchor_sha256);
  assert.equal(v2.native_ui_attested,false);assert.equal(v2.provider_persistence_attested,false);
 }finally{a?.close();b?.close();fs.rmSync(parent,{recursive:true,force:true});}
});
