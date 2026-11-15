/** S06 HTTP transport gate; it authenticates a shared deployment key only.
 * It does NOT authenticate a provider session event, user or C59 ACTIVE receipt. */
import {createHash,timingSafeEqual} from 'node:crypto';
const hashed=x=>createHash('sha256').update(x).digest();
const configured=x=>typeof x==='string'&&x.length>=32&&x.length<=1024&&
 !/[\r\n\x00-\x1f\x7f]/u.test(x);
export function verifyS06Transport({authorization=null,origin=null,secret=null,allowedOrigin=null}={}){
 const no=reason=>Object.freeze({ok:false,status:'DENIED',reason,native_event_attested:false,active:false});
 if(!configured(secret)||typeof allowedOrigin!=='string'||
  !/^https:\/\/[a-z0-9][a-z0-9.-]*(?::\d{2,5})?$/i.test(allowedOrigin))
  return no('S06_SERVER_CREDENTIAL_OR_ORIGIN_UNCONFIGURED');
 if(origin!==null && origin!==allowedOrigin)return no('S06_ORIGIN_NOT_ALLOWED');
 if(typeof authorization!=='string'||!authorization.startsWith('Bearer '))
  return no('S06_BEARER_REQUIRED');
 const token=authorization.slice(7);
 if(!configured(token)||!timingSafeEqual(hashed(token),hashed(secret)))return no('S06_UNAUTHENTICATED');
 return Object.freeze({ok:true,status:'TRANSPORT_AUTHENTICATED_ONLY',native_event_attested:false,active:false});
}
