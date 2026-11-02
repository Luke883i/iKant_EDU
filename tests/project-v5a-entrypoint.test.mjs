import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {deriveLegacyAlias,auditRepository,evaluateEntrypointGraph,expectedGraph,SOURCE,ALIAS} from '../scripts/project-edu-entrypoint.mjs';
function fixture(fn){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'v5a-entry-'));
 const put=(p,text)=>{const file=path.join(dir,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text)};
 const source='iKant EDU OneShell - PRIMO messaggio umano di nuova chat - C72/C135/C87/C125/S03';
 put('BOOTSTRAP.json',JSON.stringify({project_session:{prompt:SOURCE}}));
 put('contracts/project-prompt-generation.json',JSON.stringify({source_prompt:SOURCE}));
 put('release/catalog.json',JSON.stringify({public_entrypoints:{edu_prompt:SOURCE}}));
 put('package.json',JSON.stringify({version:'1.0.0-edu.1'}));
 put('scripts/c131-build-project-bundle.py',"SOURCES={'PROMPT_INNESCO.txt':'project/edu-oneshell/PROMPT_INNESCO.txt'}");
 put(SOURCE,source);
 put(ALIAS,deriveLegacyAlias(Buffer.from(source), '1.0.0-edu.1'));
 put('README.md','**Come iniziare EDU:** al primo messaggio orientamento; poi I ACCEPT e infine EDU');
 put('docs/START_HERE.md','Al primo messaggio l’orientamento; poi I ACCEPT e EDU.');
 try{fn({dir,put,source});}finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('normative graph has single source and does not mint original authority',()=>{
 const g=evaluateEntrypointGraph(expectedGraph());assert.equal(g.ok,true);assert.equal(g.owner_receipt,false);
 for(const k of ['bootstrap','generator','catalog'])assert.equal(evaluateEntrypointGraph({...expectedGraph(),[k]:ALIAS}).ok,false);
});
test('derived alias is core byte-exact and includes only packaging version trailer',()=>{
 const source=Buffer.from('PRIMO messaggio umano di nuova chat \n iKant');
 const x=deriveLegacyAlias(source,'1.0.0-edu.1');assert(x.subarray(0,source.length).equals(source));
 assert.match(x.toString('utf8').slice(source.length),/DISTRIBUTION_VERSION=1\.0\.0-edu\.1/);
 assert.throws(()=>deriveLegacyAlias(source,'unverified'),/INVALID/);
});
test('fixture with all original references coherently retargeted passes',()=>fixture(({dir})=>{
 const r=auditRepository(dir);assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.product_release,'PRODUCT_NO_GO');
}));
test('historical independent catalog pointer fails without writing files',()=>fixture(({dir,put})=>{
 put('release/catalog.json',JSON.stringify({public_entrypoints:{edu_prompt:ALIAS}}));
 assert.equal(auditRepository(dir).edge,'V5A_SOURCES_DISAGREE');
}));
test('mutating one legacy alias byte cannot pass as derived',()=>fixture(({dir,put,source})=>{
 put(ALIAS,source+'\nnew independent instruction');
 assert.equal(auditRepository(dir).edge,'V5A_MISSING_READBACK');
}));
test('obsolete onboarding contradicting the first turn fails',()=>fixture(({dir,put})=>{
 put('docs/START_HERE.md','Sono necessari tre nuovi messaggi distinti: `avvia iKant`, poi `I ACCEPT` poi `EDU`');
 assert.equal(auditRepository(dir).edge,'V5A_MISSING_READBACK');
}));
test('no required owner can be waived by one-source coherence',()=>{
 for(const k of ['original_c72','original_c135','original_c87','original_c125_s03'])
  assert.equal(evaluateEntrypointGraph({...expectedGraph(),[k]:false}).edge,'V5A_OWNER_BYPASS');
});
if(process.env.V5A_FIXTURE_ONLY!=='1')test('checkout source graph is consistent',()=>{
 const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
 const result=auditRepository(root);assert.equal(result.ok,true,JSON.stringify(result));
});
