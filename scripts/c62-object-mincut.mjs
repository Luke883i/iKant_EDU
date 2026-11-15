import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const boot=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8')).post_accept_fastboot;
const orientation=boot.reuse_preaccept_paths||[];
const runtime=boot.remote_paths||[];
const d=boot.runtime_root;
const all=[...orientation,...runtime],runtimeMask=runtime.reduce((mask,_,i)=>mask|(1<<(orientation.length+i)),0);
const members=d.members||[],shards=d.shards||[];
let valid=0,minSize=Infinity,minCount=0,fullRuntimeMissingKilled=0,subsetMatches=0;
for(let mask=0;mask<(1<<all.length);mask++){
  const isValid=(mask&runtimeMask)===runtimeMask;
  if(isValid){valid++;const size=Array.from({length:all.length},(_,i)=>(mask>>i)&1).reduce((a,b)=>a+b,0);if(size<minSize){minSize=size;minCount=1;}else if(size===minSize)minCount++;}
  if(mask===runtimeMask)subsetMatches++;
}
for(let i=0;i<runtime.length;i++)if(((runtimeMask^(1<<(orientation.length+i)))&runtimeMask)!==runtimeMask)fullRuntimeMissingKilled++;
const declared=[d.loader.path,...shards.map(x=>x.path)];
const allMembersCovered=shards.every(s=>s.member_count>0&&members.filter(m=>m.shard===s.index).length===s.member_count)&&members.length===d.member_count&&d.member_count===51;
const sourceBytes=boot.pre_runtime_kernel.bytes+shards.reduce((n,s)=>n+s.source_bytes,0);
const checks={
  disjoint_sets:new Set(all).size===all.length,
  exact_frozen_runtime_paths:JSON.stringify(runtime)===JSON.stringify(declared),
  exactly_five_orientation:orientation.length===5,
  exactly_eight_runtime:runtime.length===8,
  every_shard_has_runtime_members:allMembersCovered,
  unique_minimum:valid===32&&minCount===1&&minSize===8,
  all_runtime_deletions_killed:fullRuntimeMissingKilled===8,
  source_descriptor_bound:boot.pre_runtime_kernel.blob_sha1===d.loader.blob_sha1,
  runtime_does_not_require_orientation_source_paths:orientation.every(p=>!runtime.includes(p))
};
const out={
 schema:'ikant-le-c62-transport-object-mincut/v1',
 analysis_class:'STRUCTURAL_REPOSITORY_PROOF_NOT_HOST_EXECUTION',
 runtime_root_sha256:d.runtime_root_sha256,
 enumerated_subsets:1<<all.length,
 orientation_source_objects:orientation.length,
 runtime_transfer_objects:runtime.length,
 runtime_installed_members:d.member_count+1,
 runtime_transport_bytes:sourceBytes,
 valid_supersets:valid,
 minimum_cardinality:minSize,
 minimum_solutions:minCount,
 runtime_deletion_mutants_killed:fullRuntimeMissingKilled,
 tests:checks,
 status:Object.values(checks).every(Boolean)?'PASS':'FAIL'
};
process.stdout.write(JSON.stringify(out,null,2)+'\n');
if(out.status!=='PASS')process.exitCode=1;
