/** Fail-closed review of candidate components. Never a runtime or provider receipt. */
import {readFileSync} from 'node:fs';
const x=JSON.parse(readFileSync(new URL('../contracts/s03-s09-severe-dod.json',import.meta.url),'utf8'));
const keys=Object.keys(x.slices);
const invalid=keys.length!==7||keys.join(',')!=='S03,S04,S05,S06,S07,S08,S09'||
 x.authority!==0||x.release_policy!=='FAIL_CLOSED_UNLESS_ALL_EXTERNAL_WITNESSES'||
 keys.some(k=>x.slices[k].external_gate_complete!==false||!x.slices[k].external?.length||!x.slices[k].checks?.length||!x.slices[k].owner);
const result={schema:'ikant-le-s03-s09-dod-audit/v1',candidate_contract_valid:!invalid,
 all_external_gates_closed:false,edu_pilot_release_ready:false,canonical_release_ready:false,
 blocked_slices:keys,source_kind:'LOCAL_OR_CI_CANDIDATE_NOT_PROVIDER',authority:0};
console.log(JSON.stringify(result,null,2));if(invalid)process.exitCode=1;
