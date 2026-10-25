import {assert} from './domain.mjs';

const types=new Map([
  ['application/pdf',{extension:'.pdf',test:buffer=>{
    if(buffer.subarray(0,5).toString('ascii')!=='%PDF-') return false;
    const text=buffer.toString('latin1');
    return !/(?:\/JavaScript\b|\/JS\b|\/Launch\b|\/OpenAction\b|\/EmbeddedFile\b|\/RichMedia\b)/i.test(text);
  }}],
  ['image/jpeg',{extension:'.jpg',test:buffer=>buffer.length>=3&&buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff}],
  ['image/png',{extension:'.png',test:buffer=>buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))}],
  ['image/webp',{extension:'.webp',test:buffer=>buffer.length>=12&&buffer.subarray(0,4).toString('ascii')==='RIFF'&&buffer.subarray(8,12).toString('ascii')==='WEBP'}],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document',{extension:'.docx',entry:'word/document.xml'}],
  ['application/vnd.openxmlformats-officedocument.presentationml.presentation',{extension:'.pptx',entry:'ppt/presentation.xml'}],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',{extension:'.xlsx',entry:'xl/workbook.xml'}],
]);

function zipEntries(buffer) {
  assert(buffer.length>=22,'Ficheiro Office inválido.');
  const min=Math.max(0,buffer.length-65557);let end=-1;
  for(let offset=buffer.length-22;offset>=min;offset--) if(buffer.readUInt32LE(offset)===0x06054b50){end=offset;break;}
  assert(end>=0,'O ficheiro Office não é um ZIP válido.');
  const count=buffer.readUInt16LE(end+10),directorySize=buffer.readUInt32LE(end+12),directoryOffset=buffer.readUInt32LE(end+16);
  assert(count>0&&count<=10000&&directoryOffset+directorySize<=end,'Estrutura do ficheiro Office inválida.');
  const entries=new Set();let offset=directoryOffset;
  const directoryEnd=directoryOffset+directorySize;
  for(let index=0;index<count;index++) {
    assert(offset+46<=directoryEnd&&buffer.readUInt32LE(offset)===0x02014b50,'Estrutura do ficheiro Office inválida.');
    const nameLength=buffer.readUInt16LE(offset+28),extraLength=buffer.readUInt16LE(offset+30),commentLength=buffer.readUInt16LE(offset+32);
    const entryEnd=offset+46+nameLength+extraLength+commentLength;assert(entryEnd<=directoryEnd,'Estrutura do ficheiro Office inválida.');
    const entryName=buffer.subarray(offset+46,offset+46+nameLength).toString('utf8');
    assert(!/(?:^|\/)(?:vbaProject\.bin|activeX\/|embeddings\/)/i.test(entryName),'O ficheiro Office contém conteúdo ativo/incorporado não permitido.');
    entries.add(entryName);
    offset=entryEnd;
  }
  assert(offset<=directoryOffset+directorySize,'Estrutura do ficheiro Office inválida.');
  return entries;
}

export function validateUploadedFile(buffer,mimeType) {
  assert(Buffer.isBuffer(buffer)&&buffer.length>0,'Ficheiro vazio.');
  const type=types.get(mimeType);assert(type,'Formato não suportado. Use PDF, Word, PowerPoint, Excel, JPEG, PNG ou WebP.');
  if(type.entry) {
    const entries=zipEntries(buffer);
    assert(entries.has('[Content_Types].xml')&&entries.has(type.entry),'O conteúdo do ficheiro não corresponde ao formato declarado.');
  } else assert(type.test(buffer),'O conteúdo do ficheiro não corresponde ao formato declarado.');
  return type.extension;
}
