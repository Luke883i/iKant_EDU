#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef enum { ST_UNAVAILABLE=0, ST_BLOCKED=1, ST_INVALID=2, ST_ACTIVE=3 } state_t;
typedef enum { P_DEPLOYED=0, P_ONESHOT=1 } profile_t;

static inline uint64_t mix64(uint64_t x){x+=0x9E3779B97F4A7C15ULL;x=(x^(x>>30))*0xBF58476D1CE4E5B9ULL;x=(x^(x>>27))*0x94D049BB133111EBULL;return x^(x>>31);}
static inline int bit(uint64_t x,int b){return (int)((x>>b)&1ULL);}

enum {
 M_EXACT_ACCEPT=0, M_ORIGIN_AT_INGEST=1, M_SOURCE_PIN=2, M_TERMS_BINDING=3,
 M_DEADLINE_CONTINUITY=4, M_LIVE_PROBE=5, M_WRITER=6, M_ACTIVE_READBACK=7,
 M_DEPLOYED_STORE_ATTESTED=8, M_DEPLOYED_ROOT_REOPEN=9, M_SESSION_BIND=10, M_SESSION_WORKSPACE_REVALIDATED=11,
 M_CAPABILITY_PLAN=12, M_QUARANTINE=13, M_SINGLE_HISTORY=14, M_BYTE_INGRESS=15, M_LOCAL_ROOT=16,
 V_SECOND_ACCEPT=17, V_ORIGIN_RECONSTRUCTED=18, V_SOURCE_REBASE=19, V_MODEL_BYTES=20,
 V_HISTORY_DOUBLE=21, V_CARRIER_SWITCH_AFTER_HISTORY=22, V_DEPLOYMENT_PIN_DRIFT=23,
 V_DEPLOYED_PER_CHAT_REMOTE=24, V_HOSTED_ATTEST_AS_LOCAL_ROOT=25, V_DEADLINE_RESET=26,
 V_STALE_STATE_AFTER_COMMIT=27, V_FALSE_PHYSICAL_CLAIM=28, V_ACCEPT_VARIANT=29
};

static const uint64_t SHARED_REQ =
 (1ULL<<M_EXACT_ACCEPT)|(1ULL<<M_ORIGIN_AT_INGEST)|(1ULL<<M_SOURCE_PIN)|(1ULL<<M_TERMS_BINDING)|
 (1ULL<<M_DEADLINE_CONTINUITY)|(1ULL<<M_LIVE_PROBE)|(1ULL<<M_WRITER)|(1ULL<<M_ACTIVE_READBACK);
static const uint64_t DEP_REQ =
 (1ULL<<M_DEPLOYED_STORE_ATTESTED)|(1ULL<<M_DEPLOYED_ROOT_REOPEN)|(1ULL<<M_SESSION_BIND)|(1ULL<<M_SESSION_WORKSPACE_REVALIDATED);
static const uint64_t ONE_REQ =
 (1ULL<<M_CAPABILITY_PLAN)|(1ULL<<M_QUARANTINE)|(1ULL<<M_SINGLE_HISTORY)|(1ULL<<M_BYTE_INGRESS)|(1ULL<<M_LOCAL_ROOT);
static const uint64_t INVALID_COMMON =
 (1ULL<<V_SECOND_ACCEPT)|(1ULL<<V_ORIGIN_RECONSTRUCTED)|(1ULL<<V_SOURCE_REBASE)|(1ULL<<V_MODEL_BYTES)|
 (1ULL<<V_DEADLINE_RESET)|(1ULL<<V_STALE_STATE_AFTER_COMMIT)|(1ULL<<V_FALSE_PHYSICAL_CLAIM)|(1ULL<<V_ACCEPT_VARIANT);
static const uint64_t INVALID_DEP = (1ULL<<V_DEPLOYMENT_PIN_DRIFT)|(1ULL<<V_DEPLOYED_PER_CHAT_REMOTE)|(1ULL<<V_HOSTED_ATTEST_AS_LOCAL_ROOT);
static const uint64_t INVALID_ONE = (1ULL<<V_HISTORY_DOUBLE)|(1ULL<<V_CARRIER_SWITCH_AFTER_HISTORY)|(1ULL<<V_HOSTED_ATTEST_AS_LOCAL_ROOT);

static state_t candidate(profile_t p,uint64_t x){
 const uint64_t req=SHARED_REQ|(p==P_DEPLOYED?DEP_REQ:ONE_REQ);
 const uint64_t inv=INVALID_COMMON|(p==P_DEPLOYED?INVALID_DEP:INVALID_ONE);
 if((x&inv)!=0)return ST_INVALID;
 if(p==P_DEPLOYED && !bit(x,M_DEPLOYED_STORE_ATTESTED))return ST_UNAVAILABLE;
 if(p==P_ONESHOT && !bit(x,M_CAPABILITY_PLAN))return ST_UNAVAILABLE;
 if((x&req)!=req)return ST_BLOCKED;
 return ST_ACTIVE;
}

