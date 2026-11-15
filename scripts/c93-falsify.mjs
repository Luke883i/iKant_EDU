import {checkC93SourceEpoch} from '../host/c93-source-epoch.mjs';
import {makeC93Fixture,sha} from '../tests/c93-fixture.mjs';
const n=Number(process.argv[2]||100000);
if(!Number.isInteger(n)||n<100||n>1000000)throw Error('CASES_RANGE');
const base=makeC93Fixture();
let survivors=0;const classes=10, examples=[];
for(let i=0;i<n;i++){
 const k=i%classes;let x={...base};
 if(k===0)x.sourceHead='f'.repeat(40);
 if(k===1)x.packageSha256=sha('wrong');
 if(k===2)x.manifestSha256=sha('wrong');
 if(k===3)x.packageBase64=x.packageBase64.slice(2);
 if(k===4)x.packageBase64=Buffer.from('{}').toString('base64');
 if(k>=5){
  const p=JSON.parse(Buffer.from(x.packageBase64,'base64').toString('utf8'));
  if(k===5)p.sourceHead='b'.repeat(40);
  if(k===6)p.expectedManifestSha256='c'.repeat(64);
  if(k===7)p.files[0].contentBase64=Buffer.from('tamper').toString('base64');
  if(k===8)p.files.push(p.files[0]);
  if(k===9)p.sourceProof.commitBase64='BAD';
  const raw=Buffer.from(JSON.stringify(p));x.packageBase64=raw.toString('base64');x.packageSha256=sha(raw);
 }
 const r=checkC93SourceEpoch(x);if(r.status!=='C93_SOURCE_STOP'){survivors++;if(examples.length<5)examples.push({i,k,status:r.status});}
}
const result={schema:'ikant-le-c93-preflight-falsification/v1',cases:n,classes,survivors,negative_only:true,positive_provider_calls:0,host_native_delivery:false,active:false,examples};
console.log(JSON.stringify(result));if(survivors)process.exitCode=2;
