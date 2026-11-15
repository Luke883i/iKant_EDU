import fs from 'node:fs';
import crypto from 'node:crypto';

const L=JSON.parse(fs.readFileSync('contracts/session-chat-semantic-lattice.json','utf8'));
const M=L.mechanisms||[],n=M.length,full=(1<<n)-1;
if(n!==12)throw new Error('C59 lattice must contain exactly 12 mechanisms');
const classes={
 source:[0,1],
 authority:[2,3,4],
 transport:[5,6,7],
 runtime:[8,9,10,11]
};
const has=(mask,i)=>(mask&(1<<i))!==0;
const oracle=mask=>mask===full;
const candidate=mask=>{
 const source=classes.source.every(i=>has(mask,i));
 const authority=classes.authority.every(i=>has(mask,i));
 const transport=classes.transport.every(i=>has(mask,i));
 const runtime=classes.runtime.every(i=>has(mask,i));
 return source&&authority&&transport&&runtime;
};
let valid=0,mismatch=0,min=Infinity,winnerMask=null;
for(let mask=0;mask<=full;mask++){
 const o=oracle(mask),c=candidate(mask);
 if(c){valid++;const cost=mask.toString(2).split('1').length-1;if(cost<min){min=cost;winnerMask=mask;}}
 if(o!==c)mismatch++;
}
const deletions=M.map((m,i)=>{
 const mask=full&~(1<<i);
 return{mechanism:m.id,mask,candidate_active:candidate(mask),oracle_active:oracle(mask),killed:!candidate(mask)&&!oracle(mask),failure_if_deleted:m.failure_if_deleted};
});
const material={
 schema:'ikant-le-c59-minimum-semantic-lattice-selection/v1',
 cases:full+1,
 mechanism_count:n,
 valid_candidates:valid,
 winner_mask:winnerMask,
 minimum_cost:min,
 oracle_candidate_mismatches:mismatch,
 deletion_mutants:deletions,
 all_deletion_mutants_killed:deletions.every(x=>x.killed),
 status:valid===1&&winnerMask===full&&min===n&&mismatch===0&&deletions.every(x=>x.killed)?'PASS':'FAIL'
};
const receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(material)).digest('hex');
console.log(JSON.stringify({...material,receipt_sha256},null,2));
if(material.status!=='PASS')process.exitCode=1;
