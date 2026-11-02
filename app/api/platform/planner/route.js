import { context, collection, audit, json, failure, assertJsonRequest } from '../../../../lib/platform/server';
import { assert, id, manages, profileIds } from '../../../../lib/platform/domain.mjs';
import { canAccessArea } from '../../../../lib/platform/access.mjs';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const rows=snapshot=>snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));
async function bounded(query) {
  const result=await query.limit(501).get();
  assert(result.size<=500,'Existem demasiadas tarefas para mostrar. Contacte a coordenação.',409);
  return rows(result);
}
async function readJson(request) {
  assertJsonRequest(request);
  const length=Number(request.headers.get('content-length')||0);
  assert(length<=16384,'Pedido demasiado grande.',413);
  const reader=request.body?.getReader();
  assert(reader,'Pedido vazio.');
  const chunks=[];let size=0;
  try {
    while(true) {
      const {done,value}=await reader.read();
      if(done) break;
      size+=value.byteLength;
      if(size>16384) { await reader.cancel(); assert(false,'Pedido demasiado grande.',413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes=new Uint8Array(size);let offset=0;
  for(const chunk of chunks) { bytes.set(chunk,offset);offset+=chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { assert(false,'JSON inválido.'); }
}
function taskInput(value) {
  assert(value&&typeof value==='object'&&!Array.isArray(value),'Tarefa inválida.');
  const allowed=['id','version','title','description','status','priority','startDate','dueDate','assigneeProfileIds'];
  assert(Object.keys(value).every(key=>allowed.includes(key)),'Campo não permitido.');
  const title=String(value.title||'').trim(),description=String(value.description||'').trim();
  assert(title.length>0&&title.length<=160,'Indique um título até 160 caracteres.');
  assert(description.length<=3000,'A descrição não pode exceder 3000 caracteres.');
  const status=value.status||'todo',priority=value.priority||'normal';
  assert(['todo','in_progress','blocked','done'].includes(status),'Estado inválido.');
  assert(['low','normal','high'].includes(priority),'Prioridade inválida.');
  const date=input=>{
    if(!input) return '';
    assert(typeof input==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(input)&&Number.isFinite(Date.parse(input))&&new Date(input).toISOString().slice(0,10)===input,'Data inválida.');
    return input;
  };
  const assignees=value.assigneeProfileIds??[];
  assert(Array.isArray(assignees)&&assignees.length<=20&&new Set(assignees).size===assignees.length,'Escolha até 20 responsáveis.');
  const startDate=date(value.startDate),dueDate=date(value.dueDate);
  assert(!startDate||!dueDate||dueDate>=startDate,'O prazo não pode ser anterior ao início.');
  return {...(value.id?{id:id(value.id)}:{}),...(value.version!==undefined?{version:value.version}:{}),title,description,status,priority,startDate,dueDate,assigneeProfileIds:assignees.map(id)};
}

export async function GET(request) {
  try {
    const {db,account}=await context(request);
    assert(canAccessArea(account,'planner'),'Este menu não está disponível para esta conta.',403);
    const includeArchived=manages(account)&&new URL(request.url).searchParams.get('archived')==='1';
    let tasks=[];
    if(manages(account)) tasks=await bounded(collection(db,'planner_tasks'));
    else {
      const linked=profileIds(account);
      assert(linked.length>0,'Associe um perfil de sócio para consultar o planeador.',403);
      const batches=[];
      for(let index=0;index<linked.length;index+=10) {
        batches.push(await bounded(collection(db,'planner_tasks').where('assigneeProfileIds','array-contains-any',linked.slice(index,index+10))));
      }
      tasks=[...new Map(batches.flat().map(task=>[task.id,task])).values()];
      assert(tasks.length<=500,'Existem demasiadas tarefas para mostrar.',409);
    }
    tasks=tasks.filter(task=>includeArchived?Boolean(task.archivedAt):!task.archivedAt);
    if(!manages(account)) tasks=tasks.map(task=>({...task,assigneeProfileIds:(task.assigneeProfileIds||[]).filter(profileId=>profileIds(account).includes(profileId))}));
    return json({tasks});
  } catch(error) { return failure(error); }
}

export async function POST(request) {
  try {
    const {db,account}=await context(request);
    assert(canAccessArea(account,'planner')&&manages(account),'Só a coordenação e a administração podem gerir tarefas.',403);
    const body=await readJson(request);
    assert(body&&typeof body==='object'&&!Array.isArray(body),'Pedido inválido.');
    if(body.action==='archive' || body.action==='restore') {
      assert(Object.keys(body).every(key=>['action','id','version'].includes(key)),'Campo não permitido.');
      const taskId=id(body.id),version=body.version;
      assert(Number.isInteger(version)&&version>0,'Versão da tarefa inválida.');
      const ref=collection(db,'planner_tasks').doc(taskId);
      await db.runTransaction(async tx=>{
        const stored=await tx.get(ref);
        assert(stored.exists,'Tarefa inexistente.',404);
        const old=stored.data();
        assert((old.version||1)===version,'A tarefa foi alterada. Atualize os dados.',409);
        const archived=body.action==='archive';
        assert(Boolean(old.archivedAt)!==archived,archived?'A tarefa já está arquivada.':'A tarefa já está ativa.',409);
        tx.set(ref,{...old,version:version+1,archivedAt:archived?new Date().toISOString():'',archivedBy:archived?account.uid:'',updatedAt:new Date().toISOString(),updatedBy:account.uid});
        audit(tx,db,account,`planner-${body.action}`,taskId);
      });
      return json({saved:true});
    }
    assert(body.action==='save','Operação inválida.');
    assert(Object.keys(body).every(key=>['action','task'].includes(key)),'Campo não permitido.');
    const task=taskInput(body.task),taskId=task.id;delete task.id;
    const version=task.version;delete task.version;
    const ref=taskId?collection(db,'planner_tasks').doc(taskId):collection(db,'planner_tasks').doc();
    await db.runTransaction(async tx=>{
      const previous=await tx.get(ref);
      if(taskId) {
        assert(previous.exists,'Tarefa inexistente.',404);
        assert(!previous.data().archivedAt,'Restaure a tarefa antes de a editar.',409);
        assert(Number.isInteger(version)&&version===(previous.data().version||1),'A tarefa foi alterada. Atualize os dados.',409);
      } else assert(version===undefined,'Versão inválida.');
      if(!manages(account)) assert(task.assigneeProfileIds.length>0&&task.assigneeProfileIds.every(profileId=>profileIds(account).includes(profileId)),'Só pode atribuir tarefas a si próprio.',403);
      const people=task.assigneeProfileIds.length?await tx.getAll(...task.assigneeProfileIds.map(profileId=>collection(db,'profiles').doc(profileId))):[];
      assert(people.every(person=>person.exists&&person.data().active===true&&['member','coordinator'].includes(person.data().kind)),'Escolha sócios ou coordenadores com perfil ativo.');
      const now=new Date().toISOString(),old=previous.data()||{};
      tx.set(ref,{...task,version:(old.version||0)+1,authorUid:old.authorUid||account.uid,createdAt:old.createdAt||now,updatedAt:now,updatedBy:account.uid,archivedAt:'',archivedBy:''});
      audit(tx,db,account,taskId?'planner-update':'planner-create',ref.id,{status:task.status,priority:task.priority});
    });
    return json({saved:true,id:ref.id});
  } catch(error) { return failure(error); }
}
