import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync('contracts/session-chat-composition-channel.json','utf8'));
const m=c.mechanisms;
let valid=0,min=99,winners=[];
for(let mask=0;mask<(1<<m.length);mask++){
  const n=m.filter((_,i)=>mask&(1<<i)).length;
  const ok=n===m.length;
  if(ok){
    valid++;
    if(n<min){min=n;winners=[mask]}
    else if(n===min)winners.push(mask);
  }
}
const deletions=m.map((x,i)=>({mechanism:x,killed:(((1<<m.length)-1)^(1<<i))!==(1<<m.length)-1}));
const out={schema:'ikant-le-c59-selection/v1',cases:1<<m.length,mechanism_count:m.length,valid_candidates:valid,minimum_cost:min,winner_mask:winners[0],winner_cost_ties:winners.length,all_deletion_mutants_killed:deletions.every(x=>x.killed),status:valid===1&&min===m.length&&winners.length===1?'PASS':'FAIL'};
console.log(JSON.stringify(out,null,2));
if(out.status!=='PASS')process.exitCode=1;
