/** Metric calculator only. Caller-supplied trial rows do not prove real humans. */
const quant=(xs,p)=>xs[Math.ceil((p/100)*xs.length)-1];
export function summarizeS05Trials(trials){
 if(!Array.isArray(trials)||trials.length===0||trials.length>10000)
  return {ok:false,first_edge:'S05_NO_VALID_TRIALS',pilot_qualified:false};
 const seen=new Set(),lat=[];let errors=0,steps=0,completed=0;
 for(const x of trials){
  if(!x||typeof x!=='object'||Array.isArray(x)||typeof x.trial_id!=='string'||
   !/^[A-Za-z0-9_-]{8,72}$/.test(x.trial_id)||seen.has(x.trial_id)||
   !Number.isSafeInteger(x.elapsed_ms)||x.elapsed_ms<0||x.elapsed_ms>3600000||
   !Number.isSafeInteger(x.manual_steps)||x.manual_steps<0||x.manual_steps>100||
   !Number.isSafeInteger(x.errors)||x.errors<0||x.errors>100||typeof x.completed!=='boolean')
   return {ok:false,first_edge:'S05_INVALID_OR_DUPLICATE_TRIAL',pilot_qualified:false};
  seen.add(x.trial_id);lat.push(x.elapsed_ms);steps+=x.manual_steps;errors+=x.errors;completed+=Number(x.completed);
 }
 lat.sort((a,b)=>a-b);
 return {ok:true,trial_count:trials.length,p50_ms:quant(lat,50),p95_ms:quant(lat,95),
  mean_steps:steps/trials.length,total_errors:errors,completions:completed,
  provenance:'CALLER_ROWS_UNVERIFIED',pilot_qualified:false,
  first_edge:'S05_INDEPENDENT_USER_TRIAL_PROVENANCE_REQUIRED'};
}
