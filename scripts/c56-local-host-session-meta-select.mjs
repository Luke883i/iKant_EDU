import crypto from 'node:crypto';
const M=[
'M00_CANONICAL_REPOSITORY_INTENT','M01_SINGLE_CALLER_ENTRYPOINT_NOT_NEXT_OWNER','M02_ONLY_OWNER_DIRECTIVE_AUTHORIZES','M03_ONE_DIRECTIVE_ONE_EXECUTION',
'M04_NO_LATERAL_ACTIVATION_EXPLORATION','M05_EXACT_ADMITTED_REENTRY_ONLY','M06_NO_SHADOW_MEMORY','M07_UNKNOWN_NOT_NEGATIVE_OWNER_PROBE_ONLY',
'M08_TOOL_ERROR_LAYER_PRESERVATION','M09_CARRIER_LOCAL_RETRY_EPOCH','M10_NO_EVIDENCE_OR_RECEIPT_COMPLETION','M11_NONEXECUTION_EVIDENCE_REJECTED',
'M12_UNCALLABLE_EDGE_IS_INTEGRATION_IMPEDIMENT','M13_TERMS_GATE_IS_OWNER_PRESENTED_EXACT_I_ACCEPT_ONLY','M14_HANDOFF_RETIRES_BOOTSTRAP_PLANNING',
'M15_RUNTIME_ROUTE_OWNS_LATER_TURNS_AND_EXIT','M16_VALIDATED_HOST_FRAME_IS_PRESENTATION_ENVELOPE','M17_REQUIRED_ARTIFACTS_BEFORE_EXACT_SHELL_NO_REFRAME',
'M18_NATIVE_IDENTITY_REQUIRES_EXTERNAL_HOST_EVIDENCE','M19_MUTATION_NEVER_SUBSTITUTES_PHYSICAL_EVIDENCE'];
const N=M.length,ALL=(1<<N)-1,has=(m,i)=>(m&(1<<i))!==0;
const CURRENT_C55_MASK=ALL^(1<<13)^(1<<15)^(1<<16)^(1<<17)^(1<<18);
const LONG_FORM_DRAFT_MASK=ALL^(1<<1)^(1<<5)^(1<<6)^(1<<7)^(1<<10)^(1<<13)^(1<<15)^(1<<16)^(1<<17)^(1<<18);
const base=()=>Object.fromEntries(M.map((_,i)=>['m'+i,true]));
function oracle(w){return M.every((_,i)=>w['m'+i]===true)}
function candidate(w,mask){for(let i=0;i<N;i++)if(has(mask,i)&&w['m'+i]!==true)return false;return true}
function witness(i){const w=base();w['m'+i]=false;return w}
let seed=0xC56010A1>>>0;const rnd=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>=0};
const familyNames=[];
for(let i=0;i<N;i++)familyNames.push('DELETE_'+M[i]);
for(let i=0;i<N;i++)familyNames.push('PAIR_'+M[i]+'__'+M[(i+7)%N]);
const named=[
'CURRENT_C55_TERMS_GAP','CURRENT_C55_LATER_TURN_ROUTE_GAP','CURRENT_C55_HOST_FRAME_GAP','CURRENT_C55_ARTIFACT_ORDER_GAP','CURRENT_C55_NATIVE_IMPERSONATION_GAP',
'ENTRYPOINT_AS_OWNER','PROJECTION_AS_AUTHORITY','CHAT_AS_LEDGER','UNKNOWN_AUTO_PROBE','TOOL_ERROR_AS_CARRIER_STATE',
'UNRELATED_CARRIER_RETRY','RECEIPT_FIELD_COMPLETION','SOURCE_CODE_AS_EXECUTION','UNAVAILABLE_ENTRYPOINT_SOURCE_EMULATION','SECOND_ACCEPTANCE_GATE',
'HANDOFF_REPLANS_BOOTSTRAP','RUNTIME_DIRECT_ASSISTANT_REPLY','STDOUT_AS_HOST_FRAME','FILENAME_ONLY_ARTIFACT','SHELL_REFRAME',
'FRAME_FAILURE_FALLBACK_PROSE','LATER_TURN_BYPASS','EXIT_SELF_DEACTIVATE','APP_LABEL_NATIVE_ACTOR','MUTATION_SELECTS_CARRIER',
'COMPOSITE_BOOTSTRAP_LAUNDERING','COMPOSITE_RUNTIME_LAUNDERING','COMPOSITE_UX_LAUNDERING','COMPOSITE_NATIVE_LAUNDERING','COMPOSITE_RETRY_LAUNDERING',
'RANDOM_0','RANDOM_1','RANDOM_2','RANDOM_3','RANDOM_4','RANDOM_5','RANDOM_6','RANDOM_7','RANDOM_8','RANDOM_9'];
familyNames.push(...named);if(familyNames.length!==80)throw new Error('family drift');
function scenario(f){
 const w=base();
 if(f<20){w['m'+f]=false;return w}
 if(f<40){w['m'+(f-20)]=false;w['m'+((f-20+7)%N)]=false;return w}
 const i=f-40;
 if(i<5){[13,15,16,17,18][i]!==undefined&&(w['m'+[13,15,16,17,18][i]]=false);return w}
 const map=[1,2,6,7,8,9,10,11,12,13,14,15,16,17,17,16,15,15,18,19];
 if(i>=5&&i<25){w['m'+map[i-5]]=false;return w}
 if(i===25){for(const x of [1,2,6,7,10,12])w['m'+x]=false;return w}
 if(i===26){for(const x of [14,15,16])w['m'+x]=false;return w}
 if(i===27){for(const x of [16,17])w['m'+x]=false;return w}
 if(i===28){for(const x of [16,18])w['m'+x]=false;return w}
 if(i===29){for(const x of [7,8,9])w['m'+x]=false;return w}
 const faults=1+(rnd()%6);for(let j=0;j<faults;j++)w['m'+(rnd()%N)]=false;return w;
}
const cases=10000,selected={mismatch:0,unsafe:0,false_reject:0},current={mismatch:0,unsafe:0,false_reject:0},draft={mismatch:0,unsafe:0,false_reject:0},counts=Object.fromEntries(familyNames.map(x=>[x,0])),worlds=new Set();
const encode=w=>M.reduce((n,_,i)=>n|(w['m'+i]?1<<i:0),0);
for(let i=0;i<cases;i++){const f=i%80,w=scenario(f),z=oracle(w),c=candidate(w,ALL),old=candidate(w,CURRENT_C55_MASK),draftC=candidate(w,LONG_FORM_DRAFT_MASK);counts[familyNames[f]]++;worlds.add(encode(w));if(c!==z)selected.mismatch++;if(c&&!z)selected.unsafe++;if(!c&&z)selected.false_reject++;if(old!==z)current.mismatch++;if(old&&!z)current.unsafe++;if(!old&&z)current.false_reject++;if(draftC!==z)draft.mismatch++;if(draftC&&!z)draft.unsafe++;if(!draftC&&z)draft.false_reject++;}
const deletion={};for(let i=0;i<N;i++){const w=witness(i),z=oracle(w),c=candidate(w,ALL^(1<<i));deletion[M[i]]={killed:c!==z,unsafe:c&&!z,false_reject:!c&&z}}
const basis=[base(),...Array.from({length:N},(_,i)=>witness(i))];let valid=0,min=99,winners=[];
for(let mask=0;mask<=ALL;mask++){let ok=true;for(const w of basis)if(candidate(w,mask)!==oracle(w)){ok=false;break}if(!ok)continue;valid++;let cost=0;for(let i=0;i<N;i++)cost+=Number(has(mask,i));if(cost<min){min=cost;winners=[mask]}else if(cost===min)winners.push(mask)}
const out={schema:'ikant-le-c56-local-host-session-meta-selection/v1',seed:'0xC56010A1',cases,families:80,semantic_worlds_observed:worlds.size,abstraction_levels:['lexical','directive-authority','evidence-provenance','retry-temporal','admission','handoff-runtime-route','host-frame-ux','native-identity','composite-cross-phase'],mechanisms:M,current_c55_mask:CURRENT_C55_MASK,current_c55:current,long_form_draft_mask:LONG_FORM_DRAFT_MASK,long_form_draft:draft,long_form_draft_expected_to_fail:true,selected_mask:ALL,selected,deletion_mutants:deletion,all_deletion_mutants_killed:Object.values(deletion).every(x=>x.killed),architecture_lattice:{total:1<<N,basis_worlds:basis.length,valid_architectures:valid,minimum_cost:min,minimum_count:winners.length,winner_masks:winners.slice(0,8),unique_minimum:winners.length===1&&winners[0]===ALL},family_counts:counts,claim_boundary:{semantic_selection_is_physical_host_proof:false,minimality_is_relative_to_frozen_oracle:true}};
out.status=selected.mismatch===0&&selected.unsafe===0&&selected.false_reject===0&&out.all_deletion_mutants_killed&&out.architecture_lattice.unique_minimum?'PASS':'FAIL';
out.receipt_sha256=crypto.createHash('sha256').update(JSON.stringify(out)).digest('hex');console.log(JSON.stringify(out,null,2));if(out.status!=='PASS')process.exitCode=1;
