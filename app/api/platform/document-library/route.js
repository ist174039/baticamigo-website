import {createHash,randomUUID} from 'node:crypto';
import {context,collection,audit,json,failure,assertTrustedOrigin} from '../../../../lib/platform/server';
import {assert,id,hasRole} from '../../../../lib/platform/domain.mjs';
import {validateUploadedFile} from '../../../../lib/platform/file-validation.mjs';
import {
  DOCUMENT_CATEGORIES,DOCUMENT_MAX_BYTES,cleanText,cleanName,grants,
  isLibraryAdmin,canViewLibraryItem,canEditLibraryItem,canSeeDocument,
  canChangeDocument,safeDocumentFor,isSafeVersionId
} from '../../../../lib/platform/document-library.mjs';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const MAX_ROWS=500;
const folders=db=>collection(db,'document_folders');
const documents=db=>collection(db,'document_items');
const versions=db=>collection(db,'document_versions');
const now=()=>new Date().toISOString();
const docId=value=>id(String(value||''));
const active=data=>!!data&&!data.deletedAt;
const owner=(account,item)=>isLibraryAdmin(account)||item?.ownerUid===account.uid;

function permissionInput(body) {
  try { return grants(body); }
  catch { assert(false,'Selecione permissões válidas.',400); }
}
function metadata(body) {
  const title=cleanText(body.title,160);
  assert(title.length>=2,'Introduza um título de pelo menos 2 caracteres.',400);
  const category=String(body.category||'outros');
  assert(DOCUMENT_CATEGORIES.includes(category),'Categoria inválida.',400);
  return {title,category,description:cleanText(body.description,1500)};
}
async function readBounded(ref) {
  const snapshot=await ref.limit(MAX_ROWS+1).get();
  assert(snapshot.size<=MAX_ROWS,'O arquivo atingiu o limite de listagem. Contacte a administração.',409);
  return snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
}
async function folderAncestors(db,folderId) {
  const result=[],seen=new Set();
  let next=folderId;
  while(next) {
    assert(!seen.has(next)&&result.length<12,'Hierarquia de pastas inválida.',409);
    seen.add(next);
    const snapshot=await folders(db).doc(docId(next)).get();
    assert(snapshot.exists&&active(snapshot.data()),'Pasta não encontrada.',404);
    result.push({id:snapshot.id,...snapshot.data()});
    next=snapshot.data().parentId||'';
  }
  return result;
}
async function folderForWrite(db,account,folderId) {
  if(!folderId) {
    assert(isLibraryAdmin(account)||hasRole(account,'coordinator'),'Sem permissão para criar na raiz.',403);
    return [];
  }
  const chain=await folderAncestors(db,folderId);
  assert(chain.some(folder=>canEditLibraryItem(account,folder)),'Sem permissão na pasta.',403);
  return chain;
}
async function documentContext(db,account,documentId) {
  const ref=documents(db).doc(docId(documentId));
  const snapshot=await ref.get();
  assert(snapshot.exists,'Documento não encontrado.',404);
  const item={id:snapshot.id,...snapshot.data()};
  const ancestors=await folderAncestors(db,item.folderId||'');
  return {ref,item,ancestors};
}
async function bodyJson(request) {
  assertTrustedOrigin(request);
  assert((request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'),'Conteúdo inválido.',415);
  const raw=await request.text();
  assert(raw.length<24000,'Pedido demasiado grande.',413);
  try {const parsed=JSON.parse(raw);assert(parsed&&typeof parsed==='object'&&!Array.isArray(parsed),'Pedido inválido.',400);return parsed;}
  catch {assert(false,'JSON inválido.',400);}
}
function versionResponse(item,record) {
  return {id:record.id,documentId:item.id,number:record.number,name:record.name,size:record.size,mime:record.mime,sha256:record.sha256,createdAt:record.createdAt};
}

export async function GET(request) {
  try {
    const {db,account,storage}=await context(request);
    const url=new URL(request.url);
    const documentId=url.searchParams.get('documentId');
    if(!documentId) {
      const [allFolders,allDocuments]=await Promise.all([readBounded(folders(db)),readBounded(documents(db))]);
      const visibleFolders=allFolders.filter(folder=>active(folder)&&canViewLibraryItem(account,folder));
      const visibleDocs=allDocuments.filter(doc=>active(doc)&&canSeeDocument(account,doc,allFolders.filter(folder=>folder.id===doc.folderId||doc.folderId&&folder.id===doc.folderId)));
      return json({folders:visibleFolders.map(f=>safeDocumentFor(account,f)),documents:visibleDocs.map(doc=>safeDocumentFor(account,doc))});
    }
    const {item,ancestors}=await documentContext(db,account,documentId);
    assert(canSeeDocument(account,item,ancestors),'Sem permissão para consultar este documento.',403);
    const requestedVersion=url.searchParams.get('versionId');
    if(requestedVersion) {
      assert(isSafeVersionId(requestedVersion),'Versão inválida.',400);
      const vs=await versions(db).doc(requestedVersion).get();
      assert(vs.exists&&vs.data().documentId===item.id,'Versão inexistente.',404);
      const version=vs.data();
      const [bytes]=await storage.file(version.storagePath).download();
      assert(bytes.length<=DOCUMENT_MAX_BYTES,'Ficheiro inválido.',413);
      const disposition=url.searchParams.get('download')==='1'?'attachment':'inline';
      const name=cleanName(version.name||'documento').replace(/["\\]/g,'');
      return new Response(bytes,{status:200,headers:{
        'Content-Type':version.mime||'application/octet-stream',
        'Content-Disposition':disposition+'; filename="'+name+'"',
        'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',
        'Content-Security-Policy':"default-src 'none'; sandbox"
      }});
    }
    const history=(await readBounded(versions(db).where('documentId','==',item.id)))
      .sort((a,b)=>b.number-a.number).map(version=>versionResponse(item,version));
    return json({document:safeDocumentFor(account,item),versions:history,canEdit:canChangeDocument(account,item,ancestors),canManagePermissions:owner(account,item)});
  } catch(error) {return failure(error);}
}

export async function POST(request) {
  try {
    const {db,account,storage}=await context(request);
    const type=(request.headers.get('content-type')||'').toLowerCase();
    if(type.startsWith('multipart/form-data')) {
      assertTrustedOrigin(request);
      const length=Number(request.headers.get('content-length')||0);
      assert(length>0&&length<=DOCUMENT_MAX_BYTES+100000,'Ficheiro demasiado grande.',413);
      const form=await request.formData(),file=form.get('file');
      assert(file&&typeof file.arrayBuffer==='function','Selecione um ficheiro.',400);
      assert(file.size>0&&file.size<=DOCUMENT_MAX_BYTES,'Ficheiro demasiado grande.',413);
      const buffer=Buffer.from(await file.arrayBuffer());
      const ext=validateUploadedFile(buffer,file.type);
      const name=cleanName(file.name||'documento'+ext);
      assert(name,'O ficheiro deve ter um nome válido.',400);
      const existingId=String(form.get('documentId')||'');
      const folderId=String(form.get('folderId')||'');
      let docRef,item,ancestors=[];
      const stamp=now();
      if(existingId) {
        const located=await documentContext(db,account,existingId);
        docRef=located.ref;item=located.item;ancestors=located.ancestors;
        assert(active(item)&&canChangeDocument(account,item,ancestors),'Sem permissão para adicionar versões.',403);
      } else {
        ancestors=await folderForWrite(db,account,folderId);
        docRef=documents(db).doc();
        let rawPermissions={};
        try{rawPermissions=JSON.parse(String(form.get('permissions')||'{}'));}catch{assert(false,'Permissões inválidas.',400);}
        const info=metadata({title:form.get('title')||name,description:form.get('description')||'',category:form.get('category')||'outros'});
        item={...info,...permissionInput(rawPermissions),folderId:folderId||'',ownerUid:account.uid,createdAt:stamp,deletedAt:null,revision:1,currentVersion:0};
      }
      const versionRef=versions(db).doc();
      const nextNumber=(item.currentVersion||0)+1;
      const storagePath='platform-documents/'+docRef.id+'/'+versionRef.id;
      const sha256=createHash('sha256').update(buffer).digest('hex');
      await storage.file(storagePath).save(buffer,{resumable:false,metadata:{
        contentType:file.type||'application/octet-stream',cacheControl:'private,no-store',
        metadata:{sha256,documentId:docRef.id}
      }});
      try {
        await db.runTransaction(async tx=>{
          const current=await tx.get(docRef);
          if(existingId)assert(current.exists&&active(current.data())&&current.data().currentVersion===item.currentVersion,'O documento foi alterado. Atualize e tente novamente.',409);
          else assert(!current.exists,'Documento já existe.',409);
          const next={...item,currentVersion:nextNumber,currentVersionId:versionRef.id,updatedAt:stamp,updatedBy:account.uid,revision:existingId?(item.revision||1)+1:1};
          if(existingId) tx.update(docRef,{currentVersion:next.currentVersion,currentVersionId:next.currentVersionId,updatedAt:stamp,updatedBy:account.uid,revision:next.revision});
          else tx.create(docRef,next);
          tx.create(versionRef,{documentId:docRef.id,number:nextNumber,name,size:buffer.length,mime:file.type||'application/octet-stream',storagePath,sha256,createdAt:stamp,createdBy:account.uid});
          audit(tx,db,account,existingId?'document-version-upload':'document-create',docRef.id);
        });
      } catch(error) {await storage.file(storagePath).delete({ignoreNotFound:true}).catch(()=>{});throw error;}
      return json({documentId:docRef.id,versionId:versionRef.id,number:nextNumber},201);
    }
    const body=await bodyJson(request), action=String(body.action||''),stamp=now();
    if(action==='create-folder') {
      await folderForWrite(db,account,body.parentId||'');
      const name=cleanText(body.name,100);
      assert(name.length>=2,'Nome de pasta demasiado curto.',400);
      const ref=folders(db).doc();
      await ref.create({name,parentId:body.parentId?docId(body.parentId):'',...permissionInput(body.permissions||{}),ownerUid:account.uid,createdAt:stamp,updatedAt:stamp,deletedAt:null});
      return json({id:ref.id},201);
    }
    if(action==='update-folder'||action==='delete-folder') {
      const ref=folders(db).doc(docId(body.folderId));
      const snap=await ref.get();
      assert(snap.exists&&active(snap.data()),'Pasta não encontrada.',404);
      const folder={id:ref.id,...snap.data()};
      assert(canEditLibraryItem(account,folder),'Sem permissão nesta pasta.',403);
      if(action==='delete-folder') {
        const [children,contained]=await Promise.all([
          readBounded(folders(db).where('parentId','==',ref.id)),
          readBounded(documents(db).where('folderId','==',ref.id))
        ]);
        assert(!children.some(active)&&!contained.some(active),'A pasta contém documentos ou subpastas. Esvazie-a primeiro.',409);
        await ref.update({deletedAt:stamp,updatedAt:stamp});
        return json({deleted:true});
      }
      const name=cleanText(body.name||folder.name,100);
      assert(name.length>=2,'Nome de pasta inválido.',400);
      const parentId=body.parentId===undefined?folder.parentId:(body.parentId?docId(body.parentId):'');
      assert(parentId!==ref.id,'Não é possível mover a pasta para si própria.',400);
      const chain=await folderForWrite(db,account,parentId);
      assert(!chain.some(f=>f.id===ref.id),'Uma pasta não pode conter-se a si própria.',400);
      const permissions=body.permissions===undefined?{}:permissionInput(body.permissions);
      assert(body.permissions===undefined||owner(account,folder),'Apenas o titular gere a partilha.',403);
      await ref.update({name,parentId,...permissions,updatedAt:stamp});
      return json({saved:true});
    }
    if(['update-document','delete-document','restore-document'].includes(action)) {
      const ref=documents(db).doc(docId(body.documentId)),snap=await ref.get();
      assert(snap.exists,'Documento não encontrado.',404);
      const item={id:ref.id,...snap.data()};
      const ancestors=await folderAncestors(db,item.folderId||'');
      if(action==='restore-document') {
        assert(item.deletedAt&&owner(account,item),'Sem permissão para restaurar.',403);
        await ref.update({deletedAt:null,updatedAt:stamp,revision:(item.revision||1)+1});
        return json({restored:true});
      }
      assert(canChangeDocument(account,item,ancestors),'Sem permissão para alterar este documento.',403);
      if(action==='delete-document') {
        await ref.update({deletedAt:stamp,deletedBy:account.uid,updatedAt:stamp,revision:(item.revision||1)+1});
        return json({deleted:true,retained:true});
      }
      assert(Number(body.revision)===item.revision,'O documento foi alterado. Reabra os detalhes.',409);
      const info=metadata({...item,...body});
      const nextFolderId=body.folderId===undefined?item.folderId:(body.folderId?docId(body.folderId):'');
      if(nextFolderId!==item.folderId) await folderForWrite(db,account,nextFolderId);
      const permissions=body.permissions===undefined?{}:permissionInput(body.permissions);
      assert(body.permissions===undefined||owner(account,item),'Apenas o titular gere a partilha.',403);
      await ref.update({...info,folderId:nextFolderId,...permissions,updatedAt:stamp,updatedBy:account.uid,revision:(item.revision||1)+1});
      return json({saved:true});
    }
    assert(false,'Operação não suportada.',400);
  } catch(error) {return failure(error);}
}
