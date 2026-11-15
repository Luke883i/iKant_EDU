import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {issueC72V2LinkedTermsOffer,acceptC72V2LinkedTerms,presentC72V2Introduction,
 selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {oneShellFrame} from '../host/project-oneshell-edu.mjs';
import {projectPostAcceptOneShell} from '../host/project-oneshell-postaccept-rail.mjs';
const head='a'.repeat(40),digest=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const original=()=>{
 const offer=issueC72V2LinkedTermsOffer({sourceHead:head,termsDigest:digest('fixture only')});
 const accepted=acceptC72V2LinkedTerms({offer,humanMessage:'I ACCEPT',termsLinkPresented:true});
 const introduction=presentC72V2Introduction(accepted);
 const selection=selectC72V2Mode({accepted,orientation:introduction,humanMessage:'EDU'});
 return {sourceHead:head,liveHead:head,accepted,introduction,selection};
};
test('one six-slot human shell from after I ACCEPT, no false voice',()=>{
 const c=original(),a=projectPostAcceptOneShell({...c,phase:'ACCEPTED'});
 const b=projectPostAcceptOneShell({...c,phase:'EDU_SELECTED'});
 assert.equal(a.ok,true);assert.equal(b.ok,true);
 assert.equal(a.host_session_anchor_sha256,b.host_session_anchor_sha256);
 assert.equal(a.frame.slots.A,'NO_VOICE');assert.equal(b.frame.slots.A,'NO_VOICE');
 assert.equal(a.frame.slots.B,c.introduction.text);
 for(const x of [a,b]){
  assert.equal(x.render_format,'TEXT');assert.equal(x.native_ui_attested,false);
  assert.equal(x.provider_persistence_attested,false);assert.equal(x.authority,0);
  for(const t of ['iKant (Superficie A)','Host (Superficie B)','PROVA','EDGE','NEXT'])
   assert(x.content.includes(t),t);
 }
});
test('host source handoff cannot turn into owner voice',()=>{
 const c=original(),hint=oneShellFrame({esito:'SERVONO I SORGENTI',b:'Allega lo ZIP del commit.',
  prova:'https://github.com/Luke883i/iKant_LE/archive/'+head+'.zip',
  edge:'EDU_MANUAL_SOURCE_REQUIRED',next:'UPLOAD_PINNED_SOURCE_ZIP'});
 assert.equal(projectPostAcceptOneShell({...c,phase:'SOURCE_HANDOFF',sourceFrame:hint}).ok,true);
 assert.equal(projectPostAcceptOneShell({...c,phase:'SOURCE_HANDOFF',sourceFrame:oneShellFrame({
  esito:'INVENTATO',b:'Non verificato',next:'WAIT_NEXT_HUMAN_INPUT'})}).ok,false);
});
test('serialized or forged C135 owner evidence cannot mint A',()=>{
 const c=original(),frame=oneShellFrame({esito:'RISPOSTA EDU VERIFICATA',b:'Non attestata'});
 const x=projectPostAcceptOneShell({...c,phase:'OWNER_TURN',ownerFrame:frame,
 ownerSession:{ok:true,runtime_ready:true,status:()=>({closed:false,uncertain:false}),readSessionState:()=>({
  owner:'C135_EDU_V2',source_head:head,source_tree:head,selection_receipt_sha256:c.selection.receipt_sha256,
  original_c87_readback:{status:'C107_LEDGER_REOPENED',count:1}})}});
 assert.equal(x.ok,false);assert.equal(x.frame.slots.A,'NO_VOICE');assert.equal(x.authority,0);
});
test('main drift, missing original C72 and nonexistent C135 stop',()=>{
 const c=original();
 assert.equal(projectPostAcceptOneShell({...c,liveHead:'b'.repeat(40),phase:'ACCEPTED'}).edge,'STOP_SOURCE_LOCK_STALE');
 assert.equal(projectPostAcceptOneShell({...c,selection:null,phase:'EDU_SELECTED'}).ok,false);
 assert.equal(projectPostAcceptOneShell({...c,phase:'EDU_READY'}).ok,false);
});

test('original SVG lives in one verified Host HTML shell; never a native widget claim',()=>{
 const c=original(),rich=projectPostAcceptOneShell({...c,phase:'ACCEPTED',format:'HTML'});
 assert.equal(rich.ok,true,JSON.stringify(rich));
 assert.equal(rich.render_format,'HTML');
 assert.equal((rich.content.match(/class="ikant-brand-mark"/g)||[]).length,1);
 assert.equal((rich.content.match(/data-slot=/g)||[]).length,6);
 assert.equal((rich.content.match(/class="ikant-divider"/g)||[]).length,2);
 assert.equal(rich.content.includes('<button'),false);
 assert.equal(rich.native_ui_attested,false);
 assert.equal(rich.provider_persistence_attested,false);
});


test('STOP before source readback preserves six-slot NO_VOICE rather than inventing a missing source edge',()=>{
 const c=original(),r=projectPostAcceptOneShell({...c,phase:'STOP'});
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.frame.slots.A,'NO_VOICE');
 assert.equal(r.frame.slots.EDGE,'RAIL_EXTERNAL_STOP_OBSERVED');
 assert.equal(r.frame.slots.NEXT,'STOP');
 assert.equal(r.native_ui_attested,false);
});
