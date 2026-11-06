import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {search,brokenLinks,safe} from '../scripts/readme-1000-variants.mjs';
import {verifyReadme,falsifyReadme} from '../scripts/readme-contract-select.mjs';
import {validateStandalone} from '../scripts/ikant-semantic-reticulum.mjs';
import {verify as verifyAtlas,audit} from '../scripts/ikant-document-atlas.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const home=fs.readFileSync(path.join(root,'README.md'),'utf8');
test('SOURCE: original V1 compact envelope, existing editorial and neuro invariants',()=>{
 assert.ok(Buffer.byteLength(home,'utf8')>=16000&&Buffer.byteLength(home,'utf8')<=48000);
 assert.deepEqual(verifyReadme(home,root),{ok:true,errors:[]});
 assert.equal(validateStandalone(home).ok,true);
 assert.equal(falsifyReadme(home,root).rejected,100);
 assert.equal(verifyAtlas().atlas_exact,true);
 for(const s of ['## Cosa ottieni oggi: natura, ratio e utilità','### Cosa non e','## Full stack reale','## Modalità e bootstrap','## Tre domande di ricerca','## Metodo end-to-end, sviluppo e lettori'])
  assert.ok(home.includes(s),'legacy standalone source '+s);
});
test('PRODUCT: bounded cognitive model, real full stack, original authority separation',()=>{
 for(const term of ['ricorrenza','attenzione','valenza','provenienza',
 'Full stack reale','MCP_EXTERNAL','**EDU**','**MCP_EXTERNAL**',
 'Fenomenologia: UNKNOWN','PRODUCT_NO_GO','RQ1','RQ2','RQ3',
 'C87','C125','C59','non installano Node'])
  assert.ok(home.includes(term),'missing '+term);
 assert.ok(home.indexOf('## Cosa ottieni')<home.indexOf('## Modalità e bootstrap'));
 assert.ok(home.indexOf('## Modalità e bootstrap')<home.indexOf('## MCP esterno'));
 assert.ok(home.indexOf('## MCP esterno')<home.indexOf('## Tre domande di ricerca'));
 assert.doesNotMatch(home,/CANONICAL \(via MCP\)|MCP connesso implica ACTIVE|è una coscienza dimostrata/);
});
test('PUBLIC: START_HERE does not launder external MCP into C59 CANONICAL',()=>{
 const intro=fs.readFileSync(path.join(root,'docs/START_HERE.md'),'utf8');
 assert.match(intro,/CANONICAL/);assert.match(intro,/C59/);assert.match(intro,/MCP esterno/);
 assert.doesNotMatch(intro,/CANONICAL[^.]{0,100}servizio MCP/i);
});
test('MCP: documented Render deployment and ChatGPT connection remain qualified',()=>{
 for(const term of ['render.mcp-standalone.candidate.yaml','docs/MCP_STANDALONE_RENDER_RUNBOOK.txt',
  'plugins/ikant-le-session-chat/mcp.standalone.template.json','IKANT_MCP_DEPLOYMENT_PROFILE',
  'IKANT_MCP_AUTH_MODE','IKANT_MCP_OAUTH_RESOURCE','IKANT_MCP_OAUTH_ISSUER',
  'IKANT_MCP_OAUTH_JWKS_URL','IKANT_LE_DEPLOYMENT_ROOT','PKCE S256',
  'JWKS','ikant:connect','ikant:write','/.well-known/oauth-protected-resource/mcp',
  'Plugins → Add custom MCP server','disco','401','riconciliazione'])
  assert.ok(home.includes(term),'missing '+term);
});
test('LINKS: source atlas and curated paths exist, no self-asserted installation',()=>{
 assert.deepEqual(brokenLinks(home),[]);
 const docs=new Set([...home.matchAll(/\]\((docs\/[^)#]+)\)/g)].map(m=>m[1]));
 assert.ok(docs.size>=15,'at least 15 distinct entrypoints to full atlas');
 const a=audit();assert.ok(a.total>=169);
 assert.ok(home.includes('docs/IKANT_DOCUMENT_ATLAS.md'));
});
test('MUTATIONS: 1000 distinct text candidates and 1000 rejected negative counterexamples',()=>{
 const r=search(home);
 assert.equal(r.generated,1000);assert.equal(r.distinct_texts,1000);
 assert.equal(r.eligible,1000);assert.equal(r.negative_mutants,1000);
 assert.equal(r.negative_survivors,0);assert.equal(r.winner.id,'RD0001');
 assert.equal(r.atlas.exact,true);assert.ok(r.atlas.markdown_count>=169);
 assert.ok(r.candidates.every(x=>x.valid&&x.sha256.length===64));
});
test('FALSIFICATION: removing source identity and denying product boundaries fails',()=>{
 for(const term of ['MCP_EXTERNAL','C87','Fenomenologia: UNKNOWN','PKCE S256','GitHub API only'])
  assert.equal(safe(home.replaceAll(term,'[OMITTED]')),false,term);
 assert.equal(safe(home+'MCP connesso implica ACTIVE'),false);
 assert.equal(safe(home+'è una coscienza dimostrata'),false);
});
