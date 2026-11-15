import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const run=(mode,head,tree,out,env={})=>spawnSync(process.execPath,['scripts/build-project-oneshell-prompt.mjs',
 '--mode',mode,'--head',head,'--tree',tree,'--out',out],{encoding:'utf8',env:{...process.env,...env}});
test('one HEAD gives byte identical generated prompt and receipts; no stale or mutable output',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-head-prompt-'));
 try{
  const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
  const a=path.join(dir,'a'),b=path.join(dir,'b');
  const r=run('candidate',head,tree,a),s=run('candidate',head,tree,b);
  assert.equal(r.status,0,r.stderr);assert.equal(s.status,0,s.stderr);
  for(const p of ['PROMPT_INNESCO.txt','SOURCE_LOCK.json','RECEIPT.json'])
   assert.deepEqual(fs.readFileSync(path.join(a,p)),fs.readFileSync(path.join(b,p)));
  const p=fs.readFileSync(path.join(a,'PROMPT_INNESCO.txt'),'utf8');
  assert([...p].length<=8000,'Project max characters');
  assert(Buffer.byteLength(p,'utf8')<=8000,'Project max UTF-8 bytes');
  const receipt=JSON.parse(fs.readFileSync(path.join(a,'RECEIPT.json')));
  const matrix=JSON.parse(execFileSync('git',['show','HEAD:contracts/project-prompt-generation.json'],{encoding:'utf8'}));
  assert.equal(matrix.project_instruction_limit_chars,8000);
  assert.equal(matrix.project_instruction_limit_utf8_bytes,8000);
  assert.deepEqual(matrix.head_critical_contracts,
   ['contracts/project-oneshell-compact-continuity.json','contracts/project-oneshell-visual-v2.json']);
  for(const p of [...matrix.head_critical_contracts,matrix.host_port_standard,
   'host/project-c72-capability-port.mjs',matrix.host_port_cli,
    'contracts/project-host-tool-grounding-abi.json','host/project-host-tool-grounding.mjs']){
   assert.equal(receipt.source_blobs[p].git_blob_sha1,git('rev-parse','HEAD:'+p));
   assert.equal(receipt.source_blobs[p].bytes,
    execFileSync('git',['show','HEAD:'+p]).length);
  }
  const lock=JSON.parse(fs.readFileSync(path.join(a,'SOURCE_LOCK.json')));
  assert.equal(lock.installed_prompt_equivalence_attested,false);
  assert.equal(lock.versioned_c72_receipt_transfer_allowed,false);
  assert.equal(lock.runtime_preflight_required,true);
  assert.deepEqual(Object.keys(lock.critical_contract_blobs),matrix.head_critical_contracts);
  assert.equal(lock.live_main_verified,false);

  assert(p.includes(head)&&p.includes(tree)&&p.includes('OneShell'));
  assert(p.includes('MACHINE_POST_ACCEPT=contracts/project-host-tool-grounding-abi.json'));
  assert(p.includes('HOST_TOOL_ARG_RELAY'));
  assert.equal(receipt.product_release,'PRODUCT_NO_GO');assert.equal(receipt.live_main_verified,false);
  assert.notEqual(run('candidate','f'.repeat(40),tree,path.join(dir,'wrong-head')).status,0);
  assert.notEqual(run('candidate',head,'f'.repeat(40),path.join(dir,'wrong-tree')).status,0);
  assert.notEqual(run('candidate',head,tree,a).status,0);
  // Negative canonical test must stay negative even on a real main push workflow.
  assert.notEqual(run('canonical',head,tree,path.join(dir,'not-main'),
   {GITHUB_EVENT_NAME:'pull_request',GITHUB_REF:'refs/pull/158/head'}).status,0);
  const portable=path.join(dir,'portable'),again=path.join(dir,'portable-again');
  const portableRun=run('portable',head,tree,portable);
  assert.equal(portableRun.status,0,portableRun.stderr);
  assert.equal(run('portable',head,tree,again).status,0);
  for(const name of ['PROMPT_INNESCO.txt','SOURCE_LOCK.json','RECEIPT.json'])
   assert.deepEqual(fs.readFileSync(path.join(portable,name)),fs.readFileSync(path.join(again,name)));
  const original=execFileSync('git',['show','HEAD:project/session-chat/PROMPT.txt']);
  assert.deepEqual(fs.readFileSync(path.join(portable,'PROMPT_INNESCO.txt')),original);
  const portableLock=JSON.parse(fs.readFileSync(path.join(portable,'SOURCE_LOCK.json')));
  assert.equal(portableLock.source_head,null);
  assert.equal(portableLock.source_tree,null);
  assert.equal(portableLock.generated_from_head,head);
  assert.equal(portableLock.session_source_lock,'RESOLVE_LIVE_MAIN_ON_FIRST_PROJECT_CHAT_MESSAGE');
  assert.match(original.toString('utf8'),/PRIMO messaggio umano di nuova chat/);
  assert.match(original.toString('utf8'),/Worker perso⇒solo rebind C87\/checkpoint originale verificato/);
  for(const token of ['STOP_PROMPT_HEAD_PREFLIGHT','STOP_PROJECT_PROMPT_STALE_INSTALLATION',
    'INSTALLED_PROMPT_EQUIVALENCE_UNKNOWN','EXPLICIT_REPIN_REQUIRES_FRESH_C72']){
   assert(original.toString('utf8').includes(token),'missing '+token);
  }
  assert(!portableLock.live_main_verified);
  assert.equal(portableLock.installed_prompt_equivalence_attested,false);

  // A changed working tree cannot contaminate Git-show HEAD content: the exact
  // release output and source receipt must stay byte-identical.
  const dirty=path.join(process.cwd(),'artifacts','qualification','oneshell-test-dirty-'+process.pid+'.tmp');
  try{
   fs.writeFileSync(dirty,'worktree artifact is NOT an input to git show HEAD');
   const third=path.join(dir,'c'),out=run('candidate',head,tree,third);
   assert.equal(out.status,0,out.stderr);
   for(const name of ['PROMPT_INNESCO.txt','SOURCE_LOCK.json','RECEIPT.json'])
    assert.deepEqual(fs.readFileSync(path.join(a,name)),fs.readFileSync(path.join(third,name)));
  }finally{fs.rmSync(dirty,{force:true});}
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
