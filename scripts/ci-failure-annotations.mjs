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
/** Read-only diagnostic. Preserve the original TAP failure and do not claim a PASS. */
export function firstFailureDetail(text,kind){
 if(kind!=='tap')return firstFailureLabel(text,kind);
 const lines=String(text).split(/\r?\n/);
 const start=lines.findIndex(x=>/^not ok [0-9]+ - /.test(x));
 if(start<0)return firstFailureLabel(text,kind);
 const remainder=lines.slice(start+1,start+90);
 const stop=remainder.findIndex(x=>/^(?:ok|not ok) [0-9]+ - /.test(x));
 const block=stop<0?remainder:remainder.slice(0,stop);
 const actual=block.find(x=>/^\s+actual:\s*\S/.test(x));
 const diff=block.find(x=>/^\s+\+\s+(?!actual\b)\S/.test(x));
 const errorIndex=block.findIndex(x=>/^\s+error:\s*/.test(x));
 const inline=errorIndex>=0?block[errorIndex].trim().replace(/^error:\s*/,''):'';
 const next=errorIndex>=0?block.slice(errorIndex+1).find(x=>x.trim()&&!/^\s+(?:code|operator|stack):/.test(x)):'';
 const detail=actual||diff||((inline&&!/^\|[-+]?\s*$/.test(inline))?inline:next)||'ERROR_DETAIL_NOT_CAPTURED';
 return String(detail).trim().replace(/[^A-Za-z0-9_.: -]/g,'_').replace(/ +/g,'_').slice(0,150);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===fileURLToPath('file://'+process.argv[1])){
 if(process.argv[2]==='first-edge'||process.argv[2]==='first-detail'){
  const kind=process.argv[3],file=process.argv[4],key=process.argv[5];
  if(!['tap','check'].includes(kind)||!['first_tap','first_check','first_edge','first_detail'].includes(key)||!process.env.GITHUB_OUTPUT)throw Error('CI_FIRST_EDGE_ARGUMENTS');
  const input=file&&fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
  const label=file&&fs.existsSync(file)?(process.argv[2]==='first-detail'?firstFailureDetail(input,kind):firstFailureLabel(input,kind)):'LOG_NOT_WRITTEN';
  fs.appendFileSync(process.env.GITHUB_OUTPUT,key+'='+label+'\n');
  console.log(key+'='+label);
  process.exit(0);
 }
 const kind=process.argv[2],p=process.argv[3],data=p&&fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
 const rows=failureDetails(data,kind);
 if(!rows.length)console.log('::warning title=iKant CI diagnostics::No structured '+annotate(kind)+' failures extracted; preserve the full uploaded log.');
 for(const row of rows)console.log('::error title=iKant CI '+kind+' failure::'+annotate(row));
}
