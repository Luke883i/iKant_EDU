#!/usr/bin/env python3
"""V13 read-only CORA L1 causal structure audit. No release/runtime/owner authority."""
import argparse
import collections
import hashlib
import importlib.util
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = 'c9a1179283958a7ffb30d1ad8c08af69d34fff0c'

def load_v12():
    s = importlib.util.spec_from_file_location('r7_v12_epoch_audit', ROOT / 'scripts/r7-v12-epoch-audit.py')
    mod = importlib.util.module_from_spec(s)
    s.loader.exec_module(mod)
    return mod

def contract():
    return json.loads((ROOT/'contracts/r7-v13-causal-reticulum.json').read_text())

def assert_graph(c):
    assert c['schema']=='ikant-r7-v13-causal-reticulum/v1'
    assert c['authority']==0 and c['product_go'] is False
    assert c['source']['v10_commit']==BASE
    seen=set()
    for row in c['nodes']:
        assert row['id'] not in seen and set(row['depends_on']) <= seen
        seen.add(row['id'])
    assert c['abstract_gate']==['P','S','L','I','O','Q']
    assert {r['id'] for r in c['nodes']}=={'P','S','L','I','O','Q','A'}
    assert c['nodes'][-1]['depends_on']==c['abstract_gate']

def git(*args):
    p=subprocess.run(['git',*args],cwd=ROOT,capture_output=True,timeout=45)
    if p.returncode:raise RuntimeError('GIT_'+':'.join(args[:2])+':'+p.stderr.decode('utf8','replace')[:140])
    return p.stdout.decode().strip()

def classify(pre,post,p,move):
    mapping={x:move(x,p) for x in pre}
    inverse={}
    for old,new in mapping.items():
        if new in inverse:raise ValueError('MAPPING_COLLISION:'+new)
        inverse[new]=old
    missing=sorted(set(mapping.values())-set(post))
    mode_drift=sorted(old for old,new in mapping.items() if new in post and pre[old][1]!=post[new][1])
    moved=sorted(old for old,new in mapping.items() if old!=new)
    content_changed=sorted(old for old,new in mapping.items() if new in post and pre[old][0]!=post[new][0])
    hist_gov=sorted(old for old in pre if old.startswith('governance/'))
    gov_changed=sorted(old for old in hist_gov if post.get(mapping[old],('?',))[0]!=pre[old][0])
    return {'mapping':mapping,'inverse':inverse,'missing':missing,'mode_drift':mode_drift,
            'moved':moved,'content_changed':content_changed,'governance_changed':gov_changed,
            'governance_paths':hist_gov,'new':sorted(set(post)-set(inverse)),
            'source_count':len(pre),'candidate_count':len(post)}

