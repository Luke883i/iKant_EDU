import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {Worker} from 'node:worker_threads';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {deriveActivationServiceTier,validateActivationServiceTier} from '../src/runtime-availability.mjs';

const HEX40=/^[a-f0-9]{40}$/;
const SAFE=/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*\\)[A-Za-z0-9._/-]+$/;
const blob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const C66_FAILURE_KIND=Symbol('C66_TYPED_PHYSICAL_FAILURE');
function c66TypedFailure(kind,message='C66 physically classified failure'){const e=new Error(message);e[C66_FAILURE_KIND]=kind;return e;}
function decode(b64){
  if(typeof b64!=='string')throw Error('base64 required');
  const s=b64.replace(/[\r\n]/g,'');
  if(!s||s.length%4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s))throw Error('invalid base64');
  const b=Buffer.from(s,'base64');
  if(b.toString('base64')!==s)throw Error('noncanonical base64');
  return b;
}
function inspectFrozen(x){
  if(x?.humanInput!=='I ACCEPT'||!HEX40.test(String(x.sourceHead))||x.preacceptHandoff?.source_head!==x.sourceHead)throw Error('acceptance/source binding');
  const h=x.preacceptHandoff;
  if(h?.schema!=='ikant-le-preaccept-handoff/v2'||h.terms_presented!==true||h.frozen!==true||h.breached!==false)throw Error('frozen admission');
  if(!Number.isFinite(x.acceptanceObservedMonotonicMs)||x.acceptanceObservedMonotonicMs<0||x.acceptanceObservedMonotonicMs>performance.now())throw Error('monotonic acceptance');
  if(!Number.isInteger(x.runnerCount??4)||(x.runnerCount??4)<1||(x.runnerCount??4)>7)throw Error('runner count');
  const frozen=h.orientation_payloads?.find(y=>y.path==='BOOTSTRAP.json');
  const id=h.orientation_objects?.find(y=>y.path==='BOOTSTRAP.json');
  if(typeof frozen?.content_utf8!=='string'||!id)throw Error('missing frozen bootstrap');
  const bootBytes=Buffer.from(frozen.content_utf8,'utf8');
  if(id.bytes!==bootBytes.length||blob(bootBytes)!==id.blob_sha1)throw Error('bootstrap samehash');
  const boot=JSON.parse(frozen.content_utf8);
  const descriptor=boot.post_accept_fastboot?.runtime_root;
  const rows=[descriptor?.loader,...(descriptor?.shards||[])];
  if(rows.length!==8||rows.some(y=>!SAFE.test(String(y?.path))||!HEX40.test(String(y?.blob_sha1)))||new Set(rows.map(y=>y.path)).size!==8)throw Error('bad runtime8 descriptor');
  if(JSON.stringify(boot.post_accept_fastboot?.remote_paths)!==JSON.stringify(rows.map(y=>y.path)))throw Error('runtime8 frozen set mismatch');
  return{bootBytes,rows};
}
function inspect(x){
  const {bootBytes,rows}=inspectFrozen(x);
  if(!Array.isArray(x.sourceObjects)||x.sourceObjects.length!==8)throw Error('runtime8 incomplete');
  const bytes=new Map();
  for(const y of x.sourceObjects){
    if(!y||bytes.has(y.path)||!rows.some(z=>z.path===y.path)||!String(y.source_object_identity||'').trim())throw Error('invalid path/identity/duplicate');
    const b=decode(y.content_base64),expected=rows.find(z=>z.path===y.path);
    if(blob(b)!==expected.blob_sha1||y.blob_sha1!==expected.blob_sha1)throw c66TypedFailure('INTEGRITY_CONTRADICTION','source blob mismatch: '+y.path);
    bytes.set(y.path,{data:b,identity:y.source_object_identity});
  }
  return{bootBytes,rows,bytes};
}
function write(root,rel,bytes,sha){
  if(!SAFE.test(rel)||blob(bytes)!==sha)throw c66TypedFailure('INTEGRITY_CONTRADICTION');
  const file=path.join(root,rel);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,bytes,{flag:'wx',mode:0o600});
  const reopened=fs.readFileSync(file);
  if(!reopened.equals(bytes)||blob(reopened)!==sha)throw c66TypedFailure('INTEGRITY_CONTRADICTION');
}
function writeWorker(){
  const {parentPort,workerData:w}=require('node:worker_threads');
  const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
  const sha=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
  try{
    const b=Buffer.from(w.base64,'base64');
    if(sha(b)!==w.sha)throw Error('worker input mismatch');
    const target=path.join(w.root,w.path);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    let recovery='NEW_WRITE',attempts=0;
    // Owner-issued C61 manifest already fixes this path/blob. Never refetch
    // source bytes, start a second worker/writer or renew acceptance.
    for(;;){
      attempts++;
      try{fs.writeFileSync(target,b,{flag:'wx',mode:0o600});break;}
      catch(e){
        if(e.code==='EEXIST'){
          // A pre-existing private-stage object can be adopted ONLY by byte
          // identity. A mismatching object is an integrity breach, not retry.
          recovery='IDENTICAL_REOPEN';
          break;
        }
        if((e.code==='EINTR'||e.code==='EAGAIN')&&attempts===1&&!fs.existsSync(target)){
          // Physically re-probe the same sink; one bounded local write retry.
          fs.statSync(path.dirname(target));
          recovery='TRANSIENT_LOCAL_RETRY';
          continue;
        }
        throw e;
      }
    }
    const reopen=fs.readFileSync(target);
    if(!reopen.equals(b)||sha(reopen)!==w.sha)throw Error('worker reopen mismatch');
    parentPort.postMessage({ok:true,path:w.path,recovery,attempts,
      source_sha1:w.sha,local_reopen_sha1:sha(reopen)});
  }catch(e){const message=String(e.message||e);parentPort.postMessage({error:message,integrity:/^worker (input|reopen) mismatch$/.test(message)});}
}
const WORKER='('+writeWorker.toString()+')()';
function oneWorker(root,row,source){
  return new Promise((resolve,reject)=>{
    const w=new Worker(WORKER,{eval:true,workerData:{root,path:row.path,sha:row.blob_sha1,base64:source.data.toString('base64')}});
    let received=false;
    w.once('message',m=>{received=true;m.ok?resolve(m):reject(m.integrity?c66TypedFailure('INTEGRITY_CONTRADICTION'):new Error('worker execution failed'));});
    w.once('error',reject);
    w.once('exit',code=>{if(!received)reject(Error('worker missing receipt: '+code));});
  });
}
async function fanout(root,rows,bytes,limit){
  let cursor=0,halt=false;
  const results=[];
  const pump=async()=>{while(!halt&&cursor<rows.length){
    const row=rows[cursor++];
    try{results.push(await oneWorker(root,row,bytes.get(row.path)));}
    catch(e){halt=true;throw e;}
  }};
  const done=await Promise.allSettled(Array.from({length:Math.min(limit,rows.length)},pump));
  const error=done.find(y=>y.status==='rejected');
  if(error)throw error.reason;
  if(results.length!==rows.length)throw Error('worker barrier incomplete');
  const by=new Map(results.map(x=>[x.path,x]));
  for(const row of rows){
    const x=by.get(row.path);
    if(!x||x.source_sha1!==row.blob_sha1||x.local_reopen_sha1!==row.blob_sha1||
      !['NEW_WRITE','IDENTICAL_REOPEN','TRANSIENT_LOCAL_RETRY'].includes(x.recovery)||
      !Number.isInteger(x.attempts)||x.attempts<1||x.attempts>2)throw Error('C67 local worker evidence invalid');
  }
  return rows.map(row=>Object.freeze(by.get(row.path)));
}

