import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
import {buildC107Package,stageC107Package,C107_FILES} from '../scripts/c107-pack.mjs';
const root=path.resolve(new URL('../',import.meta.url).pathname);
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const H=s=>crypto.createHash('sha256').update(s).digest('hex');
const OPTIN='AUTORIZZO BOZZE COHOST SPERIMENTALI NON VERIFICATE';
test('C111 original Node package: activate -> C72 -> two C70/C100/C87 -> synthetic separate -> revoke',()=>{
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-c111-original-'));
 try{
  const pkg=buildC107Package({root,expectedHead:head});
  assert.equal(pkg.status,'C107_PACKAGE_BUILT_NOT_TRANSPORTED',JSON.stringify(pkg));
  assert.ok(C107_FILES.includes('host/c111-host-edge.mjs'));
  assert.ok(C107_FILES.includes('scripts/c111-host-edge-cli.mjs'));
  const stage=stageC107Package({payload:pkg.payload,expectedSha256:pkg.sha256,
   expectedHead:head,privateParent:home});
  assert.equal(stage.status,'C107_PACKAGE_REOPENED_NOT_EXECUTED',JSON.stringify(stage));
  const local=path.join(stage.install_root,'.ikant-host');fs.mkdirSync(local,{mode:0o700});
  const ledger=path.join(local,'c107-observations.jsonl');
  const q1='Descrivi il funzionamento di un oggetto quotidiano.';
  const q2='Spiega un secondo esempio collegato al primo.';
  const a1='Il primo oggetto viene descritto con un testo linguistico specifico per questa domanda.';
  const a2='Il secondo esempio considera il contesto della domanda precedente in modo pertinente.';
  const frames=[{op:'CAPABILITIES'},{op:'ACTIVATE'},
   {op:'MESSAGE',text:'I ACCEPT'},{op:'MESSAGE',text:'EXPERIMENTAL'},{op:'MESSAGE',text:OPTIN},
   {op:'MESSAGE',text:q1,candidate:{input_sha256:H(q1),text:a1}},
   {op:'MESSAGE',text:q2,candidate:{input_sha256:H(q2),text:a2}},
   {op:'MESSAGE',text:'Terza domanda',hostDraft:'Bozza utile ma non originale.'},
   {op:'REVOKE'},{op:'MESSAGE',text:OPTIN},{op:'EXIT'}];
  const proc=spawnSync(process.execPath,['scripts/c111-host-edge-cli.mjs','--head',head,
   '--ledger',ledger,'--allow-synthetic'],{cwd:stage.install_root,
   input:frames.map(x=>JSON.stringify(x)).join('\n')+'\n',
   encoding:'utf8',timeout:60000,maxBuffer:3000000});
  assert.equal(proc.status,0,proc.stderr);
  const out=proc.stdout.trim().split('\n').map(JSON.parse);
  assert.equal(out.length,frames.length);
  assert.equal(out[0].status,'C111_CURRENT_NODE_PROCESS_OBSERVED');
  assert.deepEqual(out.slice(1,5).map(x=>x.status),[
   'C109_TERMS_PRESENTED','C109_C72_INTRO','C109_EXPERIMENTAL_SELECTED','C109_LOCAL_SHELL_READY']);
  for(const [i,v,n] of [[5,a1,1],[6,a2,2]]){
   assert.equal(out[i].status,'C109_VERIFIED_LOCAL_VOICE_NOT_NATIVE',JSON.stringify(out[i]));
   assert.equal(out[i].host_edge_grade,'ORIGINAL_LOCAL');
   assert.equal(out[i].surface_a,v);
   assert.equal(out[i].surface_b.evidence.output_sha256,H(v));
   assert.equal(out[i].surface_b.evidence.ledger_entries,n);
   assert.equal(out[i].surface_b.evidence.original_c70_executed,true);
   assert.equal(out[i].surface_b.evidence.original_c87_reopened,true);
  }
  assert.equal(out[7].status,'C109_SYNTHETIC_HOST_DRAFT_NOT_IKANT_RUNTIME',JSON.stringify(out[7]));
  assert.equal(out[7].host_edge_grade,'HOST_SYNTHETIC');
  assert.match(out[7].surface_a,/^\[BOZZA HOST SPERIMENTALE/);
  assert.equal(out[7].surface_b.evidence.ledger_event_sha256,null);
  assert.equal(out[8].status,'C109_OPTIN_REVOKED');
  assert.equal(out[10].status,'C109_LOCAL_SESSION_CLOSED');
  assert.equal(fs.readFileSync(ledger,'utf8').trim().split('\n').length,2);
  console.log('C111_ORIGINAL_PROOF '+JSON.stringify({source_head:head,package_files:pkg.file_count,
   package_sha256:pkg.sha256,original_turns:2,synthetic_turns:1,c87_reopen:true,
   edu_native_hook:false,model_provider_authenticated:false}));
 }finally{fs.rmSync(home,{recursive:true,force:true});}
});
