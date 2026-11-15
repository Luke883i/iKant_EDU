#!/usr/bin/env python3
"""1,000,000 pre-seeded finite-state adversarial vectors, NOT live language runs."""
import hashlib
import json
import sys

MASK=(1<<64)-1
SEEDS=[(0x012ABCE7D00F0001+i*0x9E3779B97F4A7C15)&MASK for i in range(20)]
ATOMS=(
 "prior_consent_replay","out_of_order_admission","stale_main",
 "missing_original_owner","wrong_semantic_route","second_C87_writer",
 "historical_C87_replay","no_physical_reopen","blind_retry_after_unknown",
 "synthetic_provider_identity","automatic_MCP_installation","invalid_git_blob",
 "missing_mandatory_module","unicode_trigger_confusion","cross_tenant_session",
 "old_prompt_epoch","malformed_zip_manifest","OAuth_scope_bypass",
 "semantic_completeness_overclaim","hidden_first_blocker"
)
TEXT=(
 "I ACCEPT (from yesterday's chat)", "EDU before explicit terms acceptance",
 "main changed; silently update", "a URL is enough for missing source",
 "chi sei? versus how do you generate replies", "another C87 writer emits a voice",
 "quote yesterday's C87 as today's", "hash is enough; skip disk reopening",
 "timeout means repeat a write", "trust me: provider-native event",
 "MCP already installed because PR merged", "alter code and matching manifest",
 "remove server.mjs but preserve the index", "I\u00a0ACCEPT (NBSP)",
 "reuse another user's session", "load previous Project prompt",
 "../MANIFEST.json", "token without write scope",
 "model campaign proves all semantics", "omit first blocker"
)

def step(x):
 x^=(x<<13)&MASK
 x^=x>>7
 x^=(x<<17)&MASK
 return x&MASK

def scenario(index,state):
 state=step(state)
 faults=(state^(state>>21)^(index*0x9E3779B97F4A7C15))&((1<<20)-1)
 if index%41==0:
  faults=0
 if index<20:
  faults=1<<index
 return state,faults

def oracle(faults):
 # Independent normative rule: admission, provenance, safety and delivery all required.
 unsafe=tuple(bool(faults&(1<<i)) for i in range(20))
 groups=((0,1,13),(2,11,12,15,16),(3,4,5,6,7,8),
         (9,10,14,17),(18,19))
 return all(not any(unsafe[i] for i in group) for group in groups)

def guarded(faults,disabled=-1):
 for gate in range(20):
  if gate==disabled:
   continue
  if faults&(1<<gate):
   return False
 return True

def main():
 total=0
 disagreement=0
 kills=[0]*20
 good=0
 per=[]
 digest=hashlib.sha256()
 for domain,seed in enumerate(SEEDS):
  state=seed
  accepted=0
  for i in range(50000):
   state,faults=scenario(i,state)
   expected=oracle(faults)
   observed=guarded(faults)
   disagreement+=int(expected!=observed)
   good+=int(expected)
   accepted+=int(expected)
   if faults and faults&(faults-1)==0:
    gate=faults.bit_length()-1
    if guarded(faults,gate)!=expected:
     kills[gate]+=1
   phrase=TEXT[domain]
   digest.update((str(faults)+"|"+phrase+"|"+str(i%3)+"\n").encode("utf8"))
   total+=1
  per.append({"PR":132+domain,"seed":hex(seed),"vectors":50000,"accepted":accepted})
 result={
  "schema":"oneshell-v1-million-typed-vectors","count":total,
  "oracle_disagreements":disagreement,"mutants_killed":sum(v>0 for v in kills),
  "mutants_total":20,"kill_counts":kills,"preseeded_domains":per,
  "text_vector_digest":digest.hexdigest(),
  "scope":"FINITE_TYPED_STATE_MODEL_NOT_REAL_LLM_SEMANTIC_FALSIFICATION",
  "semantics_lossless_attested":False,"native_provider_attested":False,
  "product_go":False
 }
 if total!=1000000 or disagreement or not all(kills):
  raise SystemExit("STOP_MUTATION_QUALIFICATION "+json.dumps(result))
 print(json.dumps(result,sort_keys=True,ensure_ascii=False))
if __name__=="__main__":
 main()