/**
 * C65: Normalize only the existing pinned GitHub API file-read response.
 * readPinnedFile is a callable HOST edge, not a Node network fallback.
 * This closure cannot attest that the host supplied a genuine connector.
 */
export function createC65PinnedGitHubSource(readPinnedFile){
  if(typeof readPinnedFile!=='function')throw Error('callable GitHub API host read required');
  return async function fetchPinnedObject(request){
    const {sourceHead,path:rel,blob_sha1:expected}=request||{};
    if(!HEX40.test(String(sourceHead||''))||!SAFE.test(String(rel||''))||!HEX40.test(String(expected||'')))throw Error('pinned source request invalid');
    const args=Object.freeze({repository_full_name:'Luke883i/iKant_EDU',path:rel,ref:sourceHead,encoding:'base64'});
    const got=await readPinnedFile(args);
    const value=got?.result??got;
    const pinnedUrl='https://github.com/Luke883i/iKant_EDU/blob/'+sourceHead+'/'+rel;
    if(value?.sha!==expected||value?.encoding!=='base64'||value?.display_url!==pinnedUrl)throw c66TypedFailure('INTEGRITY_CONTRADICTION');
    const bytes=decode(value?.content);
    if(blob(bytes)!==expected)throw c66TypedFailure('INTEGRITY_CONTRADICTION');
    return {path:rel,blob_sha1:expected,content_base64:bytes.toString('base64'),
      source_object_identity:pinnedUrl+'#'+expected};
  };
}

