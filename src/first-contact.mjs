const CANONICAL='Luke883i/iKant_EDU';
const FUTURE='Luke883i/iKant_EDU';
const H40=/^[a-f0-9]{40}$/;
const NAME_SET=new Set([CANONICAL,FUTURE]);
/** A future candidate is lexical only until the GitHub source and original
 * BOOTSTRAP/ADMISSION/C72 identities are independently reopened.
 * These fields are not a native/provider receipt. */
export function qualifiedSourceCandidate(x){
 if(!x||typeof x!=='object'||Array.isArray(x)||Object.getPrototypeOf(x)!==Object.prototype||
    x.repo_id!==1371330383||x.source_repository!==FUTURE||
    x.bootstrap_repository!==FUTURE||x.admission_repository!==FUTURE||
    x.c72_contract_repository!==FUTURE||!H40.test(x.source_head||'')||
    !H40.test(x.source_tree||'')||x.observed_head!==x.source_head||
    x.observed_tree!==x.source_tree||x.observed_full_name!==FUTURE||
    x.source_epoch!==FUTURE+'@'+x.source_head||
    x.terms_link!=='https://github.com/'+FUTURE+'/blob/'+x.source_head+'/TERMS.md'||
    !Array.isArray(x.aliases)||x.aliases.length!==1||x.aliases[0]!==FUTURE||
    x.old_receipt_reused!==false||x.native_owner_proven!==false||
    x.provider_installed_proven!==false||x.authority!==0)return false;
 return true;
}
export const FIRST_CONTACT_CAPSULE=Object.freeze(['README.md','BOOTSTRAP.json','ADMISSION.json','AGENTS.md','TERMS.md']);
export const FIRST_CONTACT_FORBIDDEN=Object.freeze(['CLONE_REPOSITORY','GIT_FETCH','GIT_LS_REMOTE','GH_CLI','RAW_WEB_READ','DIRECT_DOWNLOAD','ARCHIVE_DOWNLOAD','SHELL_HTTP_DOWNLOAD','LIST_TREE','SEARCH_REPOSITORY','READ_ARBITRARY_REPOSITORY_FILE','READ_HISTORY','READ_ISSUE_PR','MATERIALIZE_CHECKOUT']);
export const REPOSITORY_TRANSPORT=Object.freeze({required:'GITHUB_API',allowed:['GITHUB_CONNECTOR','GITHUB_REST_API'],connector_is_api_adapter:true,fallback:null,api_unavailable_terminal:'HOST_INCOMPATIBLE',unavailable_tools_must_not_be_attempted:true});
export const SOURCE_HEAD_BINDING=Object.freeze({action:'READ_BRANCH_HEAD',branch:'main',transport:'GITHUB_API',required:true,before_orientation_files:true,pin_all_repository_reads:true});
function normalize(value){let x=String(value??'').normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/g,'');try{x=decodeURIComponent(x);}catch{}return x.toLowerCase();}
export function referencesCanonicalRepository(input,{qualifiedSource=null}={}){if(qualifiedSource!==null&&!qualifiedSourceCandidate(qualifiedSource))return false;const actual=normalize(input);const x=qualifiedSource===null?actual:actual.replaceAll('ikant_edu','ikant_edu');return /(?:https?:\/\/)?github\.com\/luke883i\/ikant_edu(?:\.git)?(?=$|[\s\/?#)\]}>.,;:'"!`])/i.test(x)||/git@github\.com:luke883i\/ikant_edu(?:\.git)?(?=$|[\s)\]}>.,;:'"!`])/i.test(x)||/(^|[\s([{'"`.,;:!?<>])luke883i\/ikant_edu(?=$|[\s)\]}>,.;:'"!?`])/i.test(x)||/(^|[\s([{'"`.,;:!?<>])ikant_edu(?=$|[\s)\]}>,.;:'"!?`])/i.test(x);}
export function compileFirstContactPlan(input,{qualifiedSource=null}={}){
 if(qualifiedSource!==null&&!qualifiedSourceCandidate(qualifiedSource))
  return{schema:'ikant-le-first-contact/v2',recognized:false,
   terminal:'STOP_SOURCE_BINDING_UNVERIFIED',authority:0};
 if(!referencesCanonicalRepository(input,{qualifiedSource}))
  return{schema:'ikant-le-first-contact/v2',recognized:false,terminal:'NOT_TARGET_REPOSITORY'};
 const source=qualifiedSource===null?CANONICAL:FUTURE;
 return{schema:'ikant-le-first-contact/v2',recognized:true,repository:source,repository_url:'https://github.com/'+source,
 source_binding_class:qualifiedSource===null?'OLD_CANONICAL_SOURCE':'HOST_STRUCTURAL_CANDIDATE_REQUIRES_GITHUB_READBACK',
 native_owner_proven:false,provider_installed_proven:false,authority:0,terminal:'CANONICAL_PREACCEPT',pending_intent:String(input??''),preserve_pending_intent:true,repository_transport:{...REPOSITORY_TRANSPORT},source_head_binding:{...SOURCE_HEAD_BINDING},default_acquisition:FIRST_CONTACT_CAPSULE.map(target=>({action:'READ_ORIENTATION_FILE',target,transport:'GITHUB_API',direct_path_only:true,exact_ref:'SOURCE_HEAD'})),optional_metadata:{action:'READ_ORIENTATION_METADATA',transport:'GITHUB_API',fields:['repository_full_name','default_branch','description'],max_reads:1},present_terms_after_capsule:true,freeze_after_terms_presentation:true,required_next_human_message:'I ACCEPT',embedded_acceptance_is_invalid:true,auto_after_acceptance:['ACTIVATE_FIRST','PARALLEL_RUNTIME_CAPSULE','IMPORT_PREACCEPT_HANDOFF','AUTO_PROBE','AUTO_INITIALIZE','RESUME_PENDING_INTENT_IF_ANY'],post_accept_fastboot:{manifest:'BOOTSTRAP.json',mode:'ACTIVATE_FIRST',remote_acquisition_rounds_max:1,parallel_fetch_required:true,exact_ref:'SOURCE_HEAD',generic_discovery_before_active:false,tests_before_active:false,qualification_before_active:false},forbidden_before_acceptance:[...FIRST_CONTACT_FORBIDDEN],generic_repository_discovery_forbidden:true,host_constraints_precede_local_contract:true};}
