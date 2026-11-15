#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import readline from 'node:readline';
import {createC109ChatShell} from '../host/c109-chat-shell.mjs';
import {makeC92C107LanguagePort,inspectC92C107LanguageConfig} from '../host/c92-live-provider.mjs';
// STDIO host adapter: a SINGLE long-lived Node session, JSON frame per message.
// The externally installed host owns authentication, message identity and delivery.
const args=process.argv.slice(2);
if(![4,5].includes(args.length)||args[0]!=='--head'||args[2]!=='--ledger'||
 (args.length===5&&args[4]!=='--allow-synthetic')||
 !/^[a-f0-9]{40}$/.test(args[1])){process.stderr.write('C109_HEAD_AND_LEDGER_REQUIRED\n');process.exit(2);}
const head=args[1],ledger=args[3];
const conf=inspectC92C107LanguageConfig(process.env);
const languagePort=conf.configured?makeC92C107LanguagePort(process.env):undefined;
const shell=createC109ChatShell({sourceHead:head,ledgerFile:ledger,languagePort,
 allowSynthetic:args[4]==='--allow-synthetic'});
const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity,terminal:false});
for await(const line of rl){
 let reply;
 try{
  if(Buffer.byteLength(line,'utf8')>35000)throw Error('C109_FRAME_TOO_LARGE');
  const frame=JSON.parse(line);
  if(!frame||typeof frame!=='object'||Array.isArray(frame)||
   Object.keys(frame).some(k=>!['text','nonce','candidate','hostDraft'].includes(k)))throw Error('C109_FRAME_INVALID');
  // Host-owned nonce: ordinary chat callers send only their text. An explicit nonce is never silently rewritten.
  const ingress=Object.hasOwn(frame,'nonce')?frame:{...frame,nonce:crypto.randomUUID()};
  reply=await shell.send(ingress);
 }catch(e){reply={schema:'ikant-le-c109-chat-shell/v1',status:'C109_STOP',
  surface_a:null,surface_b:{first_unclosed_edge:String(e.message||e).slice(0,90)},
  active:false,native_delivery_attested:false};}
 process.stdout.write(JSON.stringify(reply)+'\n');
}
