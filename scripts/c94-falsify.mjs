import crypto from 'node:crypto';
import {serializeGitHubCommit,serializeGitHubTree,gitSha} from '../host/c94-git-api-proof.mjs';
import {bindC94GeneratedSurface} from '../host/c94-native-delivery-boundary.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const cases=Number(process.argv[2]||100000);
if(!Number.isInteger(cases)||cases<100||cases>1000000)throw Error('CASES_RANGE');
const voice='Some bounded experimental result from a source-bound owner; this is not a real provider observation.';
const owner={status:'C93_HOST_SURFACE_READY_NOT_NATIVE_DELIVERED',source_head:'a'.repeat(40),
 input_sha256:'b'.repeat(64),surface_a_sha256:sha(Buffer.from(voice)),surface_a_exact:voice,
 owner_receipt_status:'C92_EXPERIMENTAL_OWNER_ACCEPTED_SURFACE_A_STAGED_NOT_NATIVE_DELIVERED',
 provider_http_calls_observed:2,active:false,native_delivery_attested:false,c81_c86_language_adoption_attested:false};
const treeRaw=Buffer.concat([Buffer.from('100644 valid.txt\0'),Buffer.from('c'.repeat(40),'hex')]);
const treeSha=gitSha('tree',treeRaw);
const tree={sha:treeSha,truncated:false,tree:[{path:'valid.txt',type:'blob',mode:'100644',sha:'c'.repeat(40)}]};
const payload=`tree ${treeSha}\nauthor Test <test@example.org> 1 +0000\ncommitter Test <test@example.org> 1 +0000\n\nTest\n`;
const commitSha=gitSha('commit',Buffer.from(payload));
const commit={sha:commitSha,verification:{payload}};
let survivors=0;const failures={};
for(let i=0;i<cases;i++){
 const k=i%12;let rejected=false;
 try{
  if(k<4){const j=structuredClone(tree);
   if(k===0)j.tree[0].sha='f'.repeat(40);
   if(k===1)j.tree[0].mode='100777';
   if(k===2)j.tree[0].path='../evil.txt';
   if(k===3)j.tree.push({...j.tree[0]});
   serializeGitHubTree(j,treeSha);
  }else if(k<7){const j=structuredClone(commit);
   if(k===4)j.sha='f'.repeat(40);
   if(k===5)j.verification.payload=j.verification.payload.replace('Test','Fake');
   if(k===6)j.verification.signature='-----BEGIN PGP SIGNATURE-----\nfake\n-----END PGP SIGNATURE-----\n';
   serializeGitHubCommit(j,commitSha);
  }else{const x={...owner};
   if(k===7)x.status='C91_STRUCTURALLY_VALIDATED_HOST_LANGUAGE_DRAFT_NOT_IKANT_SURFACE_A';
   if(k===8)x.input_sha256='fake';
   if(k===9)x.surface_a_exact+=' tampered';
   if(k===10)x.provider_http_calls_observed=0;
   if(k===11)x.native_delivery_attested=true;
   rejected=bindC94GeneratedSurface(x).status==='C94_NATIVE_STOP';
  }
 }catch{rejected=true;}
 if(!rejected){survivors++;if(!failures[k])failures[k]=1;else failures[k]++;}
}
const result={schema:'ikant-le-c94-negative-falsification/v1',cases,classes:12,survivors,by_class:failures,
 scope:'SYNTHETIC_GIT_OBJECT_AND_OWNER_SHAPE_NEGATIVES_NOT_LIVE_PROVIDER_OR_NATIVE_PLATFORM',
 actual_github_actions_downloads:0,actual_model_provider_calls:0,native_host_deliveries:0};
console.log(JSON.stringify(result));if(survivors)process.exitCode=2;
