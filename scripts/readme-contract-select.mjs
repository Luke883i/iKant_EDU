/** Deterministic HOST editorial-contract selector. Authority zero.
 * 100 combinations of 5 audience orders x 5 narrative orders x 4 evidence policies.
 * Scores are rubric judgements, NOT user-study results or cognitive measurements.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const audience=[
  ['HUMAN_RESEARCH_TECH',30],['HUMAN_TECH_RESEARCH',24],
  ['RESEARCH_HUMAN_TECH',20],['TECH_HUMAN_RESEARCH',14],['TECH_RESEARCH_HUMAN',8]
];
const journey=[
  ['QUESTION_TO_PROOF_TO_RELEASE',30],['QUESTION_TO_CODE_TO_RELEASE',23],
  ['PROOF_TO_QUESTION_TO_RELEASE',18],['SETUP_FIRST',12],['API_FIRST',6]
];
const evidence=[
  ['FOUR_EXPLICIT_EVIDENCE_CLASSES',40],['QUALIFIED_CONDITIONAL_CLAIMS',25],
  ['GENERIC_DISCLAIMER',12],['UNQUALIFIED_ACTIVE_CLAIMS',-100]
];
export function selectContracts(){
  const all=[];
  for(const [audienceId,a] of audience)for(const [journeyId,j] of journey)
    for(const [evidenceId,e] of evidence){
      const eligible=evidenceId!=='UNQUALIFIED_ACTIVE_CLAIMS';
      all.push({id:`DOC${String(all.length+1).padStart(3,'0')}`,
        audience:audienceId,journey:journeyId,evidence_policy:evidenceId,
        score:a+j+e,eligible});
    }
  const ranked=all.filter(x=>x.eligible).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  return {schema:'ikant-host-readme-editorial-contracts/v1',authority:0,
    source_basis:'Luke883i/iKant_LE@642ed98baea2c4de40046bd96bf366cc494890ae',
    rubric:{dimensions:['audience_first','logical_progression','claim_evidence'],
      combinations:'5x5x4',tie_break:'lexical ID',empirical_study:false,
      scope:'best of these 100 editorial-layout contracts only'},
    count:all.length,eligible:ranked.length,winner:ranked[0],candidates:all};
}
export const requiredFragments=Object.freeze([
 'infrastruttura cognitiva verificabile',
 'Umano:', 'LLM:', 'iKant:', 'HOST:',
 '**EDU**', '**MCP_EXTERNAL**', '`EXPERIMENTAL`',
 '`avvia iKant`', '`I ACCEPT`', '**esattamente una selezione successiva al consenso: EDU**',
 'Node.js **20+**', 'Python 3',
 '**DOCUMENTATO / OSSERVATO / INFERITO / NON ATTESTATO**',
 'RQ1', 'RQ2', 'RQ3', 'non** verità',
 'non installano Node',
]);
export function verifyReadme(readme,root=ROOT){
  const errors=[];
  for(const frag of requiredFragments)if(!readme.includes(frag))errors.push('missing:'+frag);
  for(const m of readme.matchAll(/\]\((docs\/[^)#\s]+\.md)\)/g))
    if(!fs.existsSync(path.join(root,m[1])))errors.push('broken:'+m[1]);
  if(readme.includes('MCP connesso implica ACTIVE')||readme.includes('è una coscienza dimostrata'))
    errors.push('false_product_claim');
  if(readme.indexOf('### Tre modi')>readme.indexOf('## Stato e autorità'))
    errors.push('inverted_audience_order');
  return {ok:errors.length===0,errors};
}
export function falsifyReadme(readme,root=ROOT){
  const outcomes=[];
  // 18 mandatory independent semantic anchors, 10 mutations on each anchor,
  // but cap at 100 variations (actual altered text, not duplicate invocations).
  for(let i=0;i<100;i++){
    const anchor=requiredFragments[i%requiredFragments.length];
    // Delete every copy: a long standalone README can legitimately repeat an anchor.
    // Removing one copy must not be mistaken for deleting the underlying claim.
    const mut=readme.replaceAll(anchor,`[MUTATED_${i}_${anchor.length}]`);
    const verdict=verifyReadme(mut,root);
    outcomes.push({id:i+1,anchor,rejected:!verdict.ok,first_error:verdict.errors[0]||null});
  }
  return {count:outcomes.length,unique_mutated_texts:outcomes.length,
    rejected:outcomes.filter(x=>x.rejected).length,accepted:outcomes.filter(x=>!x.rejected).length,
    families:requiredFragments.length,outcomes};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const text=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
  const contract=selectContracts(),positive=verifyReadme(text),negative=falsifyReadme(text);
  const result={...contract,verification:{positive,negative:{...negative,outcomes:undefined}}};
  if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(result,null,2)+'\n');
  else process.stdout.write(`contracts=${contract.count} selected=${contract.winner.id} score=${contract.winner.score} positive=${positive.ok} mutants_rejected=${negative.rejected}/100\n`);
  if(contract.count!==100||!positive.ok||negative.rejected!==100)process.exitCode=1;
}
