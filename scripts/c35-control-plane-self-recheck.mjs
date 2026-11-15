import {repositorySelfRecheck} from '../src/control-plane-ownership.mjs';const r=repositorySelfRecheck();process.stdout.write(JSON.stringify(r)+'\n');if(r.status!=='PASS')process.exitCode=1;
