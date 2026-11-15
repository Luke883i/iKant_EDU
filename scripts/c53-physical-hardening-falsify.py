import argparse, hashlib, json
from collections import Counter
from pathlib import Path
import numpy as np

TOTAL=10_000_000
FAMILIES=64
PER=TOTAL//FAMILIES
SEED=0xC53A11D7
BASELINE="fcc1d67cb26b96ddb0f33e1a2ec5532f3a95e2e5"

MECH=[
"E0","E1","E2","E3","E4","E5","E6",
"L0","L1","L2","L3","L4",
"H0_BOOTSTRAP_SESSION_BINDING","H1_PREEXEC_ROUTE_SESSION_BINDING","H2_NATIVE_COMMON_CONTRACT_ANCHOR",
"H3_HOST_RUNTIME_TURN_SEAL","H4_DERIVED_PROOF_RECOMPUTATION"
]
MID={m:i for i,m in enumerate(MECH)}
ALL=(1<<len(MECH))-1
PARENT=(1<<12)-1
STATES=["INTEGRATION_IMPEDIMENT","NOT_READY","SESSION_ROUTE_BLOCKED","COHOST_RELATION_ONLY","NATIVE_TRANSCRIPT_ACTOR_E2E"]
SID={s:i for i,s in enumerate(STATES)}

FACTS=[
"e0","e1","e2","e3","e4","e5","e6",
"l0","l1","l2","l3","l4",
"bootstrap_session_match","route_session_match_preexec","native_common_anchor",
"host_runtime_turn_match","derived_proof_recomputed",
"surrogate","strong_axes"
]
IDX={n:i for i,n in enumerate(FACTS)}
def bit(n): return np.uint32(1<<IDX[n])
BASE=np.uint32(0)
for n in FACTS[:17]: BASE|=bit(n)
def has(a,n): return (a & bit(n))!=0

def oracle(a):
    e0=has(a,"e0")&has(a,"l0")&has(a,"l1")&has(a,"bootstrap_session_match")
    e1=has(a,"e1")&has(a,"l0")&has(a,"l1")
    e2=has(a,"e2")&has(a,"l0")&has(a,"l1")
    e3=has(a,"e3")&has(a,"l0")&has(a,"l1")&has(a,"route_session_match_preexec")
    e4=has(a,"e4")&has(a,"l0")&has(a,"l1")
    e5=has(a,"e5")&has(a,"l0")&has(a,"l1")
    e6=has(a,"e6")&has(a,"l0")&has(a,"l1")&has(a,"native_common_anchor")&has(a,"host_runtime_turn_match")
    state=np.full(a.shape,SID["NATIVE_TRANSCRIPT_ACTOR_E2E"],dtype=np.int8)
    state[~(e4&e5&e6)]=SID["COHOST_RELATION_ONLY"]
    state[~e3]=SID["SESSION_ROUTE_BLOCKED"]
    state[~(e1&e2)]=SID["NOT_READY"]
    state[~e0]=SID["INTEGRATION_IMPEDIMENT"]
    global_proof=(state==SID["NATIVE_TRANSCRIPT_ACTOR_E2E"])&has(a,"derived_proof_recomputed")
    return state,global_proof

def candidate(a,mask):
    hm=lambda m: bool(mask&(1<<MID[m]))
    def ev(n): return has(a,n) if hm(n.upper()) else np.ones(a.shape,dtype=bool)
    e0,e1,e2,e3,e4,e5,e6=[ev("e"+str(i)) for i in range(7)]
    if hm("L0"):
        p=has(a,"l0");e0&=p;e1&=p;e2&=p;e3&=p;e4&=p;e5&=p;e6&=p
    if hm("L1"):
        x=has(a,"l1");e0&=x;e1&=x;e2&=x;e3&=x;e4&=x;e5&=x;e6&=x
    if hm("H0_BOOTSTRAP_SESSION_BINDING"): e0&=has(a,"bootstrap_session_match")
    if hm("H1_PREEXEC_ROUTE_SESSION_BINDING"): e3&=has(a,"route_session_match_preexec")
    if hm("H2_NATIVE_COMMON_CONTRACT_ANCHOR"): e6&=has(a,"native_common_anchor")
    if hm("H3_HOST_RUNTIME_TURN_SEAL"): e6&=has(a,"host_runtime_turn_match")
    if not hm("L3"):
        s=has(a,"surrogate");e4|=s;e5|=s;e6|=s
    if not hm("L4"):
        strong=has(a,"strong_axes");e4&=strong;e5&=strong;e6&=strong
    if hm("L2"):
        state=np.full(a.shape,SID["NATIVE_TRANSCRIPT_ACTOR_E2E"],dtype=np.int8)
        state[~(e4&e5&e6)]=SID["COHOST_RELATION_ONLY"]
        state[~e3]=SID["SESSION_ROUTE_BLOCKED"]
        state[~(e1&e2)]=SID["NOT_READY"]
        state[~e0]=SID["INTEGRATION_IMPEDIMENT"]
    else:
        state=np.full(a.shape,SID["INTEGRATION_IMPEDIMENT"],dtype=np.int8)
        state[e1|e2]=SID["NOT_READY"]
        state[e3&(e1|e2)]=SID["COHOST_RELATION_ONLY"]
        state[e4&e5&e6]=SID["NATIVE_TRANSCRIPT_ACTOR_E2E"]
    global_proof=(state==SID["NATIVE_TRANSCRIPT_ACTOR_E2E"])
    if hm("H4_DERIVED_PROOF_RECOMPUTATION"): global_proof &= has(a,"derived_proof_recomputed")
    return state,global_proof

