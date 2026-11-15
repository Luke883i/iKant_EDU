import assert from 'node:assert/strict';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode,validateC72ModeSelection} from '../host/c72-unified-mode-admission.mjs';
const o=issueC72TermsOffer({sourceHead:'a'.repeat(40),termsDigest:'b'.repeat(64)});
const consents=['I ACCEPT','I ACCEPT ','I ACCEPT EXPERIMENTAL','accept','CANONICAL','EXPERIMENTAL','I ACCEPT\n',' I ACCEPT','I ACCEPT!',''];
const modes=['CANONICAL','EXPERIMENTAL','canonical','experimental','I ACCEPT EXPERIMENTAL','I ACCEPT','','ACTIVE','CANONICAL ','EXPERIMENTAL '];
let total=0,accepted=0,mismatches=0,unsafe=0;
for(let n=0;n<1000000;n++){
 const a=n%10,b=Math.floor(n/10)%10,c=Math.floor(n/100)%10,d=Math.floor(n/1000)%10,e=Math.floor(n/10000)%10,f=Math.floor(n/100000)%10;
 const offer=d===0?o:{...o,source_head:String(d).repeat(40)};
 const termsPresented=c===0;
 const reply=acceptC72Terms({offer,humanMessage:consents[a],termsPresented});
 let valid=false,status='REJECTED';
 if(reply.schema==='ikant-le-c72-accepted/v1'){
  const intro=presentC72Introduction(reply);
  const selected=selectC72Mode({accepted:reply,orientation:e===0?intro:{...intro,text:intro.text+'!'},humanMessage:modes[b]});
  const examined=f===0?selected:{...selected,active:true};
  valid=validateC72ModeSelection(examined);
  status=selected.status;
  if(selected.active===true||selected.owner_receipt_issued===true)unsafe++;
 }
 const expected=a===0&&(b===0||b===1)&&c===0&&d===0&&e===0&&f===0;
 if(valid!==expected)mismatches++;
 if(valid)accepted++;
 total++;
}
assert.equal(total,1000000);
assert.equal(mismatches,0);
assert.equal(accepted,2);
assert.equal(unsafe,0);
process.stdout.write(JSON.stringify({schema:'ikant-le-c72-exhaustive-lattice/v1',semantic_vectors:total,axes:6,accepted,blocked:total-accepted,oracle_mismatches:mismatches,unsafe_active:unsafe,external_host_proven:false,user_value_95pct_proven:false})+'\n');
