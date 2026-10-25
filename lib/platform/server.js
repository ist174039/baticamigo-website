import {cert,getApps,initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
import {PlatformError,assert,roles,profileIds,id} from './domain.mjs';
import {defaultAccessProfiles,effectiveAccountAreas,isBootstrapAdmin,resolvePlatformAccount,validateAccessProfiles} from './access.mjs';
export async function context(request) {
  const token=request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];
  assert(token,'Inicie sessão para continuar.',401);
  let credential; try { credential=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || 'null'); } catch { /* fail closed */ }
  assert(credential?.project_id === 'baticamigo-c0384','Serviço ainda não configurado.',503);
  const app=getApps().find(a=>a.name==='baticamigo-platform') || initializeApp({credential:cert(credential),projectId:credential.project_id,storageBucket:'baticamigo-c0384.firebasestorage.app'},'baticamigo-platform');
  let decoded; try { decoded=await getAuth(app).verifyIdToken(token,true); } catch { throw new PlatformError(401,'Sessão inválida ou expirada.'); }
  const db=getFirestore(app); const [stored, accessSettingsSnapshot]=await Promise.all([
    db.collection('platform_accounts').doc(decoded.uid).get(),
    db.collection('platform_access_settings').doc('profiles').get(),
  ]);
  const accessProfiles=accessSettingsSnapshot.exists?validateAccessProfiles(accessSettingsSnapshot.data().profiles):defaultAccessProfiles;
  assert(accessProfiles,'Configuração de perfis inválida.',503);
  const bootstrap=isBootstrapAdmin(decoded.email,decoded.email_verified);
  let account=resolvePlatformAccount(decoded,stored.exists?stored.data():null);
  assert(account && account.active === true && account.suspended !== true,'Conta sem acesso à plataforma.',403);
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
  return {db,account,auth:getAuth(app),storage:getStorage(app).bucket()};
}
export const collection=(db,name)=>db.collection(`platform_${name}`);
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
  tx.set(collection(db,'audit').doc(),{actorUid:account.uid,action:String(action).slice(0,80),target:String(target).slice(0,240),...auditDetails(details),createdAt:FieldValue.serverTimestamp()});
}
export function json(data,status=200) { return Response.json(data,{status,headers:{'Cache-Control':'no-store'}}); }
export function problem(detail,status=500,title='Erro da plataforma') {
  return Response.json(
    {type:'about:blank',title,status,detail,error:detail},
    {status,headers:{'Cache-Control':'no-store','Content-Type':'application/problem+json'}}
  );
}
export function failure(error) {
  if(error instanceof PlatformError) return problem(error.message,error.status,error.status>=500?'Erro interno':'Pedido não concluído');
  console.error('Platform operation failed',error?.code || 'unknown');
  return problem('Não foi possível concluir a operação.',500,'Erro interno');
}
