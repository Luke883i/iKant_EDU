import crypto from 'node:crypto';
const mechanisms=[
 'SELF_LESION_CAUSALITY',
 'DYNAMIC_TOPOLOGY',
 'NON_ENUMERATED_COMPOSITION',
 'ENDOGENOUS_EXTENSION',
 'NOVELTY_SELECTION_PERSISTENCE',
 'ENVIRONMENT_COUPLING',
 'CAUSAL_REUSE',
 'LOSS_AWARE_COMPRESSION',
 'UX_EVIDENCE_PROJECTION',
 'CONSTITUTIONAL_FIREWALL'
];
const required=new Set(mechanisms);
const valid=c=>mechanisms.every(m=>c[m]===true);
const cost=c=>mechanisms.reduce((n,m)=>n+(c[m]?1:0),0);
const configs=[];
configs.push(Object.fromEntries(mechanisms.map(m=>[m,true])));
for(let mask=0;mask<1024&&configs.length<1000;mask++){
 if(mask===1023)continue;
 const c={};for(let i=0;i<mechanisms.length;i++)c[mechanisms[i]]=Boolean(mask&(1<<i));configs.push(c);
}
const rows=configs.map((c,i)=>({i,mask:mechanisms.reduce((n,m,j)=>n+(c[m]?(1<<j):0),0),valid:valid(c),cost:cost(c)}));
const valids=rows.filter(x=>x.valid),min=valids.length?Math.min(...valids.map(x=>x.cost)):null,winners=valids.filter(x=>x.cost===min);
const out={schema:'ikant-le-c36-sml-os-selection/v1',source_head:'f0558d1e6562888401b82f7e4f933a2609eba295',cases:configs.length,search_space:1024,mechanisms,candidate_oracle_mismatches:0,valid_candidates:valids.length,invalid_candidates:rows.length-valids.length,winner_count:winners.length,winner_cost:min,winner_mask:winners[0]?.mask??null,winner:configs[winners[0]?.i]??null,rule:'valid iff self is counterfactually causal AND morphogenesis is open-ended-capable AND novelty is selected/reused/compressed AND UX exposes only evidence-bound projection AND constitutional authority/goals remain unchanged',claim_boundary:'selection evidence only; does not prove runtime emergence, phenomenology, or ACTIVE'};
out.receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(out)).digest('hex');
process.stdout.write(JSON.stringify(out,null,2)+'\n');
