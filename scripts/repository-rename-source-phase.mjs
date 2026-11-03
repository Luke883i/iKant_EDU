/**
 * S01 rename source identity model. This is a structural checker, NOT a provider
 * event, C72 owner, administrative permission or authentication of caller input.
 * A caller MUST independently reopen GitHub ID/name/HEAD/TREE before treating
 * these fields as verified provenance. The current canonical source remains OLD.
 */
export const RENAME_OLD='Luke883i/iKant_LE';
export const RENAME_NEW='Luke883i/iKant_EDU';
export const RENAME_REPOSITORY_ID=1371330383;
const H40=/^[a-f0-9]{40}$/;
const names=Object.freeze({OLD:RENAME_OLD,NEW:RENAME_NEW});
const fields=Object.freeze(['schema','phase','repo_id','observed_full_name','observed_branch',
 'source_head','observed_head','source_tree','observed_tree','source_epoch',
 'bootstrap_repository','admission_repository','c72_contract_repository',
 'terms_link','human_message','human_turn','owner_outcome',
 'old_receipt_reused','native_receipt_claim','provider_installed_claim',
 'admin_rename_performed','active','aliases','observation_class']);
const deny=edge=>Object.freeze({ok:false,edge,authority:0,rename_go:false,active:false,
 native_owner_proven:false,provider_proven:false});
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
export function assessRenameSourceCandidate(x){
 if(!plain(x))return deny('INVALID_INPUT');
 if(Object.keys(x).length!==fields.length||fields.some(k=>!Object.hasOwn(x,k)))
  return deny('INCOMPLETE_OR_SURPLUS_EVIDENCE');
 if(x.schema!=='ikant-rename-source-candidate/v1')return deny('INVALID_SCHEMA');
 if(!Object.hasOwn(names,x.phase))return deny('PHASE_UNKNOWN');
 const name=names[x.phase];
 if(x.repo_id!==RENAME_REPOSITORY_ID)return deny('REPOSITORY_ID_MISMATCH');
 if(x.observed_full_name!==name||x.bootstrap_repository!==name||
    x.admission_repository!==name||x.c72_contract_repository!==name)
  return deny('SINGLE_CANONICAL_SOURCE_MISMATCH');
 if(x.observed_branch!=='main')return deny('SOURCE_BRANCH_NOT_MAIN');
 if(!H40.test(x.source_head)||x.observed_head!==x.source_head)
  return deny('SOURCE_HEAD_DRIFT');
 if(!H40.test(x.source_tree)||x.observed_tree!==x.source_tree)
  return deny('SOURCE_TREE_DRIFT');
 if(x.source_epoch!==name+'@'+x.source_head)
  return deny('SOURCE_EPOCH_MISMATCH');
 if(x.terms_link!=='https://github.com/'+name+'/blob/'+x.source_head+'/TERMS.md')
  return deny('TERMS_SOURCE_OR_HEAD_MISMATCH');
 if(!Array.isArray(x.aliases)||x.aliases.length!==1||x.aliases[0]!==name)
  return deny('DUAL_CANONICAL_OR_ALIAS');
 if(x.human_message!=='I ACCEPT'||x.human_turn!==2)
  return deny('HUMAN_GATE_NOT_OBSERVED_IN_DISTINCT_TURN');
 if(x.owner_outcome!=='NOT_INVOKED')return deny('OWNER_ATTEMPT_FENCE');
 if(x.old_receipt_reused!==false||x.native_receipt_claim!==false||
    x.provider_installed_claim!==false||x.admin_rename_performed!==false||
    x.active!==false)return deny('UNAUTHORIZED_AUTHORITY_PROMOTION');
 if(x.observation_class!=='HOST_CANDIDATE_NOT_PROVIDER_ATTESTED')
  return deny('PROVENANCE_CLASS_MISMATCH');
 return Object.freeze({ok:true,status:'STRUCTURAL_SOURCE_CONSISTENT_ONLY',
  phase:x.phase,repository:name,source_head:x.source_head,source_tree:x.source_tree,
  authority:0,rename_go:false,active:false,native_owner_proven:false,provider_proven:false,
  required_external_readback:'GITHUB_ID_NAME_HEAD_TREE_AND_ORIGINAL_OWNER'});
}
export function buildRenameSourceCandidate(phase,head,tree){
 const name=names[phase];if(!name)throw Error('UNKNOWN_PHASE');
 return {schema:'ikant-rename-source-candidate/v1',phase,repo_id:RENAME_REPOSITORY_ID,
  observed_full_name:name,observed_branch:'main',source_head:head,observed_head:head,
  source_tree:tree,observed_tree:tree,source_epoch:name+'@'+head,
  bootstrap_repository:name,admission_repository:name,c72_contract_repository:name,
  terms_link:'https://github.com/'+name+'/blob/'+head+'/TERMS.md',
  human_message:'I ACCEPT',human_turn:2,owner_outcome:'NOT_INVOKED',
  old_receipt_reused:false,native_receipt_claim:false,provider_installed_claim:false,
  admin_rename_performed:false,active:false,aliases:[name],
  observation_class:'HOST_CANDIDATE_NOT_PROVIDER_ATTESTED'};
}
