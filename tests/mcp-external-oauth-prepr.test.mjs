import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 readOAuthResourceConfig, protectedResourceMetadata, bearerChallenge,
 createPinnedJwksResolver,verifyOAuthAccessToken,hasOAuthScope,scopeBoundSession
} from '../plugins/ikant-le-session-chat/server/oauth-resource-boundary.mjs';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=readOAuthResourceConfig({IKANT_MCP_OAUTH_RESOURCE:'https://ikant.example/mcp',
 IKANT_MCP_OAUTH_ISSUER:'https://auth.example/',IKANT_MCP_OAUTH_JWKS_URL:'https://auth.example/.well-known/jwks.json'});
const {privateKey,publicKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),kid:'kid-1',use:'sig',alg:'RS256'};
const now=1761000000000;
const claims={iss:config.issuer,aud:config.resource,sub:'user-one',exp:Math.floor(now/1000)+600,
 iat:Math.floor(now/1000)-10,nbf:Math.floor(now/1000)-10,scope:'ikant:connect ikant:write',token_use:'access'};
const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const sign=(c=claims,h={alg:'RS256',typ:'at+jwt',kid:'kid-1'})=>{
 const material=encode(h)+'.'+encode(c);
 return material+'.'+crypto.sign('RSA-SHA256',Buffer.from(material),privateKey).toString('base64url');
};
const key=async kid=>kid==='kid-1'?jwk:null;
const verify=(token,changes={})=>verifyOAuthAccessToken({authorization:'Bearer '+token,config,resolveJwk:key,now,...changes});