def calculate(pre=None,post=None,plan=None,*,worktree=True):
    m=load_v12()
    c=contract()
    assert_graph(c)
    plan=plan if plan is not None else json.loads((ROOT/'contracts/r7-v11-seven-root-contract.json').read_text())
    pre=pre if pre is not None else m.tree(BASE)
    post=post if post is not None else m.tree('HEAD')
    historical_exact=(pre==m.tree(BASE))
    candidate_exact=(post==m.tree('HEAD'))
    a=classify(pre,post,plan,m.move)
    baseline_roots=sorted({x.split('/')[0] for x in pre if '/' in x})
    current_roots=sorted({x.split('/')[0] for x in post if '/' in x})
    baseline_root_files=sorted(x for x in pre if '/' not in x)
    current_root_files=sorted(x for x in post if '/' not in x)
    expected_roots=sorted(plan['root_dirs']);expected_files=sorted(plan['root_files'])
    # A reversible mapping demonstrates the *cause* of path topology reduction:
    # unchanged owner directories + exactly eight relocated root domains.
    reconstructed=set(a['inverse'])
    bijective=(not a['missing'] and not a['mode_drift'] and len(a['inverse'])==len(pre) and
               set(a['mapping'])==set(pre) and reconstructed <= set(post))
    no_historic_rewrite=len(a['governance_paths'])==50 and not a['governance_changed']
    unchanged_owners=['host/c72-public-mode-admission.mjs','host/c87-durable-ledger.mjs',
                      'host/c125-output-port.mjs','project/plugins/ikant-le-session-chat/plugin.json']
    owner_drifts=[x for x in unchanged_owners if pre.get(a['inverse'].get(x,''),(None,))[0]!=post.get(x,(None,))[0]]
    # Not a proof of semantic ownership; just scoped byte invariance for known owner surfaces.
    base_pinned=(git('rev-parse',BASE+'^{tree}')==c['source']['v10_tree'])
    fresh=bool(git('status','--porcelain','--untracked-files=no')) if worktree else False
    checked=m.audit(plan=plan,old=pre,current=post,worktree=worktree)
    nodes={
       'P':bool(base_pinned and historical_exact and candidate_exact and bijective and no_historic_rewrite and not checked['errors']),
       'S':len(baseline_roots)==15 and len(current_roots)==7 and current_roots==expected_roots and
           len(baseline_root_files)==15 and len(current_root_files)==9 and current_root_files==expected_files and
           not a['missing'] and len(a['moved'])==394,
       'L':bijective and len(a['new'])>=0 and set(a['inverse'])<=set(post) and no_historic_rewrite,
       'I':False, # requires independent dynamic+static audit receipt bound to this exact HEAD
       'O':False, # original owner review and both products must be qualified independently
       'Q':False  # native suite, CORA process-run, CI and independent review
    }
    # No native, CORA or provider green may be inferred from a static tree, ever.
    errors=[]
    if not nodes['P']:errors.append('P_GIT_PROVENANCE_OR_BLOB_OR_EPOCH_INVALID')
    if not nodes['S']:errors.append('S_SEVEN_ROOT_CAUSAL_TOPOLOGY_NOT_VERIFIED')
    if not nodes['L']:errors.append('L_BIJECTION_GOVERNANCE_LOSS_OR_MODE_DRIFT')
    if not historical_exact:errors.append('HISTORICAL_INPUT_NOT_GIT_TREE')
    if not candidate_exact:errors.append('CANDIDATE_INPUT_NOT_GIT_TREE')
    if owner_drifts:errors.append('OWNER_BYTE_DRIFT:'+','.join(owner_drifts))
    if fresh:errors.append('TRACKED_WORKTREE_DIRTY')
    return {'schema':c['schema'],'head':git('rev-parse','HEAD'),'tree':git('rev-parse','HEAD^{tree}'),
      'v10_source_tree':c['source']['v10_tree'],
      'counterfactual':{'root_directories':len(baseline_roots),'root_files':len(baseline_root_files),'source_files':len(pre)},
      'candidate':{'root_directories':len(current_roots),'root_files':len(current_root_files),'files':len(post)},
      'measured_effect':{'directory_delta':len(current_roots)-len(baseline_roots),
         'root_file_delta':len(current_root_files)-len(baseline_root_files),
         'relocated_source_paths':len(a['moved']),'changed_source_blob_bytes':len(a['content_changed']),
         'new_candidate_files':len(a['new']),'lost_source_paths':len(a['missing']),
         'mode_drifts':len(a['mode_drift']),'historical_governance_bytes_changed':len(a['governance_changed'])},
      'roots':current_roots,'authority_byte_drifts_unexpected':owner_drifts,
      'four_sensitive_owner_reviews':'NOT_ATTESTED',
      'source_contraction_qualified':all(nodes[k] for k in ('P','S','L')),
      'functional_duplicate_responsibilities_reduced':'NOT_MEASURED',
      'product_equivalence':'NOT_ATTESTED',
      'nodes':{**nodes,'A':all(nodes.values())},
      'open':['I_FULL_CONSUMERS_AND_STATIC_GRAPH','O_OWNER_INDEPENDENT_REVIEW','Q_FULL_RUNTIME_CORA_AND_CI'],
      'errors':errors,'global_dod':'PASS' if all(nodes.values()) else 'HOLD',
      'product_go':False,'causal_statement':'Topology reduction causally follows one-to-one explicit move map, not demonstrated reduction of runtime responsibilities.'}

