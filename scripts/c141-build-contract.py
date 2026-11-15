#!/usr/bin/env python3
import csv,json,hashlib,pathlib,subprocess,sys,tempfile
root=pathlib.Path(__file__).resolve().parents[1]
orig=json.loads((root/'contracts/c140-e2e-semantic-assurance.json').read_text())
repo={'repo':'Luke883i/iKant_LE','main_source_head':'3d174674527d74d1b2e52df3e970d14a748cd4b1','main_tree':'edc1e859d6688ebfd17788e115748ff200289736','pr148_head':'3e9796801bc21b96b5487086c51659fed93fafc4','pr148_tree':'4055f4f2ed485ca134a0d417c154bc43b56f411c'}
solved=set('A11 A14 A33 A34 A35 A36 A37 A38'.split())
partial=set('A05 A10 A12 A13 A15 A17 A18 A19 A20 A21 A23 A24 A25 A26 A31 A32 A39 A40 A42'.split())
assert len(solved)==8 and len(partial)==19 and solved.isdisjoint(partial)
focus=set('A12 A13 A15 A17 A18 A19 A23 A24 A25 A31 A32 A39 A40 A42 A43 A45 A48'.split())
carried=set('A01 A02 A03 A04 A05 A06 A07 A08 A10 A11 A14 A33 A34 A35 A36 A37 A38'.split())
external=set('A09 A16 A20 A21 A22 A26 A27 A28 A29 A30 A41 A44 A46 A47'.split())
assert len(focus)==17 and len(carried)==17 and len(external)==14
notavailable=set('A09 A22 A27 A28 A44'.split())
new=[
 ('A43','L3','Multilingual and indirect-self identity prompts can escape a lexical C114 precedence rule.','Add read-only arbitrator plus adversarial multilingual negative cases; no claim of semantic completeness.','C135/C114','self-identification probes: ZERO admitted as C140 without owner qualification','LOCAL_PREPR_SHADOW','A13'),
 ('A44','L6','Prompt or local source cannot install durable native cross-chat memory or persist a ChatGPT panel.','Expose NO_NATIVE_CROSS_CHAT_MEMORY and offer explicit user-authorized file or external app handoff only.','Provider/client','zero false native persistence claims; provider-native proof required','EXTERNAL_GAP','A28'),
 ('A45','L7','Exact chunk byte reassembly does not imply coherent understanding or original C70 execution.','Use Unicode-codepoint-safe fragmentation, full SHA, fail-closed rejoin, and separate semantic evaluator.','C135/C141 transport','rejoin hash=source hash; semantic continuity remains NOT_ATTESTED','LOCAL_PREPR_SHADOW','A32'),
 ('A46','L6','Lexical epistemic markers can approve false arguments; model self-review is not independent evidence.','Design blinded dataset and external human/independent assessor; negative heuristics alone never close semantics.','C137/external evaluator','>=300 independent pairs/route and error calibration before efficacy claim','EXTERNAL_GAP','A29'),
 ('A47','L1','Merging a candidate changes source epoch and invalidates inherited admission receipts.','Require new source-bound C72/v2 human admission after authorized pin rotation; no auto-upgrade.','C72/source epoch','no historical receipt accepted as new source authorization','EXTERNAL_GAP','A05'),
 ('A48','L4','A timed-out C125 send may have succeeded: blind retry can duplicate delivery.','Read-only reconciliation ledger/output callback; ambiguity stays STOP, never automatic resend.','C125/C87','unknown callback leads to 0 duplicate sends/writes','LOCAL_PREPR_SHADOW','A18')]
extra=[]
for id,l,issue,improve,owner,metric,s,edge in new:
 extra.append(dict(id=id,level=l,issue=issue,improvement=improve,owner=owner,evidence_class='INFERRED_FROM_BOUNDARY',dod='Specific falsifier and typed proof; external gates remain open',metric=metric,verification='LOCAL_SHADOW' if s=='LOCAL_PREPR_SHADOW' else 'EXTERNAL_OWNER',status=s,falsifier='Unexpected native/ACTIVE assertion, or missing negative proof',edges=[edge,'SOURCE_EPOCH','C135_EDU','PRODUCT_NO_GO']))
atoms=[*orig['atoms'],*extra]
for item in atoms:
 id=item['id']
 item['coverage_pr148']='BOUNDED_TESTED' if id in solved else 'PARTIAL' if id in partial else 'NOT_ADDRESSED' if int(id[1:])<=42 else 'NEW'
 item['next_action']='C141_NEXT_PR_CANDIDATE' if id in focus else 'BASELINE_PRESERVE_AND_RETEST' if id in carried else 'EXTERNAL_OR_PROVIDER_GATE'
 item['can_i_do']='NOT_AVAILABLE_IN_THIS_CHAT_HOST' if id in notavailable else 'LOCAL_PROPOSAL_PLUS_EXTERNAL_PROOF' if id in external else 'LOCAL_CODE_AND_TEST_WITH_LIMITS'
 item['closed_by_prepr']=False
 item['semantic_retention_class']='INDEXED_ATOM_ONLY'
 item['proof_requirement']=('Owner live provider instrumentation, pilot/human control' if id in external else 'Source-bound test and read-only proof, not production dispatch')
