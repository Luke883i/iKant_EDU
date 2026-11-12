import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {oneShellFrame,renderOneShell} from '../host/project-oneshell-edu.mjs';
import {createOneShellVisualModel,renderOneShellVisualHtml} from '../host/project-oneshell-visual.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const registry=JSON.parse(read('contracts/pr1-64-coverage.v1.json'));
const protectedOwners={
 'host/c72-public-mode-admission.mjs':'f8f3713115137732fde380f02bfc0ec6874214f5',
 'host/c135-edu-v2-owner.mjs':'e8bbe5741375e5d51f1caa02fdba2ecc5f6c049d',
 'host/c87-durable-ledger.mjs':'9d4fd4038bd7e109bdbc5e0441f9e9acf497c846',
 'host/c125-exclusive-shell.mjs':'760a90ad43b04588599ab9385abc389419ecc813'
};
const gitBlob=bytes=>createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
test('PR1: full 64/64 mapping is not native closure',()=>{
 assert.equal(registry.schema,'ikant-pr1-64-coverage-v1');assert.equal(registry.total,64);
 assert.equal(registry.at_least_99pct_threshold,64);assert.equal(registry.product_go,false);
 assert.equal(registry.nodes.length,64);
 assert.equal(new Set(registry.nodes.map(n=>n.id)).size,64);
 assert.equal(registry.nodes.filter(n=>n.target_pr==='PR1').length,12);
 assert.deepEqual(new Set(registry.nodes.map(n=>n.target_pr)),new Set(['SETUP','PR1','PR2','PR3','PR4','PR5']));
 for(const n of registry.nodes){assert.ok(n.oracle&&n.falsifier&&n.statement);
  assert.equal(n.assessment,'NOT_PROMOTED_BY_REGISTRY');
  for(const dep of n.dependencies)assert.ok(registry.nodes.some(x=>x.id===dep),dep);}
});
test('PR1: synthetic false proposition is never a verified native response',()=>{
 const frame=oneShellFrame({esito:'TURNO EDU TRACCIATO',b:'La Terra e piatta. Verita fattuale NON valutata.'});
 assert.equal(frame.slots.A,'NO_VOICE');assert.equal(frame.native_ui_attested,false);
 assert.match(renderOneShell(frame),/TURNO EDU TRACCIATO/);
 assert.equal(createOneShellVisualModel(frame).native_ui_attested,false);
 assert.doesNotMatch(renderOneShellVisualHtml(frame),/VOCE_VERIFICATA/);
});
test('PR1: source never labels a published EDU turn factual verification',()=>{
 const host=read('host/project-oneshell-edu.mjs'),visual=read('host/project-oneshell-visual.mjs');
 assert.ok(host.includes("esito:'TURNO EDU TRACCIATO'"));
 assert.ok(host.includes('verita fattuale della risposta NON valutata'));
 assert.ok(host.includes('NATIVE_CHATGPT_DELIVERY_NOT_ATTESTED'));
 assert.ok(visual.includes("return 'VOCE_TRACCIATA'"));
 assert.ok(!host.includes("esito:'RISPOSTA EDU VERIFICATA'"));
 assert.ok(!visual.includes("return 'VOCE_VERIFICATA'"));
});
test('PR1: Project and MCP entrypoints are not fused',()=>{
 assert.match(read('README.md'),/Inizia dal prodotto corretto/);
 assert.match(read('README.md'),/PRODUCT_GO=false/);
 assert.match(read('docs/IKANT_LOCAL_SETUP.md'),/App MCP esterna, indipendente dal Project EDU/);
 assert.doesNotMatch(read('docs/IKANT_LOCAL_SETUP.md'),/## Percorso C — CANONICAL con integrazione MCP reale/);
 assert.match(read('plugins/ikant-le-session-chat/README.md'),/standalone OAuth/);
 assert.match(read('docs/ARCHITECTURE.md'),/public EDU-only selection/);
});
test('PR1: known unsafe representation mutants are rejected',()=>{
 const src=read('host/project-oneshell-edu.mjs');
 const accept=s=>s.includes("esito:'TURNO EDU TRACCIATO'")&&s.includes('verita fattuale della risposta NON valutata')
   &&!s.includes("esito:'RISPOSTA EDU VERIFICATA'");
 assert.equal(accept(src),true);
 for(const v of [
  src.replace("esito:'TURNO EDU TRACCIATO'","esito:'RISPOSTA EDU VERIFICATA'"),
  src.replace('verita fattuale della risposta NON valutata','verita fattuale VERIFICATA'),
  src.replace("esito:'TURNO EDU TRACCIATO'","esito:'PRODOTTO CERTIFICATO'")
 ])assert.equal(accept(v),false);
});
test('PR1: protected owner blobs unchanged',()=>{
 for(const [p,sha] of Object.entries(protectedOwners))
  assert.equal(gitBlob(readFileSync(new URL('../'+p,import.meta.url))),sha,p);
});
