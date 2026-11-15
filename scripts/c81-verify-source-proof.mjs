import fs from 'node:fs';
import {verifyC81SourceReachability} from '../host/c81-git-source-reachability.mjs';
let receipt;
try{
 const input=fs.readFileSync(0);
 if(input.length>1400000)throw Error('C81_PROOF_INPUT_TOO_LARGE');
 const object=JSON.parse(input.toString('utf8'));
 if(!object||object.schema!=='ikant-le-c81-source-verify-request/v1'||
   Object.keys(object).sort().join(',')!=='proof,schema')
  throw Error('C81_PROOF_ENVELOPE_INVALID');
 receipt=verifyC81SourceReachability(object.proof);
}catch(e){
 receipt={schema:'ikant-le-c81-source-reachability/v1',status:'C81_STOP',
  first_unclosed_edge:'C81_PROOF_INPUT_INVALID',authority:0,active:false,
  origin_independently_attested:false,native_chat_delivery_attested:false,
  build_derivation_independently_attested:false,canonical_runtime:false};
}
process.stdout.write(JSON.stringify(receipt)+'\n');
if(receipt.status!=='C81_GIT_REACHABILITY_VERIFIED')process.exitCode=2;
