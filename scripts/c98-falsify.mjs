import fs from 'node:fs';
import crypto from 'node:crypto';
import {makeC98C82Carrier} from '../host/c98-c82-connector-port.mjs';
import {validateC94C77Archive} from '../host/c94-zip-c77.mjs';
const cases=Number(process.argv[2]||10000);
if(!Number.isSafeInteger(cases)||cases<100||cases>1000000)throw Error('C98_CASES_RANGE');
const zip=fs.readFileSync(new URL('../tests/fixtures/c77-historical-head-66f074b3.zip',import.meta.url));
const H='66f074b34f34455b3c4188703d83ad71316baa06';
const a=validateC94C77Archive(zip,{sourceHead:H});
if(a.status!=='C94_C77_CONTENT_VALID_NOT_GITHUB_ORIGIN')throw Error('C94_HISTORICAL_ZIP_REJECTED');
const manifest=a.manifest,raw=a.content.get('c77-manifest.json').toString('base64');
const spec={sourceHead:H,manifest,manifestBase64:raw,manifestSha256:a.manifest_sha256};
const target=manifest.files[0].path,body=a.content.get(target).toString('base64');
const mutatedBase=Buffer.from(a.content.get(target));mutatedBase[0]^=1;
const mutate=[
 x=>({...x,path:'src/other.mjs'}),
 x=>({...x,sourceHead:'a'.repeat(40)}),
 x=>({...x,manifestSha256:'b'.repeat(64)}),
 x=>({...x,contentBase64:mutatedBase.toString('base64')}),
 x=>({...x,contentBase64:body.slice(0,-4)+'%==='}),
 x=>({...x,contentBase64:''}),
 x=>({...x,native_delivery_attested:true}),
 x=>({contentBase64:x.contentBase64}),
 x=>({...x,contentBase64:12345}),
 x=>({...x,path:'../../escape'}),
 x=>({...x,contentBase64:'AA=='}),
 x=>({...x,sourceHead:null})
];
let accepted=0,wrongError=0;const classes=Object.fromEntries(mutate.map((_,i)=>[i,0]));
for(let i=0;i<cases;i++){
 const k=(i*8713+37)%mutate.length;
 const readC77Member=async q=>mutate[k]({sourceHead:q.sourceHead,
   manifestSha256:q.manifestSha256,path:q.path,contentBase64:body});
 const p=makeC98C82Carrier({...spec,readC77Member});
 try{await p.carrier.getFile(target);accepted++}
 catch(e){if(!String(e?.code||'').startsWith('C98_'))wrongError++;classes[k]++;}
}
const edges=JSON.parse(fs.readFileSync(new URL('../contracts/c98-post-pr101-evidence.json',import.meta.url),'utf8')).host_or_externally_open_edges;
const covered=new Set(),novelAfterFirstFullCoverage=[];let firstCoverageIndex=-1;
for(let i=0;i<10000;i++){
 // Synthetic proposal-space normalization, NOT real Git commits or proof
 // that no possible novel requirements exist beyond the declared edge model.
 const k=(i*4871+13)%edges.length;
 const before=covered.size;covered.add(edges[k]);
 if(covered.size===edges.length&&firstCoverageIndex<0)firstCoverageIndex=i;
 if(i>firstCoverageIndex&&firstCoverageIndex>=0&&covered.size>before)novelAfterFirstFullCoverage.push(i);
}
const out={schema:'ikant-le-c98-bounded-negative-and-proposal-lattice/v1',cases,
  callback_attack_classes:mutate.length,wrong_error_family:wrongError,unsafe_accepted_callbacks:accepted,
  classes_rejected:classes,historical_c77_source_head:H,
  source_verification_scope:'HISTORICAL_LOCAL_C77_FIXTURE_NOT_CURRENT_HEAD_HOST_TRANSFER',
  bounded_proposal_candidates:10000,declared_gap_classes:edges.length,
  declared_classes_covered:covered.size,first_full_coverage_index:firstCoverageIndex,
  novel_normalized_classes_after_coverage:novelAfterFirstFullCoverage.length,
  claim_boundary:'10000 synthetic normalized proposals NOT 10000 independent semantic commit executions, NOT globally no-new-commit theorem',
  native_platform_sessions_observed:0,real_provider_calls_observed:0,
  c72_h95_field_attested:false,actual_host_installed_port_attested:false,
  status:accepted===0&&wrongError===0&&covered.size===edges.length&&novelAfterFirstFullCoverage.length===0?'PASS':'FAIL'};
process.stdout.write(JSON.stringify(out,null,2)+'\n');
if(out.status!=='PASS')process.exitCode=2;
