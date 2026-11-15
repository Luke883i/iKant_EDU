import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {runK1PreOwner,K1_SCHEMA} from '../host/project-host-k1-preowner.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const git=(...args)=>execFileSync('git',args,{cwd:ROOT,maxBuffer:8_000_000});
const checkoutHead=git('rev-parse','HEAD').toString().trim();
const head=process.env.K1_PINNED_CHECKOUT_SHA||checkoutHead;
const H40=/^[0-9a-f]{40}$/;
const five=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
function callbacks({wrongBytes=false,badTree=false}={}){
 return {
  readMain:async()=>head,
  readCommit:async({ref})=>({sha:ref,tree:{sha:git('rev-parse',ref+'^{tree}').toString().trim()}}),
  readTree:async({sha})=>{
   const raw=git('ls-tree','-r','-z','--full-tree',sha).toString('utf8');
   const tree=raw.split('\0').filter(Boolean).map(x=>{
    const [m,p]=x.split('\t');const [mode,type,object]=m.split(' ');
    return {mode,type,sha:object,path:p};
   });
   if(badTree)tree.find(x=>x.path==='TERMS.md').sha='f'.repeat(40);
   return {sha,truncated:false,tree};
  },
  readPinned:async({path:p,ref})=>{
   const bytes=git('show',ref+':'+p);
   if(wrongBytes&&p==='TERMS.md')bytes[0]^=0x01;
   return {encoding:'base64',content:bytes.toString('base64'),sha:git('rev-parse',ref+':'+p).toString().trim()};
  }
 };
}
function request(){
 const pins=Object.fromEntries(five.map(p=>[p,git('rev-parse',head+':'+p).toString().trim()]));
 const witness={source_head:head,pinned_blob_shas:pins,host_link_displayed:true,
  distinct_human_message_observed:true,terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+head+'/TERMS.md'};
 return {schema:K1_SCHEMA,requestedCarrier:'SAME_NODE_CALLBACKS',
  projectProfile:'PROJECT_EDU_E15',phase:'POST_ACCEPT',sourceHead:head,liveHead:head,
  humanMessage:'I ACCEPT',freshHumanTurn:true,ownerOutcome:'NOT_INVOKED',
  priorTurnEvidence:witness};
}
function withRoot(fn){const root=fs.mkdtempSync(path.join(os.tmpdir(),'k1-verify-'));fs.chmodSync(root,0o700);return Promise.resolve().then(()=>fn(root)).finally(()=>fs.rmSync(root,{recursive:true,force:true}));}
test('K1 real pinned Git source: original H1 10/10, staged 9/9, seed+closure, cross-process readback; NO owner',async()=>{
 assert.ok(H40.test(head),'real Git HEAD must be a commit');
 assert.equal(head,checkoutHead,'pinned SHA must match actual candidate checkout');
 await withRoot(async privateRoot=>{
  const r=await runK1PreOwner(request(),{...callbacks(),privateRoot});
  assert.equal(r.ok,true,JSON.stringify(r));
  assert.equal(r.kind,'LOCAL_SOURCE_PREPARED');
  assert.equal(r.verified_original_blobs,10);
  assert.equal(r.staged_source_files,9);
  assert.equal(r.installed_closure_files,10);
  assert.equal(r.seed_verified,true);
  assert.equal(r.independent_node_process_readback,true);
  for(const v of ['original_owner_invoked','source_origin_attested','provider_installation_attested',
    'native_event_attested','native_delivery_attested','active'])assert.equal(r[v],false,v);
  assert.equal(r.edge,'K1_PROVIDER_TOOL_ID_AND_FIELD_INSTALLATION_UNATTESTED');
  if(process.env.K1_EVIDENCE_JSON){
   const proof={schema:'ikant-k1-checkout-source-evidence/v1',source_head:head,
    evidence_scope:'GITHUB_ACTIONS_CHECKOUT_ONLY_NOT_CHATGPT_PROVIDER',
    original_sources:10,staged_files:9,installed_seed:true,installed_owner_adjacent_files:10,
    independent_subprocess_readback:true,original_owner_invoked:false,provider_installation_attested:false,
    native_human_event_attested:false,git_first_five:request().priorTurnEvidence.pinned_blob_shas,
    first_edge:r.edge};
   fs.writeFileSync(process.env.K1_EVIDENCE_JSON,JSON.stringify(proof,null,2)+'\n',{flag:'wx',mode:0o600});
  }
  for(const [p,ref] of Object.entries(request().priorTurnEvidence.pinned_blob_shas)){
   const b=fs.readFileSync(path.join(r.stageDirectory,p));
   const gitBlob=createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
   assert.equal(gitBlob,ref,p);
  }
  fs.rmSync(r.stageDirectory,{recursive:true});
  fs.rmSync(r.transitDirectory,{recursive:true});
 });
});
test('K1 fail closed for stale head before owner',async()=>withRoot(async root=>{
 const q=request();q.liveHead='b'.repeat(40);
 const r=await runK1PreOwner(q,{...callbacks(),privateRoot:root});
 assert.equal(r.kind,'STOP');assert.equal(r.edge,'STOP_SOURCE_LOCK_STALE');
 assert.equal(r.original_owner_invoked,false);
}));
test('K1 reject same-byte/path SHA swap from independent TREE',async()=>withRoot(async root=>{
 const r=await runK1PreOwner(request(),{...callbacks({badTree:true}),privateRoot:root});
 assert.equal(r.kind,'STOP');assert.match(r.edge,/H1_HEAD_PATH_BLOB_MISMATCH|H1_TREE/);
}));
test('K1 reject a content mutation, even if callback asserts the old blob SHA',async()=>withRoot(async root=>{
 const r=await runK1PreOwner(request(),{...callbacks({wrongBytes:true}),privateRoot:root});
 assert.equal(r.kind,'STOP');assert.match(r.edge,/H1_SOURCE_BLOB_SHA_MISMATCH/);
}));
test('K1 reject a claimed capability with no real callbacks',async()=>withRoot(async root=>{
 const r=await runK1PreOwner(request(),{privateRoot:root,readMain:true,readCommit:true,readTree:true,readPinned:true});
 assert.equal(r.kind,'STOP');assert.equal(r.edge,'K1_SOURCE_CALLBACKS_UNBOUND');
}));
test('K1 reject noncanonical and unsupported carriers; no alternate issuer',async()=>withRoot(async root=>{
 const q=request();q.requestedCarrier='HOST_PACKET';
 const r=await runK1PreOwner(q,{...callbacks(),privateRoot:root});
 assert.equal(r.kind,'STOP');assert.equal(r.edge,'K1_PROFILE_OR_CARRIER_UNBOUND');
}));
test('K1 reject unknown/attempted owner before any source I/O',async()=>withRoot(async root=>{
 const q=request();q.ownerOutcome='UNKNOWN';
 const r=await runK1PreOwner(q,{...callbacks(),privateRoot:root});
 assert.equal(r.kind,'STOP');assert.equal(r.edge,'C72_OWNER_OUTCOME_UNKNOWN_NO_REPLAY');
}));
test('K1 historical LE Terms link cannot authorize original source staging',async()=>withRoot(async root=>{
 const q=request();q.priorTurnEvidence.terms_link='https://github.com/Luke883i/iKant_LE/blob/'+head+'/TERMS.md';
 const r=await runK1PreOwner(q,{...callbacks(),privateRoot:root});
 assert.equal(r.kind,'STOP');assert.equal(r.edge,'K0_FIRST_TURN_WITNESS_INVALID');
 assert.equal(r.original_owner_invoked,false);
}));
test('K1 reject a missing first-turn witness',async()=>withRoot(async root=>{
 const q=request();delete q.priorTurnEvidence.pinned_blob_shas['TERMS.md'];
 const r=await runK1PreOwner(q,{...callbacks(),privateRoot:root});
 assert.equal(r.kind,'STOP');assert.equal(r.edge,'K0_FIRST_TURN_WITNESS_INVALID');
}));
