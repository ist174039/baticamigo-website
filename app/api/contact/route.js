import {FieldValue} from 'firebase-admin/firestore';
import {adminServices,assertJsonRequest,failure,json} from '../../../lib/platform/server';
import {assert} from '../../../lib/platform/domain.mjs';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function text(value,max,label) {
  assert(typeof value==='string',`${label} inválido.`);
  const normalized=value.trim();
  assert(normalized.length>0&&normalized.length<=max,`${label} inválido.`);
  return normalized;
}

export async function POST(request) {
  try {
    assertJsonRequest(request);
    const length=Number(request.headers.get('content-length')||0);
    assert(length>0&&length<=8192,'Pedido demasiado grande.',413);
    let body;try{body=await request.json();}catch{assert(false,'JSON inválido.');}
    assert(body&&typeof body==='object'&&!Array.isArray(body),'Pedido inválido.');
    assert(Object.keys(body).every(key=>['name','email','subject','message','website'].includes(key)),'Campo não permitido.');
    // Honeypot: legitimate users never interact with this visually hidden field.
    if(typeof body.website==='string'&&body.website.trim()) return json({accepted:true},202);
    const nome=text(body.name,100,'Nome');
    const email=text(body.email,254,'Email').toLowerCase();
    assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Email inválido.');
    const assunto=text(body.subject,160,'Assunto');
    const mensagem=text(body.message,6000,'Mensagem');
    const {db}=adminServices();
    await db.collection('contato').add({nome,email,assunto,mensagem,data:FieldValue.serverTimestamp(),lido:false,source:'website'});
    return json({accepted:true},201);
  } catch(error) { return failure(error); }
}