/**
 * A projection of actual C61 relay observations and local readbacks.
 * The digest is a change detector, NOT an owner seal or native-host proof.
 */
function projectC65SourceSink({owner,workspace,sourceHead,preacceptHandoff,manifest,observations,ownerResult}){
  if(manifest?.object_count!==8||observations?.length!==8)throw Error('C65 expected 8 owner observations');
  const objects=manifest.objects.map(m=>{
    const o=observations.find(x=>x.object_path===m.path);
    const v=owner.validateCanonicalRelayObservation(o,{workspace,sourceHead,preacceptHandoff,relayManifest:manifest});
    if(!o||!v.ok||o.source_sha256!==o.local_readback_sha256||o.source_blob_sha1!==m.blob_sha1||o.local_blob_sha1!==m.blob_sha1)throw Error('C65 owner relay observation invalid: '+m.path);
    return {path:m.path,source_blob_sha1:m.blob_sha1,source_sha256:o.source_sha256,
      local_readback_sha256:o.local_readback_sha256,
      owner_observation_receipt_sha256:o.receipt_sha256,
      source_object_identity_claim:o.source_object_identity,
      local_object_id:o.local_object_id};
  });
  const body={schema:'ikant-le-c65-source-sink-projection/v1',source_head:sourceHead,
    runtime_root_sha256:manifest.runtime_root_sha256,
    owner_manifest_receipt_sha256:manifest.receipt_sha256,
    owner_result_receipt_sha256:ownerResult.receipt_sha256,
    object_count:objects.length,objects,
    local_reopen_verified:true,github_host_fetch_proven:false,
    host_native_delivery_proven:false,active_authority_claim:false,authority:0};
  return {...body,projection_sha256:sha256(Buffer.from(JSON.stringify(body)))};
}

export function validateC65SourceSinkProjection(value,{sourceHead,preacceptHandoff}={}){
  const errors=[];
  let expected=null;
  try{
    const x={sourceHead,humanInput:'I ACCEPT',preacceptHandoff,
      acceptanceObservedMonotonicMs:performance.now()};
    expected=inspectFrozen(x).rows;
  }catch{errors.push('frozen_source');}
  if(value?.schema!=='ikant-le-c65-source-sink-projection/v1'||value?.source_head!==sourceHead||
    value?.object_count!==8||!Array.isArray(value?.objects)||value.objects.length!==8||
    value?.authority!==0||value?.active_authority_claim!==false||
    value?.github_host_fetch_proven!==false||value?.host_native_delivery_proven!==false||
    value?.local_reopen_verified!==true)errors.push('projection_scope');
  const hex64=x=>/^[0-9a-f]{64}$/.test(String(x||''));
  if(!hex64(value?.owner_manifest_receipt_sha256)||!hex64(value?.owner_result_receipt_sha256)||
    !hex64(value?.runtime_root_sha256))errors.push('owner_binding');
  const rows=Array.isArray(value?.objects)?value.objects:[],seen=new Set();
  for(let i=0;i<rows.length;i++){
    const o=rows[i],ref=expected?.[i];
    if(!o||!ref||seen.has(o.path)||o.path!==ref.path||o.source_blob_sha1!==ref.blob_sha1||
       !hex64(o.source_sha256)||o.source_sha256!==o.local_readback_sha256||
       !hex64(o.owner_observation_receipt_sha256)||
       !String(o.source_object_identity_claim||'').trim()||
       !String(o.local_object_id||'').trim())errors.push('object:'+i);
    seen.add(o?.path);
  }
  if(!hex64(value?.projection_sha256))errors.push('digest_format');
  else {
    const {projection_sha256,...body}=value;
    if(sha256(Buffer.from(JSON.stringify(body)))!==projection_sha256)errors.push('projection_digest');
  }
  return {ok:errors.length===0,errors:[...new Set(errors)]};
}

