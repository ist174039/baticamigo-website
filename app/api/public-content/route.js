import {adminServices,failure} from '../../../lib/platform/server';
import {assert} from '../../../lib/platform/domain.mjs';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const schemas={
  membros:{strings:['nome','cargo','descricao','imagem']},
  parceiros:{strings:['nome','descricao','website','logo']},
  eventos:{strings:['nome','tipo','descricao','imagem'],dates:['data'],lists:['parceiros','flags'],booleans:['destaque'],gallery:true},
  programas:{strings:['nome','descricao'],dates:['data_inicio','data_fim'],lists:['patrocinadores']},
  agenda:{strings:['nome','tipo','flag','descricao','inscricao'],dates:['data_inicio','data_fim'],lists:['parceiros'],booleans:['destaque'],gallery:true},
  noticias:{strings:['titulo','descricao','link','imagem'],dates:['data'],booleans:['destaque']},
  site_config:{strings:['intro','email','address','instagram']},
};

function text(value,max=10000){
  return typeof value==='string'?value.slice(0,max):undefined;
}
function date(value){
  if(!value) return undefined;
  try{
    if(typeof value.toDate==='function') return value.toDate().toISOString();
    if(value instanceof Date) return value.toISOString();
    if(typeof value==='string'&&Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  }catch{}
  return undefined;
}
function stringList(value,max=50){
  return Array.isArray(value)?value.filter(item=>typeof item==='string').slice(0,max).map(item=>item.slice(0,500)):undefined;
}
function gallery(value){
  if(!Array.isArray(value)) return undefined;
  return value.slice(0,50).map(item=>{
    if(!item||typeof item!=='object'||Array.isArray(item)) return null;
    const tipo=item.tipo==='video'?'video':item.tipo==='imagem'?'imagem':undefined;
    if(!tipo) return null;
    const result={tipo};
    for(const key of ['legenda','thumbnail','url']){
      const current=text(item[key],2000);
      if(current!==undefined) result[key]=current;
    }
    return result;
  }).filter(Boolean);
}
function sanitize(name,id,data={}){
  const schema=schemas[name];
  const result={id:String(id).slice(0,200)};
  for(const key of schema.strings||[]){
    const value=text(data[key],key==='descricao'?8000:2000);
    if(value!==undefined) result[key]=value;
  }
  for(const key of schema.dates||[]){
    const value=date(data[key]);
    if(value!==undefined) result[key]=value;
  }
  for(const key of schema.lists||[]){
    const value=stringList(data[key]);
    if(value!==undefined) result[key]=value;
  }
  for(const key of schema.booleans||[]) if(typeof data[key]==='boolean') result[key]=data[key];
  if(schema.gallery){
    const value=gallery(data.galeria);
    if(value!==undefined) result.galeria=value;
  }
  return result;
}
function publicJson(data,status=200){
  return Response.json(data,{status,headers:{
    'Cache-Control':'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    'X-Content-Type-Options':'nosniff',
  }});
}

export async function GET(request){
  try{
    const url=new URL(request.url);
    const name=String(url.searchParams.get('collection')||'');
    assert(Object.hasOwn(schemas,name),'Coleção pública inválida.',400);
    const id=String(url.searchParams.get('id')||'');
    const {db}=adminServices();

    if(name==='site_config'){
      assert(id==='contact','Documento público inválido.',400);
      const snapshot=await db.collection(name).doc(id).get();
      return publicJson({item:snapshot.exists?sanitize(name,snapshot.id,snapshot.data()):null});
    }

    assert(!id,'O identificador não é aceite para esta coleção.',400);
    const snapshot=await db.collection(name).get();
    return publicJson({items:snapshot.docs.map(doc=>sanitize(name,doc.id,doc.data()))});
  }catch(error){
    return failure(error);
  }
}
