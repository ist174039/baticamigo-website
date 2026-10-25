import assert from 'node:assert/strict';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';

assert.match(process.env.FIRESTORE_EMULATOR_HOST||'',/^(127\.0\.0\.1|localhost):\d+$/,'Public Rules test requires the local Firestore emulator.');
const projectId='baticamigo-c0384';
const app=initializeApp({projectId},'public-rules-fixtures');
const db=getFirestore(app);
const base='http://'+process.env.FIRESTORE_EMULATOR_HOST+'/v1/projects/'+projectId+'/databases/(default)/documents';
async function rest(path,options={}) {
  const response=await fetch(base+path,options);
  let body={}; try{body=await response.json();}catch{}
  return {status:response.status,body};
}
try {
  await db.collection('noticias').doc('public-test').set({nome:'Notícia pública sintética'});
  await db.collection('platform_profiles').doc('private-test').set({kind:'student',name:'Privado',active:true});
  await db.collection('contato').doc('existing-test').set({nome:'X',email:'x@example.invalid',assunto:'X',mensagem:'X',data:FieldValue.serverTimestamp(),lido:false});

  const publicRead=await rest('/noticias/public-test');
  assert.equal(publicRead.status,200,'Public editorial content must remain readable.');

  const privateRead=await rest('/platform_profiles/private-test');
  assert.equal(privateRead.status,403,'Private platform collections must reject direct browser reads.');

  const contactRead=await rest('/contato/existing-test');
  assert.equal(contactRead.status,403,'Contact messages must never be publicly readable.');

  const validContact=await rest('/contato?documentId=created-test',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({fields:{
      nome:{stringValue:'Pessoa sintética'},
      email:{stringValue:'synthetic@example.invalid'},
      assunto:{stringValue:'Teste'},
      mensagem:{stringValue:'Mensagem sintética sem dados reais.'},
      data:{timestampValue:new Date().toISOString()},
      lido:{booleanValue:false},
    }})
  });
  // REST timestamp from the client is not a server transform and must fail the
  // request.time equality rule; the website uses FieldValue.serverTimestamp().
  assert.equal(validContact.status,403,'Client-supplied timestamps must not satisfy the contact rule.');

  const invalidExtra=await rest('/contato?documentId=invalid-test',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({fields:{
      nome:{stringValue:'Pessoa sintética'},email:{stringValue:'synthetic@example.invalid'},
      assunto:{stringValue:'Teste'},mensagem:{stringValue:'Mensagem'},lido:{booleanValue:false},
      data:{timestampValue:new Date().toISOString()},admin:{booleanValue:true}
    }})
  });
  assert.equal(invalidExtra.status,403,'Unexpected fields must be rejected.');

  console.log('PASS: production Firestore Rules keep public content available and private platform/contact data protected.');
} finally {
  for(const [collection,id] of [['noticias','public-test'],['platform_profiles','private-test'],['contato','existing-test']]){
    try{await db.collection(collection).doc(id).delete();}catch{}
  }
  await app.delete();
}
