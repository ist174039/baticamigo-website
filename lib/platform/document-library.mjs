// Shared document library rules. Permissions are always enforced on the server.
export const DOCUMENT_ROLES = ['admin','coordinator','student','guardian','tutor','volunteer','member'];
export const DOCUMENT_CATEGORIES = ['institucional','educacao','financeiro','investimentos','juridico','outros'];
export const DOCUMENT_MAX_BYTES = 4_000_000;
export function cleanText(value,max=160) {
  return String(value ?? '').trim().replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,max);
}
export function cleanName(value) {
  return cleanText(value,180).replace(/[\\/:*?"<>|]/g,' ').trim();
}
export function grants(value={}) {
  const normalize=(key,max,allowed)=> {
    const items=value[key] ?? [];
    if (!Array.isArray(items) || items.length>max || items.some(x=>typeof x!=='string'||!x||x.length>128)) throw new Error('Permissões inválidas.');
    const unique=[...new Set(items)];
    if (allowed && !unique.every(x=>allowed.includes(x))) throw new Error('Perfil de acesso inválido.');
    return unique;
  };
  return {
    viewRoles:normalize('viewRoles',7,DOCUMENT_ROLES),
    editRoles:normalize('editRoles',7,DOCUMENT_ROLES),
    viewUids:normalize('viewUids',40),
    editUids:normalize('editUids',40),
  };
}
export function roleList(account) {
  return Array.isArray(account?.roles)?account.roles:[account?.role].filter(Boolean);
}
export function isLibraryAdmin(account) { return roleList(account).includes('admin'); }
export function canEditLibraryItem(account,item) {
  if (!item || item.deletedAt) return false;
  const roles=roleList(account);
  return isLibraryAdmin(account) || item.ownerUid===account?.uid ||
    (item.editUids||[]).includes(account?.uid) || roles.some(role=>(item.editRoles||[]).includes(role));
}
export function canViewLibraryItem(account,item) {
  if (!item || item.deletedAt) return false;
  if (canEditLibraryItem(account,item)) return true;
  return (item.viewUids||[]).includes(account?.uid) ||
    roleList(account).some(role=>(item.viewRoles||[]).includes(role));
}
export function canSeeDocument(account,doc,folders=[]) {
  if (!doc || doc.deletedAt) return false;
  // The folder grants are inherited as additional grants, but never expose an
  // item when a parent is deleted. A direct document grant can be more specific.
  if (folders.some(folder=>folder.deletedAt)) return false;
  return canViewLibraryItem(account,doc) || folders.some(folder=>canViewLibraryItem(account,folder));
}
export function canChangeDocument(account,doc,folders=[]) {
  if (!doc || doc.deletedAt || folders.some(folder=>folder.deletedAt)) return false;
  return canEditLibraryItem(account,doc) || folders.some(folder=>canEditLibraryItem(account,folder));
}
export function safeDocumentFor(account,doc) {
  const allowedToManage=canEditLibraryItem(account,doc) || isLibraryAdmin(account);
  const {storagePath, ...publicFields}=doc;
  if (!allowedToManage) {
    delete publicFields.viewUids; delete publicFields.editUids;
    delete publicFields.viewRoles; delete publicFields.editRoles;
    delete publicFields.ownerUid; delete publicFields.updatedBy;
  }
  return publicFields;
}
export function descendantsOf(folderId,folders) {
  const seen=new Set([folderId]);
  let cursor=folders.find(folder=>folder.id===folderId)?.parentId;
  while(cursor) {
    if(seen.has(cursor)) return null;
    seen.add(cursor);
    cursor=folders.find(folder=>folder.id===cursor)?.parentId;
    if(seen.size>30) return null;
  }
  return seen;
}
export function isSafeVersionId(value) { return /^[a-zA-Z0-9_-]{1,128}$/.test(String(value||'')); }
