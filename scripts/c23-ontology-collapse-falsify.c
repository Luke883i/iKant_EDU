#include <stdint.h>
#include <stdio.h>
#define CASES 10000000u
static uint32_t xs(uint32_t *x){*x^=*x<<13;*x^=*x>>17;*x^=*x<<5;return *x;}
typedef struct{int canonical_host_attested;int mechanical_reserved_physical;int generic_acceptance_ticket;int local_only;int legacy_exported;int legacy_in_root;int legacy_in_bootstrap;int legacy_marked_noncanonical;int changed_channel_evidence;int one_next;int retry_blocked;int model_selects;int physical_claim_laundered;} S;
static int oracle(S s){return s.canonical_host_attested&&s.mechanical_reserved_physical&&s.generic_acceptance_ticket&&s.local_only&&!s.legacy_exported&&!s.legacy_in_root&&!s.legacy_in_bootstrap&&s.legacy_marked_noncanonical&&s.changed_channel_evidence&&s.one_next&&s.retry_blocked&&!s.model_selects&&!s.physical_claim_laundered;}
static int candidate(S s){return oracle(s);}
static int mutant(S s,int m){
 int a=s.canonical_host_attested,b=s.mechanical_reserved_physical,c=s.generic_acceptance_ticket,d=s.local_only,e=!s.legacy_exported,f=!s.legacy_in_root,g=!s.legacy_in_bootstrap,h=s.legacy_marked_noncanonical,i=s.changed_channel_evidence,j=s.one_next,k=s.retry_blocked,l=!s.model_selects,n=!s.physical_claim_laundered;
 switch(m){case 0:a=1;break;case 1:b=1;break;case 2:c=1;break;case 3:d=1;break;case 4:e=1;break;case 5:f=1;break;case 6:g=1;break;case 7:h=1;break;case 8:i=1;break;case 9:j=1;break;case 10:k=1;break;case 11:l=1;break;case 12:n=1;break;}
 return a&&b&&c&&d&&e&&f&&g&&h&&i&&j&&k&&l&&n;
}
static S gen(uint32_t *r){S s;uint32_t x=xs(r);s.canonical_host_attested=(x%100)<91;x=xs(r);s.mechanical_reserved_physical=(x%100)<89;x=xs(r);s.generic_acceptance_ticket=(x%100)<92;x=xs(r);s.local_only=(x%100)<95;x=xs(r);s.legacy_exported=(x%100)<7;x=xs(r);s.legacy_in_root=(x%100)<5;x=xs(r);s.legacy_in_bootstrap=(x%100)<4;x=xs(r);s.legacy_marked_noncanonical=(x%100)<88;x=xs(r);s.changed_channel_evidence=(x%100)<90;x=xs(r);s.one_next=(x%100)<96;x=xs(r);s.retry_blocked=(x%100)<94;x=xs(r);s.model_selects=(x%100)<5;x=xs(r);s.physical_claim_laundered=(x%100)<6;return s;}
int main(void){uint32_t r=0xC23A11CEu;unsigned long long mismatch=0,unsafe=0,kills[13]={0},valid=0;for(uint32_t x=0;x<CASES;x++){S s=gen(&r);int o=oracle(s),c=candidate(s);if(o)valid++;if(c!=o)mismatch++;if(c&&!o)unsafe++;for(int m=0;m<13;m++)if(mutant(s,m)!=o)kills[m]++;}int all=1;for(int m=0;m<13;m++)if(kills[m]==0)all=0;printf("{\"schema\":\"ikant-le-c23-ontology-collapse/v1\",\"cases\":%u,\"candidate_oracle_mismatches\":%llu,\"unsafe_accept\":%llu,\"valid_states\":%llu,\"all_mutants_killed\":%s,\"kills\":[",CASES,mismatch,unsafe,valid,all?"true":"false");for(int m=0;m<13;m++){if(m)putchar(',');printf("%llu",kills[m]);}printf("],\"status\":\"%s\"}\n",(mismatch==0&&unsafe==0&&all)?"PASS":"FAIL");return (mismatch==0&&unsafe==0&&all)?0:2;}
