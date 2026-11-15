import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {buildSessionShell} from '../src/session-shell.mjs';
import {initialState,readLedger} from '../src/state.mjs';
import {projectSessionCapsule,verifySessionCapsule,renderSessionCapsule,reopenProjectSession} from '../host/project-session-capsule.mjs';
const source={head:'a'.repeat(40),tree:'b'.repeat(40)};
test('capsule keeps complete original public owner output while separating HOST unknowns',()=>{
 const shell=buildSessionShell({state:initialState(),surfaceText:'CONTROL'});
 const c=projectSessionCapsule({shell,source,host:{node:'20.0.0',native_ui:true,token:'secret'}});
 assert(verifySessionCapsule(c));assert.deepEqual(c.payload.original_session_shell,shell);
 assert.equal(c.axes.host.native_ui.status,'UNKNOWN');assert(!JSON.stringify(c).includes('secret'));
 assert.equal(c.voice,'NO_VOICE');assert.equal(c.active,false);
 const text=renderSessionCapsule(c,{evidenceHref:'sandbox:/verified.json'});
 for(const id of ['ESITO','A','B','PROVA','EDGE','NEXT'])assert.match(text,new RegExp('^'+id+' ·','m'));
 assert.throws(()=>renderSessionCapsule(c,{evidenceHref:'javascript:alert(1)'}));
});
test('derived capsule tampering, altered status, truncated backlog and source rebinding fail',()=>{
 const c=projectSessionCapsule({shell:buildSessionShell({state:initialState()}),source});
 for(const mutate of [x=>x.active=true,x=>x.axes.host.native_ui.status='VERIFIED',x=>x.source.head='c'.repeat(40),x=>x.payload.original_session_shell.self_summary.text='replacement',x=>x.next='GO',x=>x.evidence_bytes++]){
  const bad=structuredClone(c);mutate(bad);assert.equal(verifySessionCapsule(bad),false);
 }
});
test('snapshot is read-only with respect to original runtime ledger; evidence physically reopened',()=>{
 const before=JSON.stringify(readLedger()),dir=fs.mkdtempSync(path.join(os.tmpdir(),'project-capsule-'));
 try{const x=reopenProjectSession({source,outputRoot:dir});assert.equal(x.ledger_unchanged,true);
 assert.equal(JSON.stringify(readLedger()),before);assert.equal(fs.statSync(x.evidence.path).size,x.evidence.bytes);
 assert.equal(fs.readFileSync(x.evidence.path,'utf8'),JSON.stringify(x.capsule.payload));
 const y=reopenProjectSession({source,outputRoot:dir});assert.equal(x.evidence.sha256,y.evidence.sha256);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