/**
 * Host transports *pinned GitHub API* source bytes to this zero-authority sink adapter.
 * The existing C61/C59 owner alone derives receipts, materializes and claims ACTIVE.
 * No host-native routing, persistence, UI or delivery claim is implied.
 */
export async function executeC63HostBridge(x){
  const v=inspect(x);
  if(typeof x.sessionRoot!=='string'||!path.isAbsolute(x.sessionRoot))throw Error('absolute session root required');
  const root=path.resolve(x.sessionRoot);
  if(!fs.existsSync(root)||!fs.statSync(root).isDirectory())throw Error('existing session root required');
  for(let d=root;;d=path.dirname(d)){
    if(fs.lstatSync(d).isSymbolicLink())throw Error('symlink root forbidden');
    if(d===path.dirname(d))break;
  }
  if(fs.existsSync(path.join(root,'runtime')))throw Error('runtime sink exists');
  const stage=fs.mkdtempSync(path.join(root,'.c63-stage-')),cold=path.join(stage,'cold');
  fs.mkdirSync(cold);
  try{
    write(cold,'BOOTSTRAP.json',v.bootBytes,blob(v.bootBytes));
    const loader=v.rows[0];
    write(cold,loader.path,v.bytes.get(loader.path).data,loader.blob_sha1);
    const owner=await import(pathToFileURL(path.join(cold,loader.path)).href);
    const manifest=owner.issueCanonicalRelayManifest({
      workspace:cold,sourceHead:x.sourceHead,preacceptHandoff:x.preacceptHandoff,
      humanInput:x.humanInput,acceptanceObservedMonotonicMs:x.acceptanceObservedMonotonicMs,
      observedMonotonicMs:performance.now()
    });
    if(manifest.object_count!==8||JSON.stringify(manifest.objects.map(z=>z.path))!==JSON.stringify(v.rows.map(z=>z.path)))throw Error('owner manifest divergence');
    if(x._ownerEvidenceSink) x._ownerEvidenceSink(Object.freeze({edge:'SOURCE_SNAPSHOT',owner_receipt_sha256:manifest.receipt_sha256}));
    const workerReadbacks=await fanout(cold,v.rows.slice(1),v.bytes,x.runnerCount??4);
    const observations=manifest.objects.map(row=>owner.issueCanonicalRelayObservation({
      workspace:cold,sourceHead:x.sourceHead,preacceptHandoff:x.preacceptHandoff,relayManifest:manifest,
      objectPath:row.path,sourceBytes:v.bytes.get(row.path).data,
      sourceObjectIdentity:v.bytes.get(row.path).identity,localObjectId:'c63-stage:'+row.path,
      observedMonotonicMs:performance.now()
    }));
    if(x._ownerEvidenceSink) x._ownerEvidenceSink(Object.freeze({edge:'LOCAL_INGRESS',owner_receipt_sha256:manifest.receipt_sha256,
      observation_receipts_sha256:Object.freeze(observations.map(z=>z.receipt_sha256))}));
    // A host observer can interrupt but cannot erase a physical post-observation mismatch.
    for(const row of manifest.objects){const opened=fs.readFileSync(path.join(cold,row.path));
      if(blob(opened)!==row.blob_sha1)throw c66TypedFailure('INTEGRITY_CONTRADICTION');}
    const result=await owner.executeCanonicalColdBootstrap({
      workspace:cold,sink:path.join(root,'runtime'),sourceHead:x.sourceHead,preacceptHandoff:x.preacceptHandoff,
      relayManifest:manifest,relayObservations:observations,humanInput:x.humanInput,
      acceptanceObservedMonotonicMs:x.acceptanceObservedMonotonicMs
    });
    if(result.active!==true||result.canonical_active_readback?.ok!==true)throw Error('canonical ACTIVE readback missing');
    const sourceSinkProjection=projectC65SourceSink({owner,workspace:cold,sourceHead:x.sourceHead,
      preacceptHandoff:x.preacceptHandoff,manifest,observations,ownerResult:result});
    const checked=validateC65SourceSinkProjection(sourceSinkProjection,{sourceHead:x.sourceHead,preacceptHandoff:x.preacceptHandoff});
    if(!checked.ok)throw Error('C65 source-sink projection invalid: '+checked.errors.join(','));
    return{schema:'ikant-le-c63-host-byte-bridge/v1',source_head:x.sourceHead,
      runtime_root_sha256:result.runtime_root_sha256,source_plane:'GITHUB_API',byte_path:'VERIFIED_OPAQUE_RELAY',
      runner_kind:'NODE_WORKER_THREADS',runner_count:Math.min(x.runnerCount??4,7),verified_object_count:8,
      owner_active_readback:result.canonical_active_readback,owner_result_receipt_sha256:result.receipt_sha256,
      source_sink_projection:sourceSinkProjection,
      local_worker_recovery:{schema:'ikant-le-c67-local-worker-recovery/v1',
        scope:'C61_MANIFEST_BOUND_LOCAL_RELAY_ONLY',carrier_retry_count:0,
        acceptance_reentry_count:0,owner_manifest_receipt_sha256:manifest.receipt_sha256,
        object_count:workerReadbacks.length,objects:workerReadbacks,
        authority:0},authority:0};
  }finally{fs.rmSync(stage,{recursive:true,force:true});}
}

