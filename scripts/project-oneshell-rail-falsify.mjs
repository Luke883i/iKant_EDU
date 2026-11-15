#!/usr/bin/env node
/** 100000 distinct structural masks; not LLM calls or client UX tests. */
import {createHash} from 'node:crypto';
import {classifyPostAcceptRail,RAIL_PHASES} from '../host/project-oneshell-rail-core.mjs';
const H='a'.repeat(40),OTHER='b'.repeat(40),N=100000,SEED=20261028;
const fields=['originalAcceptance','originalIntroduction','originalEduSelection','verifiedSource','ownerReady','originalC125S03','independentC87Readback','sameTurnEvidence','originalPortableC87','workerLossWitness'];
let checked=0,permitted=0,rejected=0,errors=0;const trace=createHash('sha256');
for(let i=0;i<N;i++){
 const mask=(i^SEED)&0x1ffff;
 const phase=RAIL_PHASES[(mask>>11)%RAIL_PHASES.length];
 const x={phase,sourceHead:H,liveHead:(mask&(1<<10))?H:OTHER};
 fields.forEach((f,j)=>{x[f]=!!(mask&(1<<j));});
 const r=classifyPostAcceptRail(x);
 let expected=x.liveHead===H&&x.originalAcceptance&&x.originalIntroduction;
 if(phase!=='ACCEPTED')expected=expected&&x.originalEduSelection;
 if(!['ACCEPTED','EDU_SELECTED','SOURCE_HANDOFF','STOP'].includes(phase))expected=expected&&x.verifiedSource;
 if(!['ACCEPTED','EDU_SELECTED','SOURCE_HANDOFF','MATERIALIZED','STOP'].includes(phase))expected=expected&&x.ownerReady;
 if(['OWNER_TURN','RECOVERED_TURN'].includes(phase))expected=expected&&x.originalC125S03&&x.independentC87Readback&&x.sameTurnEvidence;
 if(phase==='RECOVERED_TURN')expected=expected&&x.originalPortableC87&&x.workerLossWitness;
 if(r.ok!==!!expected||r.active!==false||r.authority!==0||(!r.ok&&r.voice!=='NO_VOICE')||
    (r.ok&&['OWNER_TURN','RECOVERED_TURN'].includes(phase)!==(r.voice==='OWNER_ONLY')))errors++;
 checked++;r.ok?permitted++:rejected++;
 trace.update(`${i}:${mask}:${phase}:${r.ok?'P':'R'}:${r.ok?r.voice:r.edge}\n`);
}
const complete=Object.fromEntries(fields.map(f=>[f,true]));
for(const phase of RAIL_PHASES){const r=classifyPostAcceptRail({phase,sourceHead:H,liveHead:H,...complete});if(!r.ok)errors++;}
for(const phase of RAIL_PHASES){const r=classifyPostAcceptRail({phase,sourceHead:H,liveHead:OTHER,...complete});if(r.ok)errors++;}
const report={schema:'ikant-le-oneshell-rail-100k/v1',seed:SEED,mutations:checked,distinct_mutation_masks:checked,
 permitted,rejected,positive_cases:RAIL_PHASES.length,drift_negative_cases:RAIL_PHASES.length,
 errors,trace_sha256:trace.digest('hex'),model_calls:0,native_ui_attested:false,active:false,pass:errors===0};
process.stdout.write(JSON.stringify(report,null,2)+'\n');if(errors)process.exitCode=1;
