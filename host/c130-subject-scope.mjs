/** Advisory-only C130 subject scope. Not the original C70 owner/classifier. */
const human=/\b(?:gianluca|io (?:sono|come essere)|mia natura|un uomo|una donna|essere umano|persona umana|la mia esistenza|l'essere umano|human being|my human nature)\b/iu;
const system=/\b(?:ikant|chatgpt|come sei fatto|come funzioni|tu come software|tua (?:computazione|architettura)|modello linguistico|your architecture|your code|il runtime)\b/iu;
const third=/\b(?:il suo sistema|una azienda|un paese|un governo|la societ[aà]|un organismo|un animale|un individuo terzo)\b/iu;
export function scopeC130Question(input){
 if(typeof input!=='string'||input.length>4000||!input.trim())return {ok:false,scope:'UNRESOLVED',reason:'INPUT_BOUND'};
 const h=human.test(input),s=system.test(input),t=third.test(input);
 const count=Number(h)+Number(s)+Number(t);
 const scope=count>1?'MIXED':h?'HUMAN_PERSON':s?'SOFTWARE_IKANT':t?'THIRD_PARTY':'UNRESOLVED';
 return Object.freeze({ok:true,scope,indicators:Object.freeze({human:h,software:s,third_party:t}),
  advisory_only:true,claims_about_subjective_experience_attested:false,authority:0});
}
