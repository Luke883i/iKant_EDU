/** K1 original-source bound adapter, authority=0, PRE-OWNER ONLY.
 * The K0 effect decision is called (not merely documented). K1 invokes
 * the original H1 source-preparation routine; C72/E16 are NEVER invoked.
 * A local Node subprocess proves same-machine independent readback.
 * No source-origin, provider installation, human-event or product claims.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash,randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {isProxy} from 'node:util/types';
import {decideK0Effect,K0_SCHEMA} from './project-host-effect-decision.mjs';
import {prepareH1OriginalSources,H1_FILES,H1_SEED,H1_TRANSIT,H1_SCHEMA} from './project-edu-h1-bound-port.mjs';

export const K1_SCHEMA='ikant-host-k1-original-source-preowner/v1';
export const K1_ORIGINAL_PATHS=Object.freeze([...H1_FILES,H1_TRANSIT,H1_SEED]);
const HEAD=/^[0-9a-f]{40}$/u;
const INSTALLED=Object.freeze([
 'host/project-edu-h1-bound-port.mjs',
 'host/project-c72-e16-unified-ingress.mjs',
 'host/project-c72-coldstart-seed.mjs',
 'host/project-c72-transport-frontier.mjs',
 'host/project-c72-negative-entry.mjs',
 'host/project-oneshell-irred-e15.mjs',
 'host/project-c72-receipt-transit.mjs',
 'host/project-c72-postaccept-reentry.mjs',
 'host/c72-public-mode-admission.mjs',
 'contracts/c72-public-mode-admission-v2.json'
]);
const gitBlob=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
const stop=edge=>Object.freeze({ok:false,kind:'STOP',edge,authority:0,
 original_owner_invoked:false,source_origin_attested:false,provider_installation_attested:false,
 native_event_attested:false,native_delivery_attested:false,active:false});
const plain=x=>{try{return !!x&&typeof x==='object'&&!Array.isArray(x)&&!isProxy(x)&&Object.getPrototypeOf(x)===Object.prototype&&Reflect.ownKeys(x).every(k=>typeof k==='string'&&Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));}catch{return false;}};
const here=path.dirname(fileURLToPath(import.meta.url));
function independentReadback(stageDirectory,expected,seedFile){
 const script=String.raw`
 const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
 const {dir,expected,seed}=JSON.parse(process.argv[1]);let count=0;
 const git=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
 for(const [p,sha] of Object.entries(expected)){
  const f=path.join(dir,p),s=fs.lstatSync(f);
  if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||(s.mode&0o077)!==0)process.exit(40);
  if(git(fs.readFileSync(f))!==sha)process.exit(41);
  count++;
 }
 const installed=fs.readFileSync(seed);
 if(git(installed)!==process.env.K1_SEED_SHA)process.exit(42);
 process.stdout.write(JSON.stringify({ok:true,checked:count,seed_ok:true,sha256:crypto.createHash('sha256').update(installed).digest('hex')}));
`;
 const stdout=execFileSync(process.execPath,['-e',script,JSON.stringify({dir:stageDirectory,expected,seed:seedFile})],{
  timeout:15000,maxBuffer:65536,encoding:'utf8',
  env:{...process.env,K1_SEED_SHA:gitBlob(fs.readFileSync(seedFile))}});
 const o=JSON.parse(stdout);
 if(o.ok!==true||o.checked!==9||o.seed_ok!==true)return null;
 return o;
}
function localChallenge(root){
 const dir=fs.mkdtempSync(path.join(root,'k1-probe-'));fs.chmodSync(dir,0o700);
 const file=path.join(dir,'challenge');
 const token=randomBytes(32),fd=fs.openSync(file,'wx',0o600);
 try{fs.writeSync(fd,token);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 const script="const fs=require('node:fs'),crypto=require('node:crypto');const b=fs.readFileSync(process.argv[1]);process.stdout.write(crypto.createHash('sha256').update(b).digest('hex'))";
 const expected=createHash('sha256').update(token).digest('hex');
 try{
  const read=execFileSync(process.execPath,['-e',script,file],{encoding:'utf8',timeout:15000});
  if(read!==expected)throw Error('K1_CHALLENGE_MISMATCH');
  return {ok:true,kind:'LOCAL_NODE_SUBPROCESS_PROBE_ONLY',sha256:expected};
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
/** Physical pre-owner source preparation. The only positive result is
 * LOCAL_SOURCE_PREPARED, NEVER DEPLOYMENT_PASS or OWNER_READY.
 * readMain/readCommit/readTree/readPinned MUST be bound to a real source
 * provider by the caller; checkout-backed fixtures are SOFTWARE proof only.
 */
