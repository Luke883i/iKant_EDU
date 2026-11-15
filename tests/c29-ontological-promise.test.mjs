import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,readContract,assessOntologicalPromise,validateOntologicalPromiseAssessment} from '../src/contract.mjs';

test('C29 promise basis is 36 atomic DoDs, 10000 bps, threshold >99 and irreducible without a parallel hard-gate layer',()=>{
 const c=readContract(),p=c.ontological_promise;
 assert.equal(c.schema,'ikant-le-contract/v12');assert.equal(c.version,'0.9.0');assert.equal(p.schema,'ikant-le-ontological-promise/v1');assert.equal(p.atom_count,36);assert.equal(p.domain_count,9);assert.equal(p.score_max_bps,10000);assert.equal(p.respect_threshold_bps,9901);assert.equal(p.projection_persisted,false);
 assert.equal(p.atoms.length,36);assert.equal(new Set(p.atoms.map(x=>x.id)).size,36);assert.equal(p.atoms.reduce((n,x)=>n+x.weight_bps,0),10000);assert.ok(Math.min(...p.atoms.map(x=>x.weight_bps))>=100);assert.equal('hard_gates'in p,false);
});

test('C29 all-evidence conformance scores 10000 and validates',()=>{
 const p=readContract().ontological_promise,e=Object.fromEntries(p.atoms.map(x=>[x.id,true])),a=assessOntologicalPromise(e);
 assert.equal(a.score_bps,10000);assert.equal(a.coverage_ratio,1);assert.equal(a.respected,true);assert.deepEqual(a.failed_atoms,[]);assert.equal(a.first_unmet,null);assert.equal(a.persisted,false);assert.equal(a.authority,0);assert.deepEqual(validateOntologicalPromiseAssessment(a),{ok:true,errors:[]});
});

test('C29 every retained atom is causally necessary at >99',()=>{
 const p=readContract().ontological_promise,all=Object.fromEntries(p.atoms.map(x=>[x.id,true]));
 for(const atom of p.atoms){const e={...all,[atom.id]:false},a=assessOntologicalPromise(e);assert.ok(a.score_bps<9901,atom.id);assert.equal(a.respected,false,atom.id);assert.equal(a.first_unmet,atom.id,atom.id);}
});

test('C29 pre-slice baseline C3 plus I2 is exactly 9400 and neither action alone exceeds 99',()=>{
 const p=readContract().ontological_promise,all=Object.fromEntries(p.atoms.map(x=>[x.id,true]));
 const base=assessOntologicalPromise({...all,C3:false,I2:false}),c3=assessOntologicalPromise({...all,I2:false}),i2=assessOntologicalPromise({...all,C3:false});
 assert.equal(base.score_bps,9400);assert.equal(c3.score_bps,9750);assert.equal(i2.score_bps,9650);assert.equal(base.respected,false);assert.equal(c3.respected,false);assert.equal(i2.respected,false);
});

test('C29 typed relay contract contains no blanket canonical ban on verified opaque relay',()=>{
 const a=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/session-chat-activation.json'),'utf8')),g=a.global_dod.find(x=>x.id==='C21_G7');
 assert.ok(g);assert.equal(g.claim.includes('no second acceptance, source reset, deadline reset, model-mediated bytes, false ACTIVE'),false);assert.ok(g.claim.includes('unverified/reconstructed model-mediated bytes'));assert.ok(g.claim.includes('VERIFIED_OPAQUE_RELAY'));
});

test('C29 checked-in mutation receipts encode unique minimum and 10m fail-closed falsification',()=>{
 const d=JSON.parse(fs.readFileSync(path.join(ROOT,'artifacts/qualification/c29-promise-definition-10k.json'),'utf8')),n=JSON.parse(fs.readFileSync(path.join(ROOT,'artifacts/qualification/c29-engineering-needs-1k.json'),'utf8')),f=JSON.parse(fs.readFileSync(path.join(ROOT,'artifacts/qualification/c29-ontological-promise-10m.json'),'utf8'));
 assert.equal(d.candidates,10000);assert.equal(d.unique_candidates,10000);assert.equal(d.winner_cost,0);assert.equal(d.winner_cost_ties,1);assert.equal(d.threshold_bps,9901);
 assert.equal(n.cases,1000);assert.equal(n.baseline_score_bps,9400);assert.deepEqual(n.baseline_failed_atoms,['C3','I2']);assert.equal(n.minimal_action_packages.filter(x=>x.respects_promise).length,1);
 assert.equal(f.cases,10000000);assert.equal(f.status,'PASS');assert.equal(f.candidate_oracle_mismatches,0);assert.equal(f.unsafe_respected,0);assert.equal(f.all_mutants_killed,true);assert.equal(f.all_atoms_failed_at_least_once,true);
});
