#!/usr/bin/env node
import crypto from 'node:crypto';
import readline from 'node:readline';
import {createC111HostEdge} from '../host/c111-host-edge.mjs';
import {inspectC92C107LanguageConfig,makeC92C107LanguagePort} from '../host/c92-live-provider.mjs';
const a=process.argv.slice(2);
if(![4,5].includes(a.length)||a[0]!=='--head'||a[2]!=='--ledger'||
 !/^[a-f0-9]{40}$/.test(a[1])||(a.length===5&&a[4]!=='--allow-synthetic')){
 process.stderr.write('C111_HOST_PIN_OR_LEDGER_REQUIRED\n');process.exit(2);
}
const c=inspectC92C107LanguageConfig(process.env);
const edge=createC111HostEdge({sourceHead:a[1],ledgerFile:a[3],
 languagePort:c.configured?makeC92C107LanguagePort(process.env):undefined,
 allowSynthetic:a.includes('--allow-synthetic')});
for await(const line of readline.createInterface({input:process.stdin,crlfDelay:Infinity,terminal:false})){
 let receipt;
 try{if(Buffer.byteLength(line,'utf8')>35000)throw Error('FRAME_SIZE');
  receipt=await edge.dispatch(JSON.parse(line));
 }catch{receipt={schema:'ikant-le-c111-host-edge/v1',status:'C111_STOP',
  surface_a:null,surface_b:{first_unclosed_edge:'C111_INVALID_FRAME_OR_LOCAL_FAILURE'},
  native_delivery_attested:false,active:false};}
 process.stdout.write(JSON.stringify(receipt)+'\n');
}
