import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createC129PublicEduV2Session} from '../host/edu-c129-manual-entry.mjs';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {C107_FILES} from '../scripts/c107-pack.mjs';
const root=path.resolve(new URL('../',import.meta.url).pathname);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function selection(repo){
 const head=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
 const offer=issueC72V2TermsOffer({sourceHead:head,termsDigest:sha(fs.readFileSync(path.join(repo,'TERMS.md')))});
 const accepted=acceptC72V2Terms({offer,humanMessage:'I ACCEPT',termsPresented:true});
 return selectC72V2Mode({accepted,orientation:presentC72V2Introduction(accepted),humanMessage:'EDU'});
}
const witness={accepted:true,scope:'HOST_WITNESSED_ONLY'};
const languagePort=async()=>{throw Error('MUST_NOT_RUN_BEFORE_PUBLISH')};
const send=async()=>{throw Error('MUST_NOT_SEND_BEFORE_PUBLISH')};

test('S02 CI C32 generated qualification receipt is non-runtime; executable Git blob drift is denied',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'s02-c32-source-'));
 let admitted=null;
 try{
  const clone=path.join(parent,'checkout');
  execFileSync('git',['-c',`safe.directory=${root}`,'clone','--quiet','--local','--no-hardlinks',root,clone],{encoding:'utf8',timeout:25000});
  const receipt=path.join(clone,'artifacts/qualification/c32-session-shell-falsification-1m.json');
  assert.ok(fs.existsSync(receipt));
  fs.appendFileSync(receipt,'\n');
  const modified=execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:clone,encoding:'utf8'});
  assert.match(modified,/c32-session-shell-falsification-1m\.json/);
  admitted=await createC129PublicEduV2Session({selection:selection(clone),sourceRoot:clone,privateParent:parent,
   languagePort,send,afterAcceptWitness:witness});
  assert.equal(admitted.ok,true,JSON.stringify(admitted));
  assert.equal(admitted.active,false);
  admitted.close();admitted=null;
  const executable='host/c107-edu-v2-turn.mjs';
  assert.ok(C107_FILES.includes(executable));
  fs.appendFileSync(path.join(clone,executable),'\n// hostile drift\n');
  const blocked=await createC129PublicEduV2Session({selection:selection(clone),sourceRoot:clone,privateParent:parent,
   languagePort,send,afterAcceptWitness:witness});
  assert.equal(blocked.ok,false);
  assert.equal(blocked.first_edge,'S02_GIT_SOURCE_OR_V2_SELECTION_UNVERIFIED');
 }finally{admitted?.close();fs.rmSync(parent,{recursive:true,force:true})}
});
