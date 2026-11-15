/** Synthetic HTTP transport probe with a local mock AS; NOT real ChatGPT/IdP linking. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {createServer as createHttpsServer} from 'node:https';
import {generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import net from 'node:net';
const ROOT=resolve(fileURLToPath(new URL('..',import.meta.url)));
function getFreePort(){return new Promise((ok,bad)=>{const n=net.createServer();n.once('error',bad);n.listen(0,'127.0.0.1',()=>{const p=n.address().port;n.close(()=>ok(p));});});}
function delay(ms){return new Promise(r=>setTimeout(r,ms));}
const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
async function startMockAuth(root){
 const cmd=spawnSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-keyout',join(root,'key.pem'),'-out',join(root,'cert.pem'),'-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost'],{encoding:'utf8'});
 if(cmd.status!==0)throw Error('TEST_OPENSSL_UNAVAILABLE '+cmd.stderr.slice(-200));
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const jwk={...publicKey.export({format:'jwk'}),kid:'mcp-test-kid',alg:'RS256',use:'sig'};
 const as=createHttpsServer({key:readFileSync(join(root,'key.pem')),cert:readFileSync(join(root,'cert.pem'))},(req,res)=>{
  if(req.url==='/jwks'){res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify({keys:[jwk]}));return;}
  res.writeHead(404).end('Not Found');
 });
 await new Promise(ok=>as.listen(0,'127.0.0.1',ok));
 const issuer='https://localhost:'+as.address().port+'/';
 function token(scope){const now=Math.floor(Date.now()/1000);const head=b64({alg:'RS256',kid:'mcp-test-kid',typ:'at+jwt'});
  const body=b64({iss:issuer,sub:'user-test',aud:'https://example.test/mcp',scope,iat:now-30,exp:now+600,token_use:'access'});
  const message=head+'.'+body;return message+'.'+sign('RSA-SHA256',Buffer.from(message),privateKey).toString('base64url');}
 return {as,issuer,token};
}
async function eventuallyHealthy(url,proc,stderr){
 for(let i=0;i<120;i++){
  if(proc.exitCode!==null)throw Error('MCP_EARLY_EXIT '+stderr().slice(-1800));
  try{const r=await fetch(url+'/healthz');if(r.status===200)return;}catch{}
  await delay(250);
 }
 throw Error('MCP_HTTP_START_TIMEOUT '+stderr().slice(-1200));
}
test('SDK HTTP: discovery, 401, initialize, tools/list and write-scope challenge via synthetic RS256 IdP', {timeout:120000}, async()=>{
 const tmp=mkdtempSync(join(tmpdir(),'mcp-http-e2e-'));let child,as;
 try{
  const mock=await startMockAuth(tmp);as=mock.as;
  const port=await getFreePort();
  const env={...process.env,PORT:String(port),NODE_ENV:'test',
   IKANT_MCP_DEPLOYMENT_PROFILE:'standalone',IKANT_MCP_AUTH_MODE:'oauth',
   IKANT_MCP_OAUTH_RESOURCE:'https://example.test/mcp',IKANT_MCP_OAUTH_ISSUER:mock.issuer,
   IKANT_MCP_OAUTH_JWKS_URL:mock.issuer+'jwks',IKANT_MCP_ALLOWED_ORIGIN:'https://chatgpt.com',
   IKANT_MCP_PERSISTENCE_ROOT:tmp,IKANT_LE_DEPLOYMENT_ROOT:join(tmp,'deployment'),
   IKANT_ONESHELL_THREAD_PANEL:'0',NODE_EXTRA_CA_CERTS:join(tmp,'cert.pem')};
  child=spawn(process.execPath,['plugins/ikant-le-session-chat/server/server.mjs'],{cwd:ROOT,env,stdio:['ignore','pipe','pipe']});
  let stderr='';child.stderr.on('data',b=>{stderr=(stderr+b.toString()).slice(-20000);});child.stdout.resume();
  const base='http://127.0.0.1:'+port;
  await eventuallyHealthy(base,child,()=>stderr);
  let r=await fetch(base+'/.well-known/oauth-protected-resource/mcp');assert.equal(r.status,200);
  const metadata=await r.json();assert.equal(metadata.resource,'https://example.test/mcp');
  const rpc=async(method,params,auth)=>fetch(base+'/mcp',{method:'POST',headers:{'content-type':'application/json','accept':'application/json, text/event-stream',
   'mcp-protocol-version':'2025-06-18',...(auth?{authorization:'Bearer '+auth}:{})},
   body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
  r=await rpc('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'synthetic-ci',version:'1.0'}});
  assert.equal(r.status,401);assert.match(r.headers.get('www-authenticate')||'',/resource_metadata=/);
  const read=mock.token('ikant:connect');
  r=await rpc('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'synthetic-ci',version:'1.0'}},read);
  const initBody=await r.text();assert.equal(r.status,200,'initialize HTTP '+r.status+': '+initBody.slice(0,600));
  const initialized=JSON.parse(initBody);assert.equal(initialized.jsonrpc,'2.0');
  r=await rpc('tools/list',{},read);
  const listBody=await r.text();assert.equal(r.status,200,'tools/list '+r.status+': '+listBody.slice(0,600));
  const listed=JSON.parse(listBody);const tools=listed.result?.tools||[];
  assert.ok(tools.some(x=>x.name==='ikant_le_open'),'real SDK should advertise open tool');
  assert.ok(tools.some(x=>x.name==='ikant_le_accept'),'real SDK should advertise consent tool');
  const accept=tools.find(x=>x.name==='ikant_le_accept');
  assert.equal(accept.annotations?.readOnlyHint,false);
  const limited=tools.find(x=>x.name==='ikant_le_limited_turn');
  assert.equal(limited.annotations?.idempotentHint,false);
  r=await rpc('tools/call',{name:'ikant_le_accept',arguments:{human_input:'I ACCEPT'}},read);
  const denyBody=await r.text();assert.equal(r.status,200,'scope challenge '+r.status+': '+denyBody.slice(0,600));
  const denied=JSON.parse(denyBody);assert.equal(denied.result?.isError,true);
  assert.match(JSON.stringify(denied),/mcp\/www_authenticate/);
 }finally{
  if(child){child.kill('SIGKILL');await delay(100);}
  if(as)await new Promise(ok=>as.close(ok));rmSync(tmp,{recursive:true,force:true});
 }
});