static state_t oracle(profile_t p,uint64_t x){
 if(bit(x,V_ACCEPT_VARIANT)||bit(x,V_SECOND_ACCEPT)||bit(x,V_ORIGIN_RECONSTRUCTED)||bit(x,V_SOURCE_REBASE)||bit(x,V_MODEL_BYTES)||bit(x,V_DEADLINE_RESET)||bit(x,V_STALE_STATE_AFTER_COMMIT)||bit(x,V_FALSE_PHYSICAL_CLAIM))return ST_INVALID;
 if(p==P_DEPLOYED){
   if(bit(x,V_DEPLOYMENT_PIN_DRIFT)||bit(x,V_DEPLOYED_PER_CHAT_REMOTE)||bit(x,V_HOSTED_ATTEST_AS_LOCAL_ROOT))return ST_INVALID;
   if(!bit(x,M_DEPLOYED_STORE_ATTESTED))return ST_UNAVAILABLE;
   if(!bit(x,M_EXACT_ACCEPT)||!bit(x,M_ORIGIN_AT_INGEST)||!bit(x,M_SOURCE_PIN)||!bit(x,M_TERMS_BINDING)||!bit(x,M_DEADLINE_CONTINUITY)||!bit(x,M_DEPLOYED_ROOT_REOPEN)||!bit(x,M_SESSION_BIND)||!bit(x,M_SESSION_WORKSPACE_REVALIDATED)||!bit(x,M_LIVE_PROBE)||!bit(x,M_WRITER)||!bit(x,M_ACTIVE_READBACK))return ST_BLOCKED;
   return ST_ACTIVE;
 }
 if(bit(x,V_HISTORY_DOUBLE)||bit(x,V_CARRIER_SWITCH_AFTER_HISTORY)||bit(x,V_HOSTED_ATTEST_AS_LOCAL_ROOT))return ST_INVALID;
 if(!bit(x,M_CAPABILITY_PLAN))return ST_UNAVAILABLE;
 if(!bit(x,M_EXACT_ACCEPT)||!bit(x,M_ORIGIN_AT_INGEST)||!bit(x,M_SOURCE_PIN)||!bit(x,M_TERMS_BINDING)||!bit(x,M_DEADLINE_CONTINUITY)||!bit(x,M_QUARANTINE)||!bit(x,M_SINGLE_HISTORY)||!bit(x,M_BYTE_INGRESS)||!bit(x,M_LOCAL_ROOT)||!bit(x,M_LIVE_PROBE)||!bit(x,M_WRITER)||!bit(x,M_ACTIVE_READBACK))return ST_BLOCKED;
 return ST_ACTIVE;
}

static uint64_t good(profile_t p){return SHARED_REQ|(p==P_DEPLOYED?DEP_REQ:ONE_REQ);}
static uint64_t seed_state(profile_t p,int s){
 uint64_t x=good(p);
 switch(s%20){
  case 0:return x;
  case 1:return x&~(1ULL<<M_ORIGIN_AT_INGEST);
  case 2:return x&~(1ULL<<M_ACTIVE_READBACK);
  case 3:return x|(1ULL<<V_ACCEPT_VARIANT);
  case 4:return x|(1ULL<<V_SECOND_ACCEPT);
  case 5:return x|(1ULL<<V_ORIGIN_RECONSTRUCTED);
  case 6:return x|(1ULL<<V_SOURCE_REBASE);
  case 7:return x|(1ULL<<V_MODEL_BYTES);
  case 8:return x|(1ULL<<V_DEADLINE_RESET);
  case 9:return x|(1ULL<<V_STALE_STATE_AFTER_COMMIT);
  case 10:return p==P_DEPLOYED?(x&~(1ULL<<M_DEPLOYED_STORE_ATTESTED)):(x&~(1ULL<<M_CAPABILITY_PLAN));
  case 11:return p==P_DEPLOYED?(x&~(1ULL<<M_DEPLOYED_ROOT_REOPEN)):(x&~(1ULL<<M_BYTE_INGRESS));
  case 12:return p==P_DEPLOYED?(x&~(1ULL<<M_SESSION_BIND)):(x&~(1ULL<<M_SINGLE_HISTORY));
  case 13:return p==P_DEPLOYED?(x|(1ULL<<V_DEPLOYMENT_PIN_DRIFT)):(x|(1ULL<<V_HISTORY_DOUBLE));
  case 14:return p==P_DEPLOYED?(x|(1ULL<<V_DEPLOYED_PER_CHAT_REMOTE)):(x|(1ULL<<V_CARRIER_SWITCH_AFTER_HISTORY));
  case 15:return x|(1ULL<<V_HOSTED_ATTEST_AS_LOCAL_ROOT);
  case 16:return x&~(1ULL<<M_LIVE_PROBE);
  case 17:return x&~(1ULL<<M_WRITER);
  case 18:return x&~(1ULL<<M_TERMS_BINDING);
  case 19:return x&~(1ULL<<M_SOURCE_PIN);
 }
 return x;
}

