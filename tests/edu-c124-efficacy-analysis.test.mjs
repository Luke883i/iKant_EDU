import test from 'node:test';import assert from 'node:assert/strict';
import {C124_CHANNEL_IDS} from '../src/c124-channel-bridge.mjs';
import {evaluateC124BlindedPairData} from '../host/c124-efficacy-analysis.mjs';
test('no caller-generated fake statistical gain authenticates real LLM causality',()=>{
 const fake=Object.fromEntries(C124_CHANNEL_IDS.map(k=>[k,Array.from({length:300},()=>({control:.25,conditioned:.9}))]));
 const x=evaluateC124BlindedPairData({channels:fake,provider_attested:true,blind_review_attested:true});
 assert.equal(x.status,'DESCRIPTIVE_PAIRED_DELTA_ONLY_NOT_AUTHENTICATED');
 assert.equal(x.apparent_complete,true);
 assert.equal(x.causal_efficacy_attested,false);
 assert.equal(x.real_provider_origin_attested,false);
 assert.equal(x.blinded_evaluator_origin_attested,false);
});
test('zero/negative ablations cannot claim all twelve channels beneficial',()=>{
 const mixed=Object.fromEntries(C124_CHANNEL_IDS.map((k,i)=>[k,Array.from({length:300},()=>({control:.6,conditioned:i%3===0?.5:.6}))]));
 const x=evaluateC124BlindedPairData({channels:mixed});
 assert.equal(x.apparent_complete,false);assert.equal(x.apparent_positive_channels.length,0);
});
test('missing one channel or insufficient pairs fail closed',()=>{
 const d=Object.fromEntries(C124_CHANNEL_IDS.map(k=>[k,Array.from({length:300},()=>({control:.3,conditioned:.4}))]));
 delete d.INTENT;assert.equal(evaluateC124BlindedPairData({channels:d}).status,'NOT_QUALIFIED');
 d.INTENT=Array.from({length:299},()=>({control:.3,conditioned:.4}));
 assert.equal(evaluateC124BlindedPairData({channels:d}).status,'NOT_QUALIFIED');
});
