/** External MCP resource-server boundary; NOT an iKant EDU/CANONICAL admission mode.
 * The Authorization Server is a separately configured, real OAuth/PKCE provider.
 * No model metadata or local HMAC is promoted to native ChatGPT event identity.
 */
import {createHash,createPublicKey,verify as verifySignature} from 'node:crypto';

const MAX_JWT_BYTES=8192, MAX_JWKS_BYTES=65536;
const https = s => {try {const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&!u.search;}catch{return false;}};
const safeString=s=>typeof s==='string'&&s.length>0&&s.length<=2048;
const sha=s=>createHash('sha256').update(s,'utf8').digest('hex');
const refusal=(reason)=>Object.freeze({ok:false,reason,native_event_attested:false,canonical_active:false});
async function boundedBody(response){
 const reader=response.body?.getReader?.();
 if(!reader){const t=await response.text();if(Buffer.byteLength(t)>MAX_JWKS_BYTES)throw Error('JWKS_SIZE');return t;}
 const chunks=[];let n=0;
 for(;;){const {done,value}=await reader.read();if(done)break;
  n+=value.byteLength;if(n>MAX_JWKS_BYTES){await reader.cancel();throw Error('JWKS_SIZE');}
  chunks.push(Buffer.from(value));}
 return Buffer.concat(chunks,n).toString('utf8');
}

export function readOAuthResourceConfig(env=process.env){
 const resource=env.IKANT_MCP_OAUTH_RESOURCE;
 const issuer=env.IKANT_MCP_OAUTH_ISSUER;
 const jwksUrl=env.IKANT_MCP_OAUTH_JWKS_URL;
 const scopes=['ikant:connect','ikant:write'];
 if(![resource,issuer,jwksUrl].every(https)||new URL(resource).pathname!=='/mcp'||
   new URL(resource).origin!==resource.slice(0,-4)||
   new URL(jwksUrl).origin!==new URL(issuer).origin||
   !safeString(issuer))throw Error('MCP_OAUTH_CONFIG_REQUIRED');
 return Object.freeze({resource,issuer,jwksUrl,scopes,metadataUrl:new URL('/.well-known/oauth-protected-resource/mcp',resource).href,
  native_event_attested:false,canonical_active:false});
}
export function protectedResourceMetadata(c){return Object.freeze({resource:c.resource,authorization_servers:[c.issuer],scopes_supported:c.scopes});}
export function bearerChallenge(c,{error=null,scope='ikant:connect',errorDescription=null}={}){
 const pieces=[`resource_metadata="${c.metadataUrl}"`,`scope="${scope}"`];
 if(error)pieces.push(`error="${error}"`);
 if(errorDescription){if(typeof errorDescription!=='string'||!/^[A-Za-z0-9 :.,_-]{1,128}$/.test(errorDescription))throw Error('MCP_OAUTH_UNSAFE_CHALLENGE');
  pieces.push(`error_description="${errorDescription}"`);}
 return 'Bearer '+pieces.join(', ');
}
function parsePart(s){if(typeof s!=='string'||s.length>MAX_JWT_BYTES||!/^[A-Za-z0-9_-]+$/.test(s))throw Error('JWT_SHAPE');
 const b=Buffer.from(s,'base64url');if(b.toString('base64url')!==s)throw Error('JWT_ENCODING');
 const v=JSON.parse(b.toString('utf8'));if(!v||typeof v!=='object'||Array.isArray(v))throw Error('JWT_OBJECT');return v;}
export function createPinnedJwksResolver(c,{fetchImpl=fetch,ttlMs=300000}={}){
 if(!Number.isSafeInteger(ttlMs)||ttlMs<1000||ttlMs>3600000)throw Error('JWKS_TTL_INVALID');
 let cache=null,expires=0,inflight=null;
 async function reload(now){
  const ac=new AbortController();const timeout=setTimeout(()=>ac.abort(),5000);
  try{
   const res=await fetchImpl(c.jwksUrl,{redirect:'error',signal:ac.signal,headers:{accept:'application/json'}});
   if(!res.ok||Number(res.headers?.get?.('content-length')||0)>MAX_JWKS_BYTES)throw Error('JWKS_FETCH');
   const raw=await boundedBody(res);
   const body=JSON.parse(raw);if(!Array.isArray(body.keys)||body.keys.length>32)throw Error('JWKS_SHAPE');
   cache=body;expires=now+ttlMs;
  }finally{clearTimeout(timeout);}
 }
 return async function resolve(kid,{now=Date.now()}={}){
  if(!safeString(kid)||kid.length>128)return null;
  // Unknown kid never triggers unbounded refresh storms; wait for bounded TTL.
  if(!cache||now>=expires){
   if(!inflight)inflight=reload(now).finally(()=>{inflight=null;});
   await inflight;
  }
  const keys=cache.keys.filter(k=>k.kid===kid&&k.kty==='RSA'&&
   (!k.use||k.use==='sig')&&(!k.alg||k.alg==='RS256')&&
   (!k.key_ops||k.key_ops.includes('verify')));
  return keys.length===1?keys[0]:null;
 };
}
/** RS256 JWT access-token validation, intentionally narrow: opaque tokens and other
 * algorithms need a separately tested introspection/JWT adapter, never fallback.
 */
