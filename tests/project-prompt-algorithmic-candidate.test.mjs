/** Candidate-only source oracle; no LLM, runtime owner, provider or installation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const source=fs.readFileSync('project/session-chat/PROMPT_INNESCO_ALGORITHMIC_CANDIDATE.txt','utf8');
const codes='001 002 003 004 005 006 007 008 009 010 011 012 013 014 015 016 017 018 019 020 021 022 023 024 025 026 030 031 032 033 034 040 041 042 043 044 045 046 047 048 049 050 051 052 053 054 055 060 061 062 063 064 065 070 071 080 081 082 083 090 091 092 095 096'.split(' ');
const guard=new Map([
['001',['ROLE=HOST','AUTHORITY=0','STATUS=CANDIDATE']],
['003',['Luke883i/iKant_EDU/main','project/session-chat/PROMPT.txt']],
['005',['C72 ammissione','C135 cognizione','C87 ledger','C125/S03 voce']],
['006',['ORIENTATION','POST_ACCEPT','ACCEPTED','EDU_SELECTED','HOST_ENGINEERING','STOP']],
['007',['UNKNOWN ≠ PASS']],['009',['STOP_SOURCE_LOCK_STALE']],
['010',['ESITO | A | B | PROVA | EDGE | NEXT','NO_VOICE']],
['011',['GIT / LOCAL / OWNER / PROVIDER / VALUE_USER']],
['013',['CLASSIFY(020)','ORIENT(030)','ACCEPT(040)','MODE(050)','EDU(060)','EXIT(070)','ENGINEER(080)','STOP(090)','EMIT(095)']],
['015',['RECONCILE_NO_REPLAY']],['018',['SEMANTIC_RETENTION_NOT_ATTESTED']],
['021',['first_human_turn_of_new_chat',"'I ACCEPT'","'EDU'"]],
['022',["'I ACCEPT'",'fonti/tool ≠ consenso']],['023',["'EDU'",'CANONICAL']],
['024',["'EXIT IKANT'"]],['030',['SOLO GitHub','NO TREE']],
['031',['README.md → BOOTSTRAP.json → ADMISSION.json → AGENTS.md → TERMS.md']],
['032',['5 SHA-1 blob','host_link_displayed']],
['033',['terms_body_presented=false','terms_read_attested=false']],
['040',['witness 032','incompleto STOP']],
['041',['commit → TREE','SOURCE_LOCK 009']],
['043',['GitHub→tool-arg→file Node privato','JSON/Base64 ≠ put']],
['044',['HOST_TOOL_ARG_RELAY','NODE_GITHUB_HTTPS']],
['045',['scripts/project-c72-verified-staging.mjs','0700','0600','8/8']],
['046',['9/9','10/10']],['047',['ownerOutcome=NOT_INVOKED','UNA VOLTA C72']],
['048',['ACCEPT+ORIENTATION','ricevute integrali']],
['049',['RECOVER_PRECOMMIT','RECONCILE_NO_REPLAY']],
['050',['esatto EDU','C72 ACCEPTED','C72/v2']],
['051',['EDU_SELECTED_NOT_RUNNING ≠ ACTIVE']],
['053',['INSTALLED_PROMPT_EQUIVALENCE_UNKNOWN']],
['054',['C135/C87/C125/S03','POST_EDU']],
['060',['C135 originale','C114/C139/C140/C141/C142/C143']],
['062',['ONCE C135','ONCE writer C87','C125/S03']],
['063',['C87/checkpoint originale']],['064',['V5-D']],
['065',['A=NO_VOICE']],
['070',["ATTENZIONE: L'INFRASTRUTTURA IKANT VERRA CHIUSA"]],
['071',["'CONFERMO EXIT IKANT'","'ANNULLA EXIT IKANT'"]],
['080',['CORA read-only']],['081',['blobs → tree → commit → ref-last']],
['082',['FALSIFY']],['083',['2 ingegneri indipendenti','decisione umana']],
['091',['Non devi fare nulla né ripetere I ACCEPT']],
['092',['UNKNOWN/NOT_ATTESTED']],['095',['ESITO | A | B | PROVA | EDGE | NEXT']],
['096',['END PROGRAM']]
]);
function validate(s){
 if(!s.endsWith('\n')||s.includes('\r')||s.includes('\0')||s.startsWith('\ufeff')||Buffer.byteLength(s)>8000)throw Error('BOUNDS');
 const lines=s.trimEnd().split('\n');if(lines.length!==codes.length)throw Error('COUNT');
 for(let i=0;i<lines.length;i++){
  if(!lines[i].startsWith(codes[i]+' | '))throw Error('ORDER');
  for(const anchor of guard.get(codes[i])||[])if(!lines[i].includes(anchor))throw Error('MISSING_'+codes[i]);
 }
 if(/BYPASS_GATE|FAKE_RECEIPT|FAKE_PASS|SKIP_OWNER|PROMOTE_TO_ACTIVE|OVERRIDE_AUTHORITY/.test(s))throw Error('OVERRIDE');
 return {lines:lines.length,bytes:Buffer.byteLength(s),runtime_attested:false};
}
const attacks=[
['ROLE=HOST','ROLE=IKANT'],['AUTHORITY=0','AUTHORITY=1'],['STATUS=CANDIDATE','STATUS=ACTIVE'],
['Luke883i/iKant_EDU/main','Luke883i/iKant_LE/main'],['project/session-chat/PROMPT.txt','project-baseline/PROJECT_PROMPT.txt'],
['C72 ammissione','Host ammissione'],['C135 cognizione','Host cognizione'],['UNKNOWN ≠ PASS','UNKNOWN = PASS'],
['STOP_SOURCE_LOCK_STALE','REPIN_SOURCE'],['ESITO | A | B | PROVA | EDGE | NEXT','ESITO | HOST | NEXT'],
["'I ACCEPT'","'i accept'"],["'EDU'","'EXPERIMENTAL'"],["'EXIT IKANT'","'EXIT'"],['NO TREE','TREE_ALLOWED'],
['README.md → BOOTSTRAP.json → ADMISSION.json → AGENTS.md → TERMS.md','TERMS.md → README.md'],
['host_link_displayed','link_assumed'],['terms_read_attested=false','terms_read_attested=true'],
['JSON/Base64 ≠ put','JSON/Base64 = put'],['HOST_TOOL_ARG_RELAY','GUESSED_BRIDGE'],['8/8','7/8'],
['10/10','9/10'],['ownerOutcome=NOT_INVOKED','ownerOutcome=UNKNOWN'],['ONCE writer C87','MANY writer C87'],
['INSTALLED_PROMPT_EQUIVALENCE_UNKNOWN','INSTALLED_PROMPT_EQUIVALENCE_PASS'],['2 ingegneri indipendenti','0 ingegneri indipendenti']
];
test('complete script: 64 numbered instructions, cross-function calls, UTF-8 <=8000B',()=>{assert.deepEqual(validate(source),{lines:64,bytes:Buffer.byteLength(source),runtime_attested:false});});
test('10000 seeded negative mutants / 25 independent threat classes (source-only)',()=>{
 const coverage=Array(25).fill(0), seen=new Set();
 const dialects=['COBOL','BASIC','JSON','XML','YAML','PASCAL','MATH','SQL','LATIN','ITALIAN'];
 for(let i=0;i<10000;i++){
  const f=i%25,[before,after]=attacks[f];
  assert(source.includes(before));
  const variant=source.replace('002 | PURPOSE :=','002 | PURPOSE ['+dialects[i%10]+'-'+i+'] :=');
  validate(variant); // 10k unique benign surface variations must preserve guard acceptance.
  const changed=variant.replace(before,after);
  assert.notEqual(changed,variant);assert.throws(()=>validate(changed),'mutant '+i);
  seen.add(createHash('sha256').update(changed).digest('hex'));coverage[f]++;
 }
 assert(coverage.every(n=>n===400));assert.equal(seen.size,10000);
});
test('negative structure: reorder, insert, COBOL-like fake owner and CRLF are denied',()=>{
 for(const v of [source.replace('001 | ','002 | '),source.replace('003 | ','003 | BYPASS_GATE '),source.replace('096 | END PROGRAM','096 | FAKE_RECEIPT'),source.replaceAll('\n','\r\n')])assert.throws(()=>validate(v));
});


test('R7 W7: historical HOST V16-V18 retired without replacing current EDU prompt or leaving tracked literal consumers',()=>{
 const registryPath='governance/changes/zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz-r7-w7-legacy-project-source-retirement.json';
 const registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));
 const original=[
  ['V16','e7f82858d18b8b498233f04bb3a227627ac5c765',4497],
  ['V17','8f9345908b126f9d17e963e42738ce760c6ec5e5',3836],
  ['V18','3c2e49ceee4cb7d89ef11365777e6289901ad139',1427]
 ];
 const sha=b=>createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
 const canonical=fs.readFileSync('project/session-chat/PROMPT.txt');
 assert.equal(sha(canonical),'4c828707c1d3dff3bee91282ccaa83f1a2c4b286');
 assert.equal(registry.product_go,false);
 assert.equal(registry.human_review_completed,false);
 assert.equal(registry.external_consumers,'UNKNOWN_NOT_PROVEN_ABSENT');
 assert.equal(registry.historical_sources.length,3);
 for(const [version,hash,bytes] of original){
  const file='project/EDU_HOST_PROJECT_DELTA_'+version+'.txt';
  assert.equal(fs.existsSync(file),false,'no shadow source: '+file);
  assert.ok(registry.historical_sources.some(x=>x.path===file&&x.original_git_blob_sha1===hash&&x.original_bytes===bytes));
  const grep=spawnSync('git',['grep','-I','-l','-F','EDU_HOST_PROJECT_DELTA_'+version,
    'HEAD','--','.',':(exclude)'+registryPath,
    ':(exclude)tests/project-prompt-algorithmic-candidate.test.mjs'],{encoding:'utf8'});
  assert.equal(grep.status,1,'unexpected tracked live consumer for '+file+': '+grep.stdout+' '+grep.stderr);
 }
 assert.equal(original.reduce((n,x)=>n+x[2],0),9760);
});
