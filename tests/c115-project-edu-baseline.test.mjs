import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const prompt=fs.readFileSync(new URL('../project/edu-oneshell/PROJECT_INSTRUCTIONS.txt',import.meta.url),'utf8');
const slide=fs.readFileSync(new URL('../project/edu-oneshell/SLIDE.md',import.meta.url),'utf8');
const dod=fs.readFileSync(new URL('../project/edu-oneshell/DOD.md',import.meta.url),'utf8');
test('Project prompt uses original runtime as conditional tool, not counterfeit host authority',()=>{
 for(const s of ['github.com/Luke883i/iKant_LE','TERMS FULLY VERBATIM','I ACCEPT','EXPERIMENTAL','AUTORIZZO BOZZE COHOST SPERIMENTALI NON VERIFICATE','CANONICAL','original C100','original sole C87 writer','FIRST_UNCLOSED_EDGE'])assert.ok(prompt.includes(s),s);
 assert.ok(prompt.includes('NOT executing original code'));
 assert.ok(prompt.includes('exact EDU (recommended) or CANONICAL'));
 assert.ok(prompt.includes('not as a third public mode'));
 assert.ok(!prompt.includes('exact EXPERIMENTAL present original C72 mode selection'));
 assert.ok(prompt.includes('assistant-authored response is NOT cognitively authored'));
});
test('A/B slide separates original voice from host and does not claim E3/E4',()=>{
 for(const s of ['iKant','Host','NO_VOICE','C70','C100','C87','MCP','EDGE'])assert.ok(slide.includes(s),s);
 assert.ok(slide.includes('never host roleplay'));
 assert.ok(dod.includes('88/100 pass, 12 fail'));
});
