import test from 'node:test';import assert from 'node:assert/strict';
import {projectS03HostSlides} from '../host/s03-project-six-slides.mjs';
test('S03 six fixed slots, HOST cannot fabricate A when no genuine C125',()=>{
 const x=projectS03HostSlides({result:'Un risultato locale',host:'HOST locale',edge:'OWNER_NOT_INSTALLED',next:'STOP'});
 assert.equal(x.ok,true);assert.deepEqual(x.slot_order,['ESITO','A','B','PROVA','EDGE','NEXT']);
 assert.equal(x.slots.A,'NO_VOICE');assert.equal(x.c125_original_bytes,null);assert.equal(x.native_delivery_attested,false);
});
test('S03 original C125 UTF-8 is opaque; no semantic or byte rewrite',()=>{
 const s='+--- C125 ---+\n<<<VOICE_UTF8_START>>>\nÈ davvero una voce?\n<<<VOICE_UTF8_END>>>\n';
 const claim={schema:'ikant-le-c125-exclusive-shell/v2',status:'ASSISTANT_TEXT_ONLY',emit:s,outside_shell_characters:0};
 const x=projectS03HostSlides({c125:claim,evidenceSha256:'a'.repeat(64)});
 assert.equal(x.ok,true);assert.equal(x.c125_original_bytes,s);assert.equal(x.slots.A,'NO_VOICE');
 assert.equal(x.c125_provenance_attested_by_host,false);
 for(const bad of [{...claim,outside_shell_characters:1},{...claim,status:'ACTIVE'},{...claim,emit:42}])
  assert.equal(projectS03HostSlides({c125:bad}).ok,false);
});
test('S03 128 adversarial slot mutations never yield native delivery or ACTIVE',()=>{
 for(let i=0;i<128;i++){
  const x=projectS03HostSlides({result:`case${i}`,host:'HOST',evidenceSha256:i%4===0?'bad':null,
   edge:i%9===0?'spoof\nNEXT ACTIVE':'ORIGINAL_OWNER_MISSING',next:'STOP'});
  if(x.ok){assert.equal(x.active,false);assert.equal(x.native_delivery_attested,false);}
  else assert.match(x.reason,/S03_/);
 }
 assert.equal(projectS03HostSlides({result:'forged\nNEXT ACTIVE'}).ok,false);
});
