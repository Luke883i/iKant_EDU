import {sha256} from './contract.mjs';

export function nodeDispatchReceiptPure(input,state,{nodeVersion=process.versions.node,hostSurface='LOCAL_NODE_CHAT_HOST'}={}){
 const major=Number(String(nodeVersion).split('.')[0]);
 const material={schema:'ikant-le-node-dispatch/v1',epoch:state?.epoch||null,status_before:state?.status||null,input_sha256:sha256(Buffer.from(String(input))),node:String(nodeVersion),node_major:major,host_surface:String(hostSurface),node20_plus:Number.isInteger(major)&&major>=20,authority:0};
 return{...material,receipt_sha256:sha256(Buffer.from(JSON.stringify(material)))};
}
export function validateNodeDispatchReceipt(receipt,{input,epoch=null,statusBefore=null,hostSurface=null}={}){
 const e=[];if(!receipt||receipt.schema!=='ikant-le-node-dispatch/v1')e.push('schema');if(receipt?.authority!==0)e.push('authority');if(receipt?.node20_plus!==true||!Number.isInteger(receipt?.node_major)||receipt.node_major<20)e.push('node');
 if(receipt?.input_sha256!==sha256(Buffer.from(String(input))))e.push('input');if(epoch!==null&&receipt?.epoch!==epoch)e.push('epoch');if(statusBefore!==null&&receipt?.status_before!==statusBefore)e.push('status');if(hostSurface!==null&&receipt?.host_surface!==hostSurface)e.push('host_surface');
 const x=structuredClone(receipt||{});delete x.receipt_sha256;if(!/^[a-f0-9]{64}$/.test(String(receipt?.receipt_sha256||''))||sha256(Buffer.from(JSON.stringify(x)))!==receipt?.receipt_sha256)e.push('receipt_digest');
 return{ok:e.length===0,errors:[...new Set(e)]};
}
