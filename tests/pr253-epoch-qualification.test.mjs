import test from 'node:test';
import assert from 'node:assert/strict';
import {PR251_EPOCH,PR251_TREE,qualifyEpochBoundary} from '../scripts/pr253-epoch-qualification.mjs';
const success={head:'a'.repeat(40),tree:'b'.repeat(40),historical:PR251_EPOCH,
 historical_tree:PR251_TREE,ancestor:true,event_head:'a'.repeat(40),clean_index:true,
 historic:{ok:true,product_go:false},current:{ok:true,product_go:false,source_main:PR251_EPOCH},
 release_claim:false,native_host_attested:false};
test('PR251 historical proof plus current PR253 head always remain two different source gates',()=>{
 const r=qualifyEpochBoundary(success);
 assert.equal(r.ok,true);assert.equal(r.product_go,false);
 assert.equal(r.kind,'HISTORY_BOUND_SOURCE_ONLY');
 for(const mutant of [
  {event_head:'f'.repeat(40)},{head:'fake'},{tree:'fake'},
  {historical:'f'.repeat(40)},{historical_tree:'f'.repeat(40)},
  {ancestor:false},{clean_index:false},
  {historic:{...success.historic,ok:false}},
  {current:{...success.current,ok:false}},
  {current:{...success.current,source_main:'f'.repeat(40)}},
  {current:{...success.current,product_go:true}},
  {release_claim:true},{native_host_attested:true}
 ])assert.equal(qualifyEpochBoundary({...success,...mutant}).ok,false,JSON.stringify(mutant));
});
