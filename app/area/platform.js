"use client";

import { useEffect, useRef, useState } from "react";
import { browserSessionPersistence, onAuthStateChanged, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { platformAuth } from "../../lib/firebase-client";

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
function localDate(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

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
        room: String(form.get("room")).trim(), startsAt: new Date(String(form.get("startsAt"))).toISOString(), endsAt: new Date(String(form.get("endsAt"))).toISOString(),
      } });
      setEditingSession(null);
      element.reset();
    }, "Sessão guardada.");
  }

  function saveAccount(event) {
    event.preventDefault();
    const form = values(event);
    action(() => save({ action: "save-account", account: { uid: String(form.get("uid")).trim(), roles: selected(form, "roles"), profileIds: selected(form, "profileIds"), active: form.get("active") === "on" } }), "Permissões guardadas.");
  }

  return <div className="platform">
    <a className="platform-skip" href="#area-content">Saltar para o conteúdo</a>
    <header className="platform-header"><a href="/" className="platform-brand">BaticAmigo <span>Apoio escolar</span></a>{user && <button disabled={busy} onClick={() => action(async () => { revision.current += 1; setData(empty); await signOut(platformAuth()); }, "Sessão terminada.")}>Terminar sessão</button>}</header>
    <main id="area-content" className="platform-main">
      <div className="platform-title"><p className="platform-eyebrow">Mais perto. Mais juntos.</p><h1>Área de apoio escolar</h1><p>Alunos, famílias e explicadores, ligados em cada sessão.</p></div>
      <div ref={notice} tabIndex={-1} className="platform-notices">{error && <p className="platform-error" role="alert">{error}</p>}{message && <p className="platform-success" role="status">{message}</p>}</div>
      {!ready ? <p role="status">A carregar a sua área…</p> : !user ? <section className="platform-card platform-login" aria-labelledby="sign-in-title"><h2 id="sign-in-title">Iniciar sessão</h2><p>Use a conta disponibilizada pela associação.</p><form onSubmit={login}><fieldset disabled={busy}><Field label="Email"><input name="email" type="email" autoComplete="username" required maxLength={254}/></Field><Field label="Palavra-passe"><input name="password" type="password" autoComplete="current-password" required/></Field><div className="platform-actions"><button className="platform-primary" type="submit">{busy ? "Aguarde…" : "Entrar"}</button><button type="button" onClick={reset}>Recuperar acesso</button></div></fieldset></form></section> : !data.account ? <section className="platform-card"><h2>Acesso pendente</h2><p>A associação precisa de confirmar o seu perfil e permissões. Contacte a coordenação.</p><button disabled={busy} onClick={() => action(async () => setData(await request(user)), "Acesso atualizado.")}>Voltar a verificar</button></section> : <>
        <p className="platform-account">{user.email} · {roles.map((role) => roleNames[role] || role).join(", ")}</p>
        <nav className="platform-tabs" aria-label="Área de apoio escolar">{[["sessions", "Sessões e presenças"], ["profiles", manager ? "Pessoas" : "Os meus perfis"], ...(admin ? [["access", "Acessos"]] : [])].map(([key, label]) => <button key={key} aria-current={tab === key ? "page" : undefined} onClick={() => setTab(key)}>{label}</button>)}</nav>
        {tab === "profiles" && <div className="platform-grid"><section className="platform-card"><h2>{manager ? "Pessoas" : "Perfis associados"}</h2>{data.profiles.length ? <ul className="platform-list">{data.profiles.map((profile) => <li key={profile.id}><div><strong>{profile.name}</strong><p>{kindNames[profile.kind]} · {profile.active ? "Ativo" : "Inativo"}</p>{profile.kind === "student" && profile.guardianIds?.length > 0 && <p>Encarregados: {profile.guardianIds.map(profileName).join(", ")}</p>}</div>{manager && <button onClick={() => setEditing(profile)}>Editar <span className="platform-sr">{profile.name}</span></button>}</li>)}</ul> : <p>Ainda não existem perfis disponíveis.</p>}</section>
          {manager && <section className="platform-card"><h2>{editing ? "Editar perfil" : "Novo perfil"}</h2><form key={editing?.id || "new-profile"} onSubmit={saveProfile}><fieldset disabled={busy}><Field label="Tipo de perfil"><select name="kind" defaultValue={editing?.kind || "student"}>{Object.entries(kindNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field><Field label="Nome"><input name="name" required maxLength={100} defaultValue={editing?.name}/></Field><Field label="Email (opcional)"><input name="email" type="email" maxLength={254} defaultValue={editing?.email}/></Field><Field label="Encarregados associados (apenas aluno)"><select name="guardianIds" multiple size={Math.min(5, Math.max(2, guardians.length))} defaultValue={editing?.guardianIds || []}>{guardians.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></Field><label className="platform-check"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true}/>Perfil ativo</label><div className="platform-actions"><button className="platform-primary">Guardar perfil</button>{editing && <button type="button" onClick={() => setEditing(null)}>Cancelar edição</button>}</div></fieldset></form></section>}
        </div>}
        {tab === "sessions" && <div className="platform-grid"><section className="platform-card"><h2>Sessões e presenças</h2><p>Horários apresentados no fuso de Lisboa.</p>{data.sessions.length ? <ul className="platform-list platform-sessions">{[...data.sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).map((session) => <li key={session.id}><article><h3>{session.title}</h3><p><time dateTime={session.startsAt}>{dates.format(new Date(session.startsAt))}</time> — <time dateTime={session.endsAt}>{dates.format(new Date(session.endsAt))}</time></p><p>{profileName(session.tutorId)} · {session.room || "Sala por definir"} · {sessionNames[session.status] || session.status}</p>{manager && <button onClick={() => setEditingSession(session)}>Alterar sessão</button>}<ul className="platform-attendance">{session.studentIds.map((studentId) => {
              const record = data.attendance.find((item) => item.sessionId === session.id && item.studentId === studentId);
              const canMark = session.status !== "cancelled" && (manager || roles.some((role) => ["tutor", "volunteer"].includes(role)) && (data.account.profileIds || [data.account.profileId]).includes(session.tutorId));
              return <li key={studentId}><span>{profileName(studentId)}</span>{canMark && new Date(session.startsAt) <= new Date() ? <select aria-label={`Presença de ${profileName(studentId)} na sessão ${session.title}`} disabled={busy} value={record?.status || ""} onChange={(event) => action(() => save({ action: "set-attendance", sessionId: session.id, studentId, status: event.target.value, version: record?.version || 0 }), "Presença guardada.")}><option value="" disabled>Por registar</option>{Object.entries(attendanceNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select> : <span>{attendanceNames[record?.status] || "Por registar"}</span>}</li>;
            })}</ul></article></li>)}</ul> : <p>Ainda não existem sessões disponíveis.</p>}</section>
          {manager && <section className="platform-card"><h2>{editingSession ? "Alterar sessão" : "Agendar sessão"}</h2><p>Introduza as horas no fuso do seu dispositivo ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p><form key={editingSession?.id || "new-session"} onSubmit={saveSession}><fieldset disabled={busy}><Field label="Disciplina / título"><input name="title" required maxLength={120} defaultValue={editingSession?.title}/></Field><Field label="Explicador"><select name="tutorId" required defaultValue={editingSession?.tutorId || ""}><option value="" disabled>Selecionar explicador</option>{tutors.filter((profile) => profile.active || profile.id === editingSession?.tutorId).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></Field><Field label="Alunos (seleção múltipla)"><select name="studentIds" multiple required size={Math.min(6, Math.max(3, students.length))} defaultValue={editingSession?.studentIds || []}>{students.filter((profile) => profile.active || editingSession?.studentIds.includes(profile.id)).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></Field><Field label="Sala"><input name="room" required maxLength={80} defaultValue={editingSession?.room}/></Field><Field label="Início"><input name="startsAt" type="datetime-local" required defaultValue={editingSession ? localDate(editingSession.startsAt) : undefined}/></Field><Field label="Fim"><input name="endsAt" type="datetime-local" required defaultValue={editingSession ? localDate(editingSession.endsAt) : undefined}/></Field>{editingSession && <Field label="Estado"><select name="status" defaultValue={editingSession.status}><option value="scheduled">Agendada</option><option value="cancelled">Cancelada</option></select></Field>}<div className="platform-actions"><button className="platform-primary">Guardar sessão</button>{editingSession && <button type="button" onClick={() => setEditingSession(null)}>Cancelar edição</button>}</div></fieldset></form></section>}
        </div>}
        {tab === "access" && admin && <section className="platform-card platform-access"><h2>Perfis de acesso</h2><p>A conta deve existir no Firebase Authentication. Atribua apenas os perfis necessários. O UID liga a conta aos perfis da pessoa.</p><form onSubmit={saveAccount}><fieldset disabled={busy}><Field label="UID da conta"><input name="uid" required maxLength={128}/></Field><fieldset><legend>Permissões (pode selecionar várias)</legend>{Object.entries(roleNames).map(([key, label]) => <label className="platform-check" key={key}><input name="roles" type="checkbox" value={key}/>{label}</label>)}</fieldset><Field label="Perfis associados (pode selecionar vários)"><select name="profileIds" multiple size={Math.min(8, Math.max(3, data.profiles.length))}>{data.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} · {kindNames[profile.kind]}</option>)}</select></Field><label className="platform-check"><input type="checkbox" name="active" defaultChecked/>Acesso ativo</label><button className="platform-primary">Guardar permissões</button></fieldset></form></section>}
      </>}
    </main><footer className="platform-footer"><a href="/">Voltar ao website</a><span>Associação BaticAmigo</span></footer>
  </div>;
}
