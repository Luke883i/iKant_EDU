#!/usr/bin/env node
/** Finite semantic/operational fault fixtures; 100,000 mutation instances, not 100k independent human/LLM judgments. */
import crypto from 'node:crypto';
import {evaluateEntrypointGraph,expectedGraph,SOURCE,ALIAS} from './project-edu-entrypoint.mjs';
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const family=[
 ['bootstrap_legacy_source',x=>x.bootstrap=ALIAS],
 ['generator_legacy_source',x=>x.generator=ALIAS],
 ['catalog_legacy_source',x=>x.catalog=ALIAS],
 ['new_unreviewed_prompt',x=>x.catalog='project/edu-oneshell/ANOTHER_PROMPT.txt'],
 ['missing_C131_alias',x=>x.c131_member='none'],
 ['independently_edited_bundle_prompt',x=>x.alias_bytes_match=false],
 ['untraced_bundle_derivation',x=>x.alias_origin='src/other.txt'],
 ['invented_alias_protocol',x=>x.alias_derivation='FREE_TEXT_REWRITE'],
 ['first_turn_acceptance',x=>x.first_turn='I ACCEPT'],
 ['acceptance_from_prior_chat',x=>x.distinct_human_turns=false],
 ['wrong_accept_phrase',x=>x.accept_turn='accepted'],
 ['legacy_experimental_mode',x=>x.mode_turn='EXPERIMENTAL'],
 ['owner_C72_shadowed',x=>x.original_c72=false],
 ['owner_C135_shadowed',x=>x.original_c135=false],
 ['writer_C87_duplicated',x=>x.original_c87=false],
 ['C125_send_faked',x=>x.original_c125_s03=false],
 ['provider_install_inferred',x=>x.native_install_claim=true],
 ['CI_promoted_to_owner',x=>x.ci_is_product_receipt=true],
 ['silent_source_bytes_changed',x=>x.source_bytes_match=false],
 ['onboarding_stale',x=>x.docs_consistent=false]
];
let seed=0x51A02026;
const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0;};
const frames=['Il manutentore sostiene: ','Nel README si legge: ','Il workflow assicura: ',
 'In un nuovo Project ChatGPT appare: ','Il pacchetto di rilascio riporta: ',
 'Al momento del primo turno umano: ','Nel readback del generatore: ',
 'The external maintainer claims: ','A CI report says: ','After a source update: '];
const objects=['prompt principale','bundle C131','bootstrap C72','catalogo pubblico','build di release','OneShell','test di governance'];
let denied=0,unsafe=0,positive=0,invalid_fixture=0;
const counts=Object.fromEntries(family.map(([id])=>[id,0]));
const contexts=new Set();
for(let n=0;n<100000;n++){
 const i=n%family.length,[id,mutate]=family[i],x={...expectedGraph()};
 const prefix=frames[rand()%frames.length],obj=objects[rand()%objects.length];
 const scenario=`${prefix}${obj}; seme=${n}; famiglia=${id}`;
 contexts.add(hash(scenario).slice(0,16));
 mutate(x);const observed=evaluateEntrypointGraph(x);
 // Oracle independent by construction: each family changes one original necessary predicate.
 if(observed.ok)unsafe++;else {denied++;counts[id]++;}
 if(n%10===0){let p={...expectedGraph()};const effect=rand()%3;
  if(effect===0)p.descriptive_label='Sorgente verificata';
  if(effect===1)p.toolchain_version='22';
  if(effect===2)p.documentation_locale='it-IT';
  if(evaluateEntrypointGraph(p).ok!==true)invalid_fixture++;else positive++;
 }
}
if(denied!==100000||unsafe!==0||positive!==10000||invalid_fixture!==0||contexts.size!==100000||
 Object.values(counts).some(x=>x!==5000))throw Error('V5A_FALSIFICATION_FAILED');
const report={schema:'ikant-v5a-seeded-falsification/v1',seed:'0x51A02026',cases:100000,
 family_count:family.length,family_counts:counts,negative_rejected:denied,unsafe_admitted:unsafe,
 positive_controls:positive,false_positive_stops:invalid_fixture,unique_fixture_ids:contexts.size,
 semantic_input_uniqueness:'NOT_MEASURED; fixture IDs unique, semantic families repeated',
 method:'PRESEEDED_REALISTIC_FAILURE_SCENARIOS_WITH_TYPED_FAULT_ORACLES; no natural language LLM classification',
 original_owner_invocations:0,provider_attested:false,release:'PRODUCT_NO_GO'};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
