import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {selectC72V2Mode,validateC72V2Accepted,
 validateC72V2Orientation,validateC72V2ModeSelection}
 from '../host/c72-public-mode-admission.mjs';
import {runC72SelectedHostIngress} from '../host/project-c72-physical-ingress.mjs';
import {startOneShellEdu,renderOneShell} from '../host/project-oneshell-edu.mjs';
import {oneShellMaterialized} from '../host/project-oneshell-phases.mjs';
import {emitVerifiedHostOneShell} from '../host/project-oneshell-emission.mjs';
import {makeC135AcknowledgedDraft} from '../host/project-oneshell-language-ack.mjs';
import {bindManagedOneShellEdu} from '../host/project-oneshell-continuity.mjs';
import {planOneShellEduSource} from '../host/project-oneshell-edu.mjs';
import {buildPartialKit} from '../scripts/project-c72-partial-source-kit.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const SHA=b=>createHash('sha256').update(b).digest('hex');
const required=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];

test('PR HEAD original owner chain: linked C72 -> later EDU -> full manual ZIP -> Node loader -> C135/C87/C125/S03 -> canonical verified logo',async()=>{
 const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-171-complete-'));
 const zip=path.join(tmp,'repo.zip'),api=path.join(tmp,'api-tree.json'),
  plan=path.join(tmp,'plan.json'),source=path.join(tmp,'source');
 let session=null;
 const run=(cmd,args)=>spawnSync(cmd,args,{cwd:root,encoding:'utf8',timeout:90000,maxBuffer:3_000_000});
 try{
  // The first-turn witness is a CHECKOUT FIXTURE, not native GitHub ingress.
  // The Host packet is physically assembled from five actual PR-head Git blobs,
  // then passed through the existing Host adapter to the original C72 owner.
  const originalDocs=required.map(p=>({path:p,source_head:head,
    blob_sha1:git('rev-parse','HEAD:'+p),
    content:execFileSync('git',['show','HEAD:'+p],{cwd:root,encoding:'utf8'})}));
  const witness={source_head:head,host_link_displayed:true,
    distinct_human_message_observed:true,
    terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+head+'/TERMS.md',
    pinned_blob_shas:Object.fromEntries(originalDocs.map(d=>[d.path,d.blob_sha1]))};
  const packet={schema:'ikant-host-c72-source-packet/v1',source_head:head,live_head:head,
    carrier_kind:'HOST_OPAQUE_TRANSFER',source_origin_attested:false,
    native_event_attested:false,documents:originalDocs};
  const admission=await runC72SelectedHostIngress({
    humanMessage:'I ACCEPT',freshHumanTurn:true,priorTurnEvidence:witness,
    carrier:'AUTO',sourcePacket:packet,ownerOutcome:'NOT_INVOKED'});
  assert.equal(admission.ok,true,JSON.stringify(admission));
  assert.equal(admission.host_carrier_selected,'HOST_SOURCE_PACKET');
  assert.equal(admission.original_owner_invoked,true);
  assert.equal(admission.provider_source_event_attested,false);
  const accepted=admission.accepted,introduction=admission.introduction;
  assert(validateC72V2Accepted(accepted));
  assert(validateC72V2Orientation(introduction,accepted));
  assert.equal(accepted.terms_digest,SHA(fs.readFileSync(path.join(root,'TERMS.md'))));
  // Exact original owner bytes are staged into a SEPARATE later Node process,
  // not imported from the checkout into this test's EDU selection.
  const kit=buildPartialKit({head});
  const modePacket=kit.files.filter(x=>['contracts/c72-public-mode-admission-v2.json',
   'host/c72-public-mode-admission.mjs'].includes(x.path))
   .map(x=>({path:x.path,contentBase64:x.contentBase64}));
  const modeRequest={schema:'ikant-host-c72-later-mode/v1',humanMessage:'EDU',
   freshHumanTurn:true,priorAcceptanceObserved:true,ownerOutcome:'NOT_INVOKED',
   sourceHead:head,liveHead:head,accepted,introduction,
   expectedBlobShas:Object.fromEntries(kit.files.map(x=>[x.path,x.blob_sha1])),
   sourcePacket:modePacket};
  // The later process receives the exact packet over stdin.
  const later=spawnSync(process.execPath,[path.join(root,'scripts/project-c72-cold-mode-cli.mjs')],{
   cwd:tmp,input:JSON.stringify(modeRequest),encoding:'utf8',timeout:20000,maxBuffer:2000000});
  assert.equal(later.status,0,later.stderr+' '+later.stdout);
  const resultMode=JSON.parse(later.stdout);
  assert.equal(resultMode.ok,true);assert.equal(resultMode.original_owner_invoked,true);
  const selection=resultMode.selection;
  assert(validateC72V2ModeSelection(selection,{mode:'EDU',sourceHead:head}));
  const manual=planOneShellEduSource({selection,sourceState:'SOURCE_ABSENT',
   bridgeState:'UNKNOWN',nodeReady:true,manualExtractorReady:true,
   manualRoute:'EXPLICIT_MANUAL_POST_EDU'});
  assert.equal(manual.slots.NEXT,'UPLOAD_PINNED_SOURCE_ZIP');
  assert.equal(manual.slots.PROVA,'https://github.com/Luke883i/iKant_EDU/archive/'+head+'.zip');
  assert.equal(selection.selected_mode,'EDU');
  const artifact=run('git',['archive','--format=zip','--prefix=iKant_EDU-'+head+'/','-o',zip,'HEAD']);
  assert.equal(artifact.status,0,artifact.stderr);
  const rows=execFileSync('git',['ls-tree','-r','-t','-z','HEAD'],{cwd:root})
   .toString('utf8').split(String.fromCharCode(0)).filter(Boolean).map(x=>{
    const t=x.indexOf(String.fromCharCode(9)),[mode,type,sha]=x.slice(0,t).split(' ');
    assert(t>0);return {path:x.slice(t+1),mode,type,sha};
   });
  fs.writeFileSync(api,JSON.stringify({source_head:head,source_tree:tree,
   live_head:head,truncated:false,tree:rows}));
  const extraction=run('python3',['scripts/project-manual-source.py',
   '--source-zip',zip,'--api-tree',api,'--head',head,'--tree',tree,'--output-plan',plan]);
  assert.equal(extraction.status,0,extraction.stderr+extraction.stdout);
  const extracted=JSON.parse(fs.readFileSync(plan,'utf8'));
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'contracts/project-session-source.json'),'utf8'));
  assert.deepEqual(new Set(extracted.files.map(x=>x.path)),
   new Set([...manifest.paths,'contracts/project-session-source.json']));
  const loader=run(process.execPath,['scripts/project-repo-loader.mjs',plan,source,head,tree]);
  assert.equal(loader.status,0,loader.stderr+loader.stdout);
  const readback=JSON.parse(fs.readFileSync(path.join(source,'.project-source-readback.json'),'utf8'));
  assert.equal(readback.source_head,head);assert.equal(readback.source_tree,tree);
  for(const p of [...required,'assets/brand/ikant-light.svg',
    'plugins/ikant-le-session-chat/assets/ikant-light.svg','host/c135-edu-v2-owner.mjs']){
   assert(fs.readFileSync(path.join(source,p)).equals(fs.readFileSync(path.join(root,p))));
  }
  const materialized=oneShellMaterialized({selection,sourceRoot:source,head,tree});
  assert.equal(materialized.slots.NEXT,'START_C135_EDU');
  const sent=[];
  session=await startOneShellEdu({selection,sourceRoot:source,
   sourceBinding:{head,tree},privateParent:tmp,
   afterAcceptWitness:{accepted:true,scope:'HOST_WITNESSED_ONLY'},
   languagePort:async task=>makeC135AcknowledgedDraft(task,
    'Risposta EDU locale verificata: prove separate dalle ipotesi.')});
  assert.equal(session.ok,true,JSON.stringify(session));
  assert.equal(session.frame.slots.NEXT,'AWAIT_HUMAN_INPUT');
  // Bind the ORIGINAL live C135 instance to the real Host continuity adapter;
  // a CI fixture observed=true is not native ChatGPT message authentication.
  const managed=bindManagedOneShellEdu({selection,sourceHead:head,
   originalSession:session,readMain:async()=>git('rev-parse','HEAD')});
  const deniedNoHuman=await managed.routeHumanTurn({frame:{humanInput:'unobserved test',
   nonce:'no-human'},humanMessageObserved:false});
  assert.equal(deniedNoHuman.edge,'CURRENT_HUMAN_INPUT_REQUIRED');
  assert.equal(session.readSessionState().original_c87_readback.count,0);
  const firstRoute=await managed.routeHumanTurn({frame:{
   humanInput:'Spiega come verificare una fonte.',
   nonce:'complete-chain-171-nonce-0001',
   priorMessages:[],resetContext:true},humanMessageObserved:true});
  assert.equal(firstRoute.ok,true,JSON.stringify(firstRoute));
  const current=firstRoute.frame;
  assert.equal(current.voice_origin,'HOST_BOUND_LOCAL',JSON.stringify(current));
  assert.match(current.slots.A,/Risposta EDU locale verificata/);
  assert.deepEqual(current.slot_order,['ESITO','A','B','PROVA','EDGE','NEXT']);
  assert(renderOneShell(current).includes(current.slots.A));
  const evidence=session.getLastEvidence();
  assert.equal(evidence.original_c87_readback.count,1);
  assert.equal(evidence.native_delivery_attested,false);
  assert.equal(SHA(evidence.original_c125_utf8),evidence.original_c125_sha256);
  const visual=emitVerifiedHostOneShell(current,{format:'HTML'});
  assert.equal(visual.ok,true,JSON.stringify(visual));
  const logo=fs.readFileSync(path.join(source,'assets/brand/ikant-light.svg'),'utf8');
  assert.equal(visual.brand_sha256,SHA(Buffer.from(logo)));
  assert(visual.html.indexOf('class="ikant-brand-mark"')>=0);
  assert(visual.html.indexOf('class="ikant-brand-mark"')<visual.html.indexOf('<strong>iKant · OneShell</strong>'));
  assert.equal((visual.html.match(/data-slot=/g)||[]).length,6);
  assert.equal(visual.native_delivery_attested,false);
  for(let n=2;n<=3;n++){
   const result=await managed.routeHumanTurn({frame:{humanInput:'Turno EDU distinto '+n,
     nonce:'complete-chain-171-nonce-000'+n,priorMessages:[],resetContext:true},
     humanMessageObserved:true});
   assert.equal(result.ok,true,JSON.stringify(result));
   const next=result.frame;
   assert.equal(next.voice_origin,'HOST_BOUND_LOCAL',JSON.stringify(next));
   assert.equal(session.readSessionState().original_c87_readback.count,n);
  }
  const replay=await managed.routeHumanTurn({frame:{humanInput:'ripeti',
    nonce:'complete-chain-171-nonce-0001',priorMessages:[],resetContext:true},
    humanMessageObserved:true});
  assert.equal(replay.frame.slots.A,'NO_VOICE');
  assert.equal(managed.native_delivery_attested,false);
  assert.equal(session.readSessionState().original_c87_readback.count,3);
  console.log('PR171_ORIGINAL_EDU_CHAIN_LOCAL_PASS',JSON.stringify({
   source_head:head,source_tree:tree,manifest_members:extracted.files.length,
   c72_original_receipts_verified:true,host_adapter_auto_packet_executed:true,edu_original_selection_verified:true,
   manual_full_repo_archive_node_materialized:true,c135_original_owner_started:true,
   original_c87_readback_count:3,c125_sha256:evidence.original_c125_sha256,
   logo_sha256:visual.brand_sha256,logo_rendered_before_title:true,
   native_provider_ingress_attested:false,native_delivery_attested:false,product_go:false
  }));
 }finally{session?.close();fs.rmSync(tmp,{recursive:true,force:true})}
});
