import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {buildP1HostAnnex,materializeP1HostAnnex,verifyP1AnnexBytes} from '../host/p1-semantic-annex.mjs';
test('P1 host-only annex exact original atoms and materialized readback',()=>{
 const a=buildP1HostAnnex({turnId:'t1',slideAtomIds:['a1'],atoms:[{id:'a1',source:'human',original_text:'short',critical:true,in_slide:true},{id:'a2',source:'tool',original_text:'full detailed source\nwith nuance',critical:true,in_slide:false}]});
 assert.equal(a.ok,true);assert.equal(a.atom_coverage,1);assert.equal(a.annex_materialized,false);assert.equal(a.c87_original,false);
 const dir=mkdtempSync(join(tmpdir(),'ikant-p1-'));try{const dest=join(dir,'annex.json'),r=materializeP1HostAnnex({document:a,path:dest});assert.equal(r.ok,true);assert.equal(readFileSync(dest,'utf8'),a.annex_utf8);assert.equal(materializeP1HostAnnex({document:a,path:dest}).ok,false);}finally{rmSync(dir,{recursive:true,force:true});}
});
test('P1 rejects omitted or altered semantic atoms and forged digest',()=>{
 const atoms=[{id:'x',source:'tool',original_text:'critical: do not omit',critical:true,in_slide:false}];
 assert.equal(buildP1HostAnnex({turnId:'T',atoms,slideAtomIds:['x']}).ok,false);
 const good=buildP1HostAnnex({turnId:'T',atoms,slideAtomIds:[]});assert.equal(good.ok,true);
 assert.equal(verifyP1AnnexBytes(good.annex_utf8.replace('critical','unproved'),good.annex_sha256).ok,false);
 for(let i=0;i<512;i++){
  const o=buildP1HostAnnex({turnId:'T',atoms:[{...atoms[0],id:'x'+i,original_text:'claim'+i}],slideAtomIds:[]});
  assert.equal(o.ok,true);assert.equal(verifyP1AnnexBytes(o.annex_utf8,o.annex_sha256).ok,true);
  assert.equal(verifyP1AnnexBytes(o.annex_utf8+' ',o.annex_sha256).ok,false);
 }
});
