import {cert,getApps,initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
import {PlatformError,assert,roles,profileIds,id} from './domain.mjs';
import {defaultAreasForRoles,isBootstrapAdmin,resolvePlatformAccount,validateAreaModules} from './access.mjs';
export async function context(request) {
  const token=request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];
  assert(token,'Inicie sessão para continuar.',401);
  let credential; try { credential=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || 'null'); } catch { /* fail closed */ }
  assert(credential?.project_id === 'baticamigo-c0384','Serviço ainda não configurado.',503);
  const app=getApps().find(a=>a.name==='baticamigo-platform') || initializeApp({credential:cert(credential),projectId:credential.project_id,storageBucket:'baticamigo-c0384.firebasestorage.app'},'baticamigo-platform');
  let decoded; try { decoded=await getAuth(app).verifyIdToken(token,true); } catch { throw new PlatformError(401,'Sessão inválida ou expirada.'); }
  const db=getFirestore(app); const stored=await db.collection('platform_accounts').doc(decoded.uid).get();
  const bootstrap=isBootstrapAdmin(decoded.email,decoded.email_verified);
  let account=resolvePlatformAccount(decoded,stored.exists?stored.data():null);
  assert(account && account.active === true && account.suspended !== true,'Conta sem acesso à plataforma.',403);
  const selected=account.roles || [account.role]; assert(Array.isArray(selected) && selected.length > 0 && selected.every(r=>roles.includes(r)),'Permissões inválidas.',403);
  const storedModules=validateAreaModules(account.modules,selected);assert(storedModules!==null,'Configuração de menus inválida.',403);const modules=storedModules??defaultAreasForRoles(selected);
  const linked=profileIds(account); assert(Array.isArray(linked) && linked.length <= 30,'Perfis inválidos.',403); linked.forEach(id);
  const active=[];
  for(const profileId of linked) { const p=await db.collection('platform_profiles').doc(profileId).get(); if(p.exists && p.data().active===true && (selected.includes(p.data().kind) || (p.data().kind==='tutor' && selected.includes('volunteer')))) active.push(profileId); }
  // The account has already passed the active-account assertion above. Preserve
  // that validated state in the response consumed by the destination picker.
  account={uid:decoded.uid,roles:selected,role:selected[0],active:true,profileIds:active,profileId:active[0] || '',...(bootstrap?{superAdmin:true}:{}),...(modules?{modules}:{})};
  return {db,account,auth:getAuth(app),storage:getStorage(app).bucket()};
}
export const collection=(db,name)=>db.collection(`platform_${name}`);
export function audit(tx,db,account,action,target,details={}) { tx.set(collection(db,'audit').doc(),{actorUid:account.uid,action,target,...details,createdAt:FieldValue.serverTimestamp()}); }
export function json(data,status=200) { return Response.json(data,{status,headers:{'Cache-Control':'no-store'}}); }
export function failure(error) { if(error instanceof PlatformError) return json({error:error.message},error.status); console.error('Platform operation failed',error?.code || 'unknown'); return json({error:'Não foi possível concluir a operação.'},500); }
