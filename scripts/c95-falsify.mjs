import {adaptC95HostConnector} from '../host/c95-host-connector-relay.mjs';
const count=Number(process.argv[2]||100000);
if(!Number.isInteger(count)||count<100||count>1000000)throw Error('COUNT_BOUNDS');
const valid=Buffer.from('zip contents but not valid C77');
const b64=valid.toString('base64');
const paths=['/user','/repos/evil/private','/git/ref/heads/unrelated','/actions/artifacts/01/zip',
 '/actions/artifacts/1/zip?token=LEAK','/git/commits/'+ 'A'.repeat(40),
 '/actions/workflows/evil.yml/runs?branch=main&status=completed&per_page=30',
 '/actions/runs/0/artifacts?per_page=100',
 '/actions/runs/1/artifacts?per_page=999',
 '/git/trees/../../secrets'];
let survivors=0,negativeFailures=[];
for(let i=0;i<count;i++){
 const adapter=adaptC95HostConnector({readGithubJSON:async()=>({injected:true}),
  readGithubArtifactBase64:async({artifact_id})=>({artifact_id,contentBase64:b64})});
 try{await adapter.json(paths[i%paths.length]);survivors++;if(negativeFailures.length<5)negativeFailures.push(i);}catch{}
}
const result={schema:'ikant-le-c95-connector-falsification/v1',cases:count,classes:paths.length,
 surprising_accepts:survivors,failures:negativeFailures,provider_calls:0,
 real_github_connector_to_node_attested:false,native_chat_delivery_attested:false,
 positive_model_generated_voice_attested:false,active:false};
console.log(JSON.stringify(result));if(survivors)process.exitCode=2;
