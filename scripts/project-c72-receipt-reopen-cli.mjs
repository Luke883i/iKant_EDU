#!/usr/bin/env node
/** Read-only C72 receipt reentry; no owner execution or native event claim. */
import {reopenC72Transit} from '../host/project-c72-receipt-transit.mjs';
let input='';
try{
 for await(const b of process.stdin){input+=b.toString('utf8');if(Buffer.byteLength(input)>16000)throw Error('C72_TRANSIT_REQUEST_BOUNDS');}
 const q=JSON.parse(input);
 if(Object.keys(q).sort().join(',')!=='directory,sourceHead')throw Error('C72_TRANSIT_REQUEST_INVALID');
 const r=reopenC72Transit(q);
 process.stdout.write(JSON.stringify(r)+'\n');if(!r.ok)process.exitCode=2;
}catch{process.stdout.write(JSON.stringify({ok:false,edge:'C72_TRANSIT_READ_UNKNOWN',active:false,authority:0})+'\n');process.exitCode=2;}
