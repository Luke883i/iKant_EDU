import test from 'node:test';
import assert from 'node:assert/strict';
import {scanCallsites} from '../scripts/project-review-callsites.mjs';
test('dynamic caller variants detected without fabricated target resolution',()=>{
 const src="await import(path); import('./ok.mjs'); require(name); execFileSync(command,argv); new Worker(url);";
 const calls=scanCallsites(src,'fixture.mjs');
 assert.equal(calls.length,5);
 assert.equal(calls.filter(x=>x.qualification==='DYNAMIC_TARGET_UNKNOWN').length,4);
 assert.deepEqual(calls.filter(x=>x.target).map(x=>x.target),['./ok.mjs']);
});
test('empty source cannot fabricate call paths',()=>assert.deepEqual(scanCallsites('','empty'),[]));
