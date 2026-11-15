import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import {materializeRepositoryPlan} from '../scripts/project-repo-loader.mjs';
import {issueC72V2LinkedTermsOffer,acceptC72V2LinkedTerms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {projectPostAcceptFocusApp,openFocusOneShellSession} from '../host/project-oneshell-focus-session.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=s=>createHash('sha256').update(s).digest('hex');
const git=(type,b)=>createHash('sha1').update(Buffer.from(type+' '+b.length+'\0')).update(b).digest('hex');
const folder=()=>{const p=fs.mkdtempSync(path.join(os.tmpdir(),'focus-owner-'));fs.chmodSync(p,0o700);return p;};
function original(head='a'.repeat(40),terms=sha('test terms only')){
 const offer=issueC72V2LinkedTermsOffer({sourceHead:head,termsDigest:terms});
 const accepted=acceptC72V2LinkedTerms({offer,humanMessage:'I ACCEPT',termsLinkPresented:true});
 const introduction=presentC72V2Introduction(accepted);
 const selection=selectC72V2Mode({accepted,orientation:introduction,humanMessage:'EDU'});
 return {sourceHead:head,liveHead:head,accepted,introduction,selection};
}
function fixture(){
 const files=[...JSON.parse(fs.readFileSync(path.join(root,'contracts/project-session-source.json'))).paths,'contracts/project-session-source.json'];
 const entries=new Map(files.map(p=>{const b=fs.readFileSync(path.join(root,p));return[p,{path:p,mode:'100644',type:'blob',sha:git('blob',b)}]})),dirs=new Set();
 for(const p of files){let d=path.posix.dirname(p);while(d!=='.'){dirs.add(d);d=path.posix.dirname(d);}}
 function tree(dir){const rows=[...entries.values()].filter(e=>path.posix.dirname(e.path)===(dir||'.')).sort((a,b)=>Buffer.compare(Buffer.from(path.posix.basename(a.path)+(a.type==='tree'?'/':'')),Buffer.from(path.posix.basename(b.path)+(b.type==='tree'?'/':''))));
 return git('tree',Buffer.concat(rows.map(e=>Buffer.concat([Buffer.from((e.type==='tree'?'40000':e.mode)+' '+path.posix.basename(e.path)+'\0'),Buffer.from(e.sha,'hex')]))));}
 for(const d of [...dirs].sort((a,b)=>b.split('/').length-a.split('/').length))entries.set(d,{path:d,mode:'040000',type:'tree',sha:tree(d)});
 const head='a'.repeat(40),t=tree('');
 return {head,tree:t,plan:{source_head:head,live_head:head,source_tree:t,truncated:false,tree:[...entries.values()],files:files.map(p=>({path:p,encoding:'base64',content:fs.readFileSync(path.join(root,p)).toString('base64')}))}};
}
test('real C72 accepted frame produces one branded NO_VOICE app without C135',async()=>{
 const p=folder();try{
  const r=await projectPostAcceptFocusApp({...original(),phase:'ACCEPTED',outputDirectory:p});
  assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.frame.slots.A,'NO_VOICE');assert.equal(r.native_ui_attested,false);
  assert.equal(fs.existsSync(r.focus_app.app_path),true);
  const drift=await projectPostAcceptFocusApp({...original(),liveHead:'b'.repeat(40),phase:'ACCEPTED',outputDirectory:p,reportName:'drift'});
  assert.equal(drift.ok,false);assert.equal(drift.voice,'NO_VOICE');assert.equal(fs.existsSync(path.join(p,'drift.html')),false);
 }finally{fs.rmSync(p,{recursive:true,force:true})}
});
test('post-EDU focus app reuses same original C135 for TWO human turns with independent C87',async()=>{
 const f=fixture(),p=folder(),sourceRoot=path.join(p,'source'),out=path.join(p,'visible');let session;
 try{
  materializeRepositoryPlan(f.plan,{head:f.head,tree:f.tree,destination:sourceRoot});
  fs.mkdirSync(out,{mode:0o700});
  const o=original(f.head,sha(fs.readFileSync(path.join(sourceRoot,'TERMS.md'))));
  const lang=async task=>task.schema==='ikant-edu-v2-open-language-task/v1'?
   {text:'La risposta e utile se si puo verificare e contestare.',input_sha256:task.plan.input_sha256,ack_plan_sha256:task.plan.plan_sha256}:
   {text:'Il valore umano richiede prove e limiti leggibili.',...task.required_ack};
  session=await openFocusOneShellSession({sourceHead:f.head,sourceTree:f.tree,sourceRoot,privateRoot:p,
   accepted:o.accepted,introduction:o.introduction,selection:o.selection,readMain:async()=>f.head,
   languagePort:lang,outputDirectory:out});
  assert.equal(session.ok,true,JSON.stringify(session));assert.equal(session.focus_ready.focus_slot,'A');
  assert.equal(session.chat_ready.ok,true);
  assert.equal(session.chat_ready.slots.A,'NO_VOICE');
  assert.equal(session.chat_ready.render_plan.brand.verified,true);
  const first=await session.publishHumanTurn({humanInput:'Quale valore ha una prova?',nonce:'focus-real-turn-00001',humanMessageObserved:true});
  const second=await session.publishHumanTurn({humanInput:'E quale limite resta?',nonce:'focus-real-turn-00002',humanMessageObserved:true});
  assert.equal(first.ok,true,JSON.stringify(first));assert.equal(second.ok,true,JSON.stringify(second));
  assert.equal(first.original_c87_count,1);assert.equal(second.original_c87_count,2);
  assert.equal(first.chat_presentation?.ok,true);assert.equal(second.chat_presentation?.ok,true);
  assert.equal(first.chat_presentation.slots.A,first.frame.slots.A);
  assert.equal(second.chat_presentation.report.sha256,second.focus_app.report_sha256);
  assert.equal(session.original_c87_count(),2);assert.equal(first.anchor,second.anchor);
  assert.equal(first.original_voice_preserved,true);assert.equal(second.focus_app.original_frame_readback,true);
  assert(fs.readFileSync(second.focus_app.report_path,'utf8').includes(second.frame.slots.A));
  assert.equal(second.focus_app.native_ui_attested,false);
  const beforeReport=fs.readFileSync(second.focus_app.report_path);
  session.close();session=null;
  session=await openFocusOneShellSession({sourceHead:f.head,sourceTree:f.tree,sourceRoot,privateRoot:p,
   accepted:o.accepted,introduction:o.introduction,selection:o.selection,readMain:async()=>f.head,
   languagePort:lang,outputDirectory:out,recoveryWitness:{previousWorkerGone:true}});
  assert.equal(session.ok,true,JSON.stringify(session));
  assert.equal(session.original_c87_count(),2);
  assert.match(session.focus_ready.app_path,/edu-ready-rebind-000002\.html$/);
  const third=await session.publishHumanTurn({humanInput:'Dopo recupero C87, che prova resta?',nonce:'focus-recovered-00003',humanMessageObserved:true});
  assert.equal(third.ok,true,JSON.stringify(third));assert.equal(third.phase,'RECOVERED_TURN');
  assert.equal(third.original_c87_count,3);
  assert.equal(third.chat_presentation?.ok,true);
  assert.equal(third.chat_presentation.slots.A,third.frame.slots.A);
  assert.deepEqual(fs.readFileSync(second.focus_app.report_path),beforeReport,'previous report must remain unchanged');
  assert.equal(third.focus_app.host_report_readback,true);
 }finally{session?.close();fs.rmSync(p,{recursive:true,force:true})}
});
