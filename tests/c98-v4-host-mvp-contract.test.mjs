import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync(new URL('../contracts/c98-v4-host-mvp-acceptance.json',import.meta.url),'utf8'));
test('C98 v4 no third owner, canonical or H95 false claims, strict source-host-execution distinctions',()=>{
 assert.equal(c.authority,0);assert.equal(c.real_host_installation_claim,false);
 assert.equal(c.canonical_active_claim,false);
 assert.equal(c.actual_H95_field_trials_observed_by_c98_v4,0);
 assert.equal(c.source_only_transport.origin_from_byte_integrity,false);
 assert.equal(c.source_only_transport.current_head_capsule_observed_in_node,false);
 assert.ok(c.architectures.DENIED.includes('GITHUB_DNS'));
 assert.ok(c.architectures.DENIED.includes('GRO'));
 assert.ok(c.mvp_lanes.EXPERIMENTAL_TEXT_MVP.includes('current real C72'));
 assert.ok(c.mvp_lanes.H95.includes('C72/C80'));
});
