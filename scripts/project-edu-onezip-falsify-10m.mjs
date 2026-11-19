#!/usr/bin/env node
/** Deterministic defensive transition model; no target, network, exploit or provider calls. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const groups=[
 ['orientation','preconsent source reads','prior event distinct','terms/source witness'],
 ['handoff','single ZIP','node task-reply binding','private file readback'],
 ['source','exact pinned HEAD','TREE/blobs reopened','no second ZIP'],
 ['consent','explicit human I ACCEPT','distinct later EDU','C72 receipt reopened'],
 ['runtime','C135 original task','same-worker reply','exact acknowledgement'],
 ['write','fresh nonce','exclusive attempt','no unresolved prior write'],
 ['resume','old worker closed','C87 count/hash exact','same private epoch'],
 ['view','original C125 bytes','same-turn S03','no unseen partial commit'],
 ['scope','no native inference','no cross-chat inference','no MCP promotion'],
 ['delivery','local store visible','not a forged host trace','no retry after uncertainty'],
];
const seeds=[0x862960b3,0xc61db501,0xa1d20695,0xb19ece8d,0xd74a3071,0x4f6b8b45,
 0xe3212263,0xf510d771,0x84a698a5,0x30077cf5];
const per=1_000_000;
// Each triplet is a typed guard family. The oracle checks field equality and
// forbids adverse combinations; policy is an independently expressed mask.
const mandatory=[7,7,7,7,7,7,7,7,7,7];
const policy=(faults,readOnly)=>{
 if ((faults & 0x3fffffff)!==0) return 0; // STOP
 return readOnly?1:2; // re-open only, or normal transition
};
function oracle(gates,kind){
 for(let g=0;g<gates.length;g++){
  if(gates[g]!==mandatory[g])return 0;
 }
 return kind==='READ_ONLY'?1:2;
}
const hash=createHash('sha256');const buf=Buffer.allocUnsafe(1<<16);let off=0;
function stamp(b){buf[off++]=b;if(off===buf.length){hash.update(buf);off=0;}}
function next(v) { v^=v<<13; v^=v>>>17; v^=v<<5; return v>>>0; }
let total=0,errors=0;
const report=[];
for(let group=0;group<groups.length;group++){
 let state=seeds[group],local=0,composed=0,controls=0,kills=0;
 const gates=Array(10).fill(7);
 for(let i=0;i<per;i++){
  state=next(state);
  const bit=(state>>>7)%3;
  // Mutate a field (negative or semantics-preserving control), sometimes
  // with a second independently shifted fault. No text/payload generation.
  const bad=(state&15)!==0, extra=bad&&(state&16)!==0;
  const other=(group+1+((state>>>15)%9))%10, b2=(state>>>24)%3;
  const main=bad?(1<<(group*3+bit)):0, cross=extra?(1<<(other*3+b2)):0;
  const readOnly=(state&64)!==0;
  gates[group]=bad?(7^(1<<bit)):7;
  gates[other]=extra?(7^(1<<b2)):7;
  const out=policy(main|cross,readOnly), want=oracle(gates,readOnly?'READ_ONLY':'TRANSITION');
  if(out!==want)errors++;
  // One sensitivity mutant per family: remove exactly that family’s guard.
  if(policy(cross,readOnly)!==want)kills++;
  gates[group]=gates[other]=7;
  if(!bad)controls++;else if(extra)composed++;else local++;
  stamp((group<<4)|(out<<2)|bit);stamp((cross!==0?128:0)|(bad?64:0)|(readOnly?32:0)|other*3+b2);total++;
 }
 assert.ok(kills>0);
 report.push({family:groups[group][0],checks:groups[group].slice(1),seed:seeds[group].toString(16).padStart(8,'0'),
  single_fault:local,multi_fault:composed,semantics_preserving_controls:controls,guard_mutant_kills:kills});
}
hash.update(buf.subarray(0,off));
const result={schema:'ikant-edu-onezip-model-falsification/v1',scope:'TYPED_DEFENSIVE_MODEL_NOT_LIVE_ATTACKS_OR_NATIVE_PROJECT',
 total,model_disagreements:errors,digest_sha256:hash.digest('hex'),families:report,
 native_event_attested:false,provider_persistence_attested:false,product_go:false};
assert.equal(total,10_000_000);assert.equal(errors,0);
console.log(JSON.stringify(result,null,2));
