import fs from 'node:fs';
import {evaluateC80H95} from '../host/c80-field-witness.mjs';

function stop(edge,detail=''){
 return {schema:'ikant-le-c80-h95-evaluation/v1',status:'C80_UNVERIFIED',
  first_unclosed_edge:edge,detail:String(detail).slice(0,160),
  real_native_host_proven:false,user_value_95_percent_proven:false,
  authority:0,active:false};
}
function value(name){
 const i=process.argv.indexOf(name);
 if(i<0||!process.argv[i+1])throw Error('C80_MISSING_ARGUMENT:'+name);
 return process.argv[i+1];
}
try{
 // The trust anchor must be supplied by an external qualified host.
 // A model-provided public key + model-provided signature proves nothing about
 // actual native ChatGPT events. Never accept the private key via this CLI.
 const keyFile=value('--public-key'),expectedIssuerId=value('--issuer');
 const expectedSourceHead=value('--head'),expectedManifestSha256=value('--manifest');
 const pem=fs.readFileSync(keyFile,'utf8');
 const bytes=fs.readFileSync(0);
 if(bytes.length>18_000_000)throw Error('C80_COHORT_JSON_TOO_LARGE');
 const input=JSON.parse(bytes.toString('utf8'));
 if(!input||input.schema!=='ikant-le-c80-field-cohort-input/v1'||
    Object.keys(input).sort().join(',')!=='records,schema'||
    !Array.isArray(input.records))throw Error('C80_INPUT_SCHEMA_INVALID');
 const result=evaluateC80H95({envelopes:input.records,issuerPublicKeyPem:pem,
  expectedIssuerId,expectedSourceHead,expectedManifestSha256});
 process.stdout.write(JSON.stringify(result)+'\n');
 if(['C80_COHORT_REJECTED','C80_UNVERIFIED','C80_INVALID_COHORT'].includes(result.status))
  process.exitCode=2;
}catch(e){
 process.stdout.write(JSON.stringify(stop('C80_FIELD_QUALIFIER',
  e instanceof Error?e.message:e))+'\n');
 process.exitCode=2;
}
