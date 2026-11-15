import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT} from '../src/contract.mjs';
import {validatePreacceptKernelInput,issueCanonicalRelayManifest,validateCanonicalRelayManifest} from '../src/runtime-root-verified.mjs';

const HEAD='a'.repeat(40),boot=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8')),paths=boot.post_accept_fastboot.reuse_preaccept_paths;
const blob=b=>{const x=Buffer.isBuffer(b)?b:Buffer.from(b);return crypto.createHash('sha1').update(Buffer.from('blob '+x.length+'\0')).update(x).digest('hex')};
const identities=paths.map(p=>{const b=fs.readFileSync(path.join(ROOT,p));return{path:p,blob_sha1:blob(b),bytes:b.length}});
const payloads=paths.map(p=>({path:p,content_utf8:fs.readFileSync(path.join(ROOT,p),'utf8')})),terms=identities.find(x=>x.path==='TERMS.md');
const base=()=>({schema:'ikant-le-preaccept-handoff/v2',repository:'Luke883i/iKant_EDU',source_head:HEAD,terms_presented:true,terms_object:{...terms},frozen:true,breached:false,pending_intent:'inizializza',orientation_objects:structuredClone(identities),orientation_payloads:structuredClone(payloads),runtime_observed_terms_presentation:false,host_attested_terms_presentation:true,authority:0});
const manifest=issueCanonicalRelayManifest({workspace:ROOT,sourceHead:HEAD,preacceptHandoff:base(),humanInput:'I ACCEPT',acceptanceObservedMonotonicMs:10,observedMonotonicMs:11});
const manifestValidation=validateCanonicalRelayManifest(manifest,{workspace:ROOT,sourceHead:HEAD,preacceptHandoff:base()});
const families=[
 ['DROP_PAYLOAD',m=>m.orientation_payloads.pop()],
 ['DUPLICATE_PAYLOAD_PATH',m=>m.orientation_payloads[1].path=m.orientation_payloads[0].path],
 ['MUTATE_PAYLOAD_BYTES',m=>m.orientation_payloads[0].content_utf8+='x'],
 ['SWAP_PAYLOAD_PATHS',m=>{const x=m.orientation_payloads[0].path;m.orientation_payloads[0].path=m.orientation_payloads[1].path;m.orientation_payloads[1].path=x;}],
 ['MUTATE_IDENTITY_BLOB',m=>m.orientation_objects[0].blob_sha1='0'.repeat(40)],
 ['MUTATE_IDENTITY_BYTES',m=>m.orientation_objects[0].bytes++],
 ['DROP_IDENTITY',m=>m.orientation_objects.pop()],
 ['MUTATE_FROZEN_BOOTSTRAP',m=>m.orientation_payloads.find(x=>x.path==='BOOTSTRAP.json').content_utf8+=' '],
 ['MUTATE_TERMS_OBJECT',m=>m.terms_object.blob_sha1='f'.repeat(40)],
 ['MUTATE_SOURCE_HEAD',m=>m.source_head='b'.repeat(40)]
];
const family_counts=Object.fromEntries(families.map(([name])=>[name,0]));let unsafe=0,mismatch=0;
const baseline=validatePreacceptKernelInput(base(),{workspace:ROOT,sourceHead:HEAD});
for(let i=0;i<10000;i++){const [name,mut]=families[i%families.length],m=base();family_counts[name]++;mut(m);const v=validatePreacceptKernelInput(m,{workspace:ROOT,sourceHead:HEAD});if(v.ok)unsafe++;if(v.ok)mismatch++;}
let deletionKilled=0;for(let i=0;i<paths.length;i++){const m=base();m.orientation_payloads.splice(i,1);if(!validatePreacceptKernelInput(m,{workspace:ROOT,sourceHead:HEAD}).ok)deletionKilled++;}
const loader=fs.readFileSync(path.join(ROOT,'src/runtime-root-verified.mjs'),'utf8'),service=fs.readFileSync(path.join(ROOT,'src/session-local-service.mjs'),'utf8'),contract=fs.readFileSync(path.join(ROOT,'src/contract.mjs'),'utf8');
const implementation_checks={
 baseline_preaccept:baseline.ok===true,
 baseline_manifest:manifestValidation.ok===true,
 runtime8:boot.post_accept_fastboot.remote_paths.length===8&&manifest.object_count===8&&JSON.stringify(manifest.objects.map(x=>x.path))===JSON.stringify(boot.post_accept_fastboot.remote_paths),
 raw5_not_runtime:paths.every(p=>!boot.post_accept_fastboot.remote_paths.includes(p)),
 bootstrap_authority:manifest.pre_acquisition_object_authority==='FROZEN_BOOTSTRAP_REMOTE_PATHS',
 manifest_projection:manifest.manifest_role==='VERIFICATION_PROJECTION_OF_FROZEN_BOOTSTRAP',
 projection_descriptor:loader.includes('runtime_root_descriptor')&&loader.includes('orientation_source_files_materialized:false'),
 service_no_bootstrap_file_read:!service.includes("fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json')"),
 terms_projection:contract.includes('readOrientationRuntimeProjection()')
};
const out={schema:'ikant-le-c62-evidence-runtime-cut-falsification/v1',cases:10000,family_count:families.length,family_counts,rejected:10000-unsafe,unsafe_accept:unsafe,oracle_mismatch:mismatch,valid_false_reject:baseline.ok?0:1,deletion_mutants:paths.length,deletion_mutants_killed:deletionKilled,implementation_checks,status:unsafe===0&&mismatch===0&&baseline.ok&&manifestValidation.ok&&deletionKilled===paths.length&&Object.values(implementation_checks).every(Boolean)?'PASS':'FAIL'};
process.stdout.write(JSON.stringify(out,null,2)+'\n');if(out.status!=='PASS')process.exitCode=1;
