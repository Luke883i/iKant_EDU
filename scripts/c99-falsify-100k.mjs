// Actually executes 100,000 deterministic mutation cases against the wired C98/C99 runtime gates.
// Finitely modeled user/host boundary only; zero real independent ChatGPT sessions.
import {gateC99ExperimentalEntry,gateC99SourceHandoff} from '../host/c99-route-policy.mjs';
import {preflightC98ChatGPTOffline} from '../host/c98-chatgpt-offline-boundary.mjs';
const head='a'.repeat(40),sel={selected_mode:'EXPERIMENTAL',status:'EXPERIMENTAL_SELECTED_NOT_RUNNING'};
const carrier=()=>{throw Error('CALLBACK_WAS_RUN')};
let invoked=0,mismatch=0,unsafe=0,accessors=0;const counts={};
for(let i=0;i<100000;i++){
 const x={sourceHead:head,selection:sel,humanInput:'human input '+i,readC77Archive:carrier};
 let expected='C99_CALLBACK_SHAPE_ONLY_NOT_AUTHENTICATED';
 const axis=i%20;
 switch(axis){
 case 0:delete x.readC77Archive;expected='C99_STOP';break;
 case 1:x.readC77Member=carrier;expected='C99_STOP';break;
 case 2:x.nodeGithubNetworkRequested=true;expected='C99_STOP';break;
 case 3:x.sourceHead='x';expected='C99_STOP';break;
 case 4:x.humanInput='';expected='C99_STOP';break;
 case 5:x.humanInput='x'.repeat(601);expected='C99_STOP';break;
 case 6:x.humanInput='\ud800';expected='C99_STOP';break;
 case 7:x.selection={...sel,status:'ACTIVE'};expected='C99_STOP';break;
 case 8:x.selection={...sel,selected_mode:'CANONICAL'};expected='C99_STOP';break;
 case 9:x.selection=null;expected='C99_STOP';break;
 case 10:{const p={status:sel.status};Object.defineProperty(p,'selected_mode',{get(){accessors++;return 'EXPERIMENTAL'}});x.selection=p;expected='C99_STOP';break;}
 case 11:x.readC77Archive=null;expected='C99_STOP';break;
 case 12:x.sourceHead=head.toUpperCase();expected='C99_STOP';break;
 case 13:x.humanInput='I ACCEPT';break; // text is not an admitted native C72 event
 case 14:x.humanInput='EXIT IKANT';break; // text is not owner-confirmed opt-out
 case 15:x.humanInput='EXPERIMENTAL';break; // source owner must still validate selection
 case 16:x.humanInput='🔥'.repeat(151);expected='C99_STOP';break;
 case 17:x.nodeGithubNetworkRequested=1;expected='C99_STOP';break;
 case 18:x.selection={selected_mode:'EXPERIMENTAL'};expected='C99_STOP';break;
 }
 const g=gateC99ExperimentalEntry(x),p=preflightC98ChatGPTOffline(x);
 if(g.status!==expected)mismatch++;
 if(g.status==='C99_CALLBACK_SHAPE_ONLY_NOT_AUTHENTICATED'&&p.status!=='C98_CALLBACK_SHAPE_READY_NOT_HOST_AUTHENTICATED')mismatch++;
 if(g.status==='C99_STOP'&&p.status!=='C98_CHATGPT_OFFLINE_STOP')mismatch++;
 if(g.owner_executed!==false||g.source_origin_attested!==false||g.native_event_attested!==false||g.active!==false||p.active!==false)unsafe++;
 const k=g.first_unclosed_edge;counts[k]=(counts[k]||0)+1;
 // Prove the source-handoff gate separately, never call the owner with synthetic Git objects.
 const source=gateC99SourceHandoff({sourceHead:head,manifestSha256:'b'.repeat(64),sourceProof:{commitBase64:'x',treeObjects:axis===19?[{}]:[]}});
 if(source.owner_executed!==false||source.source_origin_attested!==false)unsafe++;
 invoked++;
}
const result={schema:'ikant-le-c99-100k-execution/v1',cases_executed:invoked,axes:20,gate_mismatches:mismatch,unsafe_promotions:unsafe,unexpected_getter_executions:accessors,observed_edge_counts:counts,real_ChatGPT_sessions:0,real_C84_owner_executions:0,scope:'LOCAL_NODE_RUNTIME_BOUNDARY_NEGATIVE_FALSIFICATION',passed:mismatch===0&&unsafe===0&&accessors===0};
console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;