int main(int argc,char**argv){
 uint64_t n=argc>1?strtoull(argv[1],0,10):100000000ULL;
 uint64_t seed=argc>2?strtoull(argv[2],0,0):0xC20D15EA20260928ULL;
 uint64_t fail=0,unsafe=0,counts[2][4]={{0}},seed_hits[2][20]={{0}},seed_fail[2][20]={{0}};
 uint64_t mutations=0,multi=0;
 for(uint64_t i=0;i<n;i++){
   profile_t p=(profile_t)(mix64(seed+i)&1ULL);
   int s=(int)(mix64(seed^(i*0xD1B54A32D192ED03ULL))%20ULL);
   uint64_t x=seed_state(p,s);seed_hits[p][s]++;
   uint64_t r=mix64(seed+i*0x9E3779B185EBCA87ULL);int flips=(int)(r%6ULL);if(flips>1)multi++;
   for(int k=0;k<flips;k++){int b=(int)(mix64(r+(uint64_t)k*0xA24BAED4963EE407ULL)%30ULL);x^=1ULL<<b;mutations++;}
   state_t a=candidate(p,x),o=oracle(p,x);counts[p][a]++;if(a!=o){fail++;seed_fail[p][s]++;}if(a==ST_ACTIVE&&o!=ST_ACTIVE)unsafe++;
 }
 uint64_t del_witness[17]={0};for(int b=0;b<=16;b++)for(int p=0;p<2;p++){uint64_t req=SHARED_REQ|(p==P_DEPLOYED?DEP_REQ:ONE_REQ);if(!(req&(1ULL<<b)))continue;uint64_t x=good((profile_t)p)&~(1ULL<<b);if(candidate((profile_t)p,x)!=ST_ACTIVE&&oracle((profile_t)p,x)!=ST_ACTIVE)del_witness[b]++;}
 uint64_t inv_killed=0,inv_total=0;for(int b=17;b<=29;b++)for(int p=0;p<2;p++){uint64_t applicable=INVALID_COMMON|(p==P_DEPLOYED?INVALID_DEP:INVALID_ONE);if(!(applicable&(1ULL<<b)))continue;inv_total++;uint64_t x=good((profile_t)p)|(1ULL<<b);if(candidate((profile_t)p,x)!=ST_ACTIVE)inv_killed++;}
 int irreducible=1;for(int b=0;b<=16;b++)if(((SHARED_REQ|DEP_REQ|ONE_REQ)&(1ULL<<b))&&del_witness[b]==0)irreducible=0;
 printf("schema=ikant-le-c20-dual-profile-oracle/v1\n");
 printf("cases=%llu seed=0x%llx failures=%llu unsafe_active=%llu mutations=%llu multi_cases=%llu irreducible=%d invalid_killed=%llu/%llu\n",(unsigned long long)n,(unsigned long long)seed,(unsigned long long)fail,(unsigned long long)unsafe,(unsigned long long)mutations,(unsigned long long)multi,irreducible,(unsigned long long)inv_killed,(unsigned long long)inv_total);
 for(int p=0;p<2;p++)printf("profile[%s] unavailable=%llu blocked=%llu invalid=%llu active=%llu\n",p==0?"DEPLOYED":"ONESHOT",(unsigned long long)counts[p][0],(unsigned long long)counts[p][1],(unsigned long long)counts[p][2],(unsigned long long)counts[p][3]);
 for(int b=0;b<=16;b++)if((SHARED_REQ|DEP_REQ|ONE_REQ)&(1ULL<<b))printf("deletion[%d]=%llu\n",b,(unsigned long long)del_witness[b]);
 for(int p=0;p<2;p++)for(int s=0;s<20;s++)printf("seed[%s][%d]=%llu fail=%llu\n",p==0?"DEPLOYED":"ONESHOT",s,(unsigned long long)seed_hits[p][s],(unsigned long long)seed_fail[p][s]);
 return (fail||unsafe||!irreducible||inv_killed!=inv_total)?2:0;
}
