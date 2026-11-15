import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateStandaloneProfile,evaluateRequestEnvelope,MAX_INPUT_BYTES} from '../plugins/ikant-le-session-chat/server/mcp-standalone-policy.mjs';
import {invokeRuntime} from '../plugins/ikant-le-session-chat/server/runtime-limits.mjs';
import {semanticMatrix} from '../scripts/mcp-standalone-semantic-10k.mjs';
const good={IKANT_MCP_DEPLOYMENT_PROFILE:'standalone',IKANT_MCP_AUTH_MODE:'oauth',
 IKANT_MCP_OAUTH_RESOURCE:'https://example.org/mcp',IKANT_MCP_OAUTH_ISSUER:'https://issuer.example/',
 IKANT_MCP_OAUTH_JWKS_URL:'https://issuer.example/keys',IKANT_MCP_ALLOWED_ORIGIN:'https://chatgpt.com',
 IKANT_MCP_PERSISTENCE_ROOT:'/var/data/ikant-le',IKANT_LE_DEPLOYMENT_ROOT:'/var/data/ikant-le/deployment',PORT:'10000'};
test('standalone profile strict OAuth, pinned resource and isolated persistent root',()=>{
 const p=validateStandaloneProfile(good);assert.equal(p.standalone,true);
 assert.equal(p.native_event_attested,false);assert.equal(p.product_go,false);
 assert.equal(validateStandaloneProfile({}).standalone,false);
 const cases=[
  [{IKANT_MCP_AUTH_MODE:'gateway'},/OAUTH_REQUIRED/],
  [{IKANT_MCP_PERSISTENCE_ROOT:'/var/data/other'},/PERSISTENCE_BOUNDARY/],
  [{IKANT_LE_DEPLOYMENT_ROOT:'/var/data/ikant-le2/escape'},/PERSISTENCE_BOUNDARY/],
  [{IKANT_MCP_ALLOWED_ORIGIN:'*'},/ORIGIN_INVALID/],
  [{IKANT_ONESHELL_THREAD_PANEL:'1'},/UNATTESTED_NATIVE_UI/],
  [{IKANT_MCP_OAUTH_RESOURCE:'http://insecure.example/mcp'},/CONFIG_REQUIRED/],
  [{PORT:'99999'},/PORT_INVALID/]
 ];
 for(const [delta,expected] of cases)assert.throws(()=>validateStandaloneProfile({...good,...delta}),expected);
});
test('incoming envelope rejects method, origin, content type and excessive lengths',()=>{
 const base={method:'POST',path:'/mcp',origin:'https://chatgpt.com',contentType:'application/json',contentLength:200};
 assert.equal(evaluateRequestEnvelope(base).ok,true);
 const negatives=[
  [{method:'PATCH'},405], [{path:'/other'},404], [{origin:'https://evil.example'},403],
  [{contentType:'text/plain'},415], [{contentLength:MAX_INPUT_BYTES+1},413], [{contentLength:'NaN'},413]
 ];
 for(const [delta,code] of negatives)assert.equal(evaluateRequestEnvelope({...base,...delta}).status,code);
});
function fixture(contents){
 const root=mkdtempSync(join(tmpdir(),'ikant-mcp-test-'));
 const script=join(root,'child.mjs');writeFileSync(script,contents);
 return {root,script,cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
test('stateful operations have bounded positive JSON outputs',async()=>{
 const f=fixture("process.stdin.on('data',()=>{});process.stdin.on('end',()=>process.stdout.write(JSON.stringify({ok:1})));");
 try{assert.deepEqual(await invokeRuntime({op:'open',payload:{x:1},cli:f.script,repoRoot:f.root}),{ok:1});
 assert.deepEqual(await invokeRuntime({op:'turn',payload:{x:2},cli:f.script,repoRoot:f.root}),{ok:1});}finally{f.cleanup();}
});
test('possible write effect followed by process error is UNKNOWN and never retryable',async()=>{
 const f=fixture("process.stdin.resume();process.stdin.on('end',()=>process.exit(2));");
 try{await assert.rejects(invokeRuntime({op:'turn',payload:{x:1},cli:f.script,repoRoot:f.root}),
  e=>e.code==='MCP_UNKNOWN_WRITE_RECONCILE'&&e.retry_allowed===false);}
 finally{f.cleanup();}
});
test('open also remains potentially stateful on uncertain failure',async()=>{
 const f=fixture("process.stdin.resume();process.stdin.on('end',()=>process.exit(1));");
 try{await assert.rejects(invokeRuntime({op:'open',payload:{},cli:f.script,repoRoot:f.root}),
  e=>e.code==='MCP_UNKNOWN_WRITE_RECONCILE'&&e.retry_allowed===false);}
 finally{f.cleanup();}
});
test('timeout, overflow and malformed output fail closed',async()=>{
 const fixtures=[
  "process.stdin.resume();setInterval(()=>{},1000);",
  "process.stdin.resume();process.stdin.on('end',()=>process.stdout.write('x'.repeat(9*1024*1024)));",
  "process.stdin.resume();process.stdin.on('end',()=>process.stdout.write('garbage'));"
 ];
 for(const code of fixtures){const f=fixture(code);
  try{await assert.rejects(invokeRuntime({op:'accept',payload:{},cli:f.script,repoRoot:f.root,timeoutMs:1000}),
    e=>e.code==='MCP_UNKNOWN_WRITE_RECONCILE'&&e.retry_allowed===false);}
  finally{f.cleanup();}
 }
});
test('input cap blocks before spawn',async()=>{
 let spawned=0;
 await assert.rejects(invokeRuntime({op:'turn',payload:{text:'a'.repeat(300000)},cli:'none',repoRoot:'.',spawnImpl:()=>{spawned++;throw Error('bad');}}),/MCP_UNKNOWN_WRITE_RECONCILE/);
 assert.equal(spawned,0);
});
test('10k questions deterministic closed-form, no native/product overclaim',()=>{
 const a=semanticMatrix(),b=semanticMatrix();
 assert.equal(a.cases,10000);assert.equal(a.corpus_sha256,b.corpus_sha256);
 assert.equal(a.negative_fail_open,0);assert.equal(a.domains,20);
 assert.equal(a.independent_llm_semantics_attested,false);
 assert.equal(a.chatgpt_installed,false);assert.equal(a.product_go,undefined);
});
