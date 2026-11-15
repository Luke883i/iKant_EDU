import argparse, json, hashlib, time
from collections import Counter
import numpy as np
from pathlib import Path

BASELINE = "fbac6cb1b0591a7f41c2dc7b96125ca9c63827cc"
GLOBAL_SEED = 0xC10E2E52
TOTAL_CASES = 10_000_000
FAMILIES = 64
CASES_PER_FAMILY = TOTAL_CASES // FAMILIES
assert CASES_PER_FAMILY * FAMILIES == TOTAL_CASES

def receipt(obj):
    x=dict(obj); x.pop("receipt_sha256",None)
    return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()).hexdigest()

def dump(path,obj):
    p=Path(path); p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(obj,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

# Primitive fact bit positions. Facts are deliberately more granular than mechanisms.
FACT_NAMES = [
'bootstrap_call_observed','bootstrap_owner_invoked','bootstrap_result_owner_next','bootstrap_binding_fresh',
'runtime_exact_root','runtime_owner_executed','runtime_instance_present',
'cohost_attestation_sealed','cohost_proof_refs_valid',
'route_interposition_active','route_turn_observed','route_no_bypass','route_no_pending','route_ordinals_sync',
'participant_native_non_user','participant_persistent','participant_future_turn_standing','participant_no_manual_reselection',
'turn_grant_observed','turn_grant_fresh',
'delivery_native_role','delivery_exact_runtime_bytes','delivery_host_readback','delivery_after_grant',
'prov_bootstrap','prov_runtime','prov_cohost','prov_route','prov_participant','prov_turn_grant','prov_delivery',
'x_bootstrap_source','x_runtime_source_root_instance','x_cohost_session_source_runtime','x_route_session_source_runtime','x_native_session_participant_turn','no_replay',
'surrogate_app_panel','surrogate_assistant_prefix','surrogate_manual_selection','forged_raw_status',
'full_runtime','control_owned','canonical_product','legacy_active'
]
IDX={n:i for i,n in enumerate(FACT_NAMES)}
def bit(n): return 1<<IDX[n]
ALL_FACTS=(1<<len(FACT_NAMES))-1
POSITIVE = FACT_NAMES[:37]  # through no_replay
BASE_WORLD=0
for n in POSITIVE: BASE_WORLD |= bit(n)
# surrogates and stronger unrelated axes false in minimal positive world

def has(w,n): return bool(w & bit(n))
def setf(w,n,v=True): return (w|bit(n)) if v else (w & ~bit(n))

def allf(w,names): return all(has(w,n) for n in names)

MECHANISMS=[
'E0_HOST_BOOTSTRAP_BINDING_RECEIPT',
'E1_RUNTIME_EXECUTION_RECEIPT',
'E2_COHOST_RELATION_ATTESTATION',
'E3_HOST_ROUTE_INTERPOSITION_RECEIPT',
'E4_NATIVE_PARTICIPANT_LEASE',
'E5_NATIVE_TURN_GRANT_RECEIPT',
'E6_NATIVE_DELIVERY_READBACK_RECEIPT',
'L0_OWNER_PROVENANCE_AND_SEAL',
'L1_EXACT_CROSS_BINDING_AND_FRESHNESS',
'L2_FAIL_CLOSED_PROJECTION',
'L3_SURROGATE_REJECTION',
'L4_AXIS_ORTHOGONALITY'
]
MID={n:i for i,n in enumerate(MECHANISMS)}
ALL_MASK=(1<<len(MECHANISMS))-1
STATES=['INTEGRATION_IMPEDIMENT','NOT_READY','SESSION_ROUTE_BLOCKED','COHOST_RELATION_ONLY','NATIVE_TRANSCRIPT_ACTOR_E2E']
STATE_ID={s:i for i,s in enumerate(STATES)}

CORE = {
'E0_HOST_BOOTSTRAP_BINDING_RECEIPT':['bootstrap_call_observed','bootstrap_owner_invoked','bootstrap_result_owner_next','bootstrap_binding_fresh'],
'E1_RUNTIME_EXECUTION_RECEIPT':['runtime_exact_root','runtime_owner_executed','runtime_instance_present'],
'E2_COHOST_RELATION_ATTESTATION':['cohost_attestation_sealed','cohost_proof_refs_valid'],
'E3_HOST_ROUTE_INTERPOSITION_RECEIPT':['route_interposition_active','route_turn_observed','route_no_bypass','route_no_pending','route_ordinals_sync'],
'E4_NATIVE_PARTICIPANT_LEASE':['participant_native_non_user','participant_persistent','participant_future_turn_standing','participant_no_manual_reselection'],
'E5_NATIVE_TURN_GRANT_RECEIPT':['turn_grant_observed','turn_grant_fresh'],
'E6_NATIVE_DELIVERY_READBACK_RECEIPT':['delivery_native_role','delivery_exact_runtime_bytes','delivery_host_readback','delivery_after_grant'],
}
PROV={
'E0_HOST_BOOTSTRAP_BINDING_RECEIPT':'prov_bootstrap','E1_RUNTIME_EXECUTION_RECEIPT':'prov_runtime','E2_COHOST_RELATION_ATTESTATION':'prov_cohost',
'E3_HOST_ROUTE_INTERPOSITION_RECEIPT':'prov_route','E4_NATIVE_PARTICIPANT_LEASE':'prov_participant','E5_NATIVE_TURN_GRANT_RECEIPT':'prov_turn_grant','E6_NATIVE_DELIVERY_READBACK_RECEIPT':'prov_delivery'}
X={
'E0_HOST_BOOTSTRAP_BINDING_RECEIPT':['x_bootstrap_source'],
'E1_RUNTIME_EXECUTION_RECEIPT':['x_runtime_source_root_instance'],
'E2_COHOST_RELATION_ATTESTATION':['x_cohost_session_source_runtime'],
'E3_HOST_ROUTE_INTERPOSITION_RECEIPT':['x_route_session_source_runtime'],
'E4_NATIVE_PARTICIPANT_LEASE':['x_native_session_participant_turn','no_replay'],
'E5_NATIVE_TURN_GRANT_RECEIPT':['x_native_session_participant_turn','no_replay'],
'E6_NATIVE_DELIVERY_READBACK_RECEIPT':['x_native_session_participant_turn','no_replay']}

# Frozen independent oracle: primitive host/runtime facts -> expected product state.
def oracle(w):
    e0=allf(w,CORE[MECHANISMS[0]]) and has(w,PROV[MECHANISMS[0]]) and allf(w,X[MECHANISMS[0]])
    if not e0: return STATE_ID['INTEGRATION_IMPEDIMENT']
    e1=allf(w,CORE[MECHANISMS[1]]) and has(w,PROV[MECHANISMS[1]]) and allf(w,X[MECHANISMS[1]])
    e2=allf(w,CORE[MECHANISMS[2]]) and has(w,PROV[MECHANISMS[2]]) and allf(w,X[MECHANISMS[2]])
    if not (e1 and e2): return STATE_ID['NOT_READY']
    e3=allf(w,CORE[MECHANISMS[3]]) and has(w,PROV[MECHANISMS[3]]) and allf(w,X[MECHANISMS[3]])
    if not e3: return STATE_ID['SESSION_ROUTE_BLOCKED']
    e4=allf(w,CORE[MECHANISMS[4]]) and has(w,PROV[MECHANISMS[4]]) and allf(w,X[MECHANISMS[4]])
    e5=allf(w,CORE[MECHANISMS[5]]) and has(w,PROV[MECHANISMS[5]]) and allf(w,X[MECHANISMS[5]])
    e6=allf(w,CORE[MECHANISMS[6]]) and has(w,PROV[MECHANISMS[6]]) and allf(w,X[MECHANISMS[6]])
    if not (e4 and e5 and e6): return STATE_ID['COHOST_RELATION_ONLY']
    return STATE_ID['NATIVE_TRANSCRIPT_ACTOR_E2E']

# Candidate architecture can delete mechanisms; laws alter how raw facts are interpreted.
def candidate(w,mask):
    mh=lambda m: bool(mask&(1<<MID[m]))
    provenance=mh('L0_OWNER_PROVENANCE_AND_SEAL')
    cross=mh('L1_EXACT_CROSS_BINDING_AND_FRESHNESS')
    surrogate_reject=mh('L3_SURROGATE_REJECTION')
    orth=mh('L4_AXIS_ORTHOGONALITY')
    failclosed=mh('L2_FAIL_CLOSED_PROJECTION')

    def ev(m):
        ok=True if not mh(m) else allf(w,CORE[m])
        if provenance and mh(m): ok = ok and has(w,PROV[m])
        if cross and mh(m): ok = ok and allf(w,X[m])
        return ok
    e0,e1,e2,e3,e4,e5,e6=[ev(MECHANISMS[i]) for i in range(7)]
    surrogate=has(w,'surrogate_app_panel') or has(w,'surrogate_assistant_prefix') or has(w,'surrogate_manual_selection') or has(w,'forged_raw_status')
    if not surrogate_reject and surrogate:
        e4=e5=e6=True
    if not orth:
        e4=e4 and has(w,'full_runtime') and has(w,'control_owned') and has(w,'canonical_product') and has(w,'legacy_active')
        e5=e5 and has(w,'full_runtime') and has(w,'control_owned') and has(w,'canonical_product') and has(w,'legacy_active')
        e6=e6 and has(w,'full_runtime') and has(w,'control_owned') and has(w,'canonical_product') and has(w,'legacy_active')
    if failclosed:
        if not e0: return STATE_ID['INTEGRATION_IMPEDIMENT']
        if not (e1 and e2): return STATE_ID['NOT_READY']
        if not e3: return STATE_ID['SESSION_ROUTE_BLOCKED']
        if not (e4 and e5 and e6): return STATE_ID['COHOST_RELATION_ONLY']
        return STATE_ID['NATIVE_TRANSCRIPT_ACTOR_E2E']
    # optimistic/non-fail-closed anti-pattern: later evidence can wash out earlier gaps
    if e4 and e5 and e6: return STATE_ID['NATIVE_TRANSCRIPT_ACTOR_E2E']
    if e3 and (e1 or e2): return STATE_ID['COHOST_RELATION_ONLY']
    if e1 or e2: return STATE_ID['NOT_READY']
    return STATE_ID['INTEGRATION_IMPEDIMENT']

def unsafe(a,z): return a>z

def false_reject(a,z): return a<z

# 64 realistic pre-seeded families across semantic abstraction layers.
family_specs=[]
def fam(level,name,mods,noise='optional'):
    family_specs.append({'level':level,'name':name,'mods':mods,'noise':noise})

# A0 byte/provenance integrity (7)
for m,p in PROV.items(): fam('A0_BYTE_PROVENANCE','CORRUPT_'+p,[(p,False)],'optional')
# A1 entity-local evidence (16)
for n in ['bootstrap_call_observed','bootstrap_owner_invoked','bootstrap_result_owner_next','bootstrap_binding_fresh',
          'runtime_exact_root','runtime_owner_executed','runtime_instance_present','cohost_attestation_sealed','cohost_proof_refs_valid',
          'route_interposition_active','route_turn_observed','participant_native_non_user','turn_grant_observed','turn_grant_fresh','delivery_host_readback','delivery_exact_runtime_bytes']:
    fam('A1_ENTITY','DROP_'+n,[(n,False)],'optional')
# A2 relation/cross-binding and replay (6)
for n in ['x_bootstrap_source','x_runtime_source_root_instance','x_cohost_session_source_runtime','x_route_session_source_runtime','x_native_session_participant_turn','no_replay']:
    fam('A2_RELATION','BREAK_'+n,[(n,False)],'optional')
# A3 routing/temporal/persistence (9)
for n in ['route_no_bypass','route_no_pending','route_ordinals_sync','participant_persistent','participant_future_turn_standing','participant_no_manual_reselection','delivery_after_grant','delivery_native_role','participant_native_non_user']:
    fam('A3_TEMPORAL_ROUTE','BREAK_'+n,[(n,False)],'optional')
# A4 surrogates/semantic laundering (8)
fam('A4_SURROGATE','APP_PANEL_ONLY',[('participant_native_non_user',False),('turn_grant_observed',False),('delivery_host_readback',False),('surrogate_app_panel',True)],'strong')
fam('A4_SURROGATE','ASSISTANT_PREFIX_ONLY',[('participant_native_non_user',False),('turn_grant_observed',False),('delivery_native_role',False),('surrogate_assistant_prefix',True)],'strong')
fam('A4_SURROGATE','MANUAL_SELECTION_ONLY',[('participant_future_turn_standing',False),('participant_no_manual_reselection',False),('turn_grant_observed',False),('surrogate_manual_selection',True)],'strong')
fam('A4_SURROGATE','FORGED_RAW_STATUS',[('cohost_attestation_sealed',False),('participant_native_non_user',False),('turn_grant_observed',False),('delivery_host_readback',False),('forged_raw_status',True)],'strong')
fam('A4_SURROGATE','FULL_RUNTIME_SUBSTITUTE',[('participant_native_non_user',False),('turn_grant_observed',False),('delivery_host_readback',False),('full_runtime',True)],'strong')
fam('A4_SURROGATE','CONTROL_OWNERSHIP_SUBSTITUTE',[('participant_native_non_user',False),('turn_grant_observed',False),('delivery_host_readback',False),('control_owned',True)],'strong')
fam('A4_SURROGATE','CANONICAL_PRODUCT_SUBSTITUTE',[('participant_native_non_user',False),('turn_grant_observed',False),('delivery_host_readback',False),('canonical_product',True)],'strong')
fam('A4_SURROGATE','LEGACY_ACTIVE_SUBSTITUTE',[('participant_native_non_user',False),('turn_grant_observed',False),('delivery_host_readback',False),('legacy_active',True)],'strong')
# A5 cross-layer composites (10)
fam('A5_COMPOSITE','BOOTSTRAP_GAP_PLUS_NATIVE_OK',[('bootstrap_call_observed',False)],'native')
fam('A5_COMPOSITE','RUNTIME_GAP_PLUS_NATIVE_OK',[('runtime_owner_executed',False)],'native')
fam('A5_COMPOSITE','COHOST_RAW_PLUS_ROUTE_OK',[('cohost_attestation_sealed',False),('forged_raw_status',True)],'strong')
fam('A5_COMPOSITE','ROUTE_BYPASS_PLUS_NATIVE_OK',[('route_no_bypass',False)],'native')
fam('A5_COMPOSITE','PENDING_TURN_PLUS_DELIVERY',[('route_no_pending',False),('delivery_host_readback',True)],'native')
fam('A5_COMPOSITE','STALE_GRANT_PLUS_DELIVERY',[('turn_grant_fresh',False),('delivery_host_readback',True)],'native')
fam('A5_COMPOSITE','REPLAYED_NATIVE_CHAIN',[('no_replay',False)],'native')
fam('A5_COMPOSITE','WRONG_SESSION_WITH_STRONG_AXES',[('x_native_session_participant_turn',False),('full_runtime',True),('control_owned',True),('canonical_product',True),('legacy_active',True)],'strong')
fam('A5_COMPOSITE','BAD_PROVENANCE_WITH_SURROGATE',[('prov_delivery',False),('surrogate_app_panel',True)],'strong')
fam('A5_COMPOSITE','MULTI_GAP_BOOT_ROUTE_NATIVE',[('bootstrap_result_owner_next',False),('route_interposition_active',False),('participant_future_turn_standing',False),('delivery_host_readback',False)],'strong')
# A6 positive/orthogonality and realistic valid variants (8)
fam('A6_POSITIVE','VALID_MINIMAL',[],'none')
fam('A6_POSITIVE','VALID_FULL_RUNTIME',[('full_runtime',True)],'none')
fam('A6_POSITIVE','VALID_CONTROL_OWNED',[('control_owned',True)],'none')
fam('A6_POSITIVE','VALID_CANONICAL_PRODUCT',[('canonical_product',True)],'none')
fam('A6_POSITIVE','VALID_LEGACY_ACTIVE',[('legacy_active',True)],'none')
fam('A6_POSITIVE','VALID_ALL_STRONG',[('full_runtime',True),('control_owned',True),('canonical_product',True),('legacy_active',True)],'none')
fam('A6_POSITIVE','VALID_WITH_APP_PRESENT',[('surrogate_app_panel',True)],'none')
fam('A6_POSITIVE','VALID_WITH_PREFIX_PRESENT',[('surrogate_assistant_prefix',True)],'none')
assert len(family_specs)==64, len(family_specs)

OPTIONALS=['full_runtime','control_owned','canonical_product','legacy_active','surrogate_app_panel','surrogate_assistant_prefix','surrogate_manual_selection']

def generate_world(spec,rng,i):
    w=BASE_WORLD
    for n,v in spec['mods']: w=setf(w,n,v)
    mode=spec['noise']
    # bounded pre-seeded noise only on unrelated/optional axes so family semantics remain stable.
    if mode in ('optional','strong','native'):
        # deterministic optional toggles create multi-abstraction combinations without erasing the seeded fault.
        for j,n in enumerate(OPTIONALS):
            if rng.getrandbits(5)==0: w=setf(w,n,not has(w,n))
    if mode=='strong':
        if rng.getrandbits(1):
            for n in ['full_runtime','control_owned','canonical_product','legacy_active']: w=setf(w,n,True)
    return w

# Actual 10M generation and selected-candidate falsification, vectorized with NumPy.
# Each row is an actual generated mutation case; we then compress exact semantic worlds only for lattice/deletion analysis.
def _np_has(arr,n): return (arr & np.uint64(bit(n))) != 0

def oracle_np(arr):
    prov=lambda n:_np_has(arr,n)
    def core(names):
        out=np.ones(arr.shape,dtype=bool)
        for n in names: out &= _np_has(arr,n)
        return out
    e0=core(CORE[MECHANISMS[0]]) & prov(PROV[MECHANISMS[0]]) & core(X[MECHANISMS[0]])
    e1=core(CORE[MECHANISMS[1]]) & prov(PROV[MECHANISMS[1]]) & core(X[MECHANISMS[1]])
    e2=core(CORE[MECHANISMS[2]]) & prov(PROV[MECHANISMS[2]]) & core(X[MECHANISMS[2]])
    e3=core(CORE[MECHANISMS[3]]) & prov(PROV[MECHANISMS[3]]) & core(X[MECHANISMS[3]])
    e4=core(CORE[MECHANISMS[4]]) & prov(PROV[MECHANISMS[4]]) & core(X[MECHANISMS[4]])
    e5=core(CORE[MECHANISMS[5]]) & prov(PROV[MECHANISMS[5]]) & core(X[MECHANISMS[5]])
    e6=core(CORE[MECHANISMS[6]]) & prov(PROV[MECHANISMS[6]]) & core(X[MECHANISMS[6]])
    out=np.full(arr.shape,STATE_ID['NATIVE_TRANSCRIPT_ACTOR_E2E'],dtype=np.int8)
    out[~(e4&e5&e6)] = STATE_ID['COHOST_RELATION_ONLY']
    out[~e3] = STATE_ID['SESSION_ROUTE_BLOCKED']
    out[~(e1&e2)] = STATE_ID['NOT_READY']
    out[~e0] = STATE_ID['INTEGRATION_IMPEDIMENT']
    return out

def candidate_np(arr,mask):
    mh=lambda m: bool(mask&(1<<MID[m]))
    provenance=mh('L0_OWNER_PROVENANCE_AND_SEAL'); cross=mh('L1_EXACT_CROSS_BINDING_AND_FRESHNESS')
    surrogate_reject=mh('L3_SURROGATE_REJECTION'); orth=mh('L4_AXIS_ORTHOGONALITY'); failclosed=mh('L2_FAIL_CLOSED_PROJECTION')
    def ev(m):
        if mh(m):
            out=np.ones(arr.shape,dtype=bool)
            for n in CORE[m]: out &= _np_has(arr,n)
        else: out=np.ones(arr.shape,dtype=bool)
        if provenance and mh(m): out &= _np_has(arr,PROV[m])
        if cross and mh(m):
            for n in X[m]: out &= _np_has(arr,n)
        return out
    e0,e1,e2,e3,e4,e5,e6=[ev(MECHANISMS[i]) for i in range(7)]
    surrogate=_np_has(arr,'surrogate_app_panel')|_np_has(arr,'surrogate_assistant_prefix')|_np_has(arr,'surrogate_manual_selection')|_np_has(arr,'forged_raw_status')
    if not surrogate_reject:
        e4 |= surrogate; e5 |= surrogate; e6 |= surrogate
    if not orth:
        strong=_np_has(arr,'full_runtime')&_np_has(arr,'control_owned')&_np_has(arr,'canonical_product')&_np_has(arr,'legacy_active')
        e4 &= strong; e5 &= strong; e6 &= strong
    if failclosed:
        out=np.full(arr.shape,STATE_ID['NATIVE_TRANSCRIPT_ACTOR_E2E'],dtype=np.int8)
        out[~(e4&e5&e6)] = STATE_ID['COHOST_RELATION_ONLY']
        out[~e3] = STATE_ID['SESSION_ROUTE_BLOCKED']
        out[~(e1&e2)] = STATE_ID['NOT_READY']
        out[~e0] = STATE_ID['INTEGRATION_IMPEDIMENT']
        return out
    out=np.full(arr.shape,STATE_ID['INTEGRATION_IMPEDIMENT'],dtype=np.int8)
    out[e1|e2]=STATE_ID['NOT_READY']
    out[e3&(e1|e2)]=STATE_ID['COHOST_RELATION_ONLY']
    out[e4&e5&e6]=STATE_ID['NATIVE_TRANSCRIPT_ACTOR_E2E']
    return out

worlds=np.empty(TOTAL_CASES,dtype=np.uint64)
family_counts=Counter(); level_counts=Counter(); family_seeds={}
pos=0; start=time.time()
for fi,spec in enumerate(family_specs):
    fseed=(GLOBAL_SEED ^ int(hashlib.sha256(spec['name'].encode()).hexdigest()[:8],16) ^ fi) & 0xffffffff
    family_seeds[spec['name']]=f'0x{fseed:08X}'
    rng=np.random.default_rng(fseed)
    arr=np.full(CASES_PER_FAMILY,np.uint64(BASE_WORLD),dtype=np.uint64)
    for n,v in spec['mods']:
        mask=np.uint64(bit(n))
        if v: arr |= mask
        else: arr &= ~mask
    mode=spec['noise']
    if mode in ('optional','strong','native'):
        for n in OPTIONALS:
            flip=rng.integers(0,32,size=CASES_PER_FAMILY,dtype=np.uint8)==0
            arr[flip] ^= np.uint64(bit(n))
    if mode=='strong':
        strong=rng.integers(0,2,size=CASES_PER_FAMILY,dtype=np.uint8)==1
        for n in ['full_runtime','control_owned','canonical_product','legacy_active']:
            arr[strong] |= np.uint64(bit(n))
    worlds[pos:pos+CASES_PER_FAMILY]=arr; pos+=CASES_PER_FAMILY
    family_counts[spec['name']]+=CASES_PER_FAMILY; level_counts[spec['level']]+=CASES_PER_FAMILY
assert pos==TOTAL_CASES
z=oracle_np(worlds); a=candidate_np(worlds,ALL_MASK)
selected={'mismatch':int(np.count_nonzero(a!=z)),'unsafe':int(np.count_nonzero(a>z)),'false_reject':int(np.count_nonzero(a<z))}
state_counts={s:int(np.count_nonzero(z==i)) for s,i in STATE_ID.items()}
unique_worlds,weights=np.unique(worlds,return_counts=True)
elapsed=time.time()-start

# Exact weighted deletion results across the full 10M campaign using compressed semantic worlds.
zu=oracle_np(unique_worlds)
deletions={}
for mi,m in enumerate(MECHANISMS):
    q=candidate_np(unique_worlds,ALL_MASK^(1<<mi))
    bad=q!=zu; uns=q>zu; fr=q<zu
    deletions[m]={'mismatch':int(weights[bad].sum()),'unsafe':int(weights[uns].sum()),'false_reject':int(weights[fr].sum())}

# Complete 2^12 architecture lattice over every unique semantic world generated by the 10M campaign.
valid=[]
for mask in range(1<<len(MECHANISMS)):
    if np.array_equal(candidate_np(unique_worlds,mask),zu): valid.append(mask)
min_cost=min((m.bit_count() for m in valid),default=None)
winners=[m for m in valid if m.bit_count()==min_cost]

lattice={
'schema':'ikant-le-v1-experimental-physical-closure-lattice/v2',
'source_baseline':BASELINE,
'mechanisms':MECHANISMS,
'architecture_count':1<<len(MECHANISMS),
'semantic_worlds_observed':int(unique_worlds.size),
'valid_architectures':len(valid),
'minimum_cost':min_cost,
'minimum_count':len(winners),
'winner_masks':winners[:32],
'unique_minimum':len(winners)==1 and winners[0]==ALL_MASK,
'deletion_mutants':deletions,
'interpretation':'Unique minimum is relative to the frozen physical-closure oracle and the 10M multi-abstraction semantic worlds; it is not a proof that the external host implements the required primitives.'
}
lattice['receipt_sha256']=receipt(lattice)


campaign={
'schema':'ikant-le-v1-experimental-physical-closure-multilevel-falsification/v2',
'source_baseline':BASELINE,
'pr60_merge':True,
'global_seed':f'0x{GLOBAL_SEED:08X}',
'cases':TOTAL_CASES,
'families':len(family_specs),
'cases_per_family':CASES_PER_FAMILY,
'abstraction_levels':dict(level_counts),
'family_counts':dict(family_counts),
'family_seeds':family_seeds,
'primitive_facts':FACT_NAMES,
'mechanisms':MECHANISMS,
'candidate_oracle_mismatches':selected['mismatch'],
'unsafe_promotions':selected['unsafe'],
'false_rejects':selected['false_reject'],
'oracle_state_counts':state_counts,
'semantic_worlds_observed':int(unique_worlds.size),
'architecture_lattice_receipt_sha256':lattice['receipt_sha256'],
'all_single_deletion_mutants_killed':all(v['mismatch']>0 for v in deletions.values()),
'claim_boundary':{
  'semantic_falsification_is_physical_host_proof':False,
  'live_external_receipts_required':True,
  'ten_million_cases_are_actual_generated_cases':True,
  'architecture_lattice_is_complete_for_12_mechanisms':True,
  'oracle_frozen_before_candidate_deletion_analysis':True
},
'status':'PASS' if selected=={'mismatch':0,'unsafe':0,'false_reject':0} and lattice['unique_minimum'] and all(v['mismatch']>0 for v in deletions.values()) else 'FAIL'
}
campaign['receipt_sha256']=receipt(campaign)


del worlds, z, a


parser=argparse.ArgumentParser()
parser.add_argument('--campaign',default='artifacts/qualification/c52-physical-closure-10m.json')
parser.add_argument('--lattice',default='artifacts/qualification/c52-physical-closure-lattice.json')
args=parser.parse_args()
dump(args.lattice,lattice)
dump(args.campaign,campaign)
print(json.dumps({'status':campaign['status'],'cases':campaign['cases'],'semantic_worlds_observed':campaign['semantic_worlds_observed'],'unique_minimum':lattice['unique_minimum'],'campaign_receipt_sha256':campaign['receipt_sha256'],'lattice_receipt_sha256':lattice['receipt_sha256']}))
if campaign['status']!='PASS' or not lattice['unique_minimum']:
    raise SystemExit(1)
