import test from 'node:test';
import assert from 'node:assert/strict';
import {validateUploadedFile} from '../../lib/platform/file-validation.mjs';

function minimalOfficeZip(entries) {
  const records=entries.map(name=>{const filename=Buffer.from(name);const entry=Buffer.alloc(46+filename.length);entry.writeUInt32LE(0x02014b50,0);entry.writeUInt16LE(filename.length,28);filename.copy(entry,46);return entry;});
  const directory=Buffer.concat(records);const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(0,16);return Buffer.concat([directory,end]);
}

test('accepts supported file signatures and rejects a MIME type spoof',()=>{
  assert.equal(validateUploadedFile(Buffer.from('%PDF-1.7\n'), 'application/pdf'),'.pdf');
  assert.equal(validateUploadedFile(Buffer.from([0xff,0xd8,0xff,0]), 'image/jpeg'),'.jpg');
  assert.equal(validateUploadedFile(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), 'image/png'),'.png');
  assert.equal(validateUploadedFile(Buffer.from('RIFFxxxxWEBP'), 'image/webp'),'.webp');
  assert.throws(()=>validateUploadedFile(Buffer.from('<html>'), 'application/pdf'),/não corresponde/);
  assert.throws(()=>validateUploadedFile(Buffer.from('%PDF-1.7'), 'text/html'),/Formato não suportado/);
  assert.throws(()=>validateUploadedFile(Buffer.from('%PDF-1.7\n1 0 obj << /OpenAction 2 0 R /JavaScript true >>'), 'application/pdf'),/não corresponde/);
});

test('checks Office ZIP central-directory entries before accepting the extension',()=>{
  const docx=minimalOfficeZip(['[Content_Types].xml','word/document.xml']);
  assert.equal(validateUploadedFile(docx,'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),'.docx');
  assert.throws(()=>validateUploadedFile(minimalOfficeZip(['[Content_Types].xml','word/styles.xml']),'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),/não corresponde/);
  assert.throws(()=>validateUploadedFile(Buffer.from('not a zip'),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
  assert.throws(()=>validateUploadedFile(minimalOfficeZip(['[Content_Types].xml','word/document.xml','word/vbaProject.bin']),'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),/conteúdo ativo/);
  assert.throws(()=>validateUploadedFile(minimalOfficeZip(['[Content_Types].xml','xl/workbook.xml','xl/activeX/activeX1.xml']),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),/conteúdo ativo/);
});
