import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {issueC72V2LinkedTermsOffer,acceptC72V2LinkedTerms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {oneShellFrame,renderOneShell,planOneShellEduSource,startOneShellEdu} from '../host/project-oneshell-edu.mjs';
const h='a'.repeat(40),digest=createHash('sha256').update('terms').digest('hex');
const o=issueC72V2LinkedTermsOffer({sourceHead:h,termsDigest:digest});
const a=acceptC72V2LinkedTerms({offer:o,humanMessage:'I ACCEPT',termsLinkPresented:true});
const orientation=presentC72V2Introduction(a);
const edu=selectC72V2Mode({accepted:a,orientation,humanMessage:'EDU'});
const canonical=selectC72V2Mode({accepted:a,orientation,humanMessage:'CANONICAL'});
test('OneShell has exactly six slots and no caller-supplied voice',()=>{
 const x=oneShellFrame({esito:'TEST',b:'HOST only',s03:{ok:true,original_voice_utf8:'spoof'}});
 assert.equal(x.slots.A,'NO_VOICE');
 assert.deepEqual(x.slot_order,['ESITO','A','B','PROVA','EDGE','NEXT']);
 assert.match(renderOneShell(x),/^ESITO \| TEST/m);
 assert.throws(()=>renderOneShell({...x,voice_origin:'HOST_BOUND_LOCAL'}));
 assert.throws(()=>renderOneShell({...x,voice_origin:'PROVIDER_VERIFIED',
   original_voice_sha256:createHash('sha256').update('fake').digest('hex'),
   slots:{...x.slots,A:'fake'}}));
 assert.throws(()=>renderOneShell({...x,voice_origin:'UNKNOWN',
   slots:{...x.slots,A:'fake'}}));
 assert.throws(()=>renderOneShell({...x,active:true}));
 assert.throws(()=>renderOneShell({...x,native_ui_attested:true}));
 assert.throws(()=>renderOneShell({...x,provider_delivery_attested:true}));
});
test('OneShell routes only EDU/v2 post-mode to original P1 handoff',()=>{
 const args={selection:edu,sourceState:'SOURCE_ABSENT',bridgeState:'DEFINITIVELY_UNAVAILABLE',nodeReady:true,manualExtractorReady:true};
 const f=planOneShellEduSource(args);
 assert.equal(f.slots.NEXT,'UPLOAD_PINNED_SOURCE_ZIP');
 assert.match(f.slots.PROVA,new RegExp(h));
 assert.equal(planOneShellEduSource({...args,selection:canonical}).slots.NEXT,'STOP');
 assert.equal(planOneShellEduSource({...args,selection:null}).slots.NEXT,'STOP');
 assert.equal(planOneShellEduSource({...args,sourceState:'SOURCE_UNKNOWN'}).slots.NEXT,'VERIFY_SOURCE');
 assert.equal(planOneShellEduSource({...args,bridgeState:'UNKNOWN'}).slots.NEXT,'VERIFY_MACHINE_BRIDGE');
 assert.equal(planOneShellEduSource({...args,bridgeState:'AVAILABLE'}).slots.NEXT,'API_TREE_SOURCE_MATERIALIZATION');
 assert.equal(planOneShellEduSource({...args,sourceState:'FULL_SOURCE_VERIFIED'}).slots.NEXT,'START_C135_EDU');
 assert.equal(planOneShellEduSource({...args,nodeReady:false}).slots.NEXT,'STOP');
 assert.equal(planOneShellEduSource({...args,manualExtractorReady:false}).slots.NEXT,'STOP');
});
test('cannot start EDU without original owner selection or callable language port',async()=>{
 assert.equal((await startOneShellEdu({selection:canonical})).ok,false);
 assert.equal((await startOneShellEdu({selection:edu})).frame.slots.EDGE,'EDU_LANGUAGE_PORT_NOT_CALLABLE');
});

test('immutable five-document orientation evidence fits in OneShell without truncation',()=>{
 const head='a'.repeat(40);
 const paths=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
 const links=paths.map(p=>'https://github.com/Luke883i/iKant_LE/blob/'+head+'/'+p).join('\n');
 const f=oneShellFrame({esito:'ORIENTAMENTO',b:'Cinque documenti originali con source lock.',prova:links,edge:'C72_LINKED_TERMS',next:'AWAIT_I_ACCEPT'});
 assert.equal(f.slots.PROVA,links);
 assert.equal(renderOneShell(f).includes(links),true);
 assert.equal(f.slots.A,'NO_VOICE');
});