export async function verifyOAuthAccessToken({authorization,config,resolveJwk,now=Date.now()}={}){
 if(!config||typeof resolveJwk!=='function'||!Number.isFinite(now)||
   typeof authorization!=='string'||!/^Bearer [A-Za-z0-9_.-]+$/.test(authorization)||
   Buffer.byteLength(authorization)>MAX_JWT_BYTES)return refusal('MCP_OAUTH_BEARER_MISSING_OR_INVALID');
 try{
  const jwt=authorization.slice(7),parts=jwt.split('.');if(parts.length!==3)return refusal('MCP_OAUTH_JWT_SHAPE');
  const h=parsePart(parts[0]),p=parsePart(parts[1]);
  if(h.alg!=='RS256'||h.crit!==undefined||h.b64!==undefined||!safeString(h.kid)||h.kid.length>128||
    (h.typ&&h.typ!=='JWT'&&h.typ!=='at+jwt'))return refusal('MCP_OAUTH_JWT_HEADER');
  const k=await resolveJwk(h.kid,{now});if(!k)return refusal('MCP_OAUTH_SIGNING_KEY_UNKNOWN');
  const sig=Buffer.from(parts[2],'base64url');
  if(sig.toString('base64url')!==parts[2]||!verifySignature('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),createPublicKey({key:k,format:'jwk'}),sig))
   return refusal('MCP_OAUTH_INVALID_SIGNATURE');
  const seconds=Math.floor(now/1000);
  if(p.iss!==config.issuer||!(p.aud===config.resource||Array.isArray(p.aud)&&p.aud.includes(config.resource))||
     !safeString(p.sub)||p.sub.length>256||!Number.isInteger(p.exp)||p.exp<=seconds||
     !Number.isInteger(p.iat)||p.iat>seconds+30||p.exp<=p.iat||
     (p.nbf!==undefined&&(!Number.isInteger(p.nbf)||p.nbf>seconds))||
     (p.token_use!==undefined&&p.token_use!=='access'))return refusal('MCP_OAUTH_CLAIMS_INVALID');
  const scopes=typeof p.scope==='string'?p.scope.trim().split(/\s+/u):[];
  if(!scopes.includes('ikant:connect'))return refusal('MCP_OAUTH_SCOPE_MISSING');
  return Object.freeze({ok:true,principal:Object.freeze({issuer:p.iss,sub:p.sub,scopes:Object.freeze(scopes)}),
    native_event_attested:false,canonical_active:false});
 }catch{return refusal('MCP_OAUTH_VERIFICATION_FAILED');}
}
export function hasOAuthScope(auth,scope){return auth?.ok===true&&Array.isArray(auth.principal?.scopes)&&auth.principal.scopes.includes(scope);}
export function scopeBoundSession(auth,sessionHint){
 if(!hasOAuthScope(auth,'ikant:connect')||typeof sessionHint!=='string'||sessionHint.length<8||
    sessionHint.length>256||!/^[A-Za-z0-9_.:-]+$/.test(sessionHint))throw Error('MCP_OAUTH_SESSION_BOUNDARY');
 // Token-derived user identity is authenticated; sessionHint is NOT a signed
 // provider event identifier. The namespace prevents cross-user collisions.
 return 'oauth-'+sha(JSON.stringify([auth.principal.issuer,auth.principal.sub,sessionHint])).slice(0,48);
}

// A scope failure must be observable as an MCP tool result; do not spawn the
// original writer and never interpret OAuth as a ChatGPT-native event receipt.
export function oauthWriteScopeFailure(auth,config){
 if(hasOAuthScope(auth,'ikant:write'))return null;
 return Object.freeze({isError:true,
  content:[{type:'text',text:'Authorization required for a write action.'}],
  _meta:{'mcp/www_authenticate':[bearerChallenge(config,{error:'insufficient_scope',
   scope:'ikant:connect ikant:write',errorDescription:'This action requires ikant:write authorization'})]}});
}
