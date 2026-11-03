import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {storeBootstrapCache,reopenBootstrapCache,reconcileC72Original,materializeD123WithOriginalLoader} from '../scripts/project-bootstrap-d123.mjs';
const H='a'.repeat(40),T='b'.repeat(40),DRIFT='c'.repeat(40);
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const top=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function sandbox(fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-d123-'));
 fs.mkdirSync(path.join(dir,'cache'),{mode:0o700});fs.mkdirSync(path.join(dir,'transit'),{mode:0o700});
 return Promise.resolve().then(()=>fn({dir,cacheRoot:path.join(dir,'cache'),transit:path.join(dir,'transit'),destination:path.join(dir,'source')}))
  .finally(()=>fs.rmSync(dir,{recursive:true,force:true}));}
const e=b=>({path:'TERMS.md',sha:sha(b)});
const args=(s,b)=>({cacheRoot:s.cacheRoot,head:H,tree:T,liveHead:H,entry:e(b)});
test('D1 full physical 0700/0600 cache, readback and idempotent exact-hit',()=>sandbox(s=>{
 const b=Buffer.from('verified original candidate bytes');const q=args(s,b);
 assert.equal(storeBootstrapCache({...q,bytes:b}).status,'STORED_REOPENED');
 assert.equal(storeBootstrapCache({...q,bytes:b}).written,0);
 const files=fs.readdirSync(s.cacheRoot);assert.equal(files.length,1);
 assert.equal(fs.statSync(s.cacheRoot).mode&0o777,0o700);
 assert.equal(fs.statSync(path.join(s.cacheRoot,files[0])).mode&0o777,0o600);
 assert.deepEqual(reopenBootstrapCache(q).bytes,b);
}));
test('D1 corruption, stale source, forged hash, symlink and unsafe permissions stop',()=>sandbox(s=>{
 const b=Buffer.from('immutably bound bytes'),q=args(s,b);
 storeBootstrapCache({...q,bytes:b});const loc=path.join(s.cacheRoot,fs.readdirSync(s.cacheRoot)[0]);
 assert.throws(()=>reopenBootstrapCache({...q,liveHead:DRIFT}),/SOURCE_LOCK_STALE/);
 assert.equal(reopenBootstrapCache({...q,tree:DRIFT}).status,'MISS');
 assert.throws(()=>storeBootstrapCache({...q,entry:{path:'TERMS.md',sha:DRIFT},bytes:b}),/D1_SOURCE_BLOB_INVALID/);
 const original=fs.readFileSync(loc);
 fs.chmodSync(loc,0o644);assert.throws(()=>reopenBootstrapCache(q),/PRIVATE_FILE_UNSAFE/);fs.chmodSync(loc,0o600);
 fs.renameSync(loc,loc+'.data');fs.symlinkSync(loc+'.data',loc);
 assert.throws(()=>reopenBootstrapCache(q),/PRIVATE_FILE_UNSAFE/);
 fs.unlinkSync(loc);fs.renameSync(loc+'.data',loc);fs.writeFileSync(loc,original);
 fs.chmodSync(s.cacheRoot,0o755);assert.throws(()=>reopenBootstrapCache(q),/PRIVATE_ROOT_UNSAFE/);
}));
test('D1: 256 independent physical mutations never permit a cache hit',()=>sandbox(s=>{
 const b=Buffer.from('long original bytes '.repeat(60)),q=args(s,b);
 storeBootstrapCache({...q,bytes:b});const loc=path.join(s.cacheRoot,fs.readdirSync(s.cacheRoot)[0]);const baseline=fs.readFileSync(loc);
 for(let i=0;i<256;i++){const m=Buffer.from(baseline);m[20+i%(m.length-20)]^=1+i%251;fs.writeFileSync(loc,m);
  assert.throws(()=>reopenBootstrapCache(q));}
 fs.writeFileSync(loc,baseline);assert.equal(reopenBootstrapCache(q).status,'HIT_REOPENED');
}));
test('D2 absent original transit remains PREOWNER_ONLY; unknown attempt forbids replay',()=>sandbox(async s=>{
 const q={directory:s.transit,head:H,tree:T,liveHead:H};
 assert.equal((await reconcileC72Original(q)).status,'PREOWNER_ONLY');
 const file=path.join(s.transit,'c72-original-accept-attempt.json');fs.writeFileSync(file,'{"fixture":true}\n',{flag:'wx',mode:0o600});
 const r=await reconcileC72Original(q);assert.equal(r.status,'RECONCILE_NO_REPLAY');
 assert.equal(r.next,'STOP_NO_OWNER_REPLAY');assert.equal(r.owner_invoked,false);
 assert.equal(fs.readdirSync(s.transit).length,1);
 assert.rejects(reconcileC72Original({...q,liveHead:DRIFT}),/SOURCE_LOCK_STALE/);
}));
test('D2 receipt without attempt, unsafe and symlink receipt fail closed',()=>sandbox(async s=>{
 const q={directory:s.transit,head:H,tree:T,liveHead:H};
 const f=path.join(s.transit,'c72-original-accepted.json');fs.writeFileSync(f,'{"fixture":true}\n',{flag:'wx',mode:0o600});
 await assert.rejects(reconcileC72Original(q),/D2_ACCEPT_FENCE_MISSING/);
 fs.writeFileSync(path.join(s.transit,'c72-original-accept-attempt.json'),'x',{mode:0o600});
 fs.chmodSync(f,0o644);await assert.rejects(reconcileC72Original(q),/D123_PRIVATE_FILE_UNSAFE/);
 fs.chmodSync(f,0o600);fs.renameSync(f,f+'.bak');fs.symlinkSync(f+'.bak',f);
 await assert.rejects(reconcileC72Original(q),/D123_PRIVATE_FILE_UNSAFE/);
}));
const originalAvailable=fs.existsSync(path.join(top,'host/project-c72-receipt-transit.mjs'))&&
 fs.existsSync(path.join(top,'host/c72-public-mode-admission.mjs'));
