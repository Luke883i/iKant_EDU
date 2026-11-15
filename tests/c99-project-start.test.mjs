import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('exact human iniziamo alias reaches the existing admission procedure, not invented owner',()=>{
 const p=read('project-baseline/PROJECT_PROMPT.txt');
 const gate=read('project-baseline/PROJECT_FILES/iKant_GATE.md');
 for(const s of ['iniziamo','inizializza iKant','I ACCEPT','EXPERIMENTAL','DIAGNOSTIC_ONLY'])
  assert.ok(p.includes(s),s);
 assert.ok(gate.includes('iniziamo'));
 for(const path of ['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md']){
  assert.ok(p.includes(path),path);assert.ok(gate.includes(path),path);
 }
 assert.ok(p.includes('best-effort per-turn'));
 assert.ok(p.includes('not an installed MCP')||p.includes('NOT an installed MCP'));
});
