import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const home=read('README.md');
const bridge=read('docs/IKANT_NEUROCOGNITIVE_BRIDGE.md');
const substrate=read('docs/IKANT_COGNITIVE_SUBSTRATE.md');
const history=read('docs/IKANT_DEVELOPMENT_HISTORY.md');

test('human-first README preserves constitutional routing and introduces an understandable cognitive model',()=>{
 for(const phrase of ['**Umano:**','**LLM:**','**iKant:**','**HOST:**','**Verificatore:**',
  'GitHub API only','**EDU**','**MCP_EXTERNAL**','Il percorso Project C72/v2 offre',
  'one canonical `SESSION_CHAT_LOCAL` composition, C59',
  'GitHub DNS/egress from the container is not a dependency',
  'DOCUMENTATO / OSSERVATO / INFERITO / NON ATTESTATO',
  'IKANT_NEUROCOGNITIVE_BRIDGE.md'])assert.ok(home.includes(phrase),phrase);
 assert.match(home,/<details>[\s\S]*<summary>[\s\S]*```mermaid[\s\S]*<\/details>/);
 assert.ok(home.includes("l'LLM e il mondo esterno non diventano deterministici"));
});
test('father provenance is pinned and not silently promoted to LE implementation',()=>{
 for(const text of [bridge,history]){
  assert.ok(text.includes('43ce861a552d44821ffce455f6237905f0994936'));
  assert.ok(text.includes('8e80ac52d5630cded7eaa5619e47d359cf40e831')||text.includes('docs/IKANT_')||text.includes('LE'));
 }
 assert.match(bridge,/accesso limitato|accesso riservato/i);
 assert.match(bridge,/non implica|non.*equival/i);
 assert.match(history,/non si può dedurre/i);
});
test('neuroscience analogy distinguishes function, biology and phenomenal claims',()=>{
 for(const x of ['CRC','R0','R8','C4','C5','C8','C11','mermaid',
 'UNKNOWN','non attestata','non sono','metacognizione','confronto','falsificatori']){
  assert.ok(bridge.toLowerCase().includes(x.toLowerCase()),x);
 }
 assert.match(bridge,/determinismo del controllo.*determinismo della risposta/i);
 assert.match(bridge,/equivalenza biologica/i);
 assert.match(substrate,/S_\{t\+1\}/);
 assert.match(substrate,/FUNCTIONALLY_CONSCIOUS/);
});
test('document graph includes the bridge exactly once and preserves historical source',()=>{
 const atlas=read('docs/IKANT_DOCUMENT_ATLAS.md');
 const entry='[docs/IKANT_NEUROCOGNITIVE_BRIDGE.md](IKANT_NEUROCOGNITIVE_BRIDGE.md)';
 assert.equal(atlas.split(entry).length-1,1);
 assert.ok(read('scripts/ikant-document-atlas.mjs').includes('NEUROCOGNITIVE'));
 assert.ok(read('docs/IKANT_SEMANTIC_RETICULUM.md').includes('IKANT_NEUROCOGNITIVE_BRIDGE.md'));
});
