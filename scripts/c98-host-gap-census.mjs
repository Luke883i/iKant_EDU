import {readFileSync} from 'node:fs';
const load=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const source=load('contracts/c98-post-pr101-evidence.json');
const map=load('contracts/c98-gap-to-owner-map.json');
const proto=load('contracts/c98-h95-field-protocol.json');
const edges=source.host_or_externally_open_edges;
if(map.base_source_head!==source.frozen_main_head||map.gaps.length!==14||
  new Set(map.gaps.map(x=>x.edge)).size!==14||
  JSON.stringify(map.gaps.map(x=>x.edge))!==JSON.stringify(edges)||
  map.gaps.some(x=>!x.reuse||!x.proof)||proto.current_observation!=='NOT_MEASURED'||
  proto.measurement_owner!=='host/c80-field-witness.mjs#evaluateC80H95'||
  map.host_attested_closed_gaps.length!==0||map.field_H95_attested!==false)
  throw Error('C98_GAP_OWNER_CENSUS_DRIFT');
const output={schema:'ikant-le-c98-current-host-gap-census/v1',
  baseline_head:source.frozen_main_head,gap_count:edges.length,
  source_owner_reuse_mapped:map.gaps.length,host_observed_success_count:0,
  native_delivery_attested:false,field_H95_attested:false,active:false,
  first_unclosed_edge:edges[0],
  scope:'STRUCTURAL_MAPPED_REUSE_NOT_ACTUAL_HOST_EXECUTION',
  gaps:map.gaps.map(x=>({edge:x.edge,reuse:x.reuse,
    status:'OPEN_UNTIL_INDEPENDENT_HOST_READBACK',acceptance_proof:x.proof}))};
console.log(JSON.stringify(output,null,2));
