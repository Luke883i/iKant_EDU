import test from 'node:test';import assert from 'node:assert/strict';
import {issueC72V2LinkedTermsOffer,acceptC72V2LinkedTerms,acceptC72V2Terms,validateC72V2Accepted,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
test('original C72 linked terms preserves three stages without claiming body presentation or reading',()=>{
 const offer=issueC72V2LinkedTermsOffer({sourceHead:'a'.repeat(40),termsDigest:'b'.repeat(64)});
 assert.equal(acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true}).active,false);
 const a=acceptC72V2LinkedTerms({offer,humanMessage:'I ACCEPT',termsLinkPresented:true});
 assert(validateC72V2Accepted(a));assert.equal(a.terms_presented_host_claim,false);assert.equal(a.terms_read_attested,false);
 assert.equal(a.selected_mode,null);const orientation=presentC72V2Introduction(a);assert.equal(orientation.active,false);
 const s=selectC72V2Mode({accepted:a,orientation,humanMessage:'EDU'});assert.equal(s.selected_mode,'EDU');assert.equal(s.active,false);
 for(const humanMessage of ['I ACCEPT EDU','i accept','EDU',' I ACCEPT'])assert.equal(validateC72V2Accepted(acceptC72V2LinkedTerms({offer,humanMessage,termsLinkPresented:true})),false);
 assert.equal(validateC72V2Accepted(acceptC72V2LinkedTerms({offer,humanMessage:'I ACCEPT',termsLinkPresented:false})),false);
});
