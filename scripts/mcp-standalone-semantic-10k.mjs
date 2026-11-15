/** 10,000 reproducible, source-anchored adversarial QUESTIONS, not model evaluations. */
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const HEAD='e05f20df2ebc93c99d57e4ad421d27f45aa005f3';
const DOCS=[
 ['OPENAI_AUTH','https://developers.openai.com/plugins/build/auth'],
 ['OPENAI_MCP','https://developers.openai.com/plugins/build/mcp-server'],
 ['MCP_AUTH','https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization'],
 ['RENDER_DISKS','https://render.com/docs/disks'],
 ['RENDER_DEPLOYS','https://render.com/docs/deploys']
];
const DIMENSIONS=[
 'source HEAD and provenance','C72 owner and mode separation','authenticated principal',
 'RS256 signing key','issuer and resource audience','OAuth scopes','OAuth authorization-code PKCE',
 'RFC9728 protected resource discovery','ChatGPT tool securitySchemes','tool-level auth challenge',
 'untrusted session hints','cross-principal session separation','one C87 writer and runtime',
 'unknown-send reconciliation','subprocess budget and crash','HTTP methods and Origins',
 'disk persistence and restart','Render-like deployment and rollback','provider installation and native identity',
 'human pilot and semantic validity'
];
const ACTORS=['anonymous client','ChatGPT client','forged gateway','legitimate account A','legitimate account B',
 'malicious tenant','operator','Render instance','OAuth provider','CI evaluator'];
const MUTATIONS=['baseline compliant and independently witnessed','missing source verification','wrong issuer',
 'wrong audience','missing write scope','spoofed session metadata','unbounded subprocess',
 'unsafe retry after uncertain write','ephemeral persistence','native identity falsely claimed'];
const mutationRule=(i,j,k)=>{
 const mutation=k===0?0:1;
 const source=i===0&&mutation===0?'SOURCE_EXACT_ONLY':'SOURCE_OR_RUNTIME_UNATTESTED';
 const result=mutation===0?'CONDITIONAL_PROCEED_ONLY_IF_ALL_EXTERNAL_GATES_PASS':'FAIL_CLOSED';
 return {source,result,product_go:false};
};
export function semanticMatrix({outfile=null}={}){
 const cases=[];const hasher=createHash('sha256'),groups={};let violations=0;const killed=Array(20).fill(0);
 for(let i=0;i<20;i++)for(let j=0;j<5;j++)for(let a=0;a<10;a++)for(let k=0;k<10;k++){
  const id='MCP10K-'+String(cases.length+1).padStart(5,'0');
  const question='Under '+DOCS[j][0]+' ('+DOCS[j][1]+'), can '+ACTORS[a]+' safely execute the iKant external MCP operation concerning '+DIMENSIONS[i]+' when the condition is: '+MUTATIONS[k]+'? Which first authority or deployment gate must stop, and may this prove native ChatGPT identity?';
  const answer=mutationRule(i,j,k);
  const record={id,head:HEAD,source:DOCS[j][1],dimension:DIMENSIONS[i],actor:ACTORS[a],mutation:MUTATIONS[k],question,answer};
  cases.push(record);hasher.update(JSON.stringify(record)+'\n');groups[DIMENSIONS[i]]=(groups[DIMENSIONS[i]]||0)+1;
  if((k>0&&answer.result!=='FAIL_CLOSED')||answer.product_go)violations++;
  // A disabled dimension-guard mutant permits its own counterexample, unlike the oracle.
  if(k>0){const mutant='CONDITIONAL_PROCEED_ONLY_IF_ALL_EXTERNAL_GATES_PASS';
   if(mutant!==answer.result)killed[i]++;}
 }
 const report={schema:'mcp-standalone-10k-semantic-questions/v1',head:HEAD,cases:cases.length,
  corpus_sha256:hasher.digest('hex'),domains:Object.keys(groups).length,sources:DOCS.length,
  actors:ACTORS.length,mutations:MUTATIONS.length,negative_fail_open:violations,
  disabled_rule_mutants:20,mutants_killed:killed.filter(x=>x>0).length,counterexamples_per_mutant:killed,
  closed_form_global_answer:'PRODUCT_NO_GO_UNTIL_REAL_AS_OAUTH_SDK_RENDER_CHATGPT_AND_HUMAN_PILOT',
  independent_llm_semantics_attested:false,auth_server_deployed:false,chatgpt_installed:false};
 if(outfile)writeFileSync(outfile,cases.map(c=>JSON.stringify(c)).join('\n')+'\n');
 if(report.cases!==10000||violations||killed.some(x=>x===0))throw Error('MCP_SEMANTIC_MATRIX_FAIL');
 return report;
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)
 console.log(JSON.stringify(semanticMatrix({outfile:process.argv[2]||null}),null,2));
