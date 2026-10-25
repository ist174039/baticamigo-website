import assert from 'node:assert/strict';
import {initializeApp as initializeAdminApp,deleteApp as deleteAdminApp} from 'firebase-admin/app';
import {getFirestore as getAdminFirestore} from 'firebase-admin/firestore';
import {initializeApp as initializeClientApp,deleteApp as deleteClientApp} from 'firebase/app';
import {addDoc,collection,connectFirestoreEmulator,doc,getDoc,getFirestore,serverTimestamp,setDoc} from 'firebase/firestore';

const host=String(process.env.FIRESTORE_EMULATOR_HOST||'');
assert.match(host,/^(127\.0\.0\.1|localhost):\d+$/,'Public Rules test requires the local Firestore emulator.');
const [hostname,portText]=host.split(':');
const port=Number(portText),projectId='baticamigo-c0384';

const adminApp=initializeAdminApp({projectId},'public-rules-admin');
const adminDb=getAdminFirestore(adminApp);
const clientApp=initializeClientApp({projectId,apiKey:'emulator-only',appId:'1:synthetic:web:synthetic'},'public-rules-client');
const clientDb=getFirestore(clientApp);
connectFirestoreEmulator(clientDb,hostname,port);

async function rejected(promise,label) {
  try { await promise; assert.fail(label); }
  catch(error) { assert.notEqual(error?.name,'AssertionError',label); }
}

try {
  await adminDb.collection('noticias').doc('public-test').set({nome:'Notícia pública sintética'});
  await adminDb.collection('platform_profiles').doc('private-test').set({kind:'student',name:'Privado',active:true});
  await adminDb.collection('contato').doc('existing-test').set({nome:'X',email:'x@example.invalid',assunto:'X',mensagem:'X',data:new Date(),lido:false});

  const publicRead=await getDoc(doc(clientDb,'noticias','public-test'));
  assert.equal(publicRead.exists(),true,'Public editorial content must remain readable.');

  await rejected(getDoc(doc(clientDb,'platform_profiles','private-test')),'Private platform collections must reject direct browser reads.');
  await rejected(getDoc(doc(clientDb,'contato','existing-test')),'Contact messages must never be publicly readable.');

  const valid=await addDoc(collection(clientDb,'contato'),{
    nome:'Pessoa sintética',
    email:'synthetic@example.invalid',
    assunto:'Teste',
    mensagem:'Mensagem sintética sem dados reais.',
    data:serverTimestamp(),
    lido:false,
  });
  assert.ok(valid.id,'A schema-valid contact message with server timestamp must be accepted.');

  await rejected(addDoc(collection(clientDb,'contato'),{
    nome:'Pessoa sintética',email:'synthetic@example.invalid',assunto:'Teste',
    mensagem:'Mensagem',data:serverTimestamp(),lido:false,admin:true,
  }),'Unexpected contact fields must be rejected.');

  await rejected(setDoc(doc(clientDb,'contato',valid.id),{
    nome:'Alterado',email:'synthetic@example.invalid',assunto:'Teste',
    mensagem:'Alteração',data:serverTimestamp(),lido:false,
  }),'Contact messages must not be client-editable after creation.');

  console.log('PASS: production Firestore Rules preserve public reads/contact create and deny private platform access.');
} finally {
  for(const [collectionName,id] of [['noticias','public-test'],['platform_profiles','private-test'],['contato','existing-test']]){
    try{await adminDb.collection(collectionName).doc(id).delete();}catch{}
  }
  const created=await adminDb.collection('contato').where('email','==','synthetic@example.invalid').get();
  await Promise.all(created.docs.map(item=>item.ref.delete()));
  await deleteClientApp(clientApp);
  await deleteAdminApp(adminApp);
}
