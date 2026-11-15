import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const get=x=>readFileSync(new URL(x,root),'utf8');
test('HOST confined to technical evidence; adapter discovery and pinned ZIP are first',()=>{
 const p=get('project/oneshell-v7/PROMPT_TEMPLATE.txt');
 for(const s of ['Communicate only ultra-brief, plain-language conclusions','iteratively search for existing solutions before declaring gaps','HOST ROLE:','must never answer or interpret','FIRST POST-MODE:','https://github.com/Luke883i/iKant_LE/archive/@GIT_HEAD@.zip','SOURCE_LOCK_STALE','I ACCEPT','CANONICAL'])
  assert.ok(p.includes(s),s);
 const r=get('project/oneshell-v7/09_ADAPTER_RECIPES.md');
 for(const s of ['Discover first','direct GitHub ZIP'])assert.ok(r.includes(s),s);
 const slides=get('project/oneshell-v7/03_SLIDES.md');
 assert.ok(slides.includes('no second opinion'));
});