def falsify():
    mod=load_v12()
    historical=mod.tree(BASE)
    candidate=mod.tree('HEAD')
    plan=json.loads((ROOT/'contracts/r7-v11-seven-root-contract.json').read_text())
    variants=[]
    def test(name,fn):
        old={k:v for k,v in historical.items()}
        cur={k:v for k,v in candidate.items()}
        p=json.loads(json.dumps(plan))
        fn(old,cur,p)
        try:
            r=calculate(old,cur,p,worktree=False)
            rejected=not r['source_contraction_qualified']
            edge=r['errors'][0] if r['errors'] else 'STATIC_QUALIFICATION_REJECTED'
        except Exception as ex:
            rejected=True
            edge='EXCEPTION_BLOCKED:'+type(ex).__name__
        variants.append({'name':name,'rejected':rejected,'first_edge':edge})
    def change_one(old,cur,p):
        k=next(iter(cur));cur[k]=('f'*40,cur[k][1])
    def lose_one(old,cur,p):cur.pop('host/c72-public-mode-admission.mjs',None)
    def delete_gov(old,cur,p):cur.pop('contracts/governance/v5b-baseline-inventory.json',None)
    def bad_mode(old,cur,p):
        k='scripts/c96-qualify.sh';cur[k]=(cur[k][0],'100644')
    def eighth_root(old,cur,p):cur['rogue/new.mjs']=('a'*40,'100644')
    def rogue_rootfile(old,cur,p):cur['MALICIOUS.json']=('a'*40,'100644')
    def original_drift(old,cur,p):
        k='host/c72-public-mode-admission.mjs';old[k]=('f'*40,old[k][1])
    def gov_changed(old,cur,p):
        k='contracts/governance/v5b-baseline-inventory.json';cur[k]=('f'*40,cur[k][1])
    def changed_plan(old,cur,p):p['moved_roots']['governance']='src/governance'
    def duplicate_move(old,cur,p):p['moved_root_files']['C12_BOOTSTRAP_IRREDUCIBLE_LATTICE_CONTRACT.json']='BOOTSTRAP.json'
    def fake_authority(old,cur,p):p['product_go']=True
    def hidden_file(old,cur,p):cur['contracts/unknown-addition.json']=('b'*40,'100644')
    for name,fn in [('CORRUPTED_CURRENT_BLOB',change_one),('MISSING_OWNER',lose_one),
      ('MISSING_GOVERNANCE',delete_gov),('LOSS_OF_EXECUTABLE_MODE',bad_mode),
      ('EIGHTH_ROOT',eighth_root),('NEW_ROOT_FILE',rogue_rootfile),
      ('FAKE_HISTORIC_SOURCE',original_drift),('ALTER_HISTORIC_GOVERNANCE',gov_changed),
      ('RELOCATION_PLAN_CHANGED',changed_plan),('MAPPING_COLLISION',duplicate_move),
      ('FORGED_PRODUCT_AUTHORITY',fake_authority),('UNDECLARED_ADDITION',hidden_file)]:
        test(name,fn)
    return {'schema':'ikant-r7-v13-falsification/v1','cases':len(variants),
       'rejected':sum(x['rejected'] for x in variants),'results':variants,
       'authority':0,'product_go':False,'scope':'FINITE_IN_MEMORY_NOT_RUNTIME_EQUIVALENCE'}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--output');ap.add_argument('--require-global',action='store_true')
    ap.add_argument('--falsify',action='store_true')
    a=ap.parse_args()
    if a.falsify:
        r=falsify()
        print(json.dumps(r,indent=2,sort_keys=True))
        return 0 if r['rejected']==r['cases'] else 21
    try:
        receipt=calculate()
        out=json.dumps(receipt,sort_keys=True,indent=2)+'\n'
        if a.output:pathlib.Path(a.output).write_text(out)
        else:print(out)
        return 20 if a.require_global or receipt['errors'] else 0
    except Exception as ex:
        print(json.dumps({'status':'BLOCKED','first_edge':str(ex),'product_go':False}),file=sys.stderr)
        return 21
if __name__=='__main__':sys.exit(main())
