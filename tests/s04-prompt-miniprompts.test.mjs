import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../scripts/s04-build-project.py',import.meta.url),'utf8');
test('S04 innesco describes exact mode transitions, six slots, stale lock and no plugin magic',()=>{
 for(const x of ['SOURCE_LOCK_STALE','I ACCEPT','EDU','CANONICAL','ESITO,A,B,PROVA,EDGE,NEXT','NO_VOICE','C72/v2','C72/v1','C135 EDU/v2 owner','MCP source in ZIP != connected plugin'])assert.ok(src.includes(x),x);
 assert.ok(!src.includes('Accept previous consent as persistent'));
});
