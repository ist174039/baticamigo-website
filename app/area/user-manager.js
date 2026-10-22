"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { NativeSelect } from "@/app/components/ui/native-select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Dialog } from "@/app/components/ui/dialog";
import { Sheet } from "@/app/components/ui/sheet";
import { Eye, MoreHorizontal } from "lucide-react";
import { ChevronLeft, ChevronRight, ListFilter } from "lucide-react";
import { platformAuth } from "../../lib/firebase-client";
import {areaGroups,areaModules,defaultAccessProfiles,defaultAreasForRoles} from "../../lib/platform/access.mjs";
import {printReport} from "../../lib/platform/print-report.mjs";

const roleLabels = { admin: "Administrador", coordinator: "Coordenação", student: "Aluno", guardian: "Pai / encarregado", tutor: "Explicador", volunteer: "Voluntário", member: "Sócio" };
const profileLabels = { student: "Aluno", guardian: "Encarregado", tutor: "Explicador", member: "Sócio" };
const membershipLabels = { active: "Sócio ativo", pending: "Sócio pendente", suspended: "Sócio suspenso", left: "Ex-sócio" };
const moduleLabels={overview:"Visão geral",sessions:"Sessões e presenças",profiles:"Pessoas e perfis",assignment:"Trabalhos",material:"Materiais",assessment:"Avaliações",progress:"Evolução",justification:"Justificações",finance:"Quotas e doações",document:"Documentos",message:"Mensagens",notifications:"Avisos",reports:"Relatórios"};
const blankForm = () => ({ displayName: "", email: "", roles: [], profileIds: [], active: true, profileKind: "student", createProfile: false });
const date = (value) => value ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(new Date(value)) : "Nunca";

function RoleOptions({ value, onChange }) {
  return <fieldset className="user-manager-role-options"><legend>Perfis de acesso</legend><p className="platform-hint">Escolha um ou mais perfis. Os menus são atribuídos automaticamente a partir da configuração da associação.</p>{Object.entries(roleLabels).map(([role, label]) => <label className="platform-check" key={role}><Checkbox checked={value.includes(role)} onChange={(event) => onChange(event.target.checked ? [...value, role] : value.filter((current) => current !== role))} />{label}</label>)}</fieldset>;
}

function AccessPreview({roles,accessProfiles}) {
  const allowed=new Set(defaultAreasForRoles(roles,accessProfiles));
  return <section className="user-manager-module-options" aria-label="Menus herdados dos perfis"><h3>Menus atribuídos automaticamente</h3>{roles.length?areaGroups.map(group=>({...group,modules:group.modules.filter(module=>allowed.has(module))})).filter(group=>group.modules.length>0).map(group=><section className="user-manager-module-group" key={group.label}><h4>{group.label}</h4><div>{group.modules.map(module=><Badge variant="secondary" key={module}>{moduleLabels[module]}</Badge>)}</div></section>):<p>Escolha um perfil para ver os menus herdados.</p>}<p className="platform-hint">Os dados e as ações continuam sujeitos às regras de acesso de cada perfil.</p></section>;
}

function AccessProfileOptions({value,onChange}) {
  return <div className="user-manager-access-profile-options">{Object.entries(roleLabels).map(([role,label])=>{const modules=value[role]||[];return <details key={role} className="user-manager-access-profile"><summary><strong>{label}</strong><span>{role==='admin'?"Acesso completo":`${modules.length} de ${areaModules.length} menus`}</span></summary>{role==='admin'?<p className="platform-hint">Acesso completo aos menus, reservado a administradores.</p>:<div>{areaGroups.map(group=><section key={group.label}><h4>{group.label}</h4>{group.modules.map(module=><label className="platform-check" key={module}><Checkbox checked={modules.includes(module)} disabled={module==='overview'} onChange={event=>onChange(role,module,event.target.checked)}/>{moduleLabels[module]}{module==='overview'&&<small>Sempre incluída</small>}</label>)}</section>)}</div>}</details>})}</div>;
}

