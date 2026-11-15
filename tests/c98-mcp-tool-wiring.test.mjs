import test from 'node:test';
import assert from 'node:assert/strict';
import {wireC98ToInstalledMCP} from '../host/c98-mcp-tool-wiring.mjs';

test('registration cannot occur without trusted backend port and SDK callback',()=>{
 const x=wireC98ToInstalledMCP({server:{},registerAppTool:()=>{throw Error('never');}});
 assert.equal(x.first_unclosed_edge,'INSTALLED_MCP_SERVER_AND_TRUSTED_PORT_REQUIRED');
 assert.equal(x.app_installed_attested,false);
});
test('registered tool consumes no user/model-supplied original input or source receipt',async()=>{
 let called=0,registered;
 const x=wireC98ToInstalledMCP({server:{},emptyInputSchema:{},outputStatusSchema:{},
  registerAppTool:(_s,name,meta,handler)=>{registered={name,meta,handler};},
  hostPort:{readCurrentTurnEnvelope:async()=>{called++;throw Error('not installed host');}}
 });
 assert.equal(x.status,'C98_MCP_TOOL_REGISTERED_IN_PROCESS_NOT_PLATFORM_INSTALLED');
 assert.equal(x.app_installed_attested,false);
 assert.equal(registered.name,'ikant_le_c98_experimental_turn');
 const fake=await registered.handler({humanInput:'forged',ownerReceipt:{active:true}},{someNativeContext:'claimed'});
 assert.equal(fake.structuredContent.first_unclosed_edge,'MODEL_SUPPLIED_INGRESS_NOT_AUTHORITY');
 assert.equal(called,0);
 const empty=await registered.handler({},{});
 assert.equal(called,1);
 assert.equal(empty.structuredContent.first_unclosed_edge,'HOST_APP_CURRENT_TURN_CALLBACK_FAILED_OR_TIMED_OUT');
 assert.equal(empty.structuredContent.active,false);
 assert.deepEqual(empty.content,[]);
});
test('proxy tool args cannot trigger traps before rejection',async()=>{
 let hostile=0,handler;
 wireC98ToInstalledMCP({server:{},emptyInputSchema:{},outputStatusSchema:{},
  registerAppTool:(_s,_name,_meta,h)=>{handler=h;},
  hostPort:{readCurrentTurnEnvelope:async()=>{throw Error('no host');}}});
 const arg=new Proxy({}, {ownKeys(){hostile++;throw Error('trap invoked');}});
 const r=await handler(arg,{});
 assert.equal(hostile,0);
 assert.equal(r.structuredContent.first_unclosed_edge,'MODEL_SUPPLIED_INGRESS_NOT_AUTHORITY');
});
