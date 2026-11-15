import {checkC93SourceEpoch} from '../host/c93-source-epoch.mjs';
import {makeC93Fixture,sha} from '../tests/c93-fixture.mjs';
const n=Number(process.argv[2]||12000);let accepted=0;const by={};
for(let i=0;i<n;i++){
 const q=makeC93Fixture(),p=JSON.parse(Buffer.from(q.packageBase64,'base64').toString('utf8'));
 const m=JSON.parse(Buffer.from(p.manifestBase64,'base64').toString('utf8'));
 const k=i%4;
 if(k===0)m.files[1]={...m.files[0]};
 if(k===1){m.files[0].path='../outside';p.files[0].path='../outside';}
 if(k===2){m.files[0].path='/absolute';p.files[0].path='/absolute';}
 if(k===3){p.sourceProof.treeObjects[0].sha1='invalid-sha';}
 const b=Buffer.from(JSON.stringify(m));p.manifestBase64=b.toString('base64');p.expectedManifestSha256=q.manifestSha256=sha(b);
 const raw=Buffer.from(JSON.stringify(p));q.packageBase64=raw.toString('base64');q.packageSha256=sha(raw);
 if(checkC93SourceEpoch(q).status!=='C93_SOURCE_STOP'){accepted++;by[k]=(by[k]||0)+1;}
}
const receipt={schema:'ikant-le-c93-targeted-falsification/v1',cases:n,classes:4,unexpected_accepts:accepted,by_class:by,claim:'PRE_FLIGHT_ONLY_NOT_C81_PROOF'};
console.log(JSON.stringify(receipt));if(accepted)process.exitCode=2;
