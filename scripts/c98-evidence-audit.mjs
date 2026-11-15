import fs from 'node:fs';
const x=JSON.parse(fs.readFileSync(new URL('../contracts/c98-post-pr101-evidence.json',import.meta.url),'utf8'));
const edges=x.host_or_externally_open_edges.map((id,i)=>({priority:i+1,id,
 evidence:'NOT_INDEPENDENTLY_OBSERVED_IN_THIS_HOST_TURN',status:'OPEN'}));
const out={schema:'ikant-le-c98-truth-audit/v1',base:x.frozen_main_head,
 merged_pr101_verified_from_github_connector:x.pr101_merge_verified,
 physical_open_edges:edges.length,edges,
 model_proof_type:'SOURCE_BOUND_CONTRACT_AND_LOCAL_ADAPTER_TESTS',
 latest_live_host_passed_edges:[],h95_field:{required_fraction:0.95,
 tasks_min:500,host_sessions_min:50,distinct_users_min:20,observed:null,
 lower_confidence_bound:null,status:'NOT_MEASURED'},
 first_unclosed_host_edge:'C72_NATIVE_ORIGINAL_EVENT_AND_ACCEPT_SELECTION_READBACK',
 first_unclosed_post_selection_edge:'HOST_CONNECTOR_TO_NODE_FILE_CALLBACK_INSTALLED',
 status:'HOST_GAPS_OPEN_NOT_95_PERCENT_PROVEN'};
console.log(JSON.stringify(out,null,2));
