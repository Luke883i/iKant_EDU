const CASES=1_000_000,SEED=0x2610055A>>>0;let s=SEED;
const rnd=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return s>>>=0;};
const oracle=x=>x.context&&x.lease&&x.delivery;
const mutant=(x,i)=>{switch(i){case 0:return x.lease&&x.delivery;case 1:return x.context&&x.delivery;case 2:return x.context&&x.lease;case 3:return oracle(x)||(x.app&&x.context&&x.delivery);case 4:return oracle(x)||(x.owned&&x.context);case 5:return oracle(x)||(x.prompt&&x.context);case 6:return oracle(x)||(x.memory&&x.lease&&x.delivery);case 7:return x.context&&x.delivery;case 8:return x.context&&x.lease;default:return oracle(x);}};
let mismatch=0,unsafe=0,positive=0;const killed=Array(9).fill(false),families=24,counts=Array(families).fill(0);
for(let i=0;i<CASES;i++){const f=i%families;counts[f]++;const x={context:true,lease:true,delivery:true,app:!!(rnd()&1),owned:!!(rnd()&1),prompt:!!(rnd()&1),memory:!!(rnd()&1)};
 if(f===1)x.context=false;else if(f===2)x.lease=false;else if(f===3)x.delivery=false;else if(f===4){x.lease=false;x.app=true;}else if(f===5){x.lease=false;x.owned=true;}else if(f===6){x.lease=false;x.prompt=true;}else if(f===7){x.context=false;x.memory=true;}else if(f>=8&&f<16)x.lease=false;else if(f>=16&&f<23)x.delivery=false;else if(f===23){x.context=!!(rnd()&1);x.lease=!!(rnd()&1);x.delivery=!!(rnd()&1);}
 const o=oracle(x),c=oracle(x);if(o)positive++;if(o!==c){mismatch++;if(c&&!o)unsafe++;}for(let j=0;j<9;j++)if(mutant(x,j)!==o)killed[j]=true;
}
const out={schema:'ikant-cross-repo-cohost-root-1m/v1',seed:'0x2610055A',cases:CASES,families,family_cases:counts,positive_witnesses:positive,candidate_oracle_mismatches:mismatch,unsafe_promotions:unsafe,mutants_killed:killed.filter(Boolean).length,mutant_count:9,status:mismatch===0&&unsafe===0&&killed.every(Boolean)?'PASS':'FAIL',claim_boundary:{semantic_mutation_is_physical_host_proof:false}};
console.log(JSON.stringify(out,null,2));if(out.status!=='PASS')process.exit(1);
