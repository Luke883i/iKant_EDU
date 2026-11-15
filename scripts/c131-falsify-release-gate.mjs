/** Fixed finite-domain policy exploration; NOT LLM reasoning or empirical proof. */
import crypto from 'node:crypto';
import {qualifyC131ReleaseCandidate} from '../host/c131-product-release-gate.mjs';
const H='a'.repeat(40),OTHER='b'.repeat(40),DIG='c'.repeat(64);
const count=Number(process.argv[2]??'1000000');
if(!Number.isSafeInteger(count)||count<1||count>10000000)throw Error('invalid cases');
let mismatch=0,falseOfficial=0,eligible=0,reasonCounts={};
const reasons=['SOURCE_NOT_MAIN','SOURCE_COMMIT_NOT_PINNED','PROMPT_SOURCE_DRIFT','BUNDLE_SOURCE_DRIFT',
 'BUNDLE_BYTES_NOT_VERIFIED','CI_QUALIFICATION_MISSING','OWNER_CLAIMS_NOT_RECONCILED'];
for(let i=0;i<count;i++){
 const bits=(Math.imul(i,2654435761)>>>0);
 const branch=(bits&1)?'main':'feature';
 const source=(bits&2)?H:'bad';
 const prompt=(bits&4)?source:OTHER;
 const bundle=(bits&8)?source:OTHER;
 const bundleSha256=(bits&16)?DIG:'bad';
 const manifestVerified=!!(bits&32),testsPassed=!!(bits&64),ownerIdentityVerified=!!(bits&128);
 const o={branch,sourceCommit:source,promptCommit:prompt,bundleCommit:bundle,
  bundleSha256,manifestVerified,testsPassed,ownerIdentityVerified};
 const p=qualifyC131ReleaseCandidate(o);
 const oracle=branch==='main'&&source===H&&prompt===H&&bundle===H&&bundleSha256===DIG&&
  manifestVerified&&testsPassed&&ownerIdentityVerified;
 const expected=branch!=='main'?reasons[0]:source!=='bad'?null:reasons[1];
 if(!!p.eligible!==!!oracle||p.published!==false||p.active!==false||p.source_authentication!=='CALLER_ATTESTED_ONLY'||
  (!p.eligible&&!reasons.includes(p.first_edge)))mismatch++;
 if(p.published===true||p.active===true)falseOfficial++;
 if(p.eligible)eligible++;
 if(!p.ok)reasonCounts[p.first_edge]=(reasonCounts[p.first_edge]??0)+1;
}
if(mismatch||falseOfficial)process.exitCode=1;
const report={schema:'ikant-c131-finite-policy-falsification/v1',cases:count,
 seed_transform:'imul(i,2654435761) unsigned 32-bit',domain:'BINARY_MAIN_PIN_SOURCE_PROMPT_BUNDLE_HASH_MANIFEST_TESTS_OWNER',
 mismatch,falseOfficial,eligible,blocked_by:reasonCounts,real_llm_cases:0,
 proves_native_release:false,status:mismatch||falseOfficial?'FAIL':'PASS'};
const serialized=JSON.stringify(report);
console.log(serialized);
