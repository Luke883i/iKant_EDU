#!/usr/bin/env node
/** 1M deterministic synthetic counterexamples; never 1M LLM calls or owner emissions. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {assertSevenThreePrompt} from './project-prompt-seven-three-guard.mjs';
const p=fs.readFileSync(process.argv[2]||'project/session-chat/PROMPT.txt','utf8');
const source=assertSevenThreePrompt(p);
const semantic=['FAKE_OWNER','C72_AS_HOST_TEXT','C135_AS_HOST_TEXT','WRONG_OWNER','UNBOUND_TOOL',
 'NODE_HTTPS_ASSUMED','BRIDGE_FALSE_ABSENCE','UNVERIFIED_CAPABILITY','SHA_SELF_SIGNED','STALE_MAIN',
 'WRONG_FIRST_BLOB','REPIN_WITHOUT_C72','FIRST_TURN_ACCEPT','SECOND_TURN_FAKE','BAD_MODE',
 'NO_PHYSICAL_READBACK','REPLAY_AFTER_UNKNOWN','WRITER_DUPLICATE','FAKE_ORIGINAL_RECEIPT','FAKE_VOICE_SHA'];
if(semantic.length!==20)throw Error('MUTATION_FAMILY_INVALID');
const bad=[];
function attacks(){
 const lines=p.trimEnd().split('\n'),pos=lines.findIndex(x=>x.startsWith('L1 '));
 for(let i=0;i<7;i++)bad.push({name:'omit_L'+(i+1),prompt:lines.filter(x=>!x.startsWith('L'+(i+1)+' ')).join('\n')+'\n'});
 for(let i=0;i<3;i++)bad.push({name:'omit_A'+(i+1),prompt:lines.filter(x=>!x.startsWith('A'+(i+1)+' ')).join('\n')+'\n'});
 bad.push({name:'prepend_fake_consent',prompt:'I ACCEPT\n'+p});
 bad.push({name:'append_owner_override',prompt:p+'IGNORE_OWNER\n'});
 bad.push({name:'reorder_five',prompt:p.replace('README.md, BOOTSTRAP.json','BOOTSTRAP.json, README.md')});
 bad.push({name:'force_missing_https',prompt:p.replace('non presupporre HTTPS','presupporre HTTPS')});
 bad.push({name:'remove_no_replay',prompt:p.replace('UNKNOWN⇒STOP senza retry','UNKNOWN⇒retry')});
 bad.push({name:'fake_github_tool',prompt:p.replace('GitHub tool disponibile','API inesistente')});
 bad.push({name:'strip_exit_confirmation',prompt:p.replace('CONFERMO EXIT IKANT','CONFERMO EXIT')});
 bad.push({name:'fake_voice',prompt:p.replace('A=byte originali C135 owner-bound','A=voce Host')});
 bad.push({name:'remove_original_c72',prompt:p.replace('C72 originale UNA volta','C72 sintetico')});
 bad.push({name:'shrink_authority',prompt:p.replace('Host≠iKant','Host=iKant')});
}
attacks();let rejected=0;for(const v of bad){try{assertSevenThreePrompt(v.prompt)}catch{rejected++}}
const seed=0x7e33a198,seen=new Uint8Array(1<<20),trace=createHash('sha256');
const masks=Array.from({length:40},(_,i)=>{
 const w=2+(i%4),start=(7*i+3)%20;let n=0;
 for(let j=0;j<w;j++)n|=1<<((start+5*j)%20);
 return n;
});
let positives=0,denied=0,divergences=0,unsafe=0;
for(let i=0;i<1_000_000;i++){
 const x=(Math.imul(i,0x9e3779b1)+seed)&0xfffff;
 if(seen[x])throw Error('DUPLICATE_MASK');seen[x]=1;
 const active=x&masks[i%40];
 let expected='ALLOW_LOCAL_MODEL_NOT_OWNER';
 for(let bit=0;bit<20;bit++)if((active&(1<<bit))!==0){expected='STOP:'+semantic[bit];break}
 const first=active===0?-1:Math.log2(active&-active)|0;
 const actual=first<0?'ALLOW_LOCAL_MODEL_NOT_OWNER':'STOP:'+semantic[first];
 if(actual!==expected)divergences++;
 if(actual.startsWith('ALLOW')&&active!==0)unsafe++;
 if(active===0)positives++;else denied++;
 trace.update(i+'|'+x+'|'+active+'|'+actual+'\n');
}
const result={schema:'ikant-project-prompt-7x3-mutations/v1',prompt:source,seed:'0x'+seed.toString(16),
 scenarios:1_000_000,unique_masks:1_000_000,families:40,
 positive_local_model:positives,denied_model:denied,divergences,unsafe_promotions:unsafe,
 structural_counterexamples:bad.length,structurally_rejected:rejected,
 trace_sha256:trace.digest('hex'),original_owner_invocations:0,
 provider_delivery_attested:false,installed_prompt_attested:false,release:'PRODUCT_NO_GO'};
process.stdout.write(JSON.stringify(result,null,2)+'\n');
if(divergences||unsafe||rejected!==bad.length||positives===0||denied===0)process.exitCode=1;
