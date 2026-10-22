export class PlatformError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const roles = ['student', 'guardian', 'tutor', 'volunteer', 'member', 'coordinator', 'admin'];
export const hasRole = (a, role) => (a.roles || [a.role]).includes(role);
export const manages = (a) => hasRole(a,'admin') || hasRole(a,'coordinator');
export const profileIds = (a) => a.profileIds || (a.profileId ? [a.profileId] : []);
export const requiredProfileKinds = (selectedRoles = []) => selectedRoles.filter((role) => ['student','guardian','tutor','member'].includes(role));
export const profileKindMatchesRoles = (kind, selectedRoles = []) => selectedRoles.includes(kind) || (kind === 'tutor' && selectedRoles.includes('volunteer'));
export function assert(condition, message = 'Dados inválidos.', status = 400) { if (!condition) throw new PlatformError(status, message); }
export function id(value) { assert(typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value), 'Identificador inválido.'); return value; }
function shape(value, keys) { assert(value && typeof value === 'object' && !Array.isArray(value)); assert(Object.keys(value).every((key) => keys.includes(key)), 'Campo não permitido.'); }
function text(value, max = 120) { assert(typeof value === 'string' && value.trim().length > 0 && value.length <= max); return value.trim(); }
function ids(value) { assert(Array.isArray(value) && value.length <= 30); const result = value.map(id); assert(new Set(result).size === result.length); return result; }
export function profileInput(value) {
  shape(value, ['id','kind','name','email','guardianIds','active','subjects','availability','schoolYear','ageBand','memberNumber','membershipStatus']);
  assert(['student','guardian','tutor','member','coordinator'].includes(value.kind));
  const result = {kind:value.kind, name:text(value.name), email:value.email ? text(value.email,254) : '', guardianIds:ids(value.guardianIds || []), active:value.active ?? true};
  assert(typeof result.active === 'boolean'); assert(!result.email || /^\S+@\S+\.\S+$/.test(result.email)); assert(result.kind === 'student' || result.guardianIds.length === 0);
  for(const key of ['subjects','availability','schoolYear','ageBand','memberNumber']) result[key]=value[key] ? text(value[key],key==='availability' ? 1000 : 200) : '';
  result.membershipStatus=value.membershipStatus || 'active'; assert(['active','pending','suspended','left'].includes(result.membershipStatus),'Estado associativo inválido.');
  if(value.id) result.id=id(value.id); return result;
}
export function profileDependencyReasons({account=false,dependents=false,sessions=false,records=false,attendance=false,dues=false}={}) {
  return [
    account && "Conta de acesso associada",
    dependents && "Relações com outros perfis",
    sessions && "Sessões associadas",
    records && "Registos da plataforma associados",
    attendance && "Presenças associadas",
    dues && "Quotas ou pagamentos associados",
  ].filter(Boolean);
}
export function sessionInput(value) {
  shape(value,['title','studentIds','tutorId','startsAt','endsAt','room']);
  const result = {title:text(value.title),studentIds:ids(value.studentIds),tutorId:id(value.tutorId),room:value.room ? text(value.room,80) : '',startsAt:value.startsAt,endsAt:value.endsAt,status:'scheduled',version:1};
  assert(result.studentIds.length > 0);
  for(const field of ['startsAt','endsAt']) {
    const timestamp=result[field];
    assert(typeof timestamp === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp) && Number.isFinite(Date.parse(timestamp)));
    const date=timestamp.slice(0,10), [year,month,day]=date.split('-').map(Number);
    assert(new Date(Date.UTC(year,month-1,day)).toISOString().slice(0,10)===date,'Data inválida.');
  }
  result.startsAt=new Date(result.startsAt).toISOString(); result.endsAt=new Date(result.endsAt).toISOString();
  assert(result.endsAt > result.startsAt && Date.parse(result.endsAt)-Date.parse(result.startsAt) <= 8*3600000, 'Duração da sessão inválida.'); return result;
}
export function accountInput(value) {
  shape(value,['uid','role','roles','profileId','profileIds','active']); const selected=value.roles || [value.role]; assert(Array.isArray(selected) && selected.length > 0 && selected.length <= roles.length && selected.every(r=>roles.includes(r)) && new Set(selected).size === selected.length); assert(typeof value.active === 'boolean');
  const linked=ids(value.profileIds || (value.profileId ? [value.profileId] : []));
  return {uid:id(value.uid),roles:selected,role:selected[0],profileIds:linked,profileId:linked[0] || '',active:value.active};
}
export function canReadStudent(account, student) { return manages(account) || (hasRole(account,'student') && profileIds(account).includes(student.id)) || (hasRole(account,'guardian') && profileIds(account).some(p=>student.guardianIds?.includes(p))); }
export function canAttend(account, session) { return manages(account) || ((hasRole(account,'tutor') || hasRole(account,'volunteer')) && profileIds(account).includes(session.tutorId)); }
export function attendanceVersion(previous, expected) { assert(Number.isInteger(expected) && expected >= 0,'Versão da presença obrigatória.'); assert((previous?.version || 0) === expected,'A presença foi alterada. Atualize os dados.',409); return expected+1; }
export function overlaps(a,b) { return a.status !== 'cancelled' && b.status !== 'cancelled' && a.startsAt < b.endsAt && b.startsAt < a.endsAt && (a.tutorId === b.tutorId || (a.room && a.room === b.room) || a.studentIds.some((student) => b.studentIds.includes(student))); }
