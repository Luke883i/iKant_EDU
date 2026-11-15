/** Local PRE-PR: exhaustive 5x5x5x8 engineering score, not evidence of empirical superiority. */
import crypto from 'node:crypto';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const factors={
 routing:[
  ['R0','topic allowlist',0,0,false],['R1','C132 sovereign',2,1,false],['R2','keywords only',4,1,false],
  ['R3','typed C135 owner arbitration with guarded shadow C141',18,8,true],
  ['R4','read-only conflict triage with no writer integration',14,3,true]],
 budget:[
  ['B0','truncate to 600 bytes',1,0,false],['B1','fixed 12 KB typed STOP',9,1,true],
  ['B2','bounded fragments with exact join only',14,4,true],
  ['B3','capability-negotiated finite fragments + exact join + STOP',19,6,true],
  ['B4','claim infinite input transport',0,0,false]],
 epistemic:[
  ['E0','model lexical score certifies truth',0,0,false],
  ['E1','heuristic and explicit unverified claims',10,1,true],
  ['E2','self-reflection proves correctness',2,0,false],
  ['E3','negative controls + falsifiers + independent evaluator external gate',19,5,true],
  ['E4','semantic losslessness is guaranteed by hash',0,0,false]],
 boundary:[
  ['P0','fabricate native identity',0,0,false],['P1','local receipts with PRODUCT_NO_GO',9,1,true],
  ['P2','promise chat-to-chat persistence in prompt',1,0,false],
  ['P3','replace C87 with second writer',2,2,false],
  ['P4','HOST-bound session handoff + external native gate',15,4,true],
  ['P5','raw secrets retained in ledger',1,0,false],
  ['P6','minimized HOST annex + provider/product gate separated',19,5,true],
  ['P7','treat synthetic CI as release',2,0,false]]
};
const selected='R3-B3-E3-P6';
export function qualifyC141Designs({complexityPenalty=2,weights=[4,4,5,4]}={}){
 const all=[];
 for(const r of factors.routing)for(const b of factors.budget)for(const e of factors.epistemic)for(const p of factors.boundary){
  const id=[r,b,e,p].map(x=>x[0]).join('-');
  const feasible=[r,b,e,p].every(x=>x[4]);
  const score=weights.reduce((s,w,i)=>s+w*[r,b,e,p][i][2],0)-complexityPenalty*[r,b,e,p].reduce((s,x)=>s+x[3],0);
  all.push({id,feasible,score,complexity:[r,b,e,p].reduce((s,x)=>s+x[3],0),routing:r[1],budget:b[1],epistemic:e[1],boundary:p[1],reason:feasible?'ELIGIBLE':'HARD_INVARIANT_VIOLATION'});
 }
 const feasible=all.filter(x=>x.feasible).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 return {schema:'c141-local-selection/v1',synthetic:true,empirical_optimality_attested:false,source_epoch:'PR148_PROPOSED_NOT_MAIN',total:all.length,feasible:feasible.length,selected:feasible[0],top5:feasible.slice(0,5),all,checksum_sha256:sha(JSON.stringify(all))};
}
if(process.argv[1]&&new URL(`file://${process.argv[1]}`).href===import.meta.url){
 const result=qualifyC141Designs();
 if(result.total!==1000||result.selected.id!==selected)process.exitCode=1;
 console.log(JSON.stringify({tested:result.total,feasible:result.feasible,selected:result.selected.id,score:result.selected.score,sha256:result.checksum_sha256,top3:result.top5.slice(0,3).map(x=>x.id)},null,2));
}
