import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {issueC72V2LinkedTermsOffer,acceptC72V2LinkedTerms,
 presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {planP1PostModeSourceHandoff} from '../host/p1-postmode-source-handoff.mjs';
import {planOneShellEduSource} from '../host/project-oneshell-edu.mjs';
import {deriveOneShellHostAction} from '../host/project-oneshell-autopilot.mjs';

const H='7'.repeat(40), OTHER='8'.repeat(40);
const offer=issueC72V2LinkedTermsOffer({sourceHead:H,termsDigest:createHash('sha256').update('terms-test').digest('hex')});
const accepted=acceptC72V2LinkedTerms({offer,humanMessage:'I ACCEPT',termsLinkPresented:true});
const orientation=presentC72V2Introduction(accepted);
const edu=selectC72V2Mode({accepted,orientation,humanMessage:'EDU'});
const canonical=selectC72V2Mode({accepted,orientation,humanMessage:'CANONICAL'});
const sources=['FULL_SOURCE_VERIFIED','PARTIAL_SOURCE_ONLY','SOURCE_ABSENT','SOURCE_UNKNOWN'];
const bridges=['AVAILABLE','DEFINITIVELY_UNAVAILABLE','UNKNOWN'];

test('100000 deterministic post-C72 scenarios: manual ZIP only EDU + verified no bridge',()=>{
 const hash=createHash('sha256'),count={total:0,manual:0,auto:0,stop:0,verifiedStart:0,unsafeZip:0,driftStops:0,unknownBridgeZip:0};
 for(let i=0;i<100000;i++){
  const a=i%10,b=Math.floor(i/10)%10,c=Math.floor(i/100)%10,
   d=Math.floor(i/1000)%10,e=Math.floor(i/10000)%10;
  const selection=a<4?edu:a<7?canonical:null;
  const sourceState=sources[b%4],bridgeState=bridges[c%3];
  const nodeReady=d%2===0,manualExtractorReady=(Math.floor(d/2)%2)===0;
  const stale=e>=5;
  const frame=planOneShellEduSource({selection,sourceState,bridgeState,nodeReady,manualExtractorReady});
  const next=frame.slots.NEXT;
  const permitted=selection===edu&&nodeReady&&manualExtractorReady&&
   (sourceState==='SOURCE_ABSENT'||sourceState==='PARTIAL_SOURCE_ONLY')&&
   bridgeState==='DEFINITIVELY_UNAVAILABLE';
  if(next==='UPLOAD_PINNED_SOURCE_ZIP'){
   count.manual++;
   if(!permitted)count.unsafeZip++;
   assert.equal(permitted,true,'unexpected ZIP route: '+i);
   assert(frame.slots.PROVA.includes(H));
  }else if(permitted)assert.fail('qualified ZIP route suppressed: '+i);
  if(bridgeState==='UNKNOWN'&&next==='UPLOAD_PINNED_SOURCE_ZIP')count.unknownBridgeZip++;
  if(next==='START_C135_EDU'){
   assert.equal(sourceState,'FULL_SOURCE_VERIFIED');assert.equal(selection,edu);assert(nodeReady);
   count.verifiedStart++;
  }
  const p=planP1PostModeSourceHandoff({selection,sourceState,bridgeState});
  if(p.action==='REQUEST_SOURCE_ZIP'){
   assert.equal(selection,edu);
   assert.equal(bridgeState,'DEFINITIVELY_UNAVAILABLE');
   assert(['SOURCE_ABSENT','PARTIAL_SOURCE_ONLY'].includes(sourceState));
  }
  const host=deriveOneShellHostAction({frame,selection,sourceHead:H,liveHead:stale?OTHER:H});
  if(stale){count.driftStops++;assert.equal(host.edge,'STOP_SOURCE_LOCK_STALE')}
  else if(host.kind==='MANUAL_HANDOFF')assert.equal(next,'UPLOAD_PINNED_SOURCE_ZIP');
  if(host.kind==='AUTO')count.auto++;
  if(host.kind==='STOP')count.stop++;
  hash.update([i,next,p.action,host.kind,host.edge].join('|')+'\\n');
  count.total++;
 }
 assert.equal(count.total,100000);
 assert.equal(count.unsafeZip,0);assert.equal(count.unknownBridgeZip,0);
 assert(count.manual>0&&count.verifiedStart>0&&count.driftStops>0);
 console.log('POST_C72_100K',JSON.stringify({...count,sha256:hash.digest('hex'),
  software_simulation_only:true,native_chatgpt_runs:0}));
});
