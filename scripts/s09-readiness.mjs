import {readFileSync} from 'node:fs';
const contract=JSON.parse(readFileSync(new URL('../contracts/s09-release-dod.json',import.meta.url),'utf8'));
/** Local artifacts prove only static candidate existence; not user studies or CI. */
const local={S01_MERGED_MAIN:true,S02_ORIGINAL_EDU_V2_OWNER_30_SUCCESSFUL_TURNS:false,
 S03_C125_EXACT_A_AND_SIX_HOST_SLOTS:false,S04_MAIN_PROMPT_ZIP_SAMEHEAD:false,
 S05_30_INDEPENDENT_USERS:false,S09_C137_REAL_BENCHMARK:false,
 S09_CI_FULL_GREEN:false,S09_HUMAN_RELEASE_APPROVAL:false,
 S06_MCP_SECURE:false,S07_NATIVE_PLUGIN_CONNECTED:false,S08_C59_OWNER_NATIVE_PROVEN:false};
const missingEDU=contract.EDU_minimum.filter(x=>!local[x]);
const missingCanonical=contract.CANONICAL_minimum.filter(x=>!local[x]);
const r={schema:'ikant-le-s09-release-readiness/v1',source_kind:'LOCAL_PREPR',
 edu_pilot_qualified:missingEDU.length===0,canonical_qualified:missingCanonical.length===0,
 missing_EDU:missingEDU,missing_CANONICAL:missingCanonical,
 next:'S03_C125_EXACT_A_AND_SIX_HOST_SLOTS',authority:0};
console.log(JSON.stringify(r,null,2));