export async function runK1PreOwner(q,port={}){
 if(!plain(q)||q.schema!==K1_SCHEMA||q.phase!=='POST_ACCEPT'||q.requestedCarrier!=='SAME_NODE_CALLBACKS')
  return stop('K1_PROFILE_OR_CARRIER_UNBOUND');
 if(!plain(port)||['readMain','readCommit','readTree','readPinned'].some(k=>typeof port[k]!=='function'))
  return stop('K1_SOURCE_CALLBACKS_UNBOUND');
 if(typeof port.privateRoot!=='string'||!path.isAbsolute(port.privateRoot))
  return stop('K1_PRIVATE_ROOT_REQUIRED');
 let root;
 try{
  root=fs.realpathSync(port.privateRoot);
  const st=fs.lstatSync(root);
  if(root!==path.resolve(port.privateRoot)||!st.isDirectory()||st.isSymbolicLink()||
     (st.mode&0o077)!==0||(process.getuid&&st.uid!==process.getuid()))
   return stop('K1_PRIVATE_ROOT_UNSAFE');
 }catch{return stop('K1_PRIVATE_ROOT_UNSAFE');}
 const req={...q,schema:K0_SCHEMA,phase:'POST_ACCEPT'};
 const pair={
  probe:async()=>localChallenge(root),
  invoke:async()=>prepareH1OriginalSources({...req,schema:H1_SCHEMA},port)
 };
 const decision=decideK0Effect(req,{SAME_NODE_CALLBACKS:pair});
 if(decision.kind!=='PROBE_REQUIRED')return stop(decision.first_edge||'K0_PREOWNER_GATE_DENIED');
 let prepared;
 try{
  const challenge=await pair.probe();
  if(challenge.ok!==true)return stop('K1_SAME_TARGET_CHALLENGE_FAILED');
  // The original H1 implementation reopens the HEAD TREE and validates
  // all ten path-to-byte identities and the pinned E16 BOOTSTRAP carrier.
  prepared=await pair.invoke();
  if(prepared.ok!==true)return stop(prepared.edge||'K1_H1_SOURCE_PREPARE_FAILED');
  if(prepared.verified_file_count!==9||!HEAD.test(prepared.seedBlobSha1||''))
   return stop('K1_H1_SOURCE_SET_INCOMPLETE');
  const tree=await port.readCommit({ref:q.sourceHead});
  if(tree?.sha!==q.sourceHead||!HEAD.test(tree?.tree?.sha||''))
   return stop('K1_INSTALLED_CLOSURE_COMMIT_MISMATCH');
  const t=await port.readTree({sha:tree.tree.sha,recursive:true});
  if(t?.sha!==tree.tree.sha||t.truncated!==false||!Array.isArray(t.tree))
   return stop('K1_INSTALLED_CLOSURE_TREE_MISMATCH');
  const entries=new Map(t.tree.filter(x=>x.type==='blob').map(x=>[x.path,x.sha]));
  if(entries.size!==t.tree.filter(x=>x.type==='blob').length)
   return stop('K1_INSTALLED_CLOSURE_DUPLICATE_PATH');
  for(const p of INSTALLED){
   const expected=entries.get(p);
   const file=path.resolve(here,'..',p);
   if(!HEAD.test(expected||'')||!fs.existsSync(file)||gitBlob(fs.readFileSync(file))!==expected)
    return stop('K1_INSTALLED_CLOSURE_MISMATCH:'+p);
  }
  const seed=path.resolve(here,'..',H1_SEED);
  if(gitBlob(fs.readFileSync(seed))!==prepared.seedBlobSha1)
   return stop('K1_INSTALLED_SEED_MISMATCH');
  const expected={...prepared.expectedBlobShas,[H1_TRANSIT]:prepared.transitBlobSha1};
  const physical=independentReadback(prepared.stageDirectory,expected,seed);
  if(!physical)return stop('K1_INDEPENDENT_SUBPROCESS_READBACK_FAILED');
  // Source-origin and provider installation require *external* platform
  // proof; source integrity and a Node subprocess do not supply it.
  return Object.freeze({ok:true,kind:'LOCAL_SOURCE_PREPARED',schema:K1_SCHEMA,
   carrier:'SAME_NODE_CALLBACKS',source_head:q.sourceHead,
   stageDirectory:prepared.stageDirectory,transitDirectory:prepared.transitDirectory,
   verified_original_blobs:10,staged_source_files:9,seed_verified:true,
   installed_closure_files:INSTALLED.length,independent_node_process_readback:true,
   original_owner_invoked:false,authority:0,active:false,
   source_origin_attested:false,provider_installation_attested:false,
   native_event_attested:false,native_delivery_attested:false,
   proof_scope:'LOCAL_CHECKOUT_OR_BOUND_CALLBACKS_NOT_PROVIDER_ATTESTATION',
   edge:'K1_PROVIDER_TOOL_ID_AND_FIELD_INSTALLATION_UNATTESTED'});
 }catch(e){return stop('K1_PREOWNER_EXECUTION_UNKNOWN:'+String(e?.code||e?.message||'UNKNOWN').slice(0,80).replace(/[^A-Za-z0-9_:-]/g,'_'));}
 // The returned stage is preserved for independent inspection; owner
 // invocation is forbidden here. An unknown write must not be retried blindly.
}
