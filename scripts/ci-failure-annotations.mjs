import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
export function failureDetails(text,kind){
 const lines=String(text).split(/\r?\n/),out=[];
 if(kind==='tap'){
  for(const line of lines)if(/^(?:not ok [0-9]+ - |\s+error: |\s+code: )/.test(line))out.push(line.trim());
 }else if(kind==='check'){
  for(const line of lines){
   const pos=line.indexOf('{"status":"FAIL"');
   if(pos>=0){try{const parsed=JSON.parse(line.slice(pos));if(Array.isArray(parsed.errors))out.push(...parsed.errors.map(String));}catch{}}
   if(/^\s*(?:Error:|error:)/.test(line))out.push(line.trim());
  }
 }else throw Error('CI_DIAGNOSTIC_UNKNOWN_KIND');
 return [...new Set(out)].slice(0,24);
}
export function annotate(s){return String(s).replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A').slice(0,300);}
export function firstFailureLabel(text,kind){
 const rows=failureDetails(text,kind);
 const selected=rows.find(s=>s.startsWith('not ok '))||rows[0]||'UNSTRUCTURED_FAILURE';
 return selected.replace(/[^A-Za-z0-9_.: -]/g,'_').trim().replace(/ +/g,'_').slice(0,145);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===fileURLToPath('file://'+process.argv[1])){
 if(process.argv[2]==='first-edge'){
  const kind=process.argv[3],file=process.argv[4],key=process.argv[5];
  if(!['tap','check'].includes(kind)||!['first_tap','first_check','first_edge'].includes(key)||!process.env.GITHUB_OUTPUT)throw Error('CI_FIRST_EDGE_ARGUMENTS');
  const input=file&&fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
  const label=file&&fs.existsSync(file)?firstFailureLabel(input,kind):'LOG_NOT_WRITTEN';
  fs.appendFileSync(process.env.GITHUB_OUTPUT,key+'='+label+'\n');
  console.log(key+'='+label);
  process.exit(0);
 }
 const kind=process.argv[2],p=process.argv[3],data=p&&fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
 const rows=failureDetails(data,kind);
 if(!rows.length)console.log('::warning title=iKant CI diagnostics::No structured '+annotate(kind)+' failures extracted; preserve the full uploaded log.');
 for(const row of rows)console.log('::error title=iKant CI '+kind+' failure::'+annotate(row));
}
