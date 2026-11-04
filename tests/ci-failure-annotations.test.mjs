import test from 'node:test';
import assert from 'node:assert/strict';
import {failureDetails,annotate,firstFailureLabel} from '../scripts/ci-failure-annotations.mjs';
test('TAP extractor retains failing test names, not passing checks',()=>{
 assert.deepEqual(failureDetails('ok 1 - pass\nnot ok 2 - wrong binding\n  error: source mismatch\n','tap'),['not ok 2 - wrong binding','error: source mismatch']);
});
test('contract extractor preserves structured source errors',()=>{
 assert.deepEqual(failureDetails('prefix\n{"status":"FAIL","errors":["BOOTSTRAP source mismatch","runtime root drift"]}\n','check'),['BOOTSTRAP source mismatch','runtime root drift']);
 assert.deepEqual(failureDetails('{"status":"PASS","errors":[]}','check'),[]);
});
test('GitHub annotation escapes control sequences to prevent injection',()=>{
 assert.equal(annotate('bad%\n::warning::forged'),'bad%25%0A::warning::forged');
 assert.throws(()=>failureDetails('', 'unknown'),/CI_DIAGNOSTIC_UNKNOWN_KIND/);
});

test('first failing step labels preserve the original failure and reject noisy markup',()=>{
 assert.equal(firstFailureLabel('ok 1 - pass\nnot ok 2 - SOURCE_HEAD drift\n  error: a,b\n','tap'),'not_ok_2_-_SOURCE_HEAD_drift');
 assert.equal(firstFailureLabel('{"status":"FAIL","errors":["BOOTSTRAP stale source"]}','check'),'BOOTSTRAP_stale_source');
 assert.equal(firstFailureLabel('ok 1 - pass','tap'),'UNSTRUCTURED_FAILURE');
 assert(!firstFailureLabel('not ok 4 - a::b % forged\\nmore','tap').includes('%'));
});
