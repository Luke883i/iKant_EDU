import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {qualify,validateStandalone,runSyntheticMutations,FAMILIES} from '../scripts/ikant-semantic-reticulum.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const r=fs.readFileSync(path.join(root,'README.md'),'utf8');

test('L0 standalone covers four pillars, neuroscience limits, method and GitHub details',()=>{
 const x=validateStandalone(r);assert.deepEqual(x.requirements,Object.fromEntries(Object.keys(x.requirements).map(k=>[k,true])));
 assert.ok(x.ok);
});
test('required axes cannot be silently deleted',()=>{
 for(const [key,regex] of [['nature',/\bnatura\b/i],['rationale',/\bratio\b/i],['objectives',/\bobiettiv/i]]){
  const mutant=r.replace(regex,'[REMOVED_'+key+']');
  if(regex.test(mutant))continue;
  assert.equal(validateStandalone(mutant).requirements[key],false);
 }
});
test('1000 material textual mutations with seven known counterexample families',()=>{
 const m=runSyntheticMutations();
 assert.equal(m.count,1000);assert.equal(m.changed,1000);assert.equal(m.rejected,1000);
 assert.ok(m.docs>=169);assert.equal(new Set(FAMILIES.map(x=>x.id)).size,7);
 assert.deepEqual(m.failures,[]);
});
test('whole reticulum is navigable, no omitted Markdown, still authority zero',()=>{
 const a=qualify();assert.equal(a.ok,true);assert.equal(a.atlas.atlas_exact,true);
 assert.equal(a.atlas.total,a.mutation.docs);
});
