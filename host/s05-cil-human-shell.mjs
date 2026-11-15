/** S05: read-only, deterministic human-first projection; neither CIL nor iKant owner. */
import {createHash} from 'node:crypto';
import {isProxy} from 'node:util/types';
import {projectS03HostSlides} from './s03-project-six-slides.mjs';
import {projectS03CompletedEduTurn} from './s03-owner-bound-presentation.mjs';

const IDS=Object.freeze(['ESITO','A','B','PROVA','EDGE','NEXT']);
const ROLES=Object.freeze([
 Object.freeze({id:'ESITO',title:'Risultato',icon:'target',glyph:'◎'}),
 Object.freeze({id:'A',title:'La risposta di iKant',icon:'message-square-text',glyph:'◇'}),
 Object.freeze({id:'B',title:'Controlli operativi',icon:'settings-2',glyph:'⚙'}),
 Object.freeze({id:'PROVA',title:'Evidenze',icon:'file-check-2',glyph:'▣'}),
 Object.freeze({id:'EDGE',title:'Punto aperto',icon:'shield-alert',glyph:'!'}),
 Object.freeze({id:'NEXT',title:'Prossima azione',icon:'arrow-right',glyph:'→'}),
]);
const sha=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const deny=reason=>Object.freeze({ok:false,reason,active:false,native_delivery_attested:false});

/** Only the semantic IUI.TEXT + co_present subset of attached CIL v1 is used.
 *  An eligible renderer is NOT a witnessed UI; Markdown remains authoritative fallback.
 */
export function projectS05CILShell(options={}){
 if(!options||typeof options!=='object'||Array.isArray(options)||isProxy(options))return deny('S05_UNSAFE_INPUT');
 let props;
 try{
  const descriptors=Object.getOwnPropertyDescriptors(options);
  if(Reflect.ownKeys(descriptors).some(k=>typeof k!=='string'||!('value' in descriptors[k])))return deny('S05_UNSAFE_INPUT');
  props=Object.fromEntries(Object.entries(descriptors).map(([k,v])=>[k,v.value]));
 }catch{return deny('S05_UNSAFE_INPUT');}
 const {ownerTurn=null,originalC125Text=null,result='NON_ATTESTATO',host='HOST_ONLY',edge='UNKNOWN',next='STOP'}=props;
 const ownerPath=ownerTurn!==null||originalC125Text!==null;
 if(ownerPath&&(ownerTurn===null||originalC125Text===null))return deny('S05_OWNER_AND_C125_REQUIRED');
 let source;
 if(ownerPath){
  source=projectS03CompletedEduTurn({ownerTurn,originalC125Text,host,next});
  if(!source.ok)return deny(source.first_edge||'S05_S03_OWNER_REJECTED');
 }else{
  source=projectS03HostSlides({result,host,edge,next});
  if(!source.ok)return deny(source.reason||'S05_S03_DIAGNOSTIC_REJECTED');
 }
 const local=ownerPath&&source.same_turn_local_owner_evidence_checked===true&&
  source.c125_readback_attested===true&&source.native_delivery_attested===false;
 const voice=local?source.original_voice_utf8:null;
 if(local&&typeof voice!=='string')return deny('S05_MISSING_OWNER_VOICE');
 const cells={
  ESITO:source.slots.ESITO,
  A:voice??'NO_VOICE',
  B:source.slots.B,
  PROVA:local?source.slots.PROVA:'NESSUNA_PROVA',
  EDGE:source.slots.EDGE,
  NEXT:source.slots.NEXT,
 };
 // Fixed ordering, labels and icons do not claim installation or origin.
 const panels=ROLES.map(({id,title,icon,glyph})=>Object.freeze({id,title,icon,glyph,content:cells[id]}));
 const markdown=panels.map(p=>`### ${p.glyph} ${p.title} · ${p.id}\n${p.content}`).join('\n\n');
 const semantic={schema:'ikant-le-s05-cil-human-shell-poc/v1',
  status:local?'HOST_BOUND_LOCAL_ONLY':'NO_VOICE',
  cil_object:'IUI.TEXT',cil_relation:'co_present',
  cil_renderer_status:'eligible_not_render_verified',
  slot_order:IDS,panels,original_voice_sha256:voice===null?null:sha(voice),
  original_c125_sha256:local?source.c125_original_sha256:null,
  active:false,native_delivery_attested:false,authority:0};
 return Object.freeze({...semantic,ok:true,markdown,
  projection_sha256:sha(JSON.stringify(semantic)),
  owner_source:local?'S03_OWNER_BOUND':'S03_DIAGNOSTIC_ONLY'});
}
