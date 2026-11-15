import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createHash} from 'node:crypto';
import {oneShellFrame} from '../host/project-oneshell-edu.mjs';
import {materializeOneShellFocusApp} from '../host/project-oneshell-focus-app.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const dir=()=>{const x=fs.mkdtempSync(path.join(os.tmpdir(),'ikant-focus-'));fs.chmodSync(x,0o700);return x;};
const frame=()=>oneShellFrame({esito:'EDU_READY',b:'Valore umano: controllo, contestazione e tracciabilita.',prova:'HEAD abc; owner originale, C87 count 0 <script>alert(1)</script>',edge:'FIRST_UNCLOSED',next:'AWAIT_HUMAN_INPUT'});
test('six original slots, voice focus, exact verified logo and two separators; report readback',()=>{
 const d=dir();try{const f=frame(),r=materializeOneShellFocusApp({frame:f,outputDirectory:d});
 assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.focus_slot,'A');assert.equal(r.voice_origin,'NO_VOICE');
 const html=fs.readFileSync(r.app_path,'utf8');
 assert.equal((html.match(/class="ikant-row" data-slot=/g)||[]).length,6);
 assert.equal((html.match(/class="ikant-brand-mark"/g)||[]).length,1);
 assert.equal((html.match(/class="ikant-divider"/g)||[]).length,2);
 assert.match(html,/grid-template-columns:minmax\(0,2.15fr\)/);
 assert.match(html,/Scarica oneshell-rapporto.txt/);
 assert.match(html,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
 assert(!html.includes('<script>alert(1)</script>'));assert(!html.includes('<button'));
 assert.equal(hash(fs.readFileSync(r.report_path)),r.report_sha256);
 assert.equal(hash(fs.readFileSync(r.app_path)),r.app_sha256);
 const report=fs.readFileSync(r.report_path,'utf8');
 for(const key of r.machine_order)assert(report.includes('=== '+key+' ===\n'+f.slots[key]));
 assert.equal(r.native_ui_attested,false);assert.equal(r.persistent_ui_attested,false);
 }finally{fs.rmSync(d,{recursive:true,force:true})}
});
test('fabricated owner voice, destination overwrite and unverified attachment fail closed',()=>{
 const d=dir();try{const f=frame(),bad={...f,slots:{...f.slots,A:'Io sono iKant'},voice_origin:'HOST_BOUND_LOCAL',original_voice_sha256:'f'.repeat(64)};
 assert.equal(materializeOneShellFocusApp({frame:bad,outputDirectory:d}).ok,false);
 const first=materializeOneShellFocusApp({frame:f,outputDirectory:d});assert.equal(first.ok,true);
 const again=materializeOneShellFocusApp({frame:f,outputDirectory:d});assert.equal(again.ok,false);assert.equal(again.voice,'NO_VOICE');
 fs.writeFileSync(path.join(d,'evidence.txt'),'test',{mode:0o600});
 const changed=materializeOneShellFocusApp({frame:f,outputDirectory:d,reportName:'changed',attachments:[{name:'evidence.txt',path:path.join(d,'evidence.txt'),sha256:'0'.repeat(64)}]});
 assert.equal(changed.ok,false);assert(!fs.existsSync(path.join(d,'changed.html')));
 }finally{fs.rmSync(d,{recursive:true,force:true})}
});
test('verified in-root attachment embeds same bytes; path escape and symlink denied',()=>{
 const d=dir(),other=dir();try{const bytes=Buffer.from('Riscontro umano verificabile');const file=path.join(d,'proof.txt');
 fs.writeFileSync(file,bytes,{mode:0o600});
 const r=materializeOneShellFocusApp({frame:frame(),outputDirectory:d,reportName:'with-proof',attachments:[{name:'proof.txt',path:file,sha256:hash(bytes)}]});
 assert.equal(r.ok,true,JSON.stringify(r));assert(fs.readFileSync(r.app_path,'utf8').includes(bytes.toString('base64')));
 assert.equal(materializeOneShellFocusApp({frame:frame(),outputDirectory:d,reportName:'escape',attachments:[{name:'evil.txt',path:path.join(other,'evil.txt'),sha256:hash(bytes)}]}).ok,false);
 fs.symlinkSync(file,path.join(d,'linked'));
 assert.equal(materializeOneShellFocusApp({frame:frame(),outputDirectory:d,reportName:'symlink',attachments:[{name:'linked',path:path.join(d,'linked'),sha256:hash(bytes)}]}).ok,false);
 }finally{fs.rmSync(d,{recursive:true,force:true});fs.rmSync(other,{recursive:true,force:true})}
});
