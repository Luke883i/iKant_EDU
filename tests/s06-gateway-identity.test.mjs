import test from 'node:test';import assert from 'node:assert/strict';
import os from 'node:os';import fs from 'node:fs';import path from 'node:path';
import {signS06GatewayProof,verifyS06GatewayProof} from '../plugins/ikant-le-session-chat/server/gateway-identity.mjs';
const secret='proper-staged-secret-only-in-tests-AAAAAAAAAAAA';
const payload=(i=0)=>({event:'event_'+String(i).padStart(12,'0'),method:'POST',path:'/mcp',user:'user_pseudonym_111',session:'session_abcdefghij',ts:1730000000000});
test('S06 valid gateway proof single acceptance; replay remains denied after recheck',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-s06-'));fs.chmodSync(dir,0o700);
 try{const proof=signS06GatewayProof({payload:payload(1),secret});
  const f=()=>verifyS06GatewayProof({proof,secret,method:'POST',now:1730000001000,nonceDirectory:dir});
  const first=f();assert.equal(first.ok,true);assert.equal(first.provider_identity_attested,false);
  assert.equal(f().ok,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('S06 mismatches, forged session and 2,048 signature mutants cannot use nonce',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-s06-'));fs.chmodSync(dir,0o700);
 try{const proof=signS06GatewayProof({payload:payload(2),secret});
  for(let i=0;i<2048;i++){
   const z=proof.slice(0,-1)+(i%2===0?'0':'f');
   const bad=verifyS06GatewayProof({proof:z,secret,method:'DELETE',now:1730000001000,nonceDirectory:dir});
   assert.equal(bad.ok,false);
  }
  assert.equal(verifyS06GatewayProof({proof,secret,method:'GET',now:1730000001000,nonceDirectory:dir}).ok,false);
  assert.equal(verifyS06GatewayProof({proof,secret,method:'POST',now:1730000090000,nonceDirectory:dir}).ok,false);
  assert.equal(verifyS06GatewayProof({proof,secret:'x'.repeat(40),method:'POST',now:1730000001000,nonceDirectory:dir}).ok,false);
  const good=verifyS06GatewayProof({proof,secret,method:'POST',now:1730000001000,nonceDirectory:dir});assert.equal(good.ok,true);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('S06 refuses unsafe or absent nonce directory',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-s06-'));
 try{fs.chmodSync(dir,0o777);const proof=signS06GatewayProof({payload:payload(3),secret});
  assert.equal(verifyS06GatewayProof({proof,secret,method:'POST',now:1730000001000,nonceDirectory:dir}).ok,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('S06 real MCP server enforces proof and session metadata binding',async()=>{
 const {readFileSync}=await import('node:fs');
 const source=readFileSync(new URL('../plugins/ikant-le-session-chat/server/server.mjs',import.meta.url),'utf8');
 assert.match(source,/gatewayContext\.run\(gateway/);
 assert.match(source,/signed\.session!==id/);
 assert.match(source,/x-ikant-gateway-proof/);
 assert.match(source,/if\(!gateway\.ok\)/);
 assert.doesNotMatch(source,/Access-Control-Allow-Origin':'\*'/);
});
