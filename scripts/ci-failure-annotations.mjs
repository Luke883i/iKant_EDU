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
if(process.argv[1]&&fileURLToPath(import.meta.url)===fileURLToPath('file://'+process.argv[1])){
 const kind=process.argv[2],p=process.argv[3],data=p&&fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
 const rows=failureDetails(data,kind);
 if(!rows.length)console.log('::warning title=iKant CI diagnostics::No structured '+annotate(kind)+' failures extracted; preserve the full uploaded log.');
 for(const row of rows)console.log('::error title=iKant CI '+kind+' failure::'+annotate(row));
}
