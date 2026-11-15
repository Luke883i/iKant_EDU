import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {issueC72TermsOffer,validateC72Offer,acceptC72Terms,validateC72Accepted,
 presentC72Introduction,validateC72Orientation,selectC72Mode,validateC72ModeSelection,
 evaluateC72Introductions,c72AdmissionContract} from '../host/c72-unified-mode-admission.mjs';
import {issueC69ExperimentalOffer,qualifyC69ExperimentalPreview} from '../host/c69-capability-first-preview.mjs';
import {runC70ExperimentalComputePreview} from '../src/c70-experimental-compute-preview.mjs';
import {routeC71HostDraft} from '../src/c71-experimental-host-draft.mjs';

const sourceHead='a'.repeat(40),termsDigest='b'.repeat(64);
const bytes=fs.readFileSync(new URL('../README.md',import.meta.url));
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const setup=()=>{
 const offer=issueC72TermsOffer({sourceHead,termsDigest});
 const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 const orientation=presentC72Introduction(accepted);
 return {offer,accepted,orientation};
};
test('C72 single common gate remains mode pending, not ACTIVE',()=>{
 const {offer,accepted,orientation}=setup();
 assert.equal(validateC72Offer(offer),true);
 assert.equal(validateC72Accepted(accepted),true);
 assert.equal(validateC72Orientation(orientation,accepted),true);
 assert.equal(accepted.selection_pending,true);
 assert.equal(accepted.native_event_attested,false);
 assert.equal(accepted.active,false);
 assert.equal(orientation.mode_options.join(','),'CANONICAL,EXPERIMENTAL');
 for(const message of ['I ACCEPT ',' I ACCEPT','i accept','I ACCEPT EXPERIMENTAL','CANONICAL','EXPERIMENTAL','I ACCEPT\n']){
  const denied=acceptC72Terms({offer,humanMessage:message,termsPresented:true});
  assert.equal(denied.active,false);assert.equal(denied.status,'INVALID_ACCEPTANCE');
 }
});
test('C72 100 distinct orientation candidates deterministically produce complete standard explanation',()=>{
 const score=evaluateC72Introductions();
 assert.equal(score.evaluated,100);
 assert.equal(score.unique,100);
 assert.equal(score.selected.mandatory,true);
 assert.ok(score.selected.words>=90&&score.selected.words<=200);
 assert.equal(score.scores_are_empirical,false);
 const x=setup().orientation;
 assert.equal(x.text,score.selected.text);
 assert.ok(x.text.includes('CANONICAL')&&x.text.includes('EXPERIMENTAL'));
 assert.equal(x.default_recommendation,'EXPERIMENTAL');
});
test('C72 explicit mode selection has no second consent, no native or runtime state authority',()=>{
 const {accepted,orientation}=setup();
 const experiment=selectC72Mode({accepted,orientation,humanMessage:'EXPERIMENTAL'});
 const canonical=selectC72Mode({accepted,orientation,humanMessage:'CANONICAL'});
 assert.equal(validateC72ModeSelection(experiment,{mode:'EXPERIMENTAL',sourceHead}),true);
 assert.equal(validateC72ModeSelection(canonical,{mode:'CANONICAL',sourceHead}),true);
 assert.equal(experiment.status,'EXPERIMENTAL_SELECTED_NOT_RUNNING');
 assert.equal(canonical.status,'CANONICAL_REQUESTED_NOT_ACTIVE');
 assert.equal(canonical.first_unclosed_edge,'HOST_MESSAGE_INGRESS');
 for(const x of [canonical,experiment]){
  assert.equal(x.additional_consent_required,false);
  assert.equal(x.common_human_gate,'I ACCEPT');
  assert.equal(x.active,false);assert.equal(x.native_event_attested,false);
  assert.equal(x.owner_receipt_issued,false);
 }
 for(const wrong of ['', 'i accept experimental','I ACCEPT EXPERIMENTAL','active','canonical','EXPERIMENTAL '])
  assert.equal(selectC72Mode({accepted,orientation,humanMessage:wrong}).status,'INVALID_SELECTION');
});
test('C72 common I ACCEPT + EXPERIMENTAL selection traverses C69, real C70 and C71',()=>{
 const {accepted,orientation}=setup();
 const unifiedSelection=selectC72Mode({accepted,orientation,humanMessage:'EXPERIMENTAL'});
 const x={sourceHead,offer:issueC69ExperimentalOffer({sourceHead}),
  unifiedSelection,sourceObject:{path:'README.md',blob_sha1:gitBlob(bytes),content_base64:bytes.toString('base64')},
  messages:['Analizza le alternative realistiche e i relativi limiti.']};
 const c69=qualifyC69ExperimentalPreview(x);
 assert.equal(c69.status,'EXPERIMENTAL_SOURCE_PREVIEW');
 assert.equal(c69.consent_basis,'C72_COMMON_I_ACCEPT_WITH_EXPLICIT_MODE_SELECTION');
 const c70=runC70ExperimentalComputePreview(x);
 assert.equal(c70.status,'EXPERIMENTAL_COMPUTE_PREVIEW');
 assert.equal(c70.executed_repository_kernel,true);
 assert.equal(c70.active,false);
 const c71=routeC71HostDraft(x);
 assert.equal(c71.status,'EXPERIMENTAL_HOST_DRAFT');
 assert.equal(c71.routed_turns.length,1);
 assert.equal(c71.active,false);
});
test('C72 integrity mismatches and attempted retroactive canonical promotion fail closed',()=>{
 const {offer,accepted,orientation}=setup();
 assert.equal(acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:false}).status,'INVALID_PRESENTATION');
 assert.equal(acceptC72Terms({offer:{...offer,source_head:'c'.repeat(40)},humanMessage:'I ACCEPT',termsPresented:true}).status,'INVALID_OFFER');
 assert.equal(selectC72Mode({accepted,orientation:{...orientation,text:orientation.text+' altered'},humanMessage:'EXPERIMENTAL'}).status,'INVALID_BOUNDARY');
 assert.equal(validateC72ModeSelection({...selectC72Mode({accepted,orientation,humanMessage:'CANONICAL'}),active:true}),false);
 assert.equal(c72AdmissionContract().proof_boundary.replay_resistance,false);
});
