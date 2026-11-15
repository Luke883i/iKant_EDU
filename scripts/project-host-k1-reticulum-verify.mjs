#!/usr/bin/env node
/** DoD proof-of-coverage, NOT proof that all 18 real effects occurred. */
import fs from 'node:fs';
const q=JSON.parse(fs.readFileSync('contracts/project-host-k1-evidence-reticulum.json','utf8'));
const required=Array.from({length:18},(_,i)=>'D'+String(i).padStart(2,'0'));
const ids=q.nodes?.map(n=>n.id),seen=new Set();
let edges=0;
if(q.authority!==0||q.no_preconsent_write!==true||q.no_new_c72_c87_c135_c125_owner!==true||
 JSON.stringify(ids)!==JSON.stringify(required)||new Set(ids).size!==18||
 q.edge_tests?.length!==3||q.proof_domains?.P!=='PRODUCT_NO_GO'||
 q.proof_domains?.D!=='UNKNOWN_CHATGPT_INSTALLATION'||
 !q.no_more_semantic_commits_gate?.startsWith('FAIL_CLOSED_'))
 throw Error('R2_CONSTITUTIONAL_CONTRACT_INVALID');
for(const node of q.nodes){
 if(typeof node.first_failure_edge!=='string'||!node.first_failure_edge||
    !['K1_SOFTWARE_NEGATIVE_OR_SOURCE_SCOPE_ONLY','ORIGINAL_OWNER_OR_FIELD_UNKNOWN'].includes(node.qualification))
  throw Error('R2_NODE_UNQUALIFIED:'+node.id);
 for(const dependency of node.depends_on){
  if(!seen.has(dependency))throw Error('R2_MISSING_OR_CYCLIC_EDGE:'+node.id+':'+dependency);
  edges++;
 }
 seen.add(node.id);
}
const result={schema:'ikant-k1-r2-dod-reachability/v1',checked_nodes:18,
 reachable_edges:edges,cyclic:false,source_contract_valid:true,
 three_authenticity_bypasses_mapped:q.edge_tests.length,
 source_negative_tests_required:true,field_dod_all_closed:false,
 no_more_semantic_commits_needed:'NOT_ATTESTED_FAIL_CLOSED',
 release:'PRODUCT_NO_GO'};
process.stdout.write(JSON.stringify(result,null,2)+'\n');
