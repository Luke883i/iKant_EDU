/* C128 finite host-source threat model, NOT 1 million LLM turns. */
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <inttypes.h>
static uint64_t st=UINT64_C(0xc128202610140001);
static uint64_t rnd(void){st^=st>>12;st^=st<<25;st^=st>>27;return st*UINT64_C(2685821657736338717);}
static const char *fam[]={"VALID","PIN_C107","OVERLAY_1","OVERLAY_2","OVERLAY_3","EPOCH",
 "JSON_DUP_KEY","JSON_EXTRA_NEWLINE","JSON_PRETTY_PRINT","JSON_PROPERTY_ORDER",
 "OVERLAY_ORDER","INVALID_UTF8","SYMLINK_SWAP","INODE_REPLACE","FILE_SHORT_READ",
 "C72_MISSING","C72_STALE","C124_BAD_ACK","C126_BAD_ROLE","C114_BYPASS",
 "C87_SECOND_WRITER","C87_READBACK","C125_REPLAY","NATIVE_UI_CLAIM"};
static int positive(uint32_t good){return(good&UINT32_C(0x007fffff))==UINT32_C(0x007fffff);}
static int oracle(uint32_t bad){
 const uint32_t g[4]={UINT32_C(0x0000003f),UINT32_C(0x000007c0),UINT32_C(0x0003f800),UINT32_C(0x007c0000)};
 for(int j=0;j<4;j++){if(bad&g[j])return 0;}return 1;
}
int main(int argc,char **argv){
 uint64_t cases=1000000,seed=st,pass=0,deny=0,pairs=0,mismatch=0,counts[24]={0};
 if(argc>1){cases=strtoull(argv[1],0,10);}
 if(argc>2){seed=strtoull(argv[2],0,0);st=seed;}
 if(!cases||cases>10000000)return 2;
 for(uint64_t i=0;i<cases;i++){
  unsigned k=(unsigned)(i%24);
  uint32_t bad=k?(UINT32_C(1)<<(k-1)):0;
  uint64_t r=rnd();
  if(k&&r%7==0){bad|=UINT32_C(1)<<((r>>19)%23);pairs++;}
  int got=positive(UINT32_C(0x007fffff)&~bad),want=oracle(bad);
  if(got!=want)mismatch++;
  if(got)pass++;else deny++;
  counts[k]++;
 }
 printf("{\"schema\":\"ikant-c128-host-cache-fault-model/v1\",\"seed\":\"0x%016"PRIx64"\",\"cases\":%"PRIu64",\"families\":24,\"allowed\":%"PRIu64",\"denied\":%"PRIu64",\"paired_faults\":%"PRIu64",\"oracle_mismatches\":%"PRIu64",\"llm_calls\":0,\"native_chatgpt_events\":0,\"C87_writes\":0,\"counts\":[",seed,cases,pass,deny,pairs,mismatch);
 for(int i=0;i<24;i++){printf("%s%"PRIu64,i?",":"",counts[i]);}
 printf("],\"names\":[");
 for(int i=0;i<24;i++){printf("%s\"%s\"",i?",":"",fam[i]);}
 printf("]}\n");return mismatch?1:0;
}
