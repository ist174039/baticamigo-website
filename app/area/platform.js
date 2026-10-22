"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation resets legacy Firebase scripts when crossing between home, admin and the private area. */

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { NativeSelect } from "@/app/components/ui/native-select";
import { Textarea } from "@/app/components/ui/textarea";
import { Dialog } from "@/app/components/ui/dialog";
import { Sheet } from "@/app/components/ui/sheet";
import { ArrowRight, CalendarDays, CircleCheck, Eye, GraduationCap } from "lucide-react";

import { onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { platformAuth } from "../../lib/firebase-client";
import AreaNavigation from "./navigation";
import { PrivateWorkspaceTemplate } from "../components/private/private-workspace-template";
import { PrivateAccountMenu } from "../components/private/private-account-menu";
import AreaUserManager from "./user-manager";
import AccountProfile from "./account-profile";
import {Records, Progress, Reports, Finance} from "./modules";
import { lisbonDateTimeInput, lisbonDateTimeToIso } from "../../lib/platform/time.mjs";
import {canAccessArea,defaultAreasForRoles} from "../../lib/platform/access.mjs";

const roleNames = { admin: "Administração", coordinator: "Coordenação", student: "Aluno", guardian: "Encarregado", tutor: "Explicador", volunteer: "Voluntário", member: "Sócio" };
const kindNames = { student: "Aluno", guardian: "Encarregado", tutor: "Explicador", member: "Sócio" };
const attendanceNames = { present: "Presente", absent: "Falta", excused: "Falta justificada" };
const sessionNames = { scheduled: "Agendada", cancelled: "Cancelada" };
const empty = { profiles: [], sessions: [], attendance: [], records: [], accounts: [] };
const dates = new Intl.DateTimeFormat("pt-PT", { timeZone: "Europe/Lisbon", dateStyle: "medium", timeStyle: "short" });

function Field({ label, children }) {
  return <Label className="platform-field"><span>{label}</span>{children}</Label>;
}

function Choices({ label, name, options, initial = [], required = false }) {
  const [checked, setChecked] = useState(initial);
  return <fieldset className="platform-choices"><legend>{label}{required ? " *" : ""}</legend>{options.length ? <div className="platform-choice-list">{options.map((option, index) => <label className="platform-check" key={option.id}><Checkbox type="checkbox" name={name} value={option.id} checked={checked.includes(option.id)} required={required && checked.length === 0 && index === 0} onChange={(event) => setChecked(event.target.checked ? [...checked, option.id] : checked.filter((id) => id !== option.id))}/><span>{option.name}</span></label>)}</div> : <p className="platform-hint">Ainda não existem perfis disponíveis para associar.</p>}</fieldset>;
}

function selected(form, name) { return form.getAll(name).map(String); }
function values(event) { return new FormData(event.currentTarget); }
export default function Platform() {
  const [user, setUser] = useState(null);
  const [accountName, setAccountName] = useState("");
  const [ready, setReady] = useState(false);
  const [data, setData] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [profileQuery, setProfileQuery] = useState("");
  const [sessionQuery, setSessionQuery] = useState("");
  const [sessionStudent, setSessionStudent] = useState("");
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [sessionEditorOpen, setSessionEditorOpen] = useState(false);
  const [sessionFilter, setSessionFilter] = useState("upcoming");
  const [profileKind, setProfileKind] = useState("all");
  const [attendanceEditing, setAttendanceEditing] = useState(null);
  const [profileDetails, setProfileDetails] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [editorKind, setEditorKind] = useState("student");
  const revision = useRef(0);
  const notice = useRef(null);
  const roles = useMemo(()=>data.account?.roles || (data.account?.role ? [data.account.role] : []),[data.account?.roles,data.account?.role]);
  const manager = roles.some((role) => ["admin", "coordinator"].includes(role));
  const admin = roles.includes("admin");
  const students = data.profiles.filter((profile) => profile.kind === "student");
  const tutors = data.profiles.filter((profile) => profile.kind === "tutor");
  const guardians = data.profiles.filter((profile) => profile.kind === "guardian");
  const profileName = (id) => data.profiles.find((profile) => profile.id === id)?.name || "Perfil indisponível";

  useEffect(() => {
    if (profileEditorOpen || sessionEditorOpen || attendanceEditing) {
      requestAnimationFrame(() => document.querySelector(".platform-dialog[open]")?.querySelector("input, select, textarea")?.focus());
    }
  }, [profileEditorOpen, sessionEditorOpen, attendanceEditing, editing?.id, editingSession?.id]);

  useEffect(()=>{
    const closeMenus=event=>document.querySelectorAll(".platform-action-menu[open]").forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});
    document.addEventListener("pointerdown",closeMenus);
    return()=>document.removeEventListener("pointerdown",closeMenus);
  },[]);

  function navigate(next) {
    setTab(next);
    setProfileEditorOpen(false);
    setSessionEditorOpen(false);
  }

  async function request(currentUser, body) {
    const token = await currentUser.getIdToken();
    const response = await fetch("/api/platform", {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      cache: "no-store",
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Não foi possível concluir o pedido.");
    return result;
  }

  useEffect(() => {
    let live = true;
    const unsubscribe = onAuthStateChanged(platformAuth(), async (currentUser) => {
      const current = ++revision.current;
      setUser(currentUser);
      setAccountName(currentUser?.displayName || "");
      const requestedTab = new URLSearchParams(window.location.search).get("tab");
      setTab(currentUser && ["users", "profiles"].includes(requestedTab) ? "profiles" : currentUser && requestedTab === "account" ? "account" : "overview");
      setProfileEditorOpen(false);
      setSessionEditorOpen(false);
      setData(empty);
      setError("");
      setMessage("");
      setReady(false);
      try {
        if (currentUser) {
          const result = await request(currentUser);
          if (live && current === revision.current) setData(result);
        }
      } catch (failure) {
        if (live && current === revision.current) setError(failure.message);
      } finally {
        if (live && current === revision.current) setReady(true);
      }
    });
    return () => { live = false; revision.current += 1; unsubscribe(); };
  }, []);

  async function action(operation, success) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await operation();
      setMessage(success);
    } catch (failure) {
      setError(failure.message || "Não foi possível concluir a operação.");
    } finally {
      setBusy(false);
      notice.current?.focus();
    }
  }

  async function save(body) {
    const current = revision.current;
    await request(user, body);
    // Discard responses from a previous signed-in account.
    const result = await request(user);
    if (current === revision.current) setData(result);
  }

  function saveProfile(event) {
    event.preventDefault();
    const form = values(event);
    const element = event.currentTarget;
    action(async () => {
      await save({ action: "save-profile", profile: {
        ...(editing ? { id: editing.id } : {}), kind: String(form.get("kind")), name: String(form.get("name")).trim(),
        email: String(form.get("email")).trim(),
        subjects: String(form.get("subjects") || ""), availability: String(form.get("availability") || ""), schoolYear: String(form.get("schoolYear") || ""), ageBand: String(form.get("ageBand") || ""), memberNumber: String(form.get("memberNumber") || ""), membershipStatus: String(form.get("membershipStatus") || "active"), guardianIds: selected(form, "guardianIds"), active: form.get("active") === "on",
      } });
      setEditing(null);
      setProfileEditorOpen(false);
      element.reset();
    }, "Perfil guardado.");
  }

  function saveSession(event) {
    event.preventDefault();
    const form = values(event);
    const element = event.currentTarget;
    action(async () => {
      await save({ action: editingSession ? "update-session" : "create-session", ...(editingSession ? { id: editingSession.id, version: editingSession.version, status: String(form.get("status")) } : {}), session: {
        title: String(form.get("title")).trim(), tutorId: String(form.get("tutorId")), studentIds: selected(form, "studentIds"),
        room: String(form.get("room")).trim(), startsAt: lisbonDateTimeToIso(String(form.get("startsAt"))), endsAt: lisbonDateTimeToIso(String(form.get("endsAt"))),
      } });
      setEditingSession(null);
      setSessionEditorOpen(false);
      element.reset();
    }, "Sessão guardada.");
  }

  function saveAttendance(event) {
    event.preventDefault();
    const form = values(event);
    if (!attendanceEditing) return;
    action(async () => {
      await save({ action: "set-attendance", sessionId: attendanceEditing.sessionId, studentId: attendanceEditing.studentId, status: String(form.get("status")), version: attendanceEditing.version });
      setAttendanceEditing(null);
    }, "Presença guardada.");
  }

  async function saveModule(body, done) {
    await action(async () => { await save(body); done(); }, "Registo guardado.");
  }
  const recordKinds = ["assignment", "material", "document", "message", "assessment", "justification"];
  const moduleTitles = {assignment:"Trabalhos",material:"Materiais",document:"Documentos",message:"Mensagens",assessment:"Avaliações",justification:"Justificações",progress:"Evolução do aluno",reports:"Relatórios",notifications:"Avisos",finance:"Área financeira",access:"Perfis e permissões",account:"O meu perfil"};
  const pageDescriptions = {
    overview: "Acompanhe sessões, presenças e o percurso escolar num só lugar.",
    sessions: manager ? "Agenda, participantes e presenças num só lugar." : "Consulte os horários e acompanhe as presenças das sessões associadas ao seu perfil.",
    profiles: admin ? "Consulte pessoas, perfis, permissões e acessos da associação." : "Consulte e atualize os perfis associados à sua conta.",
    access: "Defina os perfis de acesso e os menus disponíveis para cada função na associação.",
    account: "Consulte as permissões e atualize os dados da sua conta.",
    assignment: "Consulte trabalhos, prazos e materiais partilhados com os alunos.",
    material: "Consulte materiais de apoio e recursos partilhados.",
    assessment: "Registos qualitativos e quantitativos das avaliações dos alunos.",
    progress: "Uma síntese clara dos registos de avaliação por aluno e disciplina.",
    justification: "Consulte e acompanhe os documentos enviados para justificar faltas.",
    finance: "Quotas, doações, financiamentos recebidos e despesas pagas.",
    document: "Documentos partilhados consigo pela associação.",
    message: "Mensagens trocadas com a equipa da associação.",
    notifications: "Avisos e informações importantes da associação.",
    reports: "Consulte atividade, cobertura de avaliação e informação associativa.",
  };
  const teaching = manager || roles.some(role => ["tutor", "volunteer"].includes(role));
  const hasStudents = data.profiles.some(profile => profile.kind === "student");
  const educational = manager || hasStudents || teaching;
  const navigationCandidates=[
    ["overview","Visão geral"],
    ...(educational?[["sessions",manager?"Sessões e presenças":"As minhas sessões"]]:[]),
    ["profiles",admin?"Utilizadores":manager?"Pessoas e sócios":"Os meus perfis"],
    ...(admin?[["access","Perfis e permissões"]]:[]),
    ...((hasStudents||manager)?[["assignment","Trabalhos"],["material","Materiais"],["assessment","Avaliações"],["progress","Evolução"],["justification","Justificações"]]:[]),
    ...((admin||roles.includes("member"))?[["finance","Área financeira"]]:[]),
    ["document","Documentos"],["message","Mensagens"],["notifications","Avisos"],
    ...(manager?[["reports","Relatórios"]]:[]),
    ...(admin?[["account","O meu perfil"]]:[]),
  ];
  const accountConfigured=Boolean(data.account);
  const configuredModules=data.account?.modules;
  const allowedModules=useMemo(()=>accountConfigured?(configuredModules??defaultAreasForRoles(roles)):[],[accountConfigured,configuredModules,roles]);
  const navigationItems=user&&data.account?navigationCandidates.filter(([key])=>key==="account"||key==="access"?admin:canAccessArea({...data.account,modules:allowedModules},key)).map(([key,label])=>({key,label})): [{key:"overview",label:"Iniciar sessão"}];
  const accountUid=data.account?.uid;
  useEffect(()=>{if(user&&accountUid&&tab!=="account"&&tab!=="access"&&!allowedModules.includes(tab))setTab(allowedModules.includes('overview')?'overview':allowedModules[0]||'overview');if(user&&accountUid&&(tab==="account"||tab==="access")&&!admin)setTab(allowedModules.includes('overview')?'overview':allowedModules[0]||'overview');},[user,accountUid,allowedModules,tab,admin]);
  const visibleProfiles = data.profiles.filter((profile) => (profileKind === "all" || profile.kind === profileKind) && `${profile.name} ${profile.email || ""} ${profile.memberNumber || ""} ${profile.subjects || ""} ${kindNames[profile.kind]}`.toLocaleLowerCase("pt-PT").includes(profileQuery.toLocaleLowerCase("pt-PT")));
  const upcoming = [...data.sessions].filter((session) => session.status === "scheduled" && new Date(session.endsAt) >= new Date()).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const completedSessions = data.sessions.filter(session => session.status === "scheduled" && Date.parse(session.endsAt) < Date.now());
  const expectedAttendance = completedSessions.reduce((total, session) => total + session.studentIds.length, 0);
  const confirmedAttendance = data.attendance.filter(record => record.status === "present" && completedSessions.some(session => session.id === record.sessionId)).length;
  const visibleSessions = [...data.sessions].filter((session) => (!sessionStudent || session.studentIds.includes(sessionStudent)) && (sessionFilter === "all" || (sessionFilter === "upcoming" ? session.status === "scheduled" && new Date(session.endsAt) >= new Date() : sessionFilter === "past" ? session.status !== "cancelled" && new Date(session.endsAt) < new Date() : session.status === "cancelled")) && `${session.title} ${profileName(session.tutorId)} ${session.room || ""} ${sessionNames[session.status] || session.status}`.toLocaleLowerCase("pt-PT").includes(sessionQuery.toLocaleLowerCase("pt-PT"))).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const accountMenu = user && <PrivateAccountMenu displayName={accountName || user.displayName || "Conta BaticAmigo"} email={user.email} roleLabel={roles.map(role => roleNames[role] || role).join(", ")} onOpenProfile={admin ? () => navigate("account") : undefined} busy={busy} onChangePassword={() => { setPasswordError(""); setPasswordMessage(""); setPasswordDialogOpen(true); }} onSignOut={() => action(async () => { revision.current += 1; setData(empty); await signOut(platformAuth()); }, "Sessão terminada.")} />;
  return <div className="platform">
    <a className="platform-skip" href="#conteudo">Saltar para o conteúdo</a>
    <AreaNavigation items={navigationItems} active={tab} onNavigate={navigate} admin={admin} user={user} accountMenu={accountMenu}>
    <PrivateWorkspaceTemplate id="conteudo" className="platform-main" headingClassName="platform-title" eyebrow={user ? "Área reservada" : "Associação BaticAmigo"} title={!user ? "Bem-vindo à sua área" : tab === "overview" ? educational ? "Acompanhe o percurso escolar." : "A sua associação, mais perto." : tab === "sessions" ? "Sessões e presenças" : tab === "profiles" ? admin ? "Gestão de utilizadores" : manager ? "Pessoas" : "Os meus perfis" : moduleTitles[tab] || "Gestão de acessos"} description={!user ? "Entre para acompanhar sessões, horários e presenças." : pageDescriptions[tab] || "Consulte a informação disponível para o seu perfil."}>
    <div id="conteudo-tabpanel" role="tabpanel" aria-labelledby={`area-tab-${tab}`} tabIndex={-1} className="platform-tab-content">
      {user && <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} ariaLabel="Alterar palavra-passe" className="platform-dialog user-manager-confirm"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">Segurança da conta</p><h2>Alterar palavra-passe</h2></div><Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>Fechar</Button></div>{passwordError && <p className="platform-error" role="alert">{passwordError}</p>}{passwordMessage && <p className="platform-success" role="status">{passwordMessage}</p>}<form onSubmit={async (event) => { event.preventDefault(); const values = new FormData(event.currentTarget); const current = String(values.get("currentPassword") || ""); const next = String(values.get("newPassword") || ""); if (next.length < 12) { setPasswordError("Escolha uma palavra-passe com pelo menos 12 caracteres."); return; } setBusy(true); setPasswordError(""); setPasswordMessage(""); try { const credential = EmailAuthProvider.credential(platformAuth().currentUser.email, current); await reauthenticateWithCredential(platformAuth().currentUser, credential); await updatePassword(platformAuth().currentUser, next); setPasswordMessage("Palavra-passe alterada com sucesso."); event.currentTarget.reset(); } catch { setPasswordError("Não foi possível alterar a palavra-passe. Confirme a palavra-passe atual e tente novamente."); } finally { setBusy(false); } }}><fieldset disabled={busy}><Field label="Palavra-passe atual"><Input name="currentPassword" type="password" autoComplete="current-password" required /></Field><Field label="Nova palavra-passe"><Input name="newPassword" type="password" autoComplete="new-password" minLength={12} required /></Field><div className="platform-actions"><Button type="submit" className="platform-primary">{busy ? "A guardar…" : "Guardar nova palavra-passe"}</Button><Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button></div></fieldset></form></section></Dialog>}
      <div ref={notice} tabIndex={-1} className="platform-notices">{error && <p className="platform-error" role="alert">{error}</p>}{message && <p className="platform-success" role="status">{message}</p>}</div>
      {!ready ? <p role="status">A carregar a sua área…</p> : !user ? <section className="platform-card platform-login" aria-labelledby="sign-in-title"><h2 id="sign-in-title">Aceda à sua área</h2><p>Use a conta disponibilizada pela associação para consultar sessões, perfis, documentos e mensagens.</p><Button className="platform-primary" onClick={() => window.location.assign("/platform/login")}>Iniciar sessão</Button></section> : !data.account ? <section className="platform-card"><h2>{error ? "Não foi possível abrir a sua área" : "Acesso pendente"}</h2><p>{error ? "Volte a tentar. Se o problema continuar, contacte a coordenação para verificar a conta e a configuração do serviço." : "A associação precisa de confirmar o seu perfil e permissões. Contacte a coordenação."}</p><Button disabled={busy} onClick={() => action(async () => setData(await request(user)), "Acesso atualizado.")}>Voltar a verificar</Button></section> : <>
        {tab === "overview" && educational && <>
          <div className="platform-metrics platform-overview-metrics"><article className="platform-overview-metric"><div className="platform-metric-topline"><span className="platform-metric-icon"><CalendarDays size={17}/></span><span className="platform-metric-period">A seguir</span></div><span className="platform-metric-label">Próximas sessões</span><strong>{upcoming.length}</strong><span className="platform-metric-context">{upcoming.length===1?"sessão na agenda":"sessões na agenda"}</span><Button variant="ghost" className="platform-metric-action" onClick={() => { setSessionFilter("upcoming"); navigate("sessions"); }}>Abrir agenda <ArrowRight size={14}/></Button></article><article className="platform-overview-metric"><div className="platform-metric-topline"><span className="platform-metric-icon"><GraduationCap size={18}/></span><span className="platform-metric-period">{manager?"Acompanhamento":"Conta"}</span></div><span className="platform-metric-label">{manager ? "Alunos ativos" : "Perfis associados"}</span><strong>{manager ? students.filter((p) => p.active).length : data.profiles.length}</strong><span className="platform-metric-context">{manager?"Com perfil ativo na associação":"Ligados ao seu acesso"}</span><Button variant="ghost" className="platform-metric-action" onClick={() => navigate("profiles")}>{manager ? "Ver pessoas" : "Ver perfis"} <ArrowRight size={14}/></Button></article><article className="platform-overview-metric"><div className="platform-metric-topline"><span className="platform-metric-icon"><CircleCheck size={17}/></span><span className="platform-metric-period">Sessões terminadas</span></div><span className="platform-metric-label">Presenças confirmadas</span><strong>{confirmedAttendance}<small className="platform-metric-total"> / {expectedAttendance}</small></strong><span className="platform-metric-context">Presenças registadas entre participantes esperados</span><Button variant="ghost" className="platform-metric-action" onClick={() => { setSessionFilter("past"); navigate("sessions"); }}>Ver presenças <ArrowRight size={14}/></Button></article></div>
          <section className="platform-card"><div className="platform-list-heading"><div><p className="platform-eyebrow">A sua agenda</p><h2>Próximas sessões</h2></div><Button onClick={() => navigate("sessions")}>Ver sessões</Button></div>{upcoming.length ? <ul className="platform-list">{upcoming.slice(0, 5).map((session) => <li key={session.id}><div><h3>{session.title}</h3><p>{dates.format(new Date(session.startsAt))} · {session.room || "Sala por definir"}</p><p>{profileName(session.tutorId)}</p></div><span className="platform-status is-active">Agendada</span></li>)}</ul> : <div className="platform-empty"><h3>A agenda está livre</h3><p>{manager ? "Comece por adicionar as pessoas e agendar a primeira sessão." : "As sessões aparecerão aqui assim que forem agendadas pela coordenação."}</p></div>}{manager && <div className="platform-actions"><Button className="platform-primary" onClick={() => { navigate("sessions"); setEditingSession(null); setSessionEditorOpen(true); }}>Agendar sessão</Button><Button onClick={() => { navigate("profiles"); setEditing(null); setEditorKind("student"); setProfileEditorOpen(true); }}>Adicionar pessoa</Button></div>}</section>
        </>}
        {tab === "overview" && !educational && <section className="platform-card"><div className="platform-list-heading"><div><p className="platform-eyebrow">A sua ligação à BaticAmigo</p><h2>O meu espaço</h2></div></div>{data.profiles.filter(profile => profile.kind === "member").map(profile => <div className="platform-summary" key={profile.id}><h3>{profile.name}</h3><p>Sócio {profile.memberNumber || "com número por atribuir"} · {{active:"Ativo",pending:"Pendente",suspended:"Suspenso",left:"Cessou"}[profile.membershipStatus] || "Situação por confirmar"}</p></div>)}<p>Consulte a informação partilhada consigo ou envie uma mensagem à associação.</p><div className="platform-actions"><Button className="platform-primary" onClick={() => navigate("document")}>Os meus documentos</Button><Button onClick={() => navigate("message")}>Mensagens</Button><Button onClick={() => navigate("profiles")}>O meu perfil</Button></div></section>}
        {tab === "account" && admin && <AccountProfile user={user} roles={roles} profiles={data.profiles.filter(profile => (data.account?.profileIds || []).includes(profile.id))} displayName={accountName} onDisplayNameChange={setAccountName} onChangePassword={() => { setPasswordError(""); setPasswordMessage(""); setPasswordDialogOpen(true); }} />}
        {tab === "access" && admin && <AreaUserManager view="permissions" />}
        {recordKinds.includes(tab) && <Records key={tab} kind={tab} data={data} user={user} manager={manager} busy={busy} onSave={saveModule}/>}
        {tab === "finance" && (admin || roles.includes("member")) && <Finance key={user.uid} user={user}/>}
        {tab === "progress" && <Progress data={data} manager={manager}/>}
        {tab === "reports" && manager && <Reports data={data}/>}
        {tab === "notifications" && <section className="platform-card"><h2>Avisos da sua área</h2><ul className="platform-list"><li><div><h3>{upcoming.length} sessões por realizar</h3><p>Consulte a agenda para confirmar os próximos horários.</p><Button onClick={() => navigate("sessions")}>Abrir agenda</Button></div></li><li><div><h3>{(data.records || []).filter(record => record.kind === "message" && record.authorUid !== user.uid).length} mensagens recebidas</h3><p>As mensagens partilhadas ficam disponíveis na sua área.</p><Button onClick={() => navigate("message")}>Abrir mensagens</Button></div></li><li><div><h3>{(data.records || []).filter(record => record.kind === "assignment" && record.dueAt && record.dueAt >= new Date().toISOString().slice(0,10)).length} trabalhos com prazo em curso</h3><Button onClick={() => navigate("assignment")}>Consultar trabalhos</Button></div></li></ul></section>}
        {tab === "profiles" && admin && <AreaUserManager />}{tab === "profiles" && !admin && <div className="platform-grid"><section className="platform-card"><div className="platform-list-heading"><div><h2>{manager ? "Pessoas" : "Perfis associados"}</h2><p>{visibleProfiles.length} {visibleProfiles.length === 1 ? "registo" : "registos"}</p></div>{manager && <Button className="platform-primary" onClick={() => { setEditing(null); setEditorKind("student"); setProfileEditorOpen(true); }}>Adicionar pessoa</Button>}</div><div className="platform-toolbar"><label className="platform-filter">Tipo de perfil<NativeSelect value={profileKind} onChange={(event) => setProfileKind(event.target.value)}><option value="all">Todos os perfis</option>{Object.entries(kindNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</NativeSelect></label><label className="platform-search"><span className="platform-sr">Pesquisar pessoas</span><Input type="search" value={profileQuery} onChange={(event) => setProfileQuery(event.target.value)} placeholder="Pesquisar por nome, email ou tipo"/></label></div>{visibleProfiles.length ? <ul className="platform-list">{visibleProfiles.map((profile) => <li key={profile.id}><div><strong>{profile.name}</strong><p>{kindNames[profile.kind]} · <span className={`platform-status${profile.active ? " is-active" : ""}`}>{profile.active ? "Ativo" : "Inativo"}</span></p>{profile.email && <p>{profile.email}</p>}{profile.subjects && <p>Disciplinas: {profile.subjects}</p>}{profile.availability && <p>Disponibilidade: {profile.availability}</p>}{profile.schoolYear && <p>Ano escolar: {profile.schoolYear}</p>}{profile.kind === "member" && <><p>Sócio {profile.memberNumber || "sem número"} · {{active:"Ativo",pending:"Pendente",suspended:"Suspenso",left:"Cessou"}[profile.membershipStatus] || "Por preencher"}</p>{profile.membershipHistory?.length > 0 && <details><summary>Histórico associativo</summary><ul>{profile.membershipHistory.map((entry,index) => <li key={index}>{dates.format(new Date(entry.at))} · {{active:"Ativo",pending:"Pendente",suspended:"Suspenso",left:"Cessou"}[entry.status]}</li>)}</ul></details>}</>}{profile.kind === "student" && profile.guardianIds?.length > 0 && <p>Encarregados: {profile.guardianIds.map(profileName).join(", ")}</p>}</div><div className="platform-record-actions"><Button variant="outline" onClick={() => setProfileDetails(profile)}><Eye size={15}/> Ver detalhes</Button>{manager && <Button onClick={() => { setEditing(profile); setEditorKind(profile.kind); setProfileEditorOpen(true); }}>Editar <span className="platform-sr">{profile.name}</span></Button>}</div></li>)}</ul> : <p>{profileQuery ? "Nenhuma pessoa corresponde à pesquisa." : "Ainda não existem perfis disponíveis."}</p>}</section>
          <Sheet open={!!profileDetails} onOpenChange={(open) => { if (!open) setProfileDetails(null); }} ariaLabel={profileDetails?.name || "Detalhes do perfil"} className="platform-dialog platform-context-sheet"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">{profileDetails && kindNames[profileDetails.kind]}</p><h2>{profileDetails?.name}</h2></div><Button variant="outline" onClick={() => setProfileDetails(null)}>Fechar</Button></div>{profileDetails && <div className="platform-record-details">{profileDetails.email && <p><strong>Email:</strong> {profileDetails.email}</p>}<p><strong>Estado:</strong> {profileDetails.active ? "Ativo" : "Inativo"}</p>{profileDetails.schoolYear && <p><strong>Ano escolar:</strong> {profileDetails.schoolYear}</p>}{profileDetails.ageBand && <p><strong>Faixa etária:</strong> {profileDetails.ageBand}</p>}{profileDetails.guardianIds?.length > 0 && <p><strong>Encarregados:</strong> {profileDetails.guardianIds.map(profileName).join(", ")}</p>}{profileDetails.subjects && <p><strong>Disciplinas:</strong> {profileDetails.subjects}</p>}{profileDetails.availability && <p><strong>Disponibilidade:</strong> {profileDetails.availability}</p>}{profileDetails.kind === "member" && <><p><strong>N.º de sócio:</strong> {profileDetails.memberNumber || "Por atribuir"}</p><p><strong>Situação:</strong> {{active:"Ativo",pending:"Pendente",suspended:"Suspenso",left:"Cessou"}[profileDetails.membershipStatus] || "Por preencher"}</p></>}</div>}</section></Sheet>
          {manager && <Dialog open={profileEditorOpen} onOpenChange={(open) => { setProfileEditorOpen(open); if (!open) setEditing(null); }} className="platform-dialog"><section className="platform-card platform-editor"><div className="platform-list-heading"><h2>{editing ? `Editar ${editing.name}` : "Adicionar pessoa"}</h2><Button type="button" variant="outline" onClick={() => { setEditing(null); setProfileEditorOpen(false); }}>Fechar</Button></div><form key={editing?.id || "new-profile"} onSubmit={saveProfile}><fieldset disabled={busy}><Field label="Tipo de perfil"><NativeSelect name="kind" value={editorKind} onChange={(event) => setEditorKind(event.target.value)} aria-readonly={!!editing}>{Object.entries(kindNames).map(([key, label]) => <option key={key} value={key} disabled={!!editing && key !== editing.kind}>{label}</option>)}</NativeSelect></Field><Field label="Nome"><Input name="name" required maxLength={100} defaultValue={editing?.name}/></Field><Field label="Email (opcional)"><Input name="email" type="email" maxLength={254} defaultValue={editing?.email}/></Field>{editorKind === "student" && <Choices label="Encarregados associados" name="guardianIds" options={guardians.filter((profile) => profile.active || editing?.guardianIds?.includes(profile.id))} initial={editing?.guardianIds || []}/>}{editorKind === "student" && <><Field label="Ano escolar"><Input name="schoolYear" maxLength={200} placeholder="Ex.: 7.º ano" defaultValue={editing?.schoolYear}/></Field><Field label="Faixa etária"><NativeSelect name="ageBand" defaultValue={editing?.ageBand || ""}><option value="">Por preencher</option>{["Até 5 anos", "6–9 anos", "10–12 anos", "13–15 anos", "16–17 anos", "18 ou mais anos"].map(band => <option key={band}>{band}</option>)}</NativeSelect></Field></>}
          {editorKind === "tutor" && <><Field label="Disciplinas / competências"><Input name="subjects" maxLength={200} defaultValue={editing?.subjects} placeholder="Ex.: Matemática, Português"/></Field><Field label="Disponibilidade"><Textarea name="availability" maxLength={1000} rows={3} defaultValue={editing?.availability} placeholder="Ex.: Segundas e quartas, das 17h às 19h"/></Field></>}
          {editorKind === "member" && <><Field label="Número de sócio"><Input name="memberNumber" maxLength={200} defaultValue={editing?.memberNumber}/></Field><Field label="Situação associativa"><NativeSelect name="membershipStatus" defaultValue={editing?.membershipStatus || "active"}><option value="pending">Pendente</option><option value="active">Ativo</option><option value="suspended">Suspenso</option><option value="left">Cessou</option></NativeSelect></Field></>}
          <label className="platform-check"><Checkbox type="checkbox" name="active" defaultChecked={editing?.active ?? true}/>Perfil ativo</label><div className="platform-actions"><Button type="submit" className="platform-primary">Guardar perfil</Button><Button type="button" variant="outline" onClick={() => { setEditing(null); setProfileEditorOpen(false); }}>Cancelar</Button></div></fieldset></form></section></Dialog>}
        </div>}
        {tab === "sessions" && <div className="platform-grid"><section className="platform-card"><div className="platform-list-heading"><div><h2>Agenda e participantes</h2><p>{visibleSessions.length} {visibleSessions.length === 1 ? "sessão" : "sessões"} · Horário de Lisboa</p></div>{manager && <Button className="platform-primary" onClick={() => { setEditingSession(null); setSessionEditorOpen(true); }}>Agendar sessão</Button>}</div><div className="platform-toolbar">{students.length > 1 && <label className="platform-filter">Aluno<NativeSelect value={sessionStudent} onChange={(event) => setSessionStudent(event.target.value)}><option value="">Todos os alunos</option>{students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</NativeSelect></label>}<label className="platform-filter">Período<NativeSelect value={sessionFilter} onChange={(event) => setSessionFilter(event.target.value)}><option value="upcoming">Próximas sessões</option><option value="past">Histórico</option><option value="cancelled">Canceladas</option><option value="all">Todas as sessões</option></NativeSelect></label><label className="platform-search"><span className="platform-sr">Pesquisar sessões</span><Input type="search" value={sessionQuery} onChange={(event) => setSessionQuery(event.target.value)} placeholder="Pesquisar disciplina, explicador ou sala"/></label></div>{visibleSessions.length ? <ul className="platform-list platform-sessions">{visibleSessions.map((session) => <li key={session.id}><article><h3>{session.title}</h3><p><time dateTime={session.startsAt}>{dates.format(new Date(session.startsAt))}</time> — <time dateTime={session.endsAt}>{dates.format(new Date(session.endsAt))}</time></p><p>{profileName(session.tutorId)} · {session.room || "Sala por definir"} · <span className={`platform-status${session.status === "scheduled" ? " is-active" : ""}`}>{sessionNames[session.status] || session.status}</span></p><div className="platform-record-actions"><Button variant="outline" onClick={() => setSessionDetails(session)}><Eye size={15}/> Ver detalhes</Button>{manager && <Button onClick={() => { setEditingSession(session); setSessionEditorOpen(true); }}>Editar sessão</Button>}</div><ul className="platform-attendance">{session.studentIds.map((studentId) => {
              const record = data.attendance.find((item) => item.sessionId === session.id && item.studentId === studentId);
              const canMark = session.status !== "cancelled" && (manager || roles.some((role) => ["tutor", "volunteer"].includes(role)) && (data.account.profileIds || [data.account.profileId]).includes(session.tutorId));
              return <li key={studentId}><span>{profileName(studentId)}</span>{canMark && new Date(session.startsAt) <= new Date() ? <><span className={`platform-status${record?.status === "present" ? " is-active" : ""}`}>{attendanceNames[record?.status] || "Por registar"}</span><Button variant="outline" disabled={busy} onClick={() => setAttendanceEditing({ sessionId: session.id, sessionTitle: session.title, studentId, studentName: profileName(studentId), status: record?.status || "", version: record?.version || 0 })}>{record ? "Alterar" : "Registar"}<span className="platform-sr"> presença de {profileName(studentId)}</span></Button></> : <span>{attendanceNames[record?.status] || "Por registar"}</span>}</li>;
            })}</ul></article></li>)}</ul> : <div className="platform-empty"><h3>Nenhuma sessão encontrada</h3><p>{sessionQuery ? "Experimente pesquisar por outro nome, disciplina ou sala." : sessionFilter === "upcoming" ? "Ainda não há sessões agendadas para os próximos dias." : "Não existem sessões neste período."}</p><Button onClick={() => { setSessionQuery(""); setSessionStudent(""); setSessionFilter("all"); }}>Ver todas as sessões</Button></div>}</section>
          <Sheet open={!!sessionDetails} onOpenChange={(open) => { if (!open) setSessionDetails(null); }} ariaLabel={sessionDetails?.title || "Detalhes da sessão"} className="platform-dialog platform-context-sheet"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">Sessão e presenças</p><h2>{sessionDetails?.title}</h2></div><Button variant="outline" onClick={() => setSessionDetails(null)}>Fechar</Button></div>{sessionDetails && <div className="platform-record-details"><p><strong>Início:</strong> {dates.format(new Date(sessionDetails.startsAt))}</p><p><strong>Fim:</strong> {dates.format(new Date(sessionDetails.endsAt))}</p><p><strong>Explicador:</strong> {profileName(sessionDetails.tutorId)}</p><p><strong>Sala:</strong> {sessionDetails.room || "Por definir"}</p><p><strong>Estado:</strong> {sessionNames[sessionDetails.status] || sessionDetails.status}</p><h3>Alunos e presenças</h3><ul>{sessionDetails.studentIds.map((studentId) => { const attendance = data.attendance.find((record) => record.sessionId === sessionDetails.id && record.studentId === studentId); return <li key={studentId}>{profileName(studentId)} — {attendanceNames[attendance?.status] || "Por registar"}</li>; })}</ul></div>}</section></Sheet>\n          {manager && <Dialog open={sessionEditorOpen} onOpenChange={(open) => { setSessionEditorOpen(open); if (!open) setEditingSession(null); }} className="platform-dialog"><section className="platform-card platform-editor"><div className="platform-list-heading"><h2>{editingSession ? `Editar sessão: ${editingSession.title}` : "Agendar sessão"}</h2><Button type="button" variant="outline" onClick={() => { setEditingSession(null); setSessionEditorOpen(false); }}>Fechar</Button></div><p>Preencha os dados da sessão. Todos os horários são de Lisboa.</p>{(!tutors.some((profile) => profile.active) || !students.some((profile) => profile.active)) && <p className="platform-error">Adicione primeiro pelo menos um aluno e um explicador ativos em Pessoas.</p>}<form key={editingSession?.id || "new-session"} onSubmit={saveSession}><fieldset disabled={busy}><Field label="Disciplina / título"><Input name="title" required maxLength={120} defaultValue={editingSession?.title}/></Field><Field label="Explicador"><NativeSelect name="tutorId" required defaultValue={editingSession?.tutorId || ""}><option value="" disabled>Selecionar explicador</option>{tutors.filter((profile) => profile.active || profile.id === editingSession?.tutorId).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</NativeSelect></Field><Choices label="Alunos" name="studentIds" required options={students.filter((profile) => profile.active || editingSession?.studentIds.includes(profile.id))} initial={editingSession?.studentIds || []}/><Field label="Sala"><Input name="room" required maxLength={80} defaultValue={editingSession?.room}/></Field><Field label="Início"><Input name="startsAt" type="datetime-local" required defaultValue={editingSession ? lisbonDateTimeInput(editingSession.startsAt) : undefined}/></Field><Field label="Fim"><Input name="endsAt" type="datetime-local" required defaultValue={editingSession ? lisbonDateTimeInput(editingSession.endsAt) : undefined}/></Field>{editingSession && <Field label="Estado"><NativeSelect name="status" defaultValue={editingSession.status}><option value="scheduled">Agendada</option><option value="cancelled">Cancelada</option></NativeSelect></Field>}<div className="platform-actions"><Button type="submit" className="platform-primary">Guardar sessão</Button><Button type="button" variant="outline" onClick={() => { setEditingSession(null); setSessionEditorOpen(false); }}>Cancelar</Button></div></fieldset></form></section></Dialog>}
        </div>}
      </>}
    {attendanceEditing && <Dialog open onOpenChange={(open) => { if (!open) setAttendanceEditing(null); }} ariaLabel={`Registar presença de ${attendanceEditing.studentName}`} className="platform-dialog"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">{attendanceEditing.sessionTitle}</p><h2>Presença de {attendanceEditing.studentName}</h2></div><Button type="button" variant="outline" onClick={() => setAttendanceEditing(null)}>Fechar</Button></div><form key={`${attendanceEditing.sessionId}:${attendanceEditing.studentId}:${attendanceEditing.version}`} onSubmit={saveAttendance}><fieldset disabled={busy}><Field label="Estado da presença"><NativeSelect name="status" required defaultValue={attendanceEditing.status}><option value="" disabled>Selecionar estado</option>{Object.entries(attendanceNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</NativeSelect></Field><div className="platform-actions"><Button type="submit" className="platform-primary">Guardar presença</Button><Button type="button" variant="outline" onClick={() => setAttendanceEditing(null)}>Cancelar</Button></div></fieldset></form></section></Dialog>}
    </div></PrivateWorkspaceTemplate></AreaNavigation>
  </div>;
}
