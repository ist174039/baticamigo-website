"use client";

import { useEffect, useRef, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import { browserSessionPersistence, onAuthStateChanged, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { platformAuth } from "../../lib/firebase-client";
import { lisbonDateTimeInput, lisbonDateTimeToIso } from "../../lib/platform/time.mjs";

const roleNames = { admin: "Administração", coordinator: "Coordenação", student: "Aluno", guardian: "Encarregado", tutor: "Explicador", volunteer: "Voluntário", member: "Sócio" };
const kindNames = { student: "Aluno", guardian: "Encarregado", tutor: "Explicador" };
const attendanceNames = { present: "Presente", absent: "Falta", excused: "Falta justificada" };
const sessionNames = { scheduled: "Agendada", cancelled: "Cancelada" };
const empty = { profiles: [], sessions: [], attendance: [] };
const dates = new Intl.DateTimeFormat("pt-PT", { timeZone: "Europe/Lisbon", dateStyle: "medium", timeStyle: "short" });

function Field({ label, children }) {
  return <label className="platform-field"><span>{label}</span>{children}</label>;
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
  const [tab, setTab] = useState("sessions");
  const [editing, setEditing] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [profileQuery, setProfileQuery] = useState("");
  const [sessionQuery, setSessionQuery] = useState("");
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [sessionEditorOpen, setSessionEditorOpen] = useState(false);
  const revision = useRef(0);
  const notice = useRef(null);
  const roles = data.account?.roles || (data.account?.role ? [data.account.role] : []);
  const manager = roles.some((role) => ["admin", "coordinator"].includes(role));
  const admin = roles.includes("admin");
  const students = data.profiles.filter((profile) => profile.kind === "student");
  const tutors = data.profiles.filter((profile) => profile.kind === "tutor");
  const guardians = data.profiles.filter((profile) => profile.kind === "guardian");
  const profileName = (id) => data.profiles.find((profile) => profile.id === id)?.name || "Perfil indisponível";

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
        guardianIds: selected(form, "guardianIds"), active: form.get("active") === "on",
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

  const visibleProfiles = data.profiles.filter((profile) => `${profile.name} ${profile.email || ""} ${kindNames[profile.kind]}`.toLocaleLowerCase("pt-PT").includes(profileQuery.toLocaleLowerCase("pt-PT")));
  const visibleSessions = [...data.sessions].filter((session) => `${session.title} ${profileName(session.tutorId)} ${session.room || ""} ${sessionNames[session.status] || session.status}`.toLocaleLowerCase("pt-PT").includes(sessionQuery.toLocaleLowerCase("pt-PT"))).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return <div className="platform">
    <SiteHeader variant="area" />
    <main id="conteudo" className="platform-main">
      <div className="platform-title"><p className="platform-eyebrow">Mais perto. Mais juntos.</p><h1>Área de apoio escolar</h1><p>Alunos, famílias e explicadores, ligados em cada sessão.</p></div>
      {user && <div className="platform-userbar"><span>{user.email} · {roles.map((role) => roleNames[role] || role).join(", ")}</span><button disabled={busy} onClick={() => action(async () => { revision.current += 1; setData(empty); await signOut(platformAuth()); }, "Sessão terminada.")}>Terminar sessão</button></div>}
      <div ref={notice} tabIndex={-1} className="platform-notices">{error && <p className="platform-error" role="alert">{error}</p>}{message && <p className="platform-success" role="status">{message}</p>}</div>
      {!ready ? <p role="status">A carregar a sua área…</p> : !user ? <section className="platform-card platform-login" aria-labelledby="sign-in-title"><h2 id="sign-in-title">Iniciar sessão</h2><p>Use a conta disponibilizada pela associação.</p><form onSubmit={login}><fieldset disabled={busy}><Field label="Email"><input name="email" type="email" autoComplete="username" required maxLength={254}/></Field><Field label="Palavra-passe"><input name="password" type="password" autoComplete="current-password" required/></Field><div className="platform-actions"><button className="platform-primary" type="submit">{busy ? "Aguarde…" : "Entrar"}</button><button type="button" onClick={reset}>Recuperar acesso</button></div></fieldset></form></section> : !data.account ? <section className="platform-card"><h2>Acesso pendente</h2><p>A associação precisa de confirmar o seu perfil e permissões. Contacte a coordenação.</p><button disabled={busy} onClick={() => action(async () => setData(await request(user)), "Acesso atualizado.")}>Voltar a verificar</button></section> : <>
        <nav className="platform-tabs" aria-label="Área de apoio escolar">{[["sessions", "Sessões e presenças"], ["profiles", manager ? "Pessoas" : "Os meus perfis"], ...(admin ? [["access", "Acessos"]] : [])].map(([key, label]) => <button key={key} aria-current={tab === key ? "page" : undefined} onClick={() => setTab(key)}>{label}</button>)}</nav>
        {tab === "profiles" && <div className="platform-grid"><section className="platform-card"><div className="platform-list-heading"><div><h2>{manager ? "Pessoas" : "Perfis associados"}</h2><p>{visibleProfiles.length} {visibleProfiles.length === 1 ? "registo" : "registos"}</p></div>{manager && <button className="platform-primary" onClick={() => { setEditing(null); setProfileEditorOpen(true); }}>Adicionar pessoa</button>}</div><div className="platform-toolbar"><label className="platform-search"><span className="platform-sr">Pesquisar pessoas</span><input type="search" value={profileQuery} onChange={(event) => setProfileQuery(event.target.value)} placeholder="Pesquisar por nome, email ou tipo"/></label></div>{visibleProfiles.length ? <ul className="platform-list">{visibleProfiles.map((profile) => <li key={profile.id}><div><strong>{profile.name}</strong><p>{kindNames[profile.kind]} · <span className={`platform-status${profile.active ? " is-active" : ""}`}>{profile.active ? "Ativo" : "Inativo"}</span></p>{profile.email && <p>{profile.email}</p>}{profile.kind === "student" && profile.guardianIds?.length > 0 && <p>Encarregados: {profile.guardianIds.map(profileName).join(", ")}</p>}</div>{manager && <button onClick={() => { setEditing(profile); setProfileEditorOpen(true); }}>Editar <span className="platform-sr">{profile.name}</span></button>}</li>)}</ul> : <p>{profileQuery ? "Nenhuma pessoa corresponde à pesquisa." : "Ainda não existem perfis disponíveis."}</p>}</section>
          {manager && profileEditorOpen && <section className="platform-card platform-editor"><div className="platform-list-heading"><h2>{editing ? `Editar ${editing.name}` : "Adicionar pessoa"}</h2><button type="button" onClick={() => { setEditing(null); setProfileEditorOpen(false); }}>Fechar</button></div><form key={editing?.id || "new-profile"} onSubmit={saveProfile}><fieldset disabled={busy}><Field label="Tipo de perfil"><select name="kind" defaultValue={editing?.kind || "student"}>{Object.entries(kindNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Nome"><input name="name" required maxLength={100} defaultValue={editing?.name}/></Field><Field label="Email (opcional)"><input name="email" type="email" maxLength={254} defaultValue={editing?.email}/></Field><Field label="Encarregados associados (apenas aluno)"><span className="platform-hint">Use Ctrl (Windows) ou Command (Mac) para selecionar vários.</span><select name="guardianIds" multiple size={Math.min(5, Math.max(2, guardians.length))} defaultValue={editing?.guardianIds || []}>{guardians.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></Field><label className="platform-check"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true}/>Perfil ativo</label><div className="platform-actions"><button className="platform-primary">Guardar perfil</button><button type="button" onClick={() => { setEditing(null); setProfileEditorOpen(false); }}>Cancelar</button></div></fieldset></form></section>}
        </div>}
        {tab === "sessions" && <div className="platform-grid"><section className="platform-card"><div className="platform-list-heading"><div><h2>Sessões e presenças</h2><p>{visibleSessions.length} {visibleSessions.length === 1 ? "sessão" : "sessões"} · Horário de Lisboa</p></div>{manager && <button className="platform-primary" onClick={() => { setEditingSession(null); setSessionEditorOpen(true); }}>Agendar sessão</button>}</div><div className="platform-toolbar"><label className="platform-search"><span className="platform-sr">Pesquisar sessões</span><input type="search" value={sessionQuery} onChange={(event) => setSessionQuery(event.target.value)} placeholder="Pesquisar disciplina, explicador ou sala"/></label></div>{visibleSessions.length ? <ul className="platform-list platform-sessions">{visibleSessions.map((session) => <li key={session.id}><article><h3>{session.title}</h3><p><time dateTime={session.startsAt}>{dates.format(new Date(session.startsAt))}</time> — <time dateTime={session.endsAt}>{dates.format(new Date(session.endsAt))}</time></p><p>{profileName(session.tutorId)} · {session.room || "Sala por definir"} · <span className={`platform-status${session.status === "scheduled" ? " is-active" : ""}`}>{sessionNames[session.status] || session.status}</span></p>{manager && <button onClick={() => { setEditingSession(session); setSessionEditorOpen(true); }}>Editar sessão</button>}<ul className="platform-attendance">{session.studentIds.map((studentId) => {
              const record = data.attendance.find((item) => item.sessionId === session.id && item.studentId === studentId);
              const canMark = session.status !== "cancelled" && (manager || roles.some((role) => ["tutor", "volunteer"].includes(role)) && (data.account.profileIds || [data.account.profileId]).includes(session.tutorId));
              return <li key={studentId}><span>{profileName(studentId)}</span>{canMark && new Date(session.startsAt) <= new Date() ? <select aria-label={`Presença de ${profileName(studentId)} na sessão ${session.title}`} disabled={busy} value={record?.status || ""} onChange={(event) => action(() => save({ action: "set-attendance", sessionId: session.id, studentId, status: event.target.value, version: record?.version || 0 }), "Presença guardada.")}><option value="" disabled>Por registar</option>{Object.entries(attendanceNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select> : <span>{attendanceNames[record?.status] || "Por registar"}</span>}</li>;
            })}</ul></article></li>)}</ul> : <p>Ainda não existem sessões disponíveis.</p>}</section>
          {manager && sessionEditorOpen && <section className="platform-card platform-editor"><div className="platform-list-heading"><h2>{editingSession ? `Editar sessão: ${editingSession.title}` : "Agendar sessão"}</h2><button type="button" onClick={() => { setEditingSession(null); setSessionEditorOpen(false); }}>Fechar</button></div><p>As horas são interpretadas no fuso Europe/Lisbon, independentemente da configuração do dispositivo.</p><form key={editingSession?.id || "new-session"} onSubmit={saveSession}><fieldset disabled={busy}><Field label="Disciplina / título"><input name="title" required maxLength={120} defaultValue={editingSession?.title}/></Field><Field label="Explicador"><select name="tutorId" required defaultValue={editingSession?.tutorId || ""}><option value="" disabled>Selecionar explicador</option>{tutors.filter((profile) => profile.active || profile.id === editingSession?.tutorId).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></Field><Field label="Alunos (seleção múltipla)"><span className="platform-hint">Use Ctrl (Windows) ou Command (Mac) para selecionar vários.</span><select name="studentIds" multiple required size={Math.min(6, Math.max(3, students.length))} defaultValue={editingSession?.studentIds || []}>{students.filter((profile) => profile.active || editingSession?.studentIds.includes(profile.id)).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></Field><Field label="Sala"><input name="room" required maxLength={80} defaultValue={editingSession?.room}/></Field><Field label="Início"><input name="startsAt" type="datetime-local" required defaultValue={editingSession ? lisbonDateTimeInput(editingSession.startsAt) : undefined}/></Field><Field label="Fim"><input name="endsAt" type="datetime-local" required defaultValue={editingSession ? lisbonDateTimeInput(editingSession.endsAt) : undefined}/></Field>{editingSession && <Field label="Estado"><select name="status" defaultValue={editingSession.status}><option value="scheduled">Agendada</option><option value="cancelled">Cancelada</option></select></Field>}<div className="platform-actions"><button className="platform-primary">Guardar sessão</button><button type="button" onClick={() => { setEditingSession(null); setSessionEditorOpen(false); }}>Cancelar</button></div></fieldset></form></section>}
        </div>}
        {tab === "access" && admin && <section className="platform-card platform-access"><h2>Perfis de acesso</h2><p>A conta deve existir no Firebase Authentication. Atribua apenas os perfis necessários. O UID liga a conta aos perfis da pessoa.</p><form onSubmit={saveAccount}><fieldset disabled={busy}><Field label="UID da conta"><input name="uid" required maxLength={128}/></Field><fieldset><legend>Permissões (pode selecionar várias)</legend>{Object.entries(roleNames).map(([key, label]) => <label className="platform-check" key={key}><input name="roles" type="checkbox" value={key}/>{label}</label>)}</fieldset><Field label="Perfis associados (pode selecionar vários)"><select name="profileIds" multiple size={Math.min(8, Math.max(3, data.profiles.length))}>{data.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} · {kindNames[profile.kind]}</option>)}</select></Field><label className="platform-check"><input type="checkbox" name="active" defaultChecked/>Acesso ativo</label><button className="platform-primary">Guardar permissões</button></fieldset></form></section>}
      </>}
    </main><footer className="platform-footer"><span>Área reservada · Associação BaticAmigo</span></footer>
  </div>;
}
