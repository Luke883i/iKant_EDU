#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {verifyLocalProjectSource} from './project-repo-loader.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
try{
 const [head,tree,selectionPath,eduLedgerFile]=process.argv.slice(2);
 verifyLocalProjectSource(root,{head,tree});
 const {validateC72V2ModeSelection}=await import('../host/c72-public-mode-admission.mjs');
 const selection=selectionPath?JSON.parse(fs.readFileSync(selectionPath,'utf8')):null;
 if(!validateC72V2ModeSelection(selection,{sourceHead:head}))throw Error('PROJECT_CURRENT_C72_SELECTION_REQUIRED');
 // Verify before importing original runtime modules. Dashboard never dispatches a human turn.
 const {reopenProjectSession}=await import('../host/project-session-capsule.mjs');
 console.log(JSON.stringify(reopenProjectSession({source:{head,tree},admission:selection,eduLedgerFile:eduLedgerFile??null})));
}catch(e){console.log(JSON.stringify({ok:false,active:false,voice:'NO_VOICE',first_open_edge:e.message,next:'STOP',authority:0}));process.exitCode=1;}
