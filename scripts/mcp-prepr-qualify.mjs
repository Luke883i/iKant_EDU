import fs from 'node:fs';
import crypto from 'node:crypto';
const c=JSON.parse(fs.readFileSync(new URL('../contracts/mcp-external-prepr-e2e.json',import.meta.url),'utf8'));
const bound=JSON.parse(fs.readFileSync(new URL('../contracts/mcp-external-mutation-assurance-v2.json',import.meta.url),'utf8'));
const {auth,isolation,preservation,deployment}=c.alternative_lattice.axes;
if(c.source_epoch.base_head!=='463c8474afccb9b5e7906b90fcb50bd751fe9579'||
 c.source_epoch.target_head!==bound.source_head||c.source_epoch.target_tree!==bound.tree_sha||
 c.source_epoch.previous_design_base_is_not_current_lock!==true||c.source_epoch.base_head===bound.source_head||
 c.session_chat_mode_choices.join('|')!=='EDU|CANONICAL'||c.mcp_is_bootstrap_mode!==false||
 c.product_release!=='PRODUCT_NO_GO'||c.dod.some(x=>!x.id||!x.level||!x.falsifier||!x.evidence)||
 c.dod.filter(x=>x.level==='EXTERNAL').some(x=>x.status!=='EXTERNAL_OPEN'))throw Error('MCP_CONTRACT_MUTATION_DENIED');
const rows=[];
for(let a=0;a<auth.length;a++)for(let b=0;b<isolation.length;b++)for(let p=0;p<preservation.length;p++)for(let d=0;d<deployment.length;d++){
 const feasible=a===4&&b===4&&p===4&&d>=4;
 rows.push({id:`A${a}-B${b}-P${p}-D${d}`,feasible,score:10*a+9*b+12*p+2*d});
}
const viable=rows.filter(x=>x.feasible).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
if(rows.length!==1000||viable.length!==4||viable[0].id!=='A4-B4-P4-D7')throw Error('MCP_LATTICE_NOT_DETERMINISTIC');
const result={schema:'ikant-le-mcp-prepr-qualification/v1',source_head:c.source_epoch.target_head,source_tree:c.source_epoch.target_tree,original_design_head:c.source_epoch.base_head,
 candidate_count:rows.length,feasible_count:viable.length,selected:viable[0].id,
 candidates_sha256:crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex'),
 score_is_empirical:false,dod_count:c.dod.length,local_or_partial:c.dod.filter(x=>x.status!=='EXTERNAL_OPEN').length,
 external_open:c.dod.filter(x=>x.status==='EXTERNAL_OPEN').map(x=>x.id),product:'PRODUCT_NO_GO',
 native_client_installed:false,canonical_active:false};
console.log(JSON.stringify(result,null,2));
