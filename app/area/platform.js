"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation resets legacy Firebase scripts when crossing between home, admin and the private area. */

import { useEffect, useRef, useState } from "react";

import { browserSessionPersistence, onAuthStateChanged, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { platformAuth } from "../../lib/firebase-client";
import Image from "next/image";
import {Records, Progress, Reports} from "./modules";
import { lisbonDateTimeInput, lisbonDateTimeToIso } from "../../lib/platform/time.mjs";

const roleNames = { admin: "Administração", coordinator: "Coordenação", student: "Aluno", guardian: "Encarregado", tutor: "Explicador", volunteer: "Voluntário", member: "Sócio" };
const kindNames = { student: "Aluno", guardian: "Encarregado", tutor: "Explicador", member: "Sócio" };
const attendanceNames = { present: "Presente", absent: "Falta", excused: "Falta justificada" };
const sessionNames = { scheduled: "Agendada", cancelled: "Cancelada" };
const empty = { profiles: [], sessions: [], attendance: [], records: [], accounts: [] };
const dates = new Intl.DateTimeFormat("pt-PT", { timeZone: "Europe/Lisbon", dateStyle: "medium", timeStyle: "short" });

function Field({ label, children }) {
  return <label className="platform-field"><span>{label}</span>{children}</label>;
}

function Choices({ label, name, options, initial = [], required = false }) {
  const [checked, setChecked] = useState(initial);
  return <fieldset className="platform-choices"><legend>{label}{required ? " *" : ""}</legend>{options.length ? <div className="platform-choice-list">{options.map((option, index) => <label className="platform-check" key={option.id}><input type="checkbox" name={name} value={option.id} checked={checked.includes(option.id)} required={required && checked.length === 0 && index === 0} onChange={(event) => setChecked(event.target.checked ? [...checked, option.id] : checked.filter((id) => id !== option.id))}/><span>{option.name}</span></label>)}</div> : <p className="platform-hint">Ainda não existem perfis disponíveis para associar.</p>}</fieldset>;
}

function selected(form, name) { return form.getAll(name).map(String); }
function values(event) { return new FormData(event.currentTarget); }
export default function Platform() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState(empty);
  const [busy, setBusy] = useState(false);
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
  const [accessEditing, setAccessEditing] = useState(null);
  const [editorKind, setEditorKind] = useState("student");
  const revision = useRef(0);
  const notice = useRef(null);
  const roles = data.account?.roles || (data.account?.role ? [data.account.role] : []);
  const manager = roles.some((role) => ["admin", "coordinator"].includes(role));
  const admin = roles.includes("admin");
  const students = data.profiles.filter((profile) => profile.kind === "student");
  const tutors = data.profiles.filter((profile) => profile.kind === "tutor");
  const guardians = data.profiles.filter((profile) => profile.kind === "guardian");
  const profileName = (id) => data.profiles.find((profile) => profile.id === id)?.name || "Perfil indisponível";

  useEffect(() => {
    if (profileEditorOpen || sessionEditorOpen) {
      const editor = document.querySelector(".platform-editor");
      editor?.scrollIntoView({ block: "start", behavior: "instant" });
      editor?.querySelector("input, select, textarea")?.focus();
    }
  }, [profileEditorOpen, sessionEditorOpen, editing?.id, editingSession?.id]);

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

  function login(event) {
    event.preventDefault();
    const form = values(event);
    action(async () => {
      await setPersistence(platformAuth(), browserSessionPersistence);
      try { await signInWithEmailAndPassword(platformAuth(), String(form.get("email")), String(form.get("password"))); }
      catch { throw new Error("Não foi possível iniciar sessão. Verifique os dados e tente novamente."); }
    }, "Sessão iniciada.");
  }

  function reset(event) {
    const form = event.currentTarget.form;
    const email = form.elements.email;
    if (!email.reportValidity()) return;
    action(async () => {
      try { await sendPasswordResetEmail(platformAuth(), email.value); }
      catch { /* Same result protects account discovery. */ }
    }, "Se existir uma conta elegível, receberá instruções no email indicado.");
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

  function saveAccount(event) {
    event.preventDefault();
    const form = values(event);
    action(() => save({ action: "save-account", account: { uid: String(form.get("uid")).trim(), roles: selected(form, "roles"), profileIds: selected(form, "profileIds"), active: form.get("active") === "on" } }), "Permissões guardadas.");
  }

  async function saveModule(body, done) {
    await action(async () => { await save(body); done(); }, "Registo guardado.");
  }
  const recordKinds = ["assignment", "material", "document", "message", "assessment", "justification"];
  const moduleTitles = {assignment:"Trabalhos",material:"Materiais",document:"Documentos",message:"Mensagens",assessment:"Avaliações",justification:"Justificações",progress:"Evolução do aluno",reports:"Relatórios",notifications:"Avisos"};
  const teaching = manager || roles.some(role => ["tutor", "volunteer"].includes(role));
  const hasStudents = data.profiles.some(profile => profile.kind === "student");
  const educational = manager || hasStudents || teaching;
  const visibleProfiles = data.profiles.filter((profile) => (profileKind === "all" || profile.kind === profileKind) && `${profile.name} ${profile.email || ""} ${profile.memberNumber || ""} ${profile.subjects || ""} ${kindNames[profile.kind]}`.toLocaleLowerCase("pt-PT").includes(profileQuery.toLocaleLowerCase("pt-PT")));
  const upcoming = [...data.sessions].filter((session) => session.status === "scheduled" && new Date(session.endsAt) >= new Date()).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const visibleSessions = [...data.sessions].filter((session) => (!sessionStudent || session.studentIds.includes(sessionStudent)) && (sessionFilter === "all" || (sessionFilter === "upcoming" ? session.status === "scheduled" && new Date(session.endsAt) >= new Date() : sessionFilter === "past" ? session.status !== "cancelled" && new Date(session.endsAt) < new Date() : session.status === "cancelled")) && `${session.title} ${profileName(session.tutorId)} ${session.room || ""} ${sessionNames[session.status] || session.status}`.toLocaleLowerCase("pt-PT").includes(sessionQuery.toLocaleLowerCase("pt-PT"))).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return <div className="platform">
    <a className="platform-skip" href="#conteudo">Saltar para o conteúdo</a>
    <div className="platform-workspace">
    <aside className="platform-sidebar">
      <a className="platform-brand" href="/"><Image src="/images/logo.png" alt="" width={56} height={48}/><span>BaticAmigo<small>Área reservada</small></span></a>
      <p className="platform-nav-label">A sua área</p>
      <nav aria-label="Navegação principal">{(user && data.account ? [["overview", "Visão geral", "◫"], ...(educational ? [["sessions", manager ? "Sessões e presenças" : "As minhas sessões", "▦"]] : []), ["profiles", manager ? "Pessoas e sócios" : "Os meus perfis", "◎"], ...((hasStudents || manager) ? [["assignment", "Trabalhos", "▤"], ["material", "Materiais", "▧"], ["assessment", "Avaliações", "✎"], ["progress", "Evolução", "↗"], ["justification", "Justificações", "✓"]] : []), ["document", "Documentos", "▱"], ["message", "Mensagens", "✉"], ["notifications", "Avisos", "◉"], ...(manager ? [["reports", "Relatórios", "▥"]] : []), ...(admin ? [["access", "Acessos", "⌘"]] : [])] : [["overview", "Iniciar sessão", "◎"]]).map(([key, label, icon]) => <button key={key} aria-current={tab === key ? "page" : undefined} onClick={() => navigate(key)}><span aria-hidden="true">{icon}</span>{label}</button>)}</nav>
      <div className="platform-sidebar-footer">{admin && <a href="/admin/dashboard">Administração do website <span aria-hidden="true">↗</span></a>}<a href="/">Voltar ao website <span aria-hidden="true">↗</span></a><p>Mais perto.<br/>Mais juntos.</p></div>
    </aside>
    <main id="conteudo" className="platform-main">
      <header className="platform-title"><div><p className="platform-eyebrow">BaticAmigo · Área reservada</p><h1>{!user ? "Bem-vindo à sua área" : tab === "overview" ? educational ? "O apoio começa aqui." : "A sua associação, mais perto." : tab === "sessions" ? "Sessões e presenças" : tab === "profiles" ? manager ? "Pessoas" : "Os meus perfis" : moduleTitles[tab] || "Gestão de acessos"}</h1><p>{!user ? "Entre para acompanhar sessões, horários e presenças." : manager ? "Organize as pessoas e acompanhe cada sessão." : educational ? "Consulte os seus horários e acompanhe as suas presenças." : "Acompanhe a sua situação associativa, documentos e mensagens."}</p></div></header>
      {user && <div className="platform-userbar"><span>{user.email} · {roles.map((role) => roleNames[role] || role).join(", ")}</span><button disabled={busy} onClick={() => action(async () => { revision.current += 1; setData(empty); await signOut(platformAuth()); }, "Sessão terminada.")}>Terminar sessão</button></div>}
      <div ref={notice} tabIndex={-1} className="platform-notices">{error && <p className="platform-error" role="alert">{error}</p>}{message && <p className="platform-success" role="status">{message}</p>}</div>
      {!ready ? <p role="status">A carregar a sua área…</p> : !user ? <section className="platform-card platform-login" aria-labelledby="sign-in-title"><h2 id="sign-in-title">Iniciar sessão</h2><p>Use a conta disponibilizada pela associação.</p><form onSubmit={login}><fieldset disabled={busy}><Field label="Email"><input name="email" type="email" autoComplete="username" required maxLength={254}/></Field><Field label="Palavra-passe"><input name="password" type="password" autoComplete="current-password" required/></Field><div className="platform-actions"><button className="platform-primary" type="submit">{busy ? "Aguarde…" : "Entrar"}</button><button type="button" onClick={reset}>Recuperar acesso</button></div></fieldset></form></section> : !data.account ? <section className="platform-card"><h2>{error ? "Não foi possível abrir a sua área" : "Acesso pendente"}</h2><p>{error ? "Volte a tentar. Se o problema continuar, contacte a coordenação para verificar a conta e a configuração do serviço." : "A associação precisa de confirmar o seu perfil e permissões. Contacte a coordenação."}</p><button disabled={busy} onClick={() => action(async () => setData(await request(user)), "Acesso atualizado.")}>Voltar a verificar</button></section> : <>
        {tab === "overview" && educational && <>
          <div className="platform-metrics"><button onClick={() => { setSessionFilter("upcoming"); navigate("sessions"); }}><span>Próximas sessões</span><strong>{upcoming.length}</strong><small>Consultar agenda →</small></button><button onClick={() => navigate("profiles")}><span>{manager ? "Alunos ativos" : "Perfis associados"}</span><strong>{manager ? students.filter((p) => p.active).length : data.profiles.length}</strong><small>{manager ? "Gerir pessoas" : "Ver os meus perfis"} →</small></button><button onClick={() => { setSessionFilter("past"); navigate("sessions"); }}><span>Presenças confirmadas</span><strong>{data.attendance.filter((record) => record.status === "present").length}</strong><small>Consultar histórico →</small></button></div>
          <section className="platform-card"><div className="platform-list-heading"><div><p className="platform-eyebrow">A sua agenda</p><h2>Próximas sessões</h2></div><button onClick={() => navigate("sessions")}>Ver sessões</button></div>{upcoming.length ? <ul className="platform-list">{upcoming.slice(0, 5).map((session) => <li key={session.id}><div><h3>{session.title}</h3><p>{dates.format(new Date(session.startsAt))} · {session.room || "Sala por definir"}</p><p>{profileName(session.tutorId)}</p></div><span className="platform-status is-active">Agendada</span></li>)}</ul> : <div className="platform-empty"><h3>A agenda está livre</h3><p>{manager ? "Comece por adicionar as pessoas e agendar a primeira sessão." : "As sessões aparecerão aqui assim que forem agendadas pela coordenação."}</p></div>}{manager && <div className="platform-actions"><button className="platform-primary" onClick={() => { navigate("sessions"); setEditingSession(null); setSessionEditorOpen(true); }}>Agendar sessão</button><button onClick={() => { navigate("profiles"); setEditing(null); setEditorKind("student"); setProfileEditorOpen(true); }}>Adicionar pessoa</button></div>}</section>
        </>}
        {tab === "overview" && !educational && <section className="platform-card"><div className="platform-list-heading"><div><p className="platform-eyebrow">A sua ligação à BaticAmigo</p><h2>O meu espaço</h2></div></div>{data.profiles.filter(profile => profile.kind === "member").map(profile => <div className="platform-summary" key={profile.id}><h3>{profile.name}</h3><p>Sócio {profile.memberNumber || "com número por atribuir"} · {{active:"Ativo",pending:"Pendente",suspended:"Suspenso",left:"Cessou"}[profile.membershipStatus] || "Situação por confirmar"}</p></div>)}<p>Consulte a informação partilhada consigo ou envie uma mensagem à associação.</p><div className="platform-actions"><button className="platform-primary" onClick={() => navigate("document")}>Os meus documentos</button><button onClick={() => navigate("message")}>Mensagens</button><button onClick={() => navigate("profiles")}>O meu perfil</button></div></section>}
        {recordKinds.includes(tab) && <Records key={tab} kind={tab} data={data} user={user} manager={manager} busy={busy} onSave={saveModule}/>}
        {tab === "progress" && <Progress data={data} manager={manager}/>}
        {tab === "reports" && manager && <Reports data={data}/>}
        {tab === "notifications" && <section className="platform-card"><h2>Avisos da sua área</h2><ul className="platform-list"><li><div><h3>{upcoming.length} sessões por realizar</h3><p>Consulte a agenda para confirmar os próximos horários.</p><button onClick={() => navigate("sessions")}>Abrir agenda</button></div></li><li><div><h3>{(data.records || []).filter(record => record.kind === "message" && record.authorUid !== user.uid).length} mensagens recebidas</h3><p>As mensagens partilhadas ficam disponíveis na sua área.</p><button onClick={() => navigate("message")}>Abrir mensagens</button></div></li><li><div><h3>{(data.records || []).filter(record => record.kind === "assignment" && record.dueAt && record.dueAt >= new Date().toISOString().slice(0,10)).length} trabalhos com prazo em curso</h3><button onClick={() => navigate("assignment")}>Consultar trabalhos</button></div></li></ul></section>}
        {tab === "profiles" && <div className="platform-grid"><section className="platform-card"><div className="platform-list-heading"><div><h2>{manager ? "Pessoas" : "Perfis associados"}</h2><p>{visibleProfiles.length} {visibleProfiles.length === 1 ? "registo" : "registos"}</p></div>{manager && <button className="platform-primary" onClick={() => { setEditing(null); setEditorKind("student"); setProfileEditorOpen(true); }}>Adicionar pessoa</button>}</div><div className="platform-toolbar"><label className="platform-filter">Tipo de perfil<select value={profileKind} onChange={(event) => setProfileKind(event.target.value)}><option value="all">Todos os perfis</option>{Object.entries(kindNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="platform-search"><span className="platform-sr">Pesquisar pessoas</span><input type="search" value={profileQuery} onChange={(event) => setProfileQuery(event.target.value)} placeholder="Pesquisar por nome, email ou tipo"/></label></div>{visibleProfiles.length ? <ul className="platform-list">{visibleProfiles.map((profile) => <li key={profile.id}><div><strong>{profile.name}</strong><p>{kindNames[profile.kind]} · <span className={`platform-status${profile.active ? " is-active" : ""}`}>{profile.active ? "Ativo" : "Inativo"}</span></p>{profile.email && <p>{profile.email}</p>}{profile.subjects && <p>Disciplinas: {profile.subjects}</p>}{profile.availability && <p>Disponibilidade: {profile.availability}</p>}{profile.schoolYear && <p>Ano escolar: {profile.schoolYear}</p>}{profile.kind === "member" && <><p>Sócio {profile.memberNumber || "sem número"} · {{active:"Ativo",pending:"Pendente",suspended:"Suspenso",left:"Cessou"}[profile.membershipStatus] || "Por preencher"}</p>{profile.membershipHistory?.length > 0 && <details><summary>Histórico associativo</summary><ul>{profile.membershipHistory.map((entry,index) => <li key={index}>{dates.format(new Date(entry.at))} · {{active:"Ativo",pending:"Pendente",suspended:"Suspenso",left:"Cessou"}[entry.status]}</li>)}</ul></details>}</>}{profile.kind === "student" && profile.guardianIds?.length > 0 && <p>Encarregados: {profile.guardianIds.map(profileName).join(", ")}</p>}</div>{manager && <button onClick={() => { setEditing(profile); setEditorKind(profile.kind); setProfileEditorOpen(true); }}>Editar <span className="platform-sr">{profile.name}</span></button>}</li>)}</ul> : <p>{profileQuery ? "Nenhuma pessoa corresponde à pesquisa." : "Ainda não existem perfis disponíveis."}</p>}</section>
          {manager && profileEditorOpen && <section className="platform-card platform-editor"><div className="platform-list-heading"><h2>{editing ? `Editar ${editing.name}` : "Adicionar pessoa"}</h2><button type="button" onClick={() => { setEditing(null); setProfileEditorOpen(false); }}>Fechar</button></div><form key={editing?.id || "new-profile"} onSubmit={saveProfile}><fieldset disabled={busy}><Field label="Tipo de perfil"><select name="kind" value={editorKind} onChange={(event) => setEditorKind(event.target.value)} aria-readonly={!!editing}>{Object.entries(kindNames).map(([key, label]) => <option key={key} value={key} disabled={!!editing && key !== editing.kind}>{label}</option>)}</select></Field><Field label="Nome"><input name="name" required maxLength={100} defaultValue={editing?.name}/></Field><Field label="Email (opcional)"><input name="email" type="email" maxLength={254} defaultValue={editing?.email}/></Field>{editorKind === "student" && <Choices label="Encarregados associados" name="guardianIds" options={guardians.filter((profile) => profile.active || editing?.guardianIds?.includes(profile.id))} initial={editing?.guardianIds || []}/>}{editorKind === "student" && <><Field label="Ano escolar"><input name="schoolYear" maxLength={200} placeholder="Ex.: 7.º ano" defaultValue={editing?.schoolYear}/></Field><Field label="Faixa etária"><select name="ageBand" defaultValue={editing?.ageBand || ""}><option value="">Por preencher</option>{["Até 5 anos", "6–9 anos", "10–12 anos", "13–15 anos", "16–17 anos", "18 ou mais anos"].map(band => <option key={band}>{band}</option>)}</select></Field></>}
          {editorKind === "tutor" && <><Field label="Disciplinas / competências"><input name="subjects" maxLength={200} defaultValue={editing?.subjects} placeholder="Ex.: Matemática, Português"/></Field><Field label="Disponibilidade"><textarea name="availability" maxLength={1000} rows={3} defaultValue={editing?.availability} placeholder="Ex.: Segundas e quartas, das 17h às 19h"/></Field></>}
          {editorKind === "member" && <><Field label="Número de sócio"><input name="memberNumber" maxLength={200} defaultValue={editing?.memberNumber}/></Field><Field label="Situação associativa"><select name="membershipStatus" defaultValue={editing?.membershipStatus || "active"}><option value="pending">Pendente</option><option value="active">Ativo</option><option value="suspended">Suspenso</option><option value="left">Cessou</option></select></Field></>}
          <label className="platform-check"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true}/>Perfil ativo</label><div className="platform-actions"><button className="platform-primary">Guardar perfil</button><button type="button" onClick={() => { setEditing(null); setProfileEditorOpen(false); }}>Cancelar</button></div></fieldset></form></section>}
        </div>}
        {tab === "sessions" && <div className="platform-grid"><section className="platform-card"><div className="platform-list-heading"><div><h2>Sessões e presenças</h2><p>{visibleSessions.length} {visibleSessions.length === 1 ? "sessão" : "sessões"} · Horário de Lisboa</p></div>{manager && <button className="platform-primary" onClick={() => { setEditingSession(null); setSessionEditorOpen(true); }}>Agendar sessão</button>}</div><div className="platform-toolbar">{students.length > 1 && <label className="platform-filter">Aluno<select value={sessionStudent} onChange={(event) => setSessionStudent(event.target.value)}><option value="">Todos os alunos</option>{students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>}<label className="platform-filter">Período<select value={sessionFilter} onChange={(event) => setSessionFilter(event.target.value)}><option value="upcoming">Próximas sessões</option><option value="past">Histórico</option><option value="cancelled">Canceladas</option><option value="all">Todas as sessões</option></select></label><label className="platform-search"><span className="platform-sr">Pesquisar sessões</span><input type="search" value={sessionQuery} onChange={(event) => setSessionQuery(event.target.value)} placeholder="Pesquisar disciplina, explicador ou sala"/></label></div>{visibleSessions.length ? <ul className="platform-list platform-sessions">{visibleSessions.map((session) => <li key={session.id}><article><h3>{session.title}</h3><p><time dateTime={session.startsAt}>{dates.format(new Date(session.startsAt))}</time> — <time dateTime={session.endsAt}>{dates.format(new Date(session.endsAt))}</time></p><p>{profileName(session.tutorId)} · {session.room || "Sala por definir"} · <span className={`platform-status${session.status === "scheduled" ? " is-active" : ""}`}>{sessionNames[session.status] || session.status}</span></p>{manager && <button onClick={() => { setEditingSession(session); setSessionEditorOpen(true); }}>Editar sessão</button>}<ul className="platform-attendance">{session.studentIds.map((studentId) => {
              const record = data.attendance.find((item) => item.sessionId === session.id && item.studentId === studentId);
              const canMark = session.status !== "cancelled" && (manager || roles.some((role) => ["tutor", "volunteer"].includes(role)) && (data.account.profileIds || [data.account.profileId]).includes(session.tutorId));
              return <li key={studentId}><span>{profileName(studentId)}</span>{canMark && new Date(session.startsAt) <= new Date() ? <select aria-label={`Presença de ${profileName(studentId)} na sessão ${session.title}`} disabled={busy} value={record?.status || ""} onChange={(event) => action(() => save({ action: "set-attendance", sessionId: session.id, studentId, status: event.target.value, version: record?.version || 0 }), "Presença guardada.")}><option value="" disabled>Por registar</option>{Object.entries(attendanceNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select> : <span>{attendanceNames[record?.status] || "Por registar"}</span>}</li>;
            })}</ul></article></li>)}</ul> : <div className="platform-empty"><h3>Nenhuma sessão encontrada</h3><p>{sessionQuery ? "Experimente pesquisar por outro nome, disciplina ou sala." : sessionFilter === "upcoming" ? "Ainda não há sessões agendadas para os próximos dias." : "Não existem sessões neste período."}</p><button onClick={() => { setSessionQuery(""); setSessionStudent(""); setSessionFilter("all"); }}>Ver todas as sessões</button></div>}</section>
          {manager && sessionEditorOpen && <section className="platform-card platform-editor"><div className="platform-list-heading"><h2>{editingSession ? `Editar sessão: ${editingSession.title}` : "Agendar sessão"}</h2><button type="button" onClick={() => { setEditingSession(null); setSessionEditorOpen(false); }}>Fechar</button></div><p>Preencha os dados da sessão. Todos os horários são de Lisboa.</p>{(!tutors.some((profile) => profile.active) || !students.some((profile) => profile.active)) && <p className="platform-error">Adicione primeiro pelo menos um aluno e um explicador ativos em Pessoas.</p>}<form key={editingSession?.id || "new-session"} onSubmit={saveSession}><fieldset disabled={busy}><Field label="Disciplina / título"><input name="title" required maxLength={120} defaultValue={editingSession?.title}/></Field><Field label="Explicador"><select name="tutorId" required defaultValue={editingSession?.tutorId || ""}><option value="" disabled>Selecionar explicador</option>{tutors.filter((profile) => profile.active || profile.id === editingSession?.tutorId).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></Field><Choices label="Alunos" name="studentIds" required options={students.filter((profile) => profile.active || editingSession?.studentIds.includes(profile.id))} initial={editingSession?.studentIds || []}/><Field label="Sala"><input name="room" required maxLength={80} defaultValue={editingSession?.room}/></Field><Field label="Início"><input name="startsAt" type="datetime-local" required defaultValue={editingSession ? lisbonDateTimeInput(editingSession.startsAt) : undefined}/></Field><Field label="Fim"><input name="endsAt" type="datetime-local" required defaultValue={editingSession ? lisbonDateTimeInput(editingSession.endsAt) : undefined}/></Field>{editingSession && <Field label="Estado"><select name="status" defaultValue={editingSession.status}><option value="scheduled">Agendada</option><option value="cancelled">Cancelada</option></select></Field>}<div className="platform-actions"><button className="platform-primary">Guardar sessão</button><button type="button" onClick={() => { setEditingSession(null); setSessionEditorOpen(false); }}>Cancelar</button></div></fieldset></form></section>}
        </div>}
        {tab === "access" && admin && <section className="platform-card platform-access"><h2>Perfis de acesso</h2><p>Associe uma conta existente a uma pessoa e defina o que pode consultar ou gerir.</p><p className="platform-hint">Crie ou consulte a conta na gestão de utilizadores da administração. Depois copie o identificador da conta para o campo abaixo.</p><a href="/admin/dashboard">Abrir gestão de utilizadores →</a><div className="platform-toolbar"><label className="platform-filter">Conta existente<select value={accessEditing?.id || ""} onChange={event => setAccessEditing((data.accounts || []).find(account => account.id === event.target.value) || null)}><option value="">Atribuir novo acesso</option>{(data.accounts || []).map(account => <option key={account.id} value={account.id}>{account.profileIds?.map(profileName).join(", ") || roleNames[account.role] || "Conta"} · {account.active ? "Ativa" : "Inativa"}</option>)}</select></label></div><form key={accessEditing?.id || "new-account"} onSubmit={saveAccount}><fieldset disabled={busy}><Field label="UID da conta"><input name="uid" required maxLength={128} defaultValue={accessEditing?.id}/></Field><fieldset><legend>Permissões (pode selecionar várias)</legend>{Object.entries(roleNames).map(([key, label]) => <label className="platform-check" key={key}><input name="roles" type="checkbox" value={key} defaultChecked={accessEditing?.roles?.includes(key) || accessEditing?.role === key}/>{label}</label>)}</fieldset><Choices label="Perfis associados" name="profileIds" initial={accessEditing?.profileIds || []} options={data.profiles.map((profile) => ({...profile, name: `${profile.name} · ${kindNames[profile.kind]}`}))}/><label className="platform-check"><input type="checkbox" name="active" defaultChecked={accessEditing?.active ?? true}/>Acesso ativo</label><button className="platform-primary">Guardar permissões</button></fieldset></form></section>}
      </>}
    <footer className="platform-footer"><span>Área reservada · Associação BaticAmigo</span><a href="/">Website da associação ↗</a></footer></main></div>
  </div>;
}
