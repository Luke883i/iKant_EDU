#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define M0 1u
#define M1 2u
#define M2 4u
#define M3 8u
#define ALL 15u
#define B(n) (1ULL<<(n))
#define MASK40 ((1ULL<<40)-1ULL)

typedef struct { unsigned open:1; unsigned active:1; } outcome;

static uint64_t perm40(uint64_t x){return (x*0x9e3779b97ULL+0x7f4a7c15dULL)&MASK40;}
static uint32_t perm30(uint32_t x){return (uint32_t)(((uint64_t)x*2654435761u+1013904223u)&0x3fffffffu);}
static int bit(uint64_t w,int n){return (int)((w>>n)&1ULL);}

static int dedicated(uint64_t w){
 const int start=bit(w,0),exit=bit(w,1),neg=bit(w,2),quoted=bit(w,3),code=bit(w,4),mixed=bit(w,5),repo=bit(w,6),question=bit(w,7),repeated=bit(w,8);
 return start&&!exit&&!neg&&!quoted&&!code&&!mixed&&!repo&&!question&&!repeated;
}
static int positive_start(uint64_t w){return bit(w,0)&&!bit(w,1)&&!bit(w,2)&&!bit(w,3)&&!bit(w,4);}
static int base_ready(uint64_t w){return bit(w,10)&&bit(w,11)&&!bit(w,19);}
static int full_ready(uint64_t w){
 return bit(w,10)&&bit(w,11)&&bit(w,12)&&bit(w,13)&&bit(w,14)&&bit(w,15)&&!bit(w,19)&&!bit(w,37)&&!bit(w,38)&&!bit(w,39);
}
static int surface_ok(uint64_t w){return bit(w,16)&&!bit(w,17)&&!bit(w,18)&&!bit(w,33);}
static int base_handoff(uint64_t w){return bit(w,22)&&bit(w,24);}
static int handoff_ok(uint64_t w){
 return bit(w,20)&&bit(w,21)&&bit(w,22)&&bit(w,23)&&bit(w,24)&&bit(w,25)&&(!bit(w,26)||bit(w,27))&&!bit(w,28)&&!bit(w,29)&&!bit(w,30)&&!bit(w,31)&&!bit(w,32)&&!bit(w,34)&&!bit(w,35)&&!bit(w,36);
}
static outcome oracle(uint64_t w){
 const int o=dedicated(w)&&full_ready(w)&&surface_ok(w);
 outcome x={(unsigned)o,(unsigned)(o&&handoff_ok(w))};return x;
}
static outcome candidate(uint64_t w,unsigned mask){
 const int route=(mask&M0)?dedicated(w):positive_start(w);
 const int ready=(mask&M1)?full_ready(w):base_ready(w);
 const int surface=(mask&M2)?surface_ok(w):1;
 const int o=route&&ready&&surface;
 const int h=(mask&M3)?handoff_ok(w):base_handoff(w);
 outcome x={(unsigned)o,(unsigned)(o&&h)};return x;
}
static int same(outcome a,outcome b){return a.open==b.open&&a.active==b.active;}

static uint64_t safe_world(void){
 uint64_t w=0;
 w|=B(0); /* dedicated start */
 for(int n=10;n<=16;n++)w|=B(n); /* visible/callable/deploy/preflight/open-visible */
 w|=B(20)|B(21)|B(22)|B(23)|B(24)|B(25)|B(27); /* valid owner handoff */
 return w;
}
static void architecture_lattice(int *valid,int *minimum,int *minimum_count,int *dvalid,int *dminimum,int *dminimum_count){
 uint64_t w[4];const uint64_t s=safe_world();
 w[0]=s|B(5);          /* mixed activation needs new M0 */
 w[1]=s&~B(13);        /* invalid deployment needs new M1 */
 w[2]=s|B(17);         /* model-visible accept needs inherited M2 */
 w[3]=s|B(28);         /* fallback after open needs inherited M3 */
 *valid=0;*minimum=99;*minimum_count=0;
 for(unsigned m=0;m<16;m++){
  int ok=1;for(int i=0;i<4;i++)if(!same(candidate(w[i],m),oracle(w[i]))){ok=0;break;}
  if(!ok)continue;(*valid)++;int c=__builtin_popcount(m);
  if(c<*minimum){*minimum=c;*minimum_count=1;}else if(c==*minimum)(*minimum_count)++;
 }
 *dvalid=0;*dminimum=99;*dminimum_count=0;
 for(unsigned d=0;d<4;d++){
  unsigned m=M2|M3|(d&1?M0:0)|(d&2?M1:0);
  int ok=1;for(int i=0;i<2;i++)if(!same(candidate(w[i],m),oracle(w[i]))){ok=0;break;}
  if(!ok)continue;(*dvalid)++;int c=__builtin_popcount(d);
  if(c<*dminimum){*dminimum=c;*dminimum_count=1;}else if(c==*dminimum)(*dminimum_count)++;
 }
}

