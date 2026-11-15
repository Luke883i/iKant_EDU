import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {unpackC94Zip} from '../host/c94-zip-c77.mjs';
import {verifyC94C77Derivation} from '../host/c94-derived-c77-proof.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const archive=fs.readFileSync(new URL('./fixtures/c77-historical-head-66f074b3.zip',import.meta.url));
const original=unpackC94Zip(archive);
const originalManifest=JSON.parse(original.get('c77-manifest.json'));
test('C71 original deterministic source blob identity and 70 source-census anchors',()=>{
 const r=verifyC94C77Derivation(original,originalManifest);
 assert.equal(r.status,'C94_C77_DERIVATION_VERIFIED_SOURCE_ANCHORS_PARTIAL');
 assert.equal(r.cx_count,70);assert.equal(r.derivation_verified,true);
 assert.equal(r.cx_anchor_git_reachability_independently_verified,false);
});
test('a malicious C71 derivative whose manifest hash was recomputed cannot become admitted',()=>{
 const files=new Map(original);const m=structuredClone(originalManifest);
 const p='src/c71-experimental-host-draft.mjs';const raw=Buffer.concat([files.get(p),Buffer.from('\n// injected malicious behavior')]);
 files.set(p,raw);const spec=m.files.find(x=>x.path===p);spec.sha256=sha(raw);spec.bytes=raw.length;
 assert.equal(verifyC94C77Derivation(files,m).status,'C94_DERIVATION_STOP');
});
test('C77 70-Cx proof with altered anchor or census digest is denied',()=>{
 for(const change of [p=>p.entries[0].git_blob_sha1='f'.repeat(40),p=>p.entries[2].path='../unsafe',p=>p.census_sha256='f'.repeat(64)]){
  const files=new Map(original),p=JSON.parse(files.get('contracts/c77-cx-build-proof.json'));
  change(p);files.set('contracts/c77-cx-build-proof.json',Buffer.from(JSON.stringify(p)));
  assert.equal(verifyC94C77Derivation(files,originalManifest).status,'C94_DERIVATION_STOP');
 }
});
