/** C124 descriptive real-model paired-trial analyzer (never provider/authenticity oracle).
 * Paired randomized independently blind review is an external prerequisite.
 * The source-supplied numbers, however plausible, cannot self-certify origin.
 */
import {C124_CHANNEL_IDS} from '../src/c124-channel-bridge.mjs';
import {isProxy} from 'node:util/types';
const round=x=>Number(x.toFixed(8));
const valid=a=>Array.isArray(a)&&a.length>=300&&a.length<=50000&&!isProxy(a)&&
 a.every(p=>p&&typeof p==='object'&&!isProxy(p)&&Number.isFinite(p.control)&&
  Number.isFinite(p.conditioned)&&p.control>=0&&p.control<=1&&
  p.conditioned>=0&&p.conditioned<=1&&p.control!==undefined);
const calc=(arr,z=2.90)=>{const d=arr.map(p=>p.conditioned-p.control),n=d.length,mean=d.reduce((a,b)=>a+b,0)/n;
 const varSample=d.reduce((a,x)=>a+(x-mean)**2,0)/(n-1),se=Math.sqrt(varSample/n);
 return Object.freeze({n,mean_delta:round(mean),ci_lower:round(mean-z*se),ci_upper:round(mean+z*se),
  estimated_positive_lower_bound:mean-z*se>0,confidence_caveat:'NORMAL_APPROX_MULTIPLE_COMPARISONS_NOT_AUTHENTICATED'});};
export function evaluateC124BlindedPairData(input){
 const reject=e=>Object.freeze({status:'NOT_QUALIFIED',first_edge:e,causal_efficacy_attested:false});
 if(!input||typeof input!=='object'||Array.isArray(input)||isProxy(input))return reject('INVALID_REPORT');
 try{
  const groups=input.channels;
  if(!groups||typeof groups!=='object'||Array.isArray(groups)||isProxy(groups)||Reflect.ownKeys(groups).length!==12||
    !C124_CHANNEL_IDS.every(k=>Object.hasOwn(groups,k)&&valid(groups[k])))return reject('MISSING_300_PAIRED_REVIEWS_PER_CHANNEL');
  const analysis=Object.fromEntries(C124_CHANNEL_IDS.map(k=>[k,calc(groups[k])]));
  const yes=C124_CHANNEL_IDS.filter(k=>analysis[k].estimated_positive_lower_bound);
  const no=C124_CHANNEL_IDS.filter(k=>!analysis[k].estimated_positive_lower_bound);
  return Object.freeze({status:'DESCRIPTIVE_PAIRED_DELTA_ONLY_NOT_AUTHENTICATED',
   configured_pairs_per_channel_min:300,channel_count:12,channel_estimates:analysis,
   apparent_positive_channels:yes,not_statistically_positive_channels:no,
   apparent_complete:yes.length===12,causal_efficacy_attested:false,
   real_provider_origin_attested:false,blinded_evaluator_origin_attested:false,
   user_experience_improved_attested:false,
   required_external_evidence:'INDEPENDENT_REAL_MODEL_PROVIDER_LOGS_PLUS_BLINDED_RATER_IDENTITY_AND_PREREGISTRATION'});
 }catch{return reject('MALFORMED_REPORT')}
}
