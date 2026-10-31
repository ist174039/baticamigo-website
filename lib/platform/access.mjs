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

// Stable access-profile IDs. Person records remain separate from these access profiles.
export const accessProfileIds = ['student','guardian','tutor','volunteer','member','coordinator','admin'];

export function bootstrapAdminEmails(env = process.env.FIREBASE_ADMIN_EMAILS) {
  return new Set(String(env || '').split(',')
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

export function resolvePlatformAccount(user, storedAccount, env=process.env.FIREBASE_ADMIN_EMAILS) {
  const uid=String(user?.uid||'');
  // A persisted account is the authoritative revocation point. This must be
  // evaluated before bootstrap email or legacy custom claims so an inactive,
  // suspended or downgraded account cannot bypass the stored decision.
  if(storedAccount!==null&&storedAccount!==undefined) return {...storedAccount,uid};
  if(isBootstrapAdmin(user?.email,user?.email_verified,env)) {
    return {uid,role:'admin',roles:['admin'],active:true,profileId:'',superAdmin:true};
  }
  // Preserve administrator access issued by Firebase only for legacy accounts
  // that genuinely predate platform_accounts.
  if(user?.admin===true) return {uid,role:'admin',roles:['admin'],active:true,profileId:''};
  return null;
}

export function adminAuthorization(user, platformAccount, env=process.env.FIREBASE_ADMIN_EMAILS) {
  const email=String(user?.email||'').trim().toLowerCase();
  const resolvedAccount=resolvePlatformAccount(user,platformAccount,env);
  const platformAdmin=isActivePlatformAdmin(resolvedAccount);
  const hasStoredAccount=platformAccount!==null&&platformAccount!==undefined;
  const bootstrapCandidate=!hasStoredAccount&&bootstrapAdminEmails(env).has(email);
  const verificationRequired=user?.email_verified!==true&&(platformAdmin||bootstrapCandidate);
  return {
    authorized:!verificationRequired&&platformAdmin,
    verificationRequired,
  };
}

function defaultAreasForSingleRole(role) {
  if(role==='admin') return [...areaModules];
  // The calendar is a shared, read-only platform capability for every profile.
  // Mutations still require management or attendance authorization in the API.
  const selected=new Set(['overview','sessions','profiles','document','message','notifications']);
  if(['coordinator','tutor','volunteer','student','guardian'].includes(role)) {
    ['assignment','material','assessment','progress'].forEach(module=>selected.add(module));
  }
  if(['coordinator','guardian','student','tutor','volunteer'].includes(role)) selected.add('justification');
  if(role==='member') selected.add('finance');
  if(['admin','coordinator'].includes(role)) selected.add('reports');
  return areaModules.filter(module=>selected.has(module));
}

export const defaultAccessProfiles = Object.fromEntries(accessProfileIds.map(role=>[role,defaultAreasForSingleRole(role)]));

export function sharedCalendarMetadata(session) {
  const {id,title,room,startsAt,endsAt,status,recurrence}=session;
  return {id,title,room,startsAt,endsAt,status,recurrence,studentIds:[]};
}

export function sessionsWithAuthorizedAttendees(sessions=[]) {
  return sessions.filter(session=>Array.isArray(session?.studentIds)&&session.studentIds.length>0);
}

export function validateAccessProfiles(value) {
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(role=>!accessProfileIds.includes(role))) return null;
  const result={};
  for(const role of accessProfileIds) {
    const modules=value[role] ?? defaultAccessProfiles[role];
    if(!Array.isArray(modules)||modules.length>areaModules.length||new Set(modules).size!==modules.length||!modules.includes('overview')||!modules.every(module=>areaModules.includes(module))) return null;
    if(role==='admin'&&areaModules.some(module=>!modules.includes(module))) return null;
    result[role]=areaModules.filter(module=>module==='sessions'||modules.includes(module));
  }
  return result;
}

export function allowedAreasForRoles(roles=[], accessProfiles=defaultAccessProfiles) {
  if(roles.includes('admin')) return [...areaModules];
  const configured=validateAccessProfiles(accessProfiles) || defaultAccessProfiles;
  const selected=new Set(['overview','sessions']);
  roles.forEach(role=>(configured[role]||[]).forEach(module=>selected.add(module)));
  return areaModules.filter(module=>selected.has(module));
}

export function validateAreaModules(value,roles,accessProfiles=defaultAccessProfiles) {
  if(value===undefined) return undefined;
  if(!Array.isArray(value)||!value.includes('overview')||value.length>areaModules.length||new Set(value).size!==value.length||!value.every(module=>areaModules.includes(module))||roles&&!roles.includes('admin')&&!value.every(module=>allowedAreasForRoles(roles,accessProfiles).includes(module))) return null;
  return value;
}

export function canAccessArea(account,module) {
  if(!areaModules.includes(module)) return false;
  if(account.superAdmin===true) return true;
  if((account.roles||[account.role]).includes('admin')&&!Array.isArray(account.modules)) return true;
  return !Array.isArray(account.modules)||account.modules.includes(module);
}

export function restrictAreasForRoles(currentModules,roles=[],accessProfiles=defaultAccessProfiles) {
  const allowed=new Set(allowedAreasForRoles(roles,accessProfiles));
  return [...new Set(['overview',...(Array.isArray(currentModules)?currentModules:[]).filter(module=>allowed.has(module))])];
}

export function defaultAreasForRoles(roles=[],accessProfiles=defaultAccessProfiles) {
  return allowedAreasForRoles(roles,accessProfiles);
}

export function effectiveAccountAreas(roles=[],legacyModules,accessProfiles=defaultAccessProfiles,centralProfilesConfigured=false) {
  const inherited=defaultAreasForRoles(roles,accessProfiles);
  if(centralProfilesConfigured||legacyModules===undefined) return {modules:inherited,invalidLegacy:false};
  const legacy=validateAreaModules(legacyModules);
  if(legacy===null) return {modules:[],invalidLegacy:true};
  return {modules:legacy?inherited.filter(module=>module==='sessions'||legacy.includes(module)):inherited,invalidLegacy:false};
}
