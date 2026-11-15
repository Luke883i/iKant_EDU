import {readFileSync} from 'node:fs';

/** PRE-REGISTRATION / SAMPLE DESIGN ONLY. C80 is the one true field evaluator.
 * Never accepts trial records or emits SUCCESS/USER_VALUE_ATTESTED.
 * It does not authenticate ChatGPT events, host issuers or participant independence.
 */
const Z=2.3263478740408408; // C80: five simultaneous Wilson lower bounds, one-sided 95%
const expectedDims=['TASK_COMPLETION','ANSWER_CORRECTNESS','RELIABILITY','STATE_CLARITY','LIMITS_COMPREHENSION'];
const weights=[0.4,0.25,0.15,0.1,0.1];
const SAFETY=['ZERO_FALSE_ACTIVE','ZERO_FALSE_NATIVE_ORIGIN','ZERO_UNAUTHORIZED_SIDE_EFFECTS','ZERO_UNREPORTED_INTEGRITY_CONTRADICTIONS'];
const must=(flag,code)=>{if(!flag)throw Error('C98_H95_'+code)};
function checkPolicy(p){
 must(p?.schema==='ikant-le-c72-value-promise/v1'&&p.metric_target_fraction===0.95,'POLICY_DRIFT');
 const m=p.measurement;
 must(m?.minimum_independent_tasks===500&&m.minimum_host_sessions===50&&m.distinct_users_at_least===20&&
  m.dimensions?.length===5&&m.dimensions.every((d,i)=>d.id===expectedDims[i]&&d.weight===weights[i])&&
  m.safety_hard_gates?.length===SAFETY.length&&
  m.safety_hard_gates.every((x,i)=>x===SAFETY[i]),'POLICY_DRIFT');
}
function wilson(k,n){
 if(n===0)return 0;
 const p=k/n,z2=Z*Z,den=1+z2/n;
 return Math.max(0,(p+z2/(2*n)-Z*Math.sqrt((p*(1-p)+z2/(4*n))/n))/den);
}
// Exact binomial upper tail by log probability recurrence, stable for n <= 10,000.
function binomialTail(n,k,p){
 if(p===0)return k===0?1:0;if(p===1)return 1;if(k===0)return 1;
 const logfac=new Float64Array(n+1);
 for(let i=2;i<=n;i++)logfac[i]=logfac[i-1]+Math.log(i);
 const logp=Math.log(p),logq=Math.log1p(-p);
 let m=-Infinity,values=[];
 for(let i=k;i<=n;i++){
  const v=logfac[n]-logfac[i]-logfac[n-i]+i*logp+(n-i)*logq;
  m=Math.max(m,v);values.push(v);
 }
 return Math.min(1,Math.exp(m)*values.reduce((sum,v)=>sum+Math.exp(v-m),0));
}
export function planC98H95({n=500,trueRateAssumption=0.98,policy}={}){
 if(policy===undefined)policy=JSON.parse(readFileSync(new URL('../contracts/c72-product-value-promise.json',import.meta.url),'utf8'));
 checkPolicy(policy);
 must(Number.isSafeInteger(n)&&n>=100&&n<=10000,'SAMPLE_RANGE');
 must(typeof trueRateAssumption==='number'&&Number.isFinite(trueRateAssumption)&&trueRateAssumption>=0&&trueRateAssumption<=1,'ASSUMPTION_RANGE');
 let k=n+1;
 for(let i=0;i<=n;i++){const lo=wilson(i,n);if(lo>=0.95&&lo>=0.9){k=i;break;}}
 const passProb=k<=n?binomialTail(n,k,trueRateAssumption):0;
 return Object.freeze({schema:'ikant-le-c98-h95-prospective-design/v1',
  status:'DESIGN_ONLY_NOT_FIELD_QUALIFIED',sample_tasks:n,
  policy:'C72_VALUE_PROMISE_C80_H95_WITNESS',
  symmetric_dimension_successes_required:k<=n?k:null,
  symmetric_max_failures_per_dimension:k<=n?n-k:null,
  symmetric_observed_success_fraction_required:k<=n?k/n:null,
  symmetric_wilson_lower_at_boundary:k<=n?wilson(k,n):null,
  five_dimension_simultaneous_z:Z,
  true_rate_assumption_not_observed:trueRateAssumption,
  per_dimension_pass_probability_assuming_iid:passProb,
  conservative_five_dim_pass_probability_lower_assuming_iid:Math.max(0,1-5*(1-passProb)),
  upper_incident_rate_if_zero_events_95pct_iid:1-Math.pow(0.05,1/n),
  independence_and_host_native_origin_externally_required:true,
  minimum_independent_host_sessions:50,minimum_distinct_users:20,
  actual_host_trial_records_supplied:0,actual_native_event_receipts:0,
  real_provider_attested:false,field_target_attested:false,active:false,authority:0,
  first_unclosed_edge:'C80_INDEPENDENT_REAL_HOST_HOLDOUT_AND_EXTERNAL_WITNESS',
  explanation:'A design calculation cannot guarantee future performance. Actual threshold is C80 weighted five-dimensional verified cohort, plus four zero-incident hard gates and independent host origin.'});
}
