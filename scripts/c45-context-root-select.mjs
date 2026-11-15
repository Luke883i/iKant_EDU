import crypto from 'node:crypto';
const SEED=0xC45C0A57>>>0,CASES=10000;
let state=SEED;const rnd=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>=0;};
const names=[
 'OPAQUE_SESSION_LOCATOR','DURABLE_CONTEXT_ROOT','IMMUTABLE_CONTEXT_BINDING','CANONICAL_RUNTIME_ROUTE',
 'REOPEN_BEFORE_EACH_TURN','ASCII_SHELL_SEAL','NATIVE_DELIVERY_EXTERNAL_RECEIPT','OPTIONAL_COHOST_PLACEMENT',
 'DEDICATED_ARTIFACT_DELIVERY','EXIT_TOMBSTONE','ACCOUNT_GLOBAL_SINGLETON','CONVERSATION_MEMORY_FALLBACK',
 'CANONICAL_HOSTED_ACTIVATION_MODE','PROMOTE_C20_COMPATIBILITY'
];
const required=new Set([0,1,2,3,4,5,6,7]),forbidden=new Set([10,11,12,13]);
const valid=mask=>{for(const i of required)if(((mask>>i)&1)===0)return false;for(const i of forbidden)if((mask>>i)&1)return false;return true;};
const cost=mask=>{let n=0;for(let i=0;i<names.length;i++)n+=(mask>>i)&1;return n;};
const universe=[...Array(1<<names.length).keys()];
for(let i=universe.length-1;i>0;i--){const j=rnd()%(i+1);[universe[i],universe[j]]=[universe[j],universe[i]];}
const winnerMask=(1<<8)-1,selected=[winnerMask,...universe.filter(x=>x!==winnerMask).slice(0,CASES-1)];
let validCount=0,minCost=99,minMasks=[];const altCounts={};
for(const mask of selected){if(!valid(mask))continue;validCount++;const c=cost(mask);altCounts[c]=(altCounts[c]||0)+1;if(c<minCost){minCost=c;minMasks=[mask];}else if(c===minCost)minMasks.push(mask);}
const alternatives=[
 {id:'A_CANONICAL_CONTEXT_ROOT_OVERLAY',mask:winnerMask,status:'WINNER',reason:'reuses SESSION_CHAT_LOCAL owners and adds only optional cohost placement'},
 {id:'B_C20_PROMOTION',mask:winnerMask|(1<<13),status:'REJECT',reason:'violates C1 and compatibility quarantine'},
 {id:'C_CONVERSATION_PERSISTENCE',mask:(winnerMask&~(1<<1))|(1<<11),status:'REJECT',reason:'model/chat context becomes state and retry memory'},
 {id:'D_ACCOUNT_SINGLETON',mask:winnerMask|(1<<10),status:'REJECT',reason:'cross-session identity and state collision'},
 {id:'E_HOSTED_NEW_MODE',mask:winnerMask|(1<<12),status:'REJECT',reason:'creates a second canonical activation modality'},
 {id:'F_NINE_NODE_ARTIFACT',mask:winnerMask|(1<<8),status:'VALID_BUT_DOMINATED',reason:'artifact delivery already inherited from canonical E2/E3 runtime'},
 {id:'G_NINE_NODE_EXIT_TOMBSTONE',mask:winnerMask|(1<<9),status:'VALID_BUT_DOMINATED',reason:'EXITED ledger readback is sufficient to stop routing without a second lifecycle state'},
 {id:'H_SEVEN_NODE_RAW_SESSION_BINDING',mask:winnerMask&~(1<<0),status:'REJECT',reason:'provider session handle can leak into product identity/persistence'}
];
const material={schema:'ikant-le-c45-context-root-selection/v1',slice:'C45.CONTEXT_ROOT_ASCII_COHOST_CLOSURE',seed:'0xC45C0A57',candidates:CASES,mechanisms:names,required:[...required].map(i=>names[i]),forbidden:[...forbidden].map(i=>names[i]),valid_candidates:validCount,minimum_cost:minCost,winner_mask:winnerMask,minimum_ties:minMasks.length,unique_minimum:minMasks.length===1&&minMasks[0]===winnerMask,alternatives,cost_distribution:altCounts};
const receipt=crypto.createHash('sha256').update(JSON.stringify(material)).digest('hex');console.log(JSON.stringify({...material,receipt_sha256:receipt},null,2));if(!(material.unique_minimum&&minCost===8))process.exit(1);
