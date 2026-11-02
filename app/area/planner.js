"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { NativeSelect } from "@/app/components/ui/native-select";
import { Textarea } from "@/app/components/ui/textarea";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import { Dialog } from "@/app/components/ui/dialog";
import { CalendarDays, ChevronLeft, ChevronRight, List, ListTodo, Plus, RotateCcw, Archive, Printer, Upload } from "lucide-react";
import { platformAuth } from "../../lib/firebase-client";

const statusLabels={todo:"Por fazer",in_progress:"Em curso",blocked:"Bloqueada",done:"Concluída"};
const priorityLabels={low:"Baixa",normal:"Normal",high:"Alta"};
const typeLabels={task:"Tarefa",meeting:"Reunião Teams"};
const pageSize=10;
const today=()=>new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Lisbon"});
const monthMove=(value,delta)=>{const [year,month]=value.split("-").map(Number);return new Date(Date.UTC(year,month-1+delta,1)).toISOString().slice(0,7);};
const dateLabel=value=>value?new Intl.DateTimeFormat("pt-PT",{timeZone:"UTC",dateStyle:"medium"}).format(new Date(`${value}T12:00:00Z`)):"Sem data";
const localDateTime=value=>value?new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Lisbon",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(value)).replace(" ","T"):"";

export default function Planner({profiles=[],manager=false}) {
  const [tasks,setTasks]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("all");
  const [assignee,setAssignee]=useState("all");
  const [archived,setArchived]=useState(false);
  const [view,setView]=useState("list");
  const [page,setPage]=useState(1);
  const [month,setMonth]=useState(()=>today().slice(0,7));
  const [selectedDate,setSelectedDate]=useState(today);
  const [editing,setEditing]=useState(null);
  const [detail,setDetail]=useState(null);
  const [formType,setFormType]=useState("task");
  useEffect(()=>{setFormType(editing?.type||"task");},[editing]);

  const request=useCallback(async(path="",options={})=>{
    const current=platformAuth().currentUser;
    if(!current) throw new Error("A sessão terminou. Inicie sessão novamente.");
    const token=await current.getIdToken();
    const response=await fetch(`/api/platform/planner${path}`,{...options,headers:{Authorization:`Bearer ${token}`,...(options.body?{"Content-Type":"application/json"}:{}),...(options.headers||{})},cache:"no-store"});
    const result=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(result.error||"Não foi possível atualizar o Planeador.");
    return result;
  },[]);
  const reload=useCallback(async()=>{
    setLoading(true);setError("");
    try { const result=await request(archived&&manager?"?archived=1":"");setTasks(result.tasks||[]); }
    catch(failure) { setError(failure.message); }
    finally { setLoading(false); }
  },[request,archived,manager]);
  useEffect(()=>{reload();},[reload]);
  useEffect(()=>{setPage(1);},[query,status,assignee,archived]);

  const filtered=useMemo(()=>tasks.filter(task=>
    (status==="all"||task.status===status)&&
    (assignee==="all"||task.assigneeProfileIds?.includes(assignee))&&
    `${task.title} ${task.description} ${task.assigneeProfileIds?.map(id=>profiles.find(profile=>profile.id===id)?.name||"").join(" ")}`.toLocaleLowerCase("pt-PT").includes(query.toLocaleLowerCase("pt-PT"))
  ).sort((a,b)=>(a.type==="meeting"?localDateTime(a.startsAt).slice(0,10):a.dueDate||a.startDate||"9999-12-31").localeCompare(b.type==="meeting"?localDateTime(b.startsAt).slice(0,10):b.dueDate||b.startDate||"9999-12-31")),[tasks,status,assignee,query,profiles]);
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const visible=filtered.slice((page-1)*pageSize,page*pageSize);
  useEffect(()=>{if(page>pages)setPage(pages);},[page,pages]);

  const monthStart=new Date(`${month}-01T12:00:00Z`);
  const monthLabel=new Intl.DateTimeFormat("pt-PT",{timeZone:"UTC",month:"long",year:"numeric"}).format(monthStart);
  const offset=(monthStart.getUTCDay()+6)%7;
  const cellCount=Math.ceil((offset+new Date(Date.UTC(monthStart.getUTCFullYear(),monthStart.getUTCMonth()+1,0)).getUTCDate())/7)*7;
  const cells=Array.from({length:cellCount},(_,index)=>{
    const date=new Date(Date.UTC(monthStart.getUTCFullYear(),monthStart.getUTCMonth(),index-offset+1)).toISOString().slice(0,10);
    return {date,inMonth:date.startsWith(month),tasks:filtered.filter(task=>task.type==="meeting"?localDateTime(task.startsAt).slice(0,10)===date:(task.startDate||task.dueDate)===date||task.dueDate===date).sort((a,b)=>a.title.localeCompare(b.title,"pt-PT"))};
  });
  const dayTasks=filtered.filter(task=>task.type==="meeting"?localDateTime(task.startsAt).slice(0,10)===selectedDate:(task.startDate||task.dueDate)===selectedDate||task.dueDate===selectedDate);
  const names=id=>profiles.find(profile=>profile.id===id)?.name||"Responsável";

  async function saveTask(event) {
    event.preventDefault();setBusy(true);setError("");setNotice("");
    try {
      const form=new FormData(event.currentTarget);
      const type=String(form.get("type")||"task");
      const task={...(editing?{id:editing.id,version:editing.version}:{}),type,title:String(form.get("title")||""),description:String(form.get("description")||""),status:String(form.get("status")||"todo"),priority:String(form.get("priority")||"normal"),startDate:type==="task"?String(form.get("startDate")||""):'',dueDate:type==="task"?String(form.get("dueDate")||""):'',startsAt:type==="meeting"?String(form.get("startsAt")||""):'',endsAt:type==="meeting"?String(form.get("endsAt")||""):'',teamsUrl:type==="meeting"?String(form.get("teamsUrl")||""):'',minutes:type==="meeting"?String(form.get("minutes")||""):'',assigneeProfileIds:form.getAll("assigneeProfileIds").map(String)};
      await request("",{method:"POST",body:JSON.stringify({action:"save",task})});
      setEditing(null);await reload();setNotice("Tarefa guardada.");
    } catch(failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  async function changeArchive(task,action) {
    setBusy(true);setError("");setNotice("");
    try { await request("",{method:"POST",body:JSON.stringify({action,id:task.id,version:task.version})});setDetail(null);await reload();setNotice(action==="archive"?"Tarefa arquivada.":"Tarefa restaurada."); }
    catch(failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function uploadMinutes(event,meeting) {
    event.preventDefault();
    const file=event.currentTarget.elements.namedItem("signedMinutes")?.files?.[0];
    if(!file){setError("Selecione o PDF assinado da ata.");return;}
    setBusy(true);setError("");setNotice("");
    try {
      const current=platformAuth().currentUser;
      if(!current) throw new Error("A sessão terminou. Inicie sessão novamente.");
      const form=new FormData();form.set("file",file);form.set("meetingId",meeting.id);
      const response=await fetch("/api/platform/planner",{method:"POST",headers:{Authorization:`Bearer ${await current.getIdToken()}`},body:form,cache:"no-store"});
      const result=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(result.error||"Não foi possível guardar a ata assinada.");
      setDetail(null);await reload();setNotice("Ata assinada guardada na reunião.");
    } catch(failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  function printMinutes(meeting) {
    const content=String(meeting.minutes||"").trim();
    const printable=window.open("","_blank","popup,width=900,height=720");
    if(!printable){setError("Permita a abertura da janela de impressão para imprimir a ata.");return;}
    const escape=value=>String(value||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
    const participants=(meeting.assigneeProfileIds||[]).map(names);
    printable.document.write(`<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ata · ${escape(meeting.title)}</title><style>@page{size:A4;margin:20mm}*{box-sizing:border-box}body{font:12pt/1.55 Georgia,serif;color:#211a30}h1{font-size:22pt}h2{margin-top:24px;font: bold 12pt Arial,sans-serif;color:#6846b9}p{white-space:pre-wrap}.meta{font:10pt Arial,sans-serif;color:#514659}.signature{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:70px}.signature div{padding-top:8px;border-top:1px solid #333;text-align:center;font:10pt Arial,sans-serif}</style></head><body><h1>Ata de reunião</h1><p class="meta"><strong>${escape(meeting.title)}</strong></p><p class="meta">Data: ${escape(new Intl.DateTimeFormat("pt-PT",{timeZone:"Europe/Lisbon",dateStyle:"full"}).format(new Date(meeting.startsAt)))} · ${escape(new Intl.DateTimeFormat("pt-PT",{timeZone:"Europe/Lisbon",timeStyle:"short"}).format(new Date(meeting.startsAt)))}–${escape(new Intl.DateTimeFormat("pt-PT",{timeZone:"Europe/Lisbon",timeStyle:"short"}).format(new Date(meeting.endsAt)))}</p><p class="meta">Participantes: ${escape(participants.join(", "))}</p>${meeting.description?`<h2>Convocatória e objetivo</h2><p>${escape(meeting.description)}</p>`:""}<h2>Ata e decisões</h2><p>${escape(content||"(Preencher durante ou após a reunião)")}</p><div class="signature"><div>Presidente / responsável · assinatura e data</div><div>Secretário(a) · assinatura e data</div></div><script>window.onload=()=>window.print()</script></body></html>`);
    printable.document.close();
  }

  const activePeople=profiles.filter(profile=>profile.active===true&&["member","coordinator"].includes(profile.kind));
  return <div className="platform-grid platform-planner">
    <section className="platform-card">
      <div className="platform-list-heading"><div><p className="platform-eyebrow">Planeamento da associação</p><h2>Plano de trabalho</h2><p>Organize tarefas, responsáveis e prazos da equipa.</p></div><div className="platform-record-actions"><Button type="button" variant={view==="list"?"default":"outline"} onClick={()=>setView("list")}><List size={16}/> Lista</Button><Button type="button" variant={view==="calendar"?"default":"outline"} onClick={()=>setView("calendar")}><CalendarDays size={16}/> Calendário</Button>{manager&&<><Button className="platform-primary" onClick={()=>setEditing({type:"task",status:"todo",priority:"normal",assigneeProfileIds:[]})}><Plus size={16}/> Nova tarefa</Button><Button type="button" variant="outline" onClick={()=>setEditing({type:"meeting",status:"todo",priority:"normal",startsAt:`${selectedDate}T09:00`,endsAt:`${selectedDate}T10:00`,assigneeProfileIds:[]})}><CalendarDays size={16}/> Nova reunião Teams</Button></>}</div></div>
      {error&&<p className="platform-error" role="alert">{error}</p>}{notice&&<p className="platform-success" role="status">{notice}</p>}
      <div className="platform-toolbar"><label className="platform-filter">Estado<NativeSelect value={status} onChange={event=>setStatus(event.target.value)}><option value="all">Todos</option>{Object.entries(statusLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</NativeSelect></label>{manager&&<label className="platform-filter">Responsável<SearchableSelect ariaLabel="Filtrar tarefas por responsável" placeholder="Pesquisar responsável" value={assignee==="all"?"":assignee} onChange={value=>setAssignee(value||"all")} options={activePeople.map(profile=>({value:profile.id,label:profile.name,description:profile.kind==="member"?"Sócio":"Coordenação"}))}/></label>}<label className="platform-search"><span className="platform-sr">Pesquisar tarefas</span><Input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Pesquisar tarefas"/></label>{manager&&<Button type="button" variant="outline" onClick={()=>setArchived(value=>!value)}>{archived?<RotateCcw size={16}/>:<Archive size={16}/>} {archived?"Ver tarefas ativas":"Tarefas arquivadas"}</Button>}</div>
      {loading?<p role="status">A carregar Planeador…</p>:view==="calendar"?<div className="platform-calendar"><div className="platform-calendar-heading"><div><p className="platform-eyebrow">Agenda da equipa</p><h3>{monthLabel}</h3></div><div className="platform-calendar-controls"><Button type="button" variant="outline" onClick={()=>{setMonth(today().slice(0,7));setSelectedDate(today());}}>Hoje</Button><Button type="button" variant="outline" aria-label="Mês anterior" onClick={()=>setMonth(value=>monthMove(value,-1))}><ChevronLeft size={17}/></Button><Button type="button" variant="outline" aria-label="Mês seguinte" onClick={()=>setMonth(value=>monthMove(value,1))}><ChevronRight size={17}/></Button></div></div><div className="platform-calendar-grid" role="grid" aria-label={`Calendário do Planeador: ${monthLabel}`}><div className="platform-calendar-row" role="row">{["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(day=><div role="columnheader" className="platform-calendar-weekday" key={day}>{day}</div>)}</div>{Array.from({length:cellCount/7},(_,row)=>cells.slice(row*7,row*7+7)).map((week,row)=><div className="platform-calendar-row" role="row" key={row}>{week.map(cell=><div role="gridcell" key={cell.date} className={`platform-calendar-day${cell.inMonth?"":" is-outside"}${cell.date===selectedDate?" is-selected":""}`}><button type="button" className="platform-calendar-date" aria-pressed={cell.date===selectedDate} onClick={()=>{setSelectedDate(cell.date);if(!cell.inMonth)setMonth(cell.date.slice(0,7));}}><span>{Number(cell.date.slice(-2))}</span>{cell.tasks.length>0&&<span className="platform-calendar-count">{cell.tasks.length}</span>}</button><div className="planner-calendar-events">{cell.tasks.slice(0,2).map(task=><button type="button" key={task.id} className="platform-calendar-event" onClick={()=>setDetail(task)}>{task.type==="meeting"?`Teams · ${task.title}`:task.title}</button>)}{cell.tasks.length>2&&<span className="platform-calendar-more">+{cell.tasks.length-2} mais</span>}</div></div>)}</div>)}</div><div className="platform-calendar-day-summary"><div><p className="platform-eyebrow">Dia selecionado</p><h3>{dateLabel(selectedDate)}</h3></div>{manager&&<div className="platform-record-actions"><Button className="platform-primary" onClick={()=>setEditing({type:"task",status:"todo",priority:"normal",startDate:selectedDate,assigneeProfileIds:[]})}><Plus size={16}/> Agendar tarefa</Button><Button type="button" variant="outline" onClick={()=>setEditing({type:"meeting",status:"todo",priority:"normal",startsAt:`${selectedDate}T09:00`,endsAt:`${selectedDate}T10:00`,assigneeProfileIds:[]})}><CalendarDays size={16}/> Agendar reunião Teams</Button></div>}</div>{dayTasks.length?<ul className="platform-calendar-selected-list">{dayTasks.map(task=><li key={task.id}><button type="button" onClick={()=>setDetail(task)}><strong>{task.type==="meeting"?"Reunião Teams · ":""}{task.title}</strong><span>{task.type==="meeting"?`${new Intl.DateTimeFormat("pt-PT",{timeZone:"Europe/Lisbon",timeStyle:"short"}).format(new Date(task.startsAt))}–${new Intl.DateTimeFormat("pt-PT",{timeZone:"Europe/Lisbon",timeStyle:"short"}).format(new Date(task.endsAt))} · ${task.assigneeProfileIds?.map(names).join(", ")||"Sem participantes"}`:`${statusLabels[task.status]}${task.dueDate?` · Prazo ${dateLabel(task.dueDate)}`:""}`}</span></button></li>)}</ul>:<p className="platform-calendar-empty">Sem tarefas ou reuniões nesta data.</p>}</div>:filtered.length?<><ul className="platform-list planner-task-list">{visible.map(task=><li key={task.id}><article><div className="platform-list-heading"><div><h3>{task.type==="meeting"?"Reunião Teams · ":""}{task.title}</h3><p>{task.type==="meeting"?`${new Intl.DateTimeFormat("pt-PT",{timeZone:"Europe/Lisbon",dateStyle:"medium",timeStyle:"short"}).format(new Date(task.startsAt))} · Reunião Teams`:`${task.startDate?`Início ${dateLabel(task.startDate)}`:"Sem data de início"}${task.dueDate?` · Prazo ${dateLabel(task.dueDate)}`:""}`}</p></div><span className={`platform-status planner-status is-${task.status}`}>{statusLabels[task.status]}</span></div>{task.description&&<p>{task.description}</p>}{task.type==="meeting"&&<p><a href={task.teamsUrl} target="_blank" rel="noopener noreferrer">Abrir reunião Teams ↗</a></p>}<p className="planner-assignees">{task.assigneeProfileIds?.length?task.assigneeProfileIds.map(names).join(", "):"Sem responsáveis / participantes"} · Prioridade {priorityLabels[task.priority]}</p><div className="platform-record-actions"><Button type="button" variant="outline" onClick={()=>setDetail(task)}>Ver {task.type==="meeting"?"reunião":"tarefa"}</Button>{manager&&!task.archivedAt&&<Button type="button" variant="outline" onClick={()=>setEditing(task)}>Editar</Button>}</div></article></li>)}</ul><div className="user-manager-pagination"><span>{filtered.length} registos · Página {page} de {pages}</span><div><Button type="button" variant="outline" disabled={page<=1} onClick={()=>setPage(value=>value-1)}>Anterior</Button><span>{page}/{pages}</span><Button type="button" variant="outline" disabled={page>=pages} onClick={()=>setPage(value=>value+1)}>Seguinte</Button></div></div></>:<div className="platform-empty"><ListTodo size={24}/><h3>{archived?"Sem registos arquivados":"Ainda sem tarefas ou reuniões"}</h3><p>{manager?"Crie uma tarefa ou agende uma reunião Teams para começar.":"As tarefas e reuniões atribuídas ao seu perfil aparecem aqui."}</p></div>}
    </section>
    <Dialog open={!!editing} onOpenChange={open=>{if(!open)setEditing(null);}} ariaLabel={editing?.id?`Editar ${typeLabels[editing.type||"task"].toLocaleLowerCase("pt-PT")}`:"Criar tarefa ou reunião"} className="platform-dialog"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">Planeador</p><h2>{editing?.id?`Editar ${typeLabels[editing.type||"task"].toLocaleLowerCase("pt-PT")}`:"Nova tarefa ou reunião"}</h2></div><Button type="button" variant="outline" onClick={()=>setEditing(null)}>Fechar</Button></div><form key={editing?.id||`new-${editing?.startDate||""}`} onSubmit={saveTask}><fieldset disabled={busy}><Label className="platform-field"><span>Tipo</span><NativeSelect name="type" defaultValue={editing?.type||"task"}><option value="task">Tarefa</option><option value="meeting">Reunião Microsoft Teams</option></NativeSelect></Label><Label className="platform-field"><span>Título</span><Input name="title" required maxLength={160} defaultValue={editing?.title||""}/></Label><Label className="platform-field"><span>Descrição / agenda</span><Textarea name="description" maxLength={3000} rows={4} defaultValue={editing?.description||""}/></Label><div className="platform-toolbar"><Label className="platform-filter"><span>Estado</span><NativeSelect name="status" defaultValue={editing?.status||"todo"}>{Object.entries(statusLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</NativeSelect></Label><Label className="platform-filter"><span>Prioridade</span><NativeSelect name="priority" defaultValue={editing?.priority||"normal"}>{Object.entries(priorityLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</NativeSelect></Label></div><div className="platform-toolbar"><Label className="platform-field"><span>Início da tarefa</span><Input name="startDate" type="date" defaultValue={editing?.startDate||""}/></Label><Label className="platform-field"><span>Prazo da tarefa</span><Input name="dueDate" type="date" defaultValue={editing?.dueDate||""}/></Label></div><div className="platform-toolbar"><Label className="platform-field"><span>Início da reunião (hora de Portugal)</span><Input name="startsAt" type="datetime-local" defaultValue={editing?.startsAt?localDateTime(editing.startsAt):""}/></Label><Label className="platform-field"><span>Fim da reunião</span><Input name="endsAt" type="datetime-local" defaultValue={editing?.endsAt?localDateTime(editing.endsAt):""}/></Label></div><Label className="platform-field"><span>Ligação da reunião Teams</span><Input name="teamsUrl" type="url" placeholder="https://teams.microsoft.com/..." maxLength={2000} defaultValue={editing?.teamsUrl||""}/><span className="platform-hint">Crie a reunião no Microsoft Teams e cole aqui a ligação. O Planeador guarda e partilha a ligação com os participantes.</span></Label><Label className="platform-field"><span>Ata da reunião</span><Textarea name="minutes" maxLength={12000} rows={8} defaultValue={editing?.minutes||""} placeholder="Registe participantes, pontos discutidos, decisões, responsáveis e prazos."/><span className="platform-hint">A ata guardada pode ser impressa para recolher assinaturas. Depois, carregue o PDF assinado nos detalhes da reunião.</span></Label><fieldset className="platform-share-access"><legend>Responsáveis / participantes</legend><p className="platform-hint">Selecione sócios e coordenadores ativos.</p><SearchableSelect name="assigneeProfileIds" multiple ariaLabel="Pesquisar e selecionar responsáveis ou participantes" placeholder="Pesquisar sócio ou coordenador" defaultValue={editing?.assigneeProfileIds||[]} options={activePeople.map(profile=>({value:profile.id,label:profile.name,description:profile.kind==="member"?"Sócio":"Coordenação"}))}/>{!activePeople.length&&<p className="platform-hint">Não há perfis ativos disponíveis para atribuição.</p>}</fieldset>{error&&<p className="platform-error" role="alert">{error}</p>}<div className="platform-actions"><Button type="submit" className="platform-primary">{busy?"A guardar…":"Guardar"}</Button><Button type="button" variant="outline" onClick={()=>setEditing(null)}>Cancelar</Button></div></fieldset></form></section></Dialog>
    <Dialog open={!!detail} onOpenChange={open=>{if(!open)setDetail(null);}} ariaLabel={detail?.title||"Detalhes do Planeador"} className="platform-dialog"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">{typeLabels[detail?.type||"task"]} do Planeador</p><h2>{detail?.title}</h2></div><Button type="button" variant="outline" onClick={()=>setDetail(null)}>Fechar</Button></div>{detail&&<div className="platform-record-details"><p><strong>Estado:</strong> {statusLabels[detail.status]}</p><p><strong>Prioridade:</strong> {priorityLabels[detail.priority]}</p>{detail.type==="meeting"?<><p><strong>Início:</strong> {new Intl.DateTimeFormat("pt-PT",{timeZone:"Europe/Lisbon",dateStyle:"medium",timeStyle:"short"}).format(new Date(detail.startsAt))}</p><p><strong>Fim:</strong> {new Intl.DateTimeFormat("pt-PT",{timeZone:"Europe/Lisbon",dateStyle:"medium",timeStyle:"short"}).format(new Date(detail.endsAt))}</p><p><strong>Participantes:</strong> {detail.assigneeProfileIds?.map(names).join(", ")||"Sem participantes"}</p><p><a href={detail.teamsUrl} target="_blank" rel="noopener noreferrer">Entrar na reunião Microsoft Teams ↗</a></p><p><strong>Ata:</strong> {detail.minutesFileName?`Assinada · ${detail.minutesFileName}`:"Ainda sem assinatura carregada"}</p>{detail.minutesFileUrl&&<p><a href={detail.minutesFileUrl} target="_blank" rel="noopener noreferrer">Abrir / descarregar ata assinada ↗</a></p>}<div className="platform-record-actions"><Button type="button" variant="outline" onClick={()=>printMinutes(detail)}><Printer size={15}/> Imprimir ata</Button>{manager&&!detail.archivedAt&&<form className="platform-minutes-upload" onSubmit={event=>uploadMinutes(event,detail)}><label className="platform-field"><span>PDF assinado (máx. 4 MB)</span><Input name="signedMinutes" type="file" accept="application/pdf,.pdf" required/></label><Button type="submit" disabled={busy}><Upload size={15}/> Carregar ata assinada</Button></form>}</div></>:<><p><strong>Início:</strong> {dateLabel(detail.startDate)}</p><p><strong>Prazo:</strong> {dateLabel(detail.dueDate)}</p><p><strong>Responsáveis:</strong> {detail.assigneeProfileIds?.map(names).join(", ")||"Sem responsáveis"}</p></>}{detail.description&&<p><strong>{detail.type==="meeting"?"Agenda":"Descrição"}:</strong> {detail.description}</p>}<div className="platform-actions">{manager&&!detail.archivedAt&&<Button type="button" onClick={()=>{setEditing(detail);setDetail(null);}}>Editar</Button>}{manager&&<Button type="button" variant="outline" disabled={busy} onClick={()=>changeArchive(detail,detail.archivedAt?"restore":"archive")}>{detail.archivedAt?"Restaurar":"Arquivar"}</Button>}</div></div>}</section></Dialog>
  </div>;
}