/**
 * C64 host ingress: call at the *observed* I ACCEPT event, before source fetch.
 * A callback transports the existing pinned GitHub API base64 source objects;
 * this adapter does not implement a second carrier, clock or runtime owner.
 * The host must separately attest that humanInput is a real ingress event.
 */
export async function executeC63AtAcceptance(x={}){
  if(!x||typeof x!=='object'||Object.hasOwn(x,'sourceObjects')||Object.hasOwn(x,'acceptanceObservedMonotonicMs'))throw Error('retrospective acceptance/source injection forbidden');
  if(x.humanInput!=='I ACCEPT')throw Error('exact I ACCEPT required');
  if(typeof x.fetchPinnedObject!=='function')throw Error('pinned GitHub API callback required');
  const acceptanceObservedMonotonicMs=performance.now();
  const base={sourceHead:x.sourceHead,humanInput:x.humanInput,
    preacceptHandoff:x.preacceptHandoff,runnerCount:x.runnerCount,
    acceptanceObservedMonotonicMs};
  const {rows}=inspectFrozen(base);
  const settled=await Promise.allSettled(rows.map(async row=>{
    let response;
    try {response=await x.fetchPinnedObject(Object.freeze({sourceHead:x.sourceHead,path:row.path,blob_sha1:row.blob_sha1}));}
    catch(error){throw error?.[C66_FAILURE_KIND]?error:c66TypedFailure('SOURCE_OR_INGRESS_UNAVAILABLE');}
    if(!response||response.path!==row.path||response.blob_sha1!==row.blob_sha1)throw c66TypedFailure('INTEGRITY_CONTRADICTION');
    if(typeof response.content_base64!=='string'||!String(response.source_object_identity||'').trim())throw c66TypedFailure('SOURCE_OR_INGRESS_UNAVAILABLE');
    return {path:row.path,blob_sha1:row.blob_sha1,
      content_base64:response.content_base64,source_object_identity:response.source_object_identity};
  }));
  const failure=settled.find(r=>r.status==='rejected');
  if(failure)throw failure.reason;
  return executeC63HostBridge({
    sourceHead:x.sourceHead,humanInput:x.humanInput,
    preacceptHandoff:x.preacceptHandoff,sessionRoot:x.sessionRoot,
    runnerCount:x.runnerCount,acceptanceObservedMonotonicMs,
    sourceObjects:settled.map(r=>r.value),_ownerEvidenceSink:x._ownerEvidenceSink
  });
}


/**
 * C66: failed canonical activation is an evidence-backed *projection*, never a
 * second ACTIVE issuer, runtime status writer, or automatic carrier retry.
 * The only positive milestones are emitted at C61 owner-controlled boundaries.
 */
