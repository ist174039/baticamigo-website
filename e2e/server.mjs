// Local Playwright server and synthetic fixtures. Never contacts live Firebase.
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {spawn} from 'node:child_process';
import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {defaultAccessProfiles} from '../lib/platform/access.mjs';

assert.match(process.env.FIREBASE_AUTH_EMULATOR_HOST||'',/^(127\.0\.0\.1|localhost):9099$/,'Auth emulator required');
assert.match(process.env.FIRESTORE_EMULATOR_HOST||'',/^(127\.0\.0\.1|localhost):8080$/,'Firestore emulator required');
assert.match(process.env.FIREBASE_STORAGE_EMULATOR_HOST||'',/^(127\.0\.0\.1|localhost):9199$/,'Storage emulator required');
const projectId='baticamigo-c0384';
const app=initializeApp({projectId},'baticamigo-e2e-fixtures');
const auth=getAuth(app),db=getFirestore(app);
const password='Synthetic-Only-E2E-Password-2026';
const fixtures=[
  {uid:'e2e-admin',email:'qa-admin@example.invalid',roles:['admin'],profileIds:[]},
  {uid:'e2e-coordinator',email:'qa-coordinator@example.invalid',roles:['coordinator'],profileIds:[]},
  {uid:'e2e-member',email:'qa-member@example.invalid',roles:['member'],profileIds:['e2e-profile-member']},
  {uid:'e2e-student',email:'qa-student@example.invalid',roles:['student'],profileIds:['e2e-profile-student']},
  {uid:'e2e-guardian',email:'qa-guardian@example.invalid',roles:['guardian'],profileIds:['e2e-profile-guardian']},
  {uid:'e2e-tutor',email:'qa-tutor@example.invalid',roles:['tutor'],profileIds:['e2e-profile-tutor']}
];
for(const f of fixtures){
  try{await auth.createUser({uid:f.uid,email:f.email,password,emailVerified:true});}
  catch(error){if(error.code!=='auth/uid-already-exists')throw error;}
  await db.collection('platform_accounts').doc(f.uid).set({roles:f.roles,role:f.roles[0],profileIds:f.profileIds,active:true,suspended:false});
}
for(const [id,kind,attrs] of [
  ['e2e-profile-member','member',{name:'Sócio de teste',active:true}],
  ['e2e-profile-student','student',{name:'Aluno sintético',guardianIds:['e2e-profile-guardian'],active:true}],
  ['e2e-profile-guardian','guardian',{name:'Encarregado sintético',active:true}],
  ['e2e-profile-tutor','tutor',{name:'Explicador sintético',active:true}]
])await db.collection('platform_profiles').doc(id).set({kind,...attrs});
await db.collection('platform_access_settings').doc('profiles').set({profiles:defaultAccessProfiles});

await db.collection('noticias').doc('e2e-news-public').set({
  titulo:'Notícia pública sintética',
  descricao:'Conteúdo editorial exclusivamente fictício para validar a fronteira pública.',
  data:'2026-10-01T12:00:00Z',
  destaque:true,
  internalOnly:'NÃO EXPOR ATRAVÉS DA API PÚBLICA',
  privateContact:'qa-private@example.invalid'
});

const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048,privateKeyEncoding:{format:'pem',type:'pkcs8'},publicKeyEncoding:{format:'pem',type:'spki'}});
const credential={project_id:projectId,client_email:'e2e-only@baticamigo-c0384.iam.gserviceaccount.com',private_key:privateKey};
const next=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3106'],{
  env:{...process.env,NEXT_PUBLIC_E2E_FIREBASE_AUTH_EMULATOR:'1',BATIC_LOCAL_BROWSER_E2E:'1',FIREBASE_SERVICE_ACCOUNT_JSON:JSON.stringify(credential)},
  stdio:'inherit'
});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{next.kill(signal);process.exit(0);});
next.on('exit',code=>process.exit(code??1));
