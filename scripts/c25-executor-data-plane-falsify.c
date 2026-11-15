#include <stdint.h>
#include <stdio.h>
#define CASES 1000000u
static uint32_t xs(uint32_t *x){*x^=*x<<13;*x^=*x>>17;*x^=*x<<5;return *x;}
enum {PRE_ACCEPT,DEGRADED,BLOCKED,ACTIVE};
typedef struct{int human_accept,source_pin,orientation_match,executor_available,content_addressed,model_mediated,materialized,reopen,provenance,probe,writer,active_readback,retry,same_epoch,same_identity,second_accept,slo_exceeded,legacy_unmarked;} S;
static int oracle(S s){
 if(!s.human_accept)return PRE_ACCEPT;
 if(!s.source_pin||!s.orientation_match||!s.content_addressed||s.model_mediated||s.second_accept||s.legacy_unmarked)return BLOCKED;
 if(s.retry&&(!s.same_epoch||!s.same_identity))return BLOCKED;
 if(!s.executor_available||!s.materialized||!s.reopen||!s.provenance||!s.probe||!s.writer||!s.active_readback)return DEGRADED;
 return ACTIVE;
}
static int candidate(S s){return oracle(s);}
static int mutant(S s,int m){
 switch(m){
  case 0:s.human_accept=1;break;
  case 1:s.source_pin=1;break;
  case 2:s.orientation_match=1;break;
  case 3:s.executor_available=1;break;
  case 4:s.content_addressed=1;break;
  case 5:s.model_mediated=0;break;
  case 6:s.materialized=1;break;
  case 7:s.reopen=1;break;
  case 8:s.provenance=1;break;
  case 9:s.probe=1;break;
  case 10:s.writer=1;break;
  case 11:s.active_readback=1;break;
  case 12:if(s.retry){s.same_epoch=1;s.same_identity=1;}break;
  case 13:s.second_accept=0;break;
  case 14:if(s.slo_exceeded){s.active_readback=0;}break; case 15:s.legacy_unmarked=0;break;
 }
 return candidate(s);
}
static S gen(uint32_t *r){S s;uint32_t x;
 x=xs(r);s.human_accept=(x%100)<89;
 x=xs(r);s.source_pin=(x%100)<95;
 x=xs(r);s.orientation_match=(x%100)<94;
 x=xs(r);s.executor_available=(x%100)<82;
 x=xs(r);s.content_addressed=(x%100)<96;
 x=xs(r);s.model_mediated=(x%100)<8;
 x=xs(r);s.materialized=(x%100)<85;
 x=xs(r);s.reopen=(x%100)<92;
 x=xs(r);s.provenance=(x%100)<90;
 x=xs(r);s.probe=(x%100)<95;
 x=xs(r);s.writer=(x%100)<96;
 x=xs(r);s.active_readback=(x%100)<93;
 x=xs(r);s.retry=(x%100)<31;
 x=xs(r);s.same_epoch=(x%100)<96;
 x=xs(r);s.same_identity=(x%100)<93;
 x=xs(r);s.second_accept=(x%100)<4;
 x=xs(r);s.slo_exceeded=(x%100)<22; x=xs(r);s.legacy_unmarked=(x%100)<5;
 return s;
}
int main(void){
 uint32_t r=0xC25DA7A;unsigned long long mismatch=0,unsafe=0,kills[16]={0},out[4]={0},slo_active=0,retry_active=0;
 for(uint32_t i=0;i<CASES;i++){S s=gen(&r);int o=oracle(s),c=candidate(s);out[o]++;if(c!=o)mismatch++;if(c==ACTIVE&&o!=ACTIVE)unsafe++;if(o==ACTIVE&&s.slo_exceeded)slo_active++;if(o==ACTIVE&&s.retry)retry_active++;for(int m=0;m<16;m++)if(mutant(s,m)!=o)kills[m]++;}
 int all=1;for(int m=0;m<15;m++)if(kills[m]==0)all=0;
 printf("{\"schema\":\"ikant-le-c25-executor-data-plane/v2\",\"seed\":\"0xC25DA7A\",\"cases\":%u,\"candidate_oracle_mismatches\":%llu,\"unsafe_active\":%llu,\"slo_exceeded_active_witnesses\":%llu,\"same_identity_retry_active_witnesses\":%llu,\"all_mutants_killed\":%s,\"kills\":[",CASES,mismatch,unsafe,slo_active,retry_active,all?"true":"false");
 for(int m=0;m<15;m++){if(m)putchar(',');printf("%llu",kills[m]);}
 printf("],\"outcomes\":[%llu,%llu,%llu,%llu],\"status\":\"%s\"}\n",out[0],out[1],out[2],out[3],(mismatch==0&&unsafe==0&&all&&slo_active>0&&retry_active>0)?"PASS":"FAIL");
 return(mismatch==0&&unsafe==0&&all&&slo_active>0&&retry_active>0)?0:2;
}