families=[]
def fam(level,name,mods,noise="none"): families.append((level,name,mods,noise))
for n in ["e0","e1","e2","e3","e4","e5","e6","l0","l1","l2","l3","l4"]:
    fam("PARENT_DELETE","DROP_"+n.upper(),[(n,False)])
fam("SESSION","BOOTSTRAP_CROSS_SESSION_REPLAY",[("bootstrap_session_match",False)],"strong")
fam("SESSION","ROUTE_WRONG_SESSION_PREEXEC",[("route_session_match_preexec",False)],"native")
fam("NATIVE","DELIVERY_NOT_COMMON_CONTRACT",[("native_common_anchor",False)],"native")
fam("TURN","HOST_RUNTIME_TURN_DRIFT",[("host_runtime_turn_match",False)],"native")
fam("DERIVED","FORGED_DERIVED_STATUS_BYPASS",[("derived_proof_recomputed",False)],"strong")
fam("COMPOSITE","BOOT_SESSION_PLUS_NATIVE_OK",[("bootstrap_session_match",False)],"native")
fam("COMPOSITE","ROUTE_SESSION_PLUS_NATIVE_OK",[("route_session_match_preexec",False)],"native")
fam("COMPOSITE","NATIVE_ANCHOR_PLUS_STRONG",[("native_common_anchor",False),("strong_axes",True)],"strong")
fam("COMPOSITE","TURN_DRIFT_PLUS_DELIVERY",[("host_runtime_turn_match",False)],"native")
fam("COMPOSITE","FORGED_DERIVED_BYPASS_PLUS_STRONG",[("derived_proof_recomputed",False),("strong_axes",True)],"strong")
fam("COMPOSITE","ALL_HARDENING_GAPS",[("bootstrap_session_match",False),("route_session_match_preexec",False),("native_common_anchor",False),("host_runtime_turn_match",False),("derived_proof_recomputed",False)],"strong")
fam("SURROGATE","SURROGATE_WITH_NATIVE_GAP",[("e4",False),("e5",False),("e6",False),("surrogate",True)],"strong")
fam("ORTHOGONAL","VALID_MINIMAL",[])
fam("ORTHOGONAL","VALID_STRONG",[("strong_axes",True)])
for n in ["e0","e1","e2","e3","e4","e5","e6"]:
    fam("PAIR","PAIR_"+n.upper()+"_BOOT_SESSION",[(n,False),("bootstrap_session_match",False)],"strong")
for n in ["e0","e1","e2","e3","e4","e5","e6"]:
    fam("PAIR","PAIR_"+n.upper()+"_ROUTE_SESSION",[(n,False),("route_session_match_preexec",False)],"native")
for n in ["e4","e5","e6"]:
    fam("PAIR","PAIR_"+n.upper()+"_NATIVE_ANCHOR",[(n,False),("native_common_anchor",False)],"native")
fam("PAIR","PAIR_E6_TURN_BIND",[("e6",False),("host_runtime_turn_match",False)],"native")
fam("PAIR","PAIR_L0_DERIVED_SEAL",[("l0",False),("derived_proof_recomputed",False)],"strong")
while len(families)<64:
    i=len(families);fam("RANDOM",f"RANDOM_{i}",[],["none","strong","native"][i%3])
assert len(families)==64

