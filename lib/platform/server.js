import {cert,getApps,initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
import {PlatformError,assert,roles,profileIds,id} from './domain.mjs';
import {defaultAccessProfiles,effectiveAccountAreas,isBootstrapAdmin,resolvePlatformAccount,validateAccessProfiles} from './access.mjs';
import {classifyAuditAction} from './audit-classification.mjs';
import {operationalEvent} from './operational-events.mjs';
export function adminServices() {
  let credential; try { credential=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || 'null'); } catch { /* fail closed */ }
  assert(credential?.project_id === 'baticamigo-c0384','Serviço ainda não configurado.',503);
  const app=getApps().find(a=>a.name==='baticamigo-platform') || initializeApp({credential:cert(credential),projectId:credential.project_id,storageBucket:'baticamigo-c0384.firebasestorage.app'},'baticamigo-platform');
  return {app,db:getFirestore(app),auth:getAuth(app),storage:getStorage(app).bucket()};
}
export async function context(request) {
  const token=request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];
  if(!token){ operationalEvent('auth-failure',{severity:'medium',code:'missing-bearer'}); throw new PlatformError(401,'Inicie sessão para continuar.'); }
  const {db,auth,storage}=adminServices();
  let decoded; try { decoded=await auth.verifyIdToken(token,true); } catch { operationalEvent('auth-failure',{severity:'medium',code:'invalid-or-revoked-token'}); throw new PlatformError(401,'Sessão inválida ou expirada.'); }
  if(decoded.email_verified!==true){ operationalEvent('access-denied',{severity:'low',code:'email-not-verified'}); throw new PlatformError(403,'Confirme o endereço de email antes de aceder à plataforma.'); }
  const [stored, accessSettingsSnapshot]=await Promise.all([
    db.collection('platform_accounts').doc(decoded.uid).get(),
    db.collection('platform_access_settings').doc('profiles').get(),
  ]);
  const accessProfiles=accessSettingsSnapshot.exists?validateAccessProfiles(accessSettingsSnapshot.data().profiles):defaultAccessProfiles;
  assert(accessProfiles,'Configuração de perfis inválida.',503);
  const bootstrap=isBootstrapAdmin(decoded.email,decoded.email_verified);
  let account=resolvePlatformAccount(decoded,stored.exists?stored.data():null);
  if(!(account && account.active === true && account.suspended !== true)){ operationalEvent('access-denied',{severity:'medium',code:'account-inactive-or-suspended'}); throw new PlatformError(403,'Conta sem acesso à plataforma.'); }
  const selected=account.roles || [account.role]; assert(Array.isArray(selected) && selected.length > 0 && selected.every(r=>roles.includes(r)),'Permissões inválidas.',403);
  // Before the association has a central configuration, preserve valid legacy account limits.
  // Saving the central configuration makes its profiles the single source of menu access.
  const access=effectiveAccountAreas(selected,account.modules,accessProfiles,accessSettingsSnapshot.exists);
  assert(!access.invalidLegacy,'Configuração de menus inválida.',403);
  const modules=access.modules;
  const linked=profileIds(account); assert(Array.isArray(linked) && linked.length <= 30,'Perfis inválidos.',403); linked.forEach(id);
  const active=[];
  for(const profileId of linked) { const p=await db.collection('platform_profiles').doc(profileId).get(); if(p.exists && p.data().active===true && (selected.includes(p.data().kind) || (p.data().kind==='tutor' && selected.includes('volunteer')))) active.push(profileId); }
  // The account has already passed the active-account assertion above. Preserve
  // that validated state in the response consumed by the destination picker.
  account={uid:decoded.uid,roles:selected,role:selected[0],active:true,profileIds:active,profileId:active[0] || '',...(bootstrap?{superAdmin:true}:{}),...(modules?{modules}:{})};
  return {db,account,auth,storage};
}
export const collection=(db,name)=>db.collection(`platform_${name}`);
export function assertTrustedOrigin(request) {
  const origin=request.headers.get('origin');
  if(!origin) return;
  let expected; try { expected=new URL(request.url).origin; } catch { throw new PlatformError(400,'Origem inválida.'); }
  // Next.js dev may canonicalize the loopback hostname differently from the
  // address used by the browser. This exception is opt-in, emulator-only and
  // requires the exact protocol and port; production remains strict same-origin.
  let localAlias=false;
  if(origin!==expected && process.env.NODE_ENV==='development' && process.env.BATIC_LOCAL_BROWSER_E2E==='1') {
    try {
      const a=new URL(origin),b=new URL(expected);
      localAlias=['127.0.0.1','localhost'].includes(a.hostname)&&['127.0.0.1','localhost'].includes(b.hostname) &&
        a.protocol===b.protocol && a.port===b.port && !a.username && !a.password;
    } catch { localAlias=false; }
  }
  assert(origin===expected||localAlias,'Origem do pedido não autorizada.',403);
}
export function assertJsonRequest(request) {
  const type=String(request.headers.get('content-type')||'').toLowerCase();
  assert(type.startsWith('application/json'),'Tipo de conteúdo inválido.',415);
  assertTrustedOrigin(request);
}
const auditDetailKeys=new Set(['occurrences','period','weekdays','studentId','count','kinds','profileKind','profileIds','changedFields','deletedFields']);
export function auditDetails(details={}) {
  if(!details||typeof details!=='object'||Array.isArray(details)) return {};
  const result={};
  for(const [key,value] of Object.entries(details)) {
    if(!auditDetailKeys.has(key)) continue;
    if(typeof value==='string') result[key]=value.slice(0,160);
    else if(Number.isFinite(value)||typeof value==='boolean') result[key]=value;
    else if(Array.isArray(value)) result[key]=value.slice(0,30).filter(item=>['string','number','boolean'].includes(typeof item)).map(item=>typeof item==='string'?item.slice(0,80):item);
  }
  return result;
}
export function audit(tx,db,account,action,target,details={}) {
  const normalizedAction=String(action).slice(0,80);
  const classification=classifyAuditAction(normalizedAction);
  tx.set(collection(db,'audit').doc(),{actorUid:account.uid,action:normalizedAction,target:String(target).slice(0,240),...classification,...auditDetails(details),createdAt:FieldValue.serverTimestamp()});
}
export function json(data,status=200) { return Response.json(data,{status,headers:{'Cache-Control':'no-store'}}); }
export function problem(detail,status=500,title='Erro da plataforma') {
  return Response.json(
    {type:'about:blank',title,status,detail,error:detail},
    {status,headers:{'Cache-Control':'no-store','Content-Type':'application/problem+json'}}
  );
}
export function failure(error) {
  if(error instanceof PlatformError) {
    if(error.status>=500) operationalEvent('platform-api-error',{severity:'high',code:`platform-${error.status}`});
    return problem(error.message,error.status,error.status>=500?'Erro interno':'Pedido não concluído');
  }
  operationalEvent('platform-api-error',{severity:'high',code:error?.code || 'unhandled'});
  return problem('Não foi possível concluir a operação.',500,'Erro interno');
}
