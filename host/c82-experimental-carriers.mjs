import crypto from 'node:crypto';

// A host-supplied byte-carrier adapter. It never discovers host capabilities,
// performs network IO or attests the external origin of a GitHub ref.
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`),b])).digest('hex');
const H40=/^[a-f0-9]{40}$/;
const stop=(edge,details=[])=>({schema:'ikant-le-c82-carrier-result/v1',
 status:'C82_CARRIER_STOP',first_unclosed_edge:edge,failures:details.slice(0,12),
 active:false,source_origin_attested:false,authority:0});
function decode(s){
 if(typeof s!=='string'||s.length>1400000||s.length%4!==0||
 !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s))throw Error('NONCANONICAL_BASE64');
 const b=Buffer.from(s,'base64');
 if(b.toString('base64')!==s)throw Error('NONCANONICAL_BASE64');
 return b;
}
function bounded(run,ms){let timer;return Promise.race([
 Promise.resolve().then(run),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('CARRIER_TIMEOUT')),ms);})
]).finally(()=>clearTimeout(timer));}
function permits(limit){
 let used=0,peak=0;const waiting=[];
 return {
  get peak(){return peak;},
  async run(fn){
   if(used>=limit)await new Promise(resolve=>waiting.push(resolve));
   used++;peak=Math.max(peak,used);
   try{return await fn();}finally{used--;waiting.shift()?.();}
  }
 };
}
// Hedge alternatives only after a short bounded delay. Abort releases
// delayed (not yet launched) candidates immediately after a samehash winner.
function hedge(ms,signal){
 if(ms<=0||signal.aborted)return Promise.resolve();
 return new Promise(resolve=>{
  let timer;
  const done=()=>{clearTimeout(timer);signal.removeEventListener('abort',done);resolve();};
  signal.addEventListener('abort',done,{once:true});
  timer=setTimeout(done,ms);
 });
}
/** All candidate source bytes are checked before ONE C78 writer stages anything.
 * parallelism bounds global awaited callback slots, not merely worker count.
 * Pending host callbacks cannot be forcibly cancelled if they ignore AbortSignal.
 * Timeout is NOT evidence of provider cancellation. */
export async function materializeC82ParallelCarriers({relay,manifest,carriers,
 parallelism=4,carrierTimeoutMs=5000,hedgeDelayMs=20}={}){
 if(!relay||!Array.isArray(relay.expectedPaths)||!manifest||
  !Array.isArray(manifest.files)||manifest.files.length<20||manifest.files.length>50||
  manifest.source_head!==relay._sourceHead||
  !Array.isArray(carriers)||carriers.length<1||carriers.length>6||
  !carriers.every(c=>c&&/^[A-Z0-9_]{2,48}$/.test(c.name)&&typeof c.getFile==='function')||
  new Set(carriers.map(c=>c.name)).size!==carriers.length||
  !Number.isInteger(parallelism)||parallelism<1||parallelism>8||
  !Number.isInteger(carrierTimeoutMs)||carrierTimeoutMs<50||carrierTimeoutMs>30000||
  !Number.isInteger(hedgeDelayMs)||hedgeDelayMs<0||hedgeDelayMs>250)
  return stop('C82_CARRIER_ENVELOPE');
 const allowed=new Map(manifest.files.map(f=>[f.path,f]));
 const paths=relay.expectedPaths;
 if(allowed.size!==paths.length||paths.some(p=>!allowed.has(p)))
  return stop('C82_MANIFEST_C78_PATH_SET');
 const found=new Map(),failures=[],capacity=permits(parallelism),quarantined=new Set();
 let cursor=0,invocations=0;
 async function worker(){
  while(cursor<paths.length){
   const p=paths[cursor++],f=allowed.get(p);
   const controller=new AbortController();
   const probes=carriers.map((c,index)=>(async()=>{
    await hedge(index*hedgeDelayMs,controller.signal);
    return capacity.run(async()=>{
     if(controller.signal.aborted)throw Error('CARRIER_SKIPPED_AFTER_WIN');
     if(quarantined.has(c.name))throw Error('CARRIER_QUARANTINED_AFTER_TIMEOUT');
     invocations++;
     let packet;
     try{packet=await bounded(()=>c.getFile(p,{signal:controller.signal}),carrierTimeoutMs);}
     catch(e){
      // A timeout does not mean the external host call has stopped.
      // Never launch this provider again during this materialization.
      if(e?.message==='CARRIER_TIMEOUT')quarantined.add(c.name);
      throw e;
     }
     const b=decode(packet?.contentBase64);
     if(b.length!==f.bytes||digest(b)!==f.sha256)throw Error('SHA256_OR_LENGTH_MISMATCH');
     // C77 emits one transformed C71 module and one generated build proof.
     // Their payload SHA-256 is checked above; original SHA-1 refers to the
     // pre-transformation repository source, not to the derivative bytes.
     if(f.generated_derivative===true){
      const c71=p==='src/c71-experimental-host-draft.mjs'&&
        H40.test(String(f.original_source_blob_sha1));
      const proof=p==='contracts/c77-cx-build-proof.json'&&
        f.original_source_blob_sha1===null;
      if(!c71&&!proof)throw Error('UNQUALIFIED_DERIVATIVE');
     }else if(f.generated_derivative===false){
      if(!H40.test(String(f.original_source_blob_sha1))||
        gitBlob(b)!==f.original_source_blob_sha1)throw Error('GIT_BLOB_MISMATCH');
     }else throw Error('DERIVATIVE_FLAG_INVALID');
     return {path:p,carrier:c.name,contentBase64:packet.contentBase64,
       sourceBlobSha1:f.original_source_blob_sha1};
    });
   })());
   try{found.set(p,await Promise.any(probes));}
   catch{failures.push({path:p,edge:'NO_SAMEHASH_CARRIER'});}
   finally{controller.abort();await Promise.allSettled(probes);}
  }
 }
 await Promise.all(Array.from({length:Math.min(parallelism,paths.length)},()=>worker()));
 if(found.size!==paths.length)return stop('C82_INCOMPLETE_CARRIER_COVERAGE',failures);
 try{
  for(const p of paths)relay.stageFile({filePath:p,contentBase64:found.get(p).contentBase64,
   sourceBlobSha1:found.get(p).sourceBlobSha1});
  const readback=relay.finalize();
  if(readback.all_bytes_reopened!==true)throw Error('C78_READBACK_NOT_VERIFIED');
  return {schema:'ikant-le-c82-carrier-result/v1',status:'C82_C77_BYTES_MATERIALIZED_IN_NODE',
   source_head:manifest.source_head,files:paths.length,
   selected_carriers:paths.map(p=>({path:p,carrier:found.get(p).carrier})),
   all_bytes_reopened:true,invoked_host_callbacks:invocations,
   max_awaited_callbacks_observed:capacity.peak,global_callback_budget:parallelism,
   candidate_hedge_delay_ms:hedgeDelayMs,
   timed_out_carrier_names:[...quarantined].sort(),
   provider_physical_termination_attested:false,
   timeout_does_not_prove_provider_cancellation:true,
   first_unclosed_edge:'HOST_GITHUB_ORIGIN_AUTHENTICATION',
   no_native_delivery_claim:true,source_origin_attested:false,
   active:false,persistent:false,canonical_runtime:false,authority:0};
 }catch(e){return stop('C82_C78_STAGING_READBACK',
   [{detail:String(e?.message||e).slice(0,100)}]);}
}