test('D2 real original owner receipts reopened in two separate Node processes, no replay',
 {skip:!originalAvailable},()=>sandbox(async s=>{
 const owner=await import('../host/c72-public-mode-admission.mjs');
 const transit=await import('../host/project-c72-receipt-transit.mjs');
 const q={directory:s.transit,head:H,tree:T,liveHead:H};
 assert.equal(transit.claimC72TransitAttempt({directory:s.transit,sourceHead:H,phase:'ACCEPT'}).ok,true);
 const offer=owner.issueC72V2LinkedTermsOffer({sourceHead:H,termsDigest:'c'.repeat(64)});
 const accepted=owner.acceptC72V2LinkedTerms({offer,humanMessage:'I ACCEPT',termsLinkPresented:true});
 const intro=owner.presentC72V2Introduction(accepted);
 assert.equal(transit.storeC72Accepted({directory:s.transit,sourceHead:H,accepted,introduction:intro}).ok,true);
 const script='import {reconcileC72Original} from '+JSON.stringify(new URL('../scripts/project-bootstrap-d123.mjs',import.meta.url).href)+';'+
  "const r=await reconcileC72Original({directory:process.argv[1],head:'"+H+"',tree:'"+T+"',liveHead:'"+H+"'});"+
  "console.log(JSON.stringify({status:r.status,edge:r.edge,owner:r.owner_invoked}));";
 const run=()=>JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',script,s.transit],{encoding:'utf8'}));
 assert.equal(run().status,'ACCEPT_ORIGINAL_READBACK_ONLY');
 assert.equal(transit.claimC72TransitAttempt({directory:s.transit,sourceHead:H,phase:'EDU'}).ok,true);
 const sel=owner.selectC72V2Mode({accepted,orientation:intro,humanMessage:'EDU'});
 assert.equal(transit.storeC72Selected({directory:s.transit,sourceHead:H,selection:sel}).ok,true);
 assert.equal(run().status,'EDU_ORIGINAL_READBACK_ONLY');assert.equal(run().owner,false);
 assert.equal(transit.claimC72TransitAttempt({directory:s.transit,sourceHead:H,phase:'EDU'}).ok,false);
}));
test('D3 source request rejects invalid 190-set and drift before any file write',()=>sandbox(async s=>{
 let fetches=0;await assert.rejects(materializeD123WithOriginalLoader({cacheRoot:s.cacheRoot,
 head:H,tree:T,liveHead:DRIFT,treeEntries:[],entries:[],manifestPaths:[],destination:s.destination,
 fetchPinned:async()=>{fetches++;return Buffer.from('no');},readMain:async()=>H}),/SOURCE_LOCK_STALE/);
 assert.equal(fetches,0);assert.equal(fs.existsSync(s.destination),false);
}));
const gitAvailable=fs.existsSync(path.join(top,'.git'))&&fs.existsSync(path.join(top,'scripts/project-repo-loader.mjs'));
test('D1+D3 original Git TREE and original loader: 10 reused, 181 fetched, 191 reopened',
 {skip:!gitAvailable},()=>sandbox(async s=>{
 const git=(...args)=>execFileSync('git',args,{cwd:top,encoding:'utf8'}).trim();
 const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
 const raw=execFileSync('git',['ls-tree','-r','-t','-z','HEAD'],{cwd:top});
 const items=raw.toString('utf8').split('\0').filter(Boolean).map(x=>{
  const m=x.match(/^([0-7]{6}) (blob|tree|commit) ([a-f0-9]{40})\t(.+)$/u);
  if(!m)throw Error('BAD_GIT_TREE_ENTRY');return{mode:m[1],type:m[2],sha:m[3],path:m[4]};});
 const byPath=new Map(items.map(x=>[x.path,x]));
 const manifest=JSON.parse(fs.readFileSync(path.join(top,'contracts/project-session-source.json'),'utf8')).paths;
 assert.equal(manifest.length,190);const entries=manifest.map(p=>({path:p,sha:byPath.get(p).sha}));
 const c72=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
  'contracts/c72-public-mode-admission-v2.json','host/c72-public-mode-admission.mjs',
  'host/project-c72-postaccept-reentry.mjs','host/project-c72-receipt-transit.mjs',
  'host/project-c72-coldstart-seed.mjs'];
 let hitBytes=0;for(const p of c72){const entry={path:p,sha:byPath.get(p).sha},bytes=fs.readFileSync(path.join(top,p));
  hitBytes+=bytes.length;storeBootstrapCache({cacheRoot:s.cacheRoot,head,tree,liveHead:head,entry,bytes});}
 assert.equal(hitBytes,143817);
 let fetches=0;const r=await materializeD123WithOriginalLoader({cacheRoot:s.cacheRoot,head,tree,liveHead:head,
  entries,treeEntries:items,manifestPaths:manifest,destination:s.destination,readMain:async()=>head,
  fetchPinned:async (p)=>{fetches++;return fs.readFileSync(path.join(top,p));}});
 assert.equal(r.status,'ORIGINAL_LOADER_SOURCE_REOPENED');assert.equal(r.original_loader_invoked,true);
 assert.equal(r.reused_files,10);assert.equal(r.fetched_files,181);assert.equal(fetches,181);
 assert.equal(r.fetched_bytes,1984502+7639-143817);
 const original=await import('../scripts/project-repo-loader.mjs');
 const again=original.verifyLocalProjectSource(s.destination,{head,tree});
 assert.equal(again.files.length,191);assert.equal(r.total_original_loader_files,191);
 // The original C72/EDU source remains physically available; no owner is claimed.
 assert.equal(r.original_owner_invoked,false);assert.equal(r.native_provider_attested,false);
}));
test('D123: 4096 deterministically altered paths, heads, sha identifiers fail closed',()=>{
 let seed=20261103,n=0;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 for(let i=0;i<4096;i++){const x=rand().toString(16);
  if(i%2===0)assert.throws(()=>reopenBootstrapCache({cacheRoot:'/does-not-matter',head:x,tree:T,liveHead:x,entry:{path:'TERMS.md',sha:H}}),/SOURCE_LOCK_INVALID/);
  else assert.throws(()=>reopenBootstrapCache({cacheRoot:'/does-not-matter',head:H,tree:T,liveHead:DRIFT,entry:{path:'../'+x,sha:H}}),/SOURCE_LOCK_STALE/);
  n++;
 }assert.equal(n,4096);
});

