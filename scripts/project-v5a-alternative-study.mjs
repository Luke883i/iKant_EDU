#!/usr/bin/env node
/** Exactly 1000 deterministic design candidates, a bounded search, not universal optimality. */
import crypto from 'node:crypto';
import {evaluateEntrypointGraph,expectedGraph,SOURCE,ALIAS} from './project-edu-entrypoint.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const SOURCE_STRATEGIES=[
 {name:'retain_existing_original',path:SOURCE,risk:0,files:0},
 {name:'rename_existing_source',path:'project/edu/prompt.txt',risk:15,files:8},
 {name:'new_unreviewed_source',path:'project/edu/PROMPT_NEXT.txt',risk:25,files:10},
 {name:'legacy_as_canonical',path:ALIAS,risk:20,files:7},
 {name:'dual_prompt_owners',path:SOURCE,risk:20,files:3},
 {name:'generated_prompt_as_source',path:'dist/PROMPT_INNESCO.txt',risk:30,files:12},
 {name:'catalog_based_on_CI',path:SOURCE,risk:40,files:5},
 {name:'native_install_claim',path:SOURCE,risk:100,files:4},
 {name:'new_C72_owner',path:SOURCE,risk:100,files:8},
 {name:'new_product_mode',path:SOURCE,risk:100,files:9}
];
const ALIAS_STRATEGIES=[
 {name:'exact_source_plus_version_footer',risk:0,files:2,valid:true},
 {name:'independently_authored_clone',risk:25,files:1},
 {name:'copy_exact_without_version',risk:8,files:1},
 {name:'generated_by_C131_with_exact_footer',risk:4,files:3,valid:true},
 {name:'add_owner_instructions',risk:100,files:2},
 {name:'drop_bundle_compatibility',risk:12,files:1},
 {name:'symlink_source',risk:10,files:1},
 {name:'new_zip_protocol',risk:60,files:5},
 {name:'alias_pins_old_head',risk:30,files:3},
 {name:'runtime_sends_alias',risk:100,files:4}
];
const DOC_STRATEGIES=[
 {name:'correct_both_existing_onboarding_entries',risk:0,files:2,valid:true},
 {name:'only_README_corrected',risk:12,files:1},
 {name:'only_START_HERE_corrected',risk:12,files:1},
 {name:'correct_via_canonical_rule_and_docs',risk:5,files:3,valid:true},
 {name:'new_marketing_landing_page',risk:20,files:4},
 {name:'retain_legacy_avvia_command',risk:12,files:0},
 {name:'ask_I_ACCEPT_first',risk:100,files:2},
 {name:'skip_TERMS',risk:100,files:2},
 {name:'CANONICAL_auto_active',risk:100,files:2},
 {name:'separate_new_owner_intro',risk:100,files:2}
];
let all=[],eligible=[];
for(let i=0;i<10;i++)for(let j=0;j<10;j++)for(let k=0;k<10;k++){
 const s=SOURCE_STRATEGIES[i],a=ALIAS_STRATEGIES[j],d=DOC_STRATEGIES[k];
 let g={...expectedGraph(),bootstrap:s.path,generator:s.path,catalog:s.path,
  alias_bytes_match:!!a.valid,alias_derivation:a.valid?'EXACT_BYTES_PLUS_VERSION_TRAILER':'UNVERIFIED',
  docs_consistent:!!d.valid,native_install_claim:i===7,ci_is_product_receipt:i===6,
  original_c72:i!==8,distinct_human_turns:k!==6&&k!==7,
  release_claim:k===8,owner_file_mutated:i===9};
 const admissible=evaluateEntrypointGraph(g).ok===true &&s.path===SOURCE;
 const record={id:`A-${String(all.length+1).padStart(4,'0')}`,source:s.name,alias:a.name,docs:d.name,
  admissible,risk:s.risk+a.risk+d.risk,change_estimate:s.files+a.files+d.files+1,
  objective:(s.risk+a.risk+d.risk)*100+(s.files+a.files+d.files+1)};
 all.push(record);if(admissible)eligible.push(record);
}
if(all.length!==1000||eligible.length<2)throw Error('V5A_ALTERNATIVE_ENUM_INVALID');
eligible.sort((a,b)=>a.objective-b.objective||a.id.localeCompare(b.id));
const winner=eligible[0];
if(winner.source!=='retain_existing_original'||winner.alias!=='exact_source_plus_version_footer'||
 winner.docs!=='correct_both_existing_onboarding_entries')throw Error('V5A_WINNER_CHANGED');
const report={schema:'ikant-v5a-alternative-study/v1',scope:'BOUNDED_DESIGN_SEARCH_NO_NATIVE_OWNER',
 generated:all.length,eligible:eligible.length,ineligible:1000-eligible.length,
 scoring:'minimize risk weights first; then estimated touched files; fixture model not production economics',
 winner,runner_up:eligible.slice(1,8),rejected_examples:all.filter(x=>!x.admissible).slice(0,15),
 candidates_sha256:sha(JSON.stringify(all)),verified_owner_execution:false,product_release:'PRODUCT_NO_GO'};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
