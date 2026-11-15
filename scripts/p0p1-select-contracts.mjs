/** HOST contract rubric. Exactly 4 x 5 x 5 prespecified candidates.
 * Selection optimizes breadth with minimum owners, not empirical human value.
 */
export const ROOTS=Object.freeze([
 {id:'P0_BOOT',issue:'Unassisted first-run instructions at exact pinned source',preferred:'FIRST_LEGAL_STEP'},
 {id:'P0_SOURCE',issue:'Partial Project ZIP versus full source handoff',preferred:'OBSERVED_SOURCE_STATE'},
 {id:'P0_UI',issue:'Registered native thread panel never inferred from source',preferred:'NATIVE_PROVIDER_GATE'},
 {id:'P1_ONTOLOGY',issue:'Composite self-ontology routed through original C114',preferred:'ORIGINAL_C114_OWNER'}
]);
export const TRIGGERS=Object.freeze(['PROMPT_ONLY','DOCUMENT_LINK','FIRST_LEGAL_STEP','OBSERVED_SOURCE_STATE','NATIVE_PROVIDER_GATE']);
export const BOUNDARIES=Object.freeze(['FREE_TEXT','SELF_REPORTED','HASH_ONLY','ORIGINAL_C114_OWNER','FAIL_CLOSED']);
// C114 is a positive qualification owner, not a replacement for negative fail-closed.
export function chooseP0P1Contracts(){
 const candidates=[];
 for(const root of ROOTS)for(const trigger of TRIGGERS)for(const boundary of BOUNDARIES){
  const triggerTarget=root.id==='P1_ONTOLOGY'?'OBSERVED_SOURCE_STATE':root.preferred;
  const boundaryTarget=root.id==='P1_ONTOLOGY'?'ORIGINAL_C114_OWNER':'FAIL_CLOSED';
  const score=(trigger===triggerTarget?50:0)+(boundary===boundaryTarget?50:0)+
    (boundary==='FAIL_CLOSED'?5:0)+(trigger==='FIRST_LEGAL_STEP'?1:0);
  candidates.push({id:'K'+String(candidates.length+1).padStart(3,'0'),root:root.id,
   trigger,boundary,score,source_owner:root.id==='P1_ONTOLOGY'?'C114/C107':root.id==='P0_UI'?'P8/S05':root.id==='P0_SOURCE'?'P1/C72':'P2/C72'});
 }
 const selected=ROOTS.map(root=>candidates.filter(x=>x.root===root.id).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id))[0]);
 return {schema:'ikant-le-p0p1-contract-selection/v1',candidate_count:candidates.length,
  minimal_selected_count:selected.length,selection_is_empirical:false,
  original_owners_preserved:true,native_ui_attested:false,
  requirements:[
   {root:'P0_BOOT',dod:'Pinned human installer, exact 3 admissions, STOP at gates; no stale static filenames'},
   {root:'P0_SOURCE',dod:'Partial/full/absent/unknown states, first legal ZIP link, no early upload'},
   {root:'P0_UI',dod:'Read-only panel readiness, unchanged six slots and NO_VOICE, native app still unproven'},
   {root:'P1_ONTOLOGY',dod:'C70 composite routing through unchanged five-line C114 disclosure, single C87 reopen'}
  ],selected,candidates};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)
 process.stdout.write(JSON.stringify(chooseP0P1Contracts(),null,2)+'\n');
