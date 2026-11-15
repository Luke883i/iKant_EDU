import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {issueC72TermsOffer,acceptC72Terms,presentC72Introduction,selectC72Mode} from '../host/c72-unified-mode-admission.mjs';
import {issueC72V2TermsOffer,acceptC72V2Terms,presentC72V2Introduction,selectC72V2Mode} from '../host/c72-public-mode-admission.mjs';
import {issueC69ExperimentalOffer as legacyOffer} from '../host/c69-capability-first-preview.mjs';
import {issueC69ExperimentalOffer as eduOffer} from '../host/c69-edu-v2-preview.mjs';
import {runC70ExperimentalComputePreview} from '../src/c70-experimental-compute-preview.mjs';
import {runC70ExperimentalComputePreview as runC70EduV2} from '../src/c70-edu-v2-compute-preview.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
const root=new URL('../',import.meta.url);
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const terms=fs.readFileSync(new URL('../TERMS.md',import.meta.url));
const readme=fs.readFileSync(new URL('../README.md',import.meta.url));
const sourceObject={path:'README.md',blob_sha1:gitBlob(readme),content_base64:readme.toString('base64')};
const a=issueC72TermsOffer({sourceHead:head,termsDigest:sha(terms)}),
 ab=acceptC72Terms({offer:a,humanMessage:'I ACCEPT',termsPresented:true});
const legacy=selectC72Mode({accepted:ab,orientation:presentC72Introduction(ab),humanMessage:'EXPERIMENTAL'});
const b=issueC72V2TermsOffer({sourceHead:head,termsDigest:sha(terms)}),
 bb=acceptC72V2Terms({offer:b,humanMessage:'I ACCEPT',termsPresented:true});
const edu=selectC72V2Mode({accepted:bb,orientation:presentC72V2Introduction(bb),humanMessage:'EDU'});
test('S02 EDU/v2 C70 preserves exact original cognitive output, dispatch digest and 12 C124 channels',()=>{
 const messages=['Spiega la valutazione di un servizio locale.', 'Quale criterio di prova segue dal precedente?'];
 const old=runC70ExperimentalComputePreview({sourceHead:head,unifiedSelection:legacy,
  offer:legacyOffer({sourceHead:head}),sourceObject,messages});
 const next=runC70EduV2({sourceHead:head,unifiedSelection:edu,
  offer:eduOffer({sourceHead:head}),sourceObject,messages});
 assert.equal(old.status,'EXPERIMENTAL_COMPUTE_PREVIEW',JSON.stringify(old));
 assert.equal(next.status,'EXPERIMENTAL_COMPUTE_PREVIEW',JSON.stringify(next));
 assert.deepEqual(next.turns,old.turns);
 assert.equal(next.ephemeral_last_episode_hash,old.ephemeral_last_episode_hash);
 assert.equal(next.active,false);
 assert.equal(next.native_event_attested,false);
});
