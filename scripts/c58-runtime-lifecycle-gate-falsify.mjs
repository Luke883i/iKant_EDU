import crypto from 'node:crypto';
import {classifyLifecycleIntent,classifyPreactiveRoute} from '../src/contract.mjs';
import {compileIntentAwareFirstContact} from '../src/bootstrap-intent-adapter.mjs';
const arg=n=>{const i=process.argv.indexOf(n);return i>=0?process.argv[i+1]:null},CASES=Number(arg('--cases')||1000000);
let seed=0xC58A11CE>>>0;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed};
const starts=['avvia','attiva','inizializza','apri','start','open','activate','initialize'],exits=['chiudi','disattiva','exit','stop','release'],nouns=['iKant','iKant_LE','iKant LE','IKANT','i\u200bKant'],prefix=['','per favore ','please ','ora ','now '],pre=['','localmente ','locally ','in locale ','in questa sessione ','il ','the ','repo '],post=['',' ora',' now',' per favore',' please',' localmente',' in locale',' in questa sessione','.','!'],noise=['audit','analizza','spiega','bundle','test','documento','chat','PR 67','metaprompt','codice','forensic','artifact'];
const families=['START_OK','EXIT_OK','ESCI_OK','NEG','QUESTION','DOUBLE_Q','SINGLE_Q','BACKTICK','PAREN','MIX_AFTER','MIX_BEFORE','CONFLICT','REPEAT','REPO_ONLY','COLON','ONLY','BASTA','BARE','TYPO_TARGET','HOMOGLYPH'];
const counts=Object.fromEntries(families.map(x=>[x,0]));let intentMismatch=0,routeMismatch=0,nextMismatch=0,pendingMismatch=0;const samples=[];
function mk(i){const f=families[i%families.length],s=starts[rnd()%starts.length],e=exits[rnd()%exits.length],n=nouns[rnd()%nouns.length],h=noise[rnd()%noise.length];switch(f){
case'START_OK':return{f,input:prefix[rnd()%prefix.length]+s+' '+pre[rnd()%pre.length]+n+post[rnd()%post.length],kind:'ACTIVATE_IKANT',route:'IKANT_ADMISSION',next:'CANONICAL_PREACCEPT'};
case'EXIT_OK':return{f,input:prefix[rnd()%prefix.length]+e+' '+n+post[rnd()%post.length],kind:'EXIT_IKANT',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'ESCI_OK':return{f,input:prefix[rnd()%prefix.length]+'esci da '+n+post[rnd()%post.length],kind:'EXIT_IKANT',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'NEG':return{f,input:'non '+s+' '+n,kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'QUESTION':return{f,input:'puoi '+s+' '+n+'?',kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'DOUBLE_Q':return{f,input:'"'+s+' '+n+'"',kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'SINGLE_Q':return{f,input:"'"+s+' '+n+"'",kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'BACKTICK':return{f,input:'`'+s+' '+n+'`',kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'PAREN':return{f,input:'('+s+' '+n+')',kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'MIX_AFTER':return{f,input:s+' '+n+' e '+h+' '+noise[rnd()%noise.length],kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'MIX_BEFORE':return{f,input:h+', '+s+' '+n,kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'CONFLICT':return{f,input:s+' '+n+' e '+e+' '+n,kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'REPEAT':return{f,input:s+' '+n+' '+s+' '+n,kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'REPO_ONLY':return{f,input:h+' https://github.com/Luke883i/iKant_EDU',kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'COLON':return{f,input:'esempio: '+s+' '+n,kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'ONLY':return{f,input:s+' soltanto '+n,kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'BASTA':return{f,input:s+' '+n+' e basta',kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'BARE':return{f,input:n,kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
case'TYPO_TARGET':return{f,input:s+' iKnat',kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};
default:return{f,input:s+' іKant',kind:'OTHER',route:'HOST',next:'CANONICAL_PREACCEPT'};}}
for(let i=0;i<CASES;i++){const w=mk(i);counts[w.f]++;const k=classifyLifecycleIntent(w.input).kind,r=classifyPreactiveRoute(w.input).route,fc=compileIntentAwareFirstContact(w.input),n=fc.next.terminal,p=fc.next.pending_intent;if(k!==w.kind||r!==w.route||n!==w.next||p!==w.input){intentMismatch+=k!==w.kind;routeMismatch+=r!==w.route;nextMismatch+=n!==w.next;pendingMismatch+=p!==w.input;if(samples.length<20)samples.push({i,family:w.f,input:w.input,expected:[w.kind,w.route,w.next],actual:[k,r,n]});}}
const material={schema:'ikant-le-c58-runtime-lifecycle-gate-falsification/v3',seed:'0xC58A11CE',cases:CASES,families:families.length,family_counts:counts,intent_mismatches:intentMismatch,route_mismatches:routeMismatch,next_mismatches:nextMismatch,pending_intent_mismatches:pendingMismatch,samples,claim_boundary:{full_string_grammar:true,general_nlu_claimed:false,string_cases_are_not_physical_host_proof:true}};
const out={...material,status:intentMismatch===0&&routeMismatch===0&&nextMismatch===0&&pendingMismatch===0?'PASS':'FAIL',receipt_sha256:crypto.createHash('sha256').update(JSON.stringify(material)).digest('hex')};console.log(JSON.stringify(out,null,2));if(out.status!=='PASS')process.exitCode=1;
