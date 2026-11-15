/* C126 1m deterministic finite semantic-fault policy states.
 * Zero real LLM calls, zero native UI events, zero original C87 invocations. */
#include <stdint.h>
#include <inttypes.h>
#include <stdio.h>
#include <stdlib.h>
static uint64_t st=UINT64_C(0xc126202610140001);
static uint64_t rnd(void){st^=st>>12;st^=st<<25;st^=st>>27;return st*UINT64_C(2685821657736338717);}
static const char*names[]={"VALID","C124_ROLE","C124_ID","C124_PREFIX","C124_SIZE","C124_CONTROL",
 "C124_AUTHORITY","C124_PROVIDER","C124_CAUSALITY","C124_HASH","C124_EXCLUSION","C124_ARRAY",
 "GETTER_PROXY","C72_EPOCH","PR119_ORDER","ACK_INPUT","ACK_PLAN","ACK_CHANNEL",
 "C114_GUARD","C87_REOPEN","C125_VOICE","C125_OUTSIDE","C125_REPLAY","DOCX_FORGED"};
static int candidate(uint32_t good){return(good&UINT32_C(0x7fffff))==UINT32_C(0x7fffff);}
static int oracle(uint32_t bad){const uint32_t g[]={0x000007ff,0x0001f800,0x003e0000,0x00400000};
 for(unsigned i=0;i<4;i++){if(bad&g[i])return 0;}return 1;}
int main(int argc,char**argv){
 uint64_t n=1000000,seed=st,positive=0,denied=0,pairs=0,mismatch=0,by[24]={0};
 if(argc>1){n=strtoull(argv[1],0,10);if(!n||n>10000000)return 2;}
 if(argc>2){seed=strtoull(argv[2],0,0);st=seed;}
 for(uint64_t i=0;i<n;i++){
  unsigned j=i%24;uint32_t bad=j?UINT32_C(1)<<(j-1):0;
  uint64_t r=rnd();if(j&&r%5==0){bad|=UINT32_C(1)<<((r>>17)%23);pairs++;}
  int actual=candidate(UINT32_C(0x7fffff)&~bad),expected=oracle(bad);
  if(actual!=expected)mismatch++;
  if(actual)positive++;else denied++;
  by[j]++;
 }
 printf("{\"schema\":\"ikant-edu-c126-finite-faults/v1\",\"seed\":\"0x%016"PRIx64"\",\"cases\":%"PRIu64",\"families\":24,\"positive\":%"PRIu64",\"denied\":%"PRIu64",\"paired_faults\":%"PRIu64",\"oracle_mismatches\":%"PRIu64",\"real_llm_calls\":0,\"native_ui_events\":0,\"family_counts\":[",seed,n,positive,denied,pairs,mismatch);
 for(unsigned i=0;i<24;i++){printf("%s%"PRIu64,i?",":"",by[i]);}
 printf("],\"family_names\":[");
 for(unsigned i=0;i<24;i++){printf("%s\"%s\"",i?",":"",names[i]);}
 printf("]}\n");return mismatch?1:0;
}
