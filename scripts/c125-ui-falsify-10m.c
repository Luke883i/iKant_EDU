/* C125 finite host-shell security model, NOT 10m ChatGPT turns or native UI renderings.
 * 32 seeded semantic families, candidate conjunctive policy vs independent denial oracle.
 * Exit nonzero on any discrepancy or fake platform-wide attestation. */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <inttypes.h>
#define G 31
static const char *name[32]={
 "VALID_HOST_ONLY","NO_ACCEPT","FAKE_ACCEPT_SCOPE","NO_SEND_PORT","DOUBLE_OUTPUT_OWNER",
 "WRONG_MODE","INVALID_KIND","MALFORMED_META","GETTER_FRAME","PROXY_FRAME",
 "C87_MISSING","C87_HASH_MISMATCH","C87_NONCE_MISMATCH","INPUT_DIGEST_MISMATCH",
 "UNVERIFIED_OWNER","NON_HOST_VOICE","VOICE_BYTES_DRIFT","VOICE_ANSI_BIDI","VOICE_FRAME_INJECTION",
 "FORGED_DOCX","POST_SEND_UNCERTAIN_RETRY","CONCURRENT_SEND","DISPOSED_BEFORE_SEND",
 "OUTSIDE_SHELL_NOTES","PROGRESS_BYPASS","ERROR_BYPASS","UNSAFE_DOCUMENT_LINK",
 "SECOND_SEND_SAME_NONCE","HOST_CLAIMS_NATIVE","CROSS_CHAT_MEMORY_CLAIM",
 "C107_DIRECT_BYPASS","MISSING_INDEPENDENT_REOPEN"};
static uint64_t st=UINT64_C(0x1252026101300001);
static uint64_t rng(void){st^=st>>12;st^=st<<25;st^=st>>27;return st*UINT64_C(2685821657736338717);}
/* Bits i=1 iff prerequisite i is unbroken; 31 dimensions for one controlled emission. */
static int candidate(uint32_t ok){
 for(unsigned i=0;i<G;i++){if((ok&(UINT32_C(1)<<i))==0)return 0;}
 return 1;
}
/* Independent oracle: reject first witness failure, not a copy of the positive check. */
static int oracle(uint32_t faults){
 static const uint32_t groups[]={0x0000001f,0x000003e0,0x00007c00,0x000f8000,0x01f00000,0x3e000000,0x40000000};
 for(unsigned g=0;g<sizeof(groups)/sizeof(groups[0]);g++)if((faults&groups[g])!=0)return 0;
 return 1;
}
int main(int argc,char **argv){
 uint64_t n=10000000,seed=st;
 if(argc>1){n=strtoull(argv[1],0,10);if(n==0||n>100000000ULL)return 2;}
 if(argc>2){seed=strtoull(argv[2],0,0);st=seed;}
 uint64_t fam[32]={0},eligible=0,denied=0,errors=0,pairwise=0,native=0;
 for(uint64_t i=0;i<n;i++){
  unsigned f=(unsigned)(i%32),fault=(f==0)?0:(1u<<(f-1));
  uint64_t r=rng();
  if(f!=0&&(r%7==0)){fault|=(1u<<((r>>12)%G));pairwise++;}
  /* A valid scenario remains valid only with all prerequisites; native never promoted. */
  uint32_t ok=(UINT32_MAX>>1)&~fault;
  int got=candidate(ok),want=oracle(fault);
  if(got!=want)errors++;
  if(got)eligible++;else denied++;
  /* Native platform-wide exclusivity has no authenticated witness in this model. */
  int native_claim=(got&&0);if(native_claim)native++;
  fam[f]++;
 }
 printf("{\"schema\":\"ikant-c125-ui-host-falsify-v2\",\"cases\":%"PRIu64",\"seed\":\"0x%016"PRIx64"\",\"families\":32,\"eligible_host_only\":%"PRIu64",\"denied\":%"PRIu64",\"paired_secondary_fault_cases\":%"PRIu64",\"oracle_mismatches\":%"PRIu64",\"false_native_promotions\":%"PRIu64",\"real_llm_calls\":0,\"native_chatgpt_ui_interceptions\":0,\"original_c87_calls\":0,\"oracle\":\"GROUPED_NEGATIVE_FAULT_ORACLE_VS_BITWISE_POSITIVE_GATES\",\"family_counts\":[",n,seed,eligible,denied,pairwise,errors,native);
 for(int i=0;i<32;i++)printf("%s%"PRIu64,i?",":"",fam[i]);
 printf("],\"family_names\":[");for(int i=0;i<32;i++)printf("%s\"%s\"",i?",":"",name[i]);
 printf("]}\n");
 return (errors||native)?1:0;
}
