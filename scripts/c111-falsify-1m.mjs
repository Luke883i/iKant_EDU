import {createC111HostEdge} from '../host/c111-host-edge.mjs';
const edge=createC111HostEdge({sourceHead:'a'.repeat(40),ledgerFile:'/tmp/no-ledger-c111'});
const bad=[
 {op:'UNKNOWN'},{op:'MESSAGE'},{op:'MESSAGE',text:''},{op:'MESSAGE',text:' '.repeat(4)},
 {op:'MESSAGE',text:'x'.repeat(601)},{op:'MESSAGE',text:null},{op:'MESSAGE',text:42},
 {op:'CAPABILITIES',text:'I ACCEPT'},{op:'STATUS',text:'accept'},{op:'EXIT',text:'bye'},
 {op:'REVOKE',nonce:'invalid'},{op:'ACTIVATE',hostDraft:'unsafe'},
 {op:'MESSAGE',text:'Question?',nonce:'short'},
 {op:'MESSAGE',text:'Q',nonce:'!'.repeat(14)},
 {op:'MESSAGE',text:'Q',nonce:'x'.repeat(97)},
 {op:'MESSAGE',text:'Q',candidate:{input_sha256:'0'.repeat(64),text:'A'}},
 {op:'MESSAGE',text:'Q',candidate:{input_sha256:'x',text:'A'}},
 {op:'MESSAGE',text:'Q',candidate:{input_sha256:'0'.repeat(64),text:''}},
 {op:'MESSAGE',text:'Q',candidate:{text:'A'}},
 {op:'MESSAGE',text:'Q',candidate:[]},
 {op:'MESSAGE',text:'Q',extra:'bad'}, {op:77},
 {}, [],null];
let violations=0,blocked=0;
for(let i=0;i<1000000;i++){
 const result=await edge.dispatch(bad[(i*17+11)%bad.length]);
 if(result?.status==='C109_VERIFIED_LOCAL_VOICE_NOT_NATIVE'||
 result?.status==='C109_SYNTHETIC_HOST_DRAFT_NOT_IKANT_RUNTIME'||
 result?.active===true||result?.native_delivery_attested===true)violations++;else blocked++;
}
let positives=0;
for(let i=0;i<10000;i++){const x=await edge.dispatch({op:'CAPABILITIES'});
 if(x.status==='C111_CURRENT_NODE_PROCESS_OBSERVED'&&x.original_c70_executed_in_probe===false&&
 x.native_host_hook_attested===false)positives++;}
const out={schema:'ikant-le-c111-live-validator-falsification/v1',cases:1000000,
 families:bad.length,negative_blocked:blocked,unexpected_promotions:violations,
 positive_controls:positives,actual_c70_turns_in_campaign:0,actual_chatgpt_events:0,
 passed:violations===0&&blocked===1000000&&positives===10000};
console.log(JSON.stringify(out));if(!out.passed)process.exitCode=2;
