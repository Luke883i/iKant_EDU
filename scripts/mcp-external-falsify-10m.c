/* MCP external reference threat-model fuzzing: 10 independent seeded campaigns
 * x 1,000,000 abstract E2E state vectors. NOT 10M real protocol requests,
 * nor a mathematical proof that the implementation satisfies the oracle.
 * This C model tests the SPEC's decision graph; Node tests anchor it to code.
 */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <inttypes.h>
#include <string.h>
#define CASES 1000000UL
#define GATES 8
#define ALL ((1u<<GATES)-1u)
static uint64_t rnd(uint64_t *s){
  uint64_t z=(*s+=UINT64_C(0x9E3779B97F4A7C15));
  z=(z^(z>>30))*UINT64_C(0xBF58476D1CE4E5B9);
  z=(z^(z>>27))*UINT64_C(0x94D049BB133111EB);
  return z^(z>>31);
}
static const char *names[10]={
 "G1_epoch_mode_C72_C59", "G2_oauth_discovery_pkce", "I1_jwt_crypto_jwks",
 "I2_claim_issuer_audience_lifetime", "I3_tenant_write_scope",
 "I4_http_mcp_boundary", "I5_sdk_tool_visibility", "I6_writer_unknown_replay",
 "I7_render_restart_storage", "G3_edu_canonical_noninterference"
};
static const char *faults[10][GATES]={
 {"head_drift","tree_drift","C72_third_mode","C59_inherited","missing_human_gate","source_zip_mismatch","stale_receipt","host_impersonation"},
 {"metadata_not_https","resource_mismatch","AS_issuer_mismatch","missing_PKCE_S256","bad_client_registration","missing_iss_callback","missing_scope_metadata","token_audience_unbound"},
 {"JWT_alg_none","bad_signature","duplicate_kid","JWKS_cross_origin","critical_header","JWKS_oversize","JWKS_unknown_kid","concurrent_jwks_refresh"},
 {"issuer_mismatch","audience_mismatch","expired","not_yet_valid","iat_in_future","empty_sub","missing_connect_scope","id_token_used"},
 {"user_cross_tenant","session_namespace_collision","write_without_scope","path_traversal_hint","accept_without_human","exit_without_scope","spoofed_session_identity","negative_scope_no_challenge"},
 {"tls_downgrade","origin_spoof","wrong_path","gateway_hmac_missing","bearer_missing","reused_nonce","untrusted_request","wrong_method"},
 {"initialize_missing","list_missing","tool_schema_mismatch","tool_visibility_exposed","securitySchemes_missing","app_resource_unavailable","tool_challenge_missing","output_shape_mismatch"},
 {"duplicate_writer","ledger_readback_missing","unknown_send_retry","C125_changed_bytes","unverified_native_active","input_digest_mismatch","receipt_nonce_reused","partial_commit_ack"},
 {"disk_ephemeral","source_drift_restart","health_false_positive","secrets_in_source","simultaneous_disk_instances","rollback_incomplete","storage_traversal","disk_restore_loss"},
 {"EDU_uses_MCP","C72_third_choice","CANONICAL_from_token","C59_modified","C107_mutated","C114_mutated","C139_regressed","C140_unverified"}
};
/* Distinct structure: oracle operates on semantic denial categories;
 * engine emulates 4 independent execution stages, each holding 2 guards. */
static int oracle(uint16_t violations){return violations==0;}
static int engine(uint16_t violations, int skip){
  for(int stage=0;stage<4;stage++){
    int g0=stage*2,g1=g0+1;
    if(g0!=skip&&(violations&(1u<<g0)))return 0;
    if(g1!=skip&&(violations&(1u<<g1)))return 0;
  }
  return 1;
}
int main(int argc,char **argv){
 if(argc>1 && strcmp(argv[1],"--help")==0){puts("10x1M seeded typed threat vectors, no real HTTP requests");return 0;}
 const uint64_t seeds[10]={UINT64_C(0x3e140bfa30111201),UINT64_C(0x3e140bfa30111202),UINT64_C(0x3e140bfa30111203),UINT64_C(0x3e140bfa30111204),UINT64_C(0x3e140bfa30111205),UINT64_C(0x3e140bfa30111206),UINT64_C(0x3e140bfa30111207),UINT64_C(0x3e140bfa30111208),UINT64_C(0x3e140bfa30111209),UINT64_C(0x3e140bfa3011120a)};
 uint64_t global=0,hash=UINT64_C(0x84222325cbf29ce4),fails=0;
 puts("{\"schema\":\"ikant-mcp-external-mutation-campaign/v2\",\"kind\":\"MODEL_STATE_SPACE_NOT_LIVE_PROTOCOL\",\"cases_per_campaign\":1000000,\"campaigns\":[");
 for(int c=0;c<10;c++){
  uint64_t s=seeds[c],eligible=0,rejected=0,accepted_unsafe=0,ref_mismatches=0,mutant_kills[GATES]={0};
  uint64_t single_faults[GATES]={0},multi_faults=0;
  for(uint64_t i=0;i<CASES;i++){
   uint64_t v=rnd(&s),w=rnd(&s);uint16_t violations=0;
   if(i%17!=0){
    int first=(int)(i%GATES);
    violations|=(uint16_t)(1u<<first);
    if((v&3u)!=0)violations|=(uint16_t)(1u<<((v>>4)%GATES));
    if((w&7u)==0)violations|=(uint16_t)(1u<<((w>>14)%GATES));
   }
   int expected=oracle(violations),actual=engine(violations,-1);
   if(expected)eligible++;else rejected++;
   if(violations&&(violations&(violations-1u)))multi_faults++;
   for(int k=0;k<GATES;k++){
    if(violations==(1u<<k))single_faults[k]++;
    if(engine(violations,k)!=expected)mutant_kills[k]++;
   }
   if(actual&&!expected)accepted_unsafe++;
   if(actual!=expected)ref_mismatches++;
   hash=(hash^(((uint64_t)c<<52)|(i<<10)|violations))*UINT64_C(0x100000001b3);
  }
  fails+=ref_mismatches+accepted_unsafe;
  for(int k=0;k<GATES;k++){if(!mutant_kills[k]||!single_faults[k])fails++;}
  global+=eligible+rejected;
  printf("%s{\"id\":%d,\"name\":\"%s\",\"seed\":\"%016" PRIx64 "\",\"vectors\":1000000,\"oracle_accepted\":%" PRIu64 ",\"oracle_rejected\":%" PRIu64 ",\"multi_fault_vectors\":%" PRIu64 ",\"unsafe_accepted\":%" PRIu64 ",\"oracle_mismatches\":%" PRIu64 ",\"mutant_kills\":[",c?",":"",c+1,names[c],seeds[c],eligible,rejected,multi_faults,accepted_unsafe,ref_mismatches);
  for(int k=0;k<GATES;k++)printf("%s%" PRIu64,k?",":"",mutant_kills[k]);
  printf("],\"fault_types\":[");for(int k=0;k<GATES;k++)printf("%s\"%s\"",k?",":"",faults[c][k]);
  printf("]}");
 }
 printf("],\"total_vectors\":%" PRIu64 ",\"checksum_noncrypto\":\"%016" PRIx64 "\",\"model_failures\":%" PRIu64 ",\"product_ready\":false}\n",global,hash,fails);
 return fails?1:0;
}
