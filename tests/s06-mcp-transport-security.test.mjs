import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {verifyS06Transport} from '../plugins/ikant-le-session-chat/server/transport-security.mjs';
const secret='my_very_long_cryptographically_random_key_123456';const allowedOrigin='https://chatgpt.com';
const good={authorization:'Bearer '+secret,origin:allowedOrigin,secret,allowedOrigin};
test('S06 configured transport credential, fail closed, not native event identity',()=>{
 const r=verifyS06Transport(good);assert.equal(r.ok,true);assert.equal(r.active,false);assert.equal(r.native_event_attested,false);
 for(const change of [{secret:null},{allowedOrigin:null},{authorization:null},{authorization:'Bearer wrong_wrong_wrong_wrong_wrong_wrong_w'},{origin:'https://evil.example'},{authorization:'Basic '+secret}])
  assert.equal(verifyS06Transport({...good,...change}).ok,false);
});
test('S06 server actually invokes guard and avoids wildcard CORS on /mcp',()=>{
 const src=readFileSync(new URL('../plugins/ikant-le-session-chat/server/server.mjs',import.meta.url),'utf8');
 assert.match(src,/verifyS06Transport\(/);assert.doesNotMatch(src,/Access-Control-Allow-Origin':'\*'/);
 assert.match(src,/req\.headers\.authorization/);
});
test('S06 2048 altered tokens or untrusted origins rejected',()=>{
 for(let i=0;i<2048;i++){
  const r=verifyS06Transport({...good,authorization:'Bearer '+secret+i,origin:i%2?'https://other.invalid':allowedOrigin});
  assert.equal(r.ok,false);
 }
});
