import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const root=new URL('..',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
test('P1-P7 contract requires real external owner witnesses and six slots',()=>{
 const c=JSON.parse(read('contracts/p1-p7-product-closure.json'));
 assert.deepEqual(c.shell_slots,['ESITO','A','B','PROVA','EDGE','NEXT']);
 assert.deepEqual(c.mode_public,['EDU','CANONICAL']);assert.equal(c.bundle_is_installer,false);
 for(const p of ['p1','p2','p3','p4','p5','p6','p7'])assert.ok(c[p]?.software&&c[p]?.check);
 assert.equal(c.external_gates_ready,false);
 const d=JSON.parse(read('contracts/p3p7-independent-witnesses.json'));
 for(const p of ['P3','P4','P5','P6','P7']){assert.equal(d[p].verified_here,false);assert.ok(d[p].need.length>=3);}
});
test('V7 Project describes source lock, mini prompts, original A and verified annex',()=>{
 const prompt=read('project/oneshell-v7/PROMPT_TEMPLATE.txt');
 for(const a of ['@GIT_HEAD@','@GIT_TREE@','avvia iKant','I ACCEPT','EDU','CANONICAL','NO_VOICE','03_SLIDES.md','04_FILLER.md','SEMANTIC_RETENTION_NOT_ATTESTED'])assert.ok(prompt.includes(a),a);
 assert.match(read('project/oneshell-v7/03_SLIDES.md'),/sei canali informativi/i);
 assert.match(read('project/oneshell-v7/04_FILLER.md'),/Mini-prompt locali/);
 assert.match(read('project/oneshell-v7/05_ANNEX.md'),/registro/);
 assert.match(read('project/oneshell-v7/09_ADAPTER_RECIPES.md'),/nessuna installazione/i);
});
