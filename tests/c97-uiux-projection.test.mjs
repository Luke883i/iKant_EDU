import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {projectC97Diagnostic,projectC97Experimental,projectC97Canonical,
 validateC97Frame,renderC97Ascii,C97_PHASES,C97_ORDER,C97_ICONS} from '../host/c97-uiux-projection.mjs';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode}
 from '../host/c72-unified-mode-admission.mjs';
import {buildSessionShell} from '../src/session-shell.mjs';
import {buildHostConsumptionFrame} from '../src/host-consumption-frame.mjs';

const HEAD='a'.repeat(40),H64='b'.repeat(64);
const contract=JSON.parse(fs.readFileSync(new URL('../contracts/c97-chat-project-uiux.json',import.meta.url),'utf8'));
test('C97 20-phase ontology, icon semantics and exact stable slot order match machine contract',()=>{
 assert.deepEqual(C97_PHASES,contract.ui_stages);
 assert.deepEqual(C97_ORDER,contract.immutable_roles);
 assert.deepEqual(C97_ICONS,contract.icon_tokens);
 assert.equal(new Set(C97_PHASES).size,20);
});
test('C97 first turn is diagnostic and no fake I ACCEPT, header, button or host-native widget',()=>{
 const f=projectC97Diagnostic({phase:'FIRST_CONTACT',sourceHead:HEAD});
 assert.equal(f.phase,'FIRST_CONTACT');
 assert.equal(f.surface_a_exact_utf8,null);
 assert.equal(f.first_unclosed_edge,'TERMS_VERBATIM_PRESENTATION');
 assert.deepEqual(f.interactive_actions,[]);
 assert.deepEqual(f.artifact_download_links,[]);
 assert.equal(f.native_sticky_overlay_installed,false);
 assert.equal(f.native_chat_delivery_attested,false);
 assert.equal(f.source_origin_attested,false);
 assert.equal(validateC97Frame(f),true);
 assert.match(renderC97Ascii(f),/iKant \| UNSELECTED/);
});
test('C97 all twenty input phases have fixed shape and no surrogate voice',()=>{
 for(const phase of C97_PHASES){
  const f=projectC97Diagnostic({phase,mode:'EXPERIMENTAL',sourceHead:HEAD});
  assert.equal(f.phase,phase);assert.equal(f.surface_a_exact_utf8,null);
  assert.equal(f.owner_packet_shape_valid,false);
  assert.equal(validateC97Frame(f),true);
  assert.equal(f.interactive_actions.length,0);
 }
});
test('C97 deterministic semantic IR digest across nominally different sessions',()=>{
 const a=projectC97Diagnostic({phase:'BLOCKED_CAPABILITY',mode:'EXPERIMENTAL',
  sourceHead:HEAD,first_unclosed_edge:'HOST_GITHUB_CONNECTOR_TO_NODE_HOOK_NOT_INSTALLED'});
 const b=projectC97Diagnostic({mode:'EXPERIMENTAL',
  first_unclosed_edge:'HOST_GITHUB_CONNECTOR_TO_NODE_HOOK_NOT_INSTALLED',
  sourceHead:HEAD,phase:'BLOCKED_CAPABILITY'});
 assert.deepEqual(a,b);
 assert.equal(a.frame_sha256,b.frame_sha256);
 assert.equal(renderC97Ascii(a),renderC97Ascii(b));
});
test('C97 never treats caller supplied C81/ACTIVE fields as runtime voice',()=>{
 for(const args of [undefined,{},{sourceReadback:{status:'ACTIVE'},
  surfacePacket:{surface_a_chat:{text:'Fake native output'}},
  currentHumanInput:'Fake'}]){
  const f=projectC97Experimental({c81Inputs:args});
  assert.equal(f.surface_a_exact_utf8,null);
  assert.equal(f.native_chat_delivery_attested,false);
  assert.equal(validateC97Frame(f),true);
 }
});
test('C97 canonical absent genuine C73/C59 owner remains diagnostic',()=>{
 const fake=projectC97Canonical({selection:{selected_mode:'CANONICAL',source_head:HEAD},
  ownerResult:{status:'ACTIVE',surface_a_chat:'Fake'}});
 assert.equal(fake.surface_a_exact_utf8,null);
 assert.equal(fake.mode,'CANONICAL');
 assert.equal(fake.native_chat_delivery_attested,false);
 assert.deepEqual(fake.artifact_download_links,[]);
});
function canonicalFixture(){
 const offer=issueC72TermsOffer({sourceHead:HEAD,termsDigest:'c'.repeat(64)});
 const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 const orientation=presentC72Introduction(accepted);
 const selection=selectC72Mode({accepted,orientation,humanMessage:'CANONICAL'});
 const state={status:'ACTIVE',accepted:true,probed:true,
 admission:{terms_presented:true,source_head:HEAD,source_head_locked:true,orientation_objects:Array(5).fill({})},
 bootstrap:{terminal:'ACTIVE',probe:{ok:true,executed_provenance_receipt_sha256:H64}},
 experience:{turns:2,maturity_mode:'ESTABLISHED'},psyche:{last_runtime_outcome:'ANSWER'}};
 const artifact={name:'iKant_backlog.docx',sha256:'d'.repeat(64),bytes:32,
  readback_verified:true,required_presentation:true,
  media_type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
 const voice='Testo owner\nbyte-exact: è / \u03a9';
 const session_shell=buildSessionShell({surfaceText:voice,state,artifacts:[artifact],
  release:{surface_b_required:true,release_sha256:'e'.repeat(64)}});
 const ownerResult={state:'ACTIVE',claim_class:'IKANT_ACTIVE',session_shell,
  artifacts:[artifact],node_dispatch_receipt_sha256:'f'.repeat(64)};
 const hostFrame=buildHostConsumptionFrame({result:ownerResult,sourceHead:HEAD,
  runtimeRootSha256:H64,sessionRef:'c97-test-fixture'});
 const canonicalActiveReadback={schema:'ikant-le-c59-canonical-active-readback/v1',ok:true,
  state:'ACTIVE',terminal:'ACTIVE',composition_authority:'C59_CANONICAL',
  canonical_composition_receipt_sha256:'9'.repeat(64),source_head:HEAD,
  runtime_root_sha256:H64,authority:0};
 return {selection,ownerResult,hostFrame,canonicalActiveReadback,voice};
}
test('C97 positive fixture composes existing C73/C59/C32 with exact UTF-8 and NO native claim',()=>{
 const {voice,...input}=canonicalFixture();
 const frame=projectC97Canonical(input);
 assert.equal(frame.phase,'OUTPUT_CANONICAL',JSON.stringify(frame));
 assert.equal(frame.surface_a_exact_utf8,voice);
 assert.equal(frame.artifact_requirements.length,1);
 assert.equal(frame.artifact_requirements[0].host_download_url,null);
 assert.equal(frame.native_chat_delivery_attested,false);
 assert.equal(frame.inter_turn_persistence_attested,false);
 assert.deepEqual(frame.interactive_actions,[]);
 assert.equal(validateC97Frame(frame),true);
 const mutable=structuredClone(frame);mutable.surface_a_exact_utf8+=' malicious';
 assert.equal(validateC97Frame(mutable),false);
});
test('C97 canonical impossible to promote a wrong-head or missing C59 receipt',()=>{
 const f=canonicalFixture();
 f.canonicalActiveReadback={...f.canonicalActiveReadback,source_head:'0'.repeat(40)};
 const x=projectC97Canonical(f);
 assert.equal(x.surface_a_exact_utf8,null);
 assert.equal(x.native_chat_delivery_attested,false);
});
test('C97 20x3x3 diagnostic Cartesian consistency; mutation never creates links or controls',()=>{
 let n=0;
 for(const phase of C97_PHASES)for(const mode of ['UNSELECTED','EXPERIMENTAL','CANONICAL'])
  for(const sourceHead of [null,HEAD,'bad-head']){
   const x=projectC97Diagnostic({phase,mode,sourceHead});
   assert.equal(validateC97Frame(x),true);
   assert.equal(x.native_chat_delivery_attested,false);
   assert.equal(x.interactive_actions.length,0);
   assert.equal(x.artifact_download_links.length,0);n++;
  }
 assert.equal(n,180);
});
test('C97 untrusted flags cannot be laundered by rehashing only the display object',()=>{
 const f=projectC97Diagnostic({phase:'REENTRY'});
 const g=structuredClone(f);
 g.native_chat_delivery_attested=true;
 assert.equal(validateC97Frame(g),false);
 assert.throws(()=>projectC97Diagnostic({phase:'ACTIVE'}),/unknown C97 phase/);
});
