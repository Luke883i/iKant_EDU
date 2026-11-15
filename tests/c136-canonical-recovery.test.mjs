import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {runtimeRootDescriptor} from '../src/runtime-root-verified.mjs';
import {C136_CHANNELS,issueC136RecoveryPermit,validateC136RecoveryPermit,materializeC136ManualCarrier} from '../src/c136-canonical-recovery.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const HEAD='35c144524e79f581980bb44ee04dc9fff0c4c10a';
const descriptor=runtimeRootDescriptor(ROOT);
const failures=(sourceHead=HEAD,rootSha=descriptor.runtime_root_sha256)=>C136_CHANNELS.map((channel,i)=>({
 channel,attempt_id:'trial_c136_'+i+'_20261015',source_head:sourceHead,
 runtime_root_sha256:rootSha,observed_monotonic_ms:100+i*10,outcome:'FAILED_DEFINITIVE',
 error_code:'CHANNEL_UNAVAILABLE',side_effects:'NONE',host_witnessed:true,machine_native_proof_attested:false
}));
const permit=()=>issueC136RecoveryPermit({sourceHead:HEAD,runtimeRootSha256:descriptor.runtime_root_sha256,attempts:failures()});
function fixture(){
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c136-'));
 const manualRoot=path.join(parent,'manual'),outputRoot=path.join(parent,'recovered');fs.mkdirSync(manualRoot);
 const boot=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8'));
 const paths=boot.post_accept_fastboot.remote_paths;
 for(const p of paths){const to=path.join(manualRoot,p);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(ROOT,p),to)}
 return {parent,manualRoot,outputRoot,cleanup(){fs.rmSync(parent,{recursive:true,force:true})}};
}
test('C136 requires three distinct definitively failed side-effect-free machine channels',()=>{
 const good=permit();assert.equal(good.ok,true,JSON.stringify(good));assert.equal(good.active,false);
 assert.equal(validateC136RecoveryPermit(good,{sourceHead:HEAD,runtimeRootSha256:descriptor.runtime_root_sha256}).ok,true);
 const args={sourceHead:HEAD,runtimeRootSha256:descriptor.runtime_root_sha256};
 assert.equal(issueC136RecoveryPermit({...args,attempts:failures().slice(0,2)}).ok,false);
 assert.equal(issueC136RecoveryPermit({...args,attempts:[...failures(),failures()[0]]}).ok,false);
 for(const mutate of [
  a=>a[1].channel=a[0].channel,a=>a[1].attempt_id=a[0].attempt_id,
  a=>a[1].observed_monotonic_ms=100,a=>a[1].outcome='UNKNOWN',
  a=>a[1].outcome='TIMEOUT_UNKNOWN',a=>a[1].side_effects='UNKNOWN',
  a=>a[1].error_code='INTEGRITY_REJECTED',a=>a[1].machine_native_proof_attested=true,
  a=>a[1].host_witnessed=false,a=>a[1].source_head='f'.repeat(40)
 ]){let a=failures();mutate(a);assert.equal(issueC136RecoveryPermit({...args,attempts:a}).ok,false)}
 const tampered={...good,canonical_active:true};assert.equal(validateC136RecoveryPermit(tampered,args).ok,false);
 const stamped={...good,receipt_sha256:'f'.repeat(64)};assert.equal(validateC136RecoveryPermit(stamped,args).ok,false);
});
test('C136 manual carrier reads exact frozen loader/shards and stages atomically, never ACTIVE',()=>{
 const x=fixture();try{
  const permitReceipt=permit();const v=materializeC136ManualCarrier({workspace:ROOT,manualRoot:x.manualRoot,
   outputRoot:x.outputRoot,sourceHead:HEAD,permit:permitReceipt});
  assert.equal(v.ok,true,JSON.stringify(v));assert.equal(v.objects,8);
  assert.equal(v.receipt.single_inode_double_read,true);assert.equal(v.receipt.independent_postpublish_reopen,true);
  assert.equal(v.receipt.canonical_active,false);assert.equal(v.receipt.original_c59_handoff_authority_granted,false);
  assert.equal(v.original_c59_native_handoff_valid,false);
  assert.equal(fs.existsSync(path.join(x.outputRoot,'src/runtime-root-verified.mjs')),true);
  assert.equal(materializeC136ManualCarrier({workspace:ROOT,manualRoot:x.manualRoot,
   outputRoot:x.outputRoot,sourceHead:HEAD,permit:permitReceipt}).ok,false);
 }finally{x.cleanup()}
});
test('C136 never stages if a supplied object changes, disappears or is a symlink',()=>{
 const x=fixture();try{
  const objects=JSON.parse(fs.readFileSync(path.join(ROOT,'BOOTSTRAP.json'),'utf8')).post_accept_fastboot.remote_paths;
  const obj=path.join(x.manualRoot,objects[1]);fs.appendFileSync(obj,'\ncorrupted');
  const r=materializeC136ManualCarrier({workspace:ROOT,manualRoot:x.manualRoot,outputRoot:x.outputRoot,sourceHead:HEAD,permit:permit()});
  assert.equal(r.ok,false);assert.equal(fs.existsSync(x.outputRoot),false);
  fs.copyFileSync(path.join(ROOT,objects[1]),obj);
  const real=path.join(x.parent,'saved');fs.renameSync(obj,real);fs.symlinkSync(real,obj);
  const r2=materializeC136ManualCarrier({workspace:ROOT,manualRoot:x.manualRoot,outputRoot:x.outputRoot,sourceHead:HEAD,permit:permit()});
  assert.equal(r2.ok,false);assert.equal(fs.existsSync(x.outputRoot),false);
 }finally{x.cleanup()}
});
test('C136 cannot stage source against stale descriptor or invented provider origin',()=>{
 const x=fixture();try{
  const v=materializeC136ManualCarrier({workspace:ROOT,manualRoot:x.manualRoot,outputRoot:x.outputRoot,
    sourceHead:'b'.repeat(40),permit:permit()});assert.equal(v.ok,false);
  assert.equal(fs.existsSync(x.outputRoot),false);
  const p={...permit(),native_ingress_attested:true};const v2=materializeC136ManualCarrier({workspace:ROOT,manualRoot:x.manualRoot,
   outputRoot:x.outputRoot,sourceHead:HEAD,permit:p});assert.equal(v2.ok,false);
 }finally{x.cleanup()}
});
test('10000 deterministic mutant carriers cannot cross original C59 authority boundary',()=>{
 const good=permit(),args={sourceHead:HEAD,runtimeRootSha256:descriptor.runtime_root_sha256};
 for(let i=0;i<10000;i++){
  const a=structuredClone(good);
  switch(i%10){
   case 0:a.attempts[0].outcome='UNKNOWN';break;
   case 1:a.attempts[1].attempt_id=a.attempts[0].attempt_id;break;
   case 2:a.attempts[2].side_effects='MAY_HAVE_SENT';break;
   case 3:a.native_ingress_attested=true;break;
   case 4:a.canonical_active=true;break;
   case 5:a.receipt_sha256='0'.repeat(64);break;
   case 6:a.attempts[1].channel='WARM_CACHE_EXACT';break;
   case 7:a.source_head='a'.repeat(40);break;
   case 8:a.attempts[0].observed_monotonic_ms=250;break;
   case 9:a.machine_channels[0]='HOST_FILE_BRIDGE';break;
  }
  assert.equal(validateC136RecoveryPermit(a,args).ok,false,'mutant '+i);
 }
});

test('exclusive staging lock and hostile Proxy fail before materialization',()=>{
 const x=fixture();try{
  fs.writeFileSync(x.outputRoot+'.c136.lock','busy');
  const r=materializeC136ManualCarrier({workspace:ROOT,manualRoot:x.manualRoot,outputRoot:x.outputRoot,sourceHead:HEAD,permit:permit()});
  assert.equal(r.ok,false);assert.equal(fs.existsSync(x.outputRoot),false);
  fs.unlinkSync(x.outputRoot+'.c136.lock');
  let touches=0;const proxy=new Proxy(failures()[0],{get(){touches++;throw Error('hostile')}});
  const a=failures();a[0]=proxy;
  const p=issueC136RecoveryPermit({sourceHead:HEAD,runtimeRootSha256:descriptor.runtime_root_sha256,attempts:a});
  assert.equal(p.ok,false);assert.equal(touches,0);
 }finally{x.cleanup()}
});
