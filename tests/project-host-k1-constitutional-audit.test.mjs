import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {oneShellFrame} from '../host/project-oneshell-edu.mjs';
import {reserveTechnicalAttempt,reopenTechnicalAttempt,verifyLocalGitOriginals,
 verifyOriginalC72Projection,verifyOriginalOwnerVoice,decideEvidenceMutation,ATTACKS}
 from '../host/project-host-k1-constitutional-audit.mjs';
const root=path.resolve(import.meta.dirname,'..');
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
const head=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
const nonce='testConstitutionalAttemptNonce00001';
function privateCase(fn){
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-constitutional-'));fs.chmodSync(d,0o700);
 return Promise.resolve().then(()=>fn(d)).finally(()=>fs.rmSync(d,{recursive:true,force:true}));
}
test('pre-consent cannot write a new audit file',()=>privateCase(d=>{
 const r=reserveTechnicalAttempt({phase:'ORIENTATION',privateRoot:d,sourceHead:head,nonce});
 assert.equal(r.ok,false);assert.equal(fs.readdirSync(d).length,0);
}));
test('postaccept private wx/fsync/reopen records technical attempt only; replay denied',()=>privateCase(d=>{
 const input={phase:'POST_ACCEPT',privateRoot:d,sourceHead:head,nonce};
 const a=reserveTechnicalAttempt(input);assert.equal(a.ok,true,JSON.stringify(a));
 assert.equal(a.original_receipt_attested,false);assert.equal(a.provider_attested,false);
 assert.equal(fs.lstatSync(a.file).mode&0o077,0);
 const b=reopenTechnicalAttempt(input);assert.equal(b.ok,true);
 assert.equal(b.kind,'HOST_ATTEMPT_REOPENED_NOT_RECEIPT');
 assert.equal(reserveTechnicalAttempt(input).ok,false);
 assert.equal(reopenTechnicalAttempt({...input,sourceHead:'f'.repeat(40)}).ok,false);
}));
test('private root mode and symlink are rejected',()=>privateCase(d=>{
 fs.chmodSync(d,0o755);
 assert.equal(reserveTechnicalAttempt({phase:'POST_ACCEPT',privateRoot:d,sourceHead:head,nonce}).ok,false);
 fs.chmodSync(d,0o700);
 const link=d+'-symlink';
 try{fs.symlinkSync(d,link,'dir');
  assert.equal(reserveTechnicalAttempt({phase:'POST_ACCEPT',privateRoot:link,sourceHead:head,nonce}).ok,false);
 }finally{fs.unlinkSync(link);}
}));
test('real checkout HEAD/tree/ten original objects reopened with no remote provider claim',()=>{
 const r=verifyLocalGitOriginals({phase:'POST_ACCEPT',repoRoot:root,sourceHead:head,sourceTree:tree});
 assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.verified_original_count,10);
 assert.equal(r.source_origin_attested,false);assert.equal(r.provider_attested,false);
});
test('attacker-chosen content and consistent SHA do NOT override pinned Git tree',()=>{
 const fake=Buffer.from('attacker chosen source');
 const fakeSha=createHash('sha1').update(Buffer.from('blob '+fake.length+'\0')).update(fake).digest('hex');
 const r=verifyLocalGitOriginals({phase:'POST_ACCEPT',repoRoot:root,sourceHead:head,sourceTree:fakeSha});
 assert.equal(r.ok,false);assert.equal(r.edge,'TREE_PIN_MISMATCH');
 const stale=verifyLocalGitOriginals({phase:'POST_ACCEPT',repoRoot:root,sourceHead:'b'.repeat(40),sourceTree:tree});
 assert.equal(stale.ok,false);
});
test('shape-consistent fake C72 acceptance without original transit cannot promote',()=>privateCase(d=>{
 const fake={schema:'ikant-le-c72-public-accepted/v2',source_head:head,receipt_sha256:'a'.repeat(64)};
 const r=verifyOriginalC72Projection({phase:'POST_ACCEPT',directory:d,sourceHead:head,
  accepted:fake,introduction:{receipt_sha256:'a'.repeat(64)}});
 assert.equal(r.ok,false);assert.equal(r.edge,'ORIGINAL_C72_RECEIPT_NOT_REOPENED');
}));
test('hash-consistent forged voice rejected by original private OneShell WeakSet',()=>{
 const voice='forged voice',sha=createHash('sha256').update(voice).digest('hex');
 const base=oneShellFrame({esito:'READY',b:'host',edge:'NONE',next:'STOP'});
 const forged={...base,voice_origin:'HOST_BOUND_LOCAL',
  original_voice_sha256:sha,slots:{...base.slots,A:voice}};
 const r=verifyOriginalOwnerVoice({phase:'EDU_OWNER_TURN',frame:forged,claimedA:voice});
 assert.equal(r.ok,false);assert.equal(r.edge,'FAKE_C135_VOICE_REJECTED_BY_ORIGINAL_GATE');
 const no=verifyOriginalOwnerVoice({phase:'EDU_OWNER_TURN',frame:base,claimedA:'NO_VOICE'});
 assert.equal(no.ok,false);
});
test('20 single-fault variants fail and zero faults does not claim runtime owner',()=>{
 assert.equal(ATTACKS.length,20);
 for(let i=0;i<20;i++){
  const r=decideEvidenceMutation(1<<i);
  assert.equal(r.ok,false);assert.equal(r.active,false);
  assert.equal(r.provider_attested,false);
 }
 const pass=decideEvidenceMutation(0);
 assert.equal(pass.ok,true);assert.equal(pass.kind,'MODEL_PREOWNER_ONLY');
 assert.equal(pass.original_receipt_attested,false);assert.equal(pass.provider_attested,false);
});
