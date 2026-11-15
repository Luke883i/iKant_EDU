import {sha256} from './contract.mjs';

export function validateExecutedProvenanceReceipt(p,{runtimeRootSha256,expectedModules=[]}={}){
 const e=[];if(!p||p.schema!=='ikant-le-executed-provenance/v1')e.push('schema');if(p?.runtime_root_sha256!==runtimeRootSha256||!/^[a-f0-9]{64}$/.test(String(runtimeRootSha256||'')))e.push('runtime_root');if(p?.readback_verified!==true)e.push('readback');if(p?.relative_import_chain!==true)e.push('relative_import_chain');if(p?.authority!==0)e.push('authority');
 if(!Array.isArray(p?.modules)||!Array.isArray(expectedModules)||p?.modules?.length!==expectedModules.length)e.push('modules');else{const actual=new Map(p.modules.map(m=>[m?.path,m]));for(const x of expectedModules){const m=actual.get(x?.path);if(!m||m.blob_sha1!==x.blob_sha1||m.bytes!==x.bytes||!/^[a-f0-9]{40}$/.test(String(m?.blob_sha1||''))||!Number.isInteger(m?.bytes)||m.bytes<1)e.push('module:'+String(x?.path||''));}}
 const x=structuredClone(p||{});delete x.receipt_sha256;if(!/^[a-f0-9]{64}$/.test(String(p?.receipt_sha256||''))||sha256(Buffer.from(JSON.stringify(x)))!==p?.receipt_sha256)e.push('receipt_digest');
 return{ok:e.length===0,errors:[...new Set(e)],receipt_sha256:p?.receipt_sha256||null};
}
