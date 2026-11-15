import crypto from 'node:crypto';
export const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
export const C93_TEST_HEAD='53e9519ea8a9b392f1a4cb288db01937cde58c76';
/** These are synthetic bytes for a NEGATIVE/preflight unit test, never C81 proof. */
export function makeC93Fixture(head=C93_TEST_HEAD){
 const files=Array.from({length:20},(_,i)=>({path:'src/fixture-'+i+'.mjs',contentBase64:Buffer.from('test fixture '+i).toString('base64')}));
 const manifest=Buffer.from(JSON.stringify({source_head:head,files:files.map(f=>({path:f.path,bytes:Buffer.from(f.contentBase64,'base64').length,sha256:sha(Buffer.from(f.contentBase64,'base64'))}))}));
 const p={schema:'ikant-le-c84-single-source-package/v1',sourceHead:head,expectedManifestSha256:sha(manifest),manifestBase64:manifest.toString('base64'),sourceProof:{commitBase64:Buffer.from('not-a-real-git-commit').toString('base64'),treeObjects:[{sha1:'a'.repeat(40),content_base64:Buffer.from('not a tree').toString('base64')}]},files,active:false,source_origin_attested:false,native_chat_delivery_attested:false,authority:0};
 const raw=Buffer.from(JSON.stringify(p));
 const humanInput='Studia la tua identita operativa e dieci domande esistenziali.';
 return {sourceHead:head,humanInput,inputSha256:sha(humanInput),manifestSha256:sha(manifest),packageSha256:sha(raw),packageBase64:raw.toString('base64'),selection:{status:'EXPERIMENTAL_SELECTED_NOT_RUNNING',selected_mode:'EXPERIMENTAL'}};
}