test('D3 adversarial checkout: 6 prewrite stops for forged remote bytes, manifest, HEAD, TREE, cache and destination',
 {skip:!gitAvailable},()=>sandbox(async s=>{
 const git=(...a)=>execFileSync('git',a,{cwd:top,encoding:'utf8'}).trim();
 const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
 const treeEntries=execFileSync('git',['ls-tree','-r','-t','-z','HEAD'],{cwd:top}).toString('utf8')
  .split('\0').filter(Boolean).map(line=>{const m=line.match(/^([0-7]{6}) (blob|tree|commit) ([a-f0-9]{40})\t(.+)$/u);
   assert.ok(m);return{mode:m[1],type:m[2],sha:m[3],path:m[4]};});
 const treeMap=new Map(treeEntries.map(e=>[e.path,e]));
 const paths=JSON.parse(fs.readFileSync(path.join(top,'contracts/project-session-source.json'),'utf8')).paths;
 const entries=paths.map(p=>({path:p,sha:treeMap.get(p).sha}));
 const ten=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md',
  'contracts/c72-public-mode-admission-v2.json','host/c72-public-mode-admission.mjs',
  'host/project-c72-postaccept-reentry.mjs','host/project-c72-receipt-transit.mjs',
  'host/project-c72-coldstart-seed.mjs'];
 for(const p of ten){storeBootstrapCache({cacheRoot:s.cacheRoot,head,tree,liveHead:head,
  entry:{path:p,sha:treeMap.get(p).sha},bytes:fs.readFileSync(path.join(top,p))});}
 const originalFetch=async p=>fs.readFileSync(path.join(top,p));
 const base={cacheRoot:s.cacheRoot,head,tree,liveHead:head,treeEntries,entries,manifestPaths:paths,
  destination:s.destination,fetchPinned:originalFetch,readMain:async()=>head};
 const firstMiss=paths.find(p=>!ten.includes(p));
 let denied=0;
 await assert.rejects(materializeD123WithOriginalLoader({...base,fetchPinned:async p=>{
  const b=await originalFetch(p);if(p!==firstMiss)return b;const tamper=Buffer.from(b);tamper[0]^=1;return tamper;
 }}),/D3_PINNED_BLOB_INVALID/);assert.equal(fs.existsSync(s.destination),false);denied++;
 await assert.rejects(materializeD123WithOriginalLoader({...base,fetchPinned:async p=>{
  const b=await originalFetch(p);if(p!=='contracts/project-session-source.json')return b;
  return Buffer.concat([b,Buffer.from(' ') ]);
 }}),/D3_MANIFEST_BLOB_INVALID/);assert.equal(fs.existsSync(s.destination),false);denied++;
 let reads=0;await assert.rejects(materializeD123WithOriginalLoader({...base,
  readMain:async()=>++reads===1?head:DRIFT}),/STOP_SOURCE_LOCK_STALE/);
 assert.equal(reads,2);assert.equal(fs.existsSync(s.destination),false);denied++;
 const forged=treeEntries.map(e=>e.path==='README.md'?{...e,sha:DRIFT}:e);
 await assert.rejects(materializeD123WithOriginalLoader({...base,treeEntries:forged}),/D3_TREE_BINDING_INVALID/);
 assert.equal(fs.existsSync(s.destination),false);denied++;
 const filename=path.join(s.cacheRoot,fs.readdirSync(s.cacheRoot)[0]);const original=fs.readFileSync(filename);
 const damaged=Buffer.from(original);damaged[20]^=1;fs.writeFileSync(filename,damaged);
 await assert.rejects(materializeD123WithOriginalLoader(base));assert.equal(fs.existsSync(s.destination),false);denied++;
 fs.writeFileSync(filename,original);
 fs.mkdirSync(s.destination,{mode:0o700});fs.writeFileSync(path.join(s.destination,'PRESERVE'),'fixed');
 await assert.rejects(materializeD123WithOriginalLoader(base),/D3_DESTINATION_NOT_FRESH/);
 assert.equal(fs.readFileSync(path.join(s.destination,'PRESERVE'),'utf8'),'fixed');denied++;
 assert.equal(denied,6);
}));
