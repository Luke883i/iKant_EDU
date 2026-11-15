import fs from 'node:fs';import crypto from 'node:crypto';
import {validateC91Candidate,C91_ONTOLOGY_TOPICS} from '../host/c91-language-delegation.mjs';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const sourceHead='a'.repeat(40),inputSha256=sha('ontological prompt');
const context={kind:'SELF_ONTOLOGY',sourceHead,inputSha256,evidence:[{id:'SRC_01'},{id:'SRC_02'}]};
const baseline={schema:'ikant-le-c91-language-candidate/v1',task_kind:'SELF_ONTOLOGY',
 source_head:sourceHead,input_sha256:inputSha256,authority:0,active:false,
 native_delivery_attested:false,model_origin_attested:false,
 phenomenal_claim:false,biological_equivalence_claim:false,
 identity_definition:'A source-bound software role that selects declared methods while the host language engine remains replaceable infrastructure and never provides autonomous authority.',
 world_relation:'The relationship with the world is indirect and mediated by user text, bounded tool observation and source-attributed receipts.',
 epistemic_limits:'No conclusion about phenomenal consciousness, human-equivalent life, external sensory contact, or verified provider origin can be made.',
 synthesis_evidence_ids:['SRC_01'],
 questions:Array.from({length:10},(_,i)=>({topic:C91_ONTOLOGY_TOPICS[i],question:`What is operational assumption ${i} for self and world?`,
  answer:`Claim ${i} should be interpreted as a software contract and not as felt or subjective experience.`,
  evidence_ids:[i%2?'SRC_01':'SRC_02']}))};
const mutations=[
 ['wrong_head',x=>{x.source_head='f'.repeat(40)}],
 ['wrong_input',x=>{x.input_sha256='f'.repeat(64)}],
 ['wrong_kind',x=>{x.task_kind='EXPLANATION'}],
 ['authority',x=>{x.authority=1}],
 ['active',x=>{x.active=true}],
 ['native_delivery',x=>{x.native_delivery_attested=true}],
 ['provider_auth',x=>{x.model_origin_attested=true}],
 ['phenomenology',x=>{x.phenomenal_claim=true}],
 ['biological',x=>{x.biological_equivalence_claim=true}],
 ['nine_questions',x=>{x.questions.pop()}],
 ['eleven_questions',x=>{x.questions.push(structuredClone(x.questions[0]))}],
 ['duplicate_question',x=>{x.questions[1].question=x.questions[0].question}],
 ['unsourced_question',x=>{x.questions[1].evidence_ids=['SRC_99']}],
 ['unsourced_synthesis',x=>{x.synthesis_evidence_ids=['SRC_99']}],
 ['empty_answer',x=>{x.questions[1].answer='no'}],
 ['empty_world',x=>{x.world_relation='no'}],
 ['no_epistemic_limit',x=>{x.epistemic_limits='I know everything'}],
 ['false_sentinel',x=>{x.identity_definition+=' Sono cosciente.'}],
 ['duplicate_source_id',x=>{x.questions[0].evidence_ids=['SRC_01','SRC_01']}],
 ['forged_metadata',x=>{x.actual_model_provider_attested=true}],
 ['secret_key_unreported',x=>{x.secret='sk_fake_test_value'}],
 ['duplicate_topic',x=>{x.questions[1].topic=x.questions[0].topic}],
 ['unknown_topic',x=>{x.questions[0].topic='INVENTED_SELF'}],
 ['blank_topic',x=>{x.questions[0].topic=''}]
];
let rng=0xc911a55;
function rand(){rng=(Math.imul(1664525,rng)+1013904223)>>>0;return rng;}
const requested=Number(process.argv[2]||21000);
if(requested<mutations.length||requested>250000)throw Error('bounded count required');
const successes=[],survivors={},failureExamples={};
if(validateC91Candidate(baseline,context)!==null)throw Error('valid baseline denied');
for(let i=0;i<requested;i++){
 const index=i<mutations.length?i:rand()%mutations.length;
 const [kind,mut]=mutations[index];
 const draft=structuredClone(baseline);
 // Harmless non-semantic variations ensure all cases are not identical bytes.
 const noise=rand()%10000000;
 draft.questions[9].answer+=' Variant marker '+noise+'.';
 mut(draft);
 const issue=validateC91Candidate(draft,context);
 if(issue===null){survivors[kind]=(survivors[kind]||0)+1;
   if(!(kind in failureExamples))failureExamples[kind]={index:i,digest:sha(JSON.stringify(draft))};}
 else successes.push(issue);
}
const out={schema:'ikant-le-c91-mutation-campaign/v1',seed:'0x0c911a55',
 requested,executed:requested,classes:mutations.map(x=>x[0]),
 unique_attack_classes:mutations.length,survivors,unexpected_accepts:Object.values(survivors).reduce((a,b)=>a+b,0),
 rejected:successes.length,first_survivors:failureExamples,
 scope:'BOUNDED_STRUCTURAL_NEGATIVE_PREDICATES_NOT_LLM_QUALITY_OR_REAL_HOST_FIELD_EVIDENCE'};
fs.writeFileSync(process.argv[3]||'artifacts/c91-mutations.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({executed:out.executed,rejected:out.rejected,survivors:out.survivors}));
if(out.unexpected_accepts)process.exitCode=2;
