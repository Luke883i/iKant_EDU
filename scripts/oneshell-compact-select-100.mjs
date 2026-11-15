#!/usr/bin/env node
/** Semantic-design experiment, NOT 100 human studies or independent LLM calls.
 * 10 display frames x 10 information transforms, deterministic 100 candidates.
 */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const frames=[
 ['SIX_CONTIGUOUS',6,0,true],['SIX_SPACED',11,1,true],
 ['SIX_BULLETS',6,2,true],['ONE_LINE',1,3,false],
 ['TRIPLES',3,4,false],['JSON_OBJECT',11,5,false],
 ['YAML',6,6,false],['WIDE_TABLE',8,7,false],
 ['SIX_CARDS',18,8,false],['VISUAL_DIAGRAM',1,9,false]
];
const mutations=[
 ['EXACT_TEXT',true,true,true,true],
 ['ALIAS_TITLES_ONLY',true,true,true,true],
 ['REMOVE_INTER_SLOT_BLANK_LINES',true,true,true,true],
 ['TRUNCATE_SURFACE_A',false,true,true,true],
 ['PARAPHRASE_OWNER_A',false,true,true,true],
 ['OMIT_NO_VOICE',false,true,true,true],
 ['SHORTEN_PROOF_TO_UNOPENED_HASH',true,false,true,true],
 ['DROP_EDGE',true,true,false,true],
 ['DROP_NEXT',true,true,true,false],
 ['SHORTEN_HOST_B_WITHOUT_VERIFIED_ORIGINAL',true,false,true,true]
];
const results=[];
for(let i=0;i<10;i++)for(let j=0;j<10;j++){
 const [layout,visual_lines,ornament,scannable]=frames[i];
 const [mutation,preserves_A,proof_complete,edge_complete,next_complete]=mutations[j];
 const accepted=preserves_A&&proof_complete&&edge_complete&&next_complete&&scannable;
 const reasons=[];
 if(!preserves_A)reasons.push('ORIGINAL_A_BYTES_OR_NO_VOICE_LOST');
 if(!proof_complete)reasons.push('SEMANTIC_RETENTION_NOT_ATTESTED');
 if(!edge_complete)reasons.push('FIRST_EDGE_LOST');
 if(!next_complete)reasons.push('OWNER_NEXT_LOST');
 if(!scannable)reasons.push('SIX_SLOT_HUMAN_NAVIGATION_NOT_ATTESTED');
 // Reward minimum visible physical lines, zero added ornament, stable labels.
 const cost=visual_lines*4+ornament*5+(mutation==='ALIAS_TITLES_ONLY'?1:0)
   +(mutation==='REMOVE_INTER_SLOT_BLANK_LINES'?0:1);
 results.push({id:String(i*10+j+1).padStart(3,'0'),layout,mutation,visual_lines,
  invariant_A:preserves_A,invariant_PROVA:proof_complete,invariant_EDGE:edge_complete,
  invariant_NEXT:next_complete,scannable,admissible:accepted,
  rejection:reasons,cost:accepted?cost:null});
}
const admissible=results.filter(x=>x.admissible);
admissible.sort((a,b)=>a.cost-b.cost||a.id.localeCompare(b.id));
const chosen=admissible[0];
const envelope={schema:'ikant-le-oneshell-compact-100-design/v1',kind:'DETERMINISTIC_DESIGN_FALSIFICATION_NOT_HUMAN_STUDY',
  combinations:results.length,frames:frames.map(x=>x[0]),mutations:mutations.map(x=>x[0]),
  invariant:'ESITO,A,B,PROVA,EDGE,NEXT unchanged; A UTF-8 exact or NO_VOICE; original PROVA/EDGE/NEXT retained',
  minimum:'SIX_CONTIGUOUS | NO_BLANK_PARAGRAPHS | NO_TRUNCATION',
  admissible:admissible.length,rejected:100-admissible.length,
  selected:chosen,all_cases:results};
const stable=JSON.stringify(envelope,null,2)+'\n';
const digest=createHash('sha256').update(stable).digest('hex');
if(process.argv[2]&&process.argv[2]!=='-')fs.writeFileSync(process.argv[2],stable,{flag:'w'});
console.log(JSON.stringify({tested:100,admissible:admissible.length,rejected:100-admissible.length,
 chosen:chosen.id,layout:chosen.layout,mutation:chosen.mutation,
 digest_sha256:digest,claim:'SEMANTIC_DESIGN_ONLY_NOT_HUMAN_PROOF'}));
