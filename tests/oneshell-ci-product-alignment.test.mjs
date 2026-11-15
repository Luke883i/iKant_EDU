import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';
import {ROOT,inspectProductCi,evaluateCurrentProductCi} from '../scripts/oneshell-ci-product-alignment.mjs';
const raw=JSON.parse(fs.readFileSync(path.join(ROOT,'contracts/oneshell-40-product-ci.json'),'utf8'));
const workflow=fs.readFileSync(path.join(ROOT,'.github/workflows/p1-p7-oneshell-release.yml'),'utf8');
const clone=()=>structuredClone(raw);
test('40 product requirements bind actual CI tests, never native release',()=>{
 const r=evaluateCurrentProductCi();assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.mapped_issues,40);assert.equal(r.product_ready,false);assert.equal(r.product_release_authorized,false);
 assert.equal(r.software_candidate_status,'CANDIDATE_QUALIFIED');
});
test('Removing an issue or asserting an unauthorized product proof is rejected',()=>{
 let x=clone();x.issues.pop();assert.equal(inspectProductCi({registry:x,workflow}).ok,false);
 x=clone();x.issues[2].id='UX02';assert.equal(inspectProductCi({registry:x,workflow}).ok,false);
 x=clone();x.issues[0].product_closed=true;assert.ok(inspectProductCi({registry:x,workflow}).failures.some(z=>z.includes('FAKE_PRODUCT_CLOSURE')));
 x=clone();x.issues[0].product_witness={status:'ACTIVE'};assert.equal(inspectProductCi({registry:x,workflow}).ok,false);
});
test('CI must execute, not merely mention, every mapped test',()=>{
 const w=workflow.replace('tests/s02-unknown-delivery-stop.test.mjs','');
 assert.ok(inspectProductCi({registry:raw,workflow:w}).failures.some(z=>z.includes('TEST_NOT_EXECUTED_IN_PRODUCT_CI')));
 const w2=workflow.replace('node --test tests/oneshell-ci-product-alignment.test.mjs','echo tests/oneshell-ci-product-alignment.test.mjs');
 assert.ok(inspectProductCi({registry:raw,workflow:w2}).failures.some(z=>z.includes('TEST_NOT_EXECUTED_IN_PRODUCT_CI')));
});
test('Source registry cannot be rewritten while CI stays green',()=>{
 let x=clone();x.issues[1].negative_case='Mutazione semantica non autorizzata del requisito.';
 assert.ok(inspectProductCi({registry:x,workflow}).failures.some(z=>z.includes('PRODUCT_REQUIREMENT_DIFFERENT_FROM_AUDIT')));
 const changed=fs.readFileSync(path.join(ROOT,'docs/ONESHell_HOST_40_ISSUES.csv'),'utf8').replace('Shell non materializzata','Shell falsamente attestata');
 assert.ok(inspectProductCi({registry:raw,workflow,sourceCsv:changed}).failures.includes('CANONICAL_AUDIT_SOURCE_DRIFT'));
});
test('Changed requirement, V6 drift or erased human witnesses fails',()=>{
 let x=clone();x.issues[1].negative_case='';assert.ok(inspectProductCi({registry:x,workflow}).failures.some(z=>z.includes('UNTRACEABLE_REQUIREMENT')));
 assert.ok(inspectProductCi({registry:raw,workflow,slideVersion:'OneShell V6'}).failures.includes('V7_DOCUMENTATION_DRIFT'));
 x=clone();x.required_external_witnesses=[];assert.equal(inspectProductCi({registry:x,workflow}).ok,false);
});