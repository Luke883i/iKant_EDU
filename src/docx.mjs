import fs from 'node:fs';
import crypto from 'node:crypto';

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}
function u16(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n >>> 0); return b; }
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; }
function xml(s) { return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;'); }
function zipStore(entries) {
  const locals = [], centrals = []; let offset = 0;
  for (const [name, dataRaw] of entries) {
    const nameBuf = Buffer.from(name, 'utf8'); const data = Buffer.isBuffer(dataRaw) ? dataRaw : Buffer.from(dataRaw, 'utf8'); const crc = crc32(data);
    const local = Buffer.concat([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameBuf.length),u16(0),nameBuf,data]);
    const central = Buffer.concat([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(nameBuf.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nameBuf]);
    locals.push(local); centrals.push(central); offset += local.length;
  }
  const central = Buffer.concat(centrals); const end = Buffer.concat([u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(central.length),u32(offset),u16(0)]); return Buffer.concat([...locals, central, end]);
}
function paragraph(text, style = '') { const pPr = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''; return `<w:p>${pPr}<w:r><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`; }
export function buildBacklogDocx(model) {
  const body = [paragraph(model.title,'Title'),paragraph('TRACE/TELEMETRY; NOT INDEPENDENT EVIDENCE; NO PRIVATE CHAIN-OF-THOUGHT.'),paragraph(`Cycle: ${model.cycle}`),paragraph(`Terminal: ${model.terminal}`)];
  for (const section of model.sections) { body.push(paragraph(section.title,'Heading1')); for (const item of section.items) body.push(paragraph(`• ${item}`)); }
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="22"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="34"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style></w:styles>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const docRels = `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  return zipStore([['[Content_Types].xml',contentTypes],['_rels/.rels',rels],['word/document.xml',document],['word/styles.xml',styles],['word/_rels/document.xml.rels',docRels]]);
}
export function writeBacklogDocx(filePath, model) {
  const bytes = buildBacklogDocx(model); fs.writeFileSync(filePath, bytes, { mode: 0o600 }); const reread = fs.readFileSync(filePath);
  if (!reread.equals(bytes) || reread.readUInt32LE(0) !== 0x04034b50) throw new Error('FAILURE: DOCX readback mismatch');
  return { bytes: bytes.length, sha256: crypto.createHash('sha256').update(reread).digest('hex'), readback_verified: true, media_type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
}

export function writeBacklogDocxAtomic(filePath, model) {
  const bytes = buildBacklogDocx(model); fs.mkdirSync(requireDir(filePath),{recursive:true}); const tmp=filePath+'.tmp-'+crypto.randomUUID();
  let fd=null; try{fd=fs.openSync(tmp,'wx',0o600);fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{if(fd!==null)fs.closeSync(fd);}
  if(fs.existsSync(filePath)){const prior=fs.readFileSync(filePath);if(!prior.equals(bytes)){try{fs.unlinkSync(tmp);}catch{}throw new Error('FAILURE: DOCX content-address collision');}try{fs.unlinkSync(tmp);}catch{}}else fs.renameSync(tmp,filePath);
  const reread=fs.readFileSync(filePath);if(!reread.equals(bytes)||reread.readUInt32LE(0)!==0x04034b50)throw new Error('FAILURE: DOCX atomic readback mismatch');
  return {bytes:bytes.length,sha256:crypto.createHash('sha256').update(reread).digest('hex'),readback_verified:true,atomic_publish:true,media_type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
}
function requireDir(filePath){const i=Math.max(filePath.lastIndexOf('/'),filePath.lastIndexOf('\\'));return i<0?'.':filePath.slice(0,i)||'.';}
