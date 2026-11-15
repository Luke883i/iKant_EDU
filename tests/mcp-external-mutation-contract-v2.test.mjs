import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const c=JSON.parse(fs.readFileSync(new URL('../contracts/mcp-external-mutation-assurance-v2.json',import.meta.url)));
test('global finite threat-model contract is versioned and cannot assert product/native',()=>{
 assert.equal(c.authority,0);assert.deepEqual(c.educhat_modes,['EDU','CANONICAL']);
 assert.equal(c.mcp_grants_canonical,false);assert.equal(c.release.current,'PRODUCT_NO_GO');
 assert.equal(c.dod.length,25);assert.ok(c.dod.filter(x=>x.level==='GLOBAL').length>=5);
 assert.ok(c.dod.filter(x=>x.status==='EXTERNAL_OPEN').length>=6);
 assert.equal(c.release.closed_external_gates,0);
 assert.equal(c.mutation_campaigns.length,10);
 assert.ok(c.mutation_campaigns.every(x=>x.cases===1000000&&x.seed.length===16));
 assert.ok(c.dod.every(x=>x.falsifier&&x.metric));
});
test('ten independent seeded mutation campaigns actually execute with every mutant killed',()=>{
 const cc=spawnSync('cc',['-O3','-std=c11','-Wall','-Wextra','-Werror','scripts/mcp-external-falsify-10m.c','-o','/tmp/ikant-mcp-falsify-'+process.pid],{cwd:new URL('..',import.meta.url).pathname,encoding:'utf8'});
 assert.equal(cc.status,0,cc.stderr);
 const r=spawnSync('/tmp/ikant-mcp-falsify-'+process.pid,[],{encoding:'utf8',maxBuffer:500000});
 assert.equal(r.status,0,r.stderr);
 const out=JSON.parse(r.stdout);
 assert.equal(out.kind,'MODEL_STATE_SPACE_NOT_LIVE_PROTOCOL');
 assert.equal(out.total_vectors,10000000);assert.equal(out.model_failures,0);
 assert.equal(out.campaigns.length,10);
 for(const z of out.campaigns){assert.equal(z.vectors,1000000);assert.equal(z.unsafe_accepted,0);assert.equal(z.oracle_mismatches,0);
  assert.equal(z.mutant_kills.length,8);assert.ok(z.mutant_kills.every(x=>x>0));
  assert.ok(z.multi_fault_vectors>0);}
});
