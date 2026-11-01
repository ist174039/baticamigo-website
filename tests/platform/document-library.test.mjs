import test from 'node:test';
import assert from 'node:assert/strict';
import {DOCUMENT_CATEGORIES,canChangeDocument,canSeeDocument,canViewLibraryItem,canEditLibraryItem,cleanName,grants,descendantsOf,safeDocumentFor} from '../../lib/platform/document-library.mjs';
const admin={uid:'admin1',roles:['admin']}, creator={uid:'owner1',roles:['member']}, outsider={uid:'outside',roles:['member']};
test('documents are private by default, including user-specific grants',()=>{
 const doc={id:'doc1',ownerUid:'owner1',viewRoles:[],editRoles:[],viewUids:[],editUids:[]};
 assert.equal(canSeeDocument(creator,doc),true);
 assert.equal(canSeeDocument(admin,doc),true);
 assert.equal(canSeeDocument(outsider,doc),false);
 assert.equal(canChangeDocument(outsider,doc),false);
 assert.equal(canViewLibraryItem(outsider,{...doc,viewUids:['outside']}),true);
 assert.equal(canEditLibraryItem(outsider,{...doc,editUids:['outside']}),true);
});
test('folder grants are inherited and deleted parents close access',()=>{
 const doc={id:'d',ownerUid:'owner1',viewRoles:[],editRoles:[]};
 const folder={id:'f',ownerUid:'other',viewRoles:['member'],editRoles:[]};
 assert.equal(canSeeDocument(outsider,doc,[folder]),true);
 assert.equal(canSeeDocument(outsider,doc,[{...folder,deletedAt:'now'}]),false);
 assert.equal(canChangeDocument(outsider,doc,[folder]),false);
});
test('deleted document is invisible even to administrator',()=>{
 const doc={id:'d',ownerUid:'owner1',deletedAt:'now'};
 assert.equal(canSeeDocument(admin,doc),false);
});
test('grants reject role spoofing and overbroad lists',()=>{
 assert.deepEqual(grants({viewRoles:['tutor','tutor']}),{viewRoles:['tutor'],editRoles:[],viewUids:[],editUids:[]});
 assert.throws(()=>grants({viewRoles:['root']}),/Perfil/);
 assert.throws(()=>grants({viewUids:new Array(41).fill('x')}),/Permissões/);
});
test('metadata does not reveal grant lists to viewers',()=>{
 const doc={id:'d',ownerUid:'owner1',storagePath:'private',viewUids:['outside'],viewRoles:['member']};
 const read=safeDocumentFor(outsider,doc);
 assert.equal('viewUids' in read,false);
 assert.equal('storagePath' in read,false);
 assert.ok(DOCUMENT_CATEGORIES.includes('investimentos'));
 assert.equal(cleanName('../segredo.pdf'),'.. segredo.pdf');
});
test('folder traversal detects cycles and depth abuse',()=>{
 assert.equal(descendantsOf('a',[{id:'a',parentId:'b'},{id:'b',parentId:'a'}]),null);
 assert.deepEqual([...descendantsOf('b',[{id:'b',parentId:'a'},{id:'a',parentId:''}])],['b','a']);
});
