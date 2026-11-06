import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {gitBlobSha1} from '../scripts/v5b-repository-governance-audit.mjs';
import {qualifyWorkflowPatch,DIRECTIVE} from '../scripts/cora-pr-c-ci.mjs';
import {verifyFrozenWorkflowTree} from '../scripts/cora-pr-f-qualification.mjs';

const contract=JSON.parse(fs.readFileSync(new URL('../contracts/cora-pr-d1-blob-dedup-v1.json',import.meta.url),'utf8'));
const register=JSON.parse(fs.readFileSync(new URL('../governance/changes/zzzzzzzzzzzzzzz-cora-pr-d1-blob-dedup.json',import.meta.url),'utf8'));
const prior=JSON.parse(fs.readFileSync(new URL('../contracts/cora-pr-c-ci-v1.json',import.meta.url),'utf8'));
const yaml=fs.readFileSync(new URL('../.github/workflows/docs-ontology-coverage.yml',import.meta.url),'utf8');
const v5b=fs.readFileSync(new URL('../scripts/v5b-repository-governance-audit.mjs',import.meta.url),'utf8');
const consumer=fs.readFileSync(new URL('../scripts/cora-pr-c-ci.mjs',import.meta.url),'utf8');
const rawHash=(prefix,size,data,delimiter=0)=>{
 const head=Buffer.from(prefix+' '+size+String.fromCharCode(delimiter));
 return crypto.createHash('sha1').update(head).update(data).digest('hex');
};
const independentHash=bytes=>rawHash('blob',bytes.length,bytes);
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',timeout:15000}).trim();
test('D1 reticular DoD has exact non-compensatory dependencies and external review cut',()=>{
 assert.equal(contract.schema,'ikant-cora-pr-d1-blob-consolidation/v1');
 assert.equal(contract.authority,0);
 assert.equal(contract.release,'NO_GO');
 assert.equal(contract.product_go,false);
 assert.equal(contract.scope.preexisting_implementations,2);
 assert.equal(contract.scope.post_change_implementations,1);
 assert.equal(contract.scope.no_deletions,true);
 assert.deepEqual(contract.reticular_dod.map(n=>[n.id,n.requires]),[
  ['D01',[]],['D02',['D01']],['D03',['D02']],['D04',['D03']],
  ['D05',['D03']],['D06',['D04','D05']],['D07',['D06']],['D08',['D07']]
 ]);
 assert.equal(contract.exits.external,'D08');
 assert.equal(contract.exits.product_qualified,'BLOCKED_EXTERNAL');
 assert.equal(contract.review,'NOT_ATTESTED');
 assert(Object.values(contract.claims).every(x=>x===true));
});
test('V5-B explicitly records all modified and new files without inventing approval',()=>{
 assert.equal(register.source_main,contract.source_base);
 assert.equal(register.authority,0);
 assert.equal(register.human_review_completed,false);
 assert.equal(register.paths.length,7);
 assert.equal(register.paths.filter(x=>x.operation==='MODIFY').length,4);
 assert.equal(register.paths.filter(x=>x.operation==='ADD').length,3);
 assert(register.paths.every(x=>x.human_review==='REVIEW_REQUIRED'&&x.destructive_effect===false));
 for(const r of register.paths.filter(x=>x.operation==='MODIFY')){
  assert.equal(r.supersedes_register,contract.reuse.predecessor_register);
  assert.equal(r.supersedes_source_main,'b6058b129ee1df0dcbbb3c92cf1f750ee9e024fa');
 }
});
test('one production blob SHA-1 implementation: original V5-B exported, Cora PR-C imports it',()=>{
 assert.match(v5b,/export function gitBlobSha1\(input\)/);
 assert.match(consumer,/import \{gitBlobSha1\} from '\.\/v5b-repository-governance-audit\.mjs';/);
 assert.match(consumer,/observeReticularCensusWithAudit\(\)/);
 assert.doesNotMatch(consumer,/\bauditRepository\s*\(/,'PR-C must not repeat V5-B source audit');
 assert.match(consumer,/qualifyPrCCISource\(\{policy,source:yaml,audit,cora\}\)/);
 assert.doesNotMatch(consumer,/createHash\('sha1'\)/);
 assert.doesNotMatch(consumer,/const blobSha=/);
 assert.match(consumer,/gitBlobSha1\(source\)/);
 assert.match(consumer,/gitBlobSha1\(previous\)/);
});
test('original PR-C workflow old/new Git blob fingerprints and rollback preserved',()=>{
 const qualified=qualifyWorkflowPatch(prior,yaml);
 assert.equal(qualified.ok,true,JSON.stringify(qualified));
 assert.equal(qualified.authority,0);assert.equal(qualified.product_go,false);
 const original=yaml.replace(DIRECTIVE,'');
 assert.equal(gitBlobSha1(original),prior.bounded_effect.before_blob);
 assert.equal(gitBlobSha1(yaml),prior.bounded_effect.after_blob);
 assert.equal(independentHash(Buffer.from(original)),gitBlobSha1(original));
 assert.equal(independentHash(Buffer.from(yaml)),gitBlobSha1(yaml));
 assert.equal(qualifyWorkflowPatch(prior,yaml.replace('contents: read','contents: write')).ok,false);
});
test('real Git hash-object validates byte UTF-8, NUL, invalid UTF-8 and slice offsets',()=>{
 const samples=[
  Buffer.alloc(0),Buffer.from('hello'),Buffer.from('caffè🚀\n','utf8'),
  Buffer.from([0,255,0,128,195,40]),Buffer.from('e\u0301\u0000\r\n'),
  Buffer.from('🇮🇹 2026-11-04')];
 for(const bytes of samples){
  const gitSha=execFileSync('git',['hash-object','--stdin'],{input:bytes,encoding:'utf8',timeout:15000}).trim();
  assert.equal(gitBlobSha1(bytes),gitSha);
  assert.equal(gitBlobSha1(new Uint8Array(bytes)),gitSha);
  assert.equal(independentHash(bytes),gitSha);
 }
 const container=Buffer.from([90,1,2,3,4,5,91]);
 const sliced=container.subarray(1,6);
 assert.equal(gitBlobSha1(sliced),independentHash(sliced));
 assert.notEqual(gitBlobSha1(sliced),gitBlobSha1(container));
 for(const bad of [null,undefined,1,false,{},[],new ArrayBuffer(3)])
  assert.throws(()=>gitBlobSha1(bad),/V5B_GIT_BLOB_INPUT_TYPE/);
});
test('10k seeded binary and semantic fault vectors reject all altered byte hashing rules twice',()=>{
 const mutate=(i,bytes)=>{
  const b=Buffer.from(bytes);
  switch(i){
   case 0:return rawHash('tree',b.length,b);
   case 1:return rawHash('blob',b.length+1,b);
   case 2:return rawHash('blob',b.length-1,b);
   case 3:b[0]^=1;return independentHash(b);
   case 4:return independentHash(Buffer.concat([b,Buffer.from('\n')]));
   case 5:return independentHash(Buffer.concat([Buffer.from([0]),b]));
   case 6:return independentHash(Buffer.concat([b,Buffer.from([0])]));
   case 7:{const x=b[0];b[0]=b[1];b[1]=x;return independentHash(b)}
   case 8:return independentHash(Buffer.from(b.toString('hex'),'ascii'));
   case 9:return crypto.createHash('sha1').update(b).digest('hex');
   case 10:return rawHash('blob',b.length,b,10);
   case 11:return rawHash('commit',b.length,b);
   default:throw Error('D1_BAD_MUTANT_INDEX');
  }
 };
 const exercise=()=>{
  let state=20261104>>>0,rejected=0,unsafe=0;
  const covered=new Set(),trace=crypto.createHash('sha256');
  for(let i=0;i<10000;i++){
   state=(Math.imul(state,1664525)+1013904223)>>>0;
   const family=i<12?i:state%12,bytes=Buffer.alloc(6+(state%39));
   covered.add(family);
   for(let j=0;j<bytes.length;j++){
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    bytes[j]=state&255;
   }
   if(bytes[0]===bytes[1])bytes[1]^=0x55;
   const correct=independentHash(bytes);
   assert.equal(gitBlobSha1(bytes),correct,'binary vector '+i);
   assert.equal(gitBlobSha1(new Uint8Array(bytes)),correct,'view '+i);
   const wrong=mutate(family,bytes);
   if(wrong!==correct)rejected++;else unsafe++;
   trace.update(Buffer.from(String(i)+':'+family+':'+correct+':'+wrong+';'));
   if(i%101===0){
    const unicode='caffè🚀\u0000'+i+'e\u0301';
    assert.equal(gitBlobSha1(unicode),independentHash(Buffer.from(unicode,'utf8')));
   }
  }
  return {rejected,unsafe,families:covered.size,digest:trace.digest('hex')};
 };
 const a=exercise(),b=exercise();
 assert.deepEqual(a,b);
 assert.equal(a.rejected,10000);
 assert.equal(a.unsafe,0);
 assert.equal(a.families,12);
});
test('real Git checkout preserves original owner blobs and all 116 workflow records',()=>{
 const cora=JSON.parse(fs.readFileSync(new URL('../contracts/cora-reticular-hygiene-v1.json',import.meta.url),'utf8'));
 const expected=cora.reuse.owner_blob_pins;
 for(const [file,sha] of Object.entries(expected))
  assert.equal(git('rev-parse','HEAD:'+file),sha,'owner drift '+file);
 const originalPRF=JSON.parse(fs.readFileSync(new URL(
  '../contracts/cora-pr-f-integrated-qualification-v1.json',import.meta.url),'utf8'));
 const historic=verifyFrozenWorkflowTree(originalPRF);
 assert.equal(historic.ok,true,JSON.stringify(historic));
 assert.equal(historic.historic_tree,'d81958913446a13f5fb296d20771c7e57e2df224');
 assert.equal(historic.current_tree,git('rev-parse','HEAD:.github/workflows'));
 assert.equal(historic.source_only,true);
 assert.equal(historic.provider_attested,false);
 const fileCount=git('ls-tree','-r','--name-only','HEAD:.github/workflows').split('\n').filter(Boolean).length;
 assert.equal(fileCount,116);
});