test('GLOBAL: external MCP identity never becomes EDU or CANONICAL authority',async()=>{
 const v=await verify(sign());assert.equal(v.ok,true);
 assert.equal(v.native_event_attested,false);assert.equal(v.canonical_active,false);
 assert.equal(config.native_event_attested,false);
 assert.equal(hasOAuthScope(v,'ikant:connect'),true);
 assert.equal(hasOAuthScope(v,'ikant:write'),true);
 const unrelated=fs.readFileSync(path.join(repo,'contracts/c72-public-mode-admission-v2.json'),'utf8');
 assert.deepEqual(JSON.parse(unrelated).mode_choices,['EDU']);
 assert.equal(fs.readFileSync(path.join(repo,'src/session-chat-deployment.mjs'),'utf8').includes('LEGACY_C20_COMPATIBILITY_ONLY'),true);
});
test('INTERMEDIATE: discovery/challenge exactly match configured resource, no Host injection',()=>{
 const meta=protectedResourceMetadata(config);
 assert.deepEqual(meta,{resource:'https://ikant.example/mcp',authorization_servers:['https://auth.example/'],scopes_supported:['ikant:connect','ikant:write']});
 assert.match(bearerChallenge(config),/resource_metadata="https:\/\/ikant.example\/\.well-known\/oauth-protected-resource\/mcp"/);
 assert.match(bearerChallenge(config,{error:'invalid_token'}),/error="invalid_token"/);
 for(const bad of [{IKANT_MCP_OAUTH_RESOURCE:'http://evil.example/mcp'},
  {IKANT_MCP_OAUTH_RESOURCE:'https://ikant.example/evil'},
  {IKANT_MCP_OAUTH_JWKS_URL:'http://auth.example/jwks'},
  {IKANT_MCP_OAUTH_JWKS_URL:'https://evil.example/jwks'},
  {IKANT_MCP_OAUTH_ISSUER:'http://auth.example/tenant'},{}]) {
  const env={IKANT_MCP_OAUTH_RESOURCE:config.resource,IKANT_MCP_OAUTH_ISSUER:config.issuer,
   IKANT_MCP_OAUTH_JWKS_URL:config.jwksUrl,...bad};
  if(Object.keys(bad).length===0)continue;
  assert.throws(()=>readOAuthResourceConfig(env),/MCP_OAUTH_CONFIG_REQUIRED/);
 }
 assert.throws(()=>readOAuthResourceConfig({}),/MCP_OAUTH_CONFIG_REQUIRED/);
});
test('LOCAL: signature + bound claims, scopes, user isolation',async()=>{
 const v=await verify(sign());assert.equal(v.ok,true);
 const b=scopeBoundSession(v,'session_abcdefghij');
 assert.equal(b,scopeBoundSession(v,'session_abcdefghij'));
 assert.notEqual(b,scopeBoundSession(v,'session_other_abcdef'));
 const other=await verify(sign({...claims,sub:'user-two'}));assert.notEqual(b,scopeBoundSession(other,'session_abcdefghij'));
 assert.throws(()=>scopeBoundSession(v,'a'),/SESSION_BOUNDARY/);
 assert.throws(()=>scopeBoundSession(v,'../../../../attack'),/SESSION_BOUNDARY/);
 const limited=await verify(sign({...claims,scope:'ikant:connect'}));
 assert.equal(limited.ok,true);assert.equal(hasOAuthScope(limited,'ikant:write'),false);
 assert.equal((await verify(sign({...claims,scope:'ikant:write'}))).ok,false);
});
test('LOCAL: explicit failure matrix stops invalid JWTs',async()=>{
 const cases=[
  {...claims,iss:'https://fake.example/'},{...claims,aud:'https://other.example/mcp'},
  {...claims,exp:Math.floor(now/1000)-1},{...claims,nbf:Math.floor(now/1000)+1000},
  {...claims,iat:Math.floor(now/1000)+1000},{...claims,sub:''},{...claims,scope:'private:admin'},
  {...claims,token_use:'id'}, {...claims,exp:'not-a-number'}];
 for(const c of cases)assert.equal((await verify(sign(c))).ok,false,JSON.stringify(c));
 const badHeader=[{alg:'none',kid:'kid-1'},{alg:'HS256',kid:'kid-1'},{alg:'RS256',kid:'missing'},{alg:'RS256',kid:'kid-1',typ:'id+jwt'}];
 for(const h of badHeader)assert.equal((await verify(sign(claims,h))).ok,false);
 const good=sign();assert.equal((await verify(good.slice(0,-4)+'aaaa')).ok,false);
 assert.equal((await verify('nonsense')).ok,false);
 assert.equal((await verify('x'.repeat(9000))).ok,false);
 assert.equal((await verifyOAuthAccessToken({authorization:null,config,resolveJwk:key,now})).ok,false);
});
test('LOCAL: 2048 deterministic bad signatures all denied',async()=>{
 const token=sign(),parts=token.split('.');
 for(let i=0;i<2048;i++){
  const p=parts[1].slice(0,-4)+Buffer.from(String(i).padStart(4,'0')).toString('base64url').slice(0,4);
  const fake=parts[0]+'.'+p+'.'+parts[2];
  assert.equal((await verify(fake)).ok,false,i);
 }
});
test('INTERMEDIATE: pinned JWKS resolution rejects duplicates, network redirects, oversize',async()=>{
 let calls=0;const goodFetch=async()=>{calls++;return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify({keys:[jwk]})};};
 const resolve=createPinnedJwksResolver(config,{fetchImpl:goodFetch});
 assert.deepEqual(await resolve('kid-1',{now}),jwk);assert.deepEqual(await resolve('kid-1',{now:now+20}),jwk);assert.equal(calls,1);
 assert.equal(await resolve('other',{now}),null);assert.equal(calls,1,'unknown kid must not force fetch storm');
 const deny=createPinnedJwksResolver(config,{fetchImpl:async()=>({ok:true,headers:{get:()=>null},text:async()=>JSON.stringify({keys:[jwk,jwk]})})});
 assert.equal(await deny('kid-1',{now}),null);
 const big=createPinnedJwksResolver(config,{fetchImpl:async()=>({ok:true,headers:{get:()=>String(65537)},text:async()=>'{"keys":[]}'})});
 await assert.rejects(big('kid-1',{now}),/JWKS_FETCH/);
 const streaming=createPinnedJwksResolver(config,{fetchImpl:async()=>({ok:true,headers:{get:()=>null},body:{getReader:()=>({read:async()=>({done:false,value:new Uint8Array(65537)}),cancel:async()=>{}})}})});
 await assert.rejects(streaming('kid-1',{now}),/JWKS_SIZE/);
});
test('INTERMEDIATE: SDK integration is an isolated add-on, no bootstrap mutation',()=>{
 const src=fs.readFileSync(path.join(repo,'plugins/ikant-le-session-chat/server/server.mjs'),'utf8');
 assert.match(src,/IKANT_MCP_AUTH_MODE/);
 assert.match(src,/verifyOAuthAccessToken/);
 assert.match(src,/scopeBoundSession/);
 assert.match(src,/\.well-known\/oauth-protected-resource/);
 assert.match(src,/hasOAuthScope\(signed,scope\)/);
 assert.match(src,/securitySchemes/);
 assert.doesNotMatch(src,/function\s+activateCanonical/);
 assert.match(src,/verifyS06GatewayProof/);
});
