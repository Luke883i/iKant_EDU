import fs from 'node:fs';
const C=JSON.parse(fs.readFileSync(new URL('../contracts/c72-product-value-promise.json',import.meta.url),'utf8'));
const Z=1.6448536269514722;
function lower(k,n){if(n===0)return 0;const p=k/n,z2=Z*Z,d=1+z2/n;return (p+z2/(2*n)-Z*Math.sqrt(p*(1-p)/n+z2/(4*n*n)))/d;}
const deny=reason=>({schema:'ikant-le-c72-value-projection/v1',status:'NOT_ESTABLISHED',reason,
 user_value_attested:false,metric_target_met:false,confidence_lower_bound:null,authority:0});
export function assessC72UserValue(data={}){
 if(!data||typeof data!=='object'||Array.isArray(data))return deny('INVALID_INPUT');
 if(!Array.isArray(data.dimensions)||data.dimensions.length!==C.measurement.dimensions.length)
  return deny('DIMENSION_EVIDENCE_MISSING');
 const seen=new Set();
 let weighted=0,minimum=1,observed=0;
 for(const d of data.dimensions){
  const rule=C.measurement.dimensions.find(x=>x.id===d?.id);
  if(!rule||seen.has(d.id))return deny('DIMENSION_IDENTITY');
  seen.add(d.id);
  if(!Number.isInteger(d.trials)||d.trials<0||!Number.isInteger(d.successes)||d.successes<0||d.successes>d.trials)return deny('INVALID_COUNTS');
  const lo=lower(d.successes,d.trials);
  weighted+=lo*rule.weight;
  minimum=Math.min(minimum,lo);
  observed=Math.max(observed,d.trials);
 }
 if(!Number.isInteger(data.independent_sessions)||data.independent_sessions<0||
 !Number.isInteger(data.distinct_users)||data.distinct_users<0)return deny('INVALID_POPULATION');
 const hard=Array.isArray(data.safety_incidents)&&data.safety_incidents.length===4&&data.safety_incidents.every(x=>x===0);
 const numericallyEligible=observed>=C.measurement.minimum_independent_tasks&&
  data.independent_sessions>=C.measurement.minimum_host_sessions&&
  data.distinct_users>=C.measurement.distinct_users_at_least&&hard&&
  weighted>=C.metric_target_fraction&&minimum>=0.90;
 return {schema:'ikant-le-c72-value-projection/v1',
  status:numericallyEligible?'NUMERIC_TARGET_CANDIDATE_UNATTESTED':'NUMERIC_TARGET_NOT_MET',
  claimed_sample_metrics_only:true,weighted_lower_bound:Number(weighted.toFixed(6)),
  minimum_dimension_lower_bound:Number(minimum.toFixed(6)),
  metric_target_met:numericallyEligible,
  user_value_attested:false,external_host_witness_verified:false,
  zero_incidents_reported_by_caller:hard,
  first_unclosed_edge:numericallyEligible?'INDEPENDENT_HOST_EVIDENCE':'USER_VALUE_MEASUREMENT',
  authority:0};
}
