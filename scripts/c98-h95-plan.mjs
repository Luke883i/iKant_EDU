import {planC98H95} from '../host/c98-h95-design.mjs';
const sampleSizes=[500,1000,2000,5000];
const result=sampleSizes.map(n=>planC98H95({n}));
console.log(JSON.stringify({schema:'ikant-le-c98-h95-plan-table/v1',
 source:'C72_C80_EXACT_POLICY_DESIGN_NOT_OBSERVED_RESULTS',rows:result},null,2));