const C66_HEX64=/^[a-f0-9]{64}$/;
function c66FailureClass(error){
  return error?.[C66_FAILURE_KIND]||'UNCLASSIFIED_FAILURE';
}
function c66Project({evidence,blockedIntegrity=false,active=false}){
  const ownerManifest=evidence.find(x=>x.edge==='SOURCE_SNAPSHOT');
  const ingress=evidence.find(x=>x.edge==='LOCAL_INGRESS');
  const inputs={accepted:true,source_snapshot:!!ownerManifest,
    local_ingress:!!ownerManifest&&!!ingress,
    materialized_reopened:active,executed_provenance:active,runtime_bound:active,
    writer:active,active_readback:active,blocked_integrity:blockedIntegrity};
  const tier=deriveActivationServiceTier(inputs),v=validateActivationServiceTier(tier);
  if(!v.ok)throw Error('repository availability projection invalid: '+v.errors.join(','));
  return tier;
}
function c66ValidateMilestone(evidence,m){
  if(m?.edge==='SOURCE_SNAPSHOT'&&evidence.length===0&&C66_HEX64.test(String(m.owner_receipt_sha256||'')))return true;
  if(m?.edge==='LOCAL_INGRESS'&&evidence.length===1&&evidence[0].edge==='SOURCE_SNAPSHOT'&&
    m.owner_receipt_sha256===evidence[0].owner_receipt_sha256&&
    Array.isArray(m.observation_receipts_sha256)&&m.observation_receipts_sha256.length===8&&
    new Set(m.observation_receipts_sha256).size===8&&m.observation_receipts_sha256.every(x=>C66_HEX64.test(String(x))))return true;
  return false;
}
function c66RetryGate(){
  return {automatic_attempts:0,same_evidence_retry_forbidden:true,
    owner_authorized_retry_observed:false,disposition:'STOP_AWAIT_OWNER_AUTHORIZED_CHANGED_EVIDENCE'};
}

/**
 * C66 preferred evidence-qualified host entry. Must be invoked only at
 * the actual acceptance ingress, with a host-observed event. Host-provided
 * observer may interrupt execution, never inject or promote a milestone.
 */
export async function executeC66QualifiedAtAcceptance(x={}){
  const evidence=[];
  const onEvidence=m=>{
    if(!c66ValidateMilestone(evidence,m))throw c66TypedFailure('INTEGRITY_CONTRADICTION');
    const safe=Object.freeze({edge:m.edge,owner_receipt_sha256:m.owner_receipt_sha256,
      ...(m.edge==='LOCAL_INGRESS'?{observation_receipts_sha256:Object.freeze([...m.observation_receipts_sha256])}:{})});
    evidence.push(safe);
    if(typeof x.onOwnerMilestone==='function')x.onOwnerMilestone(safe);
  };
  try{
    if(Object.hasOwn(x,'_ownerEvidenceSink'))throw Error('owner milestone injection forbidden');
    const {onOwnerMilestone,...args}=x;
    const result=await executeC63AtAcceptance({...args,_ownerEvidenceSink:onEvidence});
    if(result?.owner_active_readback?.ok!==true||result.owner_active_readback.state!=='ACTIVE'||
      result.owner_active_readback.composition_authority!=='C59_CANONICAL')throw Error('canonical ACTIVE readback missing');
    const tier=c66Project({evidence,active:true});
    return {schema:'ikant-le-c66-qualified-activation/v1',outcome:'ACTIVE',
      source_head:x.sourceHead,active:true,active_readback_verified:true,
      strongest_valid_prefix:tier.strongest_valid_prefix,first_unclosed_edge:null,
      available_capabilities:tier.capabilities,owner_evidence:evidence,
      retry_gate:c66RetryGate(),canonical_result:result,authority:0};
  }catch(error){
    const failure_class=c66FailureClass(error),blocked=failure_class==='INTEGRITY_CONTRADICTION';
    const tier=c66Project({evidence,blockedIntegrity:blocked});
    return {schema:'ikant-le-c66-qualified-activation/v1',outcome:blocked?'BLOCKED_INTEGRITY':'NON_ACTIVE',
      source_head:typeof x?.sourceHead==='string'?x.sourceHead:null,
      active:false,active_readback_verified:false,verified_host_acceptance:false,
      verified_native_github_ingress:false,host_native_delivery_proven:false,
      strongest_valid_prefix:tier.tier,first_unclosed_edge:tier.first_unclosed_edge,
      fault_overlay:tier.fault_overlay,available_capabilities:tier.capabilities,
      owner_evidence:evidence,failure_class,retry_gate:c66RetryGate(),
      canonical_result:null,authority:0};
  }
}


