/* C124 runtime release finite fault oracle: 5M deterministic policy cases,
 * NOT 5M LLM generations or behavioral-effect certification.
 */
#include <stdint.h>
#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
#define N 20
static uint64_t state=UINT64_C(0xC124202610132356);
static uint64_t next(void){state^=state>>12;state^=state<<25;state^=state>>27;return state*UINT64_C(2685821657736338717);}
static const char* classes[]={
 "VALID_ONLY","MISSING_INTENT","MISSING_METHOD","MISSING_CENTRAL","MISSING_RESOURCE",
 "MISSING_STRATEGY","MISSING_PSYCHE","MISSING_ARCHETYPES","MISSING_VOICE",
 "MISSING_WORKSPACE","MISSING_MEMORY","MISSING_POLICY","MISSING_GROUNDING",
 "INPUT_HASH_STALE","OVERLAY_GIT_MISMATCH","NO_C72_EPOCH","NO_PLAN_ACK",
 "NO_CAPSULE_ACK","MISSING_C114_PREFLIGHT","MISSING_C87_INDEPENDENT_REOPEN","CONCURRENT_OR_REPLAY"};
/* 20 independent gates; each family targets one gate. */
static int accept(uint32_t valid){return (valid&UINT32_C(0x000fffff))==UINT32_C(0x000fffff);}
static int oracle(uint32_t fault){const uint32_t groups[]={
 0x0000001f,0x000003e0,0x00007c00,0x00038000,0x000c0000};
 for(unsigned i=0;i<5;i++)if(fault&groups[i])return 0;
 return 1;
}
int main(int argc,char**argv){
 uint64_t n=5000000,seed=state,denied=0,accepted=0,secondary=0,mismatch=0;
 if(argc>1){n=strtoull(argv[1],NULL,10);if(!n||n>100000000)return 2;}
 if(argc>2){seed=strtoull(argv[2],NULL,0);state=seed;}
 uint64_t per[21]={0};
 for(uint64_t i=0;i<n;i++){
  unsigned f=(unsigned)(i%21);uint32_t fault=f?1u<<(f-1):0u;
  uint64_t r=next();if(f&&r%9==0){fault|=1u<<((r>>14)%20);secondary++;}
  uint32_t valid=UINT32_C(0x000fffff)&~fault;
  const int c=accept(valid),o=oracle(fault);if(c!=o)mismatch++;
  if(c)accepted++;else denied++;per[f]++;
 }
 printf("{\"schema\":\"ikant-c124-runtime-fault-5m/v1\",\"cases\":%"PRIu64",\"seed\":\"0x%016"PRIx64"\",\"classes\":21,\"positive\":%"PRIu64",\"denied\":%"PRIu64",\"second_faults\":%"PRIu64",\"oracle_mismatches\":%"PRIu64",\"semantics_verified\":false,\"real_llm_calls\":0,\"real_c87_turns\":0,\"classes_counts\":[",n,seed,accepted,denied,secondary,mismatch);
 for(int i=0;i<21;i++)printf("%s%"PRIu64,i?",":"",per[i]);
 printf("],\"class_names\":[");for(int i=0;i<21;i++)printf("%s\"%s\"",i?",":"",classes[i]);printf("]}\n");
 return mismatch?1:0;
}
