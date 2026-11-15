/** Reproducible diagnostic preview only. No original C87 writer or ChatGPT app call. */
import {projectS05CILShell} from '../host/s05-cil-human-shell.mjs';
const r=projectS05CILShell({result:'PoC locale: sei sezioni stabili',host:'HOST_ONLY',edge:'PROVIDER_NATIVE_UI_NOT_ATTESTED',next:'STOP'});
if(!r.ok)process.exitCode=1;
else process.stdout.write(r.markdown+'\n');
