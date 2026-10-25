import assert from 'node:assert/strict';
import {initializeApp as initializeAdminApp,deleteApp as deleteAdminApp} from 'firebase-admin/app';
import {getAuth as getAdminAuth} from 'firebase-admin/auth';
import {getFirestore as getAdminFirestore} from 'firebase-admin/firestore';
import {initializeApp as initializeClientApp,deleteApp as deleteClientApp} from 'firebase/app';
import {connectAuthEmulator,getAuth,signInWithEmailAndPassword,signOut} from 'firebase/auth';
import {connectFirestoreEmulator,doc,getDoc,getFirestore,setDoc,updateDoc} from 'firebase/firestore';
import {connectStorageEmulator,deleteObject,getBytes,getStorage,ref,uploadBytes} from 'firebase/storage';

const firestoreHost=String(process.env.FIRESTORE_EMULATOR_HOST||'');
const authHost=String(process.env.FIREBASE_AUTH_EMULATOR_HOST||'');
const storageHost=String(process.env.FIREBASE_STORAGE_EMULATOR_HOST||'');
assert.match(firestoreHost,/^(127\.0\.0\.1|localhost):\d+$/);
assert.match(authHost,/^(127\.0\.0\.1|localhost):\d+$/);
assert.match(storageHost,/^(127\.0\.0\.1|localhost):\d+$/);
const [fsName,fsPort]=firestoreHost.split(':');
const [storageName,storagePort]=storageHost.split(':');
const projectId='baticamigo-c0384';

const adminApp=initializeAdminApp({projectId,storageBucket:'baticamigo-c0384.firebasestorage.app'},'production-rules-admin');
const adminDb=getAdminFirestore(adminApp);
const adminAuth=getAdminAuth(adminApp);

function client(name) {
  const app=initializeClientApp({projectId,apiKey:'emulator-only',appId:`1:synthetic:web:${name}`,storageBucket:'baticamigo-c0384.firebasestorage.app'},name);
  const auth=getAuth(app);connectAuthEmulator(auth,`http://${authHost}`,{disableWarnings:true});
  const db=getFirestore(app);connectFirestoreEmulator(db,fsName,Number(fsPort));
  const storage=getStorage(app);connectStorageEmulator(storage,storageName,Number(storagePort));
  return {app,auth,db,storage};
}
async function rejected(promise,label) {
  try { await promise; assert.fail(label); }
  catch(error) { assert.notEqual(error?.name,'AssertionError',label); }
}
const anon=client('rules-anon'),claimAdmin=client('rules-claim-admin'),accountAdmin=client('rules-account-admin');
const mediaPath='noticias/rules-test/imagem/test.png';
try {
  await adminDb.collection('noticias').doc('public-test').set({titulo:'Notícia pública sintética'});
  await adminDb.collection('noticias').doc('legacy-test').set({titulo:'Legado',legacyMetadata:'preservar'});
  await adminDb.collection('platform_profiles').doc('private-test').set({kind:'student',name:'Privado',active:true});
  await adminDb.collection('contato').doc('contact-test').set({nome:'Pessoa',email:'synthetic@example.invalid',assunto:'Teste',mensagem:'Mensagem',data:new Date(),lido:false});

  assert.equal((await getDoc(doc(anon.db,'noticias','public-test'))).exists(),true);
  await rejected(getDoc(doc(anon.db,'platform_profiles','private-test')),'anonymous private read must fail');
  await rejected(getDoc(doc(anon.db,'contato','contact-test')),'anonymous contact read must fail');
  await rejected(setDoc(doc(anon.db,'contato','public-write'),{nome:'Spam'}),'anonymous contact write must fail');
  await rejected(setDoc(doc(anon.db,'noticias','anon-write'),{titulo:'No'}),'anonymous CMS write must fail');

  const password='Synthetic-rules-password-42';
  await adminAuth.createUser({uid:'claim-admin',email:'claim-admin@example.invalid',password,emailVerified:true});
  await adminAuth.setCustomUserClaims('claim-admin',{admin:true});
  await signInWithEmailAndPassword(claimAdmin.auth,'claim-admin@example.invalid',password);
  await setDoc(doc(claimAdmin.db,'noticias','claim-write'),{titulo:'Admin claim'});
  await rejected(setDoc(doc(claimAdmin.db,'noticias','claim-extra'),{titulo:'Admin claim',privateNotes:'não publicar'}),'admin CMS create with unexpected fields must fail');
  assert.equal((await getDoc(doc(claimAdmin.db,'contato','contact-test'))).exists(),true);

  await adminAuth.createUser({uid:'account-admin',email:'account-admin@example.invalid',password,emailVerified:true});
  await adminDb.collection('platform_accounts').doc('account-admin').set({uid:'account-admin',roles:['admin'],role:'admin',active:true,suspended:false,profileIds:[]});
  await signInWithEmailAndPassword(accountAdmin.auth,'account-admin@example.invalid',password);
  await setDoc(doc(accountAdmin.db,'noticias','account-write'),{titulo:'Admin account'});
  await updateDoc(doc(accountAdmin.db,'noticias','legacy-test'),{titulo:'Legado editado'});
  assert.equal((await getDoc(doc(accountAdmin.db,'noticias','legacy-test'))).data().legacyMetadata,'preservar','unchanged legacy metadata may remain during migration');
  await rejected(updateDoc(doc(accountAdmin.db,'noticias','legacy-test'),{legacyMetadata:'alterado'}),'admin CMS must not mutate unknown legacy fields');
  await updateDoc(doc(accountAdmin.db,'contato','contact-test'),{lido:true});

  const png=Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  await rejected(uploadBytes(ref(anon.storage,mediaPath),png,{contentType:'image/png'}),'anonymous CMS media write must fail');
  await uploadBytes(ref(accountAdmin.storage,mediaPath),png,{contentType:'image/png'});
  const svg=new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  await rejected(uploadBytes(ref(accountAdmin.storage,'noticias/rules-test/imagem/test.svg'),svg,{contentType:'image/svg+xml'}),'CMS SVG upload must fail allowlist');
  const bytes=await getBytes(ref(anon.storage,mediaPath));
  assert.equal(bytes.byteLength,png.byteLength,'public CMS media must remain readable');
  await rejected(uploadBytes(ref(accountAdmin.storage,'platform-files/private/test.png'),png,{contentType:'image/png'}),'private platform media must reject direct SDK writes');

  console.log('PASS: production Firebase rules preserve public reads, constrain CMS fields, preserve legacy metadata, and isolate private platform data.');
} finally {
  try{await deleteObject(ref(accountAdmin.storage,mediaPath));}catch{}
  for(const [collectionName,id] of [
    ['noticias','public-test'],['noticias','legacy-test'],['noticias','claim-write'],['noticias','claim-extra'],['noticias','account-write'],
    ['noticias','anon-write'],['platform_profiles','private-test'],['platform_accounts','account-admin'],
    ['contato','contact-test'],['contato','public-write']
  ]) { try{await adminDb.collection(collectionName).doc(id).delete();}catch{} }
  for(const value of [claimAdmin,accountAdmin]) try{await signOut(value.auth);}catch{}
  for(const uid of ['claim-admin','account-admin']) try{await adminAuth.deleteUser(uid);}catch{}
  for(const value of [anon,claimAdmin,accountAdmin]) await deleteClientApp(value.app);
  await deleteAdminApp(adminApp);
}