export default function AreaUserManager({view="users"}={}) {
  const [users, setUsers] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [dialogUser, setDialogUser] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [accessProfiles,setAccessProfiles]=useState(defaultAccessProfiles);
  const [accessProfilesDraft,setAccessProfilesDraft]=useState(defaultAccessProfiles);
  const [accessSettingsOpen,setAccessSettingsOpen]=useState(false);
  const [associationTarget,setAssociationTarget]=useState(null);
  const [associationRoles,setAssociationRoles]=useState([]);
  const [associationProfileIds,setAssociationProfileIds]=useState([]);
  const [recordManageTarget,setRecordManageTarget]=useState(null);
  const [recordDependencyReasons,setRecordDependencyReasons]=useState([]);
  const [recordDependencyChecked,setRecordDependencyChecked]=useState(false);
  const [recordDependencyLoading,setRecordDependencyLoading]=useState(false);
  const [recordDeleteConfirm,setRecordDeleteConfirm]=useState(false);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({});
  const [confirmUser, setConfirmUser] = useState(null);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [invite, setInvite] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const passwordInput = useRef(null);
  const [detailUser, setDetailUser] = useState(null);
  const [removeUserTarget, setRemoveUserTarget] = useState(null);

  const request = useCallback(async (path = "", options = {}, endpoint = "/api/platform/users") => {
    const currentUser = platformAuth().currentUser;
    if (!currentUser) throw new Error("A sessão terminou. Inicie sessão novamente.");
    const token = await currentUser.getIdToken();
    const response = await fetch(`${endpoint}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Não foi possível concluir a operação.");
    return result;
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await request();
      setUsers(result.users || []);
      setAllProfiles(result.profiles || []);
      setAccessProfiles(result.accessProfiles || defaultAccessProfiles);
      setError("");
    } catch (failure) { setError(failure.message); }
    finally { setLoading(false); }
  }, [request]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { setPage(1); }, [query, statusFilter, roleFilter, profileFilter]);

  const linkedProfileIds = useMemo(() => new Set(users.flatMap((user) => user.profileIds || [])), [users]);
  const assignableProfiles=allProfiles.filter(profile=>form.roles.includes(profile.kind)||(profile.kind==="tutor"&&form.roles.includes("volunteer")));
  const unlinked = allProfiles.filter((profile) => !linkedProfileIds.has(profile.id));
  const matchingUsers = users.filter((user) => {
    const search = `${user.displayName} ${user.email} ${(user.roles || []).map((role) => roleLabels[role]).join(" ")} ${(user.profiles || []).map((profile) => profile.name).join(" ")}`.toLocaleLowerCase("pt-PT");
    return search.includes(query.toLocaleLowerCase("pt-PT"))
      && (statusFilter === "all" || (statusFilter === "suspended" ? user.suspended : statusFilter === "active" ? user.accessActive && !user.suspended : !user.accessActive && !user.suspended))
      && (roleFilter === "all" || (user.roles || []).includes(roleFilter))
      && (profileFilter === "all" || (user.profiles || []).some((profile) => profile.kind === profileFilter));
  });
  const matchingProfiles = unlinked.filter((profile) => `${profile.name} ${profile.email || ""} ${profileLabels[profile.kind] || ""}`.toLocaleLowerCase("pt-PT").includes(query.toLocaleLowerCase("pt-PT")) && (statusFilter === "all" || statusFilter === "no-access") && (roleFilter === "all" || roleFilter === profile.kind) && (profileFilter === "all" || profileFilter === profile.kind));
  const allRows = [...matchingUsers.map((user) => ({ type: "user", value: user })), ...matchingProfiles.map((profile) => ({ type: "profile", value: profile }))];
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(allRows.length / pageSize));
  const currentRows = allRows.slice((page - 1) * pageSize, page * pageSize);
  const filteredUsers = currentRows.filter((row) => row.type === "user").map((row) => row.value);
  const filteredProfiles = currentRows.filter((row) => row.type === "profile").map((row) => row.value);
  const studentProfiles = allProfiles.filter((profile) => profile.kind === "student");
  function exportStudents() {
    printReport({ title: "Lista de alunos", subtitle: `${studentProfiles.length} alunos`, columns: ["Nome", "Ano escolar", "Faixa etária", "Estado"], rows: studentProfiles.map((profile) => [profile.name, profile.schoolYear || "—", profile.ageBand || "—", profile.active ? "Ativo" : "Inativo"]) });
  }
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  function openCreate(profile = null) {
    const initial = blankForm();
    if (profile) {
      initial.displayName = profile.name;
      initial.email = profile.email || "";
      initial.profileIds = [profile.id];
      initial.roles = [profile.kind];
    }
    setForm(initial);
    setDialogUser(null);
    setUserDialogOpen(true);
  }

  function openEdit(user) {
    setDialogUser(user);
    setForm({ displayName: user.displayName || "", email: user.email || "", roles: user.roles || [], profileIds: user.profileIds || [], active: user.accessActive || !(user.roles || []).length, profileKind: "student", createProfile: false });
    setUserDialogOpen(true);
  }

  function openProfile(profile) {
    setEditingProfile(profile);
    setProfileForm({ kind: profile.kind, name: profile.name || "", email: profile.email || "", active: profile.active === true, guardianIds: profile.guardianIds || [], memberNumber: profile.memberNumber || "", membershipStatus: profile.membershipStatus || "active", subjects: profile.subjects || "", availability: profile.availability || "", schoolYear: profile.schoolYear || "", ageBand: profile.ageBand || "" });
    setProfileEditorOpen(true);
  }

  function openNewRecord() {
    setEditingProfile(null);
    setProfileForm({kind:"student",name:"",email:"",active:true,guardianIds:[],memberNumber:"",membershipStatus:"active",subjects:"",availability:"",schoolYear:"",ageBand:""});
    setProfileEditorOpen(true);
  }

  function toggleProfile(profileId, checked) {
    setForm((current) => ({ ...current, profileIds: checked ? [...current.profileIds, profileId] : current.profileIds.filter((id) => id !== profileId) }));
  }

  function changeAssignedRoles(roles) {
    const allowedProfiles=allProfiles.filter(profile=>roles.includes(profile.kind)||(profile.kind==="tutor"&&roles.includes("volunteer")));
    const allowedIds=new Set(allowedProfiles.map(profile=>profile.id));
    const personRoles=roles.filter(role=>Object.hasOwn(profileLabels,role));
    setForm(current=>({...current,roles,profileIds:current.profileIds.filter(id=>allowedIds.has(id)),profileKind:current.createProfile&&personRoles.length===1?personRoles[0]:current.profileKind}));
  }

  function toggleCreateProfile(enabled) {
    setForm(current=>{
      const personRoles=current.roles.filter(role=>Object.hasOwn(profileLabels,role));
      const kind=personRoles.length===1?personRoles[0]:current.profileKind;
      const roles=enabled&&!current.roles.includes(kind)?[...current.roles,kind]:current.roles;
      return {...current,createProfile:enabled,profileKind:kind,roles};
    });
  }

  async function submit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const profileIds = form.profileIds;
    const body = dialogUser ? {
      action: "update-access", uid: dialogUser.uid, roles: form.roles, profileIds, active: form.active,
    } : {
      email: String(formData.get("email") || "").trim(), displayName: String(formData.get("displayName") || "").trim(), roles: form.roles, profileIds,
      ...(form.createProfile ? { profile: { kind: form.profileKind, name: String(formData.get("displayName") || "").trim(), email: String(formData.get("email") || "").trim(), active: true, guardianIds: [], membershipStatus: "active" } } : {}),
    };
    setBusy(true); setError(""); setMessage("");
    try {
      if (dialogUser) await request("", { method: "PATCH", body: JSON.stringify(body) });
      else {
        const result = await request("", { method: "POST", body: JSON.stringify({ ...body, delivery: temporaryPassword ? "temporary" : "invite" }) });
        if (result.resetLink) setInvite({ email: result.user.email, link: result.resetLink, title: "Convite para definir palavra-passe" });
        if (result.temporaryPassword) setCreatedCredentials({ email: result.user.email, password: result.temporaryPassword });
      }
      setMessage(dialogUser ? "Permissões atualizadas." : temporaryPassword ? "Conta criada com palavra-passe temporária." : "Conta criada. Envie a ligação de convite ao utilizador.");
      setDialogUser(null);
      setUserDialogOpen(false);
      await reload();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  function openAccessSettings() { setAccessProfilesDraft(structuredClone(accessProfiles)); setAccessSettingsOpen(true); }
  function updateAccessProfile(role,module,enabled) { setAccessProfilesDraft(current=>({...current,[role]:enabled?[...new Set([...(current[role]||[]),module])]:current[role].filter(item=>item!==module)})); }
  async function saveAccessSettings() {
    setBusy(true);setError("");setMessage("");
    try { const result=await request("",{method:"PATCH",body:JSON.stringify({action:"update-access-profiles",accessProfiles:accessProfilesDraft})});setAccessProfiles(result.accessProfiles);setAccessSettingsOpen(false);setMessage("Perfis e menus atualizados. Os utilizadores recebem os menus dos perfis que lhes estão atribuídos.");await reload(); }
    catch(failure){setError(failure.message);}
    finally{setBusy(false);}
  }

  function openAssociations(user) {
    setAssociationTarget(user);
    setAssociationRoles(user.roles || []);
    setAssociationProfileIds(user.profileIds || []);
    setError("");
    setMessage("");
  }

  function toggleAssociationRole(role, enabled) {
    const next = enabled ? [...new Set([...associationRoles, role])] : associationRoles.filter(item => item !== role);
    const allowed = new Set(allProfiles.filter(profile => next.includes(profile.kind) || (profile.kind === "tutor" && next.includes("volunteer"))).map(profile => profile.id));
    setAssociationRoles(next);
    setAssociationProfileIds(ids => ids.filter(id => allowed.has(id)));
  }

  async function saveAssociations() {
    if (!associationTarget) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await request("", { method: "PATCH", body: JSON.stringify({ action: "update-access", uid: associationTarget.uid, roles: associationRoles, profileIds: associationProfileIds, active: associationTarget.accessActive }) });
      setAssociationTarget(null);
      setMessage("Tipo de utilizador e registos associados atualizados.");
      await reload();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function inspectRecord(profile) {
    setRecordManageTarget(profile);
    setRecordDependencyReasons([]);
    setRecordDependencyChecked(false);
    setRecordDeleteConfirm(false);
    setRecordDependencyLoading(true);
    setError("");
    try {
      const result = await request(`?profileId=${encodeURIComponent(profile.id)}`);
      setRecordDependencyReasons(result.dependencyReasons || []);
      setRecordDependencyChecked(true);
    } catch (failure) { setError(failure.message); }
    finally { setRecordDependencyLoading(false); }
  }

  async function setRecordActive(profile, active) {
    setBusy(true); setError(""); setMessage("");
    const value = { id: profile.id, kind: profile.kind, name: profile.name, email: profile.email || "", active, guardianIds: profile.guardianIds || [], subjects: profile.subjects || "", availability: profile.availability || "", schoolYear: profile.schoolYear || "", ageBand: profile.ageBand || "", memberNumber: profile.memberNumber || "", membershipStatus: profile.membershipStatus || "active" };
    try {
      await request("", { method: "POST", body: JSON.stringify({ action: "save-profile", profile: value }) }, "/api/platform");
      setRecordManageTarget({...profile, active});
      setMessage(active ? "Registo reativado." : "Registo suspenso.");
      await reload();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function deleteProfileRecord() {
    if (!recordManageTarget) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await request("", { method: "PATCH", body: JSON.stringify({ action: "delete-profile", profileId: recordManageTarget.id }) });
      setRecordManageTarget(null); setRecordDeleteConfirm(false);
      setMessage("Registo eliminado.");
      await reload();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function changeSuspension() {
    if (!confirmUser) return;
    const target = confirmUser;
    setBusy(true); setError("");
    try {
      await request("", { method: "PATCH", body: JSON.stringify({ action: target.suspended ? "restore" : "suspend", uid: target.uid }) });
      setConfirmUser(null);
      setMessage(target.suspended ? "Utilizador reativado." : "Acesso suspenso e sessões terminadas.");
      await reload();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function removeUser() {
    if (!removeUserTarget) return;
    const target = removeUserTarget;
    setBusy(true); setError("");
    try {
      const result = await request("", { method: "DELETE", body: JSON.stringify({ uid: target.uid }) });
      setRemoveUserTarget(null); setDetailUser(null);
      setMessage(result.authCleanupPending ? `O acesso de ${target.displayName || target.email} foi bloqueado e os perfis foram preservados; a remoção da conta de autenticação precisa de nova tentativa.` : `A conta de ${target.displayName || target.email} foi removida. Os perfis e respetivos registos foram preservados.`);
      await reload();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function resetPassword(user) {
    setBusy(true); setError("");
    try {
      const result = await request("", { method: "POST", body: JSON.stringify({ action: "reset-password", uid: user.uid }) });
      setInvite({ email: user.email, link: result.resetLink, title: "Ligação de recuperação" });
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function generateTemporaryPassword(user) {
    if (!user) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await request("", { method: "POST", body: JSON.stringify({ action: "generate-temporary-password", uid: user.uid }) });
      setPasswordTarget(null);
      setCreatedCredentials({ email: result.email || user.email, password: result.temporaryPassword, generated: true, sessionsRevoked: result.sessionsRevoked });
      setMessage(result.sessionsRevoked ? "Nova palavra-passe gerada. Copie-a e partilhe por um canal seguro." : "A palavra-passe foi alterada, mas não foi possível terminar todas as sessões abertas.");
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function saveProfile(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = { action: "save-profile", profile: { ...(editingProfile?.id ? {id:editingProfile.id} : {}), ...profileForm, kind: profileForm.kind || editingProfile?.kind, name: String(data.get("name") || "").trim(), email: String(data.get("email") || "").trim(), guardianIds: profileForm.guardianIds || [], active: profileForm.active } };
    setBusy(true); setError(""); setMessage("");
    try {
      await request("", { method: "POST", body: JSON.stringify(body) }, "/api/platform");
      setProfileEditorOpen(false); setEditingProfile(null); setMessage(editingProfile ? "Registo atualizado." : "Registo criado."); await reload();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  if(view==="permissions"||view==="records") return <div className="user-manager user-manager-access-page">
    <Card className="user-manager-card">
      {error&&<p className="platform-error" role="alert">{error}</p>}{message&&<p className="platform-success" role="status">{message}</p>}
      {view==="permissions"&&<>
        <header className="user-manager-heading"><div><p className="platform-eyebrow">Configuração da associação</p><h2>Perfis e permissões</h2><p>Defina os menus que cada perfil pode consultar. Os utilizadores recebem a combinação dos menus dos perfis que lhes atribuir.</p></div></header>
        <p className="platform-hint">As permissões sobre dados e ações continuam em vigor. O perfil Administrador mantém acesso completo.</p>
        <p className="user-manager-access-warning">Ao guardar, esta configuração passa a definir os menus de todos os utilizadores. As escolhas antigas feitas conta a conta deixam de se aplicar.</p>
        {loading?<p role="status">A carregar perfis e permissões…</p>:<AccessProfileOptions value={accessProfilesDraft} onChange={updateAccessProfile}/>}
        <div className="platform-actions"><Button className="platform-primary" disabled={busy||loading} onClick={saveAccessSettings}>{busy?"A guardar…":"Guardar configuração"}</Button><Button variant="outline" disabled={busy||loading} onClick={()=>setAccessProfilesDraft(structuredClone(accessProfiles))}>Descartar alterações</Button></div>
      </>}
      {view==="records"&&<section className="user-manager-record-associations" aria-labelledby="user-manager-record-associations-title">
        <div className="user-manager-heading"><div><p className="platform-eyebrow">Contas e pessoas</p><h2 id="user-manager-record-associations-title">Gestão de registos</h2><p>Crie e edite registos, defina o tipo de pessoa e associe cada registo à conta correspondente.</p></div><Button className="platform-primary" disabled={busy||loading} onClick={openNewRecord}>Novo registo</Button></div>
        {loading ? <p role="status">A carregar registos…</p> : allProfiles.length ? <div className="user-manager-association-list">{allProfiles.map(profile => {const account=users.find(user => (user.profileIds || []).includes(profile.id));return <article key={profile.id} className="user-manager-association-row"><div><strong>{profile.name}</strong><span>{profile.email || "Sem email de contacto"}</span></div><div className="user-manager-badges"><Badge variant="secondary">{profileLabels[profile.kind] || profile.kind}</Badge><Badge variant={profile.active ? "outline" : "destructive"}>{profile.active ? "Ativo" : "Suspenso"}</Badge></div><div className="user-manager-association-profiles">{account ? <><span>Conta associada</span><Badge variant="outline">{account.displayName || account.email}</Badge></> : <span>Sem conta associada</span>}</div><Button variant="outline" disabled={busy} onClick={() => inspectRecord(profile)}>Gerir registo</Button></article>;})}</div> : <p>Ainda não existem registos de pessoas. Crie um para começar.</p>}
        <div className="user-manager-heading"><div><p className="platform-eyebrow">Associação de contas</p><h3>Associe os registos</h3><p>Escolha os tipos de utilizador e ligue as contas aos registos correspondentes.</p></div></div>
        {loading ? <p role="status">A carregar contas…</p> : users.length ? <div className="user-manager-association-list">{users.map(user => <article key={user.uid} className="user-manager-association-row"><div><strong>{user.displayName || "Sem nome"}</strong><span>{user.email || "Sem email"}</span></div><div className="user-manager-badges">{user.roles?.length ? user.roles.map(role => <Badge key={role} variant="outline">{roleLabels[role] || role}</Badge>) : <span className="user-manager-secondary">Sem tipo atribuído</span>}</div><div className="user-manager-association-profiles">{user.profiles?.length ? user.profiles.map(profile => <Badge key={profile.id} variant="secondary">{profileLabels[profile.kind] || profile.kind} · {profile.name}</Badge>) : <span className="user-manager-secondary">Sem registos associados</span>}</div><Button variant="outline" disabled={busy || user.uid === platformAuth().currentUser?.uid} onClick={() => openAssociations(user)}>Gerir tipo e associações</Button></article>)}</div> : <p>Ainda não existem contas de utilizador.</p>}
      </section>}
      {view==="records"&&<>
      <Sheet open={!!associationTarget} onOpenChange={open => { if (!open && !busy) setAssociationTarget(null); }} ariaLabel="Gestão do tipo de utilizador e dos registos associados" className="platform-dialog platform-context-sheet user-manager-access-sheet"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">Gestão de registos</p><h2>{associationTarget?.displayName || associationTarget?.email || "Utilizador"}</h2></div><Button type="button" variant="outline" disabled={busy} onClick={() => setAssociationTarget(null)}>Fechar</Button></div><p>Escolha os tipos de utilizador desta conta. Depois associe os registos de pessoa que lhe pertencem.</p><fieldset className="user-manager-role-options"><legend>Tipo de utilizador</legend>{Object.entries(roleLabels).map(([role, label]) => <label className="platform-check" key={role}><Checkbox checked={associationRoles.includes(role)} onChange={event => toggleAssociationRole(role, event.target.checked)} />{label}</label>)}</fieldset><fieldset className="user-manager-role-options"><legend>Associe os registos</legend><p className="platform-hint">Só aparecem registos compatíveis com os tipos escolhidos. Um registo já associado a outra conta fica indisponível.</p>{allProfiles.filter(profile => associationRoles.includes(profile.kind) || (profile.kind === "tutor" && associationRoles.includes("volunteer"))).map(profile => { const assignedElsewhere = Boolean(profile.accountUid && profile.accountUid !== associationTarget?.uid); return <label className="platform-check" key={profile.id}><Checkbox checked={associationProfileIds.includes(profile.id)} disabled={assignedElsewhere} onChange={event => setAssociationProfileIds(current => event.target.checked ? [...new Set([...current, profile.id])] : current.filter(id => id !== profile.id))} />{profileLabels[profile.kind] || profile.kind} · {profile.name}{assignedElsewhere && <small>Associado a outra conta</small>}</label>; })}{!allProfiles.some(profile => associationRoles.includes(profile.kind) || (profile.kind === "tutor" && associationRoles.includes("volunteer"))) && <p className="platform-hint">Os tipos escolhidos não precisam de registo de pessoa, ou ainda não existem registos compatíveis.</p>}</fieldset><div className="platform-actions"><Button className="platform-primary" disabled={busy} onClick={saveAssociations}>{busy ? "A guardar…" : "Guardar tipo e associações"}</Button><Button variant="outline" disabled={busy} onClick={() => setAssociationTarget(null)}>Cancelar</Button></div></section></Sheet>
      <Sheet open={!!recordManageTarget} onOpenChange={open => { if (!open && !busy) { setRecordManageTarget(null); setRecordDeleteConfirm(false); } }} ariaLabel={recordManageTarget ? `Gerir registo de ${recordManageTarget.name}` : "Gerir registo"} className="platform-dialog platform-context-sheet user-manager-access-sheet"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">Registos · {profileLabels[recordManageTarget?.kind] || "Pessoa"}</p><h2>{recordManageTarget?.name || "Registo"}</h2></div><Button type="button" variant="outline" disabled={busy} onClick={() => { setRecordManageTarget(null); setRecordDeleteConfirm(false); }}>Fechar</Button></div>{recordDependencyLoading ? <p role="status">A verificar relações e dados associados…</p> : <><div className="platform-record-details"><p><strong>Tipo:</strong> {profileLabels[recordManageTarget?.kind] || recordManageTarget?.kind}</p><p><strong>Email:</strong> {recordManageTarget?.email || "Sem email"}</p><p><strong>Estado:</strong> {recordManageTarget?.active ? "Ativo" : "Suspenso"}</p>{recordDependencyChecked && recordDependencyReasons.length > 0 && <><h3>Dados associados</h3><ul>{recordDependencyReasons.map(reason => <li key={reason}>{reason}</li>)}</ul><p className="platform-hint">Este registo não pode ser eliminado. Pode suspendê-lo para preservar o histórico e impedir novas associações.</p></>}{recordDependencyChecked && recordDependencyReasons.length === 0 && <p className="platform-hint">Não foram encontrados dados associados. Este registo pode ser eliminado.</p>}{!recordDependencyChecked && <p className="user-manager-access-warning">Não foi possível confirmar os dados associados. A eliminação fica indisponível; pode editar ou suspender o registo.</p>}</div>{recordDeleteConfirm ? <div className="user-manager-record-delete-confirm" role="alert"><p><strong>Eliminar definitivamente este registo?</strong> Esta ação não pode ser desfeita.</p><div className="platform-actions"><Button variant="destructive" disabled={busy} onClick={deleteProfileRecord}>{busy ? "A eliminar…" : "Confirmar eliminação"}</Button><Button variant="outline" disabled={busy} onClick={() => setRecordDeleteConfirm(false)}>Cancelar</Button></div></div> : <div className="platform-actions"><Button variant="outline" disabled={busy} onClick={() => { const target = recordManageTarget; setRecordManageTarget(null); openProfile(target); }}>Editar dados</Button>{recordManageTarget?.active ? <Button variant="outline" disabled={busy} onClick={() => setRecordActive(recordManageTarget, false)}>Suspender registo</Button> : <Button variant="secondary" disabled={busy} onClick={() => setRecordActive(recordManageTarget, true)}>Reativar registo</Button>}{recordDependencyChecked && recordDependencyReasons.length === 0 && <Button variant="destructive" disabled={busy} onClick={() => setRecordDeleteConfirm(true)}>Eliminar registo</Button>}</div>}</>}</section></Sheet>
      <Dialog open={profileEditorOpen} onOpenChange={open => { setProfileEditorOpen(open); if (!open) setEditingProfile(null); }} ariaLabel={editingProfile ? `Editar registo de ${editingProfile.name}` : "Criar registo de pessoa"} className="platform-dialog user-manager-dialog"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">Gestão de registos · {profileLabels[profileForm.kind] || "Pessoa"}</p><h2>{editingProfile ? "Editar dados do registo" : "Novo registo de pessoa"}</h2></div><Button type="button" variant="outline" disabled={busy} onClick={() => setProfileEditorOpen(false)}>Fechar</Button></div><form onSubmit={saveProfile}><fieldset disabled={busy}>{!editingProfile && <FieldLike label="Tipo de registo"><NativeSelect value={profileForm.kind || "student"} onChange={event => setProfileForm(current => ({...current,kind:event.target.value}))}>{Object.entries(profileLabels).map(([kind,label]) => <option key={kind} value={kind}>{label}</option>)}</NativeSelect></FieldLike>}<FieldLike label="Nome"><Input name="name" required maxLength={100} value={profileForm.name || ""} onChange={event => setProfileForm(current => ({...current, name: event.target.value}))}/></FieldLike><FieldLike label="Email de contacto"><Input name="email" type="email" maxLength={254} value={profileForm.email || ""} onChange={event => setProfileForm(current => ({...current, email: event.target.value}))}/></FieldLike>{profileForm.kind === "student" && <><fieldset className="user-manager-profile-options"><legend>Encarregados associados</legend>{allProfiles.filter(profile => profile.kind === "guardian" && (profile.active || profileForm.guardianIds?.includes(profile.id))).map(profile => <label className="platform-check" key={profile.id}><Checkbox checked={(profileForm.guardianIds || []).includes(profile.id)} onChange={event => setProfileForm(current => ({...current,guardianIds:event.target.checked ? [...new Set([...(current.guardianIds || []),profile.id])] : (current.guardianIds || []).filter(id => id !== profile.id)}))}/>{profile.name}</label>)}{!allProfiles.some(profile => profile.kind === "guardian" && profile.active) && <p className="platform-hint">Crie primeiro um registo de encarregado para o associar ao aluno.</p>}</fieldset><FieldLike label="Ano escolar"><Input maxLength={40} value={profileForm.schoolYear || ""} onChange={event => setProfileForm(current => ({...current, schoolYear: event.target.value}))}/></FieldLike><FieldLike label="Faixa etária"><Input maxLength={40} value={profileForm.ageBand || ""} onChange={event => setProfileForm(current => ({...current, ageBand: event.target.value}))}/></FieldLike></>}{profileForm.kind === "member" && <><FieldLike label="Número de sócio"><Input maxLength={20} value={profileForm.memberNumber || ""} onChange={event => setProfileForm(current => ({...current, memberNumber: event.target.value}))}/></FieldLike><FieldLike label="Estado de sócio"><NativeSelect value={profileForm.membershipStatus || "active"} onChange={event => setProfileForm(current => ({...current, membershipStatus: event.target.value}))}><option value="active">Ativo</option><option value="pending">Pendente</option><option value="suspended">Suspenso</option><option value="left">Ex-sócio</option></NativeSelect></FieldLike></>}{profileForm.kind === "tutor" && <><FieldLike label="Disciplinas"><Input maxLength={300} value={profileForm.subjects || ""} onChange={event => setProfileForm(current => ({...current, subjects: event.target.value}))}/></FieldLike><FieldLike label="Disponibilidade"><Input maxLength={300} value={profileForm.availability || ""} onChange={event => setProfileForm(current => ({...current, availability: event.target.value}))}/></FieldLike></>}<label className="platform-check"><Checkbox checked={profileForm.active === true} onChange={event => setProfileForm(current => ({...current, active: event.target.checked}))}/>Registo ativo</label><div className="platform-actions"><Button className="platform-primary" type="submit">{busy ? "A guardar…" : editingProfile ? "Guardar alterações" : "Criar registo"}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => { setProfileEditorOpen(false); setEditingProfile(null); }}>Cancelar</Button></div></fieldset></form></section></Dialog>
      </>}
    </Card>
  </div>;

  return <div className="user-manager">
    <Card className="user-manager-card">
      <header className="user-manager-heading"><div><p className="platform-eyebrow">Contas, pessoas e sócios</p><h2>Contas e perfis</h2><p>Crie uma conta, atribua um ou mais perfis de acesso e associe os registos de pessoa.</p></div><div className="platform-record-actions"><details className="platform-action-menu" id="user-manager-actions-menu"><summary aria-label="Mais opções de utilizadores" title="Mais opções"><MoreHorizontal size={21}/></summary><div aria-label="Opções de utilizadores"><button type="button" disabled={!studentProfiles.length} onClick={()=>{document.getElementById("user-manager-actions-menu").open=false;exportStudents();}}>Lista de alunos · PDF</button><button type="button" disabled={loading||!allRows.length} onClick={()=>{document.getElementById("user-manager-actions-menu").open=false;printReport({title:"Gestão de utilizadores",subtitle:`${allRows.length} registos · pesquisa e filtros aplicados`,columns:["Pessoa","Email","Perfil e permissões","Estado","Último acesso"],rows:allRows.map(({type,value})=>type==="user"?[value.displayName||"Sem nome",value.email||"Sem email",[...(value.profiles||[]).map(profile=>`${profileLabels[profile.kind]} · ${profile.name}`),...(value.roles||[]).map(role=>roleLabels[role]||role)].join(" · ")||"Sem perfil associado",value.suspended?"Suspenso":value.accessActive?"Ativo":"Sem acesso",date(value.lastSignInAt)]:[value.name,value.email||"Sem conta de acesso",profileLabels[value.kind]||value.kind,value.active?"Sem conta":"Perfil inativo","—"])})}}>Lista filtrada · PDF</button><button type="button" onClick={()=>{document.getElementById("user-manager-actions-menu").open=false;openAccessSettings();}}>Configurar perfis e permissões</button><button type="button" onClick={()=>{document.getElementById("user-manager-actions-menu").open=false;openCreate();}}>Novo utilizador</button></div></details></div></header>
      {error && <p className="platform-error" role="alert">{error}</p>}{message && <p className="platform-success" role="status">{message}</p>}
      <div className="user-manager-toolbar"><Label className="platform-search"><span className="platform-sr">Pesquisar utilizadores e perfis</span><Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar por nome, email ou perfil" /></Label><span className="user-manager-count">{allRows.length} resultados · {matchingUsers.length} contas · {matchingProfiles.length} perfis sem conta</span></div>
      <div className="user-manager-filters" aria-label="Filtros de utilizadores"><span className="user-manager-filter-label"><ListFilter size={16}/>Filtros</span><label><span>Estado</span><NativeSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Todos</option><option value="active">Ativos</option><option value="suspended">Suspensos</option><option value="no-access">Sem acesso</option></NativeSelect></label><label><span>Perfil de acesso</span><NativeSelect value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">Todos</option>{Object.entries(roleLabels).map(([role,label]) => <option key={role} value={role}>{label}</option>)}</NativeSelect></label><label><span>Tipo de perfil de pessoa</span><NativeSelect value={profileFilter} onChange={(event) => setProfileFilter(event.target.value)}><option value="all">Todos</option>{Object.entries(profileLabels).map(([kind,label]) => <option key={kind} value={kind}>{label}</option>)}</NativeSelect></label><Button size="sm" variant="ghost" disabled={statusFilter === "all" && roleFilter === "all" && profileFilter === "all" && !query} onClick={() => { setQuery(""); setStatusFilter("all"); setRoleFilter("all"); setProfileFilter("all"); }}>Limpar</Button></div>
      <div className="user-manager-table-wrap"><Table className="user-manager-table"><TableCaption>Contas Firebase e perfis da associação</TableCaption><TableHeader><TableRow><TableHead>Pessoa</TableHead><TableHead>Perfil e permissões</TableHead><TableHead>Estado</TableHead><TableHead>Último acesso</TableHead><TableHead><span className="platform-sr">Ações</span></TableHead></TableRow></TableHeader>
        <TableBody>
          {loading && <TableRow><TableCell colSpan={5}>A carregar utilizadores…</TableCell></TableRow>}
          {!loading && filteredUsers.map((user) => <TableRow key={user.uid}>
            <TableCell><strong>{user.displayName || "Sem nome"}</strong><small className="user-manager-secondary">{user.email || "Sem email"}</small></TableCell>
            <TableCell><div className="user-manager-badges">{user.profiles.length ? user.profiles.map((profile) => <Badge key={profile.id} variant="secondary">{profileLabels[profile.kind]} · {profile.name}{profile.kind === "member" && profile.memberNumber ? ` · ${profile.memberNumber}` : ""}</Badge>) : <span className="user-manager-secondary">Sem perfil associado</span>}{user.roles.map((role) => <Badge key={role} variant="outline">{roleLabels[role] || role}</Badge>)}</div>{user.accessConfigurationInvalid&&<small className="user-manager-access-warning">Configuração antiga inválida · edite e guarde os perfis</small>}{user.profiles.some((profile) => profile.kind === "member") && <small className="user-manager-secondary">{membershipLabels[user.profiles.find((profile) => profile.kind === "member").membershipStatus] || "Estado associativo por confirmar"}</small>}</TableCell>
            <TableCell><Badge variant={user.suspended ? "destructive" : user.accessActive ? "default" : "outline"}>{user.suspended ? "Suspenso" : user.accessActive ? "Ativo" : "Sem acesso"}</Badge></TableCell>
            <TableCell>{date(user.lastSignInAt)}</TableCell>
            <TableCell><Button size="sm" variant="outline" className="user-manager-details-button" disabled={busy} onClick={() => setDetailUser(user)}><Eye size={15}/>Ver detalhes</Button></TableCell>
          </TableRow>)}
          {!loading && filteredProfiles.map((profile) => <TableRow key={`profile-${profile.id}`}>
            <TableCell><strong>{profile.name}</strong><small className="user-manager-secondary">{profile.email || "Sem conta de acesso"}</small></TableCell>
            <TableCell><div className="user-manager-badges"><Badge variant="secondary">{profileLabels[profile.kind]}</Badge>{profile.kind === "member" && <Badge variant="outline">{membershipLabels[profile.membershipStatus] || "Estado por confirmar"}{profile.memberNumber ? ` · ${profile.memberNumber}` : ""}</Badge>}</div></TableCell>
            <TableCell><Badge variant={profile.active ? "outline" : "destructive"}>{profile.active ? "Sem conta" : "Perfil inativo"}</Badge></TableCell>
            <TableCell>—</TableCell>
            <TableCell><div className="user-manager-actions"><Button size="sm" variant="outline" onClick={() => openCreate(profile)} disabled={!profile.active || busy}>Dar acesso</Button><Button size="sm" variant="outline" className="user-manager-edit-profile" onClick={() => openProfile(profile)}>Editar pessoa</Button></div></TableCell>
          </TableRow>)}
          {!loading && !filteredUsers.length && !filteredProfiles.length && <TableRow><TableCell colSpan={5}>Não foram encontrados utilizadores ou perfis.</TableCell></TableRow>}
        </TableBody>
      </Table></div>
      <nav className="user-manager-pagination" aria-label="Paginação de utilizadores"><span>{allRows.length ? `A mostrar ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, allRows.length)} de ${allRows.length}` : "Sem resultados"}</span><div><Button size="sm" variant="outline" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={16}/>Anterior</Button><span aria-live="polite">Página {page} de {totalPages}</span><Button size="sm" variant="outline" aria-label="Página seguinte" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Seguinte<ChevronRight size={16}/></Button></div></nav>
    </Card>

    <Sheet open={!!detailUser} onOpenChange={(open) => { if (!open) setDetailUser(null); }} ariaLabel={detailUser ? `Detalhes de ${detailUser.displayName || detailUser.email}` : "Detalhes do utilizador"} className="platform-dialog platform-context-sheet user-manager-detail-dialog"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">Ficha de utilizador</p><h2>{detailUser?.displayName || "Sem nome"}</h2></div><Button type="button" variant="outline" onClick={() => setDetailUser(null)}>Fechar</Button></div><div className="user-manager-detail-grid"><div><span>Email de acesso</span><strong>{detailUser?.email || "Sem email"}</strong></div><div><span>Estado da conta</span><Badge variant={detailUser?.suspended ? "destructive" : detailUser?.accessActive ? "default" : "outline"}>{detailUser?.suspended ? "Suspenso" : detailUser?.accessActive ? "Ativo" : "Sem acesso"}</Badge></div><div><span>Último acesso</span><strong>{date(detailUser?.lastSignInAt)}</strong></div><div><span>Conta criada</span><strong>{date(detailUser?.createdAt)}</strong></div><div><span>Email confirmado</span><strong>{detailUser?.emailVerified ? "Sim" : "Não"}</strong></div><div><span>Permissões</span><div className="user-manager-badges">{(detailUser?.roles || []).length ? detailUser.roles.map((role) => <Badge key={role} variant="outline">{roleLabels[role] || role}</Badge>) : <span>Sem permissões</span>}</div></div><div className="user-manager-detail-profiles"><span>Menus disponíveis</span>{detailUser?.accessConfigurationInvalid&&<p className="user-manager-access-warning">A configuração antiga dos menus é inválida. Guarde os perfis de acesso para substituir esta configuração pelos menus herdados.</p>}<div className="user-manager-badges">{(detailUser?.modules || []).map((module) => <Badge key={module} variant="secondary">{moduleLabels[module] || module}</Badge>)}</div></div><div className="user-manager-detail-profiles"><span>Perfis associados</span>{detailUser?.profiles?.length ? <div className="user-manager-detail-profile-list">{detailUser.profiles.map((profile) => <article key={profile.id}><div><strong>{profile.name}</strong><small>{profileLabels[profile.kind] || profile.kind}{profile.kind === "member" ? ` · ${membershipLabels[profile.membershipStatus] || "Estado por confirmar"}${profile.memberNumber ? ` · Sócio ${profile.memberNumber}` : ""}` : ""}</small></div><Button size="sm" variant="outline" onClick={() => { setDetailUser(null); openProfile(allProfiles.find((item) => item.id === profile.id) || profile); }}>Editar perfil</Button></article>)}</div> : <p>Sem perfil associado.</p>}</div></div><div className="platform-actions user-manager-detail-actions"><Button className="platform-primary" onClick={() => { const target = detailUser; setDetailUser(null); openEdit(target); }}>Permissões e menus</Button><Button variant="outline" onClick={() => { const target = detailUser; setDetailUser(null); resetPassword(target); }}>Enviar reset</Button>{detailUser?.uid !== platformAuth().currentUser?.uid && <Button variant="outline" disabled={busy} onClick={() => { setPasswordTarget(detailUser); setDetailUser(null); }}>Gerar palavra-passe temporária</Button>}<Button variant={detailUser?.suspended ? "secondary" : "outline"} onClick={() => { const target = detailUser; setDetailUser(null); setConfirmUser(target); }}>{detailUser?.suspended ? "Reativar utilizador" : "Suspender utilizador"}</Button>{detailUser?.uid !== platformAuth().currentUser?.uid && <Button variant="destructive" onClick={() => { setDetailUser(null); setRemoveUserTarget(detailUser); }}>Remover conta</Button>}</div></section></Sheet>

    <Sheet open={accessSettingsOpen} onOpenChange={open=>{if(!open&&!busy)setAccessSettingsOpen(false);}} ariaLabel="Configurar perfis de acesso e permissões" className="platform-dialog platform-context-sheet user-manager-access-sheet"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">Configuração da associação</p><h2>Perfis e permissões</h2></div><Button type="button" variant="outline" disabled={busy} onClick={()=>setAccessSettingsOpen(false)}>Fechar</Button></div><p>Configure uma vez os menus de cada perfil. Quando atribuir vários perfis a uma pessoa, ela recebe a combinação dos respetivos menus.</p><p className="platform-hint">As regras que limitam os dados e as ações continuam em vigor. O perfil Administrador mantém acesso completo.</p><p className="user-manager-access-warning">Ao guardar, estes perfis passam a definir os menus de todos os utilizadores. As antigas escolhas de menus feitas conta a conta deixam de se aplicar.</p><AccessProfileOptions value={accessProfilesDraft} onChange={updateAccessProfile}/><div className="platform-actions"><Button className="platform-primary" disabled={busy} onClick={saveAccessSettings}>{busy?"A guardar…":"Guardar configuração"}</Button><Button variant="outline" disabled={busy} onClick={()=>setAccessSettingsOpen(false)}>Cancelar</Button></div></section></Sheet>

    <Dialog open={profileEditorOpen} onOpenChange={(open) => { setProfileEditorOpen(open); if (!open) setEditingProfile(null); }} ariaLabel={editingProfile ? `Editar perfil de ${editingProfile.name}` : "Editar perfil"} className="platform-dialog user-manager-dialog"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">{editingProfile ? profileLabels[editingProfile.kind] : "Perfil"}</p><h2>Editar pessoa</h2></div><Button type="button" variant="outline" onClick={() => setProfileEditorOpen(false)}>Fechar</Button></div><form onSubmit={saveProfile}><fieldset disabled={busy}><FieldLike label="Nome"><Input name="name" required maxLength={100} value={profileForm.name || ""} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}/></FieldLike><FieldLike label="Email de contacto"><Input name="email" type="email" maxLength={254} value={profileForm.email || ""} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}/></FieldLike>{editingProfile?.kind === "member" && <><FieldLike label="Número de sócio"><Input value={profileForm.memberNumber || ""} maxLength={200} onChange={(event) => setProfileForm((current) => ({ ...current, memberNumber: event.target.value }))}/></FieldLike><FieldLike label="Situação associativa"><NativeSelect value={profileForm.membershipStatus || "active"} onChange={(event) => setProfileForm((current) => ({ ...current, membershipStatus: event.target.value }))}><option value="pending">Pendente</option><option value="active">Ativo</option><option value="suspended">Suspenso</option><option value="left">Cessou</option></NativeSelect></FieldLike></>}{editingProfile?.kind === "student" && <><FieldLike label="Ano escolar"><Input value={profileForm.schoolYear || ""} maxLength={200} onChange={(event) => setProfileForm((current) => ({ ...current, schoolYear: event.target.value }))}/></FieldLike><FieldLike label="Faixa etária"><Input value={profileForm.ageBand || ""} maxLength={200} onChange={(event) => setProfileForm((current) => ({ ...current, ageBand: event.target.value }))}/></FieldLike></>}{editingProfile?.kind === "tutor" && <><FieldLike label="Disciplinas / competências"><Input value={profileForm.subjects || ""} maxLength={200} onChange={(event) => setProfileForm((current) => ({ ...current, subjects: event.target.value }))}/></FieldLike><FieldLike label="Disponibilidade"><Input value={profileForm.availability || ""} maxLength={1000} onChange={(event) => setProfileForm((current) => ({ ...current, availability: event.target.value }))}/></FieldLike></>}<label className="platform-check"><Checkbox checked={profileForm.active === true} onChange={(event) => setProfileForm((current) => ({ ...current, active: event.target.checked }))}/>Perfil ativo</label><div className="platform-actions"><Button className="platform-primary" type="submit">Guardar perfil</Button><Button type="button" variant="outline" onClick={() => setProfileEditorOpen(false)}>Cancelar</Button></div></fieldset></form></section></Dialog>

    <Dialog open={userDialogOpen} onOpenChange={(open) => { setUserDialogOpen(open); if (!open) setDialogUser(null); }} ariaLabel={dialogUser ? `Permissões de ${dialogUser.displayName || dialogUser.email}` : "Criar utilizador"} className="platform-dialog user-manager-dialog">
      <section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">Gestão central</p><h2>{dialogUser ? "Permissões e perfis" : "Novo utilizador"}</h2></div><Button type="button" variant="outline" onClick={() => { setDialogUser(null); setUserDialogOpen(false); }}>Fechar</Button></div>
        <form onSubmit={submit}><fieldset disabled={busy}>
          {!dialogUser && <><FieldLike label="Nome"><Input name="displayName" required maxLength={100} defaultValue={form.displayName} /></FieldLike><FieldLike label="Email"><Input name="email" required type="email" maxLength={254} defaultValue={form.email} /></FieldLike><fieldset className="user-manager-profile-options"><legend>Acesso inicial</legend><label className="platform-check"><input type="radio" name="initial-access" checked={!temporaryPassword} onChange={() => setTemporaryPassword(false)} />Enviar convite para definir palavra-passe</label><label className="platform-check"><input type="radio" name="initial-access" checked={temporaryPassword} onChange={() => setTemporaryPassword(true)} />Gerar palavra-passe temporária</label><p className="platform-hint">A palavra-passe temporária é mostrada apenas uma vez. Entregue-a por um canal seguro e peça ao utilizador para a alterar ao entrar.</p></fieldset></>}
          <RoleOptions value={form.roles} onChange={changeAssignedRoles} />
          <fieldset className="user-manager-profile-options"><legend>Registos da pessoa associados</legend><p className="platform-hint">Associe os registos de aluno, encarregado, explicador ou sócio que correspondem aos perfis de acesso. Voluntário, Coordenação e Administrador não precisam de um registo adicional.</p>{(dialogUser ? assignableProfiles.filter((profile) => !profile.accountUid || profile.accountUid === dialogUser.uid || form.profileIds.includes(profile.id)) : assignableProfiles.filter((profile) => !profile.accountUid || profile.id === form.profileIds[0])).map((profile) => <label className="platform-check" key={profile.id}><Checkbox checked={form.profileIds.includes(profile.id)} onChange={(event) => toggleProfile(profile.id, event.target.checked)} />{profileLabels[profile.kind]} · {profile.name}</label>)}{!assignableProfiles.length && <p className="platform-hint">Os perfis escolhidos não exigem um registo de pessoa ou ainda não existem registos compatíveis.</p>}</fieldset>
          <AccessPreview roles={form.roles} accessProfiles={accessProfiles} />
          {!dialogUser && <><label className="platform-check user-manager-create-profile"><Checkbox checked={form.createProfile} onChange={(event)=>toggleCreateProfile(event.target.checked)} />Criar também um perfil de pessoa</label>{form.createProfile && <><FieldLike label="Tipo de perfil de pessoa"><NativeSelect value={form.profileKind} onChange={(event) => setForm((current) => ({...current,profileKind:event.target.value,roles:current.roles.includes(event.target.value)?current.roles:current.roles.filter(role=>!Object.hasOwn(profileLabels,role)).concat(event.target.value)}))}>{Object.entries(profileLabels).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}</NativeSelect></FieldLike><p className="platform-hint">Para associar mais do que um tipo de pessoa, crie primeiro os outros registos na gestão de pessoas.</p></>}</>}
          {dialogUser && <label className="platform-check"><Checkbox checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />Acesso à área ativo</label>}
          <p className="platform-hint">As permissões são aplicadas ao criar a conta. O convite gera uma ligação segura para definir a palavra-passe; a palavra-passe temporária só é apresentada uma vez.</p>
          <div className="platform-actions"><Button type="submit" className="platform-primary">{busy ? "A guardar…" : dialogUser ? "Guardar permissões" : "Criar utilizador"}</Button><Button type="button" variant="outline" onClick={() => { setDialogUser(null); setUserDialogOpen(false); }}>Cancelar</Button></div>
        </fieldset></form>
      </section>
    </Dialog>

    <Dialog open={!!removeUserTarget} onOpenChange={(open) => { if (!open) setRemoveUserTarget(null); }} ariaLabel="Confirmar remoção da conta" className="platform-dialog user-manager-confirm"><section className="platform-card platform-editor"><p className="platform-eyebrow">Remoção de acesso</p><h2>Remover esta conta?</h2><p>A conta de <strong>{removeUserTarget?.displayName || removeUserTarget?.email}</strong> será apagada e deixará de poder iniciar sessão. Os perfis de pessoa e os registos existentes serão preservados, sem associação à conta. Esta ação não pode ser desfeita.</p><div className="platform-actions"><Button variant="destructive" disabled={busy} onClick={removeUser}>{busy ? "A remover…" : "Remover conta"}</Button><Button variant="outline" disabled={busy} onClick={() => setRemoveUserTarget(null)}>Cancelar</Button></div></section></Dialog>
    <Dialog open={!!passwordTarget} onOpenChange={(open) => { if (!open && !busy) setPasswordTarget(null); }} ariaLabel="Confirmar nova palavra-passe" className="platform-dialog user-manager-confirm"><section className="platform-card platform-editor"><p className="platform-eyebrow">Segurança da conta</p><h2>Gerar uma nova palavra-passe?</h2><p>A palavra-passe atual de <strong>{passwordTarget?.displayName || passwordTarget?.email}</strong> será substituída e as sessões existentes serão terminadas. A nova palavra-passe será apresentada uma única vez para copiar.</p><div className="platform-actions"><Button className="platform-primary" disabled={busy} onClick={() => generateTemporaryPassword(passwordTarget)}>{busy ? "A gerar…" : "Gerar e substituir"}</Button><Button variant="outline" disabled={busy} onClick={() => setPasswordTarget(null)}>Cancelar</Button></div></section></Dialog>
    <Dialog open={!!confirmUser} onOpenChange={(open) => { if (!open) setConfirmUser(null); }} ariaLabel="Confirmar alteração do acesso" className="platform-dialog user-manager-confirm"><section className="platform-card platform-editor"><p className="platform-eyebrow">Confirmação</p><h2>{confirmUser?.suspended ? "Reativar acesso?" : "Suspender acesso?"}</h2><p>{confirmUser?.suspended ? `${confirmUser.displayName || confirmUser.email} poderá voltar a iniciar sessão.` : `${confirmUser?.displayName || confirmUser?.email} deixará de poder iniciar sessão e as sessões atuais serão terminadas.`}</p><div className="platform-actions"><Button className="platform-primary" disabled={busy} onClick={changeSuspension}>{busy ? "A processar…" : confirmUser?.suspended ? "Reativar utilizador" : "Suspender utilizador"}</Button><Button variant="outline" disabled={busy} onClick={() => setConfirmUser(null)}>Cancelar</Button></div></section></Dialog>
    <Dialog open={!!invite} onOpenChange={(open) => { if (!open) setInvite(null); }} ariaLabel="Ligação de acesso ao utilizador" className="platform-dialog user-manager-confirm"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">Acesso seguro</p><h2>{invite?.title || "Ligação de acesso"}</h2></div><Button type="button" variant="outline" onClick={() => setInvite(null)}>Fechar</Button></div><p>Envie esta ligação a <strong>{invite?.email}</strong> para definir ou alterar a palavra-passe e entrar na área.</p><FieldLike label="Ligação segura"><Input readOnly value={invite?.link || ""} onFocus={(event) => event.target.select()} /></FieldLike><div className="platform-actions"><Button className="platform-primary" onClick={async () => { try { await navigator.clipboard.writeText(invite?.link || ""); setMessage("Ligação copiada."); } catch { setMessage("Selecione a ligação e copie-a manualmente."); } }}>Copiar ligação</Button><Button variant="outline" onClick={() => setInvite(null)}>Concluir</Button></div></section></Dialog>
    <Dialog open={!!createdCredentials} onOpenChange={(open) => { if (!open) setCreatedCredentials(null); }} ariaLabel="Palavra-passe temporária" className="platform-dialog user-manager-confirm"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">{createdCredentials?.generated ? "Palavra-passe atualizada" : "Acesso inicial"}</p><h2>Palavra-passe temporária</h2></div><Button type="button" variant="outline" onClick={() => setCreatedCredentials(null)}>Fechar</Button></div><p>Partilhe por um canal seguro com <strong>{createdCredentials?.email}</strong>. Esta palavra-passe é mostrada apenas uma vez.</p><FieldLike label="Palavra-passe temporária"><Input ref={passwordInput} readOnly value={createdCredentials?.password || ""} onFocus={(event) => event.target.select()} /></FieldLike>{createdCredentials?.copied && <p className="platform-success" role="status" aria-live="polite">Palavra-passe copiada.</p>}<p className="platform-hint">{createdCredentials?.generated && !createdCredentials?.sessionsRevoked ? "A palavra-passe anterior foi substituída, mas não foi possível confirmar o encerramento de todas as sessões. Contacte o utilizador e peça-lhe que termine sessão nos dispositivos onde ainda esteja ligado." : "Peça ao utilizador para definir uma palavra-passe própria após entrar."}</p><div className="platform-actions"><Button className="platform-primary" onClick={async () => { try { await navigator.clipboard.writeText(createdCredentials?.password || ""); setCreatedCredentials(current => ({ ...current, copied: true })); setMessage("Palavra-passe copiada."); } catch { passwordInput.current?.focus(); passwordInput.current?.select(); setMessage("Palavra-passe selecionada para copiar manualmente."); } }}>Copiar palavra-passe</Button><Button variant="outline" onClick={() => setCreatedCredentials(null)}>Concluir</Button></div></section></Dialog>
  </div>;
}

function FieldLike({ label, children }) {
  return <Label className="platform-field"><span>{label}</span>{children}</Label>;
}
