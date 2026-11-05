import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {executeC101LocalCohostMachine,verifyC101Readback} from '../host/c101-local-cohost-machine.mjs';
const head='3bc929b55f5dedb9f0ed833e8d036558a5c13d53';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const offer=issueC72TermsOffer({sourceHead:head,termsDigest:'a'.repeat(64)});
const accepted=acceptC72Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
const orientation=presentC72Introduction(accepted);
const selection=selectC72Mode({accepted,orientation,humanMessage:'EXPERIMENTAL'});
const base={sourceHead:head,selection,humanInput:'Spiega un metodo di audit riproducibile',optIn:true};
function rubric(required,forbidden=[]){
 const relevanceCase={schema:'ikant-le-c89-bounded-rubric/v1',source_head:head,
  input_sha256:sha(base.humanInput),required_phrases:required,forbidden_phrases:forbidden,
  active:false,independent_holdout_attested:false};
 return {...base,relevanceCase,relevanceCaseSha256:sha(JSON.stringify(relevanceCase))};
}
test('C89 gold reused, voice exact and nonindependently reviewed',()=>{
 const original=executeC101LocalCohostMachine(base);
 assert.equal(original.status,'C101_LOCAL_MACHINE_VOICE_READY_NOT_NATIVE_DELIVERED',JSON.stringify(original));
 const words=original.voice_utf8.match(/\p{L}{4,}/gu);
 assert.ok(words?.length>=2);
 const input=rubric([words[0]]);
 const result=executeC101LocalCohostMachine(input);
 assert.equal(result.status,original.status,JSON.stringify(result));
 assert.equal(result.c89_relevance_status,'C89_BOUNDED_RUBRIC_PASS_NOT_H95');
 assert.equal(result.relevance_independent_review_attested,false);
 assert.equal(result.voice_utf8,original.voice_utf8);
 assert.equal(verifyC101Readback(result,input).ok,true);
 assert.equal(verifyC101Readback({...result,c89_relevance_status:'NOT_REQUESTED'},input).ok,false);
 const banned=executeC101LocalCohostMachine(rubric([words[0]],[words[1]]));
 assert.equal(banned.status,'C101_STOP');
 assert.equal(banned.active,false);
 const drift=executeC101LocalCohostMachine({...input,relevanceCaseSha256:'0'.repeat(64)});
 assert.equal(drift.status,'C101_STOP');
 let invoked=false;
 const proxy=new Proxy([words[0]],{get(){invoked=true;throw Error('poison')}});
 const hostile=rubric([words[0]]); hostile.relevanceCase.required_phrases=proxy;
 const attack=executeC101LocalCohostMachine(hostile);
 assert.equal(attack.status,'C101_STOP');
 assert.equal(invoked,false);
 const cycle=rubric([words[0]]);cycle.relevanceCase.untrusted=cycle.relevanceCase;
 assert.equal(executeC101LocalCohostMachine(cycle).status,'C101_STOP');
});
test('real stdin->Node per-turn NDJSON carrier, independent input/output and failure isolation',()=>{
 const a=base,b={...base,humanInput:'Come distinguere test ed evidenza?'};
 const invalid={...a,optIn:false};
 const run=spawnSync(process.execPath,['scripts/c101-local-machine-cli.mjs','--ndjson'],{
  cwd:new URL('../',import.meta.url),encoding:'utf8',timeout:25000,
  input:[a,invalid,b].map(x=>JSON.stringify(x)).join('\n')+'\n',maxBuffer:1024*1024});
 assert.equal(run.status,0,run.stderr);
 const lines=run.stdout.trim().split('\n').map(x=>JSON.parse(x));
 assert.equal(lines.length,3);
 assert.equal(lines[0].readback.ok,true,JSON.stringify(lines[0]));
 assert.equal(lines[1].receipt.status,'C101_STOP');
 assert.equal(lines[1].readback.ok,false);
 assert.equal(lines[2].readback.ok,true,JSON.stringify(lines[2]));
 assert.equal(lines[0].receipt.input_sha256,sha(a.humanInput));
 assert.equal(lines[2].receipt.input_sha256,sha(b.humanInput));
 assert.equal(lines[0].receipt.active,false);
 assert.equal(lines[2].receipt.persistent,false);
 assert.equal(lines[2].receipt.native_delivery_attested,false);
 assert.equal(lines[0].receipt.output_sha256,sha(lines[0].receipt.voice_utf8));
 assert.equal(lines[2].receipt.output_sha256,sha(lines[2].receipt.voice_utf8));
 assert.notEqual(lines[0].receipt.input_sha256,lines[2].receipt.input_sha256);
});
