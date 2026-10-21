export const areaModules = [
  'overview','sessions','profiles','assignment','material','assessment','progress','justification',
  'finance','document','message','notifications','reports',
];
export const areaGroups = [
  {label:'Início',modules:['overview']},
  {label:'Acompanhamento',modules:['sessions','assignment','material','assessment','progress','justification']},
  {label:'Associação',modules:['profiles','finance']},
  {label:'Comunicação',modules:['document','message','notifications']},
  {label:'Análise',modules:['reports']},
];

const bootstrapOwners = ['carlos.gomes@baticamigo.com'];

export function bootstrapAdminEmails(env = process.env.FIREBASE_ADMIN_EMAILS) {
  return new Set([...bootstrapOwners,...String(env || 'carlos.gomes@baticamigo.pt').split(',')]
    .map(email=>email.trim().toLowerCase()).filter(Boolean));
}

export function isBootstrapAdmin(email,verified,env) {
  return verified===true && bootstrapAdminEmails(env).has(String(email||'').trim().toLowerCase());
}

export function isActivePlatformAdmin(account) {
  const roles=Array.isArray(account?.roles)?account.roles:[account?.role];
  return account?.active===true&&account?.suspended!==true&&roles.includes('admin');
}

export function availablePlatformDestinations(account) {
  if(!account || account.active!==true || account.suspended===true) return [];
  return isActivePlatformAdmin(account) ? ['admin','area'] : ['area'];
}

export function resolvePlatformAccount(user, storedAccount) {
  const uid=String(user?.uid||'');
  if(isBootstrapAdmin(user?.email,user?.email_verified)) {
    return {uid,role:'admin',roles:['admin'],active:true,profileId:'',superAdmin:true};
  }
  if(storedAccount!==null&&storedAccount!==undefined) return {...storedAccount,uid};
  if(user?.admin===true) return {uid,role:'admin',roles:['admin'],active:true,profileId:''};
  return null;
}

export function adminAuthorization(user, platformAccount) {
  const email=String(user?.email||'').trim().toLowerCase();
  const resolvedAccount=resolvePlatformAccount(user,platformAccount);
  const platformAdmin=isActivePlatformAdmin(resolvedAccount);
  const verificationRequired=bootstrapAdminEmails().has(email)&&user?.email_verified!==true&&!platformAdmin;
  return {
    authorized:!verificationRequired&&platformAdmin,
    verificationRequired,
  };
}

export function allowedAreasForRoles(roles=[]) {
  if(roles.includes('admin')) return [...areaModules];
  const selected=new Set(['overview','profiles','document','message','notifications']);
  if(roles.some(role=>['coordinator','tutor','volunteer','student','guardian'].includes(role))) {
    ['sessions','assignment','material','assessment','progress'].forEach(module=>selected.add(module));
  }
  if(roles.some(role=>['coordinator','guardian','student'].includes(role))) selected.add('justification');
  if(roles.includes('member')) selected.add('finance');
  if(roles.some(role=>['admin','coordinator'].includes(role))) selected.add('reports');
  return areaModules.filter(module=>selected.has(module));
}

export function validateAreaModules(value,roles) {
  if(value===undefined) return undefined;
  if(!Array.isArray(value)||!value.includes('overview')||value.length>areaModules.length||new Set(value).size!==value.length||!value.every(module=>areaModules.includes(module))||roles&&!roles.includes('admin')&&!value.every(module=>allowedAreasForRoles(roles).includes(module))) return null;
  return value;
}

export function canAccessArea(account,module) {
  if(!areaModules.includes(module)) return false;
  if(account.superAdmin===true) return true;
  if((account.roles||[account.role]).includes('admin')&&!Array.isArray(account.modules)) return true;
  return !Array.isArray(account.modules)||account.modules.includes(module);
}

export function restrictAreasForRoles(currentModules,roles=[]) {
  const allowed=new Set(allowedAreasForRoles(roles));
  return [...new Set(['overview',...(Array.isArray(currentModules)?currentModules:[]).filter(module=>allowed.has(module))])];
}

export function defaultAreasForRoles(roles=[]) {
  return allowedAreasForRoles(roles);
}