/**
 * C68: expose the existing C64/C66 entrypoint to a REAL host message ingress.
 * The host MUST register the listener before the user sends I ACCEPT.
 * Local callback registration is not evidence of a native ChatGPT edge.
 * This adapter never issues an acceptance-origin ticket or runtime event id.
 */
const C68_SCHEMA='ikant-le-c68-host-ingress-projection/v1';
function c68Projection(status,extra={}){
  return Object.freeze({schema:C68_SCHEMA,status,authority:0,
    canonical_owner_unchanged:true,origin_ticket_issued:false,
    host_native_event_attested:false,runtime_event_id_issued:false,...extra});
}
export function registerC68AcceptanceIngress(x={}){
  if(Object.hasOwn(x,'humanInput')||Object.hasOwn(x,'acceptanceObservedMonotonicMs')||
     Object.hasOwn(x,'sourceObjects')||Object.hasOwn(x,'nativeEventId'))
    throw Error('C68 caller-injected acceptance origin forbidden');
  // A source function or local Node executor is not a human-message ingress.
  if(typeof x.registerHostMessage!=='function')
    return c68Projection('HOST_EDGE_NOT_CALLABLE',{first_unclosed_edge:'HOST_MESSAGE_INGRESS',
      required_host_capability:'REGISTER_PREACCEPT_NATIVE_USER_MESSAGE_LISTENER'});
  let armed=false,consumed=false;
  const onMessage=(event)=>{
    if(!armed)return Promise.resolve(c68Projection('NOT_ARMED'));
    if(consumed)return Promise.resolve(c68Projection('ACCEPTANCE_ALREADY_CONSUMED'));
    if(event?.role!=='user'||event?.content!=='I ACCEPT')
      return Promise.resolve(c68Projection('NOT_EXACT_HUMAN_ACCEPTANCE'));
    // Do not turn a plain transcript string into a canonical event identity.
    consumed=true;
    if(typeof event.event_id!=='string'||!event.event_id.trim())
      return Promise.resolve(c68Projection('HOST_EVENT_ID_UNVERIFIED',{
        first_unclosed_edge:'HOST_ACCEPTANCE_EVENT_IDENTITY',
        required_host_capability:'NATIVE_MESSAGE_ID_AT_ORIGINAL_INGRESS'}));
    // There must be no async scheduling before C64 captures its monotonic
    // acceptance observation. C64 remains the sole acceptance clock writer.
    const start=performance.now();
    return executeC66QualifiedAtAcceptance({
      sourceHead:x.sourceHead,preacceptHandoff:x.preacceptHandoff,
      sessionRoot:x.sessionRoot,runnerCount:x.runnerCount,
      fetchPinnedObject:x.fetchPinnedObject,onOwnerMilestone:x.onOwnerMilestone,
      humanInput:event.content
    }).then(result=>c68Projection('CANONICAL_OWNER_RETURNED',{
      source_head:x.sourceHead,host_event_id_claim:event.event_id,
      hook_callback_monotonic_ms:start,
      event_identity_issuer:'HOST_NATIVE_MESSAGE_LAYER_UNVERIFIED',
      canonical_result:result,
      first_unclosed_edge:result.first_unclosed_edge??null
    }));
  };
  let unregister;
  try{unregister=x.registerHostMessage(onMessage);}
  catch{return c68Projection('HOST_REGISTRATION_FAILED',{
    first_unclosed_edge:'HOST_MESSAGE_INGRESS',required_host_capability:'CALLABLE_HOST_MESSAGE_REGISTRATION'});}
  if(typeof unregister!=='function')
    return c68Projection('HOST_REGISTRATION_UNVERIFIED',{
      first_unclosed_edge:'HOST_MESSAGE_INGRESS',required_host_capability:'REVOCABLE_HOST_MESSAGE_LISTENER'});
  armed=true;
  return Object.freeze({
    ...c68Projection('CALLBACK_REGISTERED',{
      // A registration receipt says nothing about the native origin of events.
      registration_only:true,first_unclosed_edge:'HOST_ACCEPTANCE_EVENT_IDENTITY',
      required_host_capability:'ORIGINAL_HOST_MESSAGE_EVENT_IDENTITY'
    }),
    close:()=>{armed=false;unregister();}
  });
}

export function validateC63Input(x){
  try{return{ok:true,objects:inspect(x).bytes.size};}
  catch(e){return{ok:false,error:String(e.message||e)};}
}