assert len(atoms)==48 and len({x['id'] for x in atoms})==48
assert all(x['edges'] and x['falsifier'] and x['metric'] and x['improvement'] for x in atoms)
links=[{'from':'C72_V2','to':'SOURCE_EPOCH','kind':'requires'}, {'from':'SOURCE_EPOCH','to':'C135_EDU','kind':'authorizes_only_after_new_receipt'}, {'from':'C135_EDU','to':'C141_SHADOW','kind':'candidate_only_no_dispatch'}, {'from':'C141_SHADOW','to':'C114_OWNER','kind':'identity_has_precedence'}, {'from':'C141_SHADOW','to':'C139_OWNER','kind':'qualified_epistemic_precedence'}, {'from':'C132_SHADOW','to':'C141_SHADOW','kind':'advisory_not_sole_authority'}, {'from':'C141_SHADOW','to':'C140','kind':'candidate_requires_explicit_owner_qualification'}, {'from':'C141_FRAGMENT','to':'C70','kind':'does_not_attest_execution'}, {'from':'C140','to':'C87_SINGLE','kind':'must_reuse_owner'}, {'from':'C87_SINGLE','to':'C125_AT_MOST_ONCE','kind':'delivery_requires_readback'}, {'from':'C125_AT_MOST_ONCE','to':'PRODUCT_NO_GO','kind':'host_bound_not_native'}, {'from':'A44','to':'PROVIDER','kind':'native_cross_chat_unavailable_here'}, {'from':'A46','to':'INDEPENDENT_EVALUATOR','kind':'semantic_efficacy_external'}, {'from':'A48','to':'C125_AT_MOST_ONCE','kind':'unknown_stop_reconcile_no_retry'}]
contract={
 'schema':'ikant-le-c141-prepr-semantic-hardening/v1','status':'PREPR_LOCAL_SOURCE_ONLY','authority':0,
 'branch_publication':False,'remote_pr_created':False,'active':False,'native_identity_attested':False,
 'persistent_chat_memory_attested':False,'semantic_lossless_universal_attested':False,
 'base':repo,'source_contract_git_blob_sha1':subprocess.check_output(['git','hash-object','contracts/c140-e2e-semantic-assurance.json'],cwd=root,text=True).strip(),
 'design_space':{'factorial':'5x5x5x8','alternatives':1000,'feasible_expected':36,'selected_expected':'R3-B3-E3-P6','weights':'synthetic declared, not empirical proof','source':'scripts/c141-design-1000.mjs'},
 'levels':{**orig['levels'],'L8':'New host/provider semantic boundary (cross edges)'},
 'scopes':{'next_pr_candidates':sorted(focus),'preserve_existing':sorted(carried),'external_gates':sorted(external)},
 'atoms':atoms,'semantic_edges':links,
 'dod_global':[
  {'id':'G1','goal':'keep C107/C114/C139 unchanged and pin exact PR148 tree','verification':'git tree and negative owner tests','status':'LOCAL_PREPR_PROOF_ONLY'},
  {'id':'G2','goal':'no subject allowlist, deterministic typed route conflict; self identity and C139 preserve owner precedence','verification':'adversarial local shadow test','status':'SHADOW_ONLY_NOT_WIRED'},
  {'id':'G3','goal':'exact finite UTF-8 input fragments and fail closed on limit','verification':'property and adversarial tests','status':'SHADOW_ONLY_NOT_WIRED'},
  {'id':'G4','goal':'no double writer, no falsely attributed C70, no unknown delivery retry','verification':'preserve original C87/C125 owner; integration tests future','status':'PR_IMPLEMENTATION_OPEN'},
  {'id':'G5','goal':'42 original + 6 novel issue atoms traceable with ref/edge/falsifier/DoD','verification':'machine 48/48 unique and coverage','status':'LOCAL_PREPR_PROOF'},
  {'id':'G6','goal':'1000 alternatives ranked under explicit hard constraints with sensitivity','verification':'automated full enumeration, checksum','status':'LOCAL_PREPR_PROOF'},
  {'id':'G7','goal':'product release: native client, consent, persistence, pilot, semantics, independent assessor','verification':'provider, human and owner proofs','status':'EXTERNAL_PRODUCT_NO_GO'}],
 'global_success_metrics':{'original_atom_coverage':'42/42','total_index_coverage':'48/48','negative_tests_target':'all planned local falsifiers green','false_native_claims_target':0,'fake_C70_execution_target':0,'double_writes_target':0,'semantic_accuracy_attestation':'NO_BY_DESIGN','native_cross_chat_persistence':'UNAVAILABLE_HERE'},
 'release':'PRODUCT_NO_GO',
 'nonclaims':['No proof of unlimited physical I/O','No independent semantic truth check','No actual owner C135 integration','No C87 or C125 invocation from C141 shadow','No cross-chat native persistence','No human pilot','No source epoch rotation']
}
out=pathlib.Path(sys.argv[1]) if len(sys.argv)==2 else pathlib.Path(tempfile.mkdtemp(prefix='ikant-c141-'))
out.mkdir(parents=True,exist_ok=True)
con=out/'c141-semantic-prepr-v1.json';con.write_text(json.dumps(contract,ensure_ascii=False,indent=2)+'\n')
with (out/'C141_ISSUE_MATRIX.csv').open('w',newline='') as f:
 w=csv.writer(f,lineterminator="\n");w.writerow(['id','level','pr148_coverage','feasibility','next_action','issue','improvement','owner','metric','falsifier'])
 for x in atoms:w.writerow([x['id'],x['level'],x['coverage_pr148'],x['can_i_do'],x['next_action'],x['issue'],x['improvement'],x['owner'],x['metric'],x['falsifier']])
from collections import Counter
print(json.dumps({'output_dir':str(out),'atoms':len(atoms),'pr148_coverage':Counter(x['coverage_pr148'] for x in atoms),'can_i_do':Counter(x['can_i_do'] for x in atoms),'scopes':{k:len(v) for k,v in contract['scopes'].items()},'links':len(links)},indent=2))
