import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {buildC77Capsule} from '../scripts/c77-build-capsule.mjs';
import {createC81LocalGitProof} from '../scripts/c81-create-git-proof.mjs';
import {C78HostRelay} from '../host/c78-host-relay.mjs';
import {prepareC79ChatSurface} from '../host/c79-native-chat-surface.mjs';
import {projectC81RuntimeTurn} from '../host/c81-runtime-projection.mjs';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';

const ROOT=new URL('../',import.meta.url);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim();
const input='Confronta due alternative e indica una prova osservabile.';
function fixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c81-projection-'));
 const capsule=path.join(dir,'capsule'),build=buildC77Capsule({outDir:capsule});
 const proof=createC81LocalGitProof({manifestPath:path.join(capsule,'c77-manifest.json')});
 const offer=issueC72TermsOffer({sourceHead:head,termsDigest:sha(fs.readFileSync(new URL('../TERMS.md',import.meta.url)))});
 const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 const selection=selectC72Mode({accepted,orientation:presentC72Introduction(accepted),humanMessage:'EXPERIMENTAL'});
 const manifest=fs.readFileSync(path.join(capsule,'c77-manifest.json'));
 const relay=new C78HostRelay({selection,sourceHead:head,
  expectedManifestSha256:build.bundle_manifest_sha256,manifestBase64:manifest.toString('base64')});
 for(const file of JSON.parse(manifest).files)
  relay.stageFile({filePath:file.path,contentBase64:fs.readFileSync(path.join(capsule,file.path)).toString('base64'),
   sourceBlobSha1:file.original_source_blob_sha1});
 relay.finalize();
 const r=relay.dispatch({humanInput:input});
 assert.equal(r.status,'C78_NODE_RESPONSE_READY_HOST_DELIVERY_PENDING',JSON.stringify(r));
 const packet=prepareC79ChatSurface({selection,sourceHead:head,
  expectedManifestSha256:build.bundle_manifest_sha256,currentHumanInput:input,relayReadback:r});
 assert.equal(packet.status,'C79_CHAT_PACKET_READY_NOT_DELIVERED');
 return {dir,relay,head,manifestSha:build.bundle_manifest_sha256,sourceReadback:proof.verification,
  surfacePacket:packet,input};
}
const cleanup=x=>{x.relay.close();fs.rmSync(x.dir,{recursive:true,force:true});};
const run=x=>projectC81RuntimeTurn(x);
test('C81 runtime-only projection follows a genuine C77->C78->C79 Node result and never attests display',()=>{
 const f=fixture();try{
  const p=run({...f,sourceHead:f.head,currentHumanInput:f.input});
  assert.equal(p.status,'C81_RUNTIME_SURFACE_A_READY_NOT_NATIVE_DELIVERED');
  assert.equal(p.runtime_computed_answer,f.surfacePacket.surface_a_chat.text);
  assert.equal(p.bound_input_sha256,sha(f.input));
  assert.equal(p.bound_output_sha256,sha(p.runtime_computed_answer));
  assert.equal(p.native_chat_delivery_attested,false);
  assert.equal(p.native_sticky_overlay_installed,false);
  assert.equal(p.voice_word_budget_applied,false);
  assert.equal(p.first_unclosed_edge,'HOST_PINNED_GITHUB_REF_ORIGIN');
  assert.equal(p.ui_placement,'PER_REPLY_TOP_NOT_STICKY_OVERLAY');
  const forged=structuredClone(f.surfacePacket);
  forged.surface_a_chat.voice_source='HOST_CANDIDATE_BOUNDED';
  const {packet_sha256,...copy}=forged;
  forged.packet_sha256=sha(JSON.stringify(copy));
  const rejection=run({...f,sourceHead:f.head,currentHumanInput:f.input,surfacePacket:forged});
  assert.equal(rejection.status,'C81_RUNTIME_NOT_EXECUTED_OR_UNVERIFIED');
  assert.equal(rejection.runtime_computed_answer,null);
  const invalid=run({...f,sourceHead:f.head,currentHumanInput:'a replayed later user message'});
  assert.equal(invalid.status,'C81_RUNTIME_NOT_EXECUTED_OR_UNVERIFIED');
  assert.equal(invalid.runtime_computed_answer,null);
 }finally{cleanup(f);}
});
test('C81 exact 100000 Cartesian UI/runtime/source/input/failure mutations select one safe projection policy',()=>{
 const f=fixture();
 let passed=0,denied=0,mutations=0,lastNovelty=-1;
 const classes=new Map();
 const cases=100000,ui=['PER_REPLY_TOP','STICKY_OVERLAY','MODAL','SIDEBAR','AVATAR','TOOLBAR','TOAST','CANVAS','FIXED_HEADER','CUSTOM_APP'],
 failure=['STOP_DIAGNOSTIC_ONLY','MODEL_ANSWER','SIMULATE_C79','CACHE_OLD_OUTPUT','IMPLICIT_ACTIVE','BEST_EFFORT','GENERATE_DOCX','MOCK_NODE','REUSE_OLD_EVENT','SILENT_FALLBACK'];
 const note=(status,edge,index)=>{const key=status+'|'+(edge||'NONE');if(!classes.has(key)){classes.set(key,0);lastNovelty=index;}classes.set(key,classes.get(key)+1);};
 try{
  for(let i=0;i<cases;i++){
   const v=(i*31337+54321)%cases;
   const digits=[Math.floor(v/10000),Math.floor(v/1000)%10,Math.floor(v/100)%10,Math.floor(v/10)%10,v%10];
   const [s,p,h,u,e]=digits;
   let readback=f.sourceReadback,packet=f.surfacePacket,human=f.input;
   if(s){readback={...readback};
    switch(s){
     case 1:readback.status='ACTIVE';break;
     case 2:readback.expected_source_head='0'.repeat(40);break;
     case 3:readback.manifest_sha256='0'.repeat(64);break;
     case 4:readback.origin_independently_attested=true;break;
     case 5:readback.active=true;break;
     case 6:readback.git_paths_reachable=false;break;
     case 7:readback.git_object_hashes_matched=false;break;
     case 8:readback.reachable_original_git_blobs=0;break;
     case 9:readback.first_unclosed_edge='NONE';break;
    }
   }
   if(p){packet=structuredClone(packet);
    switch(p){
     case 1:packet.status='ACTIVE';break;
     case 2:packet.active=true;break;
     case 3:packet.native_chat_delivery_attested=true;break;
     case 4:packet.child_process_executed=false;break;
     case 5:packet.bound_input_sha256='0'.repeat(64);break;
     case 6:packet.bound_output_sha256='0'.repeat(64);break;
     case 7:packet.surface_a_chat.text+=' MODEL WRITTEN';break;
     case 8:packet.source_head='0'.repeat(40);break;
     case 9:packet.surface_a_chat.voice_source='HOST_CANDIDATE_BOUNDED';break;
    }
    const {packet_sha256,...rest}=packet;
    packet.packet_sha256=sha(JSON.stringify(rest));
   }
   if(h){human=['', ' ',f.input+' replay','not the same input','ALT '+f.input,'è'.repeat(601),null,'I ACCEPT','CANONICAL','secret input'][h-1];}
   const r=run({sourceReadback:readback,surfacePacket:packet,sourceHead:f.head,
      manifestSha:f.manifestSha,currentHumanInput:human,uiMode:ui[u],failurePolicy:failure[e]});
   mutations++;
   note(r.status,r.first_unclosed_edge,i);
   const valid=s===0&&p===0&&h===0&&u===0&&e===0;
   if(valid){
    assert.equal(r.status,'C81_RUNTIME_SURFACE_A_READY_NOT_NATIVE_DELIVERED',JSON.stringify({i,v}));
    assert.equal(r.runtime_computed_answer,packet.surface_a_chat.text);
    passed++;
   }else{
    assert.equal(r.status,'C81_RUNTIME_NOT_EXECUTED_OR_UNVERIFIED',JSON.stringify({i,v,digits,r}));
    assert.equal(r.runtime_computed_answer,null);
    denied++;
   }
   assert.equal(r.active,false);
   assert.equal(r.native_chat_delivery_attested,false);
  }
  assert.equal(mutations,100000);
  assert.equal(passed,1);
  assert.equal(denied,99999);
  const report={schema:'ikant-le-c81-ui-cartesian-100k/v1',source_head:head,
   calls_to_real_runtime_projection:mutations,real_c78_node_dispatches_in_this_test:1,
   design_space:'10^5 distinct deterministic five-axis combinations',
   chosen:{source:0,packet:0,input:0,ui:0,fallback:0},
   allowed_combinations:passed,blocked_combinations:denied,unexpected_escalations:0,
   last_class_novelty_index_1based:lastNovelty+1,
   final_without_new_class:cases-lastNovelty-1,
   observed_status_edge_classes:Object.fromEntries([...classes].sort()),
   browser_sessions_attested:0,universally_optimal:false,
   host_native_sticky_overlay_supported_by_project_prompt:false};
  if(process.env.C81_UI_REPORT)fs.writeFileSync(process.env.C81_UI_REPORT,JSON.stringify(report,null,2)+'\n');
  console.log('C81_UI_MUTATIONS '+JSON.stringify({
   calls:mutations,allowed:passed,denied,classes:classes.size,
   last_new:report.last_class_novelty_index_1based,tail:report.final_without_new_class
  }));
 }finally{cleanup(f);}
});
