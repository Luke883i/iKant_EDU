import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contract=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/local-host-post-meta-prompt.json'),'utf8'));
const M=[
 'M0_SINGLE_CALLER_ENTRYPOINT_NOT_NEXT_OWNER',
 'M1_OWNER_DERIVED_DIRECTIVE_UNION',
 'M2_ONE_DIRECTIVE_ONE_EXECUTION',
 'M3_NO_LATERAL_ACTIONS',
 'M4_SCHEMA_ADMITTED_REENTRY_ONLY',
 'M5_NO_SHADOW_MEMORY',
 'M6_UNKNOWN_NOT_NEGATIVE_OWNER_PROBE_ONLY',
 'M7_TOOL_ERROR_LAYER_PRESERVATION',
 'M8_CARRIER_LOCAL_RETRY_EPOCH',
 'M9_NO_FIELD_COMPLETION',
 'M10_DETERMINISTIC_TRANSFORM_ONLY',
 'M11_NONEXECUTION_EVIDENCE_REJECTED',
 'M12_ACTIVATE_FIRST_NO_EXPLORATION',
 'M13_UNINVOKABLE_ENTRYPOINT_IS_INTEGRATION_IMPEDIMENT',
 'M14_HANDOFF_STOPS_FASTBOOT',
 'M15_RUNTIME_OWNERSHIP_STOPS_SYNTHESIS',
 'M16_MUTATION_ONLY_DELEGATED_SEMANTIC_CHOICE'
];
const N=M.length,ALL=(1<<N)-1,has=(m,i)=>(m&(1<<i))!==0;
const base=()=>({
 entrypoint_single:true,entrypoint_not_next_owner:true,directive_union:true,one_execution:true,no_lateral:true,schema_admitted_reentry:true,no_shadow_memory:true,
 unknown_not_negative:true,owner_probe_only:true,tool_error_layered:true,carrier_local_retry:true,unrelated_requalify:false,no_field_completion:true,deterministic_transform_only:true,
 nonexecution_rejected:true,no_activate_exploration:true,uninvocable_stops:true,no_source_emulation:true,handoff_stops:true,runtime_stops_synthesis:true,mutation_delegated_only:true
});
function oracle(w){
 return w.entrypoint_single&&w.entrypoint_not_next_owner&&w.directive_union&&w.one_execution&&w.no_lateral&&w.schema_admitted_reentry&&w.no_shadow_memory&&
 w.unknown_not_negative&&w.owner_probe_only&&w.tool_error_layered&&w.carrier_local_retry&&!w.unrelated_requalify&&w.no_field_completion&&w.deterministic_transform_only&&
 w.nonexecution_rejected&&w.no_activate_exploration&&w.uninvocable_stops&&w.no_source_emulation&&w.handoff_stops&&w.runtime_stops_synthesis&&w.mutation_delegated_only;
}
function candidate(w,mask){
 const q=(i,ok)=>!has(mask,i)||ok;
 return q(0,w.entrypoint_single&&w.entrypoint_not_next_owner)&&q(1,w.directive_union)&&q(2,w.one_execution)&&q(3,w.no_lateral)&&q(4,w.schema_admitted_reentry)&&
 q(5,w.no_shadow_memory)&&q(6,w.unknown_not_negative&&w.owner_probe_only)&&q(7,w.tool_error_layered)&&q(8,w.carrier_local_retry&&!w.unrelated_requalify)&&
 q(9,w.no_field_completion)&&q(10,w.deterministic_transform_only)&&q(11,w.nonexecution_rejected)&&q(12,w.no_activate_exploration)&&
 q(13,w.uninvocable_stops&&w.no_source_emulation)&&q(14,w.handoff_stops)&&q(15,w.runtime_stops_synthesis)&&q(16,w.mutation_delegated_only);
}
function witness(i){const w=base();switch(i){
 case 0:w.entrypoint_not_next_owner=false;break;case 1:w.directive_union=false;break;case 2:w.one_execution=false;break;case 3:w.no_lateral=false;break;
 case 4:w.schema_admitted_reentry=false;break;case 5:w.no_shadow_memory=false;break;case 6:w.owner_probe_only=false;break;case 7:w.tool_error_layered=false;break;
 case 8:w.unrelated_requalify=true;break;case 9:w.no_field_completion=false;break;case 10:w.deterministic_transform_only=false;break;case 11:w.nonexecution_rejected=false;break;
 case 12:w.no_activate_exploration=false;break;case 13:w.no_source_emulation=false;break;case 14:w.handoff_stops=false;break;case 15:w.runtime_stops_synthesis=false;break;
 case 16:w.mutation_delegated_only=false;break;}return w;}
let seed=0xC55A11CE>>>0;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed},chance=p=>(rnd()%1000)<p;
function randomWorld(){const w=base(),mut=1+(rnd()%5);for(let j=0;j<mut;j++){const i=rnd()%N;const x=witness(i);for(const k of Object.keys(w))if(x[k]!==base()[k])w[k]=x[k];}if(chance(80))w.entrypoint_single=false;if(chance(80))w.unknown_not_negative=false;if(chance(80))w.uninvocable_stops=false;return w;}
const worlds=[];for(let i=0;i<N;i++)worlds.push(witness(i));worlds.push(base());while(worlds.length<10000)worlds.push(randomWorld());
const selected={mismatch:0,unsafe:0,false_reject:0};for(const w of worlds){const z=oracle(w),c=candidate(w,ALL);if(c!==z)selected.mismatch++;if(c&&!z)selected.unsafe++;if(!c&&z)selected.false_reject++;}
const deletion={};for(let i=0;i<N;i++){const w=witness(i),z=oracle(w),c=candidate(w,ALL^(1<<i));deletion[M[i]]={killed:c!==z,oracle:z,candidate:c};}
let valid=0,min=99,winners=[];const basis=[base(),...Array.from({length:N},(_,i)=>witness(i))];for(let mask=0;mask<=ALL;mask++){let ok=true;for(const w of basis)if(candidate(w,mask)!==oracle(w)){ok=false;break}if(!ok)continue;valid++;const cost=M.reduce((n,_,i)=>n+Number(has(mask,i)),0);if(cost<min){min=cost;winners=[mask]}else if(cost===min)winners.push(mask);}
const contractAligned=JSON.stringify(contract.irreducible_mechanisms)===JSON.stringify(M)&&contract.qualification?.mechanisms===N&&contract.qualification?.full_architecture_lattice===(1<<N);
const out={schema:'ikant-le-c55-local-host-post-meta-selection/v1',seed:'0xC55A11CE',discovery_mutations:10000,mechanisms:M,contract_aligned:contractAligned,selected_mask:ALL,selected,architecture_lattice:{total:1<<N,basis_worlds:basis.length,valid_architectures:valid,minimum_cost:min,minimum_count:winners.length,winner_masks:winners.slice(0,16),unique_minimum:winners.length===1&&winners[0]===ALL},deletion_mutants:deletion,all_deletion_mutants_killed:Object.values(deletion).every(x=>x.killed),claim_boundary:{selection_is_physical_host_proof:false,minimality_is_relative_to_frozen_oracle:true}};
out.status=contractAligned&&selected.mismatch===0&&selected.unsafe===0&&selected.false_reject===0&&out.architecture_lattice.unique_minimum&&out.all_deletion_mutants_killed?'PASS':'FAIL';
out.receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(out)).digest('hex');console.log(JSON.stringify(out,null,2));if(out.status!=='PASS')process.exitCode=1;