worlds=np.empty(TOTAL,dtype=np.uint32);counts=Counter();levels=Counter();pos=0
for i,(level,name,mods,noise) in enumerate(families):
    fseed=(SEED ^ int(hashlib.sha256(name.encode()).hexdigest()[:8],16) ^ i)&0xffffffff
    rng=np.random.default_rng(fseed);a=np.full(PER,BASE,dtype=np.uint32)
    for n,v in mods:
        if v:a|=bit(n)
        else:a&=~bit(n)
    if noise=="strong":
        flip=rng.integers(0,2,size=PER,dtype=np.uint8)==1;a[flip]|=bit("strong_axes")
    if noise=="native":
        flip=rng.integers(0,32,size=PER,dtype=np.uint8)==0;a[flip]|=bit("surrogate")
    if level=="RANDOM":
        for n in FACTS[:17]:
            flip=rng.integers(0,64,size=PER,dtype=np.uint8)==0;a[flip]^=bit(n)
    worlds[pos:pos+PER]=a;pos+=PER;counts[name]+=PER;levels[level]+=PER

zs,zg=oracle(worlds);ps,pg=candidate(worlds,PARENT);hs,hg=candidate(worlds,ALL)
def stats(s,g):
    state_bad=s!=zs;global_bad=g!=zg
    return {"mismatch":int(np.count_nonzero(state_bad|global_bad)),"unsafe":int(np.count_nonzero((s>zs)|(g&~zg))),"false_reject":int(np.count_nonzero((s<zs)|(~g&zg)))}
parent_stats=stats(ps,pg);hard_stats=stats(hs,hg)
unique,weights=np.unique(worlds,return_counts=True);zus,zug=oracle(unique)
deletions={}
for i,m in enumerate(MECH):
    qs,qg=candidate(unique,ALL^(1<<i));bad=(qs!=zus)|(qg!=zug);uns=(qs>zus)|(qg&~zug);fr=(qs<zus)|(~qg&zug)
    deletions[m]={"mismatch":int(weights[bad].sum()),"unsafe":int(weights[uns].sum()),"false_reject":int(weights[fr].sum())}

# Complete 2^17 lattice over a deterministic witness set: every dedicated family
# plus every single hardening-fact deletion and one minimal positive world.
witness=np.array([BASE],dtype=np.uint32)
for _,_,mods,_ in families:
    w=np.uint32(BASE)
    for n,v in mods:
        if v:w|=bit(n)
        else:w&=~bit(n)
    witness=np.append(witness,w)
witness=np.unique(witness);wzs,wzg=oracle(witness)
valid=[]
for mask in range(1<<len(MECH)):
    qs,qg=candidate(witness,mask)
    if np.array_equal(qs,wzs) and np.array_equal(qg,wzg):valid.append(mask)
mincost=min((m.bit_count() for m in valid),default=None);winners=[m for m in valid if m.bit_count()==mincost]
out={
"schema":"ikant-le-c53-physical-hardening-falsification-10m/v2",
"source_baseline":BASELINE,"seed":f"0x{SEED:08X}","cases":TOTAL,"families":len(families),
"semantic_worlds_observed":int(unique.size),"abstraction_levels":dict(levels),
"parent_c52_candidate":parent_stats,"hardened_candidate":hard_stats,"mechanisms":MECH,
"hardening_obligations":MECH[-5:],"deletion_mutants":deletions,
"all_deletion_mutants_killed":all(v["mismatch"]>0 for v in deletions.values()),
"architecture_lattice":{"total":1<<len(MECH),"witnesses":int(witness.size),"valid_architectures":len(valid),"minimum_cost":mincost,"minimum_count":len(winners),"winner_masks":winners[:16],"unique_minimum":len(winners)==1 and winners[0]==ALL},
"family_counts":dict(counts),
"claim_boundary":{"semantic_falsification_is_live_host_proof":False,"live_e0_e3_e4_e5_e6_still_required":True},
"status":"PASS" if hard_stats=={"mismatch":0,"unsafe":0,"false_reject":0} and parent_stats["unsafe"]>0 and len(winners)==1 and winners[0]==ALL and all(v["mismatch"]>0 for v in deletions.values()) else "FAIL"
}
x=dict(out);x.pop("receipt_sha256",None);out["receipt_sha256"]=hashlib.sha256(json.dumps(x,sort_keys=True,separators=(",",":")).encode()).hexdigest()
p=Path("artifacts/qualification/c53-physical-hardening-10m.json");p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(out,indent=2)+"\n")
print(json.dumps({"status":out["status"],"parent":parent_stats,"hardened":hard_stats,"semantic_worlds":out["semantic_worlds_observed"],"lattice":out["architecture_lattice"],"receipt":out["receipt_sha256"]}))
if out["status"]!="PASS":raise SystemExit(1)