int main(int argc,char**argv){
 uint64_t cases=1000000000ULL;const char*mode="full";
 for(int i=1;i<argc;i++){
  if(!strcmp(argv[i],"--cases")&&i+1<argc)cases=strtoull(argv[++i],0,10);
  else if(!strcmp(argv[i],"--mode")&&i+1<argc)mode=argv[++i];
 }
 if(!strcmp(mode,"global")&&cases>(1ULL<<30)){fprintf(stderr,"global cases exceed 2^30 unique space\n");return 2;}
 if(!strcmp(mode,"full")&&cases>(1ULL<<40)){fprintf(stderr,"full cases exceed 2^40 decision space\n");return 2;}

 uint64_t final_mismatch=0,baseline_mismatch=0,baseline_unsafe=0,del[4]={0,0,0,0};
 for(uint64_t i=0;i<cases;i++){
  uint64_t w=!strcmp(mode,"global")?(((uint64_t)perm30((uint32_t)i)<<10)|1ULL):perm40(i);
  outcome o=oracle(w),f=candidate(w,ALL),b=candidate(w,M2|M3);
  if(!same(f,o))final_mismatch++;
  if(!same(b,o)){baseline_mismatch++;if((b.open&&!o.open)||(b.active&&!o.active))baseline_unsafe++;}
  if(positive_start(w)&&!dedicated(w)&&full_ready(w)&&surface_ok(w))del[0]++;
  if(dedicated(w)&&base_ready(w)&&!full_ready(w)&&surface_ok(w))del[1]++;
  if(dedicated(w)&&full_ready(w)&&!surface_ok(w))del[2]++;
  if(dedicated(w)&&full_ready(w)&&surface_ok(w)&&base_handoff(w)!=handoff_ok(w))del[3]++;
 }
 int valid=0,min=0,minCount=0,dvalid=0,dmin=0,dminCount=0;architecture_lattice(&valid,&min,&minCount,&dvalid,&dmin,&dminCount);
 const int global_mode=!strcmp(mode,"global");const int deletion_scope_ok=global_mode?(del[1]&&del[2]&&del[3]):(del[0]&&del[1]&&del[2]&&del[3]);
 const int unique=(valid==1&&min==4&&minCount==1&&dvalid==1&&dmin==2&&dminCount==1&&deletion_scope_ok&&final_mismatch==0);
 printf("{\n");
 printf("  \"schema\": \"ikant-le-c58-host-bootstrap-falsification/v2\",\n");
 printf("  \"mode\": \"%s\",\n",mode);
 printf("  \"cases\": %llu,\n",(unsigned long long)cases);
 printf("  \"decision_bits\": 40,\n  \"decision_space\": 1099511627776,\n");
 printf("  \"sample_without_replacement\": true,\n");
 printf("  \"baseline_pr67_initial_mask\": 12,\n");
 printf("  \"baseline_mismatches\": %llu,\n",(unsigned long long)baseline_mismatch);
 printf("  \"baseline_unsafe_promotions\": %llu,\n",(unsigned long long)baseline_unsafe);
 printf("  \"final_candidate_mismatches\": %llu,\n",(unsigned long long)final_mismatch);
 printf("  \"deletion_scope\": \"%s\",\n",global_mode?"M1_M2_M3_GLOBAL":"M0_M1_M2_M3_FULL");
 printf("  \"deletion_witness_counts\": {\"DEDICATED_LIFECYCLE_GATE\": %llu, \"READY_VISIBLE_OPEN_BINDING\": %llu, \"ONE_MODEL_OPEN_EDGE\": %llu, \"OWNER_HANDOFF_NO_SUBSTITUTE\": %llu},\n",(unsigned long long)del[0],(unsigned long long)del[1],(unsigned long long)del[2],(unsigned long long)del[3]);
 printf("  \"system_architecture_lattice\": {\"total\": 16, \"valid\": %d, \"minimum_cost\": %d, \"minimum_count\": %d, \"unique_minimum_all_four\": %s},\n",valid,min,minCount,(valid==1&&min==4&&minCount==1)?"true":"false");
 printf("  \"new_delta_lattice\": {\"total\": 4, \"valid\": %d, \"minimum_new_cost\": %d, \"minimum_count\": %d, \"unique_minimum_two_new\": %s},\n",dvalid,dmin,dminCount,(dvalid==1&&dmin==2&&dminCount==1)?"true":"false");
 printf("  \"claim_boundary\": {\"semantic_model_is_physical_host_proof\": false, \"natural_language_route_is_model_mediated\": true, \"tool_input_is_not_attested_raw_user_turn\": true},\n");
 printf("  \"status\": \"%s\"\n}\n",unique?"PASS":"FAIL");
 return unique?0:1;
}
