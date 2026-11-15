/** Reproducible 1000 design alternatives; scores measure assumptions, not real efficacy. */
import fs from 'node:fs';
import crypto from 'node:crypto';
const C=JSON.parse(fs.readFileSync(new URL('../contracts/c140-e2e-semantic-assurance.json',import.meta.url)));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
export function qualifyC140Lattice(){
 const atoms=C.atoms;
 if(atoms.length!==42||new Set(atoms.map(x=>x.id)).size!==42||Object.keys(C.levels).length!==7||
  !atoms.every((x,i)=>x.id==='A'+String(i+1).padStart(2,'0')&&x.issue&&x.improvement&&x.owner&&
   x.dod&&x.metric&&x.falsifier&&x.status&&Array.isArray(x.edges)&&x.edges.length>0)||
  C.cross_edges.length<10||C.release.product!=='PRODUCT_NO_GO'||C.native_event_attested!==false)
  throw Error('C140_ATOM_OR_RELEASE_INVARIANT');
 const rows=[];
 for(let r=0;r<5;r++)for(let a=0;a<5;a++)for(let w=0;w<5;w++)for(let e=0;e<8;e++){
  const id=`R${r}-A${a}-W${w}-E${e}`;
  // Minimum gates: separate safe route, frozen admission, original writer, physical evidence.
  const feasible=r===4&&a>=3&&w>=3&&e>=2&&e!==6;
  const coverage=3*r+2*a+3*w+e;
  const effort=r+a+w+e;
  const score=8*r+6*a+8*w+5*e-2*effort;
  rows.push({id,feasible,score,coverage,effort,r,a,w,e});
 }
 const qualified=rows.filter(x=>x.feasible).sort((x,y)=>y.score-x.score||y.coverage-x.coverage||x.effort-y.effort||x.id.localeCompare(y.id));
 if(rows.length!==1000||qualified.length===0)throw Error('C140_SELECTION_INCOMPLETE');
 const selected=qualified[0];
 return {schema:'ikant-le-c140-contract-selection/v1',candidate_count:rows.length,
  feasible_count:qualified.length,selected:selected.id,selected_score:selected.score,
  candidates_sha256:sha(JSON.stringify(rows)),issues_mapped:atoms.length,
  levels:Object.keys(C.levels).length,cross_edges:C.cross_edges.length,
  score_is_empirical:false,semantic_truth_attested:false,
  product:'PRODUCT_NO_GO',native_event_attested:false};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)
 console.log(JSON.stringify(qualifyC140Lattice(),null,2));
