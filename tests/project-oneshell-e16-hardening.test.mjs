import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {adjudicateE15,admitE15TransportEnvelope,E15_PROFILE,E15_STAGES} from '../host/project-oneshell-irred-e15.mjs';

const HEAD='a'.repeat(40),BAD='b'.repeat(40);
const keys=['orientationWitness','transitReadback','originalAccepted','originalEduMode',
 'sourceTreeBlobReadback','originalC135','originalC87Readback','originalC125S03',
 'sixSlotsOriginal','workerLossFence','verifiedLogoOrTextFallback','hostDeliveryObserved'];
const bound={ACCEPT:4,EDU:5,MATERIALIZED:6,READY:7,TURN:10,RECOVERED:11,DELIVERED:13};
const edges=['','E15_ORIENTATION_WITNESS_REQUIRED','E15_ORIGINAL_C72_TRANSIT_REQUIRED',
 'E15_ORIGINAL_ACCEPTANCE_READBACK_REQUIRED','E15_ORIGINAL_MODE_READBACK_REQUIRED',
 'E15_PINNED_TREE_BLOB_READBACK_REQUIRED','E15_ORIGINAL_C135_REQUIRED',
 'E15_ORIGINAL_C87_READBACK_REQUIRED','E15_ORIGINAL_S03_REQUIRED',
 'E15_SIX_SLOTS_ORIGINAL_REQUIRED','E15_RECOVERY_WORKER_FENCE_REQUIRED',
 'E15_VERIFIED_LOGO_OR_TEXT_REQUIRED','E15_HOST_DELIVERY_UNKNOWN'];
const canonical=x=>createHash('sha1').update(Buffer.from('blob '+x.length+'\0')).update(x).digest('hex');
const all=stage=>Object.fromEntries(keys.map(k=>[k,true]));
function oracle(q){
 if(q.profile!==E15_PROFILE||!E15_STAGES.includes(q.stage))return 'E15_PROFILE_OR_STAGE_INVALID';
 if(q.sourceHead!==HEAD||q.liveHead!==HEAD)return 'STOP_SOURCE_LOCK_STALE';
 for(let i=1;i<bound[q.stage];i++){
  if(i===10&&q.stage!=='RECOVERED')continue;
  if(i===11&&q.stage==='RECOVERED')continue;
  if(q[keys[i-1]]!==true)return edges[i];
 }
 if(q.stage==='RECOVERED'&&q.workerLossFence!==true)return edges[10];
 return null;
}
test('E16 negative type matrix and honest native delivery are exact and fail closed',()=>{
 assert.equal(adjudicateE15(null).ok,false);
 assert.equal(adjudicateE15([]).ok,false);
 assert.equal(adjudicateE15('EDU').ok,false);
 assert.equal(adjudicateE15({profile:E15_PROFILE,stage:'READY',sourceHead:Symbol('bad'),liveHead:HEAD}).ok,false);
 assert.equal(admitE15TransportEnvelope({projectProfile:E15_PROFILE,transitDirectory:'/tmp/e16',transitBlobSha1:Symbol('bad'),transitSourcePacket:{path:'host/project-c72-receipt-transit.mjs',contentBase64:'QUJDRA=='}}).ok,false);
 const poisons=[{},[],[true],{ok:false},'true','false',1,-1,Symbol('x'),null,undefined];
 for(const stage of E15_STAGES){
  const base={profile:E15_PROFILE,stage,sourceHead:HEAD,liveHead:HEAD,...all(stage)};
  assert.equal(adjudicateE15(base).ok,true,stage);
  for(const k of keys){
   for(const value of poisons){
    const r=adjudicateE15({...base,[k]:value});
    const expectation=oracle({...base,[k]:value});
    assert.equal(r.edge,expectation,stage+' '+k+' '+String(value));
    assert.equal(r.native_delivery_attested,false);
   }
  }
 }
 const delivered=adjudicateE15({profile:E15_PROFILE,stage:'DELIVERED',
  sourceHead:HEAD,liveHead:HEAD,...all('DELIVERED')});
 assert.equal(delivered.host_delivery_observed,true);
 assert.equal(delivered.native_delivery_attested,false,'Host observation is not provider receipt');
});
test('E16 envelope rejects missing pin, malformed base64, excessive bytes and a relative path',()=>{
 const bytes=Buffer.from('verified bytes candidate, not an authenticated GitHub member','utf8');
 const base={projectProfile:E15_PROFILE,transitDirectory:'/tmp/ikant-e16',
  transitBlobSha1:canonical(bytes),
  transitSourcePacket:{path:'host/project-c72-receipt-transit.mjs',contentBase64:bytes.toString('base64')}};
 const ok=admitE15TransportEnvelope(base);
 assert.equal(ok.ok,true);
 assert.equal(ok.source_origin_attested,false);
 assert.equal(ok.native_delivery_attested,false);
 for(const bad of [
  {...base,transitDirectory:'../relative'},
  {...base,transitBlobSha1:BAD},
  {...base,transitSourcePacket:{...base.transitSourcePacket,contentBase64:'@@garbage!!'}},
  {...base,transitSourcePacket:{...base.transitSourcePacket,contentBase64:'A'.repeat(350004)}},
  {...base,transitSourcePacket:{...base.transitSourcePacket,contentBase64:Buffer.from('tampered').toString('base64')}},
  {...base,transitSourcePacket:{...base.transitSourcePacket,contentBase64:'AA=A'}},
  {...base,transitSourcePacket:null},
 ])assert.equal(admitE15TransportEnvelope(bad).ok,false);
});
test('E16 reproducible 100k retrograde owner-cut falsification (not provider calls)',()=>{
 let state=0x186e1616, n=0,denied=0,allowed=0;
 const choose=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0;};
 const poisoned=[false,0,null,undefined,'false','true',{},[],{ok:false},[true],1];
 for(let i=0;i<100000;i++){
  const stage=E15_STAGES[choose()%E15_STAGES.length];
  const q={profile:E15_PROFILE,stage,sourceHead:HEAD,liveHead:HEAD,...all(stage)};
  const phase=i%10;
  if(phase<7){
   const k=keys[choose()%keys.length];
   q[k]=poisoned[choose()%poisoned.length];
  }else if(phase===7){q.liveHead=BAD;q.originalAccepted={ok:true};}
  else if(phase===8){q.profile='LEGACY';}
  else q[keys[choose()%keys.length]]=false;
  const actual=adjudicateE15(q),expected=oracle(q);
  assert.equal(actual.edge,expected,JSON.stringify({i,stage}));
  assert.equal(actual.ok,expected===null);
  assert.equal(actual.native_delivery_attested,false);
  actual.ok?allowed++:denied++;n++;
 }
 assert.equal(n,100000);assert(denied>20000);assert(allowed>1000);
});
