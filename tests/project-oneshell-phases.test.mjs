import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {issueC72V2LinkedTermsOffer,acceptC72V2LinkedTerms,
 presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {oneShellOrientation,oneShellAccepted,oneShellSelected,oneShellMaterialized,
 ONE_SHELL_PHASES,createOneShellAdmissionFlow} from '../host/project-oneshell-phases.mjs';
const head='a'.repeat(40),tree='b'.repeat(40),terms=createHash('sha256').update('verified terms').digest('hex');
const offer=issueC72V2LinkedTermsOffer({sourceHead:head,termsDigest:terms});
const accepted=acceptC72V2LinkedTerms({offer,humanMessage:'I ACCEPT',termsLinkPresented:true});
const orientation=presentC72V2Introduction(accepted);
const edu=selectC72V2Mode({accepted,orientation,humanMessage:'EDU'});
const canonical=selectC72V2Mode({accepted,orientation,humanMessage:'CANONICAL'});
test('all eight semantic phases have owner scope and six stable OneShell slots',()=>{
 assert.equal(ONE_SHELL_PHASES.length,8);
 const p=oneShellOrientation({head,offer});
 assert.equal(p.slots.NEXT,'AWAIT_I_ACCEPT');assert.equal(p.slots.A,'NO_VOICE');
 assert.equal(p.slots.PROVA.split('\n').length,5);
 assert(p.slots.PROVA.includes('/'+head+'/TERMS.md'));
 assert.equal(oneShellOrientation({head:'f'.repeat(40),offer}).slots.NEXT,'STOP');
 assert.equal(oneShellOrientation({head,offer:{...offer,terms_read_attested:true}}).slots.NEXT,'STOP');
 const a=oneShellAccepted({accepted,orientation});
 assert.equal(a.slots.B,orientation.text);assert.equal(a.slots.NEXT,'AWAIT_EDU');
 assert.equal(oneShellAccepted({accepted:{...accepted,receipt_sha256:'f'.repeat(64)},orientation}).slots.NEXT,'STOP');
 const e=oneShellSelected({selection:edu,accepted,orientation});
 assert.equal(e.slots.NEXT,'VERIFY_SOURCE');
 const c=oneShellSelected({selection:canonical,accepted,orientation});
 assert.equal(c.slots.NEXT,'STOP');assert.equal(c.slots.A,'NO_VOICE');
 assert.equal(oneShellSelected({selection:{...edu,selected_mode:'CANONICAL'},accepted,orientation}).slots.NEXT,'STOP');
 const missing=oneShellMaterialized({selection:edu,sourceRoot:'/not/a/materialized/source',head,tree});
 assert.equal(missing.slots.NEXT,'STOP');
});

test('exact separate human messages drive only original C72 v2 receipts inside OneShell',()=>{
 const flow=createOneShellAdmissionFlow({head,termsUtf8:'verified terms'});
 assert.equal(flow.persistent,false);assert.equal(flow.selection(),null);
 assert.equal(flow.advance({humanMessage:'I ACCEPT',termsLinkPresented:true}).slots.NEXT,'AWAIT_I_ACCEPT');
 assert.equal(flow.phase(),'WAIT_ACCEPT');
 assert.equal(flow.advance({humanMessage:'EDU'}).slots.NEXT,'STOP');
 assert.equal(flow.phase(),'WAIT_ACCEPT');
 assert.equal(flow.advance({humanMessage:'I ACCEPT'}).slots.NEXT,'STOP');
 const introduction=flow.advance({humanMessage:'I ACCEPT',termsLinkPresented:true});
 assert.equal(introduction.slots.NEXT,'AWAIT_EDU');
 assert.equal(flow.advance({humanMessage:'I ACCEPT'}).slots.NEXT,'STOP');
 assert.equal(flow.advance({humanMessage:'EDU'}).slots.NEXT,'VERIFY_SOURCE');
 assert.equal(flow.selection().selected_mode,'EDU');
 assert.equal(flow.advance({humanMessage:'EDU'}).slots.NEXT,'STOP');
 assert.equal(flow.phase(),'MODE_SELECTED');
 const other=createOneShellAdmissionFlow({head,termsUtf8:'verified terms'});
 other.advance({humanMessage:'avvia iKant'});
 other.advance({humanMessage:'I ACCEPT',termsLinkPresented:true});
 assert.equal(other.advance({humanMessage:'CANONICAL'}).slots.NEXT,'STOP');
 assert.equal(other.selection(),null);
});

test('any first human utterance triggers ONLY orientation, not consent or a runtime turn',()=>{
 for(const text of ['ciao','blblblba','avvia iKant','I ACCEPT','EDU','CANONICAL',
  'non avviare iKant','','🚀','x'.repeat(20000),'I ACCEPT EDU']){
  const flow=createOneShellAdmissionFlow({head,termsUtf8:'verified terms'});
  const first=flow.advance({humanMessage:text,termsLinkPresented:true});
  assert.equal(first.slots.NEXT,'AWAIT_I_ACCEPT',text.slice(0,20));
  assert.equal(first.slots.A,'NO_VOICE');
  assert.equal(flow.selection(),null);
  assert.equal(flow.phase(),'WAIT_ACCEPT');
  assert.equal(flow.advance({humanMessage:'EDU'}).slots.NEXT,'STOP');
  assert.equal(flow.advance({humanMessage:'I ACCEPT',termsLinkPresented:true}).slots.NEXT,'AWAIT_EDU');
  assert.equal(flow.advance({humanMessage:'EDU'}).slots.NEXT,'VERIFY_SOURCE');
 }
 const flow=createOneShellAdmissionFlow({head,termsUtf8:'verified terms'});
 assert.equal(flow.advance({humanMessage:null}).slots.NEXT,'STOP');
 assert.equal(flow.phase(),'WAIT_TRIGGER');
});

test('legacy mode is no longer selectable in prospective EDU but old Git receipts remain historical',()=>{
 assert.equal(canonical.status,'INVALID_MODE_SELECTION');
 const result=oneShellSelected({selection:canonical,accepted,orientation});
 assert.equal(result.slots.EDGE,'C72_ORIGINAL_MODE_RECEIPT_REQUIRED');
 assert.equal(result.slots.NEXT,'STOP');
 assert.equal(result.slots.A,'NO_VOICE');
 assert.equal(oneShellSelected({selection:edu,accepted,orientation}).slots.NEXT,'VERIFY_SOURCE');
});

test('cold orientation uses HEAD + original Terms only; a TREE is neither required nor inspected',()=>{
 const noTree={head,offer};
 const p=oneShellOrientation(noTree);
 assert.equal(p.slots.NEXT,'AWAIT_I_ACCEPT');
 assert.equal(p.slots.PROVA.includes('/'+head+'/TERMS.md'),true);
 assert.equal(p.slots.PROVA.includes(tree),false);
 const trap={head,offer,get tree(){throw Error('FORBIDDEN_PREACCEPT_TREE_READ');}};
 assert.equal(oneShellOrientation(trap).slots.NEXT,'AWAIT_I_ACCEPT');
 const gateTrap={head,termsUtf8:'verified terms',get tree(){throw Error('FORBIDDEN_PREACCEPT_TREE_READ');}};
 const flow=createOneShellAdmissionFlow(gateTrap);
 assert.equal(Object.hasOwn(flow,'source_tree'),false);
 assert.equal(flow.advance({humanMessage:'I ACCEPT'}).slots.NEXT,'AWAIT_I_ACCEPT');
 assert.equal(flow.phase(),'WAIT_ACCEPT');
 const acceptedFrame=flow.advance({humanMessage:'I ACCEPT',termsLinkPresented:true});
 assert.equal(acceptedFrame.slots.NEXT,'AWAIT_EDU');
 assert.equal(flow.advance({humanMessage:'EDU'}).slots.NEXT,'VERIFY_SOURCE');
});
