#!/usr/bin/env node
import fs from 'node:fs';
import {makeC92C107LanguagePort,inspectC92C107LanguageConfig}
 from '../host/c92-live-provider.mjs';
import {executeC108} from '../host/c108-host-matrix.mjs';
// One-shot host control frame: REAL model call only with supplied host-side
// credentials, C72 receipt, explicit opt-in and physically mounted C87 ledger.
// No ChatGPT native hook, source origin or model entitlement is invented.
const stop=edge=>({schema:'ikant-le-c108-live-turn/v1',status:'C108_LIVE_STOP',
 first_unclosed_edge:edge,active:false,native_delivery_attested:false,
 model_provider_origin_attested:false});
try{
 const bytes=fs.readFileSync(0);
 if(bytes.length>35000)throw Error('FRAME_OVERSIZE');
 const frame=JSON.parse(bytes.toString('utf8'));
 if(!frame||Object.getPrototypeOf(frame)!==Object.prototype||
  Object.keys(frame).some(k=>!['request','nonce','ledgerFile','priorMessages',
   'resetContext'].includes(k)))throw Error('INVALID_FRAME');
 if(!inspectC92C107LanguageConfig(process.env).configured)
  throw Error('HOST_MODEL_CREDENTIALS_NOT_INSTALLED');
 const languagePort=makeC92C107LanguagePort(process.env);
 const r=await executeC108({...frame,prefer:'DIRECT',languagePort});
 if(r.status!=='C108_LOCAL_RUNTIME_REOPENED_NOT_NATIVE')
  process.stdout.write(JSON.stringify(stop(r.first_unclosed_edge||'RUNTIME_REJECTED'))+'\n');
 else process.stdout.write(JSON.stringify(r)+'\n');
}catch(e){process.stdout.write(JSON.stringify(stop(String(e.message||e).slice(0,96)))+'\n');
 process.exitCode=2;}
