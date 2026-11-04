import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {
 c72SourceRepository,c72LinkedTermsURL,issueC72V2TermsOffer,
 issueC72V2LinkedTermsOffer,acceptC72V2LinkedTerms,
 validateC72V2Accepted
} from '../host/c72-public-mode-admission.mjs';
import {createProjectC72PreacceptGate} from '../host/project-c72-preaccept-gate.mjs';
import {scanSource} from '../scripts/repository-rename-inventory.mjs';

const ROOT=new URL('../',import.meta.url);
const boot=JSON.parse(fs.readFileSync(new URL('../BOOTSTRAP.json',import.meta.url)));
const admission=JSON.parse(fs.readFileSync(new URL('../ADMISSION.json',import.meta.url)));
const contract=JSON.parse(fs.readFileSync(new URL('../contracts/repository-rename-2dim.json',import.meta.url)));
const dod=JSON.parse(fs.readFileSync(new URL('../contracts/repository-rename-s01-s03-dod.json',import.meta.url)));
const H='a'.repeat(40),D='b'.repeat(64);
const sha=b=>createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');

test('S01 postrename canonical repository is the unique operative C72 source',()=>{
 assert.equal(boot.canonical_repository,contract.repo_name_to);
 assert.equal(admission.repository,boot.canonical_repository);
 assert.equal(boot.canonical_branch,'main');
 assert.equal(c72SourceRepository(),contract.repo_name_to);
 assert.equal(c72LinkedTermsURL(H),'https://github.com/'+contract.repo_name_to+'/blob/'+H+'/TERMS.md');
 for(const wrong of ['0'.repeat(39),'z'.repeat(40),'','HEAD','main'])assert.throws(()=>c72LinkedTermsURL(wrong));
});

test('S02 original linked owner digest preserves exact NEW source-bound Terms',()=>{
 const offer=issueC72V2LinkedTermsOffer({sourceHead:H,termsDigest:D});
 const original=issueC72V2TermsOffer({sourceHead:H,termsDigest:D});
 const {receipt_sha256,...body}=original;
 const expected={
  ...body,presentation:'PINNED_DOCUMENT_LINK',
  terms_link:'https://github.com/Luke883i/iKant_EDU/blob/'+H+'/TERMS.md',
  terms_body_presented:false,terms_read_attested:false
 };
 assert.equal(offer.receipt_sha256,hash(expected));
 assert.deepEqual(offer,{...expected,receipt_sha256:hash(expected)});
 const accepted=acceptC72V2LinkedTerms({offer,humanMessage:'I ACCEPT',termsLinkPresented:true});
 assert.equal(validateC72V2Accepted(accepted),true);
 for(const input of ['I ACCEPT ', 'EDU','I ACCEPT\n']){
  const x=acceptC72V2LinkedTerms({offer,humanMessage:input,termsLinkPresented:true});
  assert.equal(x.native_event_attested,false);
  assert.equal(x.active,false);
  assert.equal(x.owner_receipt_issued,false);
 }
 const spoofed={...offer,terms_link:'https://github.com/Luke883i/iKant_LE/blob/'+H+'/TERMS.md'};
 assert.equal(acceptC72V2LinkedTerms({offer:spoofed,humanMessage:'I ACCEPT',termsLinkPresented:true}).active,false);
});

test('S02 original first-contact source-root Git SHA remains frozen, not silently rebuilt',()=>{
 const root=boot.post_accept_fastboot.runtime_root;
 const member=root.members.find(x=>x.path==='src/first-contact.mjs');
 assert.ok(member);
 const bytes=fs.readFileSync(new URL('../src/first-contact.mjs',import.meta.url));
 assert.equal(sha(bytes),member.blob_sha1);
 assert.equal(bytes.length,member.bytes);
 const staged=execFileSync('git',['rev-parse','HEAD:src/first-contact.mjs'],{cwd:ROOT,encoding:'utf8'}).trim();
 assert.equal(staged,member.blob_sha1);
 assert.equal(contract.original_receipt_transfer,false);
});

test('S02 C72 preaccept original offers exactly five HEAD-bound links',async()=>{
 const order=['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md'];
 const gate=createProjectC72PreacceptGate({
  readMain:async()=>H,
  readDocument:async(path)=> {
   const content=fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
   return {content,blob_sha1:sha(Buffer.from(content))};
  }
 });
 const r=await gate.orient();
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.documents.length,5);
 for(let i=0;i<order.length;i++){
  assert.equal(r.documents[i].path,order[i]);
  assert.equal(r.documents[i].link,'https://github.com/'+contract.repo_name_to+'/blob/'+H+'/'+order[i]);
  assert.notEqual(r.documents[i].link,'https://github.com/'+contract.repo_name_from+'/blob/'+H+'/'+order[i]);
 }
 assert.equal(r.terms_link,c72LinkedTermsURL(H));
 assert.equal(r.original_offer.active,false);
});

test('S03 discovered external consumer is classified but cannot self-close',()=>{
 const external=dod.external_consumer_observations;
 assert.ok(external.length>=2);
 assert(external.some(x=>x.repository==='Luke883i/academics'&&x.path==='README.md'));
 assert(external.some(x=>x.repository==='Luke883i/academics'&&x.path==='scripts/falsify_hub_semantics.py'));
 assert(external.some(x=>x.repository==='Luke883i/ikant'&&x.path==='.github/workflows/engineering-governance.yml'));
 assert(external.some(x=>x.repository==='Luke883i/ikant'&&x.path==='DEPLOYMENT_REALITY_CONTRACT.json'));
 assert.equal(dod.s03.search_scope.visible_repository_count,13);
 assert.equal(dod.s03.search_scope.matched_repositories['Luke883i/ikant'],7);
 for(const x of external){
  assert.match(x.blob_sha1,/^[a-f0-9]{40}$/);
  assert.notEqual(x.owner_runtime_readback,'PASS');
 }
 assert.equal(dod.s03.external_owner_closure,'UNKNOWN');
 assert.equal(dod.s03.hosted_actions_callers,'UNKNOWN');
 assert.equal(dod.s03.rename_gate,'BLOCKED');
 assert.equal(dod.authority,0);
 assert.equal(dod.admin_rename_performed,false);
});

test('S01/S02/S03 source audit: first unresolved edge is not promoted by CI',()=>{
 const census=scanSource();
 assert.equal(census.status,'NOT_READY_FOR_RENAME');
 assert(census.rows.some(x=>x.path==='host/project-c72-coldstart-seed.mjs'));
 assert(census.rows.some(x=>x.path==='src/first-contact.mjs'));
 assert.equal(dod.s01.status,'PARTIAL_PREPARE_ONLY');
 assert.equal(dod.s02.status,'REGRESSION_EVIDENCE_REQUIRED');
 assert.equal(dod.s03.status,'EXTERNAL_CLOSURE_OPEN');
 assert.equal(dod.global.status,'RENAME_NO_GO');
});
