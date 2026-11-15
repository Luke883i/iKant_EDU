import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {oneShellFrame} from '../host/project-oneshell-edu.mjs';
import {makeOneShellCompactEvidence,verifyOneShellCompactEvidence} from '../host/project-oneshell-compact.mjs';
const frame=oneShellFrame({esito:'CONTROL',b:'HOST\nESITO | not a real boundary\nUTF-8: è Ω',
 prova:'https://github.com/owner/repo/blob/immutable/file',edge:'SOURCE_LOCK_STALE',next:'STOP'});
test('physical compact evidence reopens and recovers all six original machine slot values',()=>{
 const root=mkdtempSync(join(tmpdir(),'ikant-compact-'));
 const path=join(root,'receipt.json');const p=makeOneShellCompactEvidence(frame,{evidenceFile:path});
 assert.equal(p.physical_readback_attested,true);
 assert.equal(verifyOneShellCompactEvidence(p,{frame}).ok,true);
 assert.equal(p.evidence.original_slots.B,frame.slots.B);
 assert.equal(p.evidence.original_slots.PROVA,frame.slots.PROVA);
 assert.equal(p.evidence.original_slots.EDGE,frame.slots.EDGE);
 assert.equal(p.evidence.original_slots.NEXT,frame.slots.NEXT);
 assert(p.compact_utf8.includes('ESITO | not a real boundary'));
 assert.equal(p.compact_utf8.split('\n').length,8); // six LOGICAL slots, not six physical lines.
 assert.throws(()=>makeOneShellCompactEvidence(frame,{evidenceFile:path}),/FRESH/);
 const raw=readFileSync(path,'utf8');writeFileSync(path,raw.replace('SOURCE_LOCK_STALE','OTHER_EDGE'));
 assert.throws(()=>verifyOneShellCompactEvidence(p,{frame}),/REOPEN|READBACK/);
});
test('no readback means no attested file, no fake links',()=>{
 const p=makeOneShellCompactEvidence(frame);
 assert.equal(p.evidence_file,null);assert.equal(p.physical_readback_attested,false);
 assert.equal(verifyOneShellCompactEvidence(p,{frame}).ok,true);
 assert.throws(()=>verifyOneShellCompactEvidence({...p,compact_utf8:'shortened'}),/REVERSIBLE/);
 assert.throws(()=>verifyOneShellCompactEvidence({...p,evidence:{...p.evidence,
  original_slots:{...p.evidence.original_slots,A:'Some invented voice'}}}),/MISMATCH/);
 assert.throws(()=>makeOneShellCompactEvidence({...frame,slots:{...frame.slots,A:'Sono iKant'}}));
});
test('100 reproducible design candidates reject all semantic losses',async()=>{
 const {execFileSync}=await import('node:child_process');
 const path=new URL('../scripts/oneshell-compact-select-100.mjs',import.meta.url).pathname;
 const a=JSON.parse(execFileSync(process.execPath,[path],{encoding:'utf8'}));
 const b=JSON.parse(execFileSync(process.execPath,[path],{encoding:'utf8'}));
 assert.deepEqual(a,b);assert.equal(a.tested,100);
 assert.equal(a.admissible,9);assert.equal(a.rejected,91);
 assert.equal(a.layout,'SIX_CONTIGUOUS');assert.equal(a.mutation,'REMOVE_INTER_SLOT_BLANK_LINES');
 assert.equal(a.digest_sha256,'314954342b5db8d0e686626cffd82f4176a39e7188901fbb8e3be3ca428ea2fe');
});
