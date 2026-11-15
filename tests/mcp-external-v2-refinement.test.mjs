import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 readOAuthResourceConfig,bearerChallenge,createPinnedJwksResolver,
 verifyOAuthAccessToken,oauthWriteScopeFailure,scopeBoundSession
} from '../plugins/ikant-le-session-chat/server/oauth-resource-boundary.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=readOAuthResourceConfig({IKANT_MCP_OAUTH_RESOURCE:'https://app.example/mcp',
 IKANT_MCP_OAUTH_ISSUER:'https://login.example/tenant/v2.0',
 IKANT_MCP_OAUTH_JWKS_URL:'https://login.example/tenant/keys'});
const {privateKey,publicKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
const jwk={...publicKey.export({format:'jwk'}),use:'sig',kid:'A',alg:'RS256'};
const ts=1_790_000_000_000;
const claims={iss:config.issuer,aud:config.resource,sub:'user-account-a',iat:Math.floor(ts/1000)-50,
 exp:Math.floor(ts/1000)+600,scope:'ikant:connect',token_use:'access'};
const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
function sign(payload=claims,header={alg:'RS256',kid:'A',typ:'at+jwt'}){
 const s=enc(header)+'.'+enc(payload);return s+'.'+crypto.sign('RSA-SHA256',Buffer.from(s),privateKey).toString('base64url');
}
const resolve=async kid=>kid==='A'?jwk:null;
const verify=token=>verifyOAuthAccessToken({authorization:'Bearer '+token,config,resolveJwk:resolve,now:ts});

test('G: two chat modes remain independent of the third external MCP distribution',()=>{
 const orig=JSON.parse(fs.readFileSync(path.join(root,'contracts/c72-public-mode-admission-v2.json'),'utf8'));
 assert.deepEqual(orig.mode_choices,['EDU']);
 const server=fs.readFileSync(path.join(root,'plugins/ikant-le-session-chat/server/server.mjs'),'utf8');
 assert.match(server,/IKANT_MCP_AUTH_MODE/);
 assert.match(server,/LEGACY.*compatibility/i);
 assert.doesNotMatch(server,/selectC72V2Mode\(/);
 const c59=fs.readFileSync(path.join(root,'docs/C59_SINGLE_COMPOSITION_CHANNEL.md'),'utf8');
 assert.match(c59,/excluded/i);
});
test('I: issuer with path is accepted and compared EXACTLY as configured',async()=>{
 assert.equal(config.issuer,'https://login.example/tenant/v2.0');
 assert.equal((await verify(sign())).ok,true);
 assert.equal((await verify(sign({...claims,iss:'https://login.example/tenant/v2.0/'}))).ok,false);
 assert.throws(()=>readOAuthResourceConfig({IKANT_MCP_OAUTH_RESOURCE:'https://app.example/mcp',
  IKANT_MCP_OAUTH_ISSUER:'https://login.example/tenant/v2.0',
  IKANT_MCP_OAUTH_JWKS_URL:'https://evil.example/keys'}),/MCP_OAUTH_CONFIG_REQUIRED/);
});
test('I: write requires scoped token and returns challenge in ChatGPT MCP tool result, never owner voice',async()=>{
 const read=await verify(sign());assert.equal(read.ok,true);
 const denied=oauthWriteScopeFailure(read,config);
 assert.equal(denied.isError,true);
 assert.ok(Array.isArray(denied._meta['mcp/www_authenticate']));
 assert.match(denied._meta['mcp/www_authenticate'][0],/error="insufficient_scope"/);
 assert.match(denied._meta['mcp/www_authenticate'][0],/error_description=/);
 assert.match(denied._meta['mcp/www_authenticate'][0],/scope="ikant:connect ikant:write"/);
 assert.equal(denied.structuredContent,undefined);
 assert.equal(denied.active,undefined);
 const write=await verify(sign({...claims,scope:'ikant:connect ikant:write'}));
 assert.equal(oauthWriteScopeFailure(write,config),null);
 assert.throws(()=>bearerChallenge(config,{errorDescription:'bad\r\nInjected: true'}),/UNSAFE_CHALLENGE/);
 const server=fs.readFileSync(path.join(root,'plugins/ikant-le-session-chat/server/server.mjs'),'utf8');
 assert.equal((server.match(/withWriteScope\(async/g)||[]).length,5);
 assert.match(server,/if\(denied\)return denied/);
});
test('I: 100 concurrent JWKS resolutions cause ONE controlled fetch, never storms',async()=>{
 let requests=0;
 const fetchImpl=async()=>{requests++;await new Promise(r=>setImmediate(r));return {ok:true,
  headers:{get:()=>null},text:async()=>JSON.stringify({keys:[jwk]})};};
 const r=createPinnedJwksResolver(config,{fetchImpl,ttlMs:1000});
 const keys=await Promise.all(Array.from({length:100},()=>r('A',{now:ts})));
 assert.equal(requests,1);assert.ok(keys.every(k=>k.kid==='A'));
 const misses=await Promise.all(Array.from({length:100},()=>r('missing',{now:ts+10})));
 assert.equal(requests,1);assert.ok(misses.every(x=>x===null));
 await r('A',{now:ts+1001});assert.equal(requests,2);
 assert.throws(()=>createPinnedJwksResolver(config,{ttlMs:0}),/JWKS_TTL_INVALID/);
});
test('L: reject JOSE critical/b64 extension even when issuer signs the token',async()=>{
 const attacks=[{alg:'RS256',kid:'A',crit:['unknown']},{alg:'RS256',kid:'A',b64:false}];
 for(const h of attacks){const t=sign(claims,h);assert.equal((await verify(t)).ok,false);}
});
test('L: replay/unknown send and native-source claims must remain prohibited by policy',()=>{
 const contract=JSON.parse(fs.readFileSync(path.join(root,'contracts/mcp-external-prepr-e2e.json'),'utf8'));
 assert.equal(contract.mcp_is_bootstrap_mode,false);
 assert.equal(contract.eduv2_requires_mcp,false);
 assert.equal(contract.canonical_native_activation_from_mcp,false);
 assert.equal(contract.unknown_send,'STOP_RECONCILE_NO_BLIND_RETRY');
 assert.notEqual(scopeBoundSession({ok:true,principal:{issuer:'x',sub:'tenant-a',scopes:['ikant:connect']}},'session_000001'),
 scopeBoundSession({ok:true,principal:{issuer:'x',sub:'tenant-b',scopes:['ikant:connect']}},'session_000001'));
});
