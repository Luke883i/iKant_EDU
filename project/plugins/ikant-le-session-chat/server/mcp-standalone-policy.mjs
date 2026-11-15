/** MCP-external deployment policy. Not a C72 mode, C59 identity, or admission receipt. */
import {resolve,sep} from 'node:path';
import {readOAuthResourceConfig} from './oauth-resource-boundary.mjs';

export const PROFILE='standalone';
export const MAX_INPUT_BYTES=256*1024;
export const MAX_CONCURRENT_RUNTIME=8;

export function validateStandaloneProfile(env=process.env){
 if(env.IKANT_MCP_DEPLOYMENT_PROFILE!==PROFILE){
  if(env.IKANT_MCP_DEPLOYMENT_PROFILE)throw Error('MCP_DEPLOYMENT_PROFILE_INVALID');
  return Object.freeze({standalone:false,product_go:false});
 }
 if(env.IKANT_MCP_AUTH_MODE!=='oauth')throw Error('MCP_STANDALONE_OAUTH_REQUIRED');
 const c=readOAuthResourceConfig(env);
 const origin=env.IKANT_MCP_ALLOWED_ORIGIN||'https://chatgpt.com';
 if(origin!=='https://chatgpt.com')throw Error('MCP_STANDALONE_ORIGIN_INVALID');
 const port=Number(env.PORT||8788);
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('MCP_STANDALONE_PORT_INVALID');
 const disk=env.IKANT_MCP_PERSISTENCE_ROOT;
 const target=env.IKANT_LE_DEPLOYMENT_ROOT;
 if(!disk||!target||!resolve(target).startsWith(resolve(disk)+sep))
  throw Error('MCP_STANDALONE_PERSISTENCE_BOUNDARY');
 if(env.IKANT_ONESHELL_THREAD_PANEL==='1')throw Error('MCP_STANDALONE_UNATTESTED_NATIVE_UI');
 return Object.freeze({standalone:true,port,origin,resource:c.resource,
  issuer:c.issuer,requiredDiskRoot:resolve(disk),deploymentRoot:resolve(target),
  authMode:'oauth',product_go:false,native_event_attested:false});
}

export function evaluateRequestEnvelope({method,path,origin,contentType,contentLength}={}){
 if(path!=='/mcp')return Object.freeze({ok:false,status:404,reason:'MCP_PATH_INVALID'});
 if(!['POST','GET','DELETE'].includes(method))return Object.freeze({ok:false,status:405,reason:'MCP_METHOD_INVALID'});
 if(origin&&origin!=='https://chatgpt.com')return Object.freeze({ok:false,status:403,reason:'MCP_ORIGIN_INVALID'});
 if(method==='POST'&&(!/^application\/json(?:\s*;|$)/i.test(contentType||'')))
  return Object.freeze({ok:false,status:415,reason:'MCP_CONTENT_TYPE_INVALID'});
 const n=Number(contentLength);
 if(contentLength!==undefined&&contentLength!==null&&contentLength!==''&&
  (!Number.isSafeInteger(n)||n<0||n>MAX_INPUT_BYTES))
  return Object.freeze({ok:false,status:413,reason:'MCP_CONTENT_LENGTH_INVALID'});
 return Object.freeze({ok:true,status:200,reason:null});
}
