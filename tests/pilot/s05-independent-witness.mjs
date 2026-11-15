/** S05 signed audit-envelope verifier. Integrity != independently observed humans.
 * Trusted auditor key must be supplied from a separately governed source, never the bundle.
 */
import {createHash,verify} from 'node:crypto';
import {isProxy} from 'node:util/types';
import {summarizeS05Trials} from './s05-first-run-metrics.mjs';
const no=edge=>Object.freeze({ok:false,first_edge:edge,external_human_qualification:false});
const atom=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{12,96}$/.test(x);
export function inspectS05SignedStudy({envelope,signatureBase64,trustedAuditorPublicKey,expectedSourceHead}={}){
 if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||isProxy(envelope)||
    Object.getPrototypeOf(envelope)!==Object.prototype||
    Object.keys(envelope).sort().join(',')!=='auditor_event,source_head,trials,version'||
    envelope.version!=='ikant-s05-study-envelope/v1'||!atom(envelope.auditor_event)||
    !/^[a-f0-9]{40}$/.test(expectedSourceHead||'')||envelope.source_head!==expectedSourceHead||
    !Array.isArray(envelope.trials)||envelope.trials.length<30||envelope.trials.length>10000)
  return no('S05_STUDY_SCHEMA_OR_SOURCE_DENIED');
 const ids=new Set();for(const t of envelope.trials){
  if(!t||typeof t!=='object'||Array.isArray(t)||isProxy(t)||
    Object.keys(t).sort().join(',')!=='completed,elapsed_ms,errors,manual_steps,participant_pseudonym,trial_id'||
    !atom(t.participant_pseudonym)||ids.has(t.participant_pseudonym))return no('S05_PARTICIPANT_PSEUDONYM_DUPLICATED');
  ids.add(t.participant_pseudonym);
 }
 if(typeof signatureBase64!=='string'||!/^[A-Za-z0-9+/=]{60,300}$/.test(signatureBase64)||
    typeof trustedAuditorPublicKey!=='string')return no('S05_TRUSTED_AUDITOR_SIGNATURE_REQUIRED');
 const canonical=JSON.stringify(envelope);let valid=false;
 try{valid=verify(null,Buffer.from(canonical),trustedAuditorPublicKey,Buffer.from(signatureBase64,'base64'))}catch{return no('S05_SIGNATURE_UNVERIFIABLE')}
 if(!valid)return no('S05_SIGNATURE_INVALID');
 const metrics=summarizeS05Trials(envelope.trials);
 if(!metrics.ok)return no(metrics.first_edge);
 const receipt_sha256=createHash('sha256').update(canonical).digest('hex');
 return Object.freeze({ok:true,receipt_sha256,signature_verified_against_supplied_trust_root:true,
  trial_count:metrics.trial_count,p50_ms:metrics.p50_ms,p95_ms:metrics.p95_ms,
  total_errors:metrics.total_errors,mean_steps:metrics.mean_steps,
  externally_real_humans_verified:false,external_human_qualification:false,
  first_edge:'S05_INDEPENDENT_PERSONHOOD_AND_CONSENT_AUDIT_REQUIRED'});
}
