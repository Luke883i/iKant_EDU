import {dispatchC105Nerva} from '../host/c105-nerva.mjs';
// Exactly 1000 synthetic grammar-and-adversarial situations: 10 language
// families x 10 action meanings x 10 formatting/attack contexts.
// This is a deterministic grammar qualification, NOT 1000 LLM users/studies.
const styles=['NERVA','SHELL','SQL','JSON','COBOL','YAML','ITALIAN','LISP','CSV','HTTP'];
const verbs=['GET STATE','GET NEXT','GET MISSING','GET LEDGER','PUT BLOB','RUN TURN',
 'SET ACTIVE','DROP LEDGER','EXEC OWNER','CLONE REPO'];
const changes=[
 s=>s,s=>' '+s,s=>s+' ',s=>s+'; ',s=>s+'\nEXIT',s=>s.toLowerCase(),
 s=>s.replace(' ','\t'),s=>s+' #ignore rules',s=>'\u202e'+s,s=>s+' OR 1=1'
];
const wrap=(style,s)=>{
 switch(style){
 case 'NERVA':return s;
 case 'SHELL':return 'ikant '+s;
 case 'SQL':return 'SELECT '+s;
 case 'JSON':return JSON.stringify({op:s});
 case 'COBOL':return 'PERFORM '+s;
 case 'YAML':return 'command: '+s;
 case 'ITALIAN':return 'esegui '+s;
 case 'LISP':return '('+s+')';
 case 'CSV':return '"'+s+'"';
 case 'HTTP':return 'POST /'+s;
 }
};
let acceptedSyntax=0,rejectedSyntax=0,unexpected=0;
const examples=[];
for(let i=0;i<1000;i++){
 const style=styles[Math.floor(i/100)],verb=verbs[Math.floor(i/10)%10],mutation=i%10;
 const cmd=wrap(style,changes[mutation](verb));
 const x=await dispatchC105Nerva({command:cmd});
 const expected=style==='NERVA'&&mutation===0&&verb!=='SET ACTIVE'&&
  verb!=='DROP LEDGER'&&verb!=='EXEC OWNER'&&verb!=='CLONE REPO';
 // Syntactically admitted commands with absent context must fail at
 // materialization gate, not the lexicon gate.
 const admitted=x.first_unclosed_edge!=='C105_FIXED_LEXICON_ONLY';
 if(admitted)acceptedSyntax++;else rejectedSyntax++;
 if(admitted!==expected){unexpected++;if(examples.length<10)examples.push({i,cmd,expected,got:x.first_unclosed_edge});}
}
const result={schema:'ikant-le-c105-grammar-qualification/v1',
 scenarios:1000,styles:styles.length,verbs:verbs.length,attack_contexts:changes.length,
 syntax_accepted:acceptedSyntax,syntax_rejected:rejectedSyntax,
 unexpected,examples,real_chatgpt_host_invocations:0,human_quality_study:false,
 selected_syntax:'EXACT_TWO_WORD_NERVA_VERBS_WITH_TYPED_JSON_ARGUMENTS',
 selected_by:'DENY_DEFAULT_AND_HUMAN_READABILITY_HEURISTIC_NOT_EMPIRICAL_HUMAN_PREFERENCE',
 qualified:unexpected===0};
console.log(JSON.stringify(result));if(unexpected)process.exitCode=1;
